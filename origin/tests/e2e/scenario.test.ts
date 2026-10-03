import { beforeEach, describe, expect, it } from "vitest";
import { createStore, type Store } from "../../src/Store.js";
import { seed } from "../../src/data/seed.js";
import { StoreCli } from "../../src/cli/StoreCli.js";
import { BufferOutputSink, QueueInputSource } from "../../src/cli/io.js";
import { OrderStatus } from "../../src/domain/enums.js";

/**
 * Прогоняет сценарий из раздела "Критерий готовности" spec.md через
 * StoreCli в одном процессе и проверяет и вывод, и состояние Store.
 * spec: Уточнения п. 15.9.
 */
async function runCli(store: Store, lines: readonly string[]): Promise<string> {
  const input = new QueueInputSource(lines);
  const output = new BufferOutputSink();
  const cli = new StoreCli(store, input, output, { interactive: false });
  await cli.run();
  return output.getText();
}

describe("StoreCli end-to-end scenario", () => {
  let store: Store;

  beforeEach(() => {
    store = createStore();
    seed(store);
  });

  it("walks through the full readiness-criteria scenario", async () => {
    const text = await runCli(store, [
      "5", // Customers menu
      "3", // Switch active customer
      "1", // pick #1 -> Alice (C-1)
      "0", // back to main
      "1", // Catalog menu
      "1", // Browse all games
      "0", // back to main
      "1", // Catalog menu again
      "3", // Search by name
      "azul", // search text
      "0", // back to main
      "2", // Cart menu
      "2", // Add game
      "G-5", // Azul
      "3", // quantity 3
      "2", // Add game
      "G-13", // Hanabi
      "1", // quantity 1
      "1", // View cart (shows price preview with discounts)
      "0", // back to main
      "3", // Checkout
      "y", // confirm (Alice has 0 points, no points prompt)
      "6", // Inventory management
      "1", // Show stock
      "0", // back to main
      "4", // My orders
      "9", // Orders management
      "4", // Cancel order
      "1", // pick order #1 -> O-1001
      "0", // back to main
      "6", // Inventory management
      "1", // Show stock
      "0", // back to main
      "0", // Exit
    ]);

    // Key lines a human would see while reading the transcript.
    expect(text).toContain("Active customer is now C-1 \"Alice\".");
    expect(text).toContain('1. G-5 "Azul" — Abstract — 2 990.00 ₽ — 2-4 players');
    expect(text).toContain('Added 3 x "Azul" to the cart.');
    expect(text).toContain('Added 1 x "Hanabi" to the cart.');
    expect(text).toContain("Azul -15%"); // best item discount beats the 10% bulk discount
    expect(text).toContain("Order placed!");
    expect(text).toContain("O-1001");
    expect(text).toContain("available: 7, reserved: 3"); // Azul reserved after checkout
    expect(text).toContain("Order O-1001 cancelled.");
    expect(text).toContain("available: 10, reserved: 0"); // Azul restored after cancellation
    expect(text).toContain("Goodbye!");

    // Store state after the whole scenario.
    const alice = store.customerService.getById("C-1");
    expect(store.getActiveCustomerOrNull()).toBe(alice);
    expect(alice.cart.isEmpty()).toBe(true);
    expect(alice.orders).toHaveLength(1);

    const order = alice.orders[0]!;
    expect(order.id).toBe("O-1001");
    expect(order.status).toBe(OrderStatus.Cancelled);
    expect(store.checkoutService.listOrders()).toContain(order);

    const azulStock = store.inventoryService.getItem(store.catalogService.getById("G-5"));
    expect(azulStock.getAvailableQuantity()).toBe(10);
    expect(azulStock.getReservedQuantity()).toBe(0);

    const hanabiStock = store.inventoryService.getItem(store.catalogService.getById("G-13"));
    expect(hanabiStock.getAvailableQuantity()).toBe(22);
    expect(hanabiStock.getReservedQuantity()).toBe(0);
  });

  it("exits cleanly with a message when input ends unexpectedly", async () => {
    const text = await runCli(store, ["1", "1"]); // enters Catalog, browses, then input runs out
    expect(text).toContain("Input ended. Exiting.");
  });

  it("recovers from invalid menu input instead of crashing", async () => {
    const text = await runCli(store, ["99", "0"]);
    expect(text).toContain('Invalid choice "99"');
    expect(text).toContain("Goodbye!");
  });

  it("reports domain errors on the CLI as a single line and keeps running", async () => {
    const text = await runCli(store, [
      "5",
      "3",
      "1",
      "0",
      "8", // Promotions menu
      "2", // apply promo code
      "NOPE", // unknown code
      "0",
      "0",
    ]);
    expect(text).toMatch(/Error: Promo code "NOPE" does not exist/);
    expect(text).toContain("Goodbye!");
  });
});
