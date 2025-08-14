import { useState } from "react";

type OldField = { name: string; type: string };
type Mapping = {
  oldName: string;
  newName: string;
  transform: string; // e.g. "uppercase", "trim", etc.
};

const oldSchema: OldField[] = [
  { name: "first_name", type: "string" },
  { name: "last_name", type: "string" },
  { name: "dob", type: "date" },
  { name: "phone_number", type: "string" },
];

const transformOptions = [
  { label: "None", value: "" },
  { label: "Uppercase", value: "uppercase" },
  { label: "Lowercase", value: "lowercase" },
  { label: "Trim Spaces", value: "trim" },
  { label: "Format Date (YYYY-MM-DD)", value: "format_date" },
  { label: "Remove Special Characters", value: "strip_special" },
];

export default function MappingPage() {
  const [mappings, setMappings] = useState<Mapping[]>(
    oldSchema.map((f) => ({
      oldName: f.name,
      newName: f.name,
      transform: "",
    }))
  );

  const handleChange = (index: number, field: keyof Mapping, value: string) => {
    setMappings((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleAddColumn = () => {
    setMappings((prev) => [
      ...prev,
      { oldName: "", newName: "new_field", transform: "" },
    ]);
  };

  const handleSave = () => {
    console.log("Mapping saved:", mappings);
    // TODO: Send to backend to run migration
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <h1 className="text-2xl font-semibold mb-6">Database Field Mapping</h1>

      <div className="overflow-auto border border-slate-200 rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3 border-b">Old Field</th>
              <th className="p-3 border-b">New Field Name</th>
              <th className="p-3 border-b">Transformation</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((map, idx) => (
              <tr key={idx} className="border-b last:border-0">
                {/* Old field selector */}
                <td className="p-3">
                  <select
                    value={map.oldName}
                    onChange={(e) =>
                      handleChange(idx, "oldName", e.target.value)
                    }
                    className="border border-slate-300 rounded px-2 py-1 w-full"
                  >
                    <option value="">-- none --</option>
                    {oldSchema.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name} ({f.type})
                      </option>
                    ))}
                  </select>
                </td>

                {/* New field name */}
                <td className="p-3">
                  <input
                    type="text"
                    value={map.newName}
                    onChange={(e) =>
                      handleChange(idx, "newName", e.target.value)
                    }
                    className="border border-slate-300 rounded px-2 py-1 w-full"
                  />
                </td>

                {/* Transform */}
                <td className="p-3">
                  <select
                    value={map.transform}
                    onChange={(e) =>
                      handleChange(idx, "transform", e.target.value)
                    }
                    className="border border-slate-300 rounded px-2 py-1 w-full"
                  >
                    {transformOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleAddColumn}
          className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300"
        >
          + Add Column
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Mapping
        </button>
      </div>
    </div>
  );
}
