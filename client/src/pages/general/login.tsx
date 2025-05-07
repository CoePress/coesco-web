import { Button, Input, Card, PageHeader } from "@/components";
import { AuthContext } from "@/contexts/auth.context";
import useGetSystemStatus from "@/hooks/admin/use-get-system-status";
import useLogin from "@/hooks/auth/use-login";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const getErrorMessage = (error: string | null) => {
  switch (error) {
    case "unauthorized":
      return "Access denied. Contact your administrator.";
    case "session_expired":
      return "Session expired. Please sign in again.";
    case "invalid_tenant":
      return "Invalid organization. Use your work account.";
    case "interaction_required":
      return "Additional authentication needed. Please try again.";
    case "access_denied":
      return "Access denied. Try again or contact support.";
    case "network_error":
      return "Connection error. Check your internet connection.";
    default:
      return error ? `Authentication error: ${error}` : null;
  }
};

const BackgroundImage = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/images/background.png";
    img.onload = () => setIsLoaded(true);
  }, []);

  return (
    <div
      className={`absolute inset-0 z-0 transition-opacity duration-500 ${
        isLoaded ? "opacity-20" : "opacity-0"
      }`}
      style={{
        backgroundImage: "url('/images/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
};

const LoginPage = () => {
  const { login, loading: loginLoading, error: loginError } = useLogin();
  const { user } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const { status, refetch: refetchHealth } = useGetSystemStatus({
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get("error");
  const errorMessage = getErrorMessage(errorParam) || loginError;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let mounted = true;

    if (mounted && user) {
      navigate("/", { replace: true });
    }

    return () => {
      mounted = false;
    };
  }, [user, navigate]);

  const systemDown = status !== "good";

  if (systemDown) {
    return (
      <div className="relative h-screen w-screen flex items-center justify-center p-2">
        <BackgroundImage />
        <div className="relative z-10 w-full max-w-md">
          <Card className="shadow-xl border border-border/30 backdrop-blur-sm bg-background/95">
            <div className="p-2 space-y-2">
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg text-center">
                <p className="font-semibold mb-2">System Unavailable</p>
                <p className="text-sm mb-4">
                  Our services are currently down. Please try again later.
                </p>
                <Button
                  variant="secondary-outline"
                  onClick={refetchHealth}
                  className="w-full">
                  Retry Connection
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen flex items-center justify-center p-2">
      <BackgroundImage />
      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-xl border border-border/30 backdrop-blur-sm bg-background/70">
          <div className="p-2 space-y-2">
            {/* <div className="flex flex-col items-center mb-2">
              <img
                src="/images/logo-text.png"
                alt="Logo"
                className="h-12 mb-2"
              />
            </div> */}

            {errorMessage && (
              <div className="bg-error/10 border border-error/20 text-error text-sm p-2 rounded-lg flex items-start">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mr-2 mt-0.5 flex-shrink-0">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                  />
                  <line
                    x1="12"
                    y1="8"
                    x2="12"
                    y2="12"
                  />
                  <line
                    x1="12"
                    y1="16"
                    x2="12.01"
                    y2="16"
                  />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (username && password) {
                  // Submit form logic
                }
              }}>
              <Input
                type="text"
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-background/50"
              />

              <Input
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-background/50 mb-2"
              />

              <Button
                disabled={loginLoading || !username || !password}
                className="w-full">
                {loginLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-background text-text-muted">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              onClick={login}
              disabled={loginLoading}
              variant="secondary-outline"
              className="w-full flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                className="mr-2">
                <path
                  fill="currentColor"
                  d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"
                />
              </svg>
              {loginLoading ? "Connecting..." : "Sign in with Microsoft"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
