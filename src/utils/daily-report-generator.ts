import * as fs from 'fs';
import * as path from 'path';

export interface DailyReport {
  date: string;
  generatedAt: string;
  logFiles: string[];
  summary: string;
}

export class DailyReportGenerator {
  generateDailyReport(date: string): DailyReport {
    const logDir = path.resolve('logs', date);
    const logFiles = fs.existsSync(logDir)
      ? fs.readdirSync(logDir).filter(file => file.endsWith('.log'))
      : [];

    return {
      date,
      generatedAt: new Date().toISOString(),
      logFiles,
      summary: logFiles.length > 0
        ? `Collected ${logFiles.length} log file(s) for ${date}.`
        : `No log files were found for ${date}.`,
    };
  }

  saveReport(report: DailyReport, outputPath: string): void {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  }
}
