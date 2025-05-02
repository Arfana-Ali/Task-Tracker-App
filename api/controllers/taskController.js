import asyncHandler from "../utils/asyncHandler.js";
import Task from "../models/taskModels.js";
import { ApiError } from "../utils/Apierror.js";
import { ApiResponse } from "../utils/Apiresponse.js";

// =============================================
//                  TASK CRUD
// =============================================

// Create Task
export const createTask = asyncHandler(async (req, res) => {
  const { title, description, dueDate } = req.body;
  const userId = req.user._id;
  const { projectId } = req.params;

  // Validation
  if (!title?.trim()) {
    throw new ApiError(400, "Title is required");
  }

  const task = await Task.create({
    title,
    description,
    dueDate,
    project: projectId,
    user: userId,
    status: "todo",
  });

  res.status(201).json(new ApiResponse(201, task, "Task created successfully"));
});

// Get All Tasks in Project
export const getProjectTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const tasks = await Task.find({ project: projectId })
    .populate("user", "name email")
    .sort("-createdAt");

  res
    .status(200)
    .json(
      new ApiResponse(200, { count: tasks.length, tasks }, "Tasks fetched")
    );
});

// Get Single Task
export const getTaskDetails = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId)
    .populate("user", "name")
    .populate("project", "title");

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  res.status(200).json(new ApiResponse(200, task, "Task details fetched"));
});

// Update Task
export const updateTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const updates = req.body;
  const userId = req.user._id;

  // Authorization Check
  const task = await Task.findOne({ _id: taskId, user: userId });
  if (!task) {
    throw new ApiError(403, "Permission denied");
  }

  // Auto-set completion date
  if (updates.status === "completed" && !task.completedAt) {
    updates.completedAt = new Date();
  }

  const updatedTask = await Task.findByIdAndUpdate(taskId, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(new ApiResponse(200, updatedTask, "Task updated"));
});

// Delete Task
export const deleteTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user._id;

  const task = await Task.findOneAndDelete({
    _id: taskId,
    user: userId,
  });

  if (!task) {
    throw new ApiError(404, "Task not found or unauthorized");
  }

  res.status(200).json(new ApiResponse(200, null, "Task deleted"));
});

// =============================================
//             SPECIAL OPERATIONS
// =============================================

// Mark Task as Complete
export const completeTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user._id;

  const task = await Task.findOneAndUpdate(
    { _id: taskId, user: userId },
    {
      status: "completed",
      completedAt: new Date(),
    },
    { new: true }
  );

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  res.status(200).json(new ApiResponse(200, task, "Task marked complete"));
});

// Move Task Back to Todo
export const resetTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user._id;

  const task = await Task.findOneAndUpdate(
    { _id: taskId, user: userId },
    {
      status: "todo",
      completedAt: null,
    },
    { new: true }
  );

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  res.status(200).json(new ApiResponse(200, task, "Task reset to todo"));
});
