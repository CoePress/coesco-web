import { ReactNode, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical } from "lucide-react";

type Props = {
  title: string;
  description: string;
  actions?: ReactNode;
  goBack?: boolean;
  goBackTo?: string;
};

const PageHeader = ({ title, description, actions, goBack = false, goBackTo }: Props) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleGoBack = () => {
    if (goBackTo) {
      navigate(goBackTo);
    } else {
      navigate(-1);
    }
  };

  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      <div className="flex items-center justify-between bg-foreground p-2 min-h-[57px] border-b border-border">
        <div className="flex flex-col gap-1 text-nowrap">
          <h1 className="font-semibold text-text leading-none">{title}</h1>
          <div className="flex items-center gap-2">
            {goBack && (
              <>
                <button
                  onClick={handleGoBack}
                  className="leading-none text-xs text-text-muted cursor-pointer hover:underline">
                  Go Back
                </button>
                <span className="text-xs text-text-muted leading-none">|</span>
              </>
            )}
            <p className="text-xs text-text-muted leading-none">{description}</p>
          </div>
        </div>

        {actions && (
          <>
            {/* Desktop: Show actions directly */}
            <div className="hidden md:flex">{actions}</div>

            {/* Mobile: Show menu button */}
            <div className="md:hidden">
              <button
                ref={buttonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded hover:bg-surface text-text-muted">
                <MoreVertical size={20} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Actions Menu - Full width slide down */}
      {actions && (
        <div
          ref={menuRef}
          className={`md:hidden w-full bg-foreground border-b border-border shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}>
          <div className="p-4">
            {actions}
          </div>
        </div>
      )}
    </>
  );
};

export default PageHeader;
