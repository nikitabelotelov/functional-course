import * as readline from "node:readline";
import { createStore } from "./Store.js";
import { seed } from "./data/seed.js";
import { StoreCli } from "./cli/StoreCli.js";
import { StdinInputSource, StdoutOutputSink } from "./cli/io.js";

const store = createStore();
seed(store);

const rl = readline.createInterface({ input: process.stdin, terminal: false });
const input = new StdinInputSource(rl);
const output = new StdoutOutputSink();

const cli = new StoreCli(store, input, output, { interactive: process.stdin.isTTY === true });

cli.run().then(() => {
  rl.close();
  process.exit(0);
});
