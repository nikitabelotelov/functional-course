import { describe, expect, it } from "vitest";
import { formatMoney, percentOf } from "../../src/utils/money.js";

describe("formatMoney", () => {
  it("formats a plain amount with thousands separator", () => {
    expect(formatMoney(3_990_00)).toBe("3 990.00 ₽");
  });

  it("formats amounts under 1000 without a separator", () => {
    expect(formatMoney(500_00)).toBe("500.00 ₽");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("0.00 ₽");
  });

  it("formats large amounts with multiple separators", () => {
    expect(formatMoney(1_234_567_89)).toBe("1 234 567.89 ₽");
  });
});

describe("percentOf", () => {
  it("computes a simple percentage", () => {
    expect(percentOf(1000_00, 10)).toBe(100_00);
  });

  it("rounds to the nearest kopeck", () => {
    // 333 * 0.1 = 33.3 -> rounds to 33
    expect(percentOf(333, 10)).toBe(33);
  });
});
