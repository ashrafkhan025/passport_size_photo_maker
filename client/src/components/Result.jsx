const Result = ({ image }) => {
  if (!image) {
    return (
      <section className="panel result-panel empty-state">
        <div>
          <span className="step-label">Result</span>
          <h2>Your processed photo will appear here</h2>
          <p>Upload an image and remove the background to start editing.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel result-panel">
      <div className="section-heading">
        <span className="step-label">Result</span>
        <h2>Processed Image</h2>
      </div>

      <div className="result-frame">
        <img src={image} alt="Processed passport photo" />
      </div>

      <a className="download-link" href={image} target="_blank" rel="noreferrer">
        Open Full Image
      </a>
    </section>
  );
};

export default Result;
