import { useEffect, useState, useRef, useMemo } from "react";
import { Save, Lock, Link } from "lucide-react";
import { useParams } from "react-router-dom";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth.context";
import { useSocket } from "@/contexts/socket.context";
import { Button, Modal, PageHeader, Select, Tabs, Input, DatePicker, Textarea, Checkbox } from "@/components";
import { useToast } from "@/hooks/use-toast";

type PerformanceTabValue = string;


const PerformanceSheet = () => {
  const [activeTab, setActiveTab] = useState<PerformanceTabValue>("");
  const [isLocked, setIsLocked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lockInfo, setLockInfo] = useState<any>(null);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [newLink, setNewLink] = useState<{
    entityType: string;
    entityId: string;
  }>({ entityType: "quote", entityId: "" });
  const [links, setLinks] = useState<
    Array<{ entityType: string; entityId: string }>
  >([
    { entityType: "quote", entityId: "123" },
    { entityType: "journey", entityId: "456" },
    { entityType: "company", entityId: "789" },
  ]);
  const { id: performanceSheetId } = useParams();
  const { emit, isLockConnected, onLockChanged } = useSocket();
  const { user } = useAuth();
  const { get: getLockStatus } = useApi();
  const { get: getSheet, response: performanceSheet, loading: sheetLoading, error: sheetError } = useApi<any>();
  const { patch: updateSheet } = useApi();
  const toast = useToast();
  const lockExtendIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const queryParams = useMemo(() => {
    return {
      include: JSON.stringify(["version"]),
    };
  }, []);

  const visibleTabs = useMemo(() => {
    if (!performanceSheet?.data?.version?.sections) return [];
    return performanceSheet.data.version.sections
      .sort((a: any, b: any) => a.sequence - b.sequence)
      .map((tab: any) => ({
        label: tab.label,
        value: tab.value,
      }));
  }, [performanceSheet]);

  const activeTabData = useMemo(() => {
    if (!performanceSheet?.data?.version?.sections || !activeTab) return null;
    return performanceSheet.data.version.sections.find((tab: any) => tab.value === activeTab);
  }, [performanceSheet, activeTab]);

  const fetchSheet = async () => {
    if (!performanceSheetId) return;
    await getSheet(`/sales/performance-sheets/${performanceSheetId}`, queryParams);
  };

  const fetchLockStatus = async () => {
    if (!performanceSheetId) return;
    try {
      const response = await getLockStatus(
        `/core/locks/status/performance-sheets/${performanceSheetId}`
      );
      if (response) {
        setIsLocked((response as any)?.isLocked ?? false);
        setLockInfo((response as any)?.lockInfo || null);
      }
    } catch (err) {
      console.error("Failed to fetch lock status:", err);
    }
  };

  useEffect(() => {
    if (!performanceSheetId) return;

    fetchSheet();
    fetchLockStatus();

    // Cleanup lock on unmount
    return () => {
      if (lockExtendIntervalRef.current) {
        clearInterval(lockExtendIntervalRef.current);
      }
      if (isEditing && performanceSheetId && isLockConnected) {
        emit(
          "lock:release",
          {
            recordType: "performance-sheets",
            recordId: performanceSheetId,
            userId: user?.id,
          }
        );
      }
    };
  }, [performanceSheetId]);

  useEffect(() => {
    if (performanceSheet?.data) {
      setFormData(performanceSheet.data.data || {});

      if (!activeTab && visibleTabs.length > 0) {
        setActiveTab(visibleTabs[0].value);
      }
    }
  }, [performanceSheet]);

  // Auto-extend lock while editing
  useEffect(() => {
    if (isEditing && performanceSheetId && isLockConnected) {
      // Extend lock every 4 minutes (locks typically expire after 5 minutes)
      lockExtendIntervalRef.current = setInterval(() => {
        emit(
          "lock:extend",
          {
            recordType: "performance-sheets",
            recordId: performanceSheetId,
            userId: user?.id,
          },
          (result: any) => {
            if (!result?.success) {
              toast.error("Failed to extend lock. Your changes may not be saved.");
              setIsEditing(false);
              setIsLocked(false);
            }
          }
        );
      }, 4 * 60 * 1000); // 4 minutes

      return () => {
        if (lockExtendIntervalRef.current) {
          clearInterval(lockExtendIntervalRef.current);
          lockExtendIntervalRef.current = null;
        }
      };
    }
  }, [isEditing, performanceSheetId, isLockConnected]);

  useEffect(() => {
    const unsubscribe = onLockChanged((data: any) => {
      const { recordType, recordId, lockInfo } = data;

      if (recordType === "performance-sheets" && recordId === performanceSheetId) {
        if (lockInfo) {
          setIsLocked(true);
          setLockInfo(lockInfo);

          if (lockInfo.userId !== user?.id && isEditing) {
            toast.warning("Lock was acquired by another user. Your editing session has ended.");
            setIsEditing(false);
            if (lockExtendIntervalRef.current) {
              clearInterval(lockExtendIntervalRef.current);
              lockExtendIntervalRef.current = null;
            }
          }
        } else {
          setIsLocked(false);
          setLockInfo(null);
          if (isEditing) {
            setIsEditing(false);
            if (lockExtendIntervalRef.current) {
              clearInterval(lockExtendIntervalRef.current);
              lockExtendIntervalRef.current = null;
            }
          }
        }
      }
    });

    return unsubscribe;
  }, [onLockChanged, performanceSheetId, user?.id, isEditing]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleEdit = () => {
    if (!performanceSheetId || !isLockConnected) {
      toast.error("Cannot acquire lock. Connection not available.");
      return;
    }

    emit(
      "lock:acquire",
      {
        recordType: "performance-sheets",
        recordId: performanceSheetId,
        userId: user?.id,
      },
      (result: any) => {
        if (result?.success) {
          setIsEditing(true);
          setIsLocked(true);
          setLockInfo(result.lockInfo);
          toast.success("Lock acquired. You can now edit.");
        } else {
          setIsLocked(true);
          setIsEditing(false);
          toast.error(result?.message || "Failed to acquire lock. Sheet may be locked by another user.");
        }
      }
    );
  };

  const handleSave = () => {
    setShowSaveConfirmation(true);
  };

  const handleConfirmSave = async () => {
    if (!performanceSheetId) return;

    try {
      // Update performance sheet data
      await updateSheet(`/sales/performance-sheets/${performanceSheetId}`, {
        data: formData,
      });

      // Release lock after save
      if (!isLockConnected) {
        toast.error("Cannot release lock. Connection not available.");
        setShowSaveConfirmation(false);
        return;
      }

      emit(
        "lock:release",
        {
          recordType: "performance-sheets",
          recordId: performanceSheetId,
          userId: user?.id,
        },
        (result: any) => {
          if (result?.success) {
            setIsEditing(false);
            setIsLocked(false);
            setLockInfo(null);
            setShowSaveConfirmation(false);
            toast.success("Changes saved and lock released.");

            // Clear auto-extend interval
            if (lockExtendIntervalRef.current) {
              clearInterval(lockExtendIntervalRef.current);
              lockExtendIntervalRef.current = null;
            }
          } else {
            toast.error("Failed to release lock.");
            setShowSaveConfirmation(false);
          }
        }
      );
    } catch (error) {
      console.error("Failed to save performance sheet:", error);
      toast.error("Failed to save performance sheet.");
      setShowSaveConfirmation(false);
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.id] || "";
    const commonProps = {
      id: field.id,
      name: field.id,
      label: field.label,
      required: field.required || false,
      disabled: !isEditing,
    };

    const getSizeClass = () => {
      switch (field.size) {
        case "sm":
          return "col-span-1";
        case "md":
          return "col-span-1";
        case "lg":
          return "col-span-2";
        case "full":
          return "col-span-full";
        default:
          return "col-span-1";
      }
    };

    const renderInput = () => {
      switch (field.type) {
        case "text":
          return (
            <Input
              {...commonProps}
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
          );
        case "number":
          return (
            <Input
              {...commonProps}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
          );
        case "date":
          return (
            <DatePicker
              {...commonProps}
              value={value}
              onChange={(date) => handleFieldChange(field.id, date)}
            />
          );
        case "textarea":
          return (
            <Textarea
              {...commonProps}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              rows={4}
            />
          );
        case "select":
          return (
            <Select
              {...commonProps}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              options={field.options || []}
            />
          );
        case "checkbox":
          return (
            <Checkbox
              {...commonProps}
              checked={!!value}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
            />
          );
        default:
          return (
            <Input
              {...commonProps}
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
          );
      }
    };

    return (
      <div key={field.id} className={getSizeClass()}>
        {renderInput()}
      </div>
    );
  };

  const getHeaderActions = () => {
    // Currently editing - show Save button
    if (isEditing) {
      return (
        <Button variant="primary" onClick={handleSave}>
          <Save size={16} /> Save
        </Button>
      );
    }

    // Locked by another user - show disabled Locked button
    if (isLocked && lockInfo?.userId && lockInfo.userId !== user?.id) {
      return (
        <div className="flex gap-2">
          <Button variant="secondary-outline" onClick={() => setShowLinksModal(true)}>
            <Link size={16} />
          </Button>
          <Button variant="secondary" disabled>
            <Lock size={16} /> Locked by {lockInfo?.userName || "another user"}
          </Button>
        </div>
      );
    }

    // Not locked or locked by current user (shouldn't happen) - show Edit button
    return (
      <div className="flex gap-2">
        <Button variant="secondary-outline" onClick={() => setShowLinksModal(true)}>
          <Link size={16} />
        </Button>
        <Button variant="secondary" onClick={handleEdit} disabled={!isLockConnected}>
          <Lock size={16} /> Edit
        </Button>
      </div>
    );
  };


  if (sheetLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-text-muted">Loading performance sheet...</div>
      </div>
    );
  }

  if (sheetError) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-error">Error loading performance sheet: {sheetError}</div>
      </div>
    );
  }

  if (!performanceSheet?.data) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-text-muted">Performance sheet not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={performanceSheet.data.name || "Performance Sheet"}
        description={`Version: ${performanceSheet.data.version?.id?.slice(-8) || "Unknown"}`}
        actions={getHeaderActions()}
        goBack
        goBackTo='/sales/performance-sheets'
      />

      <Tabs
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as PerformanceTabValue)}
        tabs={visibleTabs}
      />

      <div className="p-6">
        {activeTabData?.sections?.map((section: any) => (
          <div key={section.id} className="mb-8">
            <h2 className="text-lg font-semibold text-text mb-4">{section.title}</h2>
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${section.columns || 2}, minmax(0, 1fr))`,
              }}
            >
              {section.fields
                ?.sort((a: any, b: any) => a.sequence - b.sequence)
                .map((field: any) => renderField(field))}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showLinksModal}
        onClose={() => {
          setShowLinksModal(false);
          setAddMode(false);
          setNewLink({ entityType: "quote", entityId: "" });
        }}
        title="Links"
        size="sm">
        {!addMode ? (
          <div>
            <div className="bg-foreground rounded border border-border p-2 flex flex-col gap-1 mb-4">
              {links.map((link, idx) => (
                <div
                  key={idx}
                  className="flex items-center px-2 py-1 justify-between rounded hover:bg-surface/80 transition text-sm cursor-pointer border border-transparent">
                  <span className="font-medium capitalize text-text-muted">
                    {link.entityType}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    #{link.entityId}
                  </span>
                </div>
              ))}
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => setAddMode(true)}
              className="w-full">
              Add
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLinks([...links, newLink]);
              setAddMode(false);
              setNewLink({ entityType: "quote", entityId: "" });
            }}>
            <Select
              label="Entity Type"
              name="entityType"
              value={newLink.entityType}
              onChange={(e) =>
                setNewLink({ ...newLink, entityType: e.target.value })
              }
              options={[
                { value: "quote", label: "Quote" },
                { value: "journey", label: "Journey" },
                { value: "contact", label: "Contact" },
                { value: "company", label: "Company" },
              ]}
            />
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                Entity ID
              </label>
              <input
                className="w-full border rounded px-2 py-1"
                type="text"
                value={newLink.entityId}
                onChange={(e) =>
                  setNewLink({ ...newLink, entityId: e.target.value })
                }
                required
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="secondary-outline"
                size="md"
                onClick={() => {
                  setAddMode(false);
                  setNewLink({ entityType: "quote", entityId: "" });
                }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setLinks([...links, newLink]);
                  setAddMode(false);
                  setNewLink({ entityType: "quote", entityId: "" });
                }}
                disabled={!newLink.entityId}>
                Save
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={showSaveConfirmation}
        onClose={() => setShowSaveConfirmation(false)}
        title="Confirm Save"
        size="xs">
        <div className="space-y-4">
          <p className="text-sm text-text">
            Are you sure you want to save your changes and release the lock?
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary-outline"
              onClick={() => setShowSaveConfirmation(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmSave}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PerformanceSheet;