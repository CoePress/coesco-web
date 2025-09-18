import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, Sun, Moon, ChevronsRight, BugIcon, Loader2 } from "lucide-react";
import * as htmlToImage from "html-to-image";

import modules from "@/config/modules";
import { useTheme } from "@/contexts/theme.context";
import { useAppContext } from "@/contexts/app.context";
import { __dev__ } from "@/config/env";
import ChatSidebar from "./chat-sidebar";
import CommandBar from "../feature/command-bar";
import ToastContainer from "@/components/ui/toast-container";
import { useToast } from "@/hooks/use-toast";
import Modal from "@/components/ui/modal";
import BugReportForm from "@/components/forms/bug-report-form";

type SidebarProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onTooltipMouseEnter: (e: React.MouseEvent, text: string) => void;
  onTooltipMouseLeave: () => void;
  screenshotAreaRef: React.RefObject<HTMLDivElement>;
};

const Sidebar = ({ isOpen, setIsOpen, onTooltipMouseEnter, onTooltipMouseLeave, screenshotAreaRef }: SidebarProps) => {
  let sidebarLabel = "Dashboard";
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

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
        isOpen ? "w-60" : "w-[50px]"
      } md:relative absolute z-50`}>
      <div className="flex flex-col h-full">
        <div className={`flex items-center h-[57px] border-b border-border px-2 ${
          isOpen ? "justify-between" : "justify-center"
        }`}>
          {isOpen && (
            <h1 className="text-xl font-semibold text-primary">
              {sidebarLabel}
            </h1>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex justify-center items-center p-2 rounded text-text-muted hover:text-text hover:bg-surface transition-all duration-300 cursor-pointer ${
              isOpen ? "" : "w-full"
            }`}>
            <ChevronsRight
              size={20}
              className={`transition-transform duration-200 shrink-0 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
            {location.pathname.startsWith("/chat") ? (
              <ChatSidebar 
                isOpen={isOpen} 
                onTooltipMouseEnter={onTooltipMouseEnter}
                onTooltipMouseLeave={onTooltipMouseLeave}
              />
            ) : (
              <div className="flex flex-col gap-2">
                {currentModule?.pages?.map((page) => {
                  const fullPath = `/${currentModule.slug}${page.slug ? `/${page.slug}` : ""}`;
                  return (
                    <Link
                      key={page.slug || "index"}
                      to={trimmer(fullPath)}
                      onMouseEnter={(e) => onTooltipMouseEnter(e, page.label)}
                      onMouseLeave={onTooltipMouseLeave}
                      className={`flex items-center gap-3 p-2 rounded transition-all duration-300 ${
                        isActive(fullPath)
                          ? "bg-background text-primary"
                          : "text-text-muted hover:bg-surface"
                      }`}>
                      {page.icon && <page.icon size={18} className="flex-shrink-0" />}
                      <span className={`font-medium text-sm transition-opacity duration-150 text-nowrap ${
                        isOpen ? "opacity-100" : "opacity-0"
                      }`}>{page.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
          
          <div className="flex flex-col items-center justify-center p-2 gap-2 border-t border-border">
            <button
              onClick={async () => {
                onTooltipMouseLeave(); // Hide tooltip when opening modal
                try {
                  if (!screenshotAreaRef.current) return;
                  setIsCapturing(true);
                  const dataUrl = await htmlToImage.toPng(screenshotAreaRef.current);
                  setScreenshot(dataUrl);
                } catch (error) {
                  console.warn('Screenshot failed:', error);
                  setScreenshot(null);
                } finally {
                  setIsCapturing(false);
                }
                setIsBugModalOpen(true);
              }}
              onMouseEnter={(e) => onTooltipMouseEnter(e, "Report Bug")}
              onMouseLeave={onTooltipMouseLeave}
              className="flex items-center gap-3 p-2 rounded transition-all duration-300 text-text-muted hover:text-text hover:bg-surface cursor-pointer w-full">
              {isCapturing ? (
                <Loader2 size={18} className="flex-shrink-0 animate-spin" />
              ) : (
                <BugIcon size={18} className="flex-shrink-0" />
              )}
              <span className={`font-medium text-sm transition-opacity duration-150 text-nowrap ${
                isOpen ? "opacity-100" : "opacity-0"
              }`}>Report Bug</span>
            </button>
          
            <button
              onClick={toggleTheme}
              onMouseEnter={(e) => onTooltipMouseEnter(e, theme === "dark" ? "Light Mode" : "Dark Mode")}
              onMouseLeave={onTooltipMouseLeave}
              className="flex items-center gap-3 p-2 rounded transition-all duration-300 text-text-muted hover:text-text hover:bg-surface cursor-pointer w-full">
              {theme === "dark" ? <Sun size={18} className="flex-shrink-0" /> : <Moon size={18} className="flex-shrink-0" />}
              <span className={`font-medium text-sm transition-opacity duration-150 text-nowrap ${
                isOpen ? "opacity-100" : "opacity-0"
              }`}>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>

            <Link
              key="main-menu"
              to="/"
              onMouseEnter={(e) => onTooltipMouseEnter(e, "Main Menu")}
              onMouseLeave={onTooltipMouseLeave}
              className="flex items-center gap-3 p-2 rounded transition-all duration-300 text-text-muted hover:bg-surface w-full">
              <Home size={18} className="flex-shrink-0" />
              <span className={`font-medium text-sm transition-opacity duration-150 text-nowrap ${
                isOpen ? "opacity-100" : "opacity-0"
              }`}>Main Menu</span>
            </Link>
          </div>
      </div>
      
      <Modal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
        title="Report Bug"
        size="md"
      >
        <BugReportForm
          onSubmit={() => {}}
          onCancel={() => setIsBugModalOpen(false)}
          screenshot={screenshot}
        />
      </Modal>
    </div>
  );
};

type LayoutProps = {
  children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<{text: string, rect: DOMRect} | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const commandBarRef = useRef<HTMLDivElement>(null);
  const screenshotAreaRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  const { toggleTheme } = useTheme();
  const { sidebarExpanded, toggleSidebar } = useAppContext();
  const { toasts, removeToast } = useToast();

  const handleTooltipMouseEnter = (e: React.MouseEvent, text: string) => {
    if (!sidebarExpanded) {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredTooltip({ text, rect });
    }
  };

  const handleTooltipMouseLeave = () => {
    setHoveredTooltip(null);
  };

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
    <div ref={screenshotAreaRef} className="flex h-[100dvh] w-screen bg-background text-foreground font-sans antialiased">
      <Sidebar
        isOpen={sidebarExpanded}
        setIsOpen={toggleSidebar}
        onTooltipMouseEnter={handleTooltipMouseEnter}
        onTooltipMouseLeave={handleTooltipMouseLeave}
        screenshotAreaRef={screenshotAreaRef}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
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
      
      {hoveredTooltip && (
        <div
          className="fixed px-2 py-1 bg-surface border border-border text-text text-xs rounded whitespace-nowrap z-[999] pointer-events-none shadow-lg"
          style={{
            left: hoveredTooltip.rect.right + 8,
            top: hoveredTooltip.rect.top + hoveredTooltip.rect.height / 2,
            transform: 'translateY(-50%)'
          }}>
          {hoveredTooltip.text}
        </div>
      )}
      
      <ToastContainer 
        toasts={toasts} 
        onRemoveToast={removeToast}
        position="bottom-right" 
      />
    </div>
  );
};

export default Layout;
