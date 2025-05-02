import Router from "express";
import {
  createProject,
  getUserProjects,
  deleteProject
} from "../controllers/projectController.js";
import { verifyJWT } from "../middlewares/authmiddleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/")
  .post(createProject)
  .get(getUserProjects);

router.route("/:projectId")
  .delete(deleteProject);

export default router;
