import { useState } from "react";
import CropEditor from "./CropEditor.jsx";
import getCroppedImg from "../utils/getCroppedImg.js";

const EditPanel = ({ image, onApplyCrop }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [editorSize, setEditorSize] = useState({ width: 0, height: 0 });
  const [imageLayout, setImageLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  });
  const [applyLoading, setApplyLoading] = useState(false);
  const [cropError, setCropError] = useState("");

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCropRect((current) => ({
      ...current,
      x: Math.max(0, Math.round((editorSize.width - current.width) / 2)),
      y: Math.max(0, Math.round((editorSize.height - current.height) / 2))
    }));
    setCropError("");
  };

  const handleApplyCrop = async () => {
    try {
      setApplyLoading(true);
      setCropError("");

      const croppedImage = await getCroppedImg({
        imageSrc: image,
        cropRect,
        editorSize,
        imageLayout,
        imageOffset: crop,
        zoom,
        rotation
      });

      onApplyCrop(croppedImage);
    } catch (error) {
      setCropError(error.message || "Unable to apply crop.");
    } finally {
      setApplyLoading(false);
    }
  };

  if (!image) {
    return null;
  }

  return (
    <section className="panel edit-panel">
      <div className="section-heading with-action">
        <div>
          <span className="step-label">Step 3</span>
          <h2>Edit Photo</h2>
        </div>
        <div className="edit-actions">
          <button className="ghost-button" type="button" onClick={handleReset}>
            Reset
          </button>
          <button
            className="apply-button"
            type="button"
            disabled={!cropRect.width || applyLoading}
            onClick={handleApplyCrop}
          >
            {applyLoading ? "Applying..." : "Apply Crop"}
          </button>
        </div>
      </div>

      <CropEditor
        image={image}
        crop={crop}
        zoom={zoom}
        rotation={rotation}
        cropRect={cropRect}
        editorSize={editorSize}
        imageLayout={imageLayout}
        setCrop={setCrop}
        setCropRect={setCropRect}
        setEditorSize={setEditorSize}
        setImageLayout={setImageLayout}
      />

      <div className="control-grid">
        <label className="range-control">
          <span>Zoom</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
          <strong>{zoom.toFixed(2)}x</strong>
        </label>

        <label className="range-control">
          <span>Rotate</span>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={rotation}
            onChange={(event) => setRotation(Number(event.target.value))}
          />
          <strong>{rotation}deg</strong>
        </label>
      </div>

      {cropError && (
        <p className="crop-error" role="alert">
          {cropError}
        </p>
      )}

      {cropRect.width > 0 && (
        <p className="crop-meta">
          Crop area: {Math.round(cropRect.width)} x {Math.round(cropRect.height)} px
        </p>
      )}
    </section>
  );
};

export default EditPanel;
