import useLogout from "@/hooks/auth/use-logout";
import { HelpCircle, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type HeaderProps = {
  employee: any;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
};

const Header = ({ employee, toggleSidebar, isSidebarOpen }: HeaderProps) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
    <header className="bg-foreground border-b border-border p-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5 leading-none">
          <h1 className="text-text">Companies</h1>
          <nav className="flex items-center text-sm text-text-muted gap-1">
            <a
              href="/"
              className="hover:text-primary">
              Dashboard
            </a>
            <span className="text-text-muted">/</span>
            <a
              href="/companies"
              className="hover:text-primary">
              Companies
            </a>
            <span className="text-text-muted">/</span>
            <span className="text-text">HubSpot</span>
          </nav>
        </div>

        <div className="flex items-center">
          <div className="text-text-muted mr-3 cursor-pointer hover:text-primary">
            <HelpCircle size={20} />
          </div>
          <div className="text-text-muted mr-3 cursor-pointer hover:text-primary">
            <Bell size={20} />
          </div>
          <div className="h-10 aspect-square bg-border rounded-lg"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;
