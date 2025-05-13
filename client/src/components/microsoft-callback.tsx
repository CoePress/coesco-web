import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

export const MicrosoftCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code || !state) {
        navigate("/login?error=invalid_callback");
        return;
      }

      try {
        await axios.post(
          "/auth/microsoft/callback",
          {
            code,
            state,
          },
          {
            withCredentials: true,
          }
        );

        navigate("/dashboard");
      } catch (error) {
        navigate("/login?error=auth_failed");
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return <div>Processing login...</div>;
};
