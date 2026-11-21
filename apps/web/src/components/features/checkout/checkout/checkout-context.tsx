'use client';

import {
  createContext,
  useContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { TourPaidExtra, TourPickupPoint } from '@/services/catalog';
import type { CardBrand, GuestForm, PaymentMethod } from './checkout.helpers';

export type CheckoutParty = {
  adults: number;
  children: number;
};

export type CheckoutUiContextValue = {
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  isGuest: boolean;
  isTour: boolean;
  title: string;
  image: string | null;
  startDate: string | Date | null | undefined;
  endDate: string | Date | null | undefined;
  party: CheckoutParty;
  unitPrice: number;
  extrasTotal: number;
  totalPrice: number;
  guests: GuestForm[];
  updateGuest: (index: number, patch: Partial<GuestForm>) => void;
  paidExtras: TourPaidExtra[];
  selectedExtraIds: string[];
  togglePaidExtra: (extraId: string) => void;
  pickupPoints: TourPickupPoint[];
  pickupPointId: string;
  setPickupPointId: Dispatch<SetStateAction<string>>;
  wantCompanyInvoice: boolean;
  setWantCompanyInvoice: Dispatch<SetStateAction<boolean>>;
  billingFullName: string;
  setBillingFullName: Dispatch<SetStateAction<string>>;
  billingLine1: string;
  setBillingLine1: Dispatch<SetStateAction<string>>;
  billingCity: string;
  setBillingCity: Dispatch<SetStateAction<string>>;
  billingCountry: string;
  setBillingCountry: Dispatch<SetStateAction<string>>;
  taxId: string;
  setTaxId: Dispatch<SetStateAction<string>>;
  companyName: string;
  setCompanyName: Dispatch<SetStateAction<string>>;
  specialRequests: string;
  setSpecialRequests: Dispatch<SetStateAction<string>>;
  handleStep2Next: () => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: Dispatch<SetStateAction<PaymentMethod>>;
  bankTransferAck: boolean;
  setBankTransferAck: Dispatch<SetStateAction<boolean>>;
  cardName: string;
  setCardName: Dispatch<SetStateAction<string>>;
  cardNumber: string;
  setCardNumber: Dispatch<SetStateAction<string>>;
  cardExpiry: string;
  setCardExpiry: Dispatch<SetStateAction<string>>;
  cardCvc: string;
  setCardCvc: Dispatch<SetStateAction<string>>;
  cardBrand: CardBrand;
  cardBrandLabel: string;
  expectedCvcLength: number;
  primaryEmail: string;
  emailOtpVerified: boolean;
  setEmailOtpVerified: Dispatch<SetStateAction<boolean>>;
  canProceedPayment: boolean;
  submitting: boolean;
  handleSubmit: () => void | Promise<void>;
  holdExpiresAt: string | null;
};

const CheckoutUiContext = createContext<CheckoutUiContextValue | null>(null);

export function CheckoutUiProvider({
  value,
  children,
}: {
  value: CheckoutUiContextValue;
  children: ReactNode;
}) {
  return (
    <CheckoutUiContext.Provider value={value}>
      {children}
    </CheckoutUiContext.Provider>
  );
}

export function useCheckoutUi(): CheckoutUiContextValue {
  const ctx = useContext(CheckoutUiContext);
  if (!ctx) {
    throw new Error('useCheckoutUi must be used within CheckoutUiProvider');
  }
  return ctx;
}
