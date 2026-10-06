// Pure VAT math (UAE). No framework imports.
export type TaxCode = "standard" | "zero" | "exempt" | "reverse";

export interface BillLineInput {
  qty: number;
  unitPrice: number;
  discount?: number;
  taxCode: TaxCode;
}

export const STANDARD_VAT_RATE = 0.05;

const round2 = (n: number): number => Math.round(n * 100) / 100;

export function calcLineNet(line: BillLineInput): number {
  return round2(line.qty * line.unitPrice - (line.discount ?? 0));
}

export function calcLineVat(line: BillLineInput): number {
  if (line.taxCode !== "standard") return 0;
  return round2(calcLineNet(line) * STANDARD_VAT_RATE);
}

export function calcLineGross(line: BillLineInput): number {
  return round2(calcLineNet(line) + calcLineVat(line));
}

export function isReverseCharge(line: BillLineInput): boolean {
  return line.taxCode === "reverse";
}

export interface BillSummary {
  net: number;
  vatIn: number;
  vatOut: number;
  gross: number;
}

/** direction "in" = supplier bill (VAT recoverable), "out" = client invoice (VAT payable). */
export function summarizeBill(
  lines: BillLineInput[],
  direction: "in" | "out",
): BillSummary {
  const net = round2(lines.reduce((n, l) => n + calcLineNet(l), 0));
  const vat = round2(lines.reduce((n, l) => n + calcLineVat(l), 0));
  return {
    net,
    vatIn: direction === "in" ? vat : 0,
    vatOut: direction === "out" ? vat : 0,
    gross: round2(net + vat),
  };
}

export function netVatPayable(vatOut: number, vatIn: number): number {
  return round2(vatOut - vatIn);
}

export function invoiceBalance(invoiced: number, receipts: number[]): number {
  return round2(invoiced - receipts.reduce((n, r) => n + r, 0));
}
