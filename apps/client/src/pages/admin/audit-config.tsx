import { useState } from "react";
import {
  ArrowLeft,
  Database,
  Eye,
  EyeOff,
  Save,
  RefreshCcw,
  AlertTriangle,
  Plus,
  Minus,
} from "lucide-react";

// Type definitions for schema and config

type FieldType =
  | "uuid"
  | "string"
  | "text"
  | "integer"
  | "decimal"
  | "timestamp"
  | "enum"
  | "json";

interface FieldDefinition {
  type: FieldType;
  required: boolean;
  description: string;
}

interface TableDefinition {
  name: string;
  fields: Record<string, FieldDefinition>;
}

const tableSchema: Record<string, TableDefinition> = {
  users: {
    name: "Users",
    fields: {
      id: { type: "uuid", required: true, description: "Unique identifier" },
      email: {
        type: "string",
        required: true,
        description: "User email address",
      },
      first_name: {
        type: "string",
        required: false,
        description: "First name",
      },
      last_name: {
        type: "string",
        required: false,
        description: "Last name",
      },
      role: {
        type: "enum",
        required: true,
        description: "User role (admin, user, viewer)",
      },
      status: {
        type: "enum",
        required: true,
        description: "Account status (active, inactive, suspended)",
      },
      created_at: {
        type: "timestamp",
        required: true,
        description: "Account creation date",
      },
      updated_at: {
        type: "timestamp",
        required: true,
        description: "Last update timestamp",
      },
      last_login: {
        type: "timestamp",
        required: false,
        description: "Last login timestamp",
      },
      password_hash: {
        type: "string",
        required: true,
        description: "Encrypted password",
      },
      permissions: {
        type: "json",
        required: false,
        description: "User permissions object",
      },
    },
  },
  customers: {
    name: "Customers",
    fields: {
      id: { type: "uuid", required: true, description: "Unique identifier" },
      company_name: {
        type: "string",
        required: true,
        description: "Company name",
      },
      contact_email: {
        type: "string",
        required: true,
        description: "Primary contact email",
      },
      contact_phone: {
        type: "string",
        required: false,
        description: "Phone number",
      },
      billing_address: {
        type: "text",
        required: false,
        description: "Billing address",
      },
      shipping_address: {
        type: "text",
        required: false,
        description: "Shipping address",
      },
      credit_limit: {
        type: "decimal",
        required: false,
        description: "Credit limit amount",
      },
      payment_terms: {
        type: "enum",
        required: false,
        description: "Payment terms (net30, net60, etc.)",
      },
      status: {
        type: "enum",
        required: true,
        description: "Customer status (active, inactive, suspended)",
      },
      created_at: {
        type: "timestamp",
        required: true,
        description: "Record creation date",
      },
      updated_at: {
        type: "timestamp",
        required: true,
        description: "Last update timestamp",
      },
    },
  },
  products: {
    name: "Products",
    fields: {
      id: { type: "uuid", required: true, description: "Unique identifier" },
      name: { type: "string", required: true, description: "Product name" },
      description: {
        type: "text",
        required: false,
        description: "Product description",
      },
      sku: {
        type: "string",
        required: true,
        description: "Stock keeping unit",
      },
      price: {
        type: "decimal",
        required: true,
        description: "Product price",
      },
      cost: {
        type: "decimal",
        required: false,
        description: "Cost of goods sold",
      },
      category: {
        type: "string",
        required: false,
        description: "Product category",
      },
      stock_quantity: {
        type: "integer",
        required: true,
        description: "Current stock level",
      },
      reorder_point: {
        type: "integer",
        required: false,
        description: "Reorder threshold",
      },
      status: {
        type: "enum",
        required: true,
        description: "Product status (active, discontinued, draft)",
      },
      created_at: {
        type: "timestamp",
        required: true,
        description: "Record creation date",
      },
      updated_at: {
        type: "timestamp",
        required: true,
        description: "Last update timestamp",
      },
    },
  },
  orders: {
    name: "Orders",
    fields: {
      id: { type: "uuid", required: true, description: "Unique identifier" },
      customer_id: {
        type: "uuid",
        required: true,
        description: "Customer reference",
      },
      order_number: {
        type: "string",
        required: true,
        description: "Human-readable order number",
      },
      total_amount: {
        type: "decimal",
        required: true,
        description: "Total order amount",
      },
      tax_amount: {
        type: "decimal",
        required: false,
        description: "Tax amount",
      },
      shipping_amount: {
        type: "decimal",
        required: false,
        description: "Shipping cost",
      },
      status: {
        type: "enum",
        required: true,
        description:
          "Order status (pending, processing, shipped, delivered, cancelled)",
      },
      payment_status: {
        type: "enum",
        required: true,
        description: "Payment status (pending, paid, refunded, failed)",
      },
      shipping_address: {
        type: "text",
        required: false,
        description: "Shipping address",
      },
      tracking_number: {
        type: "string",
        required: false,
        description: "Shipping tracking number",
      },
      created_at: {
        type: "timestamp",
        required: true,
        description: "Order creation date",
      },
      updated_at: {
        type: "timestamp",
        required: true,
        description: "Last update timestamp",
      },
      shipped_at: {
        type: "timestamp",
        required: false,
        description: "Shipping date",
      },
    },
  },
};

const defaultWatchConfig: Record<string, string[]> = {
  users: ["id", "email", "role", "status", "permissions"],
  customers: ["id", "company_name", "contact_email", "credit_limit", "status"],
  products: ["id", "name", "sku", "price", "stock_quantity", "status"],
  orders: ["id", "customer_id", "total_amount", "status", "payment_status"],
};

const tableNames = Object.keys(tableSchema) as Array<keyof typeof tableSchema>;
type TableName = (typeof tableNames)[number];

const AuditConfiguration = () => {
  const [selectedTable, setSelectedTable] = useState<TableName>("users");
  const [watchConfig, setWatchConfig] = useState<Record<TableName, string[]>>(
    defaultWatchConfig as Record<TableName, string[]>
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const toggleFieldWatch = (tableName: TableName, fieldName: string) => {
    setWatchConfig((prev) => {
      const currentFields = prev[tableName] || [];
      const newFields = currentFields.includes(fieldName)
        ? currentFields.filter((f) => f !== fieldName)
        : [...currentFields, fieldName];
      setHasUnsavedChanges(true);
      return {
        ...prev,
        [tableName]: newFields,
      };
    });
  };

  const getFieldTypeIcon = (type: FieldType) => {
    switch (type) {
      case "uuid":
        return (
          <Database
            size={14}
            className="text-blue-500"
          />
        );
      case "string":
        return <span className="text-green-500 font-mono text-xs">Aa</span>;
      case "text":
        return <span className="text-green-500 font-mono text-xs">¶</span>;
      case "integer":
        return <span className="text-purple-500 font-mono text-xs">123</span>;
      case "decimal":
        return <span className="text-purple-500 font-mono text-xs">1.2</span>;
      case "timestamp":
        return <span className="text-orange-500 font-mono text-xs">📅</span>;
      case "enum":
        return <span className="text-teal-500 font-mono text-xs">⚬</span>;
      case "json":
        return <span className="text-indigo-500 font-mono text-xs">{}</span>;
      default:
        return (
          <Database
            size={14}
            className="text-text-muted"
          />
        );
    }
  };

  const getWatchedFieldsCount = (tableName: TableName) => {
    return watchConfig[tableName]?.length || 0;
  };

  const getTotalFieldsCount = (tableName: TableName) => {
    return Object.keys(tableSchema[tableName]?.fields || {}).length;
  };

  const handleSaveConfiguration = () => {
    console.log("Saving configuration:", watchConfig);
    setHasUnsavedChanges(false);
  };

  const handleResetToDefaults = () => {
    setWatchConfig(defaultWatchConfig as Record<TableName, string[]>);
    setHasUnsavedChanges(true);
  };

  const isFieldWatched = (tableName: TableName, fieldName: string) => {
    return watchConfig[tableName]?.includes(fieldName) || false;
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      <div className="p-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="p-1 text-text-muted hover:text-primary">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-text-muted">
                Audit Configuration
              </h1>
              <p className="text-sm text-text-muted mt-1">
                Configure which fields to monitor for changes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefaults}
              className="px-3 py-2 text-sm bg-surface text-text-muted rounded border border-border hover:bg-surface/80 flex items-center gap-2">
              <RefreshCcw size={16} />
              Reset to Defaults
            </button>
            <button
              onClick={handleSaveConfiguration}
              disabled={!hasUnsavedChanges}
              className={`px-3 py-2 text-sm rounded flex items-center gap-2 ${
                hasUnsavedChanges
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-surface text-text-muted border border-border cursor-not-allowed"
              }`}>
              <Save size={16} />
              Save Configuration
            </button>
          </div>
        </div>
      </div>

      <div className="p-2 gap-2 flex flex-1 overflow-hidden">
        <div className="w-80 bg-foreground rounded border border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-medium text-text-muted">
              Database Tables
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {Object.entries(tableSchema).map(([tableName, tableInfo]) => {
              const watchedCount = getWatchedFieldsCount(
                tableName as TableName
              );
              const totalCount = getTotalFieldsCount(tableName as TableName);
              const isSelected = selectedTable === (tableName as TableName);

              return (
                <div
                  key={tableName}
                  onClick={() => setSelectedTable(tableName as TableName)}
                  className={`p-3 border-b border-border cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/10 border-l-4 border-l-primary"
                      : "hover:bg-surface/50"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database
                        size={16}
                        className="text-primary"
                      />
                      <div>
                        <h3 className="text-sm font-medium text-text-muted">
                          {tableInfo.name}
                        </h3>
                        <p className="text-xs text-text-muted">{tableName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-text-muted">
                        {watchedCount}/{totalCount}
                      </div>
                      <div className="text-xs text-text-muted">watched</div>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-surface rounded-full h-2">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${(watchedCount / totalCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 bg-foreground rounded border border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database
                  size={16}
                  className="text-primary"
                />
                <h2 className="text-sm font-medium text-text-muted">
                  {tableSchema[selectedTable]?.name} Fields
                </h2>
              </div>
              <div className="flex items-center gap-4 text-sm text-text-muted">
                <div className="flex items-center gap-1">
                  <Eye
                    size={14}
                    className="text-success"
                  />
                  <span>
                    {getWatchedFieldsCount(selectedTable as TableName)} watched
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <EyeOff
                    size={14}
                    className="text-text-muted"
                  />
                  <span>
                    {getTotalFieldsCount(selectedTable as TableName) -
                      getWatchedFieldsCount(selectedTable as TableName)}{" "}
                    not watched
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-2">
              {Object.entries(tableSchema[selectedTable]?.fields || {}).map(
                ([fieldName, fieldInfo]) => {
                  const isWatched = isFieldWatched(
                    selectedTable as TableName,
                    fieldName
                  );
                  const typedFieldInfo = fieldInfo as FieldDefinition;
                  return (
                    <div
                      key={fieldName}
                      className={`p-3 rounded border transition-colors ${
                        isWatched
                          ? "bg-success/5 border-success/20"
                          : "bg-surface/50 border-border hover:bg-surface/80"
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getFieldTypeIcon(typedFieldInfo.type)}
                          <div>
                            <h4 className="text-sm font-medium text-text-muted">
                              {fieldName}
                            </h4>
                            <p className="text-xs text-text-muted mt-1">
                              {typedFieldInfo.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-text-muted bg-surface px-1 py-0.5 rounded">
                                {typedFieldInfo.type}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              toggleFieldWatch(
                                selectedTable as TableName,
                                fieldName
                              )
                            }
                            className={`px-3 py-1 text-xs rounded font-medium transition-colors flex items-center gap-1 ${
                              isWatched
                                ? "bg-error/10 text-error hover:bg-error/20"
                                : "bg-success/10 text-success hover:bg-success/20"
                            }`}>
                            {isWatched ? (
                              <>
                                <Minus size={12} />
                                Remove Watch
                              </>
                            ) : (
                              <>
                                <Plus size={12} />
                                Add Watch
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="fixed bottom-4 right-4 bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-center gap-2 text-warning">
          <AlertTriangle size={16} />
          <span className="text-sm">You have unsaved changes</span>
        </div>
      )}
    </div>
  );
};

export default AuditConfiguration;
