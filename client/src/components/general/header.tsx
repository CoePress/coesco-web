import { Button } from "@/components";
import useLogout from "@/hooks/auth/use-logout";
import { LogOut, Settings, User, ChevronsRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type HeaderProps = {
  employee: any;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
};

const Header = ({ employee, toggleSidebar, isSidebarOpen }: HeaderProps) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { logout } = useLogout();

  const firstName = employee.firstName;
  const lastInitial = employee.lastName.charAt(0);
  const initials = `${firstName.charAt(0)}${lastInitial}`;

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
            <ChevronsRight
              size={20}
              className={`transition-transform duration-200 ${
                isSidebarOpen ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="relative"
            ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 hover:bg-surface rounded p-2 cursor-pointer text-text-muted">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-text-muted">
                  {firstName} {lastInitial}.
                </span>
                <span className="text-xs text-text-muted">
                  {employee.jobTitle}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full object-cover ring-2 ring-border flex items-center justify-center">
                <span className="text-sm font-medium text-text-muted leading-none tracking-tighter">
                  {initials}
                </span>
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-foreground border border-border rounded shadow-lg z-[99]">
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
