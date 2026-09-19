import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock } from "lucide-react";
import GoogleButton from "../components/GoogleButton";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="bg-canvas" />
      <div className="card-light w-full max-w-md p-8 fade-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl logo-sapphire logo-float text-3xl">
            M
          </div>
          <h1 className="mt-5 text-3xl brand-sapphire-inverse">Welcome back</h1>
          <p className="text-sm text-slate-600 mt-2">
            Log in to continue your conversations
          </p>
        </div>
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              strokeWidth={1.75}
            />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-light pl-11"
            />
          </div>
          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              strokeWidth={1.75}
            />
            <input
              type="password"
              placeholder="Enter your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-light pl-11"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-sapphire w-full mt-2"
          >
            {loading ? "Signing in" : "Sign in"}
          </button>
        </form>
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            or
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <GoogleButton onError={setError} />
        <p className="text-sm text-center text-slate-600 mt-6">
          Don't have an account?
          <Link
            to="/register"
            className="text-slate-900 hover:text-slate-700 font-bold ml-1"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}