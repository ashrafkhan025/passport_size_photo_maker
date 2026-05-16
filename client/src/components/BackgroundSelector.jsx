const colors = [
  { name: "White", value: "white", swatch: "#ffffff" },
  { name: "Blue", value: "blue", swatch: "#8cc6f0" },
  { name: "Red", value: "red", swatch: "#ff0000" }
];

const BackgroundSelector = ({ activeColor, loadingColor, onColorChange }) => {
  return (
    <section className="panel">
      <div className="section-heading">
        <span className="step-label">Step 2</span>
        <h2>Background Color</h2>
      </div>

      <div className="color-grid">
        {colors.map((color) => (
          <button
            className={`color-button ${activeColor === color.value ? "selected" : ""}`}
            type="button"
            key={color.value}
            disabled={Boolean(loadingColor)}
            onClick={() => onColorChange(color.value)}
          >
            <span
              className="color-swatch"
              style={{ backgroundColor: color.swatch }}
              aria-hidden="true"
            />
            <span>{loadingColor === color.value ? "Applying..." : color.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default BackgroundSelector;
