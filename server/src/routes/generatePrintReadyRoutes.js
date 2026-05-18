import express from "express";
import { generatePrintReadyController } from "../controllers/generatePrintReadyController.js";
import { validatePrintReadyRequest } from "../middleware/validationMiddleware.js";
import AppError from "../utils/AppError.js";

const router = express.Router();

router.post("/generate-print-ready", validatePrintReadyRequest, generatePrintReadyController);
router.all("/generate-print-ready", (req, _res, next) => {
  next(
    new AppError(
      `${req.method} /api/generate-print-ready is not supported. Use POST with a JSON body containing imageUrl, country, and copies.`,
      405,
      "METHOD_NOT_ALLOWED"
    )
  );
});

export default router;
