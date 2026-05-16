import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { outputDir, toPublicUrl } from "../config/storage.js";
import AppError from "../utils/AppError.js";

const printDpi = 300;
const mmPerInch = 25.4;

const countrySizes = {
  india: { widthMm: 35, heightMm: 45, label: "India 35x45mm" },
  us: { widthMm: 50.8, heightMm: 50.8, label: "US 2x2 inch" },
  canada: { widthMm: 50, heightMm: 70, label: "Canada 50x70mm" },
  custom: { widthMm: 35, heightMm: 45, label: "Custom" }
};

const mmToPx = (mm) => Math.round((mm / mmPerInch) * printDpi);

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

const calculateGrid = (copies) => {
  const columns = Math.ceil(Math.sqrt(copies));
  const rows = Math.ceil(copies / columns);

  return { rows, columns };
};

const getPassportSize = ({ country, widthMm, heightMm }) => {
  if (country === "custom" && widthMm && heightMm) {
    return {
      widthMm,
      heightMm,
      label: `Custom ${widthMm}x${heightMm}mm`
    };
  }

  return countrySizes[country];
};

export const generatePassportSheet = async ({ imageUrl, country, copies, widthMm, heightMm }) => {
  const passportSize = getPassportSize({ country, widthMm, heightMm });

  if (!passportSize) {
    throw new AppError("Unsupported passport country.", 400, "INVALID_COUNTRY");
  }

  const inputFilename = getOutputFilenameFromUrl(imageUrl);
  const inputPath = path.join(outputDir, inputFilename);

  await ensureFileExists(inputPath);

  const photoWidth = mmToPx(passportSize.widthMm);
  const photoHeight = mmToPx(passportSize.heightMm);
  const spacing = mmToPx(6);
  const margin = mmToPx(8);
  const { rows, columns } = calculateGrid(copies);
  const sheetWidth = margin * 2 + columns * photoWidth + (columns - 1) * spacing;
  const sheetHeight = margin * 2 + rows * photoHeight + (rows - 1) * spacing;

  let resizedPhotoBuffer;

  try {
    resizedPhotoBuffer = await sharp(inputPath)
      .rotate()
      .resize(photoWidth, photoHeight, {
        fit: "cover",
        position: "center",
        kernel: sharp.kernel.lanczos3
      })
      .flatten({ background: "#ffffff" })
      .png({ quality: 100, compressionLevel: 9 })
      .toBuffer();
  } catch {
    throw new AppError("Unable to process image. Please provide a valid image file.", 400, "INVALID_IMAGE_FILE");
  }

  const usedGridWidth = columns * photoWidth + (columns - 1) * spacing;
  const usedGridHeight = rows * photoHeight + (rows - 1) * spacing;
  const startX = Math.round((sheetWidth - usedGridWidth) / 2);
  const startY = Math.round((sheetHeight - usedGridHeight) / 2);
  const composites = Array.from({ length: copies }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;

    return {
      input: resizedPhotoBuffer,
      left: startX + column * (photoWidth + spacing),
      top: startY + row * (photoHeight + spacing)
    };
  });

  const outputFilename = `passport-sheet-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.png`;
  const outputPath = path.join(outputDir, outputFilename);

  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 3,
      background: "#ffffff"
    }
  })
    .composite(composites)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outputPath);

  return {
    filename: outputFilename,
    path: outputPath,
    url: toPublicUrl("output", outputFilename),
    details: {
      country,
      label: passportSize.label,
      copies,
      rows,
      columns,
      dpi: printDpi,
      photo: {
        widthMm: passportSize.widthMm,
        heightMm: passportSize.heightMm,
        widthPx: photoWidth,
        heightPx: photoHeight
      },
      sheet: {
        widthPx: sheetWidth,
        heightPx: sheetHeight
      }
    }
  };
};
