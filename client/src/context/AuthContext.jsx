import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("localhire_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem("localhire_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  async function login(form) {
    const { data } = await api.post("/auth/login", form);
    localStorage.setItem("localhire_token", data.token);
    setToken(data.token);
    setUser(data.user);
    toast.success(`Welcome back, ${data.user.name}`);
    return data.user;
  }

  async function register(form) {
    const { data } = await api.post("/auth/register", form);
    toast.success(data.message || "Account created. Check your email to verify your account.");
    return data.user;
  }

  async function googleLogin(credential, role = "jobseeker") {
    const { data } = await api.post("/auth/google", { credential, role });
    localStorage.setItem("localhire_token", data.token);
    setToken(data.token);
    setUser(data.user);
    toast.success(`Welcome, ${data.user.name}`);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("localhire_token");
    setToken(null);
    setUser(null);
    toast.success("Logged out");
  }

  function updateUser(nextUser) {
    setUser(nextUser);
  }

  const value = useMemo(
    () => ({ token, user, loading, login, register, googleLogin, logout, updateUser }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
