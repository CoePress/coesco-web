type TabsProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: {
    label: string;
    value: string;
    disabled?: boolean;
  }[];
};

const Tabs = ({ activeTab, setActiveTab, tabs }: TabsProps) => {
  return (
    <div className="bg-foreground border-b border-border">
      <div className="flex px-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.value
                ? "text-primary border-b-2 border-primary"
                : "text-text-muted hover:text-text"
            } ${tab.disabled ? "cursor-not-allowed opacity-50 pointer-events-none" : ""}`}
            onClick={() => setActiveTab(tab.value)}
            disabled={tab.disabled}>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
