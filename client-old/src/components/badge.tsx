import { cn } from "@/utils";
import { STATUS_MAPPING } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: string;
}

const Badge = ({ status = "neutral", className, ...props }: BadgeProps) => {
  const getState = (input: string): keyof typeof STATUS_MAPPING => {
    input = input.toLowerCase();

    const matchedCategory = Object.entries(STATUS_MAPPING).find(([_, config]) =>
      config.states.includes(input as never)
    )?.[0] as keyof typeof STATUS_MAPPING;

    return matchedCategory || "offline";
  };

  const mappedStatus = getState(status);
  const statusStyle = STATUS_MAPPING[mappedStatus];

  return (
    <div
      className={cn(
        "inline-flex px-2 py-0.5 text-xs rounded uppercase border",
        statusStyle.border,
        statusStyle.text,
        statusStyle.background,
        className
      )}
      {...props}
    />
  );
};

export default Badge;
