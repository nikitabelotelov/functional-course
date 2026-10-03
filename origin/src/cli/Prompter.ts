import type { InputSource, OutputSink } from "./io.js";

/**
 * Сигнал конца ввода (EOF). Не наследник DomainError — это служебный сигнал
 * CLI-слоя, а не ошибка бизнес-правила. spec: Уточнения п. 15.3.
 */
export class EndOfInputError extends Error {}

/**
 * Задаёт вопросы пользователю и проверяет ввод, повторно переспрашивая при
 * ошибке, вместо падения программы. spec: Уточнения п. 15.1, 15.4, 15.5.
 */
export class Prompter {
  constructor(
    private readonly input: InputSource,
    private readonly output: OutputSink,
    /** В неинтерактивном режиме (pipe) введённая строка повторяется в выводе. */
    private readonly echo: boolean,
  ) {}

  write(text: string): void {
    this.output.write(text);
  }

  /** Задаёт вопрос и возвращает ответ целиком, без валидации. Бросает EndOfInputError на EOF. */
  async askLine(promptText: string): Promise<string> {
    this.output.write(promptText);
    const line = await this.input.readLine();
    if (line === null) {
      throw new EndOfInputError();
    }
    if (this.echo) {
      this.output.write(line + "\n");
    }
    return line.trim();
  }

  /** Переспрашивает, пока ответ не будет непустой строкой. */
  async askNonEmpty(promptText: string): Promise<string> {
    while (true) {
      const line = await this.askLine(promptText);
      if (line.length > 0) {
        return line;
      }
      this.write("Please enter a non-empty value.\n");
    }
  }

  /** Переспрашивает, пока ответ не будет целым числом в заданных границах. */
  async askInt(promptText: string, options: { min?: number; max?: number } = {}): Promise<number> {
    while (true) {
      const line = await this.askLine(promptText);
      const value = Number(line);
      if (line.length === 0 || !Number.isInteger(value)) {
        this.write(`"${line}" is not a valid whole number. Please try again.\n`);
        continue;
      }
      if (options.min !== undefined && value < options.min) {
        this.write(`Value must be at least ${options.min}. Please try again.\n`);
        continue;
      }
      if (options.max !== undefined && value > options.max) {
        this.write(`Value must be at most ${options.max}. Please try again.\n`);
        continue;
      }
      return value;
    }
  }

  /** Переспрашивает, пока ответ не будет "y" или "n". */
  async askYesNo(promptText: string): Promise<boolean> {
    while (true) {
      const line = (await this.askLine(promptText)).toLowerCase();
      if (line === "y") {
        return true;
      }
      if (line === "n") {
        return false;
      }
      this.write('Please answer "y" or "n".\n');
    }
  }

  /** Переспрашивает, пока ответ не совпадёт с одним из допустимых вариантов. */
  async askChoice(promptText: string, validChoices: readonly string[]): Promise<string> {
    while (true) {
      const line = await this.askLine(promptText);
      if (validChoices.includes(line)) {
        return line;
      }
      this.write(`Invalid choice "${line}". Please try again.\n`);
    }
  }
}
