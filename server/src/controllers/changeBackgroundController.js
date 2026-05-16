import { changeBackgroundColor } from "../services/backgroundColorService.js";

export const changeBackgroundController = async (req, res, next) => {
  try {
    const processedImage = await changeBackgroundColor({
      imageUrl: req.body?.imageUrl,
      color: req.body?.color
    });

    return res.status(200).json({
      success: true,
      processedImage: processedImage.url
    });
  } catch (error) {
    next(error);
  }
};
