import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApi } from "@/hooks/use-api";
import { IApiResponse } from "@/utils/types";
import { useAuth } from "@/contexts/auth.context";
import { Loader } from "@/components";

const MicrosoftCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasRun = useRef(false);
  const { post } = useApi<IApiResponse<{ user: any; employee: any }>>();

  useEffect(() => {
    if (hasRun.current) return;

    const handleCallback = async () => {
      hasRun.current = true;

      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code || !state) {
        navigate("/login?error=invalid_callback");
        return;
      }

      try {
        const response = await post("/auth/microsoft/callback", {
          code,
          state,
        });
        
        if (response?.success && response.data) {
          setUser(response.data.user, response.data.employee);
        } else {
          console.error("Unexpected response format:", response);
          throw new Error(response?.error || "Authentication failed");
        }

        navigate("/");
      } catch (error) {
        console.error("Auth error:", error);
        navigate("/login?error=auth_failed");
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUser]);

  return (
    <div className="flex items-center justify-center h-[100dvh]">
      <Loader />
    </div>
  );
};

export default MicrosoftCallback;
