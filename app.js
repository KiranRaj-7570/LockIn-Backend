import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import habitRoutes from "./routes/habit.routes.js";

const app = express();

/* CORS MUST BE FIRST */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://lockin-frontend-g4luzx32z-kiran-raj-ks-projects.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);

export default app;
