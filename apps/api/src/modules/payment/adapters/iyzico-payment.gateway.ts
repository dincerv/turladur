import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// CommonJS SDK — no official TS types
// eslint-disable-next-line @typescript-eslint/no-require-imports
const IyzipaySdk = require('iyzipay');

import {
  CompleteThreeDsInput,
  CompleteThreeDsResult,
  InitializePaymentInput,
  InitializePaymentResult,
  PaymentGateway,
  RefundPaymentInput,
  RefundPaymentResult,
} from './payment-gateway.interface';

type IyzipayClient = {
  threedsInitialize: {
    create: (
      request: Record<string, unknown>,
      cb: (err: Error | null, result: IyzipayResult) => void,
    ) => void;
  };
  threedsPayment: {
    create: (
      request: Record<string, unknown>,
      cb: (err: Error | null, result: IyzipayResult) => void,
    ) => void;
  };
  refund: {
    create: (
      request: Record<string, unknown>,
      cb: (err: Error | null, result: IyzipayResult) => void,
    ) => void;
  };
};

type IyzipayResult = {
  status?: string;
  errorMessage?: string;
  errorCode?: string;
  paymentId?: string;
  conversationId?: string;
  threeDSHtmlContent?: string;
  [key: string]: unknown;
};

/**
 * Real İyzico 3DS adapter.
 * Keys empty → factory selects MockPaymentGateway (no company / vergi yet).
 * After company + merchant account: set IYZICO_* env and restart.
 */
@Injectable()
export class IyzicoPaymentGateway extends PaymentGateway {
  readonly providerName = 'IYZICO' as const;
  private readonly logger = new Logger(IyzicoPaymentGateway.name);
  /** Null when keys empty — Nest still constructs this provider; factory selects Mock. */
  private readonly client: IyzipayClient | null;
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    super();
    const apiKey = config.get<string>('IYZICO_API_KEY', '').trim();
    const secretKey = config.get<string>('IYZICO_SECRET_KEY', '').trim();
    this.baseUrl = config.get<string>(
      'IYZICO_BASE_URL',
      'https://sandbox-api.iyzipay.com',
    );
    // iyzipay SDK throws if apiKey is empty — only construct when configured
    this.client =
      apiKey && secretKey
        ? new IyzipaySdk({
            apiKey,
            secretKey,
            uri: this.baseUrl,
          })
        : null;
  }

  private requireClient(): IyzipayClient {
    if (!this.client) {
      throw new Error(
        'İyzico yapılandırılmamış (IYZICO_API_KEY / IYZICO_SECRET_KEY)',
      );
    }
    return this.client;
  }

  async initialize(
    input: InitializePaymentInput,
  ): Promise<InitializePaymentResult> {
    const price = normalizeAmount(input.amount);
    const year =
      input.expireYear.length === 4
        ? input.expireYear.slice(-2)
        : input.expireYear;

    const request = {
      locale: IyzipaySdk.LOCALE.TR,
      conversationId: input.conversationId,
      price,
      paidPrice: price,
      currency: IyzipaySdk.CURRENCY.TRY,
      installment: '1',
      basketId: input.conversationId,
      paymentChannel: IyzipaySdk.PAYMENT_CHANNEL.WEB,
      paymentGroup: IyzipaySdk.PAYMENT_GROUP.PRODUCT,
      callbackUrl: input.callbackUrl,
      paymentCard: {
        cardHolderName: input.cardHolderName,
        cardNumber: input.cardNumber.replace(/\s/g, ''),
        expireMonth: input.expireMonth.padStart(2, '0'),
        expireYear: year,
        cvc: input.cvc,
        registerCard: '0',
      },
      buyer: {
        id: input.buyer.id,
        name: input.buyer.name,
        surname: input.buyer.surname,
        gsmNumber: input.buyer.phone ?? '+905350000000',
        email: input.buyer.email,
        identityNumber: input.buyer.identityNumber ?? '11111111111',
        registrationAddress: input.buyer.registrationAddress ?? 'Türkiye',
        ip: input.buyer.ip ?? '127.0.0.1',
        city: input.buyer.city ?? 'Istanbul',
        country: input.buyer.country ?? 'Turkey',
      },
      shippingAddress: {
        contactName: `${input.buyer.name} ${input.buyer.surname}`,
        city: input.buyer.city ?? 'Istanbul',
        country: input.buyer.country ?? 'Turkey',
        address: input.buyer.registrationAddress ?? 'Türkiye',
      },
      billingAddress: {
        contactName: `${input.buyer.name} ${input.buyer.surname}`,
        city: input.buyer.city ?? 'Istanbul',
        country: input.buyer.country ?? 'Turkey',
        address: input.buyer.registrationAddress ?? 'Türkiye',
      },
      basketItems: [
        {
          id: input.conversationId,
          name: 'Tur / Aktivite rezervasyonu',
          category1: 'Travel',
          itemType: IyzipaySdk.BASKET_ITEM_TYPE.VIRTUAL,
          price,
        },
      ],
    };

    try {
      const result = await promisifyIyzipay((cb) =>
        this.requireClient().threedsInitialize.create(request, cb),
      );

      if (result.status !== 'success' || !result.threeDSHtmlContent) {
        this.logger.warn(
          `İyzico threedsInitialize failed: ${result.errorMessage ?? result.errorCode}`,
        );
        return {
          success: false,
          status: 'FAILED',
          errorMessage: result.errorMessage ?? 'İyzico 3DS başlatılamadı',
          raw: result,
        };
      }

      return {
        success: true,
        status: 'AWAITING_3DS',
        providerPaymentId: result.paymentId,
        threeDSHtmlContent: result.threeDSHtmlContent,
        raw: result,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'İyzico bağlantı hatası';
      this.logger.error(message);
      return {
        success: false,
        status: 'FAILED',
        errorMessage: message,
      };
    }
  }

  async completeThreeDs(
    input: CompleteThreeDsInput,
  ): Promise<CompleteThreeDsResult> {
    const request = {
      locale: IyzipaySdk.LOCALE.TR,
      conversationId: input.conversationId,
      paymentId: input.paymentId,
      conversationData: input.conversationData,
    };

    try {
      const result = await promisifyIyzipay((cb) =>
        this.requireClient().threedsPayment.create(request, cb),
      );

      if (result.status !== 'success') {
        return {
          success: false,
          status: 'FAILED',
          errorMessage: result.errorMessage ?? '3DS doğrulama başarısız',
          raw: result,
        };
      }

      return {
        success: true,
        status: 'SUCCESS',
        providerPaymentId: result.paymentId ?? input.paymentId,
        raw: result,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'İyzico 3DS tamamlanamadı';
      return {
        success: false,
        status: 'FAILED',
        errorMessage: message,
      };
    }
  }

  async refund(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    const request = {
      locale: IyzipaySdk.LOCALE.TR,
      conversationId: input.conversationId,
      paymentTransactionId: input.providerPaymentId,
      price: normalizeAmount(input.amount),
      currency: IyzipaySdk.CURRENCY.TRY,
    };

    try {
      const result = await promisifyIyzipay((cb) =>
        this.requireClient().refund.create(request, cb),
      );
      if (result.status !== 'success') {
        return {
          success: false,
          errorMessage: result.errorMessage ?? 'İade başarısız',
          raw: result,
        };
      }
      return { success: true, raw: result };
    } catch (err) {
      return {
        success: false,
        errorMessage: err instanceof Error ? err.message : 'İyzico iade hatası',
      };
    }
  }
}

function normalizeAmount(amount: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  return n.toFixed(2);
}

function promisifyIyzipay(
  run: (cb: (err: Error | null, result: IyzipayResult) => void) => void,
): Promise<IyzipayResult> {
  return new Promise((resolve, reject) => {
    run((err, result) => {
      if (err) reject(err);
      else resolve(result ?? {});
    });
  });
}
