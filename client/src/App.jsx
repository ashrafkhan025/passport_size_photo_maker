import { useEffect, useState } from "react";
import Upload from "./components/Upload.jsx";
import BackgroundSelector from "./components/BackgroundSelector.jsx";
import Result from "./components/Result.jsx";
import EditPanel from "./components/EditPanel.jsx";
import { changeBackground, removeBackground } from "./services/api.js";

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [processedImage, setProcessedImage] = useState("");
  const [activeColor, setActiveColor] = useState("");
  const [removeLoading, setRemoveLoading] = useState(false);
  const [loadingColor, setLoadingColor] = useState("");
  const [hasColorChange, setHasColorChange] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setProcessedImage("");
    setActiveColor("");
    setHasColorChange(false);
    setError("");
  };

  const handleRemoveBackground = async () => {
    if (!selectedFile) {
      setError("Please choose an image first.");
      return;
    }

    try {
      setRemoveLoading(true);
      setError("");

      const data = await removeBackground(selectedFile);
      if (!data.success || !data.processedImage) {
        throw new Error("The server did not return a processed image.");
      }

      setProcessedImage(data.processedImage);
      setActiveColor("");
      setHasColorChange(false);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to remove the background."));
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleColorChange = async (color) => {
    if (!processedImage) {
      setError("Remove the background before choosing a color.");
      return;
    }

    try {
      setLoadingColor(color);
      setError("");

      const data = await changeBackground({ imageUrl: processedImage, color });
      if (!data.success || !data.processedImage) {
        throw new Error("The server did not return an updated image.");
      }

      setProcessedImage(data.processedImage);
      setActiveColor(color);
      setHasColorChange(true);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to change the background color."));
    } finally {
      setLoadingColor("");
    }
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">AI Passport Photo</p>
          <h1>Passport Photo Studio</h1>
        </div>
        <p>
          Upload, remove the background, choose a compliant color, and fine tune
          the final crop.
        </p>
      </header>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      <div className="workspace-grid">
        <div className="left-stack">
          <Upload
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            loading={removeLoading}
            onFileSelect={handleFileSelect}
            onRemoveBackground={handleRemoveBackground}
          />

          {processedImage && (
            <BackgroundSelector
              activeColor={activeColor}
              loadingColor={loadingColor}
              onColorChange={handleColorChange}
            />
          )}
        </div>

        <div className="right-stack">
          <Result image={processedImage} />
          {hasColorChange && <EditPanel image={processedImage} />}
        </div>
      </div>
    </main>
  );
}

export default App;
