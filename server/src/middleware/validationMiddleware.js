import AppError from "../utils/AppError.js";

export const validateImageUpload = (req, _res, next) => {
  if (!req.file) {
    return next(new AppError("No image uploaded. Please send an image field.", 400, "NO_IMAGE_UPLOADED"));
  }

  next();
};

const supportedPassportCountries = ["india", "us", "canada", "custom"];
const supportedPassportCopies = [3, 6, 9, 12];

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
