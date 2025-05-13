import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Modal } from "@/components";
import modules from "@/config/modules";
import { Moon, MessageCircle, Settings, Sun, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/theme.context";
import { useAuth } from "@/contexts/auth.context";
import useLogout from "@/hooks/auth/use-logout";
import { useState } from "react";

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

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl leading-none text-primary text-center mb-2">
          Good morning, {user?.firstName}
        </h1>

        <div className="grid grid-cols-4 gap-2">
          {Object.entries(modules).map(([key, module]) => (
            <div key={key}>
              {module.status === "active" ? (
                <Link to={module.path}>
                  <Card className="hover:bg-surface transition-all duration-200">
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
                  <div className="text-center flex flex-col items-center justify-center gap-2 w-24 aspect-square select-none">
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

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary-outline"
            onClick={() => navigate("/chat")}>
            <MessageCircle size={16} />
            ChatPLK
          </Button>
          <Button variant="secondary-outline">
            <Settings size={16} />
            Settings
          </Button>
        </div>
      </div>

      <div className="absolute bottom-2 left-2">
        <Button
          variant="secondary-outline"
          onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
      </div>

      <div className="absolute bottom-2 right-2">
        <Button
          variant="secondary-outline"
          onClick={handleLogout}>
          <LogOut size={16} />
        </Button>
      </div>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Logout"
        size="xs">
        <div className="flex flex-col gap-4">
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
