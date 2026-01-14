export interface ValidationRule {
  type: 'min' | 'max' | 'range' | 'custom';
  dependsOn?: string; // Field ID to compare against
  value?: number;
  message?: string;
  validate?: (value: any, dependentValue?: any) => boolean;
}

export interface FieldConstraints {
  min?: number | string; // Can be a number or a field ID to reference
  max?: number | string;
  validationRules?: ValidationRule[];
}

export const validateFieldValue = (
  value: any,
  constraints: FieldConstraints,
  getFieldValue: (id: string) => any
): string | null => {
  if (value === '' || value === null || value === undefined) return null;

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return null;

  // Handle min constraint
  if (constraints.min !== undefined) {
    const minValue = typeof constraints.min === 'string'
      ? getFieldValue(constraints.min)
      : constraints.min;

    if (minValue !== null && minValue !== undefined && !isNaN(minValue)) {
      const minNum = typeof minValue === 'string' ? parseFloat(minValue) : minValue;
      if (numValue < minNum) {
        const minFieldLabel = typeof constraints.min === 'string'
          ? constraints.min.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim()
          : constraints.min;
        return `Must be ≥ ${minNum} (${minFieldLabel})`;
      }
    }
  }

  // Handle max constraint
  if (constraints.max !== undefined) {
    const maxValue = typeof constraints.max === 'string'
      ? getFieldValue(constraints.max)
      : constraints.max;

    if (maxValue !== null && maxValue !== undefined && !isNaN(maxValue)) {
      const maxNum = typeof maxValue === 'string' ? parseFloat(maxValue) : maxValue;
      if (numValue > maxNum) {
        const maxFieldLabel = typeof constraints.max === 'string'
          ? constraints.max.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim()
          : constraints.max;
        return `Must be ≤ ${maxNum} (${maxFieldLabel})`;
      }
    }
  }

  // Handle custom validation rules
  if (constraints.validationRules) {
    for (const rule of constraints.validationRules) {
      const dependentValue = rule.dependsOn ? getFieldValue(rule.dependsOn) : undefined;

      if (rule.validate && !rule.validate(numValue, dependentValue)) {
        return rule.message || 'Validation failed';
      }
    }
  }

  return null;
};

export const findFieldsReferencingField = (
  sections: any[],
  targetFieldId: string
): string[] => {
  const referencingFieldIds: string[] = [];

  for (const tab of sections) {
    for (const section of tab.sections || []) {
      for (const field of section.fields || []) {
        if (field.validation?.min === targetFieldId || field.validation?.max === targetFieldId) {
          referencingFieldIds.push(field.id);
        }
      }
    }
  }

  return referencingFieldIds;
};
