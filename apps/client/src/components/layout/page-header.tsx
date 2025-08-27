import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  title: string;
  description: string;
  actions?: ReactNode;
  goBack?: boolean;
};

const PageHeader = ({ title, description, actions, goBack = false }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between bg-foreground p-2 min-h-[57px] border-b border-border">
      <div className="flex flex-col gap-1 text-nowrap">
        <div className="flex gap-2">
          <h1 className="font-semibold text-text leading-none">{title}</h1>
          {goBack && (
            <button
              onClick={() => navigate(-1)}
              className="leading-none text-xs text-text-muted cursor-pointer hover:underline">
              Go Back
            </button>
          )}
        </div>
        <p className="text-xs text-text-muted leading-none">{description}</p>
      </div>

      {actions && <>{actions}</>}
    </div>
  );
};

export default PageHeader;
