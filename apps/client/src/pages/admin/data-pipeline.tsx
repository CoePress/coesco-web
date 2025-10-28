import { useState } from "react";
import {
  Plus,
  Trash2,
  Download,
  Upload,
  Code,
} from "lucide-react";

import {
  Button,
  PageHeader,
  Input,
  Select,
  Checkbox,
  Textarea,
  Modal,
} from "@/components";

type FieldMapping = {
  from: string;
  to: string;
  transform?: string;
  defaultValue?: string;
  required?: boolean;
};

type TableMapping = {
  id: string;
  sourceDatabase: "quote" | "std" | "job";
  sourceTable: string;
  targetTable: string;
  fieldMappings: FieldMapping[];
  filter?: string;
  beforeSave?: string;
  afterSave?: string;
  batchSize?: number;
  legacyFetchSize?: number;
  concurrency?: number;
  skipDuplicates?: boolean;
  duplicateCheck?: string;
  sort?: string;
  order?: "ASC" | "DESC";
};

const DataPipelineBuilder = () => {
  const [mappings, setMappings] = useState<TableMapping[]>([]);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  const addMapping = () => {
    const newMapping: TableMapping = {
      id: `mapping-${Date.now()}`,
      sourceDatabase: "quote",
      sourceTable: "",
      targetTable: "",
      fieldMappings: [],
      batchSize: 100,
      legacyFetchSize: 5000,
      skipDuplicates: true,
    };
    setMappings([...mappings, newMapping]);
  };

  const deleteMapping = (id: string) => {
    setMappings(mappings.filter((m) => m.id !== id));
  };

  const updateMapping = (id: string, updates: Partial<TableMapping>) => {
    setMappings(
      mappings.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const addFieldMapping = (mappingId: string) => {
    const mapping = mappings.find((m) => m.id === mappingId);
    if (!mapping) return;

    const newField: FieldMapping = {
      from: "",
      to: "",
      required: false,
    };

    updateMapping(mappingId, {
      fieldMappings: [...mapping.fieldMappings, newField],
    });
  };

  const updateFieldMapping = (
    mappingId: string,
    fieldIndex: number,
    updates: Partial<FieldMapping>
  ) => {
    const mapping = mappings.find((m) => m.id === mappingId);
    if (!mapping) return;

    const updatedFields = mapping.fieldMappings.map((field, idx) =>
      idx === fieldIndex ? { ...field, ...updates } : field
    );

    updateMapping(mappingId, { fieldMappings: updatedFields });
  };

  const deleteFieldMapping = (mappingId: string, fieldIndex: number) => {
    const mapping = mappings.find((m) => m.id === mappingId);
    if (!mapping) return;

    updateMapping(mappingId, {
      fieldMappings: mapping.fieldMappings.filter((_, idx) => idx !== fieldIndex),
    });
  };

  const generateCode = () => {
    const code = mappings
      .map((mapping) => {
        const fieldMappingsCode = mapping.fieldMappings
          .map(
            (field) => `      {
        from: "${field.from}",
        to: "${field.to}",${field.transform ? `\n        transform: ${field.transform},` : ""}${field.defaultValue ? `\n        defaultValue: ${field.defaultValue},` : ""}${field.required ? `\n        required: true,` : ""}
      }`
          )
          .join(",\n");

        return `async function _migrate${mapping.targetTable.charAt(0).toUpperCase() + mapping.targetTable.slice(1)}(): Promise<MigrationResult> {
  const mapping: TableMapping = {
    sourceDatabase: "${mapping.sourceDatabase}",
    sourceTable: "${mapping.sourceTable}",
    targetTable: "${mapping.targetTable}",
    fieldMappings: [
${fieldMappingsCode}
    ],${mapping.filter ? `\n    filter: ${mapping.filter},` : ""}${mapping.beforeSave ? `\n    beforeSave: ${mapping.beforeSave},` : ""}${mapping.afterSave ? `\n    afterSave: ${mapping.afterSave},` : ""}${mapping.batchSize ? `\n    batchSize: ${mapping.batchSize},` : ""}${mapping.legacyFetchSize ? `\n    legacyFetchSize: ${mapping.legacyFetchSize},` : ""}${mapping.concurrency ? `\n    concurrency: ${mapping.concurrency},` : ""}${mapping.skipDuplicates ? `\n    skipDuplicates: true,` : ""}${mapping.duplicateCheck ? `\n    duplicateCheck: ${mapping.duplicateCheck},` : ""}${mapping.sort ? `\n    sort: "${mapping.sort}",` : ""}${mapping.order ? `\n    order: "${mapping.order}",` : ""}
  };

  const result = await migrateWithMapping(mapping);
  return result;
}`;
      })
      .join("\n\n");

    setGeneratedCode(code);
    setIsCodeModalOpen(true);
  };

  const exportConfig = () => {
    const dataStr = JSON.stringify(mappings, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `migration-config-${Date.now()}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setMappings(imported);
      } catch (error) {
        console.error("Failed to import config:", error);
      }
    };
    reader.readAsText(file);
  };

  const Actions = () => {
    return (
      <div className="flex gap-2 items-center">
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".json"
            onChange={importConfig}
            className="hidden"
          />
          <Button variant="secondary-outline" className="px-2" as="span">
            <Upload size={16} />
          </Button>
        </label>
        <Button onClick={exportConfig} variant="secondary-outline" className="px-2">
          <Download size={16} />
        </Button>
        <Button onClick={generateCode} variant="secondary-outline" className="px-2">
          <Code size={16} />
        </Button>
        <Button onClick={addMapping} variant="primary">
          <Plus size={16} />
          Add Mapping
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-1 flex-col overflow-hidden">
      <PageHeader
        title="Data Pipeline Builder"
        description="Configure table mappings and field transformations"
        actions={<Actions />}
      />

      <div className="p-2 flex flex-col flex-1 overflow-y-auto gap-2">
        {mappings.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-text-muted mb-4">No mappings configured</p>
              <Button onClick={addMapping} variant="primary">
                <Plus size={16} />
                Create First Mapping
              </Button>
            </div>
          </div>
        ) : (
          mappings.map((mapping) => (
            <div
              key={mapping.id}
              className="bg-foreground rounded border border-border overflow-hidden"
            >
              <div className="p-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">
                    {mapping.sourceDatabase}.{mapping.sourceTable || "(none)"} →{" "}
                    {mapping.targetTable || "(none)"}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {mapping.fieldMappings.length} field mappings
                  </p>
                </div>
                <Button
                  variant="secondary-outline"
                  size="sm"
                  onClick={() => deleteMapping(mapping.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <div className="border-t border-border p-3 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <Select
                      label="Source Database"
                      value={mapping.sourceDatabase}
                      onChange={(e) =>
                        updateMapping(mapping.id, {
                          sourceDatabase: e.target.value as any,
                        })
                      }
                      options={[
                        { value: "quote", label: "quote" },
                        { value: "std", label: "std" },
                        { value: "job", label: "job" },
                      ]}
                    />
                    <Input
                      label="Source Table"
                      value={mapping.sourceTable}
                      onChange={(e) =>
                        updateMapping(mapping.id, {
                          sourceTable: e.target.value,
                        })
                      }
                      placeholder="QData"
                    />
                    <Input
                      label="Target Table"
                      value={mapping.targetTable}
                      onChange={(e) =>
                        updateMapping(mapping.id, {
                          targetTable: e.target.value,
                        })
                      }
                      placeholder="quote"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <Input
                      label="Batch Size"
                      type="number"
                      value={mapping.batchSize || ""}
                      onChange={(e) =>
                        updateMapping(mapping.id, {
                          batchSize: Number.parseInt(e.target.value) || undefined,
                        })
                      }
                      placeholder="100"
                    />
                    <Input
                      label="Legacy Fetch Size"
                      type="number"
                      value={mapping.legacyFetchSize || ""}
                      onChange={(e) =>
                        updateMapping(mapping.id, {
                          legacyFetchSize:
                            Number.parseInt(e.target.value) || undefined,
                        })
                      }
                      placeholder="5000"
                    />
                    <Input
                      label="Sort Field"
                      value={mapping.sort || ""}
                      onChange={(e) =>
                        updateMapping(mapping.id, { sort: e.target.value })
                      }
                      placeholder="Model"
                    />
                    <Select
                      label="Sort Order"
                      value={mapping.order || ""}
                      onChange={(e) =>
                        updateMapping(mapping.id, {
                          order: e.target.value as any,
                        })
                      }
                      options={[
                        { value: "", label: "None" },
                        { value: "ASC", label: "ASC" },
                        { value: "DESC", label: "DESC" },
                      ]}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Checkbox
                      label="Skip Duplicates"
                      checked={mapping.skipDuplicates || false}
                      onChange={(checked) =>
                        updateMapping(mapping.id, { skipDuplicates: checked })
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <Textarea
                      label="Filter Function"
                      value={mapping.filter || ""}
                      onChange={(e) =>
                        updateMapping(mapping.id, { filter: e.target.value })
                      }
                      placeholder="(record) => record.Status === 'Active'"
                      rows={2}
                    />
                    <Textarea
                      label="Before Save Function"
                      value={mapping.beforeSave || ""}
                      onChange={(e) =>
                        updateMapping(mapping.id, { beforeSave: e.target.value })
                      }
                      placeholder="async (data, original) => { return data; }"
                      rows={3}
                    />
                    <Textarea
                      label="Duplicate Check Function"
                      value={mapping.duplicateCheck || ""}
                      onChange={(e) =>
                        updateMapping(mapping.id, {
                          duplicateCheck: e.target.value,
                        })
                      }
                      placeholder="(data) => ({ code: data.code })"
                      rows={2}
                    />
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium">Field Mappings</h4>
                      <Button
                        variant="secondary-outline"
                        size="sm"
                        onClick={() => addFieldMapping(mapping.id)}
                      >
                        <Plus size={16} />
                        Add Field
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {mapping.fieldMappings.map((field, idx) => (
                        <div
                          key={idx}
                          className="bg-surface border border-border rounded p-3"
                        >
                          <div className="grid grid-cols-12 gap-3 items-start">
                            <div className="col-span-3">
                              <Input
                                label="From (Source)"
                                value={field.from}
                                onChange={(e) =>
                                  updateFieldMapping(mapping.id, idx, {
                                    from: e.target.value,
                                  })
                                }
                                placeholder="QYear"
                              />
                            </div>
                            <div className="col-span-3">
                              <Input
                                label="To (Target)"
                                value={field.to}
                                onChange={(e) =>
                                  updateFieldMapping(mapping.id, idx, {
                                    to: e.target.value,
                                  })
                                }
                                placeholder="year"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                label="Default Value"
                                value={field.defaultValue || ""}
                                onChange={(e) =>
                                  updateFieldMapping(mapping.id, idx, {
                                    defaultValue: e.target.value,
                                  })
                                }
                                placeholder="null"
                              />
                            </div>
                            <div className="col-span-3">
                              <Textarea
                                label="Transform"
                                value={field.transform || ""}
                                onChange={(e) =>
                                  updateFieldMapping(mapping.id, idx, {
                                    transform: e.target.value,
                                  })
                                }
                                placeholder="value => value?.toString()"
                                rows={1}
                              />
                            </div>
                            <div className="col-span-1 flex flex-col gap-2">
                              <label className="text-xs text-text-muted mb-1">
                                Actions
                              </label>
                              <div className="flex gap-1">
                                <Checkbox
                                  label="Required"
                                  checked={field.required || false}
                                  onChange={(checked) =>
                                    updateFieldMapping(mapping.id, idx, {
                                      required: checked,
                                    })
                                  }
                                />
                                <Button
                                  variant="secondary-outline"
                                  size="sm"
                                  onClick={() =>
                                    deleteFieldMapping(mapping.id, idx)
                                  }
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {mapping.fieldMappings.length === 0 && (
                        <div className="text-center py-4 text-text-muted text-sm">
                          No field mappings configured
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        title="Generated Migration Code"
        size="xl"
      >
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-lg p-4 overflow-auto max-h-96">
            <pre className="text-xs font-mono">{generatedCode}</pre>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary-outline"
              onClick={() => {
                navigator.clipboard.writeText(generatedCode);
              }}
            >
              Copy to Clipboard
            </Button>
            <Button variant="primary" onClick={() => setIsCodeModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DataPipelineBuilder;
