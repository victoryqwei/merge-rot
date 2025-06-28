#!/usr/bin/env node

import { Command } from "commander";
import sharp from "sharp";
import chalk from "chalk";
import ora from "ora";
import { glob } from "glob";
import path from "path";
import fs from "fs/promises";

interface OptimizationOptions {
  quality: number;
  format: "webp" | "avif" | "jpeg" | "png";
  width?: number;
  height?: number;
  backup: boolean;
  outputDir?: string;
}

interface ImageStats {
  originalSize: number;
  optimizedSize: number;
  savings: number;
  savingsPercent: number;
}

interface CliOptions {
  quality: string;
  format: "webp" | "avif" | "jpeg" | "png";
  width?: string;
  height?: string;
  backup: boolean;
  outputDir?: string;
}

class ImageOptimizer {
  private options: OptimizationOptions;
  private stats: ImageStats[] = [];

  constructor(options: OptimizationOptions) {
    this.options = options;
  }

  async optimizeImages(): Promise<void> {
    const spinner = ora("Finding images to optimize...").start();

    try {
      // Find all image files in characters directory
      const imagePattern = "src/assets/characters/**/*.{png,jpg,jpeg,gif,webp}";
      const imageFiles = await glob(imagePattern);

      if (imageFiles.length === 0) {
        spinner.fail("No image files found in src/assets/characters/");
        return;
      }

      spinner.text = `Found ${imageFiles.length} images to optimize`;

      // Create backup directory if needed
      if (this.options.backup) {
        await this.createBackup(imageFiles);
      }

      // Process each image
      for (const imagePath of imageFiles) {
        await this.processImage(imagePath, spinner);
      }

      spinner.succeed(`Optimization complete! Processed ${imageFiles.length} images`);
      this.printStats();
    } catch (error) {
      spinner.fail(`Error during optimization: ${error}`);
      process.exit(1);
    }
  }

  private async createBackup(imageFiles: string[]): Promise<void> {
    const backupDir = "src/assets/characters/backup-" + new Date().toISOString().slice(0, 19).replace(/:/g, "-");

    try {
      await fs.mkdir(backupDir, { recursive: true });

      for (const imagePath of imageFiles) {
        const relativePath = path.relative("src/assets/characters", imagePath);
        const backupPath = path.join(backupDir, relativePath);

        // Create subdirectories if needed
        await fs.mkdir(path.dirname(backupPath), { recursive: true });

        // Copy original file
        await fs.copyFile(imagePath, backupPath);
      }

      console.log(chalk.blue(`Backup created at: ${backupDir}`));
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not create backup: ${error}`));
    }
  }

  private async processImage(imagePath: string, spinner: { text: string }): Promise<void> {
    try {
      spinner.text = `Optimizing ${path.basename(imagePath)}`;

      const originalStats = await fs.stat(imagePath);
      const originalSize = originalStats.size;

      // Read the image
      const image = sharp(imagePath);

      // Apply transformations
      let processedImage = image;

      if (this.options.width || this.options.height) {
        processedImage = image.resize(this.options.width, this.options.height, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Convert format and apply quality
      let outputBuffer: Buffer;
      const outputPath = this.getOutputPath(imagePath);

      switch (this.options.format) {
        case "webp":
          outputBuffer = await processedImage.webp({ quality: this.options.quality }).toBuffer();
          break;
        case "avif":
          outputBuffer = await processedImage.avif({ quality: this.options.quality }).toBuffer();
          break;
        case "jpeg":
          outputBuffer = await processedImage.jpeg({ quality: this.options.quality }).toBuffer();
          break;
        case "png":
          outputBuffer = await processedImage.png({ quality: this.options.quality }).toBuffer();
          break;
        default:
          outputBuffer = await processedImage.toBuffer();
      }

      // Write optimized image
      await fs.writeFile(outputPath, outputBuffer);

      // Calculate stats
      const optimizedSize = outputBuffer.length;
      const savings = originalSize - optimizedSize;
      const savingsPercent = (savings / originalSize) * 100;

      this.stats.push({
        originalSize,
        optimizedSize,
        savings,
        savingsPercent,
      });
    } catch (error) {
      console.error(chalk.red(`Error processing ${imagePath}: ${error}`));
    }
  }

  private getOutputPath(originalPath: string): string {
    if (this.options.outputDir) {
      const relativePath = path.relative("src/assets/characters", originalPath);
      const nameWithoutExt = path.parse(relativePath).name;
      return path.join(this.options.outputDir, `${nameWithoutExt}.${this.options.format}`);
    }

    const parsed = path.parse(originalPath);
    return path.join(parsed.dir, `${parsed.name}.${this.options.format}`);
  }

  private printStats(): void {
    if (this.stats.length === 0) return;

    const totalOriginal = this.stats.reduce((sum, stat) => sum + stat.originalSize, 0);
    const totalOptimized = this.stats.reduce((sum, stat) => sum + stat.optimizedSize, 0);
    const totalSavings = totalOriginal - totalOptimized;
    const totalSavingsPercent = (totalSavings / totalOriginal) * 100;

    console.log("\n" + chalk.green.bold("Optimization Results:"));
    console.log(chalk.gray("─".repeat(50)));
    console.log(`Total images processed: ${chalk.cyan(this.stats.length)}`);
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

program.name("optimize-images").description("Optimize images in src/assets/characters/ directory").version("1.0.0");

program
  .option("-q, --quality <number>", "Quality setting (1-100)", "80")
  .option("-f, --format <format>", "Output format (webp, avif, jpeg, png)", "webp")
  .option("-w, --width <number>", "Resize width (maintains aspect ratio)")
  .option("-h, --height <number>", "Resize height (maintains aspect ratio)")
  .option("-b, --backup", "Create backup of original files")
  .option("-o, --output-dir <path>", "Output directory (defaults to same location)")
  .action(async (options: CliOptions) => {
    const optimizer = new ImageOptimizer({
      quality: parseInt(options.quality),
      format: options.format,
      width: options.width ? parseInt(options.width) : undefined,
      height: options.height ? parseInt(options.height) : undefined,
      backup: options.backup || false,
      outputDir: options.outputDir,
    });

    await optimizer.optimizeImages();
  });

program.parse();
