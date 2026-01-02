import express from "express";
import protect from "../middleware/auth.middleware.js";
import { getHabits , createHabit , toggleDay , deleteHabit, getHabitStart} from "../controllers/habit.controller.js";

const router = express.Router();

router.get("/", protect, getHabits);
router.post("/", protect, createHabit); 
router.patch("/:habitId/toggle", protect, toggleDay);
router.delete("/:habitId", protect, deleteHabit);
router.get("/start", protect, getHabitStart);


export default router;
