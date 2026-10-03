import { describe, expect, it } from "vitest";
import { IdGenerator } from "../../src/utils/IdGenerator.js";

describe("IdGenerator", () => {
  it("generates sequential ids per prefix", () => {
    const generator = new IdGenerator();
    expect(generator.next("G")).toBe("G-1");
    expect(generator.next("G")).toBe("G-2");
    expect(generator.next("C")).toBe("C-1");
  });

  it("supports a custom starting value", () => {
    const generator = new IdGenerator();
    expect(generator.next("O", 1001)).toBe("O-1001");
    expect(generator.next("O", 1001)).toBe("O-1002");
  });
});
