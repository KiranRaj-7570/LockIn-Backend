import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import habitRoutes from "./routes/habit.routes.js";

const app = express();


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://lockin-frontend-nine.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);

export default app;
