import {
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  CircleCheck,
  CircleX,
  CircleAlert,
  CircleMinus,
  Minus,
  CheckSquare,
  Square,
  ChevronLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Button,
  PageHeader,
  Modal,
  Loader,
  Table,
} from "@/components";
import { formatCurrency } from "@/utils";
import { isProductClassDescendant } from "@/utils";
import { useApi } from "@/hooks/use-api";

const SaveConfigModal = ({
  isOpen,
  onClose,
  configName,
  onSave,
  selectedOptions = [],
  totalPrice = 0,
}: {
  isOpen: boolean;
  onClose: () => void;
  configName: string;
  selectedOptions: any[];
  totalPrice: number;
  onSave: (data: { name: string; isTemplate: boolean }) => void;
}) => {
  const [name] = useState(configName);
  const [isTemplate] = useState(false);

  const handleSave = () => {
    onSave({ name, isTemplate });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save Configuration"
      size="xs">
      <div className="mt-2 border rounded p-2 bg-neutral-50">
        <h4 className="text-sm font-medium text-neutral-700 mb-2">
          Configuration Summary
        </h4>
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-neutral-600">
            <span>Selected Options:</span>
            <span>{selectedOptions.length}</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-600">
            <span>Total Value:</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={!name.trim()}>
        Save as Template
      </Button>

      <Button onClick={handleSave}>Add to Quote</Button>
    </Modal>
  );
};

const PerformanceRequirementsModal = ({
  isOpen,
  onClose,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: (requirements: Record<string, number>) => void;
}) => {
  const [selectedForm, setSelectedForm] = useState<string>("");
  const [requirements, setRequirements] = useState<Record<string, number>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  const performanceForms = [
    {
      id: "form_1",
      description: "Optimized for maximum throughput",
      category: "Production",
      customerName: "Tech Solutions Inc",
      createdDate: "2024-01-15",
      createdBy: "John Smith",
      requirements: {
        "Max Speed (RPM)": 8000,
        "Power Output (kW)": 15,
        "Accuracy (μm)": 5,
        "Work Area (mm)": 1000,
        "Tool Capacity": 24,
        "Spindle Torque (Nm)": 120,
        "Rapid Traverse (m/min)": 36,
        "Cutting Feed (m/min)": 12,
        "Coolant Flow (L/min)": 45,
        "Air Pressure (bar)": 6,
        "Voltage (V)": 400,
        "Frequency (Hz)": 50,
        "Weight (kg)": 2500,
        "Dimensions (mm)": 3200,
        "Noise Level (dB)": 75,
        "Vibration (mm/s)": 2.5,
        "Temperature Range (°C)": 45,
        "Humidity Range (%)": 80,
        "Duty Cycle (%)": 100,
        "MTBF (hours)": 15000,
      },
    },
    {
      id: "form_2",
      description: "High accuracy and fine detail work",
      category: "Precision",
      customerName: "Global Dynamics",
      createdDate: "2024-02-20",
      createdBy: "Sarah Johnson",
      requirements: {
        "Max Speed (RPM)": 6000,
        "Power Output (kW)": 10,
        "Accuracy (μm)": 2,
        "Work Area (mm)": 800,
        "Tool Capacity": 16,
        "Spindle Torque (Nm)": 150,
        "Rapid Traverse (m/min)": 24,
        "Cutting Feed (m/min)": 8,
        "Coolant Flow (L/min)": 50,
        "Air Pressure (bar)": 7,
        "Voltage (V)": 440,
      },
    },
    {
      id: "form_3",
      description: "Robust construction for demanding environments",
      category: "Heavy Duty",
      customerName: "Wayne Enterprises",
      createdDate: "2024-03-10",
      createdBy: "Mike Wilson",
      requirements: {
        "Max Speed (RPM)": 4000,
        "Power Output (kW)": 25,
        "Accuracy (μm)": 10,
        "Work Area (mm)": 1500,
        "Tool Capacity": 32,
        "Spindle Torque (Nm)": 180,
        "Rapid Traverse (m/min)": 28,
        "Cutting Feed (m/min)": 10,
        "Coolant Flow (L/min)": 60,
        "Air Pressure (bar)": 8,
        "Voltage (V)": 480,
      },
    },
    {
      id: "form_4",
      description: "Efficient assembly and light manufacturing",
      category: "Assembly",
      customerName: "Stark Industries",
      createdDate: "2024-01-30",
      createdBy: "Lisa Chen",
      requirements: {
        "Max Speed (RPM)": 3000,
        "Power Output (kW)": 5,
        "Accuracy (μm)": 15,
        "Work Area (mm)": 600,
        "Tool Capacity": 8,
        "Spindle Torque (Nm)": 80,
        "Rapid Traverse (m/min)": 20,
        "Cutting Feed (m/min)": 6,
        "Coolant Flow (L/min)": 30,
        "Air Pressure (bar)": 5,
        "Voltage (V)": 220,
      },
    },
    {
      id: "form_5",
      description: "Versatile machine for various applications",
      category: "General",
      customerName: "Acme Corporation",
      createdDate: "2024-02-15",
      createdBy: "David Brown",
      requirements: {
        "Max Speed (RPM)": 5000,
        "Power Output (kW)": 12,
        "Accuracy (μm)": 8,
        "Work Area (mm)": 900,
        "Tool Capacity": 20,
        "Spindle Torque (Nm)": 100,
        "Rapid Traverse (m/min)": 30,
        "Cutting Feed (m/min)": 10,
        "Coolant Flow (L/min)": 40,
        "Air Pressure (bar)": 6,
        "Voltage (V)": 380,
      },
    },
  ];

  const handleFormSelect = (formId: string) => {
    const form = performanceForms.find((f) => f.id === formId);
    if (form) {
      setSelectedForm(formId);
      setRequirements(form.requirements as Record<string, number>);
      setShowConfirmation(true);
    }
  };

  const handleApply = () => {
    onApply(requirements);
    onClose();
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setSelectedForm("");
    setRequirements({});
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        showConfirmation
          ? "Confirm Performance Requirements"
          : "Apply Performance Requirements"
      }
      size="sm">
      <div className="flex flex-col gap-4">
        {showConfirmation ? (
          <>
            <div className="text-sm text-text-muted">
              Are you sure you want to apply these performance requirements to
              your configuration?
            </div>

            <div className="space-y-2">
              <div>
                <div className="font-medium text-text">
                  {
                    performanceForms.find((f) => f.id === selectedForm)
                      ?.description
                  }
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">
                Performance Requirements
              </h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(requirements).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between">
                    <span className="text-sm text-text-muted flex-1">
                      {key}
                    </span>
                    <span className="text-sm font-medium text-text-muted">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="secondary-outline"
                onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleApply}>
                Apply
              </Button>
            </div>
          </>
        ) : (
          <>
            <Table
              columns={[
                {
                  key: "customerName",
                  header: "Customer Name",
                },
                {
                  key: "createdDate",
                  header: "Created Date",
                },
                {
                  key: "createdBy",
                  header: "Created By",
                },
                {
                  key: "actions",
                  header: "",
                  render: (_, row) => (
                    <div className="flex justify-end">
                      <Button
                        variant="secondary-outline"
                        onClick={() => handleFormSelect(row.id)}>
                        Select
                      </Button>
                    </div>
                  ),
                  className: "text-right",
                },
              ]}
              data={performanceForms}
              total={performanceForms.length}
            />

            <div className="flex justify-between gap-2 pt-2 border-t">
              <div className="flex gap-2 items-center">
                <Button
                  variant="secondary-outline"
                  size="sm">
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="primary"
                  size="sm">
                  1
                </Button>
                <Button
                  variant="secondary-outline"
                  size="sm">
                  2
                </Button>
                <Button
                  variant="secondary-outline"
                  size="sm">
                  3
                </Button>
                <Button
                  variant="secondary-outline"
                  size="sm">
                  <ChevronRight size={16} />
                </Button>
              </div>
              <Button
                variant="secondary-outline"
                onClick={onClose}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

const ConfigurationBuilder = () => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<any[]>([]);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [configName, setConfigName] = useState("Untitled Configuration");
  const [productClassSelections, setProductClassSelections] = useState<
    string[]
  >([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isRequirementsModalOpen, setIsRequirementsModalOpen] = useState(false);
  const [_appliedRequirements, setAppliedRequirements] = useState<
    Record<string, number>
  >({});

  const [productClasses, setProductClasses] = useState<any[]>([]);
  const [optionRules, setOptionRules] = useState<any[]>([]);
  const [productClassesLoading, setProductClassesLoading] = useState(true);
  const [optionRulesLoading, setOptionRulesLoading] = useState(true);
  const api = useApi();

  const selectedProductClass =
    productClassSelections.length > 0
      ? productClassSelections[productClassSelections.length - 1]
      : "";
  const effectiveProductClassId =
    selectedProductClass || productClasses?.[0]?.id;
  const [optionCategories, setOptionCategories] = useState<any[]>([]);
  const [optionCategoriesLoading, setOptionCategoriesLoading] = useState(false);

  const sortedCategories = optionCategories
    ? [...optionCategories].sort((a, b) => a.displayOrder - b.displayOrder)
    : [];

  const getOptionsForLevel = (
    level: number
  ): Array<{ id: string; name: string }> => {
    if (!productClasses) return [];

    if (level === 0) {
      return productClasses.filter((pc) => pc.parentId === null);
    }

    const parentId = productClassSelections[level - 1];
    return parentId
      ? productClasses.filter((pc) => pc.parentId === parentId)
      : [];
  };

  const handleProductClassSelectionChange = (level: number, value: string) => {
    if (!value) {
      setProductClassSelections(productClassSelections.slice(0, level));
      return;
    }

    const newSelections = [...productClassSelections.slice(0, level), value];
    setProductClassSelections(newSelections);
  };

  const visibleProductClassLevels = productClassSelections.length + 1;

  const getOptionsForCategory = (_categoryId: string) => {
    return [];
  };

  const getOptionById = (_optionId: string) => {
    return null;
  };

  const getCategoryById = (categoryId: string) => {
    if (!optionCategories) return null;
    return optionCategories.find((cat) => cat.id === categoryId);
  };

  const isOptionSelected = (optionId: string) => {
    return selectedOptions.some((opt) => opt.optionId === optionId);
  };

  const evaluateCondition = (condition: any): boolean => {
    switch (condition.type) {
      case "SIMPLE":
        if (condition.conditionType === "OPTION") {
          const state = condition.state || "SELECTED";
          const isSelected = isOptionSelected(condition.id);
          return state === "SELECTED" ? isSelected : !isSelected;
        } else if (condition.conditionType === "PRODUCT_CLASS") {
          return (
            condition.id === selectedProductClass ||
            isProductClassDescendant(
              selectedProductClass,
              condition.id,
              productClasses || []
            )
          );
        }
        return false;

      case "AND":
        return condition.conditions.every((cond: any) => evaluateCondition(cond));

      case "OR":
        return condition.conditions.some((cond: any) => evaluateCondition(cond));

      case "NOT":
        return !evaluateCondition(condition.condition);

      default:
        return false;
    }
  };

  const isRuleTriggered = (rule: any): boolean => {
    if (!rule.triggerOptions || rule.triggerOptions.length === 0) return false;
    const triggered = rule.triggerOptions.some((triggerOption: any) =>
      isOptionSelected(triggerOption.id)
    );
    console.log(
      `Rule "${rule.name}" triggered:`,
      triggered,
      "trigger options:",
      rule.triggerOptions?.map((opt: any) => opt.name) || []
    );
    return triggered;
  };

  const isOptionRequired = (optionId: string): boolean => {
    if (!optionRules) return false;

    const applicableRules = optionRules
      .filter(
        (rule) =>
          rule.action === "REQUIRE" &&
          rule.targetOptions?.some((target: any) => target.id === optionId)
      )
      .sort((a, b) => b.priority - a.priority);

    return applicableRules.some((rule) => isRuleTriggered(rule));
  };

  const getRequiredOptions = (): string[] => {
    const requiredOptions: string[] = [];

    if (!optionRules) {
      return requiredOptions;
    }

    for (const rule of optionRules) {
      if (rule.action === "REQUIRE" && isRuleTriggered(rule)) {
        requiredOptions.push(
          ...(rule.targetOptions?.map((opt: { id: string }) => opt.id) || [])
        );
      }
    }

    return [...new Set(requiredOptions)];
  };

  const getDisabledOptions = (): string[] => {
    const disabledOptions: string[] = [];

    if (!optionRules) return disabledOptions;

    for (const rule of optionRules) {
      if (rule.action === "DISABLE" && isRuleTriggered(rule)) {
        disabledOptions.push(
          ...(rule.targetOptions?.map((opt: { id: string }) => opt.id) || [])
        );
      }
    }

    return [...new Set(disabledOptions)];
  };

  const getCategoryStatus = (
    categoryId: string
  ): "valid" | "warning" | "error" | "incomplete" | "default" | "custom" => {
    const category = getCategoryById(categoryId);
    if (!category) return "valid";

    const hasSelection = selectedOptions.some((opt) => {
      const option: any = getOptionById(opt.optionId);
      return option?.categoryId === categoryId;
    });

    if (category.isRequired && !hasSelection) {
      return "error";
    }

    if (hasSelection) {
      const categoryOptions = getOptionsForCategory(categoryId);
      const hasWarning = categoryOptions.some(
        (opt: any) => isOptionRequired(opt.id) && !isOptionSelected(opt.id)
      );

      if (hasWarning) return "warning";

      const selectedCategoryOptions = selectedOptions.filter((opt) => {
        const option: any = getOptionById(opt.optionId);
        return option?.categoryId === categoryId;
      });

      const defaultOptions = categoryOptions.filter(
        (opt: any) => opt.isDefault
      );
      const selectedDefaultOptions = selectedCategoryOptions.filter((opt) => {
        const option: any = getOptionById(opt.optionId);
        return option?.isDefault;
      });

      const hasOnlyDefaults =
        selectedCategoryOptions.length === defaultOptions.length &&
        selectedDefaultOptions.length === defaultOptions.length;

      if (hasOnlyDefaults && defaultOptions.length > 0) {
        return "default";
      } else {
        return "valid";
      }
    }

    return "incomplete";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CircleCheck className="w-4 h-4 text-green-500" />;
      case "error":
        return <CircleAlert className="w-4 h-4 text-yellow-500" />;
      case "warning":
        return <CircleX className="w-4 h-4 text-red-500" />;
      case "incomplete":
        return <CircleMinus className="w-4 h-4 text-text-muted" />;
      case "default":
        return <CircleCheck className="w-4 h-4 text-blue-500" />;
      case "custom":
        return <CircleCheck className="w-4 h-4 text-green-500" />;
      default:
        return <CircleMinus className="w-4 h-4 text-text-muted" />;
    }
  };

  const calculateTotalPrice = () => {
    let total = 0;

    for (const selectedOpt of selectedOptions) {
      const option: any = getOptionById(selectedOpt.optionId);
      if (option) {
        total += option.price * selectedOpt.quantity;
      }
    }

    return total;
  };

  const handleErrorBannerClick = (categoryName: string) => {
    const targetCategory = sortedCategories.find(
      (cat) => cat.name === categoryName
    );
    if (targetCategory) {
      setExpandedCategories([targetCategory.id]);
    }
  };

  const validateConfiguration = () => {
    const results: any[] = [];

    const selectedOptionNames = selectedOptions.map((opt) => {
      const option: any = getOptionById(opt.optionId);
      return `${option?.name} (${option?.code})`;
    });
    console.log("SELECTED:", selectedOptionNames.join(", "));

    if (optionRules) {
      console.log(
        "ALL RULES:",
        optionRules.map((rule) => ({
          name: rule.name,
          action: rule.action,
          condition: rule.condition,
          targetOptions: rule.targetOptions?.map(
            (opt: { name: string }) => opt.name
          ) || [],
        }))
      );
    }

    for (const category of sortedCategories) {
      if (category.isRequired) {
        const hasSelection = selectedOptions.some((opt) => {
          const option: any = getOptionById(opt.optionId);
          return option?.categoryId === category.id;
        });

        if (!hasSelection) {
          results.push({
            valid: false,
            message: `${category.name} is required`,
            type: "warning",
            categoryName: category.name,
          });
        }
      }
    }

    const requiredOptions = getRequiredOptions();
    console.log(
      "REQUIRED OPTIONS:",
      requiredOptions.map((id) => {
        const option: any = getOptionById(id);
        return `${option?.name} (${option?.code})`;
      })
    );

    for (const optionId of requiredOptions) {
      if (!isOptionSelected(optionId)) {
        const option: any = getOptionById(optionId);
        if (option) {
          const category = getCategoryById(option.categoryId);
          if (category) {
            const hasSelectionInCategory = selectedOptions.some((opt) => {
              const selectedOption: any = getOptionById(opt.optionId);
              return selectedOption?.categoryId === category.id;
            });

            if (hasSelectionInCategory) {
              console.log(`MISSING REQUIRED: ${option.name} (${option.code})`);
              results.push({
                valid: false,
                message: `${option.name} is required based on current selection`,
                type: "error",
                categoryName: category.name,
              });
            }
          }
        }
      }
    }

    const disabledOptions = getDisabledOptions();
    console.log(
      "DISABLED OPTIONS:",
      disabledOptions.map((id) => {
        const option: any = getOptionById(id);
        return `${option?.name} (${option?.code})`;
      })
    );

    for (const optionId of disabledOptions) {
      if (isOptionSelected(optionId)) {
        const option: any = getOptionById(optionId);
        if (option) {
          const category = getCategoryById(option.categoryId);
          results.push({
            valid: false,
            message: `${option.name} is incompatible with current selection`,
            type: "error",
            categoryName: category?.name,
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({
        valid: true,
        message: "Configuration is valid",
        type: "success",
      });
    }

    console.log(
      "STATUS:",
      results.map((r) => `${r.type}: ${r.message}`).join(", ")
    );
    return results;
  };

  useEffect(() => {
    const loadProductClasses = async () => {
      setProductClassesLoading(true);
      const response = await api.get("/catalog/product-classes");
      if (response && response.data) {
        setProductClasses(response.data);
      }
      setProductClassesLoading(false);
    };
    loadProductClasses();
  }, []);

  useEffect(() => {
    const loadOptionRules = async () => {
      setOptionRulesLoading(true);
      const response = await api.get("/catalog/option-rules");
      if (response && response.data) {
        setOptionRules(response.data);
      }
      setOptionRulesLoading(false);
    };
    loadOptionRules();
  }, []);

  useEffect(() => {
    const loadOptionCategories = async () => {
      if (!effectiveProductClassId) {
        setOptionCategories([]);
        return;
      }
      setOptionCategoriesLoading(true);
      const response = await api.get('/catalog/option-categories');
      if (response && response.data) {
        setOptionCategories(response.data);
      }
      setOptionCategoriesLoading(false);
    };
    loadOptionCategories();
  }, [effectiveProductClassId]);

  useEffect(() => {
    const results = validateConfiguration();
    setValidationResults(results);
  }, [selectedOptions, selectedProductClass, optionCategories, optionRules]);

  useEffect(() => {
    if (
      productClasses &&
      productClasses.length > 0 &&
      productClassSelections.length === 0
    ) {
      const firstClass = productClasses.find((pc) => pc.parentId === null);
      if (firstClass) {
        setProductClassSelections([firstClass.id]);
      }
    }
  }, [productClasses, productClassSelections.length]);

  useEffect(() => {
    if (!optionCategories || optionCategories.length === 0) return;

    setExpandedCategories([]);

    setSelectedOptions([]);
  }, [selectedProductClass, optionCategories, optionRules]);

  useEffect(() => {
    setConfigName("Untitled Configuration");
  }, [selectedOptions, optionCategories]);

  const totalPrice = calculateTotalPrice();
  const pageTitle = configName;
  const pageDescription = `${
    selectedOptions.length
  } selected options · ${formatCurrency(totalPrice)} total value`;

  const handleSave = (data: { name: string; isTemplate: boolean }) => {
    console.log("Saving configuration:", data);
  };

  const handleCollapseAll = () => {
    setExpandedCategories([]);
  };

  const handleSelectAllDefaults = () => {
  };

  const handleDeselectAll = () => {
    setSelectedOptions([]);
  };

  const handleApplyRequirements = (requirements: Record<string, number>) => {
    setAppliedRequirements(requirements);
    console.log("Applied requirements:", requirements);
  };

  if (productClassesLoading || optionCategoriesLoading || optionRulesLoading) {
    return (
      <div className="w-full flex-1 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
      />

      <div className="p-2 gap-2 flex flex-1 min-h-0 overflow-hidden">
        <div className="w-80 border border-border bg-foreground rounded flex flex-col text-sm overflow-hidden">
          <div className="p-2 border-b bg-foreground flex-shrink-0">
            <h2 className="font-semibold text-text-muted">Product Class</h2>
            <div className={`mt-2 grid gap-2 ${(() => {
              const dropdownsWithOptions = Array.from({ length: visibleProductClassLevels })
                .filter((_, level) => getOptionsForLevel(level).length > 0).length;
              return dropdownsWithOptions === 1 ? 'grid-cols-1' : 'grid-cols-2';
            })()}`}>
              {Array.from({ length: visibleProductClassLevels }).map(
                (_, level) => {
                  const options = getOptionsForLevel(level);

                  return options.length > 0 ? (
                    <select
                      key={`product-class-${level}`}
                      value={productClassSelections[level] || ""}
                      onChange={(e) =>
                        handleProductClassSelectionChange(level, e.target.value)
                      }
                      className="w-full p-2 bg-foreground border border-border rounded text-text-muted focus:outline-none">
                      <option value="">
                        Select {level === 0 ? "Category" : "Option"}
                      </option>
                      {options.map((option: any) => (
                        <option
                          key={option.id}
                          value={option.id}>
                          {option.code}
                        </option>
                      ))}
                    </select>
                  ) : null;
                }
              )}
            </div>
          </div>

          <div className="p-2 border-b bg-foreground flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text-muted">
                Configuration Options
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleSelectAllDefaults}
                  className="p-1 hover:bg-surface rounded cursor-pointer"
                  title="Select all default options">
                  <CheckSquare
                    size={16}
                    className="text-text-muted"
                  />
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="p-1 hover:bg-surface rounded cursor-pointer"
                  title="Deselect all options">
                  <Square
                    size={16}
                    className="text-text-muted"
                  />
                </button>
                <button
                  onClick={handleCollapseAll}
                  className="p-1 hover:bg-surface rounded cursor-pointer"
                  title="Collapse all">
                  <Minus
                    size={16}
                    className="text-text-muted"
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="divide-y">
              {sortedCategories.map((category) => {
                const categoryStatus = getCategoryStatus(category.id);

                return (
                  <div
                    key={category.id}
                    className="py-1">
                    <button
                      onClick={() =>
                        setExpandedCategories((prev) =>
                          prev.includes(category.id)
                            ? prev.filter((id) => id !== category.id)
                            : [...prev, category.id]
                        )
                      }
                      className="w-full px-4 py-2 flex items-center justify-between hover:bg-surface cursor-pointer select-none">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex-shrink-0">
                          {getStatusIcon(categoryStatus)}
                        </div>
                        <span className="text-sm font-medium text-text-muted truncate">
                          {category.name} {category.isRequired && "*"}
                        </span>
                      </div>
                      <div className="flex-shrink-0">
                        {expandedCategories.includes(category.id) ? (
                          <ChevronDown
                            size={16}
                            className="text-text-muted"
                          />
                        ) : (
                          <ChevronRight
                            size={16}
                            className="text-text-muted"
                          />
                        )}
                      </div>
                    </button>

                    {expandedCategories.includes(category.id) && (
                      <div className="pl-4 pr-2 py-2 space-y-2">
                        <div className="text-sm text-text-muted">
                          No options available yet - showing categories only
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 border border-border bg-background rounded flex flex-col min-h-0">
          <div className="p-2 border-b bg-foreground flex-shrink-0">
            <h2 className="font-semibold text-text-muted">
              Current Configuration
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {validationResults.length > 0 && (
              <div className="p-2 space-y-2">
                {validationResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() =>
                      result.categoryName &&
                      handleErrorBannerClick(result.categoryName)
                    }
                    className={`p-2 rounded flex items-center gap-2 text-sm border select-none ${
                      result.type === "error"
                        ? "bg-error/10 text-error border-error hover:bg-error/20 cursor-pointer"
                        : result.type === "warning"
                          ? "bg-warning/10 text-warning border-warning hover:bg-warning/20 cursor-pointer"
                          : result.type === "success"
                            ? "bg-success/10 text-success border-success"
                            : "bg-info/10 text-info border-info"
                    }`}>
                    {result.type === "error" && <AlertCircle size={16} />}
                    {result.type === "warning" && <CircleX size={16} />}
                    {result.type === "success" && <CheckCircle size={16} />}
                    <span>{result.message}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="p-2">
              <div className="space-y-2">
                {sortedCategories.map((category) => {
                  const selectedCategoryOptions = selectedOptions
                    .filter((so) => {
                      const option: any = getOptionById(so.optionId);
                      return option?.categoryId === category.id;
                    })
                    .map((so) => {
                      const option = getOptionById(so.optionId);
                      return {
                        ...so,
                        option,
                      };
                    });

                  if (selectedCategoryOptions.length === 0) return null;

                  return (
                    <div
                      key={category.id}
                      className="p-2 bg-foreground border rounded">
                      <h3 className="font-medium text-text-muted mb-2">
                        {category.name}
                      </h3>
                      <div className="space-y-2">
                        {selectedCategoryOptions.map(
                          ({ optionId, quantity, option }) => (
                            <div
                              key={optionId}
                              className="flex items-center justify-between">
                              <div className="text-sm text-text-muted">
                                {option?.name}{" "}
                                {quantity > 1 ? `(x${quantity})` : ""}
                              </div>
                              <div className="text-sm font-medium text-text-muted">
                                {formatCurrency(
                                  option ? option.price * quantity : 0
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-between p-2 bg-foreground border rounded font-semibold">
                  <div className="text-text-muted">Total</div>
                  <div className="text-text-muted">
                    {formatCurrency(totalPrice)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* <div className="flex flex-1 bg-red-500 gap-2 p-2 overflow-hidden">
        <div className="w-80 bg-blue-500 flex flex-col overflow-hidden">
          <div className="p-2 bg-green-500 flex-shrink-0">Header</div>
          <div className="flex-1 overflow-y-auto bg-yellow-500">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="p-2 border-b">Item {i + 1}</div>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-blue-500"></div>
      </div> */}

      <SaveConfigModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        configName={configName}
        onSave={handleSave}
        selectedOptions={selectedOptions}
        totalPrice={totalPrice}
      />

      <PerformanceRequirementsModal
        isOpen={isRequirementsModalOpen}
        onClose={() => setIsRequirementsModalOpen(false)}
        onApply={handleApplyRequirements}
      />
    </div>
  );
};

export default ConfigurationBuilder;
