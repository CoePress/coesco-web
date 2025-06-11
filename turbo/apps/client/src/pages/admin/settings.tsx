import { PageHeader, Tabs } from "@/components";
import { SaveIcon } from "lucide-react";
import { useState } from "react";

const settingsData = {
  general: [
    {
      section: "Company Info",
      fields: [
        {
          id: "companyName",
          label: "Company Name",
          type: "text",
          value: "Acme Corp",
        },
        {
          id: "companyEmail",
          label: "Company Email",
          type: "email",
          value: "info@acme.com",
        },
      ],
    },
    {
      section: "Preferences",
      fields: [
        {
          id: "timezone",
          label: "Timezone",
          type: "select",
          value: "EST",
          options: ["EST", "CST", "PST"],
        },
        {
          id: "newsletter",
          label: "Receive Newsletter",
          type: "checkbox",
          value: true,
        },
      ],
    },
  ],
  production: [
    {
      section: "General",
      fields: [
        {
          id: "dailyProduction",
          label: "Daily Production",
          type: "number",
          value: 7.5,
          units: "hours",
        },
      ],
    },
  ],
};

type SettingField = {
  id: string;
  label: string;
  type: string;
  value: any;
  units?: string;
  options?: string[];
};

const SettingInput = ({ field }: { field: SettingField }) => {
  switch (field.type) {
    case "text":
    case "email":
    case "number":
      return (
        <input
          type={field.type}
          defaultValue={field.value}
          className="border border-border rounded px-2 py-1 w-full bg-background"
        />
      );
    case "select":
      return (
        <select
          defaultValue={field.value}
          className="border border-border rounded px-2 py-1 w-full bg-background">
          {field.options?.map((opt: string) => (
            <option
              key={opt}
              value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case "checkbox":
      return (
        <input
          type="checkbox"
          defaultChecked={field.value}
          className="h-4 w-4"
        />
      );
    default:
      return null;
  }
};

const SettingsForm = ({ module }: { module: string }) => {
  const sections = settingsData[module as keyof typeof settingsData] as {
    section: string;
    fields: SettingField[];
  }[];
  if (!sections) {
    return <div className="text-error">No settings for {module}</div>;
  }
  return (
    <form className="space-y-4 max-w-2xl mx-auto">
      {sections.map((section) => (
        <div
          key={section.section}
          className="bg-foreground rounded border p-6 shadow">
          <h3 className="text-lg font-semibold mb-4 text-text-muted">
            {section.section}
          </h3>
          <div className="space-y-4">
            {section.fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center gap-4">
                <label
                  htmlFor={field.id}
                  className="text-sm font-medium text-text-muted">
                  {field.label}
                </label>
                <div className="flex-1">
                  <SettingInput field={field} />
                </div>
              </div>
            ))}
          </div>
          {section.fields.some((field) => field.units) && (
            <div className="text-sm text-text-muted">
              {section.fields.map((field) => field.units).join(", ")}
            </div>
          )}
        </div>
      ))}
    </form>
  );
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Settings"
        description="System settings"
        actions={[
          {
            type: "button",
            label: "Save",
            variant: "primary",
            icon: <SaveIcon size={16} />,
            onClick: () => {},
          },
        ]}
      />

      <Tabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={[
          { label: "General", value: "general" },
          { label: "Sales", value: "sales", disabled: true },
          { label: "Service", value: "service", disabled: true },
          { label: "Production", value: "production" },
        ]}
      />

      <div className="mt-4">
        <SettingsForm module={activeTab} />
      </div>
    </div>
  );
};

export default Settings;
