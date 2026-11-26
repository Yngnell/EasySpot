/**
 * Life cycle of a reservation:
 *   active -> checked_in -> completed
 *   active -> cancelled
 */
export enum ReservationStatus {
  Active = 'active',
  CheckedIn = 'checked_in',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

/** Reservations that still hold the parking space. */
export const OPEN_STATUSES = [
  ReservationStatus.Active,
  ReservationStatus.CheckedIn,
];
