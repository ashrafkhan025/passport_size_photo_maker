import express from "express";
import { generatePassportController } from "../controllers/generatePassportController.js";
import { validatePassportSheetRequest } from "../middleware/validationMiddleware.js";
import AppError from "../utils/AppError.js";

const router = express.Router();

router.post("/generate-passport", validatePassportSheetRequest, generatePassportController);
router.all("/generate-passport", (req, _res, next) => {
  next(
    new AppError(
      `${req.method} /api/generate-passport is not supported. Use POST with a JSON body containing imageUrl, country, and copies.`,
      405,
      "METHOD_NOT_ALLOWED"
    )
  );
});

export default router;
