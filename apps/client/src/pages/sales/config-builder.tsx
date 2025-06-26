import {
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  CircleCheck,
  CircleX,
  CircleAlert,
  CircleMinus,
  Import,
  Save,
  Minus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, PageHeader, Modal } from "@/components";
import { formatCurrency } from "@/utils";
import { isProductClassDescendant } from "@/utils";
import {
  sampleOptionCategories,
  sampleOptions,
  sampleOptionRules,
  sampleProductClasses,
} from "@/utils/sample-data";
import {
  Rule,
  RuleAction,
  RuleCondition,
  SelectedOption,
  ValidationResult,
} from "@/utils/types";

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
  selectedOptions: SelectedOption[];
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

const ConfigBuilder = () => {
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [validationResults, setValidationResults] = useState<
    ValidationResult[]
  >([]);
  const [configName, setConfigName] = useState("Untitled Configuration");
  const [selectedProductClass, setSelectedProductClass] =
    useState<string>("foo"); // Default product class
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const getProductClassHierarchy = (productClassId: string): string[] => {
    const hierarchy: string[] = [productClassId];
    let currentClass = sampleProductClasses.find(
      (pc) => pc.id === productClassId
    );

    while (currentClass?.parentId) {
      hierarchy.push(currentClass.parentId);
      currentClass = sampleProductClasses.find(
        (pc) => pc.id === currentClass?.parentId
      );
    }

    return hierarchy;
  };

  const sortedCategories = [...sampleOptionCategories]
    .filter((category) => {
      const productClassHierarchy =
        getProductClassHierarchy(selectedProductClass);
      return category.productClassIds.some((id) =>
        productClassHierarchy.includes(id)
      );
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const getOptionsForCategory = (categoryId: string) => {
    return sampleOptions
      .filter((opt) => opt.categoryId === categoryId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  };

  const getOptionById = (optionId: string) => {
    return sampleOptions.find((opt) => opt.id === optionId);
  };

  const getCategoryById = (categoryId: string) => {
    return sampleOptionCategories.find((cat) => cat.id === categoryId);
  };

  const isOptionSelected = (optionId: string) => {
    return selectedOptions.some((opt) => opt.optionId === optionId);
  };

  const getOptionQuantity = (optionId: string) => {
    const option = selectedOptions.find((opt) => opt.optionId === optionId);
    return option ? option.quantity : 0;
  };

  const evaluateCondition = (condition: RuleCondition): boolean => {
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
              sampleProductClasses
            )
          );
        }
        return false;

      case "AND":
        return condition.conditions.every((cond) => evaluateCondition(cond));

      case "OR":
        return condition.conditions.some((cond) => evaluateCondition(cond));

      case "NOT":
        return !evaluateCondition(condition.condition);

      default:
        return false;
    }
  };

  const getApplicableRules = (): Rule[] => {
    let rules = sampleOptionRules.filter((rule) => rule.active);

    rules.sort((a, b) => a.priority - b.priority);

    const productClassHierarchy: string[] = [];
    let currentClass = selectedProductClass;

    while (currentClass) {
      productClassHierarchy.push(currentClass);
      const parentClass = sampleProductClasses.find(
        (pc) => pc.id === currentClass
      )?.parentId;
      currentClass = parentClass || "";
    }

    return rules;
  };

  const shouldDisableOption = (optionId: string): boolean => {
    const rules = getApplicableRules()
      .filter((rule) => rule.targetOptionIds.includes(optionId))
      .sort((a, b) => b.priority - a.priority);

    return rules.some(
      (rule) =>
        rule.active &&
        rule.action === RuleAction.DISABLE &&
        evaluateCondition(rule.condition)
    );
  };

  const isOptionRequired = (optionId: string): boolean => {
    const rules = getApplicableRules()
      .filter(
        (rule) =>
          rule.targetOptionIds.includes(optionId) &&
          rule.action === RuleAction.REQUIRE
      )
      .sort((a, b) => b.priority - a.priority);

    return rules.some((rule) => evaluateCondition(rule.condition));
  };

  const getDefaultOptions = () => {
    return sampleOptions
      .filter((option) => option.isStandard && !shouldDisableOption(option.id))
      .map((option) => option.id);
  };

  const handleOptionSelect = (
    optionId: string,
    categoryId: string,
    checked: boolean
  ) => {
    const category = getCategoryById(categoryId);
    if (!category) return;

    if (checked) {
      if (!category.allowMultiple) {
        setSelectedOptions((prev) => {
          const otherCategoryOptions = prev.filter((opt) => {
            const optDetails = getOptionById(opt.optionId);
            return optDetails?.categoryId !== categoryId;
          });

          return [...otherCategoryOptions, { optionId, quantity: 1 }];
        });
      } else {
        setSelectedOptions((prev) => [...prev, { optionId, quantity: 1 }]);
      }
    } else {
      setSelectedOptions((prev) =>
        prev.filter((opt) => opt.optionId !== optionId)
      );
    }
  };

  const handleQuantityChange = (optionId: string, quantity: number) => {
    if (quantity < 1) return;

    setSelectedOptions((prev) =>
      prev.map((opt) =>
        opt.optionId === optionId ? { ...opt, quantity } : opt
      )
    );
  };

  const getCategoryStatus = (
    categoryId: string
  ): "valid" | "warning" | "error" | "incomplete" => {
    const category = getCategoryById(categoryId);
    if (!category) return "valid";

    const hasSelection = selectedOptions.some((opt) => {
      const option = getOptionById(opt.optionId);
      return option?.categoryId === categoryId;
    });

    if (category.isRequired && !hasSelection) {
      return "error";
    }

    if (hasSelection) {
      const categoryOptions = getOptionsForCategory(categoryId);
      const hasWarning = categoryOptions.some(
        (opt) => isOptionRequired(opt.id) && !isOptionSelected(opt.id)
      );
      return hasWarning ? "warning" : "valid";
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
      default:
        return <CircleMinus className="w-4 h-4 text-text-muted" />;
    }
  };

  const calculateTotalPrice = () => {
    let total = 0;

    for (const selectedOpt of selectedOptions) {
      const option = getOptionById(selectedOpt.optionId);
      if (option) {
        total += option.price * selectedOpt.quantity;
      }
    }

    return total;
  };

  const validateConfiguration = () => {
    const results: ValidationResult[] = [];

    for (const category of sortedCategories) {
      if (category.isRequired) {
        const hasSelection = selectedOptions.some((opt) => {
          const option = getOptionById(opt.optionId);
          return option?.categoryId === category.id;
        });

        if (!hasSelection) {
          results.push({
            valid: false,
            message: `${category.name} is required`,
            type: "error",
          });
        }
      }
    }

    for (const option of sampleOptions) {
      if (isOptionRequired(option.id) && !isOptionSelected(option.id)) {
        let requirementReason = "";

        const requireRules = sampleOptionRules.filter(
          (rule) =>
            rule.targetOptionIds.includes(option.id) &&
            rule.action === "REQUIRE" &&
            rule.active &&
            evaluateCondition(rule.condition)
        );

        if (requireRules.length > 0) {
          requirementReason = ` (${requireRules[0].description})`;
        }

        results.push({
          valid: false,
          message: `${option.name} is required${requirementReason}`,
          type: "warning",
        });
      }
    }

    if (results.length === 0) {
      results.push({
        valid: true,
        message: "Configuration is valid",
        type: "success",
      });
    }

    return results;
  };

  useEffect(() => {
    const results = validateConfiguration();
    setValidationResults(results);
  }, [selectedOptions, selectedProductClass]);

  useEffect(() => {
    const emptyCategoryIds = sortedCategories
      .filter((category) => {
        const hasSelections = selectedOptions.some((opt) => {
          const option = getOptionById(opt.optionId);
          return option?.categoryId === category.id;
        });
        return !hasSelections;
      })
      .map((cat) => cat.id);

    if (emptyCategoryIds.length > 0) {
      const defaultOptions = getDefaultOptions();
      for (const optionId of defaultOptions) {
        const option = getOptionById(optionId);
        if (
          option &&
          emptyCategoryIds.includes(option.categoryId) &&
          !shouldDisableOption(optionId)
        ) {
          const category = getCategoryById(option.categoryId);
          if (category) {
            handleOptionSelect(optionId, category.id, true);
          }
        }
      }
    }
  }, [selectedProductClass]);

  useEffect(() => {
    if (selectedOptions.length > 0) {
      const brandOption = selectedOptions.find((so) => {
        const opt = getOptionById(so.optionId);
        return opt?.categoryId === "cat_brand";
      });

      const tierOption = selectedOptions.find((so) => {
        const opt = getOptionById(so.optionId);
        return opt?.categoryId === "cat_tier";
      });

      const sizeOption = selectedOptions.find((so) => {
        const opt = getOptionById(so.optionId);
        return opt?.categoryId === "cat_size";
      });

      const brand = brandOption
        ? getOptionById(brandOption.optionId)?.name
        : "";
      const tier = tierOption ? getOptionById(tierOption.optionId)?.name : "";
      const size = sizeOption ? getOptionById(sizeOption.optionId)?.name : "";

      if (brand && tier && size) {
        setConfigName(`${brand} ${tier} ${size}`);
      } else if (brand && tier) {
        setConfigName(`${brand} ${tier}`);
      } else if (brand) {
        setConfigName(`${brand} Configuration`);
      }
    } else {
      setConfigName("Untitled Configuration");
    }
  }, [selectedOptions]);

  useEffect(() => {
    const disabledSelections = selectedOptions.filter((opt) =>
      shouldDisableOption(opt.optionId)
    );

    if (disabledSelections.length > 0) {
      setSelectedOptions((prev) =>
        prev.filter((opt) => !shouldDisableOption(opt.optionId))
      );
    }
  }, [selectedOptions, selectedProductClass]);

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

  return (
    <div className="w-full flex-1">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        backButton
        onBack={() => navigate("/sales/catalog")}
        actions={[
          {
            type: "button",
            label: "Import",
            variant: "secondary-outline",
            icon: <Import size={16} />,
            onClick: () => {},
          },
          {
            type: "button",
            label: "Save",
            variant: "primary",
            icon: <Save size={16} />,
            onClick: () => setIsSaveModalOpen(true),
            disabled: validationResults.some((r) => r.type === "error"),
          },
        ]}
      />

      <div className="flex h-full">
        <div className="w-80 border-r bg-foreground overflow-y-auto text-sm">
          <div className="p-2 border-b bg-foreground">
            <h2 className="font-semibold text-text-muted">Product Class</h2>
            <select
              className="mt-2 w-full p-2 bg-foreground border border-border rounded text-text-muted focus:outline-none"
              value={selectedProductClass}
              onChange={(e) => setSelectedProductClass(e.target.value)}>
              {sampleProductClasses.map((productClass) => (
                <option
                  key={productClass.id}
                  value={productClass.id}>
                  {productClass.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-2 border-b bg-foreground">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text-muted">
                Configuration Options
              </h2>
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

          <div className="divide-y">
            {sortedCategories.map((category) => {
              const categoryStatus = getCategoryStatus(category.id);
              const options = getOptionsForCategory(category.id);

              if (options.length === 0) return null;

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
                    className="w-full px-4 py-2 flex items-center justify-between hover:bg-surface cursor-pointer">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(categoryStatus)}
                      <span className="text-sm font-medium text-text-muted">
                        {category.name} {category.isRequired && "*"}
                      </span>
                    </div>
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
                  </button>

                  {expandedCategories.includes(category.id) && (
                    <div className="pl-4 pr-2 py-2 space-y-2">
                      {options.map((option) => {
                        const isDisabled = shouldDisableOption(option.id);
                        const isSelected = isOptionSelected(option.id);
                        const quantity = getOptionQuantity(option.id);

                        return (
                          <div
                            key={option.id}
                            className={`text-sm ${
                              isDisabled ? "opacity-50" : ""
                            }`}>
                            <button
                              onClick={() =>
                                !isDisabled &&
                                handleOptionSelect(
                                  option.id,
                                  category.id,
                                  !isSelected
                                )
                              }
                              disabled={isDisabled}
                              className="w-full text-left hover:text-text disabled:opacity-75 disabled:cursor-not-allowed group cursor-pointer">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="rounded border border-border"
                                  checked={isSelected}
                                  disabled={isDisabled}
                                  onChange={(e) =>
                                    handleOptionSelect(
                                      option.id,
                                      category.id,
                                      e.target.checked
                                    )
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="flex-1 text-text-muted group-hover:text-text">
                                  {option.name}
                                </span>
                                <span className="text-text-muted group-hover:text-text">
                                  {formatCurrency(option.price)}
                                </span>
                              </div>

                              {isSelected && option.allowQuantity && (
                                <div className="pl-6 mt-2 flex items-center gap-2">
                                  <label className="text-xs text-text-muted group-hover:text-text">
                                    Quantity:
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={quantity}
                                    onChange={(e) =>
                                      handleQuantityChange(
                                        option.id,
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-16 p-1 border rounded text-xs"
                                  />
                                </div>
                              )}

                              {option.description && (
                                <div className="pl-6 mt-1 text-xs text-text-muted italic group-hover:text-text">
                                  {option.description}
                                </div>
                              )}
                            </button>
                          </div>
                        );
                      })}

                      {options.length === 0 && (
                        <div className="text-sm text-text-muted">
                          No options available for this category
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2 border-b bg-foreground">
            <h2 className="font-semibold text-text-muted">
              Current Configuration
            </h2>
          </div>

          {validationResults.length > 0 && (
            <div className="p-2 space-y-2">
              {validationResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-2 rounded flex items-center gap-2 text-sm border ${
                    result.type === "error"
                      ? "bg-error/10 text-error border-error"
                      : result.type === "warning"
                        ? "bg-warning/10 text-warning border-warning"
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

          <div className="px-2">
            <div className="space-y-2">
              {sortedCategories.map((category) => {
                const selectedCategoryOptions = selectedOptions
                  .filter((so) => {
                    const option = getOptionById(so.optionId);
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

      <SaveConfigModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        configName={configName}
        onSave={handleSave}
        selectedOptions={selectedOptions}
        totalPrice={totalPrice}
      />
    </div>
  );
};

export default ConfigBuilder;
