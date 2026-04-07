import * as fs from 'fs';
import * as path from 'path';
import ora, { Ora } from 'ora';
import { styles } from '../theme/colors';

export class Logger {
  private static spinner: Ora | null = null;
  private static logStream: fs.WriteStream | null = null;
  private static logFilePath: string | null = null;
  private static silentMode = false;

  private static stripAnsi(value: string): string {
    return value.replace(/\x1B\[[0-9;]*m/g, '');
  }

  private static write(level: string, message: string): void {
    if (!this.logStream) {
      return;
    }

    const timestamp = new Date().toISOString();
    this.logStream.write(`[${timestamp}] [${level}] ${this.stripAnsi(message)}\n`);
  }

  static openLogFile(sessionType: string, sessionKey?: string, silent = false): void {
    const now = new Date();
    const dateDir = now.toISOString().slice(0, 10);
    const timePart = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const suffix = sessionKey ? `${sessionType}_${sessionKey}` : sessionType;
    const dir = path.resolve('logs', dateDir);

    fs.mkdirSync(dir, { recursive: true });
    this.silentMode = silent;
    this.logFilePath = path.join(dir, `${timePart}_${suffix}.log`);
    this.logStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
  }

  static closeLogFile(): void {
    this.logStream?.end();
    this.logStream = null;
    this.logFilePath = null;
  }

  static getLogFilePath(): string | null {
    return this.logFilePath;
  }

  static success(message: string): void {
    this.write('SUCCESS', message);
    console.log(styles.success(message));
  }

  static error(message: string): void {
    this.write('ERROR', message);
    console.error(styles.error(message));
  }

  static warning(message: string): void {
    this.write('WARN', message);
    console.warn(styles.warning(message));
  }

  static info(message: string): void {
    this.write('INFO', message);
    if (!this.silentMode) {
      console.log(styles.info(message));
    }
  }

  static title(message: string): void {
    this.write('TITLE', message);
    console.log(`\n${styles.title(message)}\n`);
  }

  static text(message: string): void {
    this.write('TEXT', message);
    console.log(styles.text(message));
  }

  static highlight(message: string): void {
    this.write('HIGHLIGHT', message);
    console.log(styles.highlight(message));
  }

  static startProgress(message: string): void {
    this.spinner?.stop();
    this.spinner = ora(styles.text(message)).start();
  }

  static updateProgress(message: string): void {
    if (this.spinner) {
      this.spinner.text = styles.text(message);
    }
  }

  static stopProgress(success?: boolean, message?: string): void {
    if (!this.spinner) {
      return;
    }

    if (success === true) {
      this.spinner.succeed(message ? styles.success(message) : undefined);
    } else if (success === false) {
      this.spinner.fail(message ? styles.error(message) : undefined);
    } else {
      this.spinner.stop();
      if (message) {
        console.log(message);
      }
    }

    this.spinner = null;
  }

  static progressBar(current: number, total: number, message?: string): void {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    const filledLength = total > 0 ? Math.round((30 * current) / total) : 0;
    const bar = `${'#'.repeat(filledLength)}${'-'.repeat(30 - filledLength)}`;
    const text = `${message ? `${message} ` : ''}[${bar}] ${percentage}% (${current}/${total})`;

    if (this.spinner) {
      this.spinner.text = styles.text(text);
    } else {
      process.stdout.write(`\r${styles.text(text)}`);
    }
  }

  static clearProgress(): void {
    if (!this.spinner) {
      process.stdout.write('\n');
    }
  }

  static brand(): void {
    const art = [
      '          _________          ',
      '       .-"         "-.       ',
      `     .'   .-"""-.     ".     `,
      `    /   .'  o o  ".     \\    `,
      `   ;   /     ^     \\     ;   `,
      `   |   |   \\___/   |     |   `,
      `   ;   \\           /     ;   `,
      `    \\   "._     _."     /    `,
      `     ".     "---"     ."     `,
      `       "-._ SLIME _.-"       `,
    ];

    console.log('');
    for (const line of art) {
      console.log(styles.brand(line));
    }
    console.log(styles.subtitle('        Your Slime CLI Assistant'));
    console.log('');
  }
}
