import { Button } from "@/components";
import useLogout from "@/hooks/auth/use-logout";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { MenuIcon, Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type HeaderProps = {
  toggleSidebar: () => void;
};

const Header = ({ toggleSidebar }: HeaderProps) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);

  const { logout } = useLogout();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
      if (
        quickAddRef.current &&
        !quickAddRef.current.contains(event.target as Node)
      ) {
        setIsQuickAddOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="h-16 w-full bg-foreground border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-2 h-full">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary-outline"
            onClick={toggleSidebar}>
            <MenuIcon size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="relative"
            ref={quickAddRef}>
            <button
              onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
              className="p-2 rounded-lg hover:bg-surface">
              <Plus size={16} />
            </button>

            {isQuickAddOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-foreground border border-border rounded-lg shadow-lg z-[99]">
                <div className="p-2 bg-surface border-b border-border">
                  <h3 className="text-sm font-medium text-text-muted">
                    Quick Add
                  </h3>
                </div>
                <div className="p-2">
                  <button className="w-full text-left p-3 hover:bg-surface rounded">
                    <div className="font-medium text-sm text-text ">
                      New Quote
                    </div>
                    <div className="text-xs text-text-muted">
                      Create a new quote
                    </div>
                  </button>
                  <button className="w-full text-left p-3 hover:bg-surface rounded">
                    <div className="font-medium text-sm text-text">
                      New Order
                    </div>
                    <div className="text-xs text-text-muted">
                      Create a new order
                    </div>
                  </button>
                  <button className="w-full text-left p-3 hover:bg-surface rounded">
                    <div className="font-medium text-sm text-text">
                      Schedule Maintenance
                    </div>
                    <div className="text-xs text-text-muted">
                      Add maintenance task
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            className="relative"
            ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 rounded-lg hover:bg-surface relative">
              <Bell className="w-5 h-5 text-text-muted" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-foreground border border-border rounded-lg shadow-lg z-[99]">
                <div className="p-2 bg-surface border-b border-border">
                  <h3 className="text-sm font-medium text-text-muted">
                    Notifications
                  </h3>
                </div>
                <div className="p-2">
                  <button className="w-full text-left p-3 hover:bg-surface rounded">
                    <div className="font-medium text-sm text-text ">
                      New maintenance schedule
                    </div>
                    <div className="text-xs text-text-muted">2 minutes ago</div>
                  </button>
                  <button className="w-full text-left p-3 hover:bg-surface rounded">
                    <div className="font-medium text-sm text-text">
                      Production target achieved
                    </div>
                    <div className="text-xs text-text-muted">1 hour ago</div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            className="relative"
            ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 hover:bg-surface rounded-lg p-2">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-text-muted">
                  John Doe
                </span>
                <span className="text-xs text-text-muted">Administrator</span>
              </div>
              <img
                src="https://via.placeholder.com/150"
                alt="User avatar"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-border"
              />
              <ChevronDown size={16} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-foreground border border-border rounded-lg shadow-lg z-[99]">
                <div className="py-1">
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:bg-surface">
                    <User size={16} />
                    Profile
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:bg-surface">
                    <Settings size={16} />
                    Settings
                  </button>
                  <div className="border-t border-border"></div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-surface">
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
