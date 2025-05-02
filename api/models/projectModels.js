import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
  },
  { timestamps: true }
);

projectSchema.virtual("progress").get(function () {
  const totalTasks = this.tasks.length;
  const completedTasks = this.tasks.filter(
    (t) => t.status === "completed"
  ).length;
  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
});

export const Project = mongoose.model("Project", projectSchema);
