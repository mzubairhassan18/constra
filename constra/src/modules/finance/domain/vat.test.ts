import { describe, expect, it } from "vitest";
import {
  invoiceBalance,
  isReverseCharge,
  netVatPayable,
  summarizeBill,
  calcLineGross,
  calcLineNet,
  calcLineVat,
  type BillLineInput,
} from "./vat";

const std = (qty: number, unitPrice: number, extra?: Partial<BillLineInput>): BillLineInput => ({
  qty,
  unitPrice,
  taxCode: "standard",
  ...extra,
});

describe("bill line VAT math (UAE 5% standard)", () => {
  it("charges 5% on net (qty x rate)", () => {
    expect(calcLineNet(std(2, 100))).toBe(200);
    expect(calcLineVat(std(2, 100))).toBe(10);
    expect(calcLineGross(std(2, 100))).toBe(210);
  });

  it("applies discount before VAT", () => {
    const line = std(1, 1000, { discount: 100 });
    expect(calcLineNet(line)).toBe(900);
    expect(calcLineVat(line)).toBe(45);
  });

  it("rounds VAT half-up to 2dp (fils)", () => {
    // 99.99 * 5% = 4.9995 -> 5.00
    expect(calcLineVat(std(1, 99.99))).toBe(5);
  });

  it("exempt and zero-rated lines carry 0 VAT", () => {
    expect(calcLineVat({ qty: 1, unitPrice: 500, taxCode: "exempt" })).toBe(0);
    expect(calcLineVat({ qty: 4, unitPrice: 250, taxCode: "zero" })).toBe(0);
    expect(calcLineGross({ qty: 4, unitPrice: 250, taxCode: "zero" })).toBe(1000);
  });

  it("reverse charge carries 0 VAT and raises the flag", () => {
    const line: BillLineInput = { qty: 1, unitPrice: 2000, taxCode: "reverse" };
    expect(calcLineVat(line)).toBe(0);
    expect(isReverseCharge(line)).toBe(true);
    expect(isReverseCharge(std(1, 2000))).toBe(false);
  });
});

describe("vat_in vs vat_out separation", () => {
  it("supplier bill VAT lands in vatIn only", () => {
    const s = summarizeBill([std(2, 100)], "in");
    expect(s).toEqual({ net: 200, vatIn: 10, vatOut: 0, gross: 210 });
  });

  it("client invoice VAT lands in vatOut only", () => {
    const s = summarizeBill([std(2, 100)], "out");
    expect(s).toEqual({ net: 200, vatIn: 0, vatOut: 10, gross: 210 });
  });

  it("net VAT payable = out - in per period", () => {
    expect(netVatPayable(10, 4)).toBe(6);
    expect(netVatPayable(0, 10)).toBe(-10); // refundable position
  });
});

describe("invoice balance", () => {
  it("balance = invoiced - receipts", () => {
    expect(invoiceBalance(1050, [500, 300])).toBe(250);
  });

  it("unpaid invoice balances in full; overpayment goes negative", () => {
    expect(invoiceBalance(1050, [])).toBe(1050);
    expect(invoiceBalance(100, [150])).toBe(-50);
  });
});
