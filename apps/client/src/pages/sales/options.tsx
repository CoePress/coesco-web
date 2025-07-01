import { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Code,
  Target,
  Minus,
  Plus as PlusIcon,
} from "lucide-react";
import { PageHeader } from "@/components";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import { useGetOptionRules } from "@/hooks/config";

interface RuleCondition {
  id: string;
  type: "OPTION" | "EXPRESSION";
  operator?: "SELECTED" | "NOT_SELECTED" | "=" | "!=" | "<" | ">" | "<=" | ">=";
  optionId?: string;
  expression?: string;
  value?: string;
}

interface OptionRule {
  id: string;
  name: string;
  description?: string;
  action: "DISABLE" | "REQUIRE" | "SET_VALUE" | "SHOW_MESSAGE";
  priority: number;
  isActive: boolean;
  conditions: RuleCondition[];
  targetOptions: string[];
  targetValue?: string;
  message?: string;
  productClassIds?: string[];
}

const Options = () => {
  const [selectedRule, setSelectedRule] = useState<OptionRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // API calls
  const { entities: optionCategories, loading: categoriesLoading } =
    useGetEntities("/categories");
  const { entities: options, loading: optionsLoading } =
    useGetEntities("/options");
  const { entities: productClasses, loading: productClassesLoading } =
    useGetEntities("/classes");
  const { optionRules, loading: rulesLoading } = useGetOptionRules();

  // Transform API data to match component expectations
  const categories = optionCategories || [];
  const allOptions = options || [];
  const rules = optionRules || [];

  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction =
      selectedAction === "all" || rule.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  const handleCreateRule = () => {
    const newRule: OptionRule = {
      id: Date.now().toString(),
      name: "New Rule",
      description: "",
      action: "DISABLE",
      priority: 100,
      isActive: true,
      conditions: [],
      targetOptions: [],
    };
    setSelectedRule(newRule);
    setIsEditing(true);
  };

  const handleEditRule = (rule: OptionRule) => {
    setSelectedRule(rule);
    setIsEditing(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    // TODO: Implement API call to delete rule
    console.log("Delete rule:", ruleId);
    if (selectedRule?.id === ruleId) {
      setSelectedRule(null);
      setIsEditing(false);
    }
  };

  const handleSaveRule = () => {
    if (!selectedRule) return;

    if (selectedRule.conditions.length === 0) {
      alert("At least one condition is required");
      return;
    }

    if (selectedRule.targetOptions.length === 0) {
      alert("At least one target option is required");
      return;
    }

    // TODO: Implement API call to save rule
    console.log("Save rule:", selectedRule);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedRule(null);
  };

  const addCondition = () => {
    if (!selectedRule) return;

    const newCondition: RuleCondition = {
      id: Date.now().toString(),
      type: "OPTION",
      operator: "SELECTED",
    };

    setSelectedRule({
      ...selectedRule,
      conditions: [...selectedRule.conditions, newCondition],
    });
  };

  const removeCondition = (conditionId: string) => {
    if (!selectedRule) return;

    setSelectedRule({
      ...selectedRule,
      conditions: selectedRule.conditions.filter((c) => c.id !== conditionId),
    });
  };

  const updateCondition = (
    conditionId: string,
    updates: Partial<RuleCondition>
  ) => {
    if (!selectedRule) return;

    setSelectedRule({
      ...selectedRule,
      conditions: selectedRule.conditions.map((c) =>
        c.id === conditionId ? { ...c, ...updates } : c
      ),
    });
  };

  const addTargetOption = (optionId: string) => {
    if (!selectedRule) return;

    if (!selectedRule.targetOptions.includes(optionId)) {
      setSelectedRule({
        ...selectedRule,
        targetOptions: [...selectedRule.targetOptions, optionId],
      });
    }
  };

  const removeTargetOption = (optionId: string) => {
    if (!selectedRule) return;

    setSelectedRule({
      ...selectedRule,
      targetOptions: selectedRule.targetOptions.filter((id) => id !== optionId),
    });
  };

  const getOptionById = (id: string) =>
    allOptions.find((opt: any) => opt.id === id);
  const getCategoryById = (id: string) =>
    categories.find((cat: any) => cat.id === id);

  // Show loading state
  if (
    categoriesLoading ||
    optionsLoading ||
    productClassesLoading ||
    rulesLoading
  ) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader
        title="Option Rules"
        description={`${rules.length} rules · ${filteredRules.length} filtered`}
        actions={[
          {
            type: "button",
            label: "Create Rule",
            variant: "primary",
            icon: <Plus size={16} />,
            onClick: handleCreateRule,
          },
        ]}
      />

      <div className="flex flex-1 min-h-0">
        {/* Rules List */}
        <div className="w-80 border-r bg-foreground flex flex-col min-h-0">
          {/* Filters */}
          <div className="p-2 border-b bg-foreground flex-shrink-0">
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Search rules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="flex-1 px-3 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="all">All Actions</option>
                  <option value="DISABLE">Disable</option>
                  <option value="REQUIRE">Require</option>
                  <option value="SET_VALUE">Set Value</option>
                  <option value="SHOW_MESSAGE">Show Message</option>
                </select>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 px-3 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="all">All Categories</option>
                  {categories.map((cat: any) => (
                    <option
                      key={cat.id}
                      value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Rules List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="divide-y">
              {filteredRules.map((rule: any) => (
                <div
                  key={rule.id}
                  className={`p-4 cursor-pointer hover:bg-surface ${
                    selectedRule?.id === rule.id
                      ? "bg-surface border-l-2 border-l-primary"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedRule(rule);
                    setIsEditing(false);
                  }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-text">{rule.name}</h3>
                      {rule.description && (
                        <p className="text-sm text-text-muted mt-1">
                          {rule.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            rule.action === "REQUIRE"
                              ? "bg-success/10 text-success border border-success/20"
                              : rule.action === "DISABLE"
                                ? "bg-error/10 text-error border border-error/20"
                                : rule.action === "SET_VALUE"
                                  ? "bg-info/10 text-info border border-info/20"
                                  : "bg-warning/10 text-warning border border-warning/20"
                          }`}>
                          {rule.action}
                        </span>
                        <span className="text-xs text-text-muted">
                          Priority: {rule.priority}
                        </span>
                        {rule.isActive ? (
                          <Eye className="w-4 h-4 text-success" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-text-muted" />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRule(rule);
                        }}
                        className="p-1 text-text-muted hover:text-text">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRule(rule.id);
                        }}
                        className="p-1 text-text-muted hover:text-error">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rule Details/Editor */}
        <div className="flex-1 flex flex-col">
          {selectedRule ? (
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4 space-y-4">
                {/* Basic Information */}
                <div className="bg-foreground border border-border rounded p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-text-muted">
                      Basic Information
                    </h3>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 text-text-muted hover:text-text">
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1">
                        Rule Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={selectedRule.name}
                          onChange={(e) =>
                            setSelectedRule({
                              ...selectedRule,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-surface border border-border rounded text-text">
                          {selectedRule.name}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1">
                        Action
                      </label>
                      {isEditing ? (
                        <select
                          value={selectedRule.action}
                          onChange={(e) =>
                            setSelectedRule({
                              ...selectedRule,
                              action: e.target.value as any,
                            })
                          }
                          className="w-full px-3 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="DISABLE">Disable Options</option>
                          <option value="REQUIRE">Require Options</option>
                          <option value="SET_VALUE">Set Value</option>
                          <option value="SHOW_MESSAGE">Show Message</option>
                        </select>
                      ) : (
                        <div className="px-3 py-2 bg-surface border border-border rounded">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              selectedRule.action === "REQUIRE"
                                ? "bg-success/10 text-success border border-success/20"
                                : selectedRule.action === "DISABLE"
                                  ? "bg-error/10 text-error border border-error/20"
                                  : selectedRule.action === "SET_VALUE"
                                    ? "bg-info/10 text-info border border-info/20"
                                    : "bg-warning/10 text-warning border border-warning/20"
                            }`}>
                            {selectedRule.action}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-text-muted mb-1">
                      Description
                    </label>
                    {isEditing ? (
                      <textarea
                        value={selectedRule.description || ""}
                        onChange={(e) =>
                          setSelectedRule({
                            ...selectedRule,
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full px-3 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-surface border border-border rounded text-text min-h-[60px]">
                        {selectedRule.description || "No description provided"}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1">
                        Priority
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={selectedRule.priority}
                          onChange={(e) =>
                            setSelectedRule({
                              ...selectedRule,
                              priority: parseInt(e.target.value) || 100,
                            })
                          }
                          className="w-full px-3 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-surface border border-border rounded text-text">
                          {selectedRule.priority}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center">
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={selectedRule.isActive}
                            onChange={(e) =>
                              setSelectedRule({
                                ...selectedRule,
                                isActive: e.target.checked,
                              })
                            }
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                        ) : (
                          <div className="flex items-center">
                            {selectedRule.isActive ? (
                              <CheckCircle className="w-5 h-5 text-success mr-2" />
                            ) : (
                              <XCircle className="w-5 h-5 text-error mr-2" />
                            )}
                          </div>
                        )}
                        <span className="ml-2 text-sm text-text-muted">
                          {isEditing
                            ? "Active"
                            : selectedRule.isActive
                              ? "Active"
                              : "Inactive"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Conditions */}
                <div className="bg-foreground border border-border rounded p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-text-muted">
                      Conditions (Triggers)
                    </h3>
                    {isEditing && (
                      <button
                        onClick={addCondition}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-primary bg-primary/10 hover:bg-primary/20">
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add Condition
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {selectedRule.conditions.map((condition, index) => (
                      <div
                        key={condition.id}
                        className="border border-border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-text-muted">
                            Condition {index + 1}
                          </h4>
                          {isEditing && (
                            <button
                              onClick={() => removeCondition(condition.id)}
                              className="text-error hover:text-error/80">
                              <Minus className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-text-muted mb-1">
                                Type
                              </label>
                              <select
                                value={condition.type}
                                onChange={(e) =>
                                  updateCondition(condition.id, {
                                    type: e.target.value as any,
                                  })
                                }
                                className="w-full px-3 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary">
                                <option value="OPTION">Option Selection</option>
                                <option value="EXPRESSION">Expression</option>
                              </select>
                            </div>

                            {condition.type === "OPTION" ? (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-text-muted mb-1">
                                    Operator
                                  </label>
                                  <select
                                    value={condition.operator}
                                    onChange={(e) =>
                                      updateCondition(condition.id, {
                                        operator: e.target.value as any,
                                      })
                                    }
                                    className="w-full px-3 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary">
                                    <option value="SELECTED">
                                      Is Selected
                                    </option>
                                    <option value="NOT_SELECTED">
                                      Is Not Selected
                                    </option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-text-muted mb-1">
                                    Option
                                  </label>
                                  <select
                                    value={condition.optionId || ""}
                                    onChange={(e) =>
                                      updateCondition(condition.id, {
                                        optionId: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary">
                                    <option value="">Select Option</option>
                                    {allOptions.map((opt: any) => (
                                      <option
                                        key={opt.id}
                                        value={opt.id}>
                                        {opt.name} (
                                        {getCategoryById(opt.categoryId)
                                          ?.name || "Unknown"}
                                        )
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-text-muted mb-1">
                                    Operator
                                  </label>
                                  <select
                                    value={condition.operator}
                                    onChange={(e) =>
                                      updateCondition(condition.id, {
                                        operator: e.target.value as any,
                                      })
                                    }
                                    className="w-full px-3 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary">
                                    <option value="=">=</option>
                                    <option value="!=">!=</option>
                                    <option value="<">&lt;</option>
                                    <option value=">">&gt;</option>
                                    <option value="<=">&lt;=</option>
                                    <option value=">=">&gt;=</option>
                                  </select>
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-sm font-medium text-text-muted mb-1">
                                    Expression
                                  </label>
                                  <input
                                    type="text"
                                    value={condition.expression || ""}
                                    onChange={(e) =>
                                      updateCondition(condition.id, {
                                        expression: e.target.value,
                                      })
                                    }
                                    placeholder="e.g., spindle_power * 1.5"
                                    className="w-full px-3 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-text-muted">
                                Type:
                              </span>
                              <span className="text-sm text-text">
                                {condition.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-text-muted">
                                Operator:
                              </span>
                              <span className="text-sm text-text">
                                {condition.operator}
                              </span>
                            </div>
                            {condition.type === "OPTION" &&
                              condition.optionId && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-text-muted">
                                    Option:
                                  </span>
                                  <span className="text-sm text-text">
                                    {getOptionById(condition.optionId)?.name ||
                                      "Unknown Option"}
                                  </span>
                                </div>
                              )}
                            {condition.type === "EXPRESSION" &&
                              condition.expression && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-text-muted">
                                    Expression:
                                  </span>
                                  <span className="text-sm text-text">
                                    {condition.expression}
                                  </span>
                                </div>
                              )}
                            {condition.type === "EXPRESSION" &&
                              condition.value && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-text-muted">
                                    Value:
                                  </span>
                                  <span className="text-sm text-text">
                                    {condition.value}
                                  </span>
                                </div>
                              )}
                          </div>
                        )}

                        {isEditing && condition.type === "EXPRESSION" && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-text-muted mb-1">
                              Value
                            </label>
                            <input
                              type="text"
                              value={condition.value || ""}
                              onChange={(e) =>
                                updateCondition(condition.id, {
                                  value: e.target.value,
                                })
                              }
                              placeholder="e.g., 1000"
                              className="w-full px-3 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    {selectedRule.conditions.length === 0 && (
                      <div className="text-center py-6 text-text-muted">
                        <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-text-muted" />
                        <p className="text-sm">No conditions defined</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Options */}
                <div className="bg-foreground border border-border rounded p-4">
                  <h3 className="font-medium text-text-muted mb-3">
                    Target Options
                  </h3>

                  {isEditing ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Available Options */}
                      <div>
                        <h4 className="font-medium text-text-muted mb-2">
                          Available Options
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {categories.map((category: any) => (
                            <div
                              key={category.id}
                              className="border border-border rounded">
                              <div className="px-3 py-2 bg-surface border-b border-border">
                                <h5 className="font-medium text-sm text-text-muted">
                                  {category.name}
                                </h5>
                              </div>
                              <div className="p-2 space-y-1">
                                {allOptions
                                  .filter(
                                    (opt: any) => opt.categoryId === category.id
                                  )
                                  .map((option: any) => (
                                    <button
                                      key={option.id}
                                      onClick={() => addTargetOption(option.id)}
                                      disabled={selectedRule.targetOptions.includes(
                                        option.id
                                      )}
                                      className={`w-full text-left px-2 py-1 rounded text-sm ${
                                        selectedRule.targetOptions.includes(
                                          option.id
                                        )
                                          ? "bg-surface text-text-muted cursor-not-allowed"
                                          : "hover:bg-primary/10 text-text-muted hover:text-text"
                                      }`}>
                                      {option.name}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Selected Targets */}
                      <div>
                        <h4 className="font-medium text-text-muted mb-2">
                          Selected Targets
                        </h4>
                        <div className="space-y-2">
                          {selectedRule.targetOptions.map((optionId) => {
                            const option = getOptionById(optionId);
                            if (!option) return null;

                            return (
                              <div
                                key={optionId}
                                className="flex items-center justify-between p-2 bg-primary/10 border border-primary/20 rounded">
                                <div>
                                  <div className="font-medium text-sm text-text">
                                    {option.name}
                                  </div>
                                  <div className="text-xs text-text-muted">
                                    {getCategoryById(option.categoryId)?.name ||
                                      "Unknown"}
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeTargetOption(optionId)}
                                  className="text-primary hover:text-primary/80">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                          {selectedRule.targetOptions.length === 0 && (
                            <div className="text-center py-6 text-text-muted">
                              <Target className="w-6 h-6 mx-auto mb-2 text-text-muted" />
                              <p className="text-sm">
                                No target options selected
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedRule.targetOptions.map((optionId) => {
                        const option = getOptionById(optionId);
                        if (!option) return null;

                        return (
                          <div
                            key={optionId}
                            className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded">
                            <div>
                              <div className="font-medium text-sm text-text">
                                {option.name}
                              </div>
                              <div className="text-xs text-text-muted">
                                {getCategoryById(option.categoryId)?.name ||
                                  "Unknown"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {selectedRule.targetOptions.length === 0 && (
                        <div className="text-center py-6 text-text-muted">
                          <Target className="w-6 h-6 mx-auto mb-2 text-text-muted" />
                          <p className="text-sm">No target options selected</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action-specific fields */}
                {(selectedRule.action === "SET_VALUE" ||
                  selectedRule.action === "SHOW_MESSAGE") && (
                  <div className="bg-foreground border border-border rounded p-4">
                    <h3 className="font-medium text-text-muted mb-3">
                      {selectedRule.action === "SET_VALUE"
                        ? "Value Settings"
                        : "Message Settings"}
                    </h3>

                    {selectedRule.action === "SET_VALUE" ? (
                      <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">
                          Target Value
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={selectedRule.targetValue || ""}
                            onChange={(e) =>
                              setSelectedRule({
                                ...selectedRule,
                                targetValue: e.target.value,
                              })
                            }
                            placeholder="Enter the value to set"
                            className="w-full px-3 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-surface border border-border rounded text-text">
                            {selectedRule.targetValue || "No value set"}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">
                          Message
                        </label>
                        {isEditing ? (
                          <textarea
                            value={selectedRule.message || ""}
                            onChange={(e) =>
                              setSelectedRule({
                                ...selectedRule,
                                message: e.target.value,
                              })
                            }
                            rows={3}
                            placeholder="Enter the message to display"
                            className="w-full px-3 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-surface border border-border rounded text-text min-h-[80px]">
                            {selectedRule.message || "No message set"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-border rounded text-sm font-medium text-text-muted hover:bg-surface focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveRule}
                      className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                      Save Rule
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Code className="w-12 h-12 mx-auto text-text-muted mb-4" />
                <h3 className="text-lg font-medium text-text mb-2">
                  No Rule Selected
                </h3>
                <p className="text-text-muted mb-4">
                  Select a rule from the list or create a new one to get started
                </p>
                <button
                  onClick={handleCreateRule}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-primary hover:bg-secondary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Rule
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Options;
