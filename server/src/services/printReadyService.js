import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { outputDir, toPublicUrl } from "../config/storage.js";
import AppError from "../utils/AppError.js";

const printDpi = 300;
const pdfPointsPerInch = 72;
const mmPerInch = 25.4;

const countrySizes = {
  india: { widthMm: 35, heightMm: 45, label: "India 35x45mm" },
  us: { widthMm: 50.8, heightMm: 50.8, label: "US Visa 2x2 inch" },
  canada: { widthMm: 50, heightMm: 70, label: "Canada 50x70mm" }
};

const mmToPx = (mm) => Math.round((mm * printDpi) / mmPerInch);
const pxToPdfPoints = (px) => (px / printDpi) * pdfPointsPerInch;

const getBufferFromDataUrl = (imageUrl) => {
  const match = imageUrl.match(/^data:image\/(?:png|jpe?g|webp);base64,(.+)$/);

  if (!match) {
    return null;
  }

  return Buffer.from(match[1], "base64");
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
    await fsp.access(filePath);
  } catch {
    throw new AppError("Image file not found in output folder.", 404, "IMAGE_NOT_FOUND");
  }
};

const getInputImage = async (imageUrl) => {
  const dataUrlBuffer = getBufferFromDataUrl(imageUrl);

  if (dataUrlBuffer) {
    return dataUrlBuffer;
  }

  const inputFilename = getOutputFilenameFromUrl(imageUrl);
  const inputPath = path.join(outputDir, inputFilename);

  await ensureFileExists(inputPath);

  return inputPath;
};

const getPassportSize = ({ country, widthMm, heightMm }) => {
  if (country === "custom") {
    return {
      widthMm,
      heightMm,
      label: `Custom ${widthMm}x${heightMm}mm`
    };
  }

  return countrySizes[country];
};

const calculateGrid = (copies) => {
  const rowsMap = {
    3: 1,
    6: 2,
    9: 3,
    12: 4
  };
  const columns = 3;
  const rows = rowsMap[copies];

  return { rows, columns };
};

const createPdfFromPng = ({ pngPath, pdfPath, widthPx, heightPx }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      autoFirstPage: false,
      compress: true,
      info: {
        Title: "Print Ready Passport Sheet",
        Producer: "AI Passport Photo"
      }
    });
    const stream = fs.createWriteStream(pdfPath);

    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);

    doc.pipe(stream);
    doc.addPage({
      size: [pxToPdfPoints(widthPx), pxToPdfPoints(heightPx)],
      margin: 0
    });
    doc.image(pngPath, 0, 0, {
      width: pxToPdfPoints(widthPx),
      height: pxToPdfPoints(heightPx)
    });
    doc.end();
  });
};

export const generatePrintReadySheet = async ({ imageUrl, country, copies, widthMm, heightMm }) => {
  const passportSize = getPassportSize({ country, widthMm, heightMm });

  if (!passportSize) {
    throw new AppError("Unsupported passport country.", 400, "INVALID_COUNTRY");
  }

  const inputImage = await getInputImage(imageUrl);
  const photoWidth = mmToPx(passportSize.widthMm);
  const photoHeight = mmToPx(passportSize.heightMm);
  const spacing = mmToPx(6);
  const { rows, columns } = calculateGrid(copies);
  const sheetWidth = columns * photoWidth + (columns + 1) * spacing;
  const sheetHeight = rows * photoHeight + (rows + 1) * spacing;

  let resizedPhotoBuffer;

  try {
    resizedPhotoBuffer = await sharp(inputImage)
      .rotate()
      .resize(photoWidth, photoHeight, {
        fit: "contain",
        background: {
          r: 255,
          g: 255,
          b: 255,
          alpha: 1
        },
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
  const outputId = Date.now().toString();
  const outputBase = `passport-sheet-${copies}-${outputId}-${crypto.randomBytes(4).toString("hex")}`;
  const pngFilename = `${outputBase}.png`;
  const pdfFilename = `${outputBase}.pdf`;
  const pngPath = path.join(outputDir, pngFilename);
  const pdfPath = path.join(outputDir, pdfFilename);

  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 3,
      background: "#ffffff"
    }
  })
    .composite(composites)
    .withMetadata({ density: printDpi })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(pngPath);

  await createPdfFromPng({
    pngPath,
    pdfPath,
    widthPx: sheetWidth,
    heightPx: sheetHeight
  });

  return {
    image: toPublicUrl("output", pngFilename),
    processedImage: toPublicUrl("output", pngFilename),
    pdf: toPublicUrl("output", pdfFilename),
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
        heightPx: sheetHeight,
        widthIn: sheetWidth / printDpi,
        heightIn: sheetHeight / printDpi
      }
    }
  };
};
