import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
const API = "https://studysphere-api-production.up.railway.app";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("ss_token");
    const u = localStorage.getItem("ss_user");
    if (t && u) { setToken(t); setUser(JSON.parse(u)); }
    setLoading(false);
  }, []);

  async function signup(name, email, password) {
    const res = await fetch(`${API}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    save(data.token, data.user);
    return data;
  }

  async function login(email, password) {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    save(data.token, data.user);
    return data;
  }

  function save(t, u) {
    setToken(t); setUser(u);
    localStorage.setItem("ss_token", t);
    localStorage.setItem("ss_user", JSON.stringify(u));
  }

  function logout() {
    setToken(null); setUser(null);
    localStorage.removeItem("ss_token");
    localStorage.removeItem("ss_user");
  }

  function updateUser(u) {
    setUser(u);
    localStorage.setItem("ss_user", JSON.stringify(u));
  }

  async function authFetch(path, opts = {}) {
    const res = await fetch(`${API}${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts.headers },
    });
    if (res.status === 401) { logout(); throw new Error("Session expired"); }
    return res;
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signup, login, logout, updateUser, authFetch, API }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
