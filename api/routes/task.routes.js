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

router.route("/projects/:projectId/tasks")
  .post(createTask)
  .get(getProjectTasks);

router.route("/tasks/:taskId")
  .get(getTaskDetails)
  .put(updateTask)
  .delete(deleteTask);


router.patch("/tasks/complete/:taskId", completeTask);
router.patch("/tasks/reset/:taskId", resetTask);

export default router;
