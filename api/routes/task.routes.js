import { Router } from "express";
import {
  createTask,
  getProjectTasks,
  getTaskDetails,
  updateTask,
  deleteTask,
  completeTask,
  resetTask
} from "../controllers/taskController.js";
import { verifyJWT } from "../middlewares/authmiddleware.js";

const router = Router();

router.use(verifyJWT);

// प्रोजेक्ट के टास्क्स
router.route("/projects/:projectId/tasks")
  .post(createTask)
  .get(getProjectTasks);

// व्यक्तिगत टास्क ऑपरेशन्स
router.route("/tasks/:taskId")
  .get(getTaskDetails)
  .put(updateTask)
  .delete(deleteTask);

// स्पेशल ऑपरेशन्स
router.patch("/tasks/complete/:taskId", completeTask);
router.patch("/tasks/reset/:taskId", resetTask);

export default router;
