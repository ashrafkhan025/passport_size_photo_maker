import { generatePassportSheet } from "../services/passportSheetService.js";

export const generatePassportController = async (req, res, next) => {
  try {
    const processedImage = await generatePassportSheet(req.passportSheet);

    return res.status(200).json({
      success: true,
      processedImage: processedImage.url,
      details: processedImage.details
    });
  } catch (error) {
    next(error);
  }
};
