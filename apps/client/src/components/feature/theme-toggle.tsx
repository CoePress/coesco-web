import { useTheme } from "@/contexts/theme.context";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded hover:bg-surface transition-colors cursor-pointer"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun size={18} />
      ) : (
        <Moon className="h-5 w-5 text-text" />
      )}
    </button>
  );
}
