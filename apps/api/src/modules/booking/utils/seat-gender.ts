import type {
  BusLayoutJson,
  LayoutCell,
} from '../../../shared/utils/bus-seat-layout';

export enum SeatGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN',
}

export enum SeatUiStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  RESERVED = 'RESERVED',
  LOCKED = 'LOCKED',
  CREW = 'CREW',
  AISLE = 'AISLE',
  DOOR = 'DOOR',
  BLOCKED = 'BLOCKED',
}

/**
 * TR TCKN son hanesi: tek = erkek, çift = kadın.
 * Geçersiz / LEGACY kimlik → UNKNOWN (kural atlanır).
 */
export function inferGenderFromIdentity(
  identityNumber: string | null | undefined,
): SeatGender {
  if (!identityNumber) return SeatGender.UNKNOWN;
  const digits = identityNumber.replace(/\D/g, '');
  if (digits.length < 11) return SeatGender.UNKNOWN;
  const last = Number(digits[digits.length - 1]);
  if (Number.isNaN(last)) return SeatGender.UNKNOWN;
  return last % 2 === 1 ? SeatGender.MALE : SeatGender.FEMALE;
}

/** Yan yana oturan satılabilir koltuklar (koridor ayrımı: |col| farkı 1 ve ikisi SEAT). */
export function adjacentSellableCodes(
  layout: BusLayoutJson,
  seatCode: string,
): string[] {
  const target = layout.cells.find(
    (cell) => cell.code === seatCode && cell.type === 'SEAT' && cell.sellable,
  );
  if (!target) return [];

  return layout.cells
    .filter(
      (cell) =>
        cell.type === 'SEAT' &&
        cell.sellable &&
        cell.code !== seatCode &&
        cell.row === target.row &&
        Math.abs(cell.col - target.col) === 1,
    )
    .map((cell) => cell.code);
}

export function gendersConflict(a: SeatGender, b: SeatGender): boolean {
  if (a === SeatGender.UNKNOWN || b === SeatGender.UNKNOWN) return false;
  return a !== b;
}

export function cellUiStatus(
  cell: LayoutCell,
  occupied: boolean,
): SeatUiStatus {
  if (cell.type === 'AISLE') return SeatUiStatus.AISLE;
  if (cell.type === 'CREW') return SeatUiStatus.CREW;
  if (cell.type === 'DOOR') return SeatUiStatus.DOOR;
  if (cell.type === 'WC' || cell.type === 'BLOCKED' || !cell.sellable) {
    return SeatUiStatus.BLOCKED;
  }
  return occupied ? SeatUiStatus.SOLD : SeatUiStatus.AVAILABLE;
}
