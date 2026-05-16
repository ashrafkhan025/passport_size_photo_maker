import express from "express";
import { changeBackgroundController } from "../controllers/changeBackgroundController.js";
import AppError from "../utils/AppError.js";

const router = express.Router();

router.post("/change-background", changeBackgroundController);
router.all("/change-background", (req, _res, next) => {
  next(
    new AppError(
      `${req.method} /api/change-background is not supported. Use POST with a JSON body containing imageUrl and color.`,
      405,
      "METHOD_NOT_ALLOWED"
    )
  );
});

export default router;
