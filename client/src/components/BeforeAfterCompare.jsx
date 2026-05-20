import ReactCompareImage from "react-compare-image";

const BeforeAfterCompare = ({ originalImage, processedImage }) => {
  if (!originalImage || !processedImage) {
    return null;
  }

  return (
    <section className="panel compare-panel">
      <div className="section-heading">
        <span className="step-label">Before | After</span>
        <h2>Compare Result</h2>
      </div>

      <div className="compare-frame">
        <ReactCompareImage
          leftImage={originalImage}
          rightImage={processedImage}
          leftImageLabel="Before"
          rightImageLabel="After"
          sliderLineColor="#ffffff"
          handleSize={42}
        />
      </div>
    </section>
  );
};

export default BeforeAfterCompare;
