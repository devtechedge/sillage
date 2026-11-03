export const LOT_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function monthParts(now: Date, timeZone: string): { year: string; month: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "2-digit",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value ?? "00";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  return { year, month };
}

/**
 * SV-YYMM-XXXX, using an alphabet without I, O, 0 or 1 so a lot code can be
 * read from a label and typed without ambiguity.
 */
export function lotCode(
  now: Date,
  randomInt: (max: number) => number,
  timeZone = "Asia/Kolkata"
): string {
  const { year, month } = monthParts(now, timeZone);
  let suffix = "";
  for (let index = 0; index < 4; index += 1) {
    suffix += LOT_ALPHABET[randomInt(LOT_ALPHABET.length)];
  }
  return `SV-${year}${month}-${suffix}`;
}

export function isLotCode(value: string): boolean {
  return /^SV-\d{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/.test(value);
}
