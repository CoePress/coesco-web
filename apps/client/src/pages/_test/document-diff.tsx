import React, { useState } from "react";

const sampleFormSchema = [
  {
    section: "Contact Information",
    fields: [
      { key: "name", label: "Full Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone Number" },
    ],
  },
  {
    section: "Project Details",
    fields: [
      { key: "projectName", label: "Project Name" },
      { key: "budget", label: "Estimated Budget" },
      { key: "deadline", label: "Deadline" },
    ],
  },
];

const versionA = {
  name: "Alice Johnson",
  email: "alice@example.com",
  phone: "123-456-7890",
  projectName: "Quote Automation",
  budget: "$10,000",
  deadline: "2025-09-01",
};

const versionB = {
  name: "Alice J.",
  email: "alice@example.com",
  phone: "123-456-7899",
  projectName: "Quote Auto",
  budget: "$12,000",
  deadline: "2025-09-01",
};

const FormMerge = () => {
  const [mergedForm, setMergedForm] = useState({ ...versionA });
  const [selectedVersions, setSelectedVersions] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleMerge = (key, value, version) => {
    setMergedForm((prev) => ({ ...prev, [key]: value }));
    setSelectedVersions((prev) => ({ ...prev, [key]: version }));
  };

  const isDifferent = (key) => versionA[key] !== versionB[key];

  const getSelectedVersion = (key) => {
    if (!selectedVersions[key]) {
      return mergedForm[key] === versionA[key] ? "A" : "B";
    }
    return selectedVersions[key];
  };

  const handleSubmitMerge = () => {
    setShowConfirmModal(true);
  };

  const confirmMerge = () => {
    console.log("Merge confirmed:", mergedForm);
    alert("Form merged successfully!");
    setShowConfirmModal(false);
  };

  return (
    <div className="w-full flex flex-col gap-2 p-2">
      {sampleFormSchema.map((section, idx) => (
        <div
          key={idx}
          className="bg-foreground border rounded p-2">
          <h2 className="text-sm text-text-muted font-semibold mb-2">
            {section.section}
          </h2>
          {section.fields.map(({ key, label }) => (
            <div
              key={key}
              className="grid grid-cols-1 md:grid-cols-3 items-start gap-2 mb-2">
              <label className="text-sm text-text-muted font-medium">
                {label}
                {isDifferent(key) && (
                  <span className="ml-1 text-xs bg-error/10 border border-error text-error px-1 rounded">
                    !
                  </span>
                )}
              </label>

              <div
                className={`p-2 rounded border bg-surface text-sm cursor-pointer relative ${
                  getSelectedVersion(key) === "A"
                    ? "border-primary bg-primary/10"
                    : isDifferent(key)
                      ? "border-warning"
                      : "border-border"
                }`}
                onClick={() => handleMerge(key, versionA[key], "A")}>
                {getSelectedVersion(key) === "A" && (
                  <div className="absolute top-1 right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full"></div>
                  </div>
                )}

                <p className="text-xs text-text-muted mb-1">Version A</p>
                <p className="text-text">{versionA[key]}</p>
                <button
                  className={`text-xs underline mt-1 ${
                    getSelectedVersion(key) === "A"
                      ? "text-primary font-medium"
                      : "text-primary"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMerge(key, versionA[key], "A");
                  }}>
                  {/* {getSelectedVersion(key) === "A" ? "Selected" : "Use A"} */}
                </button>
              </div>

              <div
                className={`p-2 rounded border bg-surface text-sm cursor-pointer relative ${
                  getSelectedVersion(key) === "B"
                    ? "border-primary bg-primary/10"
                    : isDifferent(key)
                      ? "border-warning"
                      : "border-border"
                }`}
                onClick={() => handleMerge(key, versionB[key], "B")}>
                {getSelectedVersion(key) === "B" && (
                  <div className="absolute top-1 right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full"></div>
                  </div>
                )}

                <p className="text-xs text-text-muted mb-1">Version B</p>
                <p className="text-text">{versionB[key]}</p>
                <button
                  className={`text-xs underline mt-1 ${
                    getSelectedVersion(key) === "B"
                      ? "text-primary font-medium"
                      : "text-primary"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMerge(key, versionB[key], "B");
                  }}>
                  {/* {getSelectedVersion(key) === "B" ? "Selected" : "Use B"} */}
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="bg-foreground border rounded p-2">
        <h2 className="text-sm text-text-muted font-semibold mb-2">
          Merged Result
        </h2>
        <pre className="bg-surface p-2 rounded text-xs text-text overflow-x-auto border border-border mb-2">
          {JSON.stringify(mergedForm, null, 2)}
        </pre>

        <div className="flex gap-2">
          <button
            onClick={handleSubmitMerge}
            className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-medium">
            Submit Merge
          </button>
          <button
            onClick={() => {
              setMergedForm({ ...versionA });
              setSelectedVersions({});
            }}
            className="bg-surface border border-border text-text-muted px-3 py-1 rounded text-xs">
            Reset
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-foreground border rounded p-4 max-w-md w-full mx-4">
            <h3 className="text-sm font-semibold text-text-muted mb-2">
              Confirm Merge
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Are you sure you want to submit this merged form?
            </p>

            <div className="mb-4 p-2 bg-surface rounded border text-xs">
              <p className="font-medium text-text-muted mb-1">Selections:</p>
              {Object.keys(mergedForm).map((key) => {
                const version = getSelectedVersion(key);
                const fieldLabel = sampleFormSchema
                  .flatMap((s) => s.fields)
                  .find((f) => f.key === key)?.label;
                return (
                  <div
                    key={key}
                    className="text-text-muted">
                    {fieldLabel}: Version {version}
                    {isDifferent(key) && (
                      <span className="text-warning"> (conflict resolved)</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1 text-xs border border-border rounded text-text-muted bg-surface">
                Cancel
              </button>
              <button
                onClick={confirmMerge}
                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormMerge;
