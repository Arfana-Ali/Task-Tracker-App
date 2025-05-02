import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
{
title: {
type: String,
required: [true, "Title is required"],
trim: true,
},
description: {
type: String,
trim: true,
},
status: {
type: String,
enum: ["todo", "in-progress", "completed"],
default: "todo",
},
dueDate: {
type: Date,
},
completedAt: {
type: Date,
},
project: {
type: Schema.Types.ObjectId,
ref: "Project",
required: true,
},
user: {
type: Schema.Types.ObjectId,
ref: "User",
required: true,
},
},
{
timestamps: true // createdAt और updatedAt automatically manage honge
}
);

// Task complete hone par completedAt set karne ka pre-save hook
taskSchema.pre("save", function(next) {
if(this.isModified("status") && this.status === "completed" && !this.completedAt) {
this.completedAt = new Date();
}
next();
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
