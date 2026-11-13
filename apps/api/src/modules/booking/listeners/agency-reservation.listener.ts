import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { ReservationService } from '../services/reservation.service';

export type AgencyReservationUpdatePayload = {
  reservationId: string;
  agencyId: string;
  status?: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'SUSPENDED';
  seatNumbers?: string;
};

/**
 * Partner tetikler → booking yazar (Faz 3/5).
 * Cross-module ReservationService import yok.
 */
@Injectable()
export class AgencyReservationListener {
  private readonly logger = new Logger(AgencyReservationListener.name);

  constructor(private readonly reservationService: ReservationService) {}

  @OnEvent('agency.reservation.update', { async: true })
  async onAgencyReservationUpdate(
    payload: AgencyReservationUpdatePayload,
  ): Promise<void> {
    this.logger.log(
      `agency.reservation.update ${payload.reservationId} agency=${payload.agencyId}`,
    );

    if (payload.seatNumbers != null) {
      await this.reservationService.agencyUpdateSeatNumbers(
        payload.reservationId,
        payload.agencyId,
        payload.seatNumbers,
      );
    }

    if (payload.status) {
      await this.reservationService.agencyUpdateStatus(
        payload.reservationId,
        payload.agencyId,
        payload.status,
      );
    }
  }
}
