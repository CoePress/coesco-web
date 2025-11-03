type TabsProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: {
    label: string;
    value: string;
    disabled?: boolean;
    badge?: {
      type: 'pass' | 'fail' | 'partial' | 'pending';
      text: string;
    };
  }[];
};

const Tabs = ({ activeTab, setActiveTab, tabs }: TabsProps) => {
  return (
    <div className="bg-foreground border-b border-border">
      <div className="flex px-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === tab.value
                ? "text-primary border-b-2 border-primary"
                : "text-text-muted hover:text-text"
            } ${tab.disabled ? "cursor-not-allowed opacity-50 pointer-events-none" : ""}`}
            onClick={() => setActiveTab(tab.value)}
            disabled={tab.disabled}>
            {tab.label}
            {tab.badge && (
              <span className={`px-1.5 py-0.5 text-xs font-semibold rounded border ${
                tab.badge.type === 'pass' ? 'bg-success/20 text-success border-success/30' :
                tab.badge.type === 'fail' ? 'bg-error/20 text-error border-error/30' :
                tab.badge.type === 'partial' ? 'bg-warning/20 text-warning border-warning/30' :
                'bg-surface text-text-muted border-border'
              }`}>
                {tab.badge.text}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
