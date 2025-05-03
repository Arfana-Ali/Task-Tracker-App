import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
import connectDB from "./db/db.js"
import userRouter from "./routes/user.routes.js"
import taskRouter from "./routes/task.routes.js"
import projectRouter from "./routes/project.routes.js" 
dotenv.config()
const app = express()

// CORS configure 
app.use(
  cors({
    // for production
    origin: 'https://task-tracker-app-taupe.vercel.app', // frontend ka URL (e.g., http://localhost:5173)
    // for local
    // origin: process.env.CORS_ENV,
    credentials: true, 
  }),
)

// Middleware for parsing JSON data
app.use(express.json()) // Middleware for parsing JSON data
app.use(cookieParser()) // Cookie parsing middleware

// Use the routes with /api prefix
app.use("/api/users", userRouter) 
app.use("/api/tasks", taskRouter)
app.use("/api/projects", projectRouter) 

// Default port for the server
const PORT = process.env.PORT || 8000

// Database call and starting the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`)
  })
})
