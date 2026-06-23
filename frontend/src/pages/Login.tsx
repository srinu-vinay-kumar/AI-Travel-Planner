import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";

import api from "../api/axios.ts";
import Register from "../components/Register.tsx";
import { useAuth } from "../context/AuthContext.tsx";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  password: z.string().min(8, "Password should be at least 8 characters long"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const Login = () => {
  const { isAuthenticated, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({ resolver: zodResolver(loginSchema) });

  if (isAuthenticated === null) {
    return (
      <div>
        <h2>Checking secure session...</h2>
      </div>
    );
  }

  if (isAuthenticated === true) {
    return <Navigate to="/dashboard" replace />;
  }

  const loginProcess = async (data: LoginFormInputs) => {
    const toastId = toast.loading("Logging in...");
    try {
      await api.post("/user/login", data);
      await checkAuth();
      toast.success("Logged in successfully", { id: toastId });
      navigate("/dashboard");
    } catch (err) {
      let errorMsg = "Something went wrong. Please try again!";
      if (axios.isAxiosError(err)) {
        errorMsg = err.response?.data?.message || errorMsg;
      }
      toast.error(errorMsg, { id: toastId });
    }
  };

  return (
    <main className="login__page">
      <div className="login__container">
        <h2>Welcome Back</h2>
        <form
          onSubmit={handleSubmit(loginProcess)}
          className="login__container-form"
        >
          <section className="login__container--form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="explorer@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="error-msg">{errors.email.message}</p>
            )}
          </section>

          <section className="login__container--form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="error-msg">{errors.password.message}</p>
            )}
          </section>

          <button type="submit" className="login__container-btn">
            Log In
          </button>
          <div className="login__container__register">
            <p className="login__container__register__text">New User? </p>
            <button type="button" onClick={() => setIsModalOpen(true)}>
              Register here
            </button>
          </div>
        </form>
      </div>
      {isModalOpen && <Register onClose={() => setIsModalOpen(false)} />}
    </main>
  );
};

export default Login;
