import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/userModels.js";
import Task from "../models/taskModels.js";
import uploadOnCloudinary from "../utils/cloudinaryConfig.js";
import { ApiResponse } from "../utils/Apiresponse.js";

// User Registration (signup)
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, country } = req.body;

  // Check if the email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Get the local path of the uploaded avatar
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    return res.status(400).json({
      message: "Avatar file is required",
    });
  }

  // Upload avatar to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar || !avatar.url) {
    console.error("Cloudinary upload failed");
    return res.status(500).json({
      message: "Failed to upload avatar",
    });
  }

  // Create a new user (role jo hai wo bydefault user rahega)
  const newUser = await User.create({
    name,
    email,
    password,
    country,
    avatar: avatar.url,
  });

  // Generate tokens
  const accessToken = newUser.generateAccessToken();
  const refreshToken = newUser.generateRefreshToken();

  // Save tokens in the database
  newUser.accessToken = accessToken;
  newUser.refreshToken = refreshToken;
  await newUser.save();

  // Send response with tokens and user info
  res.status(201).json({
    message: "User registered successfully",
    accessToken,
    refreshToken,
    user: {
      name: newUser.name,
      email: newUser.email,
      country: newUser.country,
      role: newUser.role, 
      avatar: newUser.avatar,
    },
  });
});


export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log("Email", email, "Password", password);
  // Find user by email
  const user = await User.findOne({ email });
  if (!user || !(await user.isPasswordCorrect(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Set refresh token in cookies
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Send response with task summary and tasks
  res.status(200).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
    message: "Login successful",
    accessToken,
    refreshToken,
  });
});

// User Logout
export const logoutUser = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Remove tokens from database
  user.accessToken = null;
  user.refreshToken = null;
  await user.save();

  // Clear refresh token cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
  });

  // Send response
  res.status(200).json({
    message: "Logout successful",
  });
});


export const getUserTasks = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  const tasks = await Task.find({ user: userId }).populate("project", "title");

  const summary = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  res
    .status(200)
    .json(new ApiResponse(200, { summary, tasks }, "टास्क्स प्राप्त हुए"));
});
