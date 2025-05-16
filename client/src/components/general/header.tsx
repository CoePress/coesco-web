import { Button } from "@/components";
import useLogout from "@/hooks/auth/use-logout";
import { IEmployee } from "@/utils/types";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { MenuIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type HeaderProps = {
  user: IEmployee;
  toggleSidebar: () => void;
};

const Header = ({ user, toggleSidebar }: HeaderProps) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { logout } = useLogout();

  const firstName = user.firstName;
  const lastInitial = user.lastName.charAt(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
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
            variant="ghost"
            onClick={toggleSidebar}>
            <MenuIcon size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="relative"
            ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 hover:bg-surface rounded-lg p-2 cursor-pointer text-text-muted">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-text-muted">
                  {firstName} {lastInitial}.
                </span>
                <span className="text-xs text-text-muted">{user.jobTitle}</span>
              </div>
              <img
                src="https://via.placeholder.com/150"
                alt="User avatar"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-border"
              />
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
