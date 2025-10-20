import { useEffect, useState, useRef, useMemo } from "react";
import { Save, Lock, Link } from "lucide-react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth.context";
import { useSocket } from "@/contexts/socket.context";
import { Button, Modal, PageHeader, Select, Tabs, Input, DatePicker, Textarea, Checkbox } from "@/components";
import { useToast } from "@/hooks/use-toast";
import { ms } from "@/utils";
import Loader from "@/components/ui/loader";

type PerformanceTabValue = string;
type ModalType = 'links' | 'save-confirmation' | 'cancel-confirmation' | 'continue' | 'delete-link' | 'create-link' | null;

const PerformanceSheet = () => {
  const [activeTab, setActiveTab] = useState<PerformanceTabValue>("");
  const [isLocked, setIsLocked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lockInfo, setLockInfo] = useState<any>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [linkToDelete, setLinkToDelete] = useState<any>(null);
  const [addMode, setAddMode] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [savedProgress, setSavedProgress] = useState<any>(null);
  const [newLink, setNewLink] = useState<{
    entityType: string;
    entityId: string;
  }>({ entityType: "quote", entityId: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const { id: performanceSheetId } = useParams();
  const { emit, isLockConnected, onLockChanged } = useSocket();
  const { user } = useAuth();
  const { get: getLockStatus } = useApi();
  const { get: getSheet, response: performanceSheet, loading: sheetLoading, error: sheetError } = useApi<any>();
  const { patch: updateSheet } = useApi();
  const { post: createLink } = useApi();
  const { delete: deleteLink } = useApi();
  const { get: searchEntities } = useApi<any>();
  const toast = useToast();
  const lockExtendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const queryParams = useMemo(() => {
    return {
      include: JSON.stringify(["version", "links"]),
    };
  }, []);

  const getNestedValue = (obj: Record<string, any>, path: string): any => {
    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== "object") {
        return undefined;
      }
      current = current[key];
    }

    return current;
  };

  const setNestedValue = (obj: Record<string, any>, path: string, value: any): Record<string, any> => {
    const keys = path.split(".");
    const result = JSON.parse(JSON.stringify(obj));
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    return result;
  };

  const storageKey = useMemo(() => `performance-sheet-${performanceSheetId}`, [performanceSheetId]);

  const saveToLocalStorage = (values: Record<string, any>) => {
    if (!performanceSheetId) return;
    const dataToSave = {
      sheetId: performanceSheetId,
      formData: values,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  };

  const loadFromLocalStorage = () => {
    if (!performanceSheetId) return null;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved performance sheet data:', e);
        return null;
      }
    }
    return null;
  };

  const clearLocalStorage = () => {
    if (!performanceSheetId) return;
    localStorage.removeItem(storageKey);
  };

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

  const links = useMemo(() => {
    return performanceSheet?.data?.links || [];
  }, [performanceSheet]);

  const getEntityPath = (entityType: string, entityId: string) => {
    switch (entityType) {
      case "company":
        return `/sales/companies/${entityId}`;
      case "contact":
        return `/sales/contacts/${entityId}`;
      case "journey":
        return `/sales/journeys/${entityId}`;
      case "quote":
        return `/sales/quotes/${entityId}`;
      default:
        return "#";
    }
  };

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
      const data = performanceSheet.data.data || {};
      setFormData(data);
      setOriginalData(data);

      if (!activeTab && visibleTabs.length > 0) {
        setActiveTab(visibleTabs[0].value);
      }

      const saved = loadFromLocalStorage();
      if (saved && saved.formData && Object.keys(saved.formData).length > 0) {
        const hasChanges = JSON.stringify(saved.formData) !== JSON.stringify(data);
        if (hasChanges) {
          setSavedProgress(saved);
          setModalType('continue');
        }
      }
    }
  }, [performanceSheet]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);

  useEffect(() => {
    if (isEditing && hasChanges) {
      saveToLocalStorage(formData);
    }
  }, [formData, isEditing]);

  useEffect(() => {
    if (isEditing && performanceSheetId && isLockConnected) {
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
      }, ms.minutes(4));

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
    setFormData((prev) => setNestedValue(prev, fieldId, value));
  };

  const handleContinueProgress = () => {
    if (savedProgress) {
      setFormData(savedProgress.formData || {});
      toast.success('Continuing from where you left off');
    }
    setModalType(null);
  };

  const handleStartFresh = () => {
    clearLocalStorage();
    toast.info('Starting fresh with original data');
    setModalType(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSelectedEntity(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await searchEntities(`/core/search`, {
          entityType: newLink.entityType,
          query: value,
          limit: "5",
        });
        setSearchResults(response?.data || []);
        setShowResults(true);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectEntity = (entity: any) => {
    setSelectedEntity(entity);
    setSearchQuery(entity.label);
    setNewLink({ ...newLink, entityId: entity.id });
    setShowResults(false);
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

  const handleCancel = () => {
    if (hasChanges) {
      setModalType('cancel-confirmation');
      return;
    }

    performCancel();
  };

  const performCancel = () => {
    setFormData(originalData);

    if (!performanceSheetId || !isLockConnected) {
      toast.error("Cannot release lock. Connection not available.");
      setModalType(null);
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
          setModalType(null);
          clearLocalStorage();
          toast.info("Edit cancelled and lock released.");

          if (lockExtendIntervalRef.current) {
            clearInterval(lockExtendIntervalRef.current);
            lockExtendIntervalRef.current = null;
          }
        } else {
          toast.error("Failed to release lock.");
          setModalType(null);
        }
      }
    );
  };

  const handleSave = () => {
    setModalType('save-confirmation');
  };

  const handleConfirmSave = async () => {
    if (!performanceSheetId) return;

    try {
      await updateSheet(`/sales/performance-sheets/${performanceSheetId}`, {
        data: formData,
      });

      if (!isLockConnected) {
        toast.error("Cannot release lock. Connection not available.");
        setModalType(null);
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
            setModalType(null);
            setOriginalData(formData);
            clearLocalStorage();
            toast.success("Changes saved and lock released.");

            if (lockExtendIntervalRef.current) {
              clearInterval(lockExtendIntervalRef.current);
              lockExtendIntervalRef.current = null;
            }
          } else {
            toast.error("Failed to release lock.");
            setModalType(null);
          }
        }
      );
    } catch (error) {
      console.error("Failed to save performance sheet:", error);
      toast.error("Failed to save performance sheet.");
      setModalType(null);
    }
  };

  const renderField = (field: any) => {
    const value = getNestedValue(formData, field.id) ?? "";
    const commonProps = {
      id: field.id,
      name: field.id,
      label: field.label,
      required: field.required || false,
      disabled: !isEditing,
      autoComplete: "off",
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
    if (isEditing) {
      return (
        <div className="flex gap-2">
          <Button variant="secondary-outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!hasChanges}>
            <Save size={16} /> Save
          </Button>
        </div>
      );
    }

    if (isLocked && lockInfo?.userId && lockInfo.userId !== user?.id) {
      return (
        <div className="flex gap-2">
          <Button variant="secondary-outline" onClick={() => setModalType('links')}>
            <Link size={16} /> Links ({links.length})
          </Button>
          <Button variant="secondary" disabled>
            <Lock size={16} /> Locked by {lockInfo?.userName || "another user"}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex gap-2">
        <Button variant="secondary-outline" onClick={() => setModalType('links')}>
          <Link size={16} /> Links ({links.length})
        </Button>
        <Button variant="secondary" onClick={handleEdit} disabled={!isLockConnected}>
          <Lock size={16} /> Edit
        </Button>
      </div>
    );
  };

  const closeModal = () => {
    setModalType(null);
    if (modalType === 'links') {
      setAddMode(false);
      setNewLink({ entityType: "quote", entityId: "" });
      setSearchQuery("");
      setSearchResults([]);
      setSelectedEntity(null);
      setShowResults(false);
    }
    if (modalType === 'delete-link') {
      setLinkToDelete(null);
    }
  };

  const getModalConfig = () => {
    switch (modalType) {
      case 'links':
        return { title: 'Links', size: 'sm' as const, overflow: 'visible' as const };
      case 'save-confirmation':
        return { title: 'Confirm Save', size: 'xs' as const };
      case 'cancel-confirmation':
        return { title: 'Unsaved Changes', size: 'xs' as const };
      case 'continue':
        return { title: 'Continue Previous Session?', size: 'xs' as const };
      case 'delete-link':
        return { title: 'Confirm Delete', size: 'xs' as const };
      case 'create-link':
        return { title: 'Confirm Add Link', size: 'xs' as const };
      default:
        return { title: '', size: 'sm' as const };
    }
  };

  const renderModalContent = () => {
    switch (modalType) {
      case 'links':
        return !addMode ? (
          <div>
            <div className="bg-foreground rounded border border-border p-2 flex flex-col gap-1 mb-4">
              {links.length === 0 ? (
                <div className="text-center text-text-muted text-sm py-4">
                  No links added yet
                </div>
              ) : (
                links.map((link: any) => (
                  <div
                    key={link.id}
                    className="flex items-center px-2 py-1 justify-between rounded text-sm border border-transparent group">
                    <RouterLink
                      to={getEntityPath(link.entityType, link.entityId)}
                      className="flex items-center gap-2 flex-1 hover:underline rounded px-1 py-0.5 -mx-1 hover:bg-surface/50 transition">
                      <span className="font-medium capitalize text-text-muted">
                        {link.entityType}
                      </span>
                      <span className="text-xs text-text">
                        {link.label || link.entityId}
                      </span>
                    </RouterLink>
                    <button
                      onClick={() => {
                        setLinkToDelete(link);
                        setModalType('delete-link');
                      }}
                      className="opacity-0 group-hover:opacity-100 text-error hover:text-error/80 text-xs ml-2 shrink-0">
                      Delete
                    </button>
                  </div>
                ))
              )}
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
              setModalType('create-link');
            }}>
            <Select
              label="Entity Type"
              name="entityType"
              value={newLink.entityType}
              onChange={(e) => {
                setNewLink({ ...newLink, entityType: e.target.value, entityId: "" });
                setSearchQuery("");
                setSearchResults([]);
                setSelectedEntity(null);
                setShowResults(false);
              }}
              options={[
                { value: "quote", label: "Quote" },
                { value: "journey", label: "Journey" },
                { value: "contact", label: "Contact" },
                { value: "company", label: "Company" },
              ]}
            />
            <div className="relative">
              <Input
                label="Search Entity"
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                required
                autoComplete="off"
                placeholder={`Search for ${newLink.entityType}...`}
              />
              {isSearching && (
                <div className="absolute right-3 top-9 text-text-muted text-sm">
                  Searching...
                </div>
              )}
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-[9999] w-full mt-1 bg-foreground border border-border rounded shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => handleSelectEntity(result)}
                      className="w-full text-left px-3 py-2 hover:bg-surface transition text-sm text-text">
                      {result.label}
                    </button>
                  ))}
                </div>
              )}
              {showResults && searchResults.length === 0 && !isSearching && (
                <div className="absolute z-[9999] w-full mt-1 bg-foreground border border-border rounded shadow-lg">
                  <div className="px-3 py-2 text-sm text-text-muted">
                    No results found
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="secondary-outline"
                size="md"
                onClick={() => {
                  setAddMode(false);
                  setNewLink({ entityType: "quote", entityId: "" });
                  setSearchQuery("");
                  setSearchResults([]);
                  setSelectedEntity(null);
                  setShowResults(false);
                }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={!selectedEntity}>
                Save
              </Button>
            </div>
          </form>
        );

      case 'save-confirmation':
        return (
          <div className="space-y-4">
            <p className="text-sm text-text">
              Are you sure you want to save your changes and release the lock?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary-outline"
                onClick={() => setModalType(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmSave}>
                Save
              </Button>
            </div>
          </div>
        );

      case 'cancel-confirmation':
        return (
          <div className="space-y-4">
            <p className="text-sm text-text">
              You have unsaved changes. Are you sure you want to discard them and release the lock?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary-outline"
                onClick={() => setModalType(null)}>
                Keep Editing
              </Button>
              <Button
                variant="primary"
                onClick={performCancel}>
                Discard Changes
              </Button>
            </div>
          </div>
        );

      case 'continue':
        return (
          <div className="space-y-4">
            <p className="text-sm text-text">
              You have unsaved changes from a previous session. Would you like to continue where you left off?
            </p>
            {savedProgress && (
              <div className="text-text-muted text-sm">
                <p>Last saved: {new Date(savedProgress.savedAt).toLocaleString()}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary-outline"
                onClick={handleStartFresh}>
                Start Fresh
              </Button>
              <Button
                variant="primary"
                onClick={handleContinueProgress}>
                Continue
              </Button>
            </div>
          </div>
        );

      case 'delete-link':
        return (
          <div className="space-y-4">
            <p className="text-sm text-text">
              Are you sure you want to delete this link?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary-outline"
                onClick={() => {
                  setModalType('links');
                  setLinkToDelete(null);
                }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  if (!linkToDelete) return;
                  try {
                    await deleteLink(`/sales/performance-links/${linkToDelete.id}`);
                    toast.success("Link deleted");
                    setModalType(null);
                    setLinkToDelete(null);
                    fetchSheet();
                  } catch (error) {
                    toast.error("Failed to delete link");
                    setModalType(null);
                  }
                }}>
                Delete
              </Button>
            </div>
          </div>
        );

      case 'create-link':
        return (
          <div className="space-y-4">
            <p className="text-sm text-text">
              Are you sure you want to add this link?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary-outline"
                onClick={() => setModalType('links')}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  try {
                    await createLink("/sales/performance-links", {
                      performanceSheetId,
                      entityType: newLink.entityType,
                      entityId: newLink.entityId,
                    });
                    toast.success("Link created");
                    setModalType(null);
                    setAddMode(false);
                    setNewLink({ entityType: "quote", entityId: "" });
                    setSearchQuery("");
                    setSearchResults([]);
                    setSelectedEntity(null);
                    setShowResults(false);
                    fetchSheet();
                  } catch (error) {
                    toast.error("Failed to create link");
                    setModalType(null);
                  }
                }}>
                Add Link
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (sheetLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
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
        isOpen={modalType !== null}
        onClose={modalType === 'continue' ? () => {} : closeModal}
        title={getModalConfig().title}
        size={getModalConfig().size}
        overflow={getModalConfig().overflow}>
        {renderModalContent()}
      </Modal>
    </div>
  );
};

export default PerformanceSheet;