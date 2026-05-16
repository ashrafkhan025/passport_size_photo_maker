const Upload = ({
  selectedFile,
  previewUrl,
  loading,
  onFileSelect,
  onRemoveBackground
}) => {
  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <section className="panel upload-panel">
      <div className="section-heading">
        <span className="step-label">Step 1</span>
        <h2>Upload Photo</h2>
      </div>

      <label className="upload-dropzone">
        <input type="file" accept="image/*" onChange={handleChange} />
        <span className="upload-icon">+</span>
        <strong>{selectedFile ? selectedFile.name : "Choose an image"}</strong>
        <small>JPG, JPEG, or PNG</small>
      </label>

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
