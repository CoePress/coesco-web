import { PageHeader, StatusBadge, Table } from "@/components";
import { Button } from "@/components";
import { Filter, MoreHorizontal, X } from "lucide-react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { RuleAction, ComparisonOperator } from "@/utils/types";

import { sampleOptionRules, sampleOptions } from "@/utils/sample-data";
import { TableColumn } from "@/components/v1/table";

interface RuleFormData {
  name: string;
  description: string;
  type: "OPTION" | "INPUT";
  action: RuleAction;
  targetOptionIds: string[];
  inputField?: {
    fieldId: string;
    operator: ComparisonOperator;
    value: string | number;
  };
}

const ProductRules = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<RuleFormData>({
    name: "",
    description: "",
    type: "OPTION",
    action: RuleAction.DISABLE,
    targetOptionIds: [],
  });

  const pageTitle = "Product Rules";
  const pageDescription = "Manage product rules";

  const columns: TableColumn<any>[] = [
    {
      key: "name",
      header: "Name",
      render: (_, row) => (
        <>
          <div>{row.name}</div>
          <div className="text-sm text-neutral-500">{row.description}</div>
        </>
      ),
    },
    {
      key: "type",
      header: "Type",
    },
    {
      key: "active",
      header: "Status",
      render: (_, row) => (
        <StatusBadge
          label={row.active ? "Active" : "Inactive"}
          variant={row.active ? "success" : "warning"}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      render: () => (
        <button onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </button>
      ),
    },
  ];

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating rule:", formData);
    setIsModalOpen(false);
  };

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={[
          {
            type: "button",
            label: "Filter",
            variant: "secondary-outline",
            icon: <Filter size={16} />,
            onClick: () => {},
          },
          {
            type: "button",
            label: "New Rule",
            variant: "secondary-outline",
            icon: <Plus size={16} />,
            onClick: () => setIsModalOpen(true),
          },
        ]}
      />

      <Table
        columns={columns}
        data={sampleOptionRules}
        total={sampleOptionRules.length}
        pagination
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Rule</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateRule}
              className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Rule Type</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as "OPTION" | "INPUT",
                    })
                  }
                  className="w-full border rounded-md p-2">
                  <option value="OPTION">Option Based</option>
                  <option value="INPUT">Input Based</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Rule Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter rule name"
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter rule description"
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Target Options
                </label>
                <select
                  multiple
                  value={formData.targetOptionIds}
                  onChange={(e) => {
                    const options = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    );
                    setFormData({ ...formData, targetOptionIds: options });
                  }}
                  className="w-full border rounded-md p-2 min-h-[100px]">
                  {sampleOptions.map((option) => (
                    <option
                      key={option.id}
                      value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Action</label>
                <select
                  value={formData.action}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      action: e.target.value as RuleAction,
                    })
                  }
                  className="w-full border rounded-md p-2">
                  <option value={RuleAction.DISABLE}>Disable</option>
                  <option value={RuleAction.REQUIRE}>Require</option>
                </select>
              </div>

              {/* Input Rule Specific Fields */}
              {formData.type === "INPUT" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Input Field ID
                    </label>
                    <input
                      type="text"
                      value={formData.inputField?.fieldId || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          inputField: {
                            ...formData.inputField,
                            fieldId: e.target.value,
                            operator:
                              formData.inputField?.operator ||
                              ComparisonOperator.EQUAL,
                            value: formData.inputField?.value || "",
                          },
                        })
                      }
                      placeholder="Enter field ID"
                      className="w-full border rounded-md p-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Operator
                    </label>
                    <select
                      value={
                        formData.inputField?.operator ||
                        ComparisonOperator.EQUAL
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          inputField: {
                            ...formData.inputField,
                            operator: e.target.value as ComparisonOperator,
                            fieldId: formData.inputField?.fieldId || "",
                            value: formData.inputField?.value || "",
                          },
                        })
                      }
                      className="w-full border rounded-md p-2">
                      <option value={ComparisonOperator.EQUAL}>
                        Equal (==)
                      </option>
                      <option value={ComparisonOperator.NOT_EQUAL}>
                        Not Equal (!=)
                      </option>
                      <option value={ComparisonOperator.GREATER_THAN}>
                        Greater Than (&gt;)
                      </option>
                      <option value={ComparisonOperator.GREATER_THAN_OR_EQUAL}>
                        Greater Than or Equal (&gt;=)
                      </option>
                      <option value={ComparisonOperator.LESS_THAN}>
                        Less Than (&lt;)
                      </option>
                      <option value={ComparisonOperator.LESS_THAN_OR_EQUAL}>
                        Less Than or Equal (&lt;=)
                      </option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Value</label>
                    <input
                      type="text"
                      value={formData.inputField?.value || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          inputField: {
                            ...formData.inputField,
                            value: e.target.value,
                            fieldId: formData.inputField?.fieldId || "",
                            operator:
                              formData.inputField?.operator ||
                              ComparisonOperator.EQUAL,
                          },
                        })
                      }
                      placeholder="Enter comparison value"
                      className="w-full border rounded-md p-2"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="secondary-outline"
                  onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button>Create Rule</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductRules;
