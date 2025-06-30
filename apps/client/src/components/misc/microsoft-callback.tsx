import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { instance } from "@/utils";
import { useAuth } from "@/contexts/auth.context";
import { Loader } from "@/components";

const MicrosoftCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasRun = useRef(false);

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
        const { data } = await instance.post("/auth/callback/microsoft", {
          code,
          state,
        });

        setUser(data.user, data.employee);

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
