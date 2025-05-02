import asyncHandler from "../utils/asyncHandler.js";
import { Project } from "../models/projectModels.js";
import { User } from "../models/userModels.js";
import { ApiError } from "../utils/Apierror.js";
import { ApiResponse } from "../utils/Apiresponse.js";

// Create a project
export const createProject = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user._id;

  if (!title?.trim()) {
    throw new ApiError(400, "Project name is important");
  }

  // Project Limit Check
  const projectCount = await Project.countDocuments({ user: userId });
  if (projectCount >= 4) {
    throw new ApiError(400, "A user can make upto 4 projects");
  }

  // create project
  const project = await Project.create({ title, description, user: userId });

  // join into users{project}
  await User.findByIdAndUpdate(userId, { $push: { projects: project._id } });

  res
    .status(201)
    .json(new ApiResponse(201, project, "Project Created Successfully"));
});

// Get all projects of the user
export const getUserProjects = asyncHandler(async (req, res) => {
  console.log("Helllo");
  console.log("Get User Projects", req.user);
  const projects = await Project.find({ user: req.user._id })
    .populate("tasks")
    .sort("-createdAt");
  console.log(projects);
  res
    .status(200)
    .json(new ApiResponse(200, projects, "Project List Found"));
});

// Delete the project
export const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  const project = await Project.findOneAndDelete({
    _id: projectId,
    user: userId,
  });

  if (!project) {
    throw new ApiError(404, "Project Not Found, Forbidden");
  }

  // remove from user's Project
  await User.findByIdAndUpdate(userId, { $pull: { projects: projectId } });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Project Deleted Successfully"));
});
