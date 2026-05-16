import Cropper from "react-easy-crop";

const CropEditor = ({
  image,
  crop,
  zoom,
  rotation,
  setCrop,
  setZoom,
  setRotation,
  onCropComplete
}) => {
  return (
    <div className="crop-layout">
      <div className="cropper-shell">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={35 / 45}
          showGrid
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="live-preview-wrap">
        <span className="preview-label">Live Preview</span>
        <div className="live-preview">
          <img
            src={image}
            alt="Live crop preview"
            style={{
              transform: `translate(${crop.x}px, ${crop.y}px) rotate(${rotation}deg) scale(${zoom})`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CropEditor;
