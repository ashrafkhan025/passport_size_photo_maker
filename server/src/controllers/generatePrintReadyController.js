import { generatePrintReadySheet } from "../services/printReadyService.js";

export const generatePrintReadyController = async (req, res, next) => {
  try {
    const sheet = await generatePrintReadySheet(req.printReadySheet);

    return res.status(200).json({
      success: true,
      image: sheet.image,
      processedImage: sheet.processedImage,
      pdf: sheet.pdf,
      details: sheet.details
    });
  } catch (error) {
    next(error);
  }
};
