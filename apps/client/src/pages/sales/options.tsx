import { useState } from "react";
import {
  Plus,
  Edit,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Code,
  Target,
  Filter,
} from "lucide-react";
import { PageHeader } from "@/components";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import { useGetOptionRules } from "@/hooks/config";

interface RuleCondition {
  id: string;
  conditionType: "SELECTION" | "EXPRESSION";
  operator?: "SELECTED" | "NOT_SELECTED" | "=" | "!=" | "<" | ">" | "<=" | ">=";
  optionId?: string;
  fieldId?: string;
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
  condition: RuleCondition;
  triggerOptions: any[]; // From API - array of objects with id, code, name, description
  targetOptions: any[]; // From API - array of objects with id, code, name, description
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
  const [selectedProductClass, setSelectedProductClass] =
    useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // API calls
  const { entities: optionCategories, loading: categoriesLoading } =
    useGetEntities("/categories");
  const { entities: options, loading: optionsLoading } =
    useGetEntities("/options");
  const { entities: productClasses, loading: productClassesLoading } =
    useGetEntities("/classes");
  const { optionRules, loading: rulesLoading } = useGetOptionRules();

  // Transform API data to match component expectations and deduplicate
  const categories = (optionCategories || []).filter(
    (cat: any, index: number, self: any[]) =>
      index === self.findIndex((c: any) => c.id === cat.id)
  );
  const allOptions = (options || []).filter(
    (opt: any, index: number, self: any[]) =>
      index === self.findIndex((o: any) => o.id === opt.id)
  );
  const rules = (optionRules || []).filter(
    (rule: any, index: number, self: any[]) =>
      index === self.findIndex((r: any) => r.id === rule.id)
  );

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
      condition: {
        id: Date.now().toString(),
        conditionType: "SELECTION",
        operator: "SELECTED",
      },
      triggerOptions: [],
      targetOptions: [],
    };
    setSelectedRule(newRule);
    setIsEditing(true);
  };

  const handleEditRule = (rule: OptionRule) => {
    setSelectedRule({
      ...rule,
      condition: rule.condition || {
        id: Date.now().toString(),
        conditionType: "SELECTION",
        operator: "SELECTED",
      },
      triggerOptions: Array.isArray(rule.triggerOptions)
        ? rule.triggerOptions
        : [],
      targetOptions: Array.isArray(rule.targetOptions)
        ? rule.targetOptions
        : [],
    });
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

    if (
      !selectedRule.condition ||
      Object.keys(selectedRule.condition).length === 0
    ) {
      alert("At least one condition is required");
      return;
    }

    if (uniqueTargetOptions.length === 0) {
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

  const updateCondition = (updates: Partial<RuleCondition>) => {
    if (!selectedRule) return;

    setSelectedRule({
      ...selectedRule,
      condition: { ...selectedRule.condition, ...updates },
    });
  };

  const addTargetOption = (optionId: string) => {
    if (!selectedRule) return;

    const option = allOptions.find((opt: any) => opt.id === optionId);
    if (option && !uniqueTargetOptions.some((opt) => opt.id === optionId)) {
      setSelectedRule({
        ...selectedRule,
        targetOptions: [...uniqueTargetOptions, option],
      });
    }
  };

  // Ensure targetOptions doesn't have duplicates
  const uniqueTargetOptions =
    selectedRule?.targetOptions?.filter(
      (opt, index, self) => self.findIndex((o) => o.id === opt.id) === index
    ) || [];

  const removeTargetOption = (optionId: string) => {
    if (!selectedRule) return;

    setSelectedRule({
      ...selectedRule,
      targetOptions: uniqueTargetOptions.filter((opt) => opt.id !== optionId),
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
            <div className="space-y-2">
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  placeholder="Search rules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-2 py-1 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-2 py-2 border border-border rounded text-text-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-primary ${
                    showFilters
                      ? "bg-primary/10 text-primary border-primary/20"
                      : ""
                  }`}>
                  <Filter className="w-4 h-4" />
                </button>

                {showFilters && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-foreground border border-border rounded shadow-lg p-2 space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Action
                      </label>
                      <select
                        value={selectedAction}
                        onChange={(e) => setSelectedAction(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="all">All Actions</option>
                        <option value="DISABLE">Disable</option>
                        <option value="REQUIRE">Require</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary">
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
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Product Class
                      </label>
                      <select
                        value={selectedProductClass}
                        onChange={(e) =>
                          setSelectedProductClass(e.target.value)
                        }
                        className="w-full px-2 py-1 text-xs bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="all">All Product Classes</option>
                        {(productClasses || []).map((pc: any) => (
                          <option
                            key={pc.id}
                            value={pc.name}>
                            {pc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rules List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="divide-y">
              {filteredRules.map((rule: any) => (
                <div
                  key={rule.id}
                  className={`p-2 cursor-pointer hover:bg-surface ${
                    selectedRule?.id === rule.id
                      ? "bg-surface border-l-2 border-l-primary"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedRule(rule);
                    setIsEditing(false);
                  }}>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-text">
                      {rule.name}
                    </h3>
                    {rule.description && (
                      <p className="text-xs text-text-muted mt-1">
                        {rule.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-text-muted">
                        {rule.action}
                      </span>
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
              <div className="p-2 space-y-2">
                {/* Basic Information & Conditions */}
                <div className="bg-foreground border border-border rounded p-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm text-text-muted">
                      Rule Configuration
                    </h3>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 text-text-muted hover:text-text">
                        <Edit className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* Name - Full Width */}
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
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
                          className="w-full px-2 py-1 text-xs bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <div className="px-2 py-1 text-xs bg-surface border border-border rounded text-text">
                          {selectedRule.name}
                        </div>
                      )}
                    </div>

                    {/* Description - Full Width */}
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
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
                          className="w-full px-2 py-1 text-xs bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <div className="px-2 py-1 text-xs bg-surface border border-border rounded text-text min-h-[40px]">
                          {selectedRule.description ||
                            "No description provided"}
                        </div>
                      )}
                    </div>

                    {/* Status and Action Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Status
                        </label>
                        {isEditing ? (
                          <select
                            value={selectedRule.isActive ? "true" : "false"}
                            onChange={(e) =>
                              setSelectedRule({
                                ...selectedRule,
                                isActive: e.target.value === "true",
                              })
                            }
                            className="w-full px-2 py-1 text-xs bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-1 focus:ring-primary">
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        ) : (
                          <div className="px-2 py-1 bg-surface border border-border rounded">
                            <span
                              className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${
                                selectedRule.isActive
                                  ? "bg-success/10 text-success border border-success/20"
                                  : "bg-error/10 text-error border border-error/20"
                              }`}>
                              {selectedRule.isActive ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
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
                            className="w-full px-2 py-1 text-xs bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-1 focus:ring-primary">
                            <option value="DISABLE">Disable Option(s)</option>
                            <option value="REQUIRE">Require Option(s)</option>
                          </select>
                        ) : (
                          <div className="px-2 py-1 bg-surface border border-border rounded">
                            <span
                              className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${
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

                    {/* Condition Type and Operator Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Condition Type
                        </label>
                        {isEditing ? (
                          <select
                            value={selectedRule.condition.conditionType}
                            onChange={(e) =>
                              updateCondition({
                                conditionType: e.target.value as any,
                                fieldId: undefined,
                                value: undefined,
                                operator:
                                  e.target.value === "SELECTION"
                                    ? "SELECTED"
                                    : "=",
                              })
                            }
                            className="w-full px-2 py-1 text-xs bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-1 focus:ring-primary">
                            <option value="SELECTION">Selection</option>
                            <option value="EXPRESSION">Expression</option>
                          </select>
                        ) : (
                          <div className="px-2 py-1 text-xs bg-surface border border-border rounded text-text">
                            {selectedRule.condition.conditionType}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Operator
                        </label>
                        {isEditing ? (
                          <select
                            value={selectedRule.condition.operator}
                            onChange={(e) =>
                              updateCondition({
                                operator: e.target.value as any,
                              })
                            }
                            className="w-full px-2 py-1 text-xs bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-1 focus:ring-primary">
                            {selectedRule.condition.conditionType ===
                            "SELECTION" ? (
                              <>
                                <option value="SELECTED">Selected</option>
                                <option value="NOT_SELECTED">
                                  Not Selected
                                </option>
                              </>
                            ) : (
                              <>
                                <option value="=">=</option>
                                <option value="!=">!=</option>
                                <option value="<">&lt;</option>
                                <option value=">">&gt;</option>
                                <option value="<=">&lt;=</option>
                                <option value=">=">&gt;=</option>
                              </>
                            )}
                          </select>
                        ) : (
                          <div className="px-2 py-1 text-xs bg-surface border border-border rounded text-text">
                            {selectedRule.condition.operator}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Field and Value Row (only for Expression) */}
                    {selectedRule.condition.conditionType === "EXPRESSION" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-text-muted mb-1">
                            Field
                          </label>
                          {isEditing ? (
                            <select
                              value={selectedRule.condition.fieldId || ""}
                              onChange={(e) =>
                                updateCondition({
                                  fieldId: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 text-xs bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-1 focus:ring-primary">
                              <option value="">Select Field</option>
                              <option value="price">Price</option>
                              <option value="quantity">Quantity</option>
                              <option value="weight">Weight</option>
                              <option value="temperature">Temperature</option>
                              <option value="speed">Speed</option>
                              <option value="power">Power</option>
                              <option value="dimensions.length">Length</option>
                              <option value="dimensions.width">Width</option>
                              <option value="dimensions.height">Height</option>
                              <option value="performance.efficiency">
                                Efficiency
                              </option>
                              <option value="performance.capacity">
                                Capacity
                              </option>
                            </select>
                          ) : (
                            <div className="px-2 py-1 text-xs bg-surface border border-border rounded text-text">
                              {selectedRule.condition.fieldId ||
                                "No field selected"}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-text-muted mb-1">
                            Value
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={selectedRule.condition.value || ""}
                              onChange={(e) =>
                                updateCondition({
                                  value: e.target.value,
                                })
                              }
                              placeholder="Enter value"
                              className="w-full px-2 py-1 text-xs bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          ) : (
                            <div className="px-2 py-1 text-xs bg-surface border border-border rounded text-text">
                              {selectedRule.condition.value || "No value set"}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trigger Options - Only show for SELECTION mode */}
                {selectedRule.condition.conditionType === "SELECTION" && (
                  <div className="bg-foreground border border-border rounded p-2">
                    <h3 className="font-medium text-xs text-text-muted mb-2">
                      Trigger Options
                    </h3>

                    {isEditing ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        {/* Available Options */}
                        <div>
                          <h4 className="font-medium text-xs text-text-muted mb-2">
                            Available Options
                          </h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {categories.map((category: any) => (
                              <div
                                key={category.id}
                                className="border border-border rounded">
                                <div className="px-2 py-2 bg-surface border-b border-border">
                                  <h5 className="font-medium text-xs text-text-muted">
                                    {category.name}
                                  </h5>
                                </div>
                                <div className="p-2 space-y-1">
                                  {allOptions
                                    .filter(
                                      (opt: any) =>
                                        opt.categoryId === category.id
                                    )
                                    .map((option: any) => (
                                      <button
                                        key={option.id}
                                        onClick={() => {
                                          if (
                                            !selectedRule.triggerOptions.some(
                                              (t: any) => t.id === option.id
                                            )
                                          ) {
                                            setSelectedRule({
                                              ...selectedRule,
                                              triggerOptions: [
                                                ...selectedRule.triggerOptions,
                                                option,
                                              ],
                                            });
                                          }
                                        }}
                                        disabled={selectedRule.triggerOptions.some(
                                          (t: any) => t.id === option.id
                                        )}
                                        className={`w-full text-left px-2 py-1 rounded text-xs ${
                                          selectedRule.triggerOptions.some(
                                            (t: any) => t.id === option.id
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

                        {/* Selected Triggers */}
                        <div>
                          <h4 className="font-medium text-xs text-text-muted mb-2">
                            Selected Triggers
                          </h4>
                          <div className="space-y-2">
                            {selectedRule.triggerOptions.map((option: any) => (
                              <div
                                key={option.id}
                                className="flex items-center justify-between p-2 bg-primary/10 border border-primary/20 rounded">
                                <div>
                                  <div className="font-medium text-xs text-text">
                                    {option.name}
                                  </div>
                                  <div className="text-xs text-text-muted">
                                    {getCategoryById(option.categoryId)?.name ||
                                      "Unknown"}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedRule({
                                      ...selectedRule,
                                      triggerOptions:
                                        selectedRule.triggerOptions.filter(
                                          (t: any) => t.id !== option.id
                                        ),
                                    });
                                  }}
                                  className="text-primary hover:text-primary/80">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            {selectedRule.triggerOptions.length === 0 && (
                              <div className="text-center py-2 text-text-muted">
                                <Target className="w-6 h-6 mx-auto mb-2 text-text-muted" />
                                <p className="text-xs">
                                  No trigger options selected
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedRule.triggerOptions.map((option: any) => (
                          <div
                            key={option.id}
                            className="flex items-center justify-between p-2 bg-primary/10 border border-primary/20 rounded">
                            <div>
                              <div className="font-medium text-xs text-text">
                                {option.name}
                              </div>
                              <div className="text-xs text-text-muted">
                                {getCategoryById(option.categoryId)?.name ||
                                  "Unknown"}
                              </div>
                            </div>
                          </div>
                        ))}
                        {selectedRule.triggerOptions.length === 0 && (
                          <div className="text-center py-2 text-text-muted">
                            <Target className="w-6 h-6 mx-auto mb-2 text-text-muted" />
                            <p className="text-xs">
                              No trigger options selected
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Target Options */}
                <div className="bg-foreground border border-border rounded p-2">
                  <h3 className="font-medium text-xs text-text-muted mb-2">
                    Target Options
                  </h3>

                  {isEditing ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                      {/* Available Options */}
                      <div>
                        <h4 className="font-medium text-xs text-text-muted mb-2">
                          Available Options
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {categories.map((category: any) => (
                            <div
                              key={category.id}
                              className="border border-border rounded">
                              <div className="px-2 py-2 bg-surface border-b border-border">
                                <h5 className="font-medium text-xs text-text-muted">
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
                                      disabled={uniqueTargetOptions.some(
                                        (opt) => opt.id === option.id
                                      )}
                                      className={`w-full text-left px-2 py-1 rounded text-xs ${
                                        uniqueTargetOptions.some(
                                          (opt) => opt.id === option.id
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
                        <h4 className="font-medium text-xs text-text-muted mb-2">
                          Selected Targets
                        </h4>
                        <div className="space-y-2">
                          {uniqueTargetOptions.map((option) => {
                            return (
                              <div
                                key={option.id}
                                className="flex items-center justify-between p-2 bg-primary/10 border border-primary/20 rounded">
                                <div>
                                  <div className="font-medium text-xs text-text">
                                    {option.name}
                                  </div>
                                  <div className="text-xs text-text-muted">
                                    {getCategoryById(option.categoryId)?.name ||
                                      "Unknown"}
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeTargetOption(option.id)}
                                  className="text-primary hover:text-primary/80">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                          {uniqueTargetOptions.length === 0 && (
                            <div className="text-center py-2 text-text-muted">
                              <Target className="w-6 h-6 mx-auto mb-2 text-text-muted" />
                              <p className="text-xs">
                                No target options selected
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {uniqueTargetOptions.map((option) => {
                        return (
                          <div
                            key={option.id}
                            className="flex items-center justify-between p-2 bg-primary/10 border border-primary/20 rounded">
                            <div>
                              <div className="font-medium text-xs text-text">
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
                      {uniqueTargetOptions.length === 0 && (
                        <div className="text-center py-2 text-text-muted">
                          <Target className="w-6 h-6 mx-auto mb-2 text-text-muted" />
                          <p className="text-xs">No target options selected</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action-specific fields */}
                {(selectedRule.action === "SET_VALUE" ||
                  selectedRule.action === "SHOW_MESSAGE") && (
                  <div className="bg-foreground border border-border rounded p-2">
                    <h3 className="font-medium text-text-muted mb-2">
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
                            className="w-full px-2 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        ) : (
                          <div className="px-2 py-2 bg-surface border border-border rounded text-text">
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
                            className="w-full px-2 py-2 bg-foreground border border-border rounded text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        ) : (
                          <div className="px-2 py-2 bg-surface border border-border rounded text-text min-h-[80px]">
                            {selectedRule.message || "No message set"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <button
                      onClick={handleCancelEdit}
                      className="px-2 py-2 border border-border rounded text-sm font-medium text-text-muted hover:bg-surface focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveRule}
                      className="px-2 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
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
                  className="inline-flex items-center px-2 py-2 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-primary hover:bg-secondary">
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
