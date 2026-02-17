import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/task_collab",
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};
