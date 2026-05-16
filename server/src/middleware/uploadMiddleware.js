import multer from "multer";
import path from "path";
import crypto from "crypto";
import AppError from "../utils/AppError.js";
import { uploadDir } from "../config/storage.js";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB || 10);
const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
    return cb(
      new AppError(
        "Invalid file type. Only jpg, jpeg, png, and webp images are allowed.",
        400,
        "INVALID_FILE_TYPE"
      )
    );
  }

  cb(null, true);
};

export const uploadSingleImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSizeBytes,
    files: 1
  }
}).single("image");

export const handleUpload = (req, res, next) => {
  uploadSingleImage(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError(
            `Image is too large. Maximum allowed size is ${maxFileSizeMb}MB.`,
            413,
            "FILE_TOO_LARGE"
          )
        );
      }

      if (error.code === "LIMIT_FILE_COUNT") {
        return next(new AppError("Only one image can be uploaded.", 400, "TOO_MANY_FILES"));
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return next(
          new AppError(
            "Unexpected file field. Upload the image using a multipart/form-data field named image.",
            400,
            "UNEXPECTED_FILE_FIELD"
          )
        );
      }

      if (error.code === "MISSING_FIELD_NAME") {
        return next(
          new AppError(
            "Image field name is missing. Upload the file using a multipart/form-data field named image.",
            400,
            "MISSING_FIELD_NAME"
          )
        );
      }

      return next(new AppError(error.message, 400, error.code));
    }

    next(error);
  });
};
