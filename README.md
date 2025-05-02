# Task-Tracker-App

https://task-tracker-app-taupe.vercel.app/

Frontend – Task Tracker App (React + Vite)
This is the frontend for the Task Tracker App, built using React, Vite, and ShadCN UI with TailwindCSS.
It supports user authentication, project management, and task operations, and interacts with a backend API via Axios.

Technologies Used
React 18 + Vite
React Hook Form + Zod Validation
ShadCN UI (Radix UI + Tailwind)
Axios for API communication
React Router DOM for routing
Framer Motion, Sonner (Toast), etc.

Folder Structure (Simplified)

client/
├── src/
│   ├── components/
│   ├── pages/
│   ├── schemas/
│   ├── App.jsx
│   └── main.jsx
├── public/
├── .env
├── package.json
└── tailwind.config.js

Environment Variable
Create a .env file at the root of the client folder:
VITE_API_URL=https://*****

How to Run the Frontend Locally

# 1. Navigate to frontend directory
cd client

# 2. Install dependencies
npm install

# 3. Create your .env file
"VITE_API_URL=https://your-backend-url.com"

# 4. Run the dev server
npm run dev


Backend – Task Tracker API (Node.js + Express)

This is the backend server for the Task Tracker App, built using Node.js, Express, and MongoDB.
It handles user authentication, project management, and task operations using RESTful APIs.

Technologies Used

Node.js + Express
MongoDB + Mongoose
JWT-based Authentication
Cloudinary for Avatar Upload
Cookies for Secure Auth Flow
CORS, dotenv, multer, bcrypt, etc.

Folder Structure 
api/
├── controllers/
├── db/
│   └── db.js
├── middlewares/
├── models/
├── routes/
│   ├── user.routes.js
│   ├── project.routes.js
│   └── task.routes.js
├── utils/
├── .env
├── server.js
└── package.json



Environment Variables
Create a .env file in the root of your backend project with the following content:


PORT=5000
MONGODB_URI=your-mongodb-uri-here
CORS_ENV=https://your-frontend-url

ACCESS_TOKEN_SECRET=your-access-token-secret
ACCESS_TOKEN_EXPIRY=1h

REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRY=7d

CLOUD_NAME=your-cloud-name
API_KEY=your-api-key
API_SECRET=your-api-secret



How to Run Backend Locally

# 1. Navigate to backend folder
cd api

# 2. Install dependencies
npm install

# 3. Create a .env file as shown above

# 4. Run the backend server
npm run start

