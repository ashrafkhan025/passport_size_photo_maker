import { useEffect, useState } from "react";
import Upload from "./components/Upload.jsx";
import BackgroundSelector from "./components/BackgroundSelector.jsx";
import Result from "./components/Result.jsx";
import EditPanel from "./components/EditPanel.jsx";
import PrintReadySection from "./components/PrintReadySection.jsx";
import BeforeAfterCompare from "./components/BeforeAfterCompare.jsx";
import { changeBackground, generatePrintReady, removeBackground } from "./services/api.js";

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

const withCacheBuster = (imageUrl) => `${imageUrl}?t=${Date.now()}`;

const blobUrlToDataUrl = async (blobUrl) => {
  const response = await fetch(blobUrl);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [processedImage, setProcessedImage] = useState("");
  const [editedImage, setEditedImage] = useState("");
  const [passportSheet, setPassportSheet] = useState("");
  const [passportPdf, setPassportPdf] = useState("");
  const [country, setCountry] = useState("india");
  const [selectedCopies, setSelectedCopies] = useState(6);
  const [paperSize, setPaperSize] = useState("4x6");
  const [customPaper, setCustomPaper] = useState({ width: "4", height: "6" });
  const [showCutLines, setShowCutLines] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [activeColor, setActiveColor] = useState("");
  const [removeLoading, setRemoveLoading] = useState(false);
  const [passportLoading, setPassportLoading] = useState(false);
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

  useEffect(() => {
    console.log(passportSheet);
  }, [passportSheet]);

  useEffect(() => {
    console.log("Selected copies:", selectedCopies);
  }, [selectedCopies]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setProcessedImage("");
    setEditedImage("");
    setPassportSheet("");
    setPassportPdf("");
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

      setProcessedImage(withCacheBuster(data.processedImage));
      setEditedImage("");
      setPassportSheet("");
      setPassportPdf("");
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

      setProcessedImage(withCacheBuster(data.processedImage));
      setEditedImage("");
      setPassportSheet("");
      setPassportPdf("");
      setActiveColor(color);
      setHasColorChange(true);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to change the background color."));
    } finally {
      setLoadingColor("");
    }
  };

  const handleApplyCrop = (croppedImage) => {
    setEditedImage(croppedImage);
    setPassportSheet("");
    setPassportPdf("");
  };

  const handleStartOver = () => {
    if (!window.confirm("Start over? Current work will be lost.")) {
      return;
    }

    setSelectedFile(null);
    setProcessedImage("");
    setEditedImage("");
    setPassportSheet("");
    setPassportPdf("");
    setCountry("india");
    setSelectedCopies(6);
    setPaperSize("4x6");
    setCustomPaper({ width: "4", height: "6" });
    setShowCutLines(false);
    setActiveColor("");
    setRemoveLoading(false);
    setPassportLoading(false);
    setLoadingColor("");
    setHasColorChange(false);
    setError("");
    setResetToken((current) => current + 1);
  };

  const handleGeneratePassport = async () => {
    const editorImage = editedImage || processedImage;

    if (!editorImage) {
      setError("Create or edit a passport photo before generating copies.");
      return;
    }

    try {
      setPassportLoading(true);
      setError("");
      setPassportSheet("");
      setPassportPdf("");
      console.log("Selected copies:", selectedCopies);

      const imageUrl = editorImage.startsWith("blob:")
        ? await blobUrlToDataUrl(editorImage)
        : editorImage;
      console.log("Sending:", {
        copies: selectedCopies,
        paperSize
      });
      const data = await generatePrintReady({
        imageUrl,
        country,
        copies: selectedCopies,
        paperSize,
        width: paperSize === "custom" ? customPaper.width : undefined,
        height: paperSize === "custom" ? customPaper.height : undefined,
        showCutLines
      });
      console.log("API response:", data);
      if (!data.success || !data.image) {
        throw new Error("The server did not return a passport sheet.");
      }

      setPassportPdf(data.pdf || "");
      setTimeout(() => {
        setPassportSheet(data.image);
      }, 50);
    } catch (err) {
      console.log(err);
      setError(getErrorMessage(err, "Unable to generate the passport sheet."));
    } finally {
      setPassportLoading(false);
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

      <section>
        <div className="section-heading">
          <h2>Image Editor</h2>
        </div>

        <div className="workspace-grid">
          <div className="left-stack">
            <Upload
              key={`upload-${resetToken}`}
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
            <Result image={editedImage || processedImage} />
            {previewUrl && processedImage && (
              <BeforeAfterCompare originalImage={previewUrl} processedImage={processedImage} />
            )}
            {hasColorChange && (
              <EditPanel
                key={`editor-${resetToken}`}
                image={editedImage || processedImage}
                onApplyCrop={handleApplyCrop}
              />
            )}
          </div>
        </div>

        <div className="start-over-actions">
          <button className="start-over-button" type="button" onClick={handleStartOver}>
            Start Over
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Passport Options</h2>
        </div>

        <div className="control-grid">
          <label className="range-control">
            <span>Country</span>
            <select value={country} onChange={(event) => setCountry(event.target.value)}>
              <option value="india">India</option>
              <option value="us">US</option>
              <option value="canada">Canada</option>
            </select>
          </label>

          <div className="range-control">
            <span>Copies</span>
            <div className="copy-button-group">
              {[3, 6, 9, 12].map((num) => (
                <button
                  className={`ghost-button ${selectedCopies === num ? "selected" : ""}`}
                  key={num}
                  type="button"
                  onClick={() => setSelectedCopies(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="range-control paper-size-control">
            <span>Paper Size</span>
            <div className="copy-button-group">
              {[
                { value: "4x6", label: "4x6 Photo Paper" },
                { value: "a4", label: "A4" },
                { value: "letter", label: "Letter" },
                { value: "custom", label: "Custom" }
              ].map((option) => (
                <button
                  className={`ghost-button ${paperSize === option.value ? "selected" : ""}`}
                  key={option.value}
                  type="button"
                  onClick={() => setPaperSize(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {paperSize === "custom" && (
            <div className="range-control custom-paper-control">
              <span>Custom</span>
              <input
                min="1"
                step="0.1"
                type="number"
                value={customPaper.width}
                onChange={(event) =>
                  setCustomPaper((current) => ({ ...current, width: event.target.value }))
                }
                aria-label="Custom paper width in inches"
              />
              <input
                min="1"
                step="0.1"
                type="number"
                value={customPaper.height}
                onChange={(event) =>
                  setCustomPaper((current) => ({ ...current, height: event.target.value }))
                }
                aria-label="Custom paper height in inches"
              />
            </div>
          )}

          <div className="range-control cut-lines-control">
            <span>Show Cut Lines</span>
            <div className="toggle-button-group" role="group" aria-label="Show cut lines">
              <button
                className={`ghost-button ${showCutLines ? "selected" : ""}`}
                type="button"
                onClick={() => setShowCutLines(true)}
              >
                ON
              </button>
              <button
                className={`ghost-button ${!showCutLines ? "selected" : ""}`}
                type="button"
                onClick={() => setShowCutLines(false)}
              >
                OFF
              </button>
            </div>
          </div>
        </div>

        <button
          className="primary-button"
          type="button"
          disabled={passportLoading || !(editedImage || processedImage)}
          onClick={handleGeneratePassport}
        >
          {passportLoading && <span className="spinner" aria-hidden="true" />}
          {passportLoading ? "Generating..." : "Generate Passport Sheet"}
        </button>
      </section>

      <PrintReadySection passportSheet={passportSheet} passportPdf={passportPdf} />
    </main>
  );
}

export default App;
