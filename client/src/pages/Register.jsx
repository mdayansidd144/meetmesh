import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock } from "lucide-react";
import GoogleButton from "../components/GoogleButton";

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
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
          <h1 className="mt-5 text-3xl brand-sapphire-inverse">Create your account</h1>
          <p className="text-sm text-slate-600 mt-2">
            Join the mesh and start chatting
          </p>
        </div>
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" strokeWidth={1.75} />
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              className="input-light pl-11"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" strokeWidth={1.75} />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="input-light pl-11"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" strokeWidth={1.75} />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              className="input-light pl-11"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-sapphire w-full mt-2">
            {loading ? "Creating" : "Create account"}
          </button>
        </form>
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <GoogleButton onError={setError} />
        <p className="text-sm text-center text-slate-600 mt-6">
          Already have an account?
          <Link to="/login" className="text-slate-900 hover:text-slate-700 font-bold ml-1">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}