import AppError from "../utils/AppError.js";

export const validateImageUpload = (req, _res, next) => {
  if (!req.file) {
    return next(new AppError("No image uploaded. Please send an image field.", 400, "NO_IMAGE_UPLOADED"));
  }

  next();
};

const supportedPassportCountries = ["india", "us", "canada", "custom"];
const supportedPassportCopies = [3, 6, 9, 12];
const supportedPaperSizes = ["4x6", "a4", "letter", "custom"];
const printReadyCountryAliases = {
  india: "india",
  us: "us",
  "us-visa": "us",
  us_visa: "us",
  canada: "canada",
  custom: "custom"
};

export const validatePassportSheetRequest = (req, _res, next) => {
  const { imageUrl, country, copies, widthMm, heightMm } = req.body || {};

  if (!imageUrl) {
    return next(new AppError("imageUrl is required.", 400, "IMAGE_URL_REQUIRED"));
  }

  if (!country) {
    return next(new AppError("country is required.", 400, "COUNTRY_REQUIRED"));
  }

  const normalizedCountry = String(country).trim().toLowerCase();

  if (!supportedPassportCountries.includes(normalizedCountry)) {
    return next(
      new AppError(
        "Invalid country. Supported countries are india, us, canada, and custom.",
        400,
        "INVALID_COUNTRY"
      )
    );
  }

  const parsedCopies = Number(copies);

  if (!Number.isInteger(parsedCopies) || !supportedPassportCopies.includes(parsedCopies)) {
    return next(
      new AppError(
        "Invalid copies. Supported copy counts are 3, 6, 9, and 12.",
        400,
        "INVALID_COPIES"
      )
    );
  }

  if (normalizedCountry === "custom" && (widthMm || heightMm)) {
    const parsedWidth = Number(widthMm);
    const parsedHeight = Number(heightMm);

    if (
      !Number.isFinite(parsedWidth) ||
      !Number.isFinite(parsedHeight) ||
      parsedWidth <= 0 ||
      parsedHeight <= 0 ||
      parsedWidth > 100 ||
      parsedHeight > 120
    ) {
      return next(
        new AppError(
          "Custom dimensions must include valid widthMm and heightMm values.",
          400,
          "INVALID_CUSTOM_DIMENSIONS"
        )
      );
    }
  }

  req.passportSheet = {
    imageUrl,
    country: normalizedCountry,
    copies: parsedCopies,
    widthMm: widthMm ? Number(widthMm) : undefined,
    heightMm: heightMm ? Number(heightMm) : undefined
  };

  next();
};

export const validatePrintReadyRequest = (req, _res, next) => {
  const {
    imageUrl,
    country,
    copies,
    widthMm,
    heightMm,
    paperSize = "4x6",
    width,
    height,
    showCutLines = false
  } = req.body || {};

  if (!imageUrl) {
    return next(new AppError("imageUrl is required.", 400, "IMAGE_URL_REQUIRED"));
  }

  if (!country) {
    return next(new AppError("country is required.", 400, "COUNTRY_REQUIRED"));
  }

  const normalizedCountry = printReadyCountryAliases[String(country).trim().toLowerCase()];

  if (!normalizedCountry) {
    return next(
      new AppError(
        "Invalid country. Supported countries are india, us, us-visa, canada, and custom.",
        400,
        "INVALID_COUNTRY"
      )
    );
  }

  const parsedCopies = Number(copies);

  if (!Number.isInteger(parsedCopies) || !supportedPassportCopies.includes(parsedCopies)) {
    return next(
      new AppError(
        "Invalid copies. Supported copy counts are 3, 6, 9, and 12.",
        400,
        "INVALID_COPIES"
      )
    );
  }

  const parsedWidth = widthMm ? Number(widthMm) : undefined;
  const parsedHeight = heightMm ? Number(heightMm) : undefined;
  const normalizedPaperSize = String(paperSize).trim().toLowerCase();

  if (!supportedPaperSizes.includes(normalizedPaperSize)) {
    return next(
      new AppError(
        "Invalid paperSize. Supported paper sizes are 4x6, A4, Letter, and Custom.",
        400,
        "INVALID_PAPER_SIZE"
      )
    );
  }

  if (normalizedCountry === "custom") {
    if (
      !Number.isFinite(parsedWidth) ||
      !Number.isFinite(parsedHeight) ||
      parsedWidth <= 0 ||
      parsedHeight <= 0 ||
      parsedWidth > 100 ||
      parsedHeight > 120
    ) {
      return next(
        new AppError(
          "Custom dimensions must include valid widthMm and heightMm values.",
          400,
          "INVALID_CUSTOM_DIMENSIONS"
        )
      );
    }
  }

  const parsedPaperWidth = width ? Number(width) : undefined;
  const parsedPaperHeight = height ? Number(height) : undefined;

  if (normalizedPaperSize === "custom") {
    if (
      !Number.isFinite(parsedPaperWidth) ||
      !Number.isFinite(parsedPaperHeight) ||
      parsedPaperWidth <= 0 ||
      parsedPaperHeight <= 0 ||
      parsedPaperWidth > 30 ||
      parsedPaperHeight > 30
    ) {
      return next(
        new AppError(
          "Custom paper size must include valid width and height values in inches.",
          400,
          "INVALID_CUSTOM_PAPER_SIZE"
        )
      );
    }
  }

  req.printReadySheet = {
    imageUrl,
    country: normalizedCountry,
    copies: parsedCopies,
    widthMm: parsedWidth,
    heightMm: parsedHeight,
    paperSize: normalizedPaperSize,
    width: parsedPaperWidth,
    height: parsedPaperHeight,
    showCutLines: Boolean(showCutLines)
  };

  next();
};
