import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Verifying your email...");
  const token = searchParams.get("token") || "";

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("This verification link is missing a token.");
        return;
      }

      try {
        const { data } = await api.post("/auth/verify-email", { token });
        setStatus(data.message);
        toast.success(data.message);
      } catch (error) {
        setStatus(error.response?.data?.message || "Unable to verify email");
      }
    }

    verify();
  }, [token]);

  return (
    <section className="section-gap bg-neutral-50 dark:bg-neutral-950">
      <div className="page-shell grid place-items-center">
        <div className="card w-full max-w-md p-6 text-center">
          <span className="pill mb-4">Email verification</span>
          <h1 className="text-3xl font-black tracking-tight">Account verification</h1>
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">{status}</p>
          <Link to="/login" className="btn-primary mt-6 inline-flex">
            Continue to login
          </Link>
        </div>
      </div>
    </section>
  );
}
