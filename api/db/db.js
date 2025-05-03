import mongoose from "mongoose";

async function connectDB() {
  try {
    
    const connection = await mongoose.connect(`${process.env.MONGODB_URI}`);
   
    console.log(`MongoDB connected at ${connection.connection.host}`)
  } catch (error) {
    console.log("Database Connection Error: ", error);
  }
}

export default connectDB;
