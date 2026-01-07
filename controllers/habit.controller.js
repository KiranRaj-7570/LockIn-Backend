import Habit from "../models/Habit.js";
import HabitProgress from "../models/HabitProgress.js";
import { calculateProgress } from "../utils/progress.js";
import { getMonthYear } from "../utils/dateContext.js";

// CREATE HABIT
export const createHabit = async (req, res) => {
  try {
    const { name } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Habit name is required",
      });
    }

    if (name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: "Habit name must be less than 50 characters",
      });
    }

    // Create habit
    const habit = await Habit.create({
      user: req.user._id,
      name: name.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Habit created successfully",
      habitId: habit._id,
      name: habit.name,
      createdAt: habit.createdAt,
    });
  } catch (err) {
    console.error("Create habit error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create habit",
    });
  }
};

// GET HABITS WITH PROGRESS
export const getHabits = async (req, res) => {
  try {
    const { month, year } = getMonthYear(req.query.month, req.query.year);

    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    // Fetch habits and progress in parallel for better performance
    const [habits, progressDocs] = await Promise.all([
      Habit.find({
        user: req.user._id,
        isActive: true,
        createdAt: { $lte: endOfMonth },
      })
        .select("_id name createdAt")
        .lean()
        .sort({ createdAt: 1 }),
      HabitProgress.find({
        user: req.user._id,
        month,
        year,
      })
        .select("habit days")
        .lean(),
    ]);

    // Create progress map for O(1) lookup
    const progressMap = {};
    progressDocs.forEach((p) => {
      progressMap[p.habit.toString()] = p;
    });

    // Map habits with their progress
    const result = habits.map((habit) => {
      const progress = progressMap[habit._id.toString()];
      
      // Convert progress.days to plain object
      let days = {};
      if (progress && progress.days) {
        if (progress.days instanceof Map) {
          days = Object.fromEntries(progress.days);
        } else if (typeof progress.days === 'object') {
          days = progress.days;
        }
      }

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

    res.json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (err) {
    console.error("Get habits error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch habits",
    });
  }
};

// TOGGLE DAY
export const toggleDay = async (req, res) => {
  try {
    const { habitId } = req.params;
    const { day, month, year } = req.body;

    // Validation
    if (!day) {
      return res.status(400).json({
        success: false,
        message: "Day is required",
      });
    }

    if (day < 1 || day > 31) {
      return res.status(400).json({
        success: false,
        message: "Invalid day",
      });
    }

    // Verify habit exists and belongs to user
    const habit = await Habit.findOne(
      {
        _id: habitId,
        user: req.user._id,
        isActive: true,
      },
      { _id: 1 }
    ).lean();

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: "Habit not found",
      });
    }

    // Get or create progress document
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
        days: new Map(),
      });
    }

    // Toggle day
    const dayKey = String(day);
    const currentValue = progress.days.get(dayKey) || false;
    progress.days.set(dayKey, !currentValue);

    await progress.save();

    res.json({
      success: true,
      message: "Day toggled successfully",
      habitId,
      month,
      year,
      days: Object.fromEntries(progress.days),
    });
  } catch (err) {
    console.error("Toggle day error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to toggle day",
    });
  }
};

// DELETE HABIT
export const deleteHabit = async (req, res) => {
  try {
    const { habitId } = req.params;

    // Use findOneAndUpdate for atomic operation
    const habit = await Habit.findOneAndUpdate(
      {
        _id: habitId,
        user: req.user._id,
        isActive: true,
      },
      { isActive: false },
      { new: true }
    ).select("_id name");

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: "Habit not found",
      });
    }

    res.json({
      success: true,
      message: "Habit deleted successfully",
      habitId: habit._id,
    });
  } catch (err) {
    console.error("Delete habit error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete habit",
    });
  }
};

// GET HABIT START DATE
export const getHabitStart = async (req, res) => {
  try {
    const firstHabit = await Habit.findOne(
      {
        user: req.user._id,
        isActive: true,
      },
      { createdAt: 1 }
    )
      .lean()
      .sort({ createdAt: 1 });

    // Use first habit date or user creation date
    let startMonth, startYear;

    if (firstHabit) {
      startMonth = firstHabit.createdAt.getMonth() + 1;
      startYear = firstHabit.createdAt.getFullYear();
    } else {
      startMonth = req.user.createdAt.getMonth() + 1;
      startYear = req.user.createdAt.getFullYear();
    }

    res.json({
      success: true,
      startMonth,
      startYear,
    });
  } catch (err) {
    console.error("Get habit start error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get habit start date",
    });
  }
};