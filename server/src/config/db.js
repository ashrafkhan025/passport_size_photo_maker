import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn("MONGO_URI is missing. Continuing without database logging.");
    return false;
  }

  mongoose.set("strictQuery", true);

  try {
    const connection = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return true;
  } catch (error) {
    if (process.env.DB_REQUIRED === "true") {
      throw error;
    }

    console.warn(`MongoDB unavailable. Continuing without database logging: ${error.message}`);
    return false;
  }
};

export default connectDB;
