import React, { lazy, Suspense } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isAuthenticated } from "./api/session";

const LoginForm = lazy(() => import("./Components/CalculatorComp/LoginForm"));
const SignUp = lazy(() => import("./Components/CalculatorComp/SignUp"));
const Navbar = lazy(() => import("./Components/Navbar/Navbar1"));
const ChangePassword = lazy(() => import("./Components/BluffPages/ChangePassword"));
const ForgotPassword = lazy(() => import("./Components/BluffPages/ForgotPassword"));
const ResetPassword = lazy(() => import("./Components/BluffPages/ResetPassword"));

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function App() {
  const loggedIn = isAuthenticated();
  return (
    <BrowserRouter>
      <Suspense fallback={<p className="p-4">Loading FitSync...</p>}>
        <Routes>
          <Route path="/" element={loggedIn ? <Navbar /> : <LoginForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/track"
            element={
              <ProtectedRoute>
                <Navbar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/update_password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route path="forgot_password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
