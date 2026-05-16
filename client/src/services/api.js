import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 60000
});

export const removeBackground = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const { data } = await api.post("/remove-bg", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return data;
};

export const changeBackground = async ({ imageUrl, color }) => {
  const { data } = await api.post("/change-background", {
    imageUrl,
    color
  });

  return data;
};

export default api;
