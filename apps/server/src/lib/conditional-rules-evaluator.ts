interface FormConditionalRule {
  id: string;
  targetType: "PAGE" | "SECTION" | "FIELD";
  targetId: string;
  action: "SHOW" | "HIDE" | "ENABLE" | "DISABLE" | "REQUIRE" | "OPTIONAL";
  conditions: Condition[];
  operator: "AND" | "OR";
  priority: number;
  isActive: boolean;
}

interface Condition {
  fieldVariable: string;
  operator: string;
  value: any;
}

export class ConditionalRulesEvaluator {
  private rules: FormConditionalRule[];
  private formValues: Record<string, any>;

  constructor(rules: FormConditionalRule[], formValues: Record<string, any> = {}) {
    this.rules = rules.filter(r => r.isActive).sort((a, b) => a.priority - b.priority);
    this.formValues = formValues;
  }

  updateValues(values: Record<string, any>) {
    this.formValues = { ...this.formValues, ...values };
  }

  evaluateRules(): Record<string, { action: string; visible: boolean; enabled: boolean; required: boolean }> {
    const results: Record<string, any> = {};

    for (const rule of this.rules) {
      const conditionsMet = this.evaluateConditions(rule.conditions, rule.operator);

      if (conditionsMet) {
        if (!results[rule.targetId]) {
          results[rule.targetId] = {
            visible: true,
            enabled: true,
            required: false,
          };
        }

        switch (rule.action) {
          case "SHOW":
            results[rule.targetId].visible = true;
            break;
          case "HIDE":
            results[rule.targetId].visible = false;
            break;
          case "ENABLE":
            results[rule.targetId].enabled = true;
            break;
          case "DISABLE":
            results[rule.targetId].enabled = false;
            break;
          case "REQUIRE":
            results[rule.targetId].required = true;
            break;
          case "OPTIONAL":
            results[rule.targetId].required = false;
            break;
        }
      }
    }

    return results;
  }

  private evaluateConditions(conditions: Condition[], operator: "AND" | "OR"): boolean {
    if (conditions.length === 0)
      return true;

    const results = conditions.map(condition => this.evaluateCondition(condition));

    return operator === "AND"
      ? results.every(r => r)
      : results.some(r => r);
  }

  private evaluateCondition(condition: Condition): boolean {
    const fieldValue = this.formValues[condition.fieldVariable];
    const { operator, value } = condition;

    switch (operator) {
      case "equals":
        return fieldValue === value;
      case "not_equals":
        return fieldValue !== value;
      case "contains":
        return String(fieldValue || "").includes(String(value));
      case "not_contains":
        return !String(fieldValue || "").includes(String(value));
      case "greater_than":
        return Number(fieldValue) > Number(value);
      case "less_than":
        return Number(fieldValue) < Number(value);
      case "greater_than_or_equal":
        return Number(fieldValue) >= Number(value);
      case "less_than_or_equal":
        return Number(fieldValue) <= Number(value);
      case "is_empty":
        return !fieldValue || fieldValue === "" || fieldValue === null || fieldValue === undefined;
      case "is_not_empty":
        return fieldValue && fieldValue !== "" && fieldValue !== null && fieldValue !== undefined;
      case "in":
        return Array.isArray(value) && value.includes(fieldValue);
      case "not_in":
        return Array.isArray(value) && !value.includes(fieldValue);
      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  getVisiblePages(pageIds: string[]): string[] {
    const ruleResults = this.evaluateRules();
    return pageIds.filter((pageId) => {
      const result = ruleResults[pageId];
      return result ? result.visible : true; // Default to visible if no rules
    });
  }

  isPageVisible(pageId: string): boolean {
    const ruleResults = this.evaluateRules();
    const result = ruleResults[pageId];
    return result ? result.visible : true;
  }

  isFieldRequired(fieldId: string): boolean {
    const ruleResults = this.evaluateRules();
    const result = ruleResults[fieldId];
    return result ? result.required : false;
  }
}

// Usage example:
// const evaluator = new ConditionalRulesEvaluator(rules, formValues);
// const visiblePages = evaluator.getVisiblePages(allPageIds);
// evaluator.updateValues({ "2nd Customer?": "yes" });
// const isPage4Visible = evaluator.isPageVisible(page4Id);
