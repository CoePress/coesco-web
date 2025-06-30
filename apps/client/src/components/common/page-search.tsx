import { Search, ChevronDown, LucideIcon } from "lucide-react";
import { Button } from "..";

type PageSearchProps = {
  placeholder: string;
  filters: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
  }[];
  label?: string;
  labelTrigger?: boolean;
};

const PageSearch = ({
  placeholder = "Search...",
  filters,
  label,
  labelTrigger,
}: PageSearchProps) => {
  return (
    <div className="flex items-center justify-between p-2 bg-foreground border-b rounded-t-lg">
      <div className="flex items-center gap-2 justify-between w-full">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search
              size={18}
              className="text-text-muted"
            />
          </div>
          <input
            type="text"
            placeholder={placeholder}
            className="block w-full pl-10 pr-3 py-1.5 border rounded text-sm text-text-muted"
          />
        </div>

        <div className="flex gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.label}
              variant="secondary-outline">
              {filter.icon && <filter.icon size={16} />}
              {filter.label}
              <ChevronDown size={14} />
            </Button>
          ))}
        </div>
      </div>

      <div className="text-sm text-text-muted">
        {labelTrigger ? <span>{label}</span> : null}
      </div>
    </div>
  );
};

export default PageSearch;
