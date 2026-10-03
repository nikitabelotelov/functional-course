import { describe, expect, it } from "vitest";
import { ActivityLog } from "../../src/utils/ActivityLog.js";

describe("ActivityLog", () => {
  it("records messages with a timestamp", () => {
    const log = new ActivityLog();
    log.record("Order O-1001 created");
    log.record("Restocked Azul +5");
    const entries = log.getEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0]?.message).toBe("Order O-1001 created");
    expect(entries[0]?.at).toBeInstanceOf(Date);
  });
});
