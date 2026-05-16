import { useEffect, useMemo, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { drawCroppedImage } from "../utils/getCroppedImg.js";

const minCropSize = 88;

const CropEditor = ({
  image,
  crop,
  zoom,
  rotation,
  cropRect,
  editorSize,
  imageLayout,
  setCrop,
  setCropRect,
  setEditorSize,
  setImageLayout
}) => {
  const shellRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ pointerX: 0, pointerY: 0, cropX: 0, cropY: 0 });

  useEffect(() => {
    if (!shellRef.current) {
      return undefined;
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setEditorSize({
        width: Math.round(width),
        height: Math.round(height)
      });
    });

    observer.observe(shellRef.current);

    return () => observer.disconnect();
  }, [setEditorSize]);

  useEffect(() => {
    let cancelled = false;

    const measureImage = () => {
      if (!editorSize.width || !editorSize.height) {
        return;
      }

      const imageElement = new Image();
      imageElement.onload = () => {
        if (cancelled) {
          return;
        }

        const editorRatio = editorSize.width / editorSize.height;
        const imageRatio = imageElement.naturalWidth / imageElement.naturalHeight;
        const width =
          imageRatio > editorRatio
            ? editorSize.width * 0.78
            : editorSize.height * 0.78 * imageRatio;
        const height = width / imageRatio;

        setImageLayout({
          x: Math.round((editorSize.width - width) / 2),
          y: Math.round((editorSize.height - height) / 2),
          width: Math.round(width),
          height: Math.round(height)
        });
      };
      imageElement.crossOrigin = "anonymous";
      imageElement.src = image;
    };

    measureImage();

    return () => {
      cancelled = true;
    };
  }, [editorSize, image, setImageLayout]);

  useEffect(() => {
    if (!editorSize.width || !editorSize.height || cropRect.width) {
      return;
    }

    const width = Math.min(240, Math.round(editorSize.width * 0.5));
    const height = Math.round(width * (45 / 35));

    setCropRect({
      x: Math.round((editorSize.width - width) / 2),
      y: Math.round((editorSize.height - height) / 2),
      width,
      height
    });
  }, [cropRect.width, editorSize, setCropRect]);

  useEffect(() => {
    let cancelled = false;

    const drawPreview = async () => {
      if (
        !previewCanvasRef.current ||
        !cropRect.width ||
        !editorSize.width ||
        !imageLayout.width
      ) {
        return;
      }

      await drawCroppedImage({
        canvas: previewCanvasRef.current,
        imageSrc: image,
        cropRect,
        editorSize,
        imageLayout,
        imageOffset: crop,
        zoom,
        rotation
      });

      if (cancelled) {
        return;
      }
    };

    drawPreview().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [crop, cropRect, editorSize, image, imageLayout, rotation, zoom]);

  const overlayStyle = useMemo(() => {
    const right = Math.max(0, editorSize.width - cropRect.x - cropRect.width);
    const bottom = Math.max(0, editorSize.height - cropRect.y - cropRect.height);

    return {
      top: { left: 0, top: 0, width: "100%", height: cropRect.y },
      bottom: { left: 0, top: cropRect.y + cropRect.height, width: "100%", height: bottom },
      left: { left: 0, top: cropRect.y, width: cropRect.x, height: cropRect.height },
      right: {
        left: cropRect.x + cropRect.width,
        top: cropRect.y,
        width: right,
        height: cropRect.height
      }
    };
  }, [cropRect, editorSize]);

  const handlePanStart = (event) => {
    if (event.button !== 0 || event.target.closest(".crop-rnd")) {
      return;
    }

    setIsPanning(true);
    panStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      cropX: crop.x,
      cropY: crop.y
    };
  };

  const handlePanMove = (event) => {
    if (!isPanning) {
      return;
    }

    setCrop({
      x: panStartRef.current.cropX + event.clientX - panStartRef.current.pointerX,
      y: panStartRef.current.cropY + event.clientY - panStartRef.current.pointerY
    });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  return (
    <div className="crop-layout">
      <div
        className={`cropper-shell ${isPanning ? "is-panning" : ""}`}
        ref={shellRef}
        onPointerDown={handlePanStart}
        onPointerMove={handlePanMove}
        onPointerUp={handlePanEnd}
        onPointerLeave={handlePanEnd}
      >
        {imageLayout.width > 0 && (
          <img
            className="crop-stage-image"
            src={image}
            alt="Editable passport crop"
            draggable="false"
            style={{
              left: imageLayout.x + imageLayout.width / 2 + crop.x,
              top: imageLayout.y + imageLayout.height / 2 + crop.y,
              width: imageLayout.width,
              height: imageLayout.height,
              transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${zoom})`
            }}
          />
        )}

        <div className="crop-dark-overlay" style={overlayStyle.top} />
        <div className="crop-dark-overlay" style={overlayStyle.bottom} />
        <div className="crop-dark-overlay" style={overlayStyle.left} />
        <div className="crop-dark-overlay" style={overlayStyle.right} />

        {cropRect.width > 0 && (
          <Rnd
            className="crop-rnd"
            bounds="parent"
            size={{
              width: cropRect.width,
              height: cropRect.height
            }}
            position={{
              x: cropRect.x,
              y: cropRect.y
            }}
            minWidth={minCropSize}
            minHeight={minCropSize}
            onDrag={(_, data) => {
              setCropRect((current) => ({
                ...current,
                x: Math.round(data.x),
                y: Math.round(data.y)
              }));
            }}
            onDragStop={(_, data) => {
              setCropRect((current) => ({
                ...current,
                x: Math.round(data.x),
                y: Math.round(data.y)
              }));
            }}
            onResize={(_, __, ref, ___, position) => {
              setCropRect({
                x: Math.round(position.x),
                y: Math.round(position.y),
                width: Math.round(ref.offsetWidth),
                height: Math.round(ref.offsetHeight)
              });
            }}
            onResizeStop={(_, __, ref, ___, position) => {
              setCropRect({
                x: Math.round(position.x),
                y: Math.round(position.y),
                width: Math.round(ref.offsetWidth),
                height: Math.round(ref.offsetHeight)
              });
            }}
            enableResizing={{
              top: true,
              right: true,
              bottom: true,
              left: true,
              topRight: true,
              bottomRight: true,
              bottomLeft: true,
              topLeft: true
            }}
            resizeHandleClasses={{
              top: "rnd-handle side top",
              right: "rnd-handle side right",
              bottom: "rnd-handle side bottom",
              left: "rnd-handle side left",
              topRight: "rnd-handle corner top-right",
              bottomRight: "rnd-handle corner bottom-right",
              bottomLeft: "rnd-handle corner bottom-left",
              topLeft: "rnd-handle corner top-left"
            }}
          >
            <div className="crop-box" />
          </Rnd>
        )}
      </div>

      <div className="live-preview-wrap">
        <span className="preview-label">Live Preview</span>
        <div className="live-preview">
          <canvas ref={previewCanvasRef} aria-label="Live crop preview" />
        </div>
      </div>
    </div>
  );
};

export default CropEditor;
