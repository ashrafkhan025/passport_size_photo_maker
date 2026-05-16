import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const removeBackground = async (file, { onProgress } = {}) => {
  if (!file) {
    throw new Error("Please choose an image first.");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await axios.post(`${API_BASE_URL}/api/remove-bg`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    },
    onUploadProgress: (event) => {
      if (!event.total || !onProgress) return;
      onProgress(Math.round((event.loaded * 100) / event.total));
    }
  });

  return response.data;
};

/*
React usage example:

const [loading, setLoading] = useState(false);
const [progress, setProgress] = useState(0);
const [result, setResult] = useState(null);
const [error, setError] = useState("");

const handleSubmit = async (file) => {
  setLoading(true);
  setError("");
  setProgress(0);

  try {
    const data = await removeBackground(file, { onProgress: setProgress });
    setResult(data);
  } catch (err) {
    setError(err.response?.data?.message || err.message || "Upload failed");
  } finally {
    setLoading(false);
  }
};
*/
