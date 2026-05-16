import mongoose from "mongoose";

const imageJobSchema = new mongoose.Schema(
  {
    originalImage: {
      filename: { type: String, required: true },
      path: { type: String, required: true },
      url: { type: String, required: true },
      mimetype: { type: String, required: true },
      size: { type: Number, required: true }
    },
    processedImage: {
      filename: { type: String },
      path: { type: String },
      url: { type: String }
    },
    provider: {
      type: String,
      default: "remove.bg"
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending"
    },
    errorMessage: {
      type: String
    }
  },
  { timestamps: true }
);

const ImageJob = mongoose.model("ImageJob", imageJobSchema);

export default ImageJob;
