import { useNavigate } from "react-router-dom";
import { User, Moon, Sun, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/components/theme-provider";

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex flex-1 flex-col p-4 gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Account</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary">
              <User className="size-6" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{user?.username || "Unknown"}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {user?.role === "ADMIN" && <ShieldCheck className="size-3" />}
                {user?.role || "USER"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="size-5 text-muted-foreground" />
              ) : (
                <Sun className="size-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">
                  {theme === "dark" ? "Dark mode" : "Light mode"}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={toggleTheme}>
              {theme === "dark" ? (
                <>
                  <Sun className="size-4" />
                  Light
                </>
              ) : (
                <>
                  <Moon className="size-4" />
                  Dark
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-destructive/20 p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Session</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogOut className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Sign out</p>
                <p className="text-sm text-muted-foreground">
                  End your current session
                </p>
              </div>
            </div>
            <Button variant="destructive" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
