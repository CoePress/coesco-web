import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
  backButton?: boolean;
  onBack?: () => void;
};

const PageHeader = ({
  title,
  description,
  actions,
  backButton = false,
  onBack = () => {},
}: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex justify-between items-center p-2 border-b sticky top-0 bg-foreground z-10">
      <div className="flex items-center gap-2">
        {backButton && (
          <button
            onClick={handleBack}
            className="text-text-muted hover:text-text cursor-pointer">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-text leading-none">{title}</h1>
          <p className="text-xs text-text-muted leading-none">{description}</p>
        </div>
      </div>
      <div className="flex gap-2">{actions}</div>
    </div>
  );
};

export default PageHeader;
