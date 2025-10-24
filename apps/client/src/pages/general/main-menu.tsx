import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Modal } from "@/components";
import modules from "@/config/modules";
import { Moon, Sun, LogOut, Code, MessageCircle, SettingsIcon } from "lucide-react";
import { useTheme } from "@/contexts/theme.context";
import { useAuth, AuthContext } from "@/contexts/auth.context";
import { useApi } from "@/hooks/use-api";
import { useState, useContext } from "react";
import { __dev__ } from "@/config/env";
import ToastContainer from "@/components/ui/toast-container";
import { useToast } from "@/hooks/use-toast";

const MainMenu = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, employee } = useAuth();
  const { setUser } = useContext(AuthContext)!;
  const { post } = useApi();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { toasts, removeToast } = useToast();

  const navigate = useNavigate()

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    await post("/auth/logout");
    setUser(null, null);
    setIsLogoutModalOpen(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const filteredModules = modules.filter((m) => {
    if (m.slug === "admin" && user?.role !== "ADMIN") {
      return false;
    }
    if (__dev__) {
      return m.status !== "inactive";
    }
    return m.status === "active";
  });

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] bg-background">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-2xl leading-none text-primary text-center">
          {getGreeting()}, {employee?.firstName}
        </h1>

        <div
          className="hidden md:grid gap-2 justify-center"
          style={{
            gridTemplateColumns: `repeat(${Math.min(filteredModules.length, 4)}, auto)`,
          }}>
          {filteredModules.map((module) => (
            <div key={module.slug}>
              {module.status !== "inactive" ? (
                <Link to={`/${module.slug}`}>
                  <Card className="hover:bg-surface transition-all duration-200 relative shadow">
                    <div className="absolute top-2 right-2">
                      {module.status === "development" && (
                        <Code
                          size={16}
                          className="text-primary"
                        />
                      )}
                    </div>
                    <div className="text-center flex flex-col items-center justify-center gap-2 w-24 aspect-square select-none">
                      <div className="text-primary">
                        <module.icon size={20} />
                      </div>
                      <span className="text-primary">{module.label}</span>
                    </div>
                  </Card>
                </Link>
              ) : (
                <Card>
                  <div className="text-center flex flex-col items-center justify-center gap-2 w-24 aspect-square select-none opacity-50 shadow">
                    <div className="text-text-muted/50">
                      <module.icon size={20} />
                    </div>
                    <span className="text-text-muted/50">{module.label}</span>
                  </div>
                </Card>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 w-full md:hidden">
          {modules.map((module) => (
            <div key={module.slug}>
              {module.status !== "inactive" ? (
                <Link
                  to={`/${module.slug}`}
                  className="w-full">
                  <Card className="hover:bg-surface transition-all duration-200 w-full shadow relative">
                    <div className="absolute top-2 right-2">
                      {module.status === "development" && (
                        <Code
                          size={16}
                          className="text-primary"
                        />
                      )}
                    </div>
                    <div className="text-center flex flex-col items-center justify-center gap-2 w-full select-none">
                      <div className="text-primary">
                        <module.icon size={20} />
                      </div>
                      <span className="text-primary">{module.label}</span>
                    </div>
                  </Card>
                </Link>
              ) : (
                <Card>
                  <div className="text-center flex flex-col items-center justify-center gap-2 w-full select-none opacity-50 shadow">
                    <div className="text-text-muted/50">
                      <module.icon size={20} />
                    </div>
                    <span className="text-text-muted/50">{module.label}</span>
                  </div>
                </Card>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-2 right-2 flex-col gap-2 hidden md:flex">
        {__dev__ && (
          <Button
            variant="secondary-outline"
            onClick={() => navigate("/chat")}
            className="w-32">
            <MessageCircle size={16} />
            ChatPLK
          </Button>
        )}
        <Button
          variant="secondary-outline"
          onClick={toggleTheme}
          className="w-32">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          {theme === "dark" ? "Light" : "Dark"}
        </Button>
        <Button
          variant="secondary-outline"
          onClick={() => navigate("/settings")}
          className="w-32">
          <SettingsIcon size={16} />
          Settings
        </Button>
        <Button
          variant="secondary-outline"
          onClick={handleLogout}
          className="w-32">
          <LogOut size={16} />
          Logout
        </Button>
      </div>

      <div className="md:hidden bg-foreground border-t border-border fixed bottom-0 left-0 right-0">
        <nav className="flex items-center justify-around h-16 px-2">
          {__dev__ && (
            <button
              onClick={() => navigate("/chat")}
              className="flex flex-col items-center gap-1 p-2 rounded text-text-muted transition-colors">
              <MessageCircle size={20} />
              <span className="text-xs">Chat</span>
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="flex flex-col items-center gap-1 p-2 rounded text-text-muted transition-colors">
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            <span className="text-xs">Theme</span>
          </button>

          <button
            onClick={() => navigate("/settings")}
            className="flex flex-col items-center gap-1 p-2 rounded text-text-muted transition-colors">
            <SettingsIcon size={20} />
            <span className="text-xs">Settings</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 p-2 rounded text-text-muted transition-colors">
            <LogOut size={20} />
            <span className="text-xs">Logout</span>
          </button>
        </nav>
      </div>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Logout"
        size="xs">
        <div className="flex flex-col gap-2">
          <p>Are you sure you want to log out?</p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary-outline"
              onClick={() => setIsLogoutModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmLogout}>
              Logout
            </Button>
          </div>
        </div>
      </Modal>
      <ToastContainer
        toasts={toasts}
        onRemoveToast={removeToast}
        position="bottom-right"
      />
    </div>
  );
};

export default MainMenu;
