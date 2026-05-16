import express from "express";
import { removeBgController } from "../controllers/removeBgController.js";
import { handleUpload } from "../middleware/uploadMiddleware.js";
import { validateImageUpload } from "../middleware/validationMiddleware.js";
import AppError from "../utils/AppError.js";

const router = express.Router();

router.post("/remove-bg", handleUpload, validateImageUpload, removeBgController);
router.all("/remove-bg", (req, _res, next) => {
  next(
    new AppError(
      `${req.method} /api/remove-bg is not supported. Use POST with multipart/form-data and an image field named image.`,
      405,
      "METHOD_NOT_ALLOWED"
    )
  );
});

export default router;
