const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getRadianAngle = (degreeValue) => {
  return (degreeValue * Math.PI) / 180;
};

export const drawCroppedImage = async ({
  canvas,
  imageSrc,
  cropRect,
  editorSize,
  imageLayout,
  imageOffset,
  zoom,
  rotation
}) => {
  if (!canvas || !cropRect || !editorSize || !imageLayout) {
    throw new Error("Crop area is not ready yet.");
  }

  const image = await createImage(imageSrc);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create a canvas context.");
  }

  const qualityScale = Math.max(1, image.naturalWidth / imageLayout.width);
  const outputWidth = Math.max(1, Math.round(cropRect.width * qualityScale));
  const outputHeight = Math.max(1, Math.round(cropRect.height * qualityScale));
  const stageCanvas = document.createElement("canvas");
  const stageContext = stageCanvas.getContext("2d");

  if (!stageContext) {
    throw new Error("Could not create a staging canvas context.");
  }

  canvas.width = outputWidth;
  canvas.height = outputHeight;
  stageCanvas.width = Math.round(editorSize.width * qualityScale);
  stageCanvas.height = Math.round(editorSize.height * qualityScale);

  stageContext.imageSmoothingEnabled = true;
  stageContext.imageSmoothingQuality = "high";
  stageContext.translate(
    (imageLayout.x + imageLayout.width / 2 + imageOffset.x) * qualityScale,
    (imageLayout.y + imageLayout.height / 2 + imageOffset.y) * qualityScale
  );
  stageContext.rotate(getRadianAngle(rotation));
  stageContext.scale(zoom, zoom);
  stageContext.drawImage(
    image,
    (-imageLayout.width * qualityScale) / 2,
    (-imageLayout.height * qualityScale) / 2,
    imageLayout.width * qualityScale,
    imageLayout.height * qualityScale
  );

  context.clearRect(0, 0, outputWidth, outputHeight);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    stageCanvas,
    cropRect.x * qualityScale,
    cropRect.y * qualityScale,
    cropRect.width * qualityScale,
    cropRect.height * qualityScale,
    0,
    0,
    outputWidth,
    outputHeight
  );
};

const getCroppedImg = async (options) => {
  const canvas = document.createElement("canvas");
  await drawCroppedImage({ ...options, canvas });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty."));
          return;
        }

        resolve(URL.createObjectURL(blob));
      },
      "image/png",
      1
    );
  });
};

export default getCroppedImg;
