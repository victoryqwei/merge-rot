#!/usr/bin/env node

import { Command } from "commander";
import ffmpeg from "fluent-ffmpeg";
import chalk from "chalk";
import ora from "ora";
import { glob } from "glob";
import path from "path";
import fs from "fs/promises";

interface OptimizationOptions {
  bitrate: number;
  sampleRate?: number;
  quality: number;
  backup: boolean;
  outputDir?: string;
}

interface AudioStats {
  originalSize: number;
  optimizedSize: number;
  savings: number;
  savingsPercent: number;
}

interface CliOptions {
  bitrate: string;
  sampleRate?: string;
  quality: string;
  backup: boolean;
  outputDir?: string;
}

class Mp3Optimizer {
  private options: OptimizationOptions;
  private stats: AudioStats[] = [];

  constructor(options: OptimizationOptions) {
    this.options = options;
  }

  async optimizeAudioFiles(): Promise<void> {
    const spinner = ora("Finding MP3 files to optimize...").start();

    try {
      // Find all MP3 files in sounds directory
      const audioPattern = "src/assets/sounds/**/*.mp3";
      const audioFiles = await glob(audioPattern);

      if (audioFiles.length === 0) {
        spinner.fail("No MP3 files found in src/assets/sounds/");
        return;
      }

      spinner.text = `Found ${audioFiles.length} MP3 files to optimize`;

      // Create backup directory if needed
      if (this.options.backup) {
        await this.createBackup(audioFiles);
      }

      // Process each audio file
      for (const audioPath of audioFiles) {
        await this.processAudioFile(audioPath, spinner);
      }

      spinner.succeed(`Optimization complete! Processed ${audioFiles.length} MP3 files`);
      this.printStats();
    } catch (error) {
      spinner.fail(`Error during optimization: ${error}`);
      process.exit(1);
    }
  }

  private async createBackup(audioFiles: string[]): Promise<void> {
    const backupDir = "src/assets/sounds/backup";
    await fs.mkdir(backupDir, { recursive: true });

    for (const audioPath of audioFiles) {
      const filename = path.basename(audioPath);
      const backupPath = path.join(backupDir, filename);
      await fs.copyFile(audioPath, backupPath);
    }
  }

  private async processAudioFile(audioPath: string, spinner: { text: string }): Promise<void> {
    return new Promise((resolve, reject) => {
      const processFile = async (): Promise<void> => {
        try {
          spinner.text = `Optimizing ${path.basename(audioPath)}`;

          const originalStats = await fs.stat(audioPath);
          const originalSize = originalStats.size;

          const outputPath = this.getOutputPath(audioPath);
          const tempPath = outputPath + ".tmp";

          // Configure FFmpeg
          let command = ffmpeg(audioPath).audioBitrate(this.options.bitrate).audioQuality(this.options.quality).format("mp3");

          // Set sample rate if specified
          if (this.options.sampleRate) {
            command = command.audioFrequency(this.options.sampleRate);
          }

          // Add optimization flags
          command = command.outputOptions([
            "-map_metadata",
            "0", // Preserve metadata
            "-id3v2_version",
            "3", // Use ID3v2.3 for better compatibility
          ]);

          command
            .output(tempPath)
            .on("end", async () => {
              try {
                // Get optimized file stats
                const optimizedStats = await fs.stat(tempPath);
                const optimizedSize = optimizedStats.size;

                // Replace original file with optimized version
                await fs.rename(tempPath, outputPath);

                // Calculate stats
                const savings = originalSize - optimizedSize;
                const savingsPercent = (savings / originalSize) * 100;

                this.stats.push({
                  originalSize,
                  optimizedSize,
                  savings,
                  savingsPercent,
                });

                resolve();
              } catch (error) {
                reject(error);
              }
            })
            .on("error", (error: Error) => {
              reject(error);
            })
            .run();
        } catch (error) {
          console.error(chalk.red(`Error processing ${audioPath}: ${error}`));
          reject(error);
        }
      };

      void processFile();
    });
  }

  private getOutputPath(inputPath: string): string {
    if (this.options.outputDir) {
      const filename = path.basename(inputPath);
      return path.join(this.options.outputDir, filename);
    }
    return inputPath;
  }

  private printStats(): void {
    if (this.stats.length === 0) return;

    const totalOriginal = this.stats.reduce((sum, stat) => sum + stat.originalSize, 0);
    const totalOptimized = this.stats.reduce((sum, stat) => sum + stat.optimizedSize, 0);
    const totalSavings = totalOriginal - totalOptimized;
    const totalSavingsPercent = (totalSavings / totalOriginal) * 100;

    console.log("\n" + chalk.green.bold("MP3 Optimization Results:"));
    console.log(chalk.gray("─".repeat(50)));
    console.log(`Total MP3 files processed: ${chalk.cyan(this.stats.length)}`);
    console.log(`Original size: ${chalk.yellow(this.formatBytes(totalOriginal))}`);
    console.log(`Optimized size: ${chalk.green(this.formatBytes(totalOptimized))}`);
    console.log(`Total savings: ${chalk.blue(this.formatBytes(totalSavings))} (${totalSavingsPercent.toFixed(1)}%)`);

    // Show individual file stats
    console.log("\n" + chalk.gray("Individual file results:"));
    this.stats.forEach((stat, index) => {
      const savingsColor = stat.savingsPercent > 50 ? "green" : stat.savingsPercent > 20 ? "yellow" : "red";
      console.log(
        `${index + 1}. ${chalk.cyan(this.formatBytes(stat.originalSize))} → ${chalk.green(this.formatBytes(stat.optimizedSize))} ` +
          `(${chalk[savingsColor](`${stat.savingsPercent.toFixed(1)}%`)} saved)`
      );
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

// CLI setup
const program = new Command();

program.name("optimize-mp3").description("Optimize MP3 files in src/assets/sounds/ directory").version("1.0.0");

program
  .option("-b, --bitrate <number>", "Audio bitrate in kbps", "128")
  .option("-s, --sample-rate <number>", "Sample rate in Hz (e.g., 44100, 22050)")
  .option("-q, --quality <number>", "Audio quality (0-9, lower is better)", "2")
  .option("--backup", "Create backup of original files")
  .option("-o, --output-dir <path>", "Output directory (defaults to same location)")
  .action(async (options: CliOptions) => {
    const optimizer = new Mp3Optimizer({
      bitrate: parseInt(options.bitrate),
      sampleRate: options.sampleRate ? parseInt(options.sampleRate) : undefined,
      quality: parseInt(options.quality),
      backup: options.backup || false,
      outputDir: options.outputDir,
    });

    await optimizer.optimizeAudioFiles();
  });

program.parse();
