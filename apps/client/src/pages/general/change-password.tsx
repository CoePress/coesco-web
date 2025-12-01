import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import type { IApiResponse } from "@/utils/types";

import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { post: changePassword, loading: isChanging } = useApi<IApiResponse<any>>();
  const toast = useToast();
  const navigate = useNavigate();

  const passwordRules = {
    minLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    passwordsMatch: confirmPassword.length > 0 && newPassword === confirmPassword,
  };

  const isPasswordValid = Object.values(passwordRules).every(rule => rule);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!isPasswordValid) {
      toast.error("Password does not meet all requirements");
      return;
    }

    const response = await changePassword("/settings/change-password", {
      currentPassword,
      newPassword,
    });

    if (response?.success) {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      navigate("/settings?tab=security");
    }
    else {
      toast.error(response?.error || "Failed to change password");
    }
  };

  return (
    <div className="flex justify-center w-full h-full">
      <div className="p-8 max-w-4xl w-full">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm text-text-muted mb-1">Change Password</h3>
            <p className="text-xs text-text-muted">Update your account password</p>
          </div>

          <div className="space-y-4">
            <div className="py-3">
              <label className="block mb-2 text-sm font-medium text-text">Current Password</label>
              <div className="flex items-center gap-2">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={isChanging}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="text-text-muted hover:text-text transition-colors p-2"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="py-3">
              <label className="block mb-2 text-sm font-medium text-text">New Password</label>
              <div className="flex items-center gap-2">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={isChanging}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-text-muted hover:text-text transition-colors p-2"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="py-3">
              <label className="block mb-2 text-sm font-medium text-text">Confirm Password</label>
              <div className="flex items-center gap-2">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={isChanging}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-text-muted hover:text-text transition-colors p-2"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

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

            <div className="border-t border-border"></div>

            <div className="flex items-center justify-between py-3">
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={() => navigate("/settings?tab=security")}
                disabled={isChanging}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordChange}
                variant="primary"
                size="sm"
                disabled={isChanging || !currentPassword || !newPassword || !confirmPassword || !isPasswordValid}
              >
                {isChanging ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;
