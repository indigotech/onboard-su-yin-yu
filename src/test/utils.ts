export function getDateFromISO(date: Date): string {
  return date.toISOString().split('T')[0];
}
