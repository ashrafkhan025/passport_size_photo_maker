import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import removeBgRoutes from "./routes/removeBgRoutes.js";
import changeBackgroundRoutes from "./routes/changeBackgroundRoutes.js";
import generatePassportRoutes from "./routes/generatePassportRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "AI passport photo backend is healthy"
  });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "AI passport photo background removal API is running",
    endpoints: {
      health: "/health",
      removeBackground: "POST /api/remove-bg",
      changeBackground: "POST /api/change-background",
      generatePassport: "POST /api/generate-passport"
    }
  });
});

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/output", express.static(path.join(__dirname, "..", "output")));

app.use("/api", removeBgRoutes);
app.use("/api", changeBackgroundRoutes);
app.use("/api", generatePassportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
