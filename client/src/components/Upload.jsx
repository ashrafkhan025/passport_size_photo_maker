import { useDropzone } from "react-dropzone";

const Upload = ({
  selectedFile,
  previewUrl,
  loading,
  onFileSelect,
  onRemoveBackground
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"]
    },
    maxFiles: 1,
    multiple: false,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];

      if (file) {
        onFileSelect(file);
      }
    }
  });

  return (
    <section className="panel upload-panel">
      <div className="section-heading">
        <span className="step-label">Step 1</span>
        <h2>Upload Photo</h2>
      </div>

      <div
        className={`upload-dropzone ${isDragActive ? "is-drag-active" : ""}`}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <span className="upload-icon">+</span>
        <strong>{selectedFile ? selectedFile.name : "Drop image here"}</strong>
        <small>or</small>
        <span className="upload-link">Click to Upload</span>
        <small>JPG, JPEG, PNG, or WEBP</small>
      </div>

      {previewUrl && (
        <div className="image-preview">
          <img src={previewUrl} alt="Selected upload preview" />
        </div>
      )}

      <button
        className="primary-button"
        type="button"
        disabled={!selectedFile || loading}
        onClick={onRemoveBackground}
      >
        {loading ? (
          <>
            <span className="spinner" />
            Removing Background
          </>
        ) : (
          "Remove Background"
        )}
      </button>
    </section>
  );
};

export default Upload;
