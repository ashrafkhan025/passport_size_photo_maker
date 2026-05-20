const PrintReadySection = ({ passportSheet, passportPdf }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="panel result-panel print-ready-panel">
      <div className="section-heading">
        <h2>Printable Passport Sheet</h2>
      </div>

      {passportSheet ? (
        <>
          <div className="result-frame print-ready-frame">
            <img
              key={passportSheet}
              src={`${passportSheet}?v=${Date.now()}`}
              alt="passport-sheet"
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain"
              }}
              onLoad={() => console.log("Loaded:", passportSheet)}
            />
          </div>

          <div className="print-ready-actions">
            <button className="download-link print-now-button" type="button" onClick={handlePrint}>
              Print Now
            </button>

            <a
              className="download-link"
              href={passportSheet}
              download
              target="_blank"
              rel="noreferrer"
            >
              Download PNG
            </a>

            {passportPdf && (
              <a
                className="download-link"
                href={passportPdf}
                download
                target="_blank"
                rel="noreferrer"
              >
                Download PDF
              </a>
            )}
          </div>
        </>
      ) : (
        <p className="print-ready-empty">
          Generate passport copies to preview the print-ready sheet.
        </p>
      )}
    </section>
  );
};

export default PrintReadySection;
