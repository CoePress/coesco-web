import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { X, Home, Sun, Moon, ChevronsRight } from "lucide-react";

import modules from "@/config/modules";
import CommandBar from "./command-bar";
import { useTheme } from "@/contexts/theme.context";
import Button from "../common/button";
import { useAppContext } from "@/contexts/app.context";
import { __dev__ } from "@/config/env";
import { useAuth } from "@/contexts/auth.context";
import ChatSidebar from "./chat-sidebar";

// type HeaderProps = {
//   employee: any;
// };

// const Header = ({ employee }: HeaderProps) => {
//   const userMenuRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         userMenuRef.current &&
//         !userMenuRef.current.contains(event.target as Node)
//       ) {
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const initials = employee.firstName[0] + employee.lastName[0];

//   return (
//     <header className="bg-foreground border-b border-border p-2">
//       <div className="flex items-center justify-end">
//         {/* <div className="flex flex-col gap-0.5 leading-none">
//           <h1 className="text-text">Companies</h1>
//           <nav className="flex items-center text-sm text-text-muted gap-1">
//             <a
//               href="/"
//               className="hover:text-primary">
//               Dashboard
//             </a>
//             <span className="text-text-muted">/</span>
//             <a
//               href="/companies"
//               className="hover:text-primary">
//               Companies
//             </a>
//             <span className="text-text-muted">/</span>
//             <span className="text-text">HubSpot</span>
//           </nav>
//         </div> */}

//         <div className="flex items-center">
//           {/* <div className="text-text-muted mr-3 cursor-pointer hover:text-primary">
//             <HelpCircle size={20} />
//           </div>
//           <div className="text-text-muted mr-3 cursor-pointer hover:text-primary">
//             <Bell size={20} />
//           </div> */}
//           <div className="h-10 aspect-square bg-border rounded-lg flex items-center justify-center">
//             <span className="text-text-muted">{initials}</span>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// };

type SidebarProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  let sidebarLabel = "Dashboard";
  const location = useLocation();

  const trimmer = (path: string) => {
    return path.replace(/\/$/, "");
  };

  const isActive = (path: string) => {
    const trimmedPath = trimmer(path);
    const trimmedCurrentPath = trimmer(location.pathname);
    return trimmedCurrentPath === trimmedPath;
  };

  const currentModule = modules.find((m) =>
    location.pathname.startsWith(`/${m.slug}`)
  );

  if (!currentModule) {
    sidebarLabel = location.pathname.split("/")[1];
    sidebarLabel = sidebarLabel.charAt(0).toUpperCase() + sidebarLabel.slice(1);
  } else {
    sidebarLabel = currentModule.label;
  }

  return (
    <div
      className={`h-full bg-foreground border-r border-border shadow-sm transition-[width] duration-300 ease-in-out overflow-hidden select-none ${
        isOpen ? "w-60 border-l" : "w-0"
      } md:relative absolute z-50`}>
      <div
        className={`flex flex-col h-full transition-opacity duration-300 ${
          isOpen ? "w-60 opacity-100" : "w-0 opacity-0"
        }`}>
        <div className="flex items-center justify-center h-[57px] border-b border-border relative">
          <h1
            className={`text-xl font-semibold text-primary ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}>
            {sidebarLabel}
          </h1>
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="absolute right-4 md:hidden">
            <X size={16} />
          </Button>
        </div>
          <nav className="flex-1 overflow-y-auto p-2">
            {location.pathname.startsWith("/chat") ? (
              <ChatSidebar />
            ) : (
              <div className="flex flex-col gap-2">
                {currentModule?.pages?.map((page) => {
                  const fullPath = `/${currentModule.slug}${page.slug ? `/${page.slug}` : ""}`;
                  return (
                    <Link
                      key={page.slug || "index"}
                      to={trimmer(fullPath)}
                      className={`flex items-center gap-3 px-4 py-2 rounded ${
                        isOpen ? "opacity-100" : "opacity-0"
                      } ${
                        isActive(fullPath)
                          ? "bg-background text-primary"
                          : "text-text-muted hover:bg-surface"
                      }`}>
                      <page.icon size={18} />
                      <span className="font-medium text-sm">{page.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
      </div>
    </div>
  );
};

type LayoutProps = {
  children: React.ReactNode;
  employee: any;
};

const Layout = ({ employee, children }: LayoutProps) => {
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const commandBarRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { theme, toggleTheme } = useTheme();

  const { sidebarExpanded, toggleSidebar } = useAppContext();

  const handleCommandNavigation = (path: string) => {
    navigate(path);
    setIsCommandBarOpen(false);
  };

  const navigateUpOneLevel = () => {
    const currentPath = location.pathname;

    if (currentPath === "/") return;

    const pathWithoutTrailingSlash = currentPath.endsWith("/")
      ? currentPath.slice(0, -1)
      : currentPath;

    const lastSlashIndex = pathWithoutTrailingSlash.lastIndexOf("/");

    if (lastSlashIndex <= 0) {
      navigate("/");
    } else {
      const parentPath = pathWithoutTrailingSlash.slice(0, lastSlashIndex);
      navigate(parentPath);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "/") {
        e.preventDefault();
        e.stopPropagation();
        setIsCommandBarOpen(!isCommandBarOpen);
        return;
      }

      // Toggle theme with Ctrl+T/Cmd+T
      if (e.altKey && e.key === "t") {
        e.preventDefault();
        toggleTheme();
        return;
      }

      // Toggle sidebar with Ctrl+B/Cmd+B
      if (e.altKey && e.key === "[") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Go back a page with Escape when command bar is closed
      if (e.key === "Escape" && !isCommandBarOpen) {
        navigateUpOneLevel();
        return;
      }

      // Close command bar with Escape when it's open
      if (e.key === "Escape" && isCommandBarOpen) {
        setIsCommandBarOpen(false);
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [isCommandBarOpen, location.pathname, toggleTheme, toggleSidebar]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isCommandBarOpen &&
        commandBarRef.current &&
        !commandBarRef.current.contains(e.target as Node)
      ) {
        setIsCommandBarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCommandBarOpen]);

  const currentModule = modules.find((m) =>
    location.pathname.startsWith(`/${m.slug}`)
  );
  const defaultModule = currentModule?.slug || "production";

  return (
    <div className="flex h-[100dvh] w-screen bg-background text-foreground font-sans antialiased">
      <div className="bg-foreground hidden md:flex flex-col">
        <div className="flex items-center justify-center h-[57px] border-b border-border px-2">
          <img
            src="/images/logo-text.png"
            alt="logo"
            className="w-full object-contain max-w-12"
          />
        </div>
        <div className="flex flex-col justify-between flex-1">
          <div className="flex flex-col items-center justify-center px-2 gap-2 py-2">
            <button
              onClick={toggleSidebar}
              className="flex w-full justify-center items-center py-2 h-[36px] rounded text-text-muted hover:text-text hover:bg-surface transition-all duration-300 cursor-pointer">
              <ChevronsRight
                size={20}
                className={`transition-transform duration-200 ${
                  sidebarExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
            {modules
              .filter((module) => {
                if (module.slug === "admin" && user?.role !== "ADMIN") {
                  return false;
                }
                return true;
              })
              .map((module) => (
                <Link
                  key={module.slug}
                  to={`/${module.slug}`}
                  className={`flex w-full justify-center items-center py-2 h-[36px] rounded ${
                    location.pathname.startsWith(`/${module.slug}`)
                      ? "bg-background text-primary"
                      : "text-text-muted hover:bg-surface"
                  }`}>
                  <module.icon size={18} />
                </Link>
              ))}
          </div>

          <div className="flex flex-col items-center justify-center px-2 gap-2 py-2">
            <button
              onClick={toggleTheme}
              className="flex w-full justify-center items-center py-2 h-[36px] rounded text-text-muted hover:text-text hover:bg-surface transition-all duration-300 cursor-pointer">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              key="main-menu"
              to="/"
              className="flex w-full justify-center items-center py-2 h-[36px] rounded text-text-muted hover:bg-surface">
              <Home size={18} />
            </Link>
          </div>
        </div>
      </div>

      <Sidebar
        isOpen={sidebarExpanded}
        setIsOpen={toggleSidebar}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* <Header employee={employee} /> */}

        {isCommandBarOpen && (
          <div className="fixed inset-0 flex items-start justify-center pt-32 z-50 bg-background/50 backdrop-blur-sm">
            <div
              ref={commandBarRef}
              className="w-full max-w-2xl px-4">
              <CommandBar
                onNavigate={handleCommandNavigation}
                defaultModule={defaultModule}
                isOpen={isCommandBarOpen}
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-auto">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
