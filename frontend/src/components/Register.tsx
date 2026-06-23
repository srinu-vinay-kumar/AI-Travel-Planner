import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import api from "../api/axios.ts";

const registerSchema = z.object({
  name: z.object({
    firstName: z.string().min(2, "First Name is Required"),
    lastName: z.string().min(2, "Last Name is required"),
  }),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be atleast 8 characters long"),
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

interface RegisterModalProps {
  onClose: () => void;
}

const Register = ({ onClose }: RegisterModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({ resolver: zodResolver(registerSchema) });
  const registerProcess = async (data: RegisterFormInputs) => {
    const toastId = toast.loading("Creating your account...");
    try {
      const respone = await api.post("/user/register", data);
      toast.success("Account Created Successfully.", { id: toastId });
      console.log("register response:", respone);

      onClose();
    } catch (err) {
      console.error("Register error: ", err);
      let errorMsg = "Something went wrong. Please try again";
      if (axios.isAxiosError(err)) {
        errorMsg = err.response?.data?.message || errorMsg;
      }
      toast.error(errorMsg, { id: toastId });
    }
  };
  return (
    <div className="register-modal">
      <div className="register-modal__content">
        <h2 className="register-modal__title">Create an Account</h2>

        <form
          onSubmit={handleSubmit(registerProcess)}
          className="register-modal__form"
        >
          {/* 1. Nested Name Field */}
          <section className="register-modal__group">
            <label className="register-modal__label">First Name</label>
            <input type="text" {...register("name.firstName")} />
            {errors.name?.firstName && (
              <p className="register-modal__error">
                {errors.name.firstName.message}
              </p>
            )}
          </section>

          <section className="register-modal__group">
            <label className="register-modal__label">Last Name</label>
            <input
              type="text"
              className="register-modal__input"
              {...register("name.lastName")}
            />
            {errors.name?.lastName && (
              <p className="register-modal__error">
                {errors.name.lastName.message}
              </p>
            )}
          </section>

          {/* 2. Email Field */}
          <section className="register-modal__group">
            <label className="register-modal__label">Email</label>
            <input
              type="email"
              {...register("email")}
              className="register-modal__input"
            />
            {errors.email && (
              <p className="register-modal__error">{errors.email.message}</p>
            )}
          </section>

          {/* 3. Password Field */}
          <section className="register-modal__group">
            <label className="register-modal__label">Password</label>
            <input
              type="password"
              {...register("password")}
              className="register-modal__input"
            />
            {errors.password && (
              <p className="register-modal__error">{errors.password.message}</p>
            )}
          </section>

          {/* Buttons... */}
          <button
            type="submit"
            className="register-modal__btn register-modal__btn--primary"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={onClose}
            className="register-modal__btn register-modal__btn--secondary"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
