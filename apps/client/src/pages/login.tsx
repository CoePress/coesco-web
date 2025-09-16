import { Button, Input, Card } from "@/components";
import { AuthContext } from "@/contexts/auth.context";
import { useSocket } from "@/contexts/socket.context";
import { useApi } from "@/hooks/use-api";
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
  const { get, post, loading: loginLoading, error: loginError } = useApi<{ url: string }>();
  const { user, setUser } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get("error");
  const errorMessage = getErrorMessage(errorParam) || loginError;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const microsoftLogin = async () => {
    const response = await get("/auth/microsoft/login");
    if (response?.success && response.data?.url) {
      window.location.href = response.data.url;
    }
  };

  const handleUsernamePasswordLogin = async () => {
    const response = await post("/auth/login", {
      username,
      password,
    });
    
    if (response?.success && response.data) {
      setUser(response.data.user, response.data.employee);
      navigate("/", { replace: true });
    }
  };

  const { isSystemConnected, subscribeToSystemStatus, unsubscribeFromSystemStatus } = useSocket();

  useEffect(() => {
    subscribeToSystemStatus();
    
    const retryInterval = setInterval(() => {
      if (!isSystemConnected) {
        subscribeToSystemStatus();
      }
    }, 3000);
    
    return () => {
      clearInterval(retryInterval);
      unsubscribeFromSystemStatus();
    };
  }, [isSystemConnected]);

  useEffect(() => {
    let mounted = true;

    if (mounted && user) {
      navigate("/", { replace: true });
    }

    return () => {
      mounted = false;
    };
  }, [user, navigate]);

  const systemDown = !isSystemConnected;

  if (systemDown) {
    return (
      <div className="relative h-[100dvh] w-screen flex items-center justify-center p-2">
        <BackgroundImage />
        <div className="relative z-10 w-full max-w-sm">
          <Card className="shadow-xl border border-border/50 backdrop-blur-sm bg-background/75">
            <div className="text-text-muted p-2 rounded text-center">
              <p className="font-semibold mb-2">System Unavailable</p>
              <p className="text-sm">
                The system is currently down.
              </p>
              <p className="text-sm">
                Please try again shortly.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-screen flex items-center justify-center p-2">
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
              <div className="bg-error/10 border border-error/20 text-error text-sm p-2 rounded flex items-start">
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
                  handleUsernamePasswordLogin();
                }
              }}>
              <Input
                type="text"
                label="Username"
                value={username}
                disabled={loginLoading}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-background/50"
              />

              <Input
                type="password"
                label="Password"
                value={password}
                disabled={loginLoading}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-background/50 mb-2"
              />

              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  if (username && password) {
                    handleUsernamePasswordLogin();
                  }
                }}
                disabled={loginLoading || !username || !password}
                className="w-full border rounded justify-center text-sm flex items-center gap-2 transition-all duration-300 h-max border-primary bg-primary text-foreground hover:bg-primary/80 hover:border-primary/80 cursor-pointer px-3 py-1.5 disabled:border-border disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed">
                {loginLoading ? "Signing in..." : "Sign in"}
              </button>
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
              onClick={microsoftLogin}
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

export default Login;
