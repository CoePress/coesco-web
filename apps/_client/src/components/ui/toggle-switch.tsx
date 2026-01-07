type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
};

const ToggleSwitch = ({ checked, onChange, label, id }: ToggleSwitchProps) => {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        id={id}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          checked ? "bg-primary" : "bg-border"
        }`}>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
      {label && (
        <label
          htmlFor={id}
          onClick={() => onChange(!checked)}
          className="text-sm text-text-muted cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
};

export default ToggleSwitch;
