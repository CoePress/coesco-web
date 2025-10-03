import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

type UseKeyboardShortcutsProps = {
  isCommandBarOpen: boolean;
  setIsCommandBarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
};

export const useKeyboardShortcuts = ({
  isCommandBarOpen,
  setIsCommandBarOpen,
  toggleTheme,
  toggleSidebar,
}: UseKeyboardShortcutsProps) => {
  const navigate = useNavigate();
  const location = useLocation();

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

      if (e.altKey && e.key === "t") {
        e.preventDefault();
        toggleTheme();
        return;
      }

      if (e.altKey && e.key === "[") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      if (e.key === "Escape" && !isCommandBarOpen) {
        navigateUpOneLevel();
        return;
      }

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
};
