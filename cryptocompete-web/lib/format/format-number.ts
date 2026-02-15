export function getLocaleSeparators(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234567.89);
  const group = parts.find((p) => p.type === "group")?.value ?? ",";
  const decimal = parts.find((p) => p.type === "decimal")?.value ?? ".";
  return { group, decimal };
}

export function sanitizeInput(value: string, groupSep: string, decimalSep: string): string | null {
  const groupRegex = new RegExp(`\\${groupSep}`, "g");
  const cleanValue = value.replace(groupRegex, "");
  if (cleanValue.length > 14) return null;
  const allowedRegex = new RegExp(`^[0-9\\${decimalSep}]*$`);
  if (!allowedRegex.test(cleanValue)) return null;
  const decimalRegex = new RegExp(`\\${decimalSep}`, "g");
  if ((cleanValue.match(decimalRegex) || []).length > 1) return null;
  return cleanValue.replace(decimalSep, ".");
}

export function formatInputNumber(value: string, groupSep: string, decimalSep: string): string {
  if (!value || value === ".") return value.replace(".", decimalSep);

  const parts = value.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSep);

  if (parts.length === 2) {
    return `${formattedInteger}${decimalSep}${decimalPart}`;
  }
  return formattedInteger;
}

export function getPriceDecimals(price: number): number {
  if (price >= 10) return 2;
  if (price >= 0.01) return 6;
  return 8;
}