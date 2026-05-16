import AppError from "../utils/AppError.js";

export const validateImageUpload = (req, _res, next) => {
  if (!req.file) {
    return next(new AppError("No image uploaded. Please send an image field.", 400, "NO_IMAGE_UPLOADED"));
  }

  next();
};
