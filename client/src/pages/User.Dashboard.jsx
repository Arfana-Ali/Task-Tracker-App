"use client";

import * as XLSX from "xlsx";
import { useForm } from "react-hook-form";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ModeToggle } from "@/components/mode-toggle";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormMessage,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { Calendar, Plus, Trash2, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import TailwindLoadingSpinner from "@/components/TailwindLoadingSpinner";
import { toast } from "sonner";

// Utility function to extract data from API responses
const extractApiData = (response) => {
  // Check if the response follows your API structure with data nested in data.data
  if (response.data && response.data.data !== undefined) {
    return response.data.data;
  }
  // Check if the response has data property that might contain the array directly
  else if (response.data !== undefined) {
    return response.data;
  }
  // Fallback to empty array/object
  return Array.isArray(response.data) ? [] : {};
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 },
  },
};

const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

const projectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
});

const AnimatedNumber = ({ value }) => (
  <motion.span
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    {value}
  </motion.span>
);

const gradients = [
  "from-[#ee0979] to-[#ff6a00]",
  "from-[#6a11cb] to-[#2575fc]",
  "from-[#007e33] to-[#76ff03]",
];

export default function UserDashboardPage() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskSummary, setTaskSummary] = useState({
    total_Tasks: 0,
    Tasks_todo: 0,
    completed_Tasks: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [apiError, setApiError] = useState(null);
  const [isTaskActionLoading, setIsTaskActionLoading] = useState(false);
  const [actionLoadingTaskId, setActionLoadingTaskId] = useState(null);
  const [isProjectActionLoading, setIsProjectActionLoading] = useState(false);
  const [actionLoadingProjectId, setActionLoadingProjectId] = useState(null);

  const tasksPerPage = 5;
  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:5000/api";

  const projectForm = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: { title: "", description: "" },
  });

  const taskForm = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: "", description: "", dueDate: "" },
  });

  const calculateTaskSummary = useCallback(
    (tasks) => ({
      total: tasks.length,
      todo: tasks.filter((task) => task.status === "todo").length,
      completed: tasks.filter((task) => task.status === "completed").length,
    }),
    []
  );

  const fetchUserData = useCallback(async () => {
    const accessToken = localStorage.getItem("accessToken");
    console.log(accessToken);
    if (!accessToken) return navigate("/login");

    try {
      setApiError(null);
      setIsProjectsLoading(true);
      console.log("Fetching projects from:", `${API_BASE_URL}/projects`);
      const projectsResponse = await axios.get(`${API_BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Add debugging to see the actual response structure
      console.log("Projects API Response:", projectsResponse);
      console.log(projectsResponse.data);
      console.log("Projects API Response structure:", {
        hasData: !!projectsResponse.data,
        dataType: typeof projectsResponse.data,
        isArray: Array.isArray(projectsResponse.data),
        hasNestedData: projectsResponse.data && !!projectsResponse.data.data,
        nestedDataType:
          projectsResponse.data && typeof projectsResponse.data.data,
        isNestedArray:
          projectsResponse.data && Array.isArray(projectsResponse.data.data),
      });

      // Use the utility function to extract data
      const projectsData = extractApiData(projectsResponse);
      console.log("Extracted projects data:", projectsData);

      setProjects(Array.isArray(projectsData) ? projectsData : []);
      console.log(
        "Final projects state:",
        Array.isArray(projectsData) ? projectsData : []
      );
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      console.error("Error details:", error.response || error.message);
      setApiError("Failed to load dashboard data. Please try again.");
      if (error.response?.status === 401) navigate("/login");
      setIsLoading(false);
    } finally {
      setIsProjectsLoading(false);
    }
  }, [navigate]);

  const fetchProjectTasks = useCallback(
    async (projectId) => {
      const accessToken = localStorage.getItem("accessToken");
      try {
        setApiError(null);
        setIsTasksLoading(true);
        console.log("Fetching tasks for project:", projectId);
        const response = await axios.get(
          `${API_BASE_URL}/tasks/projects/${projectId}/tasks`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        console.log("Project tasks response:", response);

        // Use the utility function to extract data
        const tasksData = extractApiData(response);

        // Handle the case where tasks might be nested in a 'tasks' property
        const projectTasks = tasksData.tasks || tasksData;
        console.log("Extracted tasks:", projectTasks);

        setTasks(Array.isArray(projectTasks) ? projectTasks : []);
        setTaskSummary(
          calculateTaskSummary(Array.isArray(projectTasks) ? projectTasks : [])
        );
      } catch (error) {
        console.error("Error fetching project tasks:", error);
        console.error("Error details:", error.response || error.message);
        setApiError("Failed to load project tasks. Please try again.");
      } finally {
        setIsTasksLoading(false);
      }
    },
    [calculateTaskSummary]
  );

  useEffect(() => {
    if (selectedProject) fetchProjectTasks(selectedProject);
    else setTasks([]);
  }, [selectedProject, fetchProjectTasks]);

  const createProject = async (data) => {
    const accessToken = localStorage.getItem("accessToken");
    setIsProjectActionLoading(true);
    try {
      setApiError(null);
      console.log("Creating project with data:", data);
      const response = await axios.post(`${API_BASE_URL}/projects`, data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log("Project creation response:", response);

      // Immediately fetch updated projects list
      toast.success("Poject Added successfully");
      await fetchUserData();
      setIsProjectDialogOpen(false);
      projectForm.reset();
    } catch (error) {
      console.error("Error creating project:", error);
      console.error("Error details:", error.response || error.message);
      setApiError(error.response?.data?.message || toast.error("Only 4 projects per user are allowed."));
    } finally {
      setIsProjectActionLoading(false);
    }
  };

  // function to delete the project
  const deleteProject = async (projectId) => {
    const accessToken = localStorage.getItem("accessToken");
    setIsProjectActionLoading(true);
    setActionLoadingProjectId(projectId);
    try {
      setApiError(null);
      await axios.delete(`${API_BASE_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      fetchUserData();
      if (selectedProject === projectId) setSelectedProject(null);
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Error deleting project:", error);
      setApiError("Failed to delete project. Please try again.");
      toast.warning("Unable to delete the task");
    } finally {
      setIsProjectActionLoading(false);
      setActionLoadingProjectId(null);
    }
  };

  // This function will create a task
  const createTask = async (data) => {
    const accessToken = localStorage.getItem("accessToken");
    setIsTaskActionLoading(true);
    try {
      setApiError(null);
      await axios.post(
        `${API_BASE_URL}/tasks/projects/${selectedProject}/tasks`,
        data,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      fetchProjectTasks(selectedProject);
      setIsTaskDialogOpen(false);
      taskForm.reset();
      toast.success("Task Created SuccessFully");
    } catch (error) {
      console.error("Error creating task:", error);
      setApiError(error.response?.data?.message || "Failed to create task.");
      toast.warning("unable to create a task ");
    } finally {
      setIsTaskActionLoading(false);
    }
  };

  // function to update the task
  const updateTask = async (data) => {
    const accessToken = localStorage.getItem("accessToken");
    setIsTaskActionLoading(true);
    try {
      setApiError(null);
      await axios.put(`${API_BASE_URL}/tasks/tasks/${selectedTask._id}`, data, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      fetchProjectTasks(selectedProject);
      setIsTaskDialogOpen(false);
      taskForm.reset();
      toast("Task updated Successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.warning("unable to update the task");
      setApiError(error.response?.data?.message || "Failed to update task.");
    } finally {
      setIsTaskActionLoading(false);
    }
  };

  // this function will delete the task
  const deleteTask = async (taskId) => {
    const accessToken = localStorage.getItem("accessToken");
    setIsTaskActionLoading(true);
    setActionLoadingTaskId(taskId);
    try {
      setApiError(null);
      await axios.delete(`${API_BASE_URL}/tasks/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      fetchProjectTasks(selectedProject);
      toast.success("Task Deleted Successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      setApiError("Failed to delete task. Please try again.");
    } finally {
      setIsTaskActionLoading(false);
      setActionLoadingTaskId(null);
    }
  };

  const completeTask = async (taskId) => {
    const accessToken = localStorage.getItem("accessToken");
    setIsTaskActionLoading(true);
    setActionLoadingTaskId(taskId);
    try {
      setApiError(null);
      // FIXED: Added "tasks" segment to the path
      await axios.patch(
        `${API_BASE_URL}/tasks/tasks/complete/${taskId}`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      fetchProjectTasks(selectedProject);
      toast.success("Task Completed Successfully");
    } catch (error) {
      console.error("Error completing task:", error);
      if (error.response?.status === 404) {
        setApiError("Task not found. It may have been deleted.");
      } else {
        setApiError("Failed to complete task. Please try again.");
      }
    } finally {
      setIsTaskActionLoading(false);
      setActionLoadingTaskId(null);
    }
  };

  const resetTask = async (taskId) => {
    const accessToken = localStorage.getItem("accessToken");
    setIsTaskActionLoading(true);
    setActionLoadingTaskId(taskId);
    try {
      setApiError(null);
      // FIXED: Added "tasks" segment to the path
      await axios.patch(
        `${API_BASE_URL}/tasks/tasks/reset/${taskId}`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      fetchProjectTasks(selectedProject);
      toast("Task Reset Success");
    } catch (error) {
      console.error("Error resetting task:", error);
      if (error.response?.status === 404) {
        setApiError("Task not found. It may have been deleted.");
      } else {
        setApiError("Failed to reset task. Please try again.");
      }
    } finally {
      setIsTaskActionLoading(false);
      setActionLoadingTaskId(null);
    }
  };

  const downloadExcel = () => {
    const tableData = tasks.map((task) => ({
      "Task Title": task.title,
      Description: task.description,
      Status: task.status,
      "Due Date": task.dueDate
        ? new Date(task.dueDate).toLocaleDateString()
        : "N/A",
      "Created At": task.createdAt
        ? new Date(task.createdAt).toLocaleDateString()
        : "N/A",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(tableData);
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    XLSX.writeFile(wb, "Tasks.xlsx");
    toast.success("File Downloaded Successfully");
  };

  const openTaskDialog = (mode, task = null) => {
    setDialogMode(mode);
    setSelectedTask(task);
    if (mode === "edit")
      taskForm.reset({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate?.split("T")[0] || "",
      });
    setIsTaskDialogOpen(true);
  };

  useEffect(() => {
    fetchUserData();
    const interval = setInterval(fetchUserData, 30000);
    return () => clearInterval(interval);
  }, [fetchUserData]);

  if (isLoading)
    return <TailwindLoadingSpinner message="Loading Dashboard..." />;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
          <header className="mx-3 mt-2 rounded-lg border-b bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex h-12 items-center px-4">
              <SidebarTrigger className="mr-2" />
              <div className="ml-auto flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    selectedProject
                      ? fetchProjectTasks(selectedProject)
                      : fetchUserData()
                  }
                  disabled={isProjectsLoading || isTasksLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      isProjectsLoading || isTasksLoading ? "animate-spin" : ""
                    }`}
                  />
                  <span className="sr-only">Refresh</span>
                </Button>
                <ModeToggle />
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-5 p-3">
            {apiError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            <motion.div
              className="grid gap-6 md:grid-cols-3"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            >
              {Object.entries(taskSummary).map(([key, value], index) => (
                <motion.div key={key} variants={cardVariants}>
                  <Card
                    className={`bg-gradient-to-br ${gradients[index]} shadow-lg`}
                  >
                    <CardHeader className="pb-0">
                      <CardTitle className="text-lg font-medium text-white capitalize">
                        {key.replace(/-/g, " ")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">
                        <AnimatedNumber value={value} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {!selectedProject ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">Projects</h2>
                  <Button
                    onClick={() => setIsProjectDialogOpen(true)}
                    disabled={isProjectActionLoading}
                  >
                    {isProjectActionLoading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" /> New Project
                      </>
                    )}
                  </Button>
                </div>

                {isProjectsLoading ? (
                  <div className="flex justify-center p-8">
                    <svg
                      className="animate-spin h-8 w-8 text-primary"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-2">
                      No Projects Yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Create your first project to get started
                    </p>
                    <Button
                      onClick={() => setIsProjectDialogOpen(true)}
                      disabled={isProjectActionLoading}
                    >
                      {isProjectActionLoading ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Creating...
                        </span>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" /> Create Project
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    {projects.map((project) => (
                      <Card key={project._id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-medium">
                              {project.title}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteProject(project._id)}
                              disabled={
                                isProjectActionLoading &&
                                actionLoadingProjectId === project._id
                              }
                            >
                              {isProjectActionLoading &&
                              actionLoadingProjectId === project._id ? (
                                <svg
                                  className="animate-spin h-4 w-4 text-red-500"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-500" />
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                            {project.description || "No description"}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              {new Date(project.createdAt).toLocaleDateString()}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => setSelectedProject(project._id)}
                            >
                              View Tasks
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">
                      {projects.find((p) => p._id === selectedProject)?.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProject(null)}
                    >
                      ← Back to Projects
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => openTaskDialog("create")}
                      disabled={isTaskActionLoading}
                    >
                      {isTaskActionLoading && !actionLoadingTaskId ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Creating...
                        </span>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" /> New Task
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={downloadExcel}
                      disabled={tasks.length === 0}
                    >
                      Download Excel
                    </Button>
                  </div>
                </div>

                {isTasksLoading ? (
                  <div className="flex justify-center p-8">
                    <svg
                      className="animate-spin h-8 w-8 text-primary"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-2">No Tasks Found</h3>
                    <Button
                      onClick={() => openTaskDialog("create")}
                      disabled={isTaskActionLoading}
                    >
                      {isTaskActionLoading ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Creating...
                        </span>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" /> Create Task
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-100 dark:bg-gray-800">
                            <TableHead>Task Title</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tasks
                            .slice(
                              (currentPage - 1) * tasksPerPage,
                              currentPage * tasksPerPage
                            )
                            .map((task) => (
                              <TableRow key={task._id}>
                                <TableCell className="font-medium">
                                  {task.title}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {task.description || "N/A"}
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      task.status === "completed"
                                        ? "bg-green-100 text-green-800"
                                        : task.status === "in-progress"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {task.status}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {task.dueDate
                                    ? new Date(
                                        task.dueDate
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </TableCell>
                                <TableCell>
                                  {task.createdAt
                                    ? new Date(
                                        task.createdAt
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        openTaskDialog("edit", task)
                                      }
                                      disabled={
                                        isTaskActionLoading &&
                                        actionLoadingTaskId === task._id
                                      }
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-500"
                                      onClick={() => deleteTask(task._id)}
                                      disabled={
                                        isTaskActionLoading &&
                                        actionLoadingTaskId === task._id
                                      }
                                    >
                                      {isTaskActionLoading &&
                                      actionLoadingTaskId === task._id ? (
                                        <span className="flex items-center">
                                          <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                          >
                                            <circle
                                              className="opacity-25"
                                              cx="12"
                                              cy="12"
                                              r="10"
                                              stroke="currentColor"
                                              strokeWidth="4"
                                            ></circle>
                                            <path
                                              className="opacity-75"
                                              fill="currentColor"
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                          </svg>
                                          Deleting...
                                        </span>
                                      ) : (
                                        "Delete"
                                      )}
                                    </Button>
                                    {task.status === "todo" && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-green-500"
                                        onClick={() => completeTask(task._id)}
                                        disabled={
                                          isTaskActionLoading &&
                                          actionLoadingTaskId === task._id
                                        }
                                      >
                                        {isTaskActionLoading &&
                                        actionLoadingTaskId === task._id ? (
                                          <span className="flex items-center">
                                            <svg
                                              className="animate-spin -ml-1 mr-2 h-4 w-4"
                                              xmlns="http://www.w3.org/2000/svg"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                            >
                                              <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                              ></circle>
                                              <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                              ></path>
                                            </svg>
                                            Processing...
                                          </span>
                                        ) : (
                                          "Complete"
                                        )}
                                      </Button>
                                    )}
                                    {task.status === "completed" && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-yellow-500"
                                        onClick={() => resetTask(task._id)}
                                        disabled={
                                          isTaskActionLoading &&
                                          actionLoadingTaskId === task._id
                                        }
                                      >
                                        {isTaskActionLoading &&
                                        actionLoadingTaskId === task._id ? (
                                          <span className="flex items-center">
                                            <svg
                                              className="animate-spin -ml-1 mr-2 h-4 w-4"
                                              xmlns="http://www.w3.org/2000/svg"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                            >
                                              <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                              ></circle>
                                              <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                              ></path>
                                            </svg>
                                            Processing...
                                          </span>
                                        ) : (
                                          "Reset"
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>

                    {tasks.length > tasksPerPage && (
                      <Pagination className="justify-end">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() =>
                                setCurrentPage((p) => Math.max(p - 1, 1))
                              }
                              disabled={currentPage === 1}
                            />
                          </PaginationItem>
                          {[
                            ...Array(Math.ceil(tasks.length / tasksPerPage)),
                          ].map((_, i) => (
                            <PaginationItem key={i}>
                              <PaginationLink
                                onClick={() => setCurrentPage(i + 1)}
                                isActive={currentPage === i + 1}
                              >
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                setCurrentPage((p) =>
                                  Math.min(
                                    p + 1,
                                    Math.ceil(tasks.length / tasksPerPage)
                                  )
                                )
                              }
                              disabled={
                                currentPage ===
                                Math.ceil(tasks.length / tasksPerPage)
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                )}
              </div>
            )}
          </main>

          {/* Project Dialog */}
          <Dialog
            open={isProjectDialogOpen}
            onOpenChange={setIsProjectDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Add a new project to organize your tasks
                </DialogDescription>
              </DialogHeader>
              <Form {...projectForm}>
                <form
                  onSubmit={projectForm.handleSubmit(createProject)}
                  className="space-y-4"
                >
                  <FormField
                    control={projectForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={projectForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter project description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isProjectActionLoading}>
                      {isProjectActionLoading
                        ? "Creating..."
                        : "Create Project"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Task Dialog */}
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {dialogMode === "create" ? "Create New Task" : "Edit Task"}
                </DialogTitle>
                <DialogDescription>
                  {dialogMode === "create"
                    ? "Add a new task to your project"
                    : "Update your task details"}
                </DialogDescription>
              </DialogHeader>
              <Form {...taskForm}>
                <form
                  onSubmit={taskForm.handleSubmit(
                    dialogMode === "create" ? createTask : updateTask
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={taskForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter task title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={taskForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter task description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={taskForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Input
                              type="date"
                              {...field}
                              className="dark:text-white dark:[color-scheme:dark]"
                            />
                            <Calendar className="ml-2 h-4 w-4 text-gray-500" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isTaskActionLoading}>
                      {isTaskActionLoading
                        ? dialogMode === "create"
                          ? "Creating..."
                          : "Updating..."
                        : dialogMode === "create"
                        ? "Create Task"
                        : "Update Task"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
