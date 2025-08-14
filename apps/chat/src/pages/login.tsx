import { useState } from "react";
import api from "../utils/axios";

const BackgroundImage = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="absolute inset-0 z-0">
      <img
        src="/images/background.png"
        alt=""
        loading="lazy"
        fetchPriority="low"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          isLoaded ? "opacity-20" : "opacity-0"
        }`}
      />
    </div>
  );
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/login", { email, password });
      window.location.href = "/";
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      const { url } = await api.get<{ url: string }>("/auth/microsoft/login");
      window.location.href = url;
    } catch (err: any) {
      setError(err?.message || "Microsoft login failed");
    }
  };

  return (
    <div className="relative h-[100dvh] w-screen flex items-center justify-center p-4">
      <BackgroundImage />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-lg p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-center">Login</h1>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-slate-300" />
          <span className="text-xs text-slate-500">OR</span>
          <div className="flex-1 h-px bg-slate-300" />
        </div>

        <button
          onClick={handleMicrosoftLogin}
          className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-500"
        >
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
};

export default Login;
