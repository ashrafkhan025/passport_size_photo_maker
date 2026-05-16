import { useCallback, useState } from "react";
import CropEditor from "./CropEditor.jsx";

const EditPanel = ({ image }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, cropPixels) => {
    setCroppedAreaPixels(cropPixels);
  }, []);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
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
        <button className="ghost-button" type="button" onClick={handleReset}>
          Reset
        </button>
      </div>

      <CropEditor
        image={image}
        crop={crop}
        zoom={zoom}
        rotation={rotation}
        setCrop={setCrop}
        setZoom={setZoom}
        setRotation={setRotation}
        onCropComplete={onCropComplete}
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

      {croppedAreaPixels && (
        <p className="crop-meta">
          Crop area: {Math.round(croppedAreaPixels.width)} x{" "}
          {Math.round(croppedAreaPixels.height)} px
        </p>
      )}
    </section>
  );
};

export default EditPanel;
