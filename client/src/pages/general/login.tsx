import { Button } from "@/components";
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
      className={`absolute inset-0 z-0 transition-opacity duration-300 ${
        isLoaded ? "opacity-25" : "opacity-0"
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
      <div className="relative h-screen w-screen px-4">
        <BackgroundImage />
        <div className="relative z-10 h-full w-full flex items-center justify-center">
          <div className="p-2 border rounded-md w-full max-w-md bg-background/75 backdrop-blur-xs">
            <div className="bg-destructive/15 text-destructive p-2 rounded-md text-center">
              <p className="font-medium mb-2">System Unavailable</p>
              <p className="text-sm mb-2">Please try again later.</p>
              <Button
                variant="secondary-outline"
                onClick={refetchHealth}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen px-4">
      <BackgroundImage />
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        <div className="p-4 border rounded-md w-full max-w-md bg-background/75 backdrop-blur-xs space-y-4">
          {errorMessage && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {errorMessage}
            </div>
          )}
          <Button
            onClick={login}
            disabled={loginLoading}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"
              />
            </svg>
            {loginLoading ? "Connecting..." : "Sign in with Microsoft"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
