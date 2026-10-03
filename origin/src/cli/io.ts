/**
 * Абстракции ввода-вывода CLI. Позволяют одинаково работать с реальным
 * терминалом и с тестовыми буферами строк. spec: Уточнения п. 15.6.
 */
export interface InputSource {
  /** Возвращает следующую строку ввода или null, если ввод закончился (EOF). */
  readLine(): Promise<string | null>;
}

export interface OutputSink {
  write(text: string): void;
}

/**
 * Читает ввод через async-итератор node:readline. Не использует
 * readline/promises + rl.question(), чтобы не терять строки, пришедшие
 * раньше вопроса при вводе через pipe. spec: Уточнения п. 15.2.
 */
export class StdinInputSource implements InputSource {
  private readonly iterator: AsyncIterator<string>;

  constructor(rl: { [Symbol.asyncIterator](): AsyncIterator<string> }) {
    this.iterator = rl[Symbol.asyncIterator]();
  }

  async readLine(): Promise<string | null> {
    const { value, done } = await this.iterator.next();
    return done ? null : value;
  }
}

/** Пишет вывод в stdout процесса. */
export class StdoutOutputSink implements OutputSink {
  write(text: string): void {
    process.stdout.write(text);
  }
}

/** Тестовый источник ввода: отдаёт строки из заранее заданного массива. */
export class QueueInputSource implements InputSource {
  private index = 0;

  constructor(private readonly lines: readonly string[]) {}

  async readLine(): Promise<string | null> {
    if (this.index >= this.lines.length) {
      return null;
    }
    return this.lines[this.index++]!;
  }
}

/** Тестовый приёмник вывода: копит весь вывод в строку. */
export class BufferOutputSink implements OutputSink {
  private text = "";

  write(chunk: string): void {
    this.text += chunk;
  }

  getText(): string {
    return this.text;
  }
}
