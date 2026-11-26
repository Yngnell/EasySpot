export enum SpaceType {
  Regular = 'regular',
  Compact = 'compact',
  Pwd = 'pwd',
  Motorcycle = 'motorcycle',
  Ev = 'ev',
}

/** Live status of a space, shown to drivers in real time. */
export enum SpaceStatus {
  Available = 'available',
  Reserved = 'reserved',
  Occupied = 'occupied',
  Maintenance = 'maintenance',
}
