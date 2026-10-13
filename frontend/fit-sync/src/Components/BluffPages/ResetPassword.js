import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { saveSession } from "../../api/session";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmation) {
      toast("❌ Passwords do not match", { position: "top-center", theme: "dark" });
      return;
    }
    try {
      const response = await axios.post(`/api/v1/auth/reset-password/${token}`, {
        password,
      });
      saveSession(response.data);
      toast("✅ Password reset successfully", { position: "top-center", theme: "dark" });
      setTimeout(() => navigate("/track"), 1000);
    } catch (error) {
      toast(`❌ ${error.response?.data?.error?.message || "Unable to reset password"}`, {
        position: "top-center",
        theme: "dark",
      });
    }
  };

  return (
    <div className="body">
      <ToastContainer />
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <Link to="/login" className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
          <img className="w-8 h-8 mr-2" src="/fitSync.jpg" alt="logo" />
          FitSync
        </Link>
        <div className="w-full bg-white rounded-lg shadow dark:border sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 sm:p-8">
            <h1 className="text-xl font-bold text-gray-900 md:text-2xl dark:text-white">Choose a new password</h1>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input type="password" minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:text-white" required />
              <input type="password" minLength="8" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Confirm new password" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:text-white" required />
              <button type="submit" className="w-full text-white bg-blue-600 font-medium rounded-lg text-sm px-5 py-2.5">Reset password</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
