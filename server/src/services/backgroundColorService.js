import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { outputDir, toPublicUrl } from "../config/storage.js";
import AppError from "../utils/AppError.js";

const allowedBackgroundColors = {
  white: { r: 255, g: 255, b: 255 },
  blue: { r: 140, g: 198, b: 240 },
  red: { r: 255, g: 0, b: 0 }
};

const getOutputFilenameFromUrl = (imageUrl) => {
  let parsedUrl;

  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    throw new AppError("imageUrl must be a valid URL.", 400, "INVALID_IMAGE_URL");
  }

  const pathname = decodeURIComponent(parsedUrl.pathname);

  if (!pathname.startsWith("/output/")) {
    throw new AppError("imageUrl must point to an image inside the output folder.", 400, "INVALID_IMAGE_URL");
  }

  const filename = path.basename(pathname);

  if (!filename || pathname !== `/output/${filename}`) {
    throw new AppError("imageUrl must point to a valid output image file.", 400, "INVALID_IMAGE_URL");
  }

  return filename;
};

const ensureFileExists = async (filePath) => {
  try {
    await fs.access(filePath);
  } catch {
    throw new AppError("Image file not found in output folder.", 404, "IMAGE_NOT_FOUND");
  }
};

export const changeBackgroundColor = async ({ imageUrl, color }) => {
  if (!imageUrl) {
    throw new AppError("imageUrl is required.", 400, "IMAGE_URL_REQUIRED");
  }

  if (!color) {
    throw new AppError("color is required. Allowed colors are white, blue, and red.", 400, "COLOR_REQUIRED");
  }

  const normalizedColor = String(color).trim().toLowerCase();
  const backgroundColor = allowedBackgroundColors[normalizedColor];

  if (!backgroundColor) {
    throw new AppError("Invalid color. Allowed colors are white, blue, and red.", 400, "INVALID_BACKGROUND_COLOR");
  }

  const inputFilename = getOutputFilenameFromUrl(imageUrl);
  const inputPath = path.join(outputDir, inputFilename);

  await ensureFileExists(inputPath);

  let metadata;

  try {
    metadata = await sharp(inputPath).metadata();
  } catch {
    throw new AppError("Unable to read image metadata. Please provide a valid PNG image.", 400, "INVALID_IMAGE_FILE");
  }

  if (!metadata.width || !metadata.height) {
    throw new AppError("Unable to determine image width and height.", 400, "INVALID_IMAGE_DIMENSIONS");
  }

  const outputFilename = `bg-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.png`;
  const outputPath = path.join(outputDir, outputFilename);

  // Build a solid-color canvas, then place the transparent PNG above it.
  await sharp({
    create: {
      width: metadata.width,
      height: metadata.height,
      channels: 3,
      background: backgroundColor
    }
  })
    .composite([{ input: inputPath, left: 0, top: 0 }])
    .png()
    .toFile(outputPath);

  return {
    filename: outputFilename,
    path: outputPath,
    url: toPublicUrl("output", outputFilename)
  };
};
