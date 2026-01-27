/**
 * Utility functions for hour meter readings
 * Converts between decimal hours and hours:minutes format
 */

export interface HoursMinutes {
  hours: number;
  minutes: number;
}

/**
 * Convert decimal hours to hours and minutes
 * e.g., 1258.5 -> { hours: 1258, minutes: 30 }
 */
export function decimalToHoursMinutes(decimal: number): HoursMinutes {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return { hours, minutes };
}

/**
 * Convert hours and minutes to decimal
 * e.g., { hours: 1258, minutes: 30 } -> 1258.5
 */
export function hoursMinutesToDecimal(hours: number, minutes: number): number {
  return hours + (minutes / 60);
}

/**
 * Format decimal hours as HH:MM string
 * e.g., 1258.5 -> "1258:30"
 */
export function formatDecimalAsHoursMinutes(decimal: number): string {
  const { hours, minutes } = decimalToHoursMinutes(decimal);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Parse HH:MM string to decimal
 * e.g., "1258:30" -> 1258.5
 */
export function parseHoursMinutesToDecimal(value: string): number | null {
  const parts = value.split(':');
  if (parts.length !== 2) return null;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) return null;
  if (minutes < 0 || minutes >= 60) return null;
  
  return hoursMinutesToDecimal(hours, minutes);
}
