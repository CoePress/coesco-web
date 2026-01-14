import React from 'react';

interface ScenarioTabsProps {
  activeScenario: number;
  maxScenarios: number;
  onScenarioChange: (scenarioId: number) => void;
  scenarios?: Array<{ id: number; label: string; }>;
  className?: string;
}

export const ScenarioTabs: React.FC<ScenarioTabsProps> = ({
  activeScenario,
  maxScenarios,
  onScenarioChange,
  scenarios,
  className = '',
}) => {
  const defaultScenarios = Array.from({ length: maxScenarios }, (_, i) => ({
    id: i + 1,
    label: i === 0 ? 'Scenario 1 (Primary)' : `Scenario ${i + 1}`,
  }));

  const scenarioList = scenarios || defaultScenarios;

  return (
    <div className={`flex gap-2 mb-6 border-b border-border ${className}`}>
      {scenarioList.map(scenario => (
        <button
          key={scenario.id}
          type="button"
          className={`px-4 py-2 font-medium transition-colors rounded-t-md ${activeScenario === scenario.id
              ? 'bg-primary/10 border-b-2 border-primary text-primary'
              : 'text-text-muted hover:text-text hover:bg-surface-hover'
            }`}
          onClick={() => onScenarioChange(scenario.id)}
        >
          {scenario.label}
        </button>
      ))}
    </div>
  );
};
