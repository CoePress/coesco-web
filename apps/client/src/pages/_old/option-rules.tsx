import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, Loader } from "lucide-react";
import {
  Button,
  PageHeader,
  Modal,
  Table,
  Select,
  Input,
  Tabs,
} from "@/components";
import { useApi } from "@/hooks/use-api";
import { RuleAction, IApiResponse } from "@/utils/types";

interface OptionRuleRow {
  id: string;
  name: string;
  description: string;
  triggerOption: string;
  targetOption: string;
  ruleType: RuleAction;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OptionRules = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("option");
  const [editingRule, setEditingRule] = useState<OptionRuleRow | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<OptionRuleRow | null>(null);
  const [optionRules, setOptionRules] = useState<any[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const rulesApi = useApi();
  const optionsApi = useApi();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rulesResponse, optionsResponse] = await Promise.all([
          rulesApi.get("/configurations/rules"),
          optionsApi.get("/configurations/options")
        ]);

        if (rulesResponse) {
          const rulesData = rulesResponse as IApiResponse<any[]>;
          setOptionRules(rulesData.data || []);
        }

        if (optionsResponse) {
          const optionsData = optionsResponse as IApiResponse<any[]>;
          setOptions(optionsData.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const tableData: OptionRuleRow[] = (optionRules || [])
    .filter((rule) => rule !== null)
    .map((rule) => {
      let triggerOptionId = "";
      if (
        rule.condition.type === "SIMPLE" &&
        rule.condition.conditionType === "OPTION"
      ) {
        triggerOptionId = rule.condition.id;
      }

      const triggerOption =
        options?.find((opt) => opt.id === triggerOptionId) || options?.[0];
      const targetOption =
        options?.find((opt) => opt.id === rule.targetOptionIds[0]) ||
        options?.[0];

      return {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        triggerOption: triggerOption?.name || "Unknown",
        targetOption: targetOption?.name || "Unknown",
        ruleType: rule.action,
        active: rule.active,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      };
    });

  const columns = [
    {
      key: "name" as keyof OptionRuleRow,
      header: "Rule Name",
      render: (value: any, row: OptionRuleRow) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{row.description}</div>
        </div>
      ),
    },
    {
      key: "triggerOption" as keyof OptionRuleRow,
      header: "Trigger Option",
    },
    {
      key: "targetOption" as keyof OptionRuleRow,
      header: "Target Option",
    },
    {
      key: "ruleType" as keyof OptionRuleRow,
      header: "Rule Type",
      render: (value: any) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            value === RuleAction.DISABLE
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}>
          {value}
        </span>
      ),
    },
    {
      key: "active" as keyof OptionRuleRow,
      header: "Status",
      render: (value: any) => (
        <div className="flex items-center gap-2">
          {value ? (
            <Eye
              size={16}
              className="text-green-600"
            />
          ) : (
            <EyeOff
              size={16}
              className="text-gray-400"
            />
          )}
          <span className={value ? "text-green-600" : "text-gray-500"}>
            {value ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      key: "actions" as keyof OptionRuleRow,
      header: "Actions",
      render: (_: any, row: OptionRuleRow) => (
        <div className="flex gap-2">
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={() => handleEdit(row)}>
            <Edit size={14} />
          </Button>
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={() => handleDelete(row)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const handleEdit = (rule: OptionRuleRow) => {
    setEditingRule(rule);
    setIsCreateModalOpen(true);
  };

  const handleDelete = (rule: OptionRuleRow) => {
    setRuleToDelete(rule);
    setIsDeleteModalOpen(true);
  };

  const handleCreate = () => {
    setEditingRule(null);
    setIsCreateModalOpen(true);
  };

  const handleSaveRule = (formData: any) => {
    console.log("Saving rule:", formData);
    setIsCreateModalOpen(false);
    setEditingRule(null);
  };

  const handleConfirmDelete = () => {
    console.log("Deleting rule:", ruleToDelete);
    setIsDeleteModalOpen(false);
    setRuleToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Option Rules"
        description="Manage configuration rules that control option dependencies and constraints"
        actions={
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-3 py-1.5 border rounded-md border-border bg-transparent text-text/75 hover:bg-text/15 hover:border-text/15 cursor-pointer text-sm"
          >
            <Plus size={16} />
            <span>Create Rule</span>
          </button>
        }
      />

      <div className="bg-white rounded-lg border">
        <Table
          columns={columns}
          data={tableData}
          total={tableData.length}
          className="w-full"
        />
      </div>

      {/* Create/Edit Rule Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingRule ? "Edit Rule" : "Create Rule"}
        size="lg">
        <Tabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={[
            { label: "Option Rules", value: "option" },
            { label: "Performance Rules", value: "performance" },
          ]}
        />
        {activeTab === "option" ? (
          <RuleForm
            rule={editingRule}
            onSave={handleSaveRule}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        ) : (
          <PerformanceRulesForm onClose={() => setIsCreateModalOpen(false)} />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Rule"
        size="sm">
        <div className="space-y-4">
          <div>
            Are you sure you want to delete the rule "{ruleToDelete?.name}"?
            This action cannot be undone.
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary-outline"
              onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Rule Form Component
interface RuleFormProps {
  rule?: OptionRuleRow | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  options?: any[];
}

const RuleForm = ({ rule, onSave, onCancel, options }: RuleFormProps) => {
  const [formData, setFormData] = useState({
    name: rule?.name || "",
    description: rule?.description || "",
    triggerOptionId: "",
    targetOptionId: "",
    ruleType: RuleAction.DISABLE,
    active: rule?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Rule Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter rule name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rule Type</label>
          <Select
            options={[
              { value: RuleAction.DISABLE, label: "Disable" },
              { value: RuleAction.REQUIRE, label: "Require" },
            ]}
            value={formData.ruleType}
            onChange={(e) =>
              setFormData({
                ...formData,
                ruleType: e.target.value as RuleAction,
              })
            }
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Input
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Enter rule description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Trigger Option
          </label>
          <Select
            options={(options || []).map((option: any) => ({
              value: option.id,
              label: option.name,
            }))}
            value={formData.triggerOptionId}
            onChange={(e) =>
              setFormData({ ...formData, triggerOptionId: e.target.value })
            }
            placeholder="Select trigger option"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Target Option
          </label>
          <Select
            options={(options || []).map((option: any) => ({
              value: option.id,
              label: option.name,
            }))}
            value={formData.targetOptionId}
            onChange={(e) =>
              setFormData({ ...formData, targetOptionId: e.target.value })
            }
            placeholder="Select target option"
            required
          />
        </div>
      </div>

      <div className="flex items-center">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.active}
            onChange={(e) =>
              setFormData({ ...formData, active: e.target.checked })
            }
            className="rounded"
          />
          <span className="text-sm font-medium">Active</span>
        </label>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(formData)}>
          {rule ? "Update Rule" : "Create Rule"}
        </Button>
      </div>
    </form>
  );
};

const PerformanceRulesForm = ({
  onClose,
  options,
}: {
  onClose: () => void;
  options?: any[];
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    formula: "",
    targetOption: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving performance rule:", formData);
    onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Rule Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter rule name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Input
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Enter rule description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Formula/Expression
        </label>
        <Input
          value={formData.formula}
          onChange={(e) =>
            setFormData({ ...formData, formula: e.target.value })
          }
          placeholder="e.g., speed * 0.8 + power * 1.2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Target Option</label>
        <Select
          options={(options || []).map((option: any) => ({
            value: option.id,
            label: option.name,
          }))}
          value={formData.targetOption}
          onChange={(e) =>
            setFormData({ ...formData, targetOption: e.target.value })
          }
          placeholder="Select target option"
          required
        />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button
          variant="secondary-outline"
          onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            console.log("Saving performance rule:", formData);
            onClose();
          }}>
          Create Performance Rule
        </Button>
      </div>
    </form>
  );
};

export default OptionRules;
