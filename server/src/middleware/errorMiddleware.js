import { removeFileIfExists } from "../utils/fileUtils.js";

export const notFoundHandler = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = "ROUTE_NOT_FOUND";
  next(error);
};

export const errorHandler = async (error, req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const code = error.code || "INTERNAL_ERROR";

  if (req.file?.path && statusCode >= 400) {
    await removeFileIfExists(req.file.path);
  }

  if (process.env.NODE_ENV !== "test") {
    console.error(`[${code}]`, error.message);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Something went wrong. Please try again later." : error.message,
    code,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    ...(error.details && { details: error.details })
  });
};
