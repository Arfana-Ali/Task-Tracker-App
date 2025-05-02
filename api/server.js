import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
import connectDB from "./db/db.js"
import userRouter from "./routes/user.routes.js"
import taskRouter from "./routes/task.routes.js"
import projectRouter from "./routes/project.routes.js" // Import project routes
dotenv.config()
const app = express()

// CORS ko configure karenge
app.use(
  cors({
    origin: 'https://task-tracker-app-taupe.vercel.app', // frontend ka URL (e.g., http://localhost:5173)
    credentials: true, // Allow credentials like cookies
  }),
)

// Middleware for parsing JSON data
app.use(express.json()) // Middleware for parsing JSON data
app.use(cookieParser()) // Cookie parsing middleware

// Use the routes with /api prefix
app.use("/api/users", userRouter) // Use userRouter for handling routes
app.use("/api/tasks", taskRouter)
app.use("/api/projects", projectRouter) // Register project routes

// Default port for the server
const PORT = process.env.PORT || 8000

// Database call and starting the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`)
  })
})
