import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Modal } from "@/components";
import modules from "@/config/modules";
import { Moon, MessageCircle, Settings, Sun, LogOut, Code } from "lucide-react";
import { useTheme } from "@/contexts/theme.context";
import { useAuth } from "@/contexts/auth.context";
import useLogout from "@/hooks/auth/use-logout";
import { useState } from "react";
import { __dev__ } from "@/config/env";

const MainMenu = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { logout } = useLogout();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] bg-background">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-2xl leading-none text-primary text-center">
          {getGreeting()}, {user?.firstName}
        </h1>

        <div
          className="hidden md:grid gap-2 justify-center"
          style={{
            gridTemplateColumns: `repeat(${Math.min(
              Object.values(modules).filter((m) => {
                if (__dev__) {
                  return m.status !== "inactive";
                }
                return m.status === "active";
              }).length,
              4
            )}, auto)`,
          }}>
          {modules.map((module) => (
            <div key={module.path}>
              {module.status !== "inactive" ? (
                <Link to={module.path}>
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
          {Object.entries(modules).map(([key, module]) => (
            <div key={key}>
              {module.status !== "inactive" ? (
                <Link
                  to={module.path}
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
        <Button
          variant="secondary-outline"
          onClick={() => navigate("/chat")}
          className="w-32">
          <MessageCircle size={16} />
          ChatPLK
        </Button>
        <Button
          variant="secondary-outline"
          onClick={toggleTheme}
          className="w-32">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          {theme === "dark" ? "Light" : "Dark"}
        </Button>
        <Button
          variant="secondary-outline"
          onClick={handleLogout}
          className="w-32">
          <LogOut size={16} />
          Logout
        </Button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex justify-between p-2 bg-background md:hidden">
        <Button
          variant="secondary-outline"
          onClick={() => navigate("/chat")}
          className="flex-1 mx-1">
          <MessageCircle size={16} />
        </Button>
        <Button
          variant="secondary-outline"
          onClick={toggleTheme}
          className="flex-1 mx-1">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
        <Button
          variant="secondary-outline"
          className="flex-1 mx-1">
          <Settings size={16} />
        </Button>
        <Button
          variant="secondary-outline"
          onClick={handleLogout}
          className="flex-1 mx-1">
          <LogOut size={16} />
        </Button>
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
    </div>
  );
};

export default MainMenu;
