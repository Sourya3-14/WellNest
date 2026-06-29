import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../../utils/api.js";
import { setToken } from "../../utils/auth.js";
import { AlertCircle, CheckCircle2, Loader2, LogIn } from "lucide-react";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", form);
      const { user, tokens } = res.data.data || {};
      if (tokens?.accessToken) {
        setToken(tokens.accessToken);
      }
      if (user) {
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userId", user.id);
        localStorage.setItem("firstName", user.firstName || "");
        localStorage.setItem("lastName", user.lastName || "");
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F0F7F4] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased selection:bg-[#2D7A5F]/20">
      <div className="relative w-full max-w-[460px] bg-white rounded-3xl border border-[#E8F5F0] p-6 sm:p-10 shadow-xl overflow-hidden animate-fadeIn">
        {/* Subtle background decorative accent */}
        <div className="absolute top-0 right-0 w-[180px] h-[180px] bg-gradient-to-bl from-[#4CAF82]/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Header Block */}
        <div className="relative z-10 text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#2D7A5F]/10 text-[#2D7A5F] border border-[#C8E6D8] mb-1 shadow-sm">
            <LogIn size={22} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1A3C34] sm:text-3xl">Welcome Back</h1>
          <p className="text-xs sm:text-sm font-medium text-[#4A7A6A]">Sign in to access your secure patient or clinician matrix ledger.</p>
        </div>

        {/* State Notification Banners */}
        {message && (
          <div className="flex items-center gap-2 text-emerald-800 font-bold bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-xs mb-5 shadow-sm">
            <CheckCircle2 size={14} className="flex-shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-700 font-bold bg-red-50 border border-red-100 p-3.5 rounded-xl text-xs mb-5 shadow-sm">
            <AlertCircle size={14} className="flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Parameter Input */}
          <div className="space-y-1">
            <label htmlFor="email" className="text-[11px] font-black uppercase tracking-wider text-[#4A7A6A]">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="jane.doe@example.com"
              className="w-full text-sm font-medium bg-[#FAFDFB] border border-[#C8E6D8] focus:border-[#2D7A5F] focus:ring-[#2D7A5F]/10 rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-4 placeholder-[#4A7A6A]/40 text-[#1A3C34] shadow-sm"
            />
          </div>

          {/* Password Parameter Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-[11px] font-black uppercase tracking-wider text-[#4A7A6A]">
                Password
              </label>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full text-sm font-medium bg-[#FAFDFB] border border-[#C8E6D8] focus:border-[#2D7A5F] focus:ring-[#2D7A5F]/10 rounded-xl px-3.5 py-2.5 outline-none transition-all focus:ring-4 placeholder-[#4A7A6A]/40 text-[#1A3C34] shadow-sm"
            />
          </div>

          {/* Submission Trigger */}
          <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2D7A5F] px-4 py-3 text-xs font-black text-white hover:bg-[#245F4A] disabled:opacity-50 disabled:pointer-events-none transition-all shadow-md active:scale-95 mt-2">
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Verifying Credentials Ledger...
              </>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        {/* Card Footer Navigation */}
        <div className="mt-8 pt-5 border-t border-[#F0F7F4] text-center">
          <p className="text-xs font-bold text-[#4A7A6A]">
            Don't have an account profile?{" "}
            <Link to="/signup" className="text-[#2D7A5F] hover:underline font-black ml-1">
              Sign Up Matrix
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
