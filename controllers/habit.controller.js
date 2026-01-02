import Habit from "../models/Habit.js";
import HabitProgress from "../models/HabitProgress.js";
import { calculateProgress } from "../utils/progress.js";
import { getMonthYear } from "../utils/dateContext.js";

export const createHabit = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Habit name is required" });
    }

    const habit = await Habit.create({
      user: req.user._id,
      name,
    });

    res.status(201).json(habit);
  } catch (err) {
    res.status(500).json({ message: "Failed to create habit" });
  }
};

export const getHabits = async (req, res) => {
  try {
    const { month, year } = getMonthYear(req.query.month, req.query.year);

    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const habits = await Habit.find({
      user: req.user._id,
      isActive: true,
      createdAt: { $lte: endOfMonth },
    }).sort({ createdAt: 1 });

    const progressDocs = await HabitProgress.find({
      user: req.user._id,
      month,
      year,
    });

    const progressMap = {};
    progressDocs.forEach((p) => {
      progressMap[p.habit.toString()] = p;
    });

    const result = habits.map((habit) => {
      const progress = progressMap[habit._id.toString()];
      const days = progress ? Object.fromEntries(progress.days) : {};

      const { completedDays, totalDaysInMonth, percentage } = calculateProgress(
        days,
        month,
        year
      );

      return {
        habitId: habit._id,
        name: habit.name,
        month,
        year,
        days,
        completedDays,
        totalDays: totalDaysInMonth,
        percentage,
      };
    });

    res.json(result);
  } catch {
    res.status(500).json({ message: "Failed to fetch habits" });
  }
};

export const toggleDay = async (req, res) => {
  try {
    const { habitId } = req.params;
    const { day } = req.body;
    const { month, year } = getMonthYear(req.body.month, req.body.year);

    if (!day) {
      return res.status(400).json({ message: "day is required" });
    }

    if (day < 1 || day > 31) {
      return res.status(400).json({ message: "Invalid day" });
    }

    const habit = await Habit.findOne({
      _id: habitId,
      user: req.user._id,
      isActive: true,
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    let progress = await HabitProgress.findOne({
      user: req.user._id,
      habit: habitId,
      month,
      year,
    });

    if (!progress) {
      progress = await HabitProgress.create({
        user: req.user._id,
        habit: habitId,
        month,
        year,
        days: {},
      });
    }

    const dayKey = String(day);
    const currentValue = progress.days.get(dayKey) || false;
    progress.days.set(dayKey, !currentValue);

    await progress.save();

    res.json({
      habitId,
      month,
      year,
      days: Object.fromEntries(progress.days),
    });
  } catch (err) {
    console.error("TOGGLE DAY ERROR:", err);
    res.status(500).json({ message: "Failed to toggle day" });
  }
};

export const deleteHabit = async (req, res) => {
  try {
    const { habitId } = req.params;

    const habit = await Habit.findOne({
      _id: habitId,
      user: req.user._id,
      isActive: true,
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    habit.isActive = false;
    await habit.save();

    res.json({ message: "Habit deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete habit" });
  }
};

export const getHabitStart = async (req, res) => {
  try {
    const firstHabit = await Habit.findOne({
      user: req.user._id,
      isActive: true,
    }).sort({ createdAt: 1 });

    // No habits yet → fallback to user creation date
    if (!firstHabit) {
      const user = req.user;
      return res.json({
        startMonth: user.createdAt.getMonth() + 1,
        startYear: user.createdAt.getFullYear(),
      });
    }

    const date = firstHabit.createdAt;

    res.json({
      startMonth: date.getMonth() + 1,
      startYear: date.getFullYear(),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to get habit start" });
  }
};
