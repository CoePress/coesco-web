import { useTheme } from "@/contexts/theme.context";
import { useAuth } from "@/contexts/auth.context";
import Button from "@/components/ui/button";
import { useSearchParams, useNavigate } from "react-router-dom";

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { employee } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "general";
  const navigate = useNavigate();

  return (
    <div className="flex justify-center w-full h-full">
      <div className="p-8 max-w-4xl w-full">
      {activeTab === "security" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm text-text-muted mb-1">Account security</h3>
            <p className="text-xs text-text-muted">Set up security measure for better protection</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm text-text mb-1">Email</div>
                <div className="text-xs text-text-muted">{employee?.email || "user@example.com"}</div>
              </div>
              <Button variant="secondary-outline" size="sm">
                Change email
              </Button>
            </div>

            <div className="border-t border-border"></div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm text-text mb-1">Password</div>
                <div className="text-xs text-text-muted">Change your account password</div>
              </div>
              <Button
                onClick={() => navigate("/settings/change-password")}
                variant="secondary-outline"
                size="sm"
              >
                Change Password
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "general" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm text-text-muted mb-1">General</h3>
            <p className="text-xs text-text-muted">Manage your general preferences</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm text-text mb-1">Theme</div>
                <div className="text-xs text-text-muted">Switch between light and dark mode</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => theme === "dark" && toggleTheme()}
                  className={`px-3 py-1.5 text-xs rounded border transition-all ${
                    theme === "light"
                      ? "bg-primary border-primary text-foreground"
                      : "bg-transparent border-border text-text hover:bg-surface"
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => theme === "light" && toggleTheme()}
                  className={`px-3 py-1.5 text-xs rounded border transition-all ${
                    theme === "dark"
                      ? "bg-primary border-primary text-foreground"
                      : "bg-transparent border-border text-text hover:bg-surface"
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default Settings;
