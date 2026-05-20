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

const paperSizes = {
  "4x6": { widthPx: 1200, heightPx: 1800, label: "4x6 Photo Paper" },
  a4: { widthPx: 2480, heightPx: 3508, label: "A4" },
  letter: { widthPx: 2550, heightPx: 3300, label: "Letter" }
};

const mmToPx = (mm) => Math.round((mm * printDpi) / mmPerInch);
const inchesToPx = (inches) => Math.round(inches * printDpi);
const pxToPdfPoints = (px) => (px / printDpi) * pdfPointsPerInch;

const createCutLinesOverlay = ({
  sheetWidth,
  sheetHeight,
  startX,
  startY,
  rows,
  columns,
  renderedPhotoWidth,
  renderedPhotoHeight,
  renderedSpacing
}) => {
  const gridWidth = columns * renderedPhotoWidth + (columns - 1) * renderedSpacing;
  const gridHeight = rows * renderedPhotoHeight + (rows - 1) * renderedSpacing;
  const strokeWidth = 2;
  const lineColor = "#b7b7b7";
  const lines = [];

  for (let column = 1; column < columns; column += 1) {
    const x = startX + column * renderedPhotoWidth + (column - 0.5) * renderedSpacing;

    lines.push(`<line x1="${x}" y1="${startY}" x2="${x}" y2="${startY + gridHeight}" />`);
  }

  for (let row = 1; row < rows; row += 1) {
    const y = startY + row * renderedPhotoHeight + (row - 0.5) * renderedSpacing;

    lines.push(`<line x1="${startX}" y1="${y}" x2="${startX + gridWidth}" y2="${y}" />`);
  }

  lines.push(
    `<rect x="${startX}" y="${startY}" width="${gridWidth}" height="${gridHeight}" fill="none" />`
  );

  return Buffer.from(`
    <svg width="${sheetWidth}" height="${sheetHeight}" viewBox="0 0 ${sheetWidth} ${sheetHeight}" xmlns="http://www.w3.org/2000/svg">
      <g stroke="${lineColor}" stroke-width="${strokeWidth}" stroke-linecap="square" vector-effect="non-scaling-stroke">
        ${lines.join("\n")}
      </g>
    </svg>
  `);
};

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

const getPaperSize = ({ paperSize, width, height }) => {
  if (paperSize === "custom") {
    return {
      widthPx: inchesToPx(width),
      heightPx: inchesToPx(height),
      label: `Custom ${width}x${height}in`
    };
  }

  return paperSizes[paperSize];
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

export const generatePrintReadySheet = async ({
  imageUrl,
  country,
  copies,
  widthMm,
  heightMm,
  paperSize = "4x6",
  width,
  height,
  showCutLines = false
}) => {
  const passportSize = getPassportSize({ country, widthMm, heightMm });
  const selectedPaperSize = getPaperSize({ paperSize, width, height });

  if (!passportSize) {
    throw new AppError("Unsupported passport country.", 400, "INVALID_COUNTRY");
  }

  if (!selectedPaperSize) {
    throw new AppError("Unsupported paper size.", 400, "INVALID_PAPER_SIZE");
  }

  const inputImage = await getInputImage(imageUrl);
  const photoWidth = mmToPx(passportSize.widthMm);
  const photoHeight = mmToPx(passportSize.heightMm);
  const spacing = mmToPx(6);
  const { rows, columns } = calculateGrid(copies);
  const sheetWidth = selectedPaperSize.widthPx;
  const sheetHeight = selectedPaperSize.heightPx;
  const usedGridWidth = columns * photoWidth + (columns - 1) * spacing;
  const usedGridHeight = rows * photoHeight + (rows - 1) * spacing;
  const printableWidth = sheetWidth - spacing * 2;
  const printableHeight = sheetHeight - spacing * 2;
  const fitScale = Math.min(1, printableWidth / usedGridWidth, printableHeight / usedGridHeight);
  const renderedPhotoWidth = Math.max(1, Math.round(photoWidth * fitScale));
  const renderedPhotoHeight = Math.max(1, Math.round(photoHeight * fitScale));
  const renderedSpacing = Math.max(0, Math.round(spacing * fitScale));

  let resizedPhotoBuffer;

  try {
    resizedPhotoBuffer = await sharp(inputImage)
      .rotate()
      .resize(renderedPhotoWidth, renderedPhotoHeight, {
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

  const renderedGridWidth = columns * renderedPhotoWidth + (columns - 1) * renderedSpacing;
  const renderedGridHeight = rows * renderedPhotoHeight + (rows - 1) * renderedSpacing;
  const startX = Math.round((sheetWidth - renderedGridWidth) / 2);
  const startY = Math.round((sheetHeight - renderedGridHeight) / 2);
  const composites = Array.from({ length: copies }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;

    return {
      input: resizedPhotoBuffer,
      left: startX + column * (renderedPhotoWidth + renderedSpacing),
      top: startY + row * (renderedPhotoHeight + renderedSpacing)
    };
  });

  if (showCutLines) {
    composites.push({
      input: createCutLinesOverlay({
        sheetWidth,
        sheetHeight,
        startX,
        startY,
        rows,
        columns,
        renderedPhotoWidth,
        renderedPhotoHeight,
        renderedSpacing
      }),
      left: 0,
      top: 0
    });
  }

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
      paper: {
        size: paperSize,
        label: selectedPaperSize.label,
        widthPx: sheetWidth,
        heightPx: sheetHeight,
        widthIn: sheetWidth / printDpi,
        heightIn: sheetHeight / printDpi
      },
      photo: {
        widthMm: passportSize.widthMm,
        heightMm: passportSize.heightMm,
        widthPx: photoWidth,
        heightPx: photoHeight,
        renderedWidthPx: renderedPhotoWidth,
        renderedHeightPx: renderedPhotoHeight,
        fitScale
      },
      sheet: {
        widthPx: sheetWidth,
        heightPx: sheetHeight,
        widthIn: sheetWidth / printDpi,
        heightIn: sheetHeight / printDpi
      },
      cutLines: showCutLines
    }
  };
};
