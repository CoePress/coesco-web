import { Button, Input, Card } from "@/components";
import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { IApiResponse } from "@/utils/types";
import { useNavigate, useSearchParams } from "react-router-dom";

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

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [step, setStep] = useState<"request" | "reset">(token ? "reset" : "request");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { post: requestReset, loading: isRequesting } = useApi<IApiResponse<any>>();
  const { post: resetPassword, loading: isResetting } = useApi<IApiResponse<any>>();
  const toast = useToast();
  const navigate = useNavigate();

  const passwordRules = {
    minLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    passwordsMatch: confirmPassword.length > 0 && newPassword === confirmPassword,
  };

  const isPasswordValid = Object.values(passwordRules).every(rule => rule);

  const handleRequestReset = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    const response = await requestReset("/settings/request-password-reset", {
      email
    });

    if (response?.success) {
      toast.success("If an account exists with this email, a password reset link has been sent.");
      setEmail("");
    } else {
      toast.error(response?.error || "Failed to send password reset email");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!isPasswordValid) {
      toast.error("Password does not meet all requirements");
      return;
    }

    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    const response = await resetPassword("/settings/reset-password", {
      token,
      newPassword
    });

    if (response?.success) {
      toast.success("Password reset successfully. You can now log in with your new password.");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      toast.error(response?.error || "Failed to reset password");
    }
  };

  const loading = isRequesting || isResetting;

  if (step === "reset") {
    return (
      <div className="relative h-[100dvh] w-screen flex items-center justify-center p-2">
        <BackgroundImage />
        <div className="relative z-10 w-full max-w-md">
          <Card className="shadow-xl border border-border/30 backdrop-blur-sm bg-background/70">
            <div className="p-2 space-y-2">
              <div className="mb-2">
                <h2 className="text-lg font-semibold text-text mb-1">Reset Your Password</h2>
                <p className="text-xs text-text-muted">Enter your new password below</p>
              </div>

              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newPassword && confirmPassword && isPasswordValid) {
                    handleResetPassword();
                  }
                }}>
                <Input
                  type="password"
                  label="New Password"
                  value={newPassword}
                  disabled={loading}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="bg-background/50"
                />

                <Input
                  type="password"
                  label="Confirm Password"
                  value={confirmPassword}
                  disabled={loading}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="bg-background/50 mb-2"
                />

                {newPassword && (
                  <div className="px-3 py-2 bg-surface border border-border rounded text-xs space-y-1">
                    <div className="text-text-muted mb-2 font-medium">Password must contain:</div>
                    <div className={`flex items-center gap-2 ${passwordRules.minLength ? "text-success" : "text-text-muted"}`}>
                      <span>{passwordRules.minLength ? "✓" : "○"}</span>
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordRules.hasUpperCase ? "text-success" : "text-text-muted"}`}>
                      <span>{passwordRules.hasUpperCase ? "✓" : "○"}</span>
                      <span>One uppercase letter</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordRules.hasLowerCase ? "text-success" : "text-text-muted"}`}>
                      <span>{passwordRules.hasLowerCase ? "✓" : "○"}</span>
                      <span>One lowercase letter</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordRules.hasNumber ? "text-success" : "text-text-muted"}`}>
                      <span>{passwordRules.hasNumber ? "✓" : "○"}</span>
                      <span>One number</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordRules.hasSpecialChar ? "text-success" : "text-text-muted"}`}>
                      <span>{passwordRules.hasSpecialChar ? "✓" : "○"}</span>
                      <span>One special character (!@#$%^&*...)</span>
                    </div>
                    {confirmPassword && (
                      <div className={`flex items-center gap-2 ${passwordRules.passwordsMatch ? "text-success" : "text-error"}`}>
                        <span>{passwordRules.passwordsMatch ? "✓" : "○"}</span>
                        <span>Passwords match</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword || !isPasswordValid}
                  className="w-full border rounded justify-center text-sm flex items-center gap-2 transition-all duration-300 h-max border-primary bg-primary text-foreground hover:bg-primary/80 hover:border-primary/80 cursor-pointer px-3 py-1.5 disabled:border-border disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed">
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  onClick={() => navigate("/login")}
                  className="text-xs text-text-muted hover:text-text transition-colors"
                >
                  Back to login
                </button>
              </div>
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
            <div className="mb-2">
              <h2 className="text-lg font-semibold text-text mb-1">Reset Your Password</h2>
              <p className="text-xs text-text-muted">Enter your email address and we'll send you a password reset link</p>
            </div>

            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (email) {
                  handleRequestReset();
                }
              }}>
              <Input
                type="email"
                label="Email Address"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-background/50"
              />

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full border rounded justify-center text-sm flex items-center gap-2 transition-all duration-300 h-max border-primary bg-primary text-foreground hover:bg-primary/80 hover:border-primary/80 cursor-pointer px-3 py-1.5 disabled:border-border disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={() => navigate("/login")}
                className="text-xs text-text-muted hover:text-text transition-colors"
              >
                Back to login
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
