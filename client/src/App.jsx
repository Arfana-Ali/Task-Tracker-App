import LoginForm from "./pages/LoginPage";
import SignupForm from "./pages/SignupPage";
import UserDashBoardPage from "./pages/User.Dashboard";
import { ThemeProvider } from "@/components/theme-provider";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "sonner";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Router>
        <div className="font-bespoke-stencil">
          <Routes>
            <Route path="/" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/user/:id" element={<UserDashBoardPage />} />

              {/* Aur bhi protected routes add kar sakte hain */}
            </Route>
          </Routes>
        </div>
        <Toaster />
      </Router>
      {/* <LoginForm />
      <SignupForm /> */}
    </ThemeProvider>
  );
}

export default App;
