import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import AppError from "../utils/AppError.js";

const removeBgApiUrl = process.env.BG_REMOVE_API_URL || "https://api.remove.bg/v1.0/removebg";

const parseProviderData = (data) => {
  if (!data) return null;

  if (Buffer.isBuffer(data)) {
    try {
      return JSON.parse(data.toString("utf8"));
    } catch {
      return null;
    }
  }

  return data;
};

const mapProviderError = (error) => {
  const status = error.response?.status;
  const providerData = parseProviderData(error.response?.data);
  const providerMessage =
    providerData?.errors?.[0]?.title ||
    providerData?.message ||
    error.message ||
    "Background removal API failed";

  if (status === 400) {
    return new AppError(`Background removal failed: ${providerMessage}`, 400, "BG_API_BAD_REQUEST");
  }

  if (status === 401 || status === 403) {
    return new AppError("Background removal API authentication failed.", 502, "BG_API_AUTH_FAILED");
  }

  if (status === 402 || status === 429) {
    return new AppError("Background removal API rate limit or quota has been reached.", 429, "BG_API_RATE_LIMIT");
  }

  if (status && status >= 500) {
    return new AppError("Background removal provider is temporarily unavailable.", 502, "BG_API_UNAVAILABLE");
  }

  return new AppError(`Background removal failed: ${providerMessage}`, 502, "BG_API_FAILURE");
};

export const removeBackground = async (inputFilePath) => {
  const apiKey = process.env.BG_REMOVE_API_KEY;

  if (!apiKey) {
    throw new AppError("BG_REMOVE_API_KEY is missing from environment variables.", 500, "BG_API_KEY_MISSING");
  }

  const form = new FormData();
  form.append("image_file", fs.createReadStream(inputFilePath));
  form.append("size", "auto");
  form.append("format", "png");

  try {
    const response = await axios.post(removeBgApiUrl, form, {
      headers: {
        ...form.getHeaders(),
        "X-Api-Key": apiKey
      },
      responseType: "arraybuffer",
      timeout: 60000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    return Buffer.from(response.data);
  } catch (error) {
    throw mapProviderError(error);
  }
};
