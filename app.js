import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import habitRoutes from "./routes/habit.routes.js";

const app = express();

/* CORS MUST BE FIRST */
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like curl, mobile apps)
      if (!origin) return callback(null, true);

      // allow all vercel preview + production domains
      if (
        origin.startsWith("http://localhost") ||
        origin.includes("vercel.app")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);

export default app;
