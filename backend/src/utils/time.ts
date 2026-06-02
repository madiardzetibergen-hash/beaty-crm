export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function getDayRange(dateString: string): {
  startOfDay: Date;
  endOfDay: Date;
} {
  const startOfDay = new Date(`${dateString}T00:00:00`);
  const endOfDay = new Date(`${dateString}T23:59:59`);

  return {
    startOfDay,
    endOfDay,
  };
}

export function getPhoneLast4(phone?: string): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");

  if (digits.length < 4) return null;

  return digits.slice(-4);
}