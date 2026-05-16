import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import ImageJob from "../models/ImageJob.js";
import { outputDir, toPublicUrl } from "../config/storage.js";
import { removeBackground } from "../services/backgroundRemovalService.js";
import { removeFileIfExists } from "../utils/fileUtils.js";

export const removeBgController = async (req, res, next) => {
  const uploadedFile = req.file;
  let imageJob;
  let outputPath;

  try {
    const originalUrl = toPublicUrl("uploads", uploadedFile.filename);

    imageJob = await ImageJob.create({
      originalImage: {
        filename: uploadedFile.filename,
        path: uploadedFile.path,
        url: originalUrl,
        mimetype: uploadedFile.mimetype,
        size: uploadedFile.size
      },
      status: "pending"
    });

    const processedImageBuffer = await removeBackground(uploadedFile.path);
    const processedFilename = `${path.parse(uploadedFile.filename).name}-${crypto
      .randomBytes(4)
      .toString("hex")}.png`;
    outputPath = path.join(outputDir, processedFilename);

    await fs.writeFile(outputPath, processedImageBuffer);

    const processedUrl = toPublicUrl("output", processedFilename);

    imageJob.processedImage = {
      filename: processedFilename,
      path: outputPath,
      url: processedUrl
    };
    imageJob.status = "completed";
    await imageJob.save();

    return res.status(200).json({
      success: true,
      originalImage: originalUrl,
      processedImage: processedUrl,
      jobId: imageJob._id,
      message: "Background removed successfully"
    });
  } catch (error) {
    if (imageJob) {
      imageJob.status = "failed";
      imageJob.errorMessage = error.message;
      await imageJob.save().catch(() => {});
    }

    await removeFileIfExists(outputPath);
    next(error);
  }
};
