import { useEffect, useState, useMemo } from "react";
import { Save, Lock } from "lucide-react";
import { useParams } from "react-router-dom";
import { instance } from "@/utils";
import { Button, Modal, PageHeader, Select, Tabs } from "@/components";
import { useApi } from "@/hooks/use-api";
import { PerformanceSheetProvider, usePerformanceSheet } from "@/contexts/performance.context";
import { AutoFillProvider } from "@/contexts/performance/autofill.context";
import { LAZY_PERFORMANCE_TABS } from "@/components/lazy";
import { getVisibleTabs } from "@/utils/tab-visibility";
import { useAutoFillWatcher } from "@/contexts/performance/use-autofill-watcher.hook";
import { ManualAutofillButton } from "@/components/performance/ManualAutofillButton";
import { useRfqSaveWithAutofill } from "@/hooks/use-rfq-save-with-autofill.hook";

type PerformanceTabValue =
  | "rfq"
  | "material-specs"
  | "tddbhd"
  | "reel-drive"
  | "str-utility"
  | "roll-str-backbend"
  | "feed"
  | "shear"
  | "summary-report";


const PerformanceSheetContent = () => {
  const [activeTab, setActiveTab] = useState<PerformanceTabValue>("rfq");
  const [isEditing, setIsEditing] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [addMode, setAddMode] = useState(false);
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
  const api = useApi();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Use global performance context
  const { performanceData, setPerformanceData } = usePerformanceSheet();

  // Use the save hook that includes autofill integration
  const { saveRfqWithAutofill } = useRfqSaveWithAutofill();

  // Auto-fill watcher integration (debounced, only when editing and data loaded)

  useAutoFillWatcher(performanceData, {
    enabled: false, // Disabled - using manual mode only
    debounceMs: 3500,   // 3.5 second debounce to further reduce API calls
    requireMinimumFields: 4
  });

  // Preload next likely tabs on component mount
  useEffect(() => {
    // Preload commonly accessed tabs after a short delay
    const preloadTimer = setTimeout(() => {
      // Preload Material Specs and TDDBHD as they're commonly accessed after RFQ
      const materialSpecsTab = LAZY_PERFORMANCE_TABS.find(tab => tab.value === "material-specs");
      const tddbhdTab = LAZY_PERFORMANCE_TABS.find(tab => tab.value === "tddbhd");

      if (materialSpecsTab?.preload) {
        materialSpecsTab.preload().catch(console.warn);
      }
      if (tddbhdTab?.preload) {
        tddbhdTab.preload().catch(console.warn);
      }
    }, 2000); // Wait 2 seconds after page load

    return () => clearTimeout(preloadTimer);
  }, []);



  useEffect(() => {
    const fetchPerformanceSheet = async () => {
      if (!performanceSheetId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`performance/sheets/${performanceSheetId}`);
        if (response && response.data) {
          // Update global context with fetched data
          setPerformanceData(response.data.data || response.data);
        }
      } catch (err) {
        setError("Failed to load performance sheet");
      } finally {
        setLoading(false);
      }
    };
    fetchPerformanceSheet();
  }, [performanceSheetId]); // Only depend on performanceSheetId
  // const { emit, isConnected } = useSocket();

  // Calculate visible tabs based on performance data - memoized to react to data changes
  const visibleTabs = useMemo(() => {
    if (!performanceData) {
      return [
        { label: "RFQ", value: "rfq" },
        { label: "Material Specs", value: "material-specs" },
        { label: "Equipment Summary", value: "summary-report" }
      ];
    }
    return getVisibleTabs(performanceData);
  }, [performanceData]);

  // Ensure active tab is always visible
  useEffect(() => {
    const isActiveTabVisible = visibleTabs.some(tab => tab.value === activeTab);
    if (!isActiveTabVisible && visibleTabs.length > 0) {
      setActiveTab(visibleTabs[0].value as PerformanceTabValue);
    }
  }, [visibleTabs, activeTab]);

  useEffect(() => {
    if (!performanceSheetId) return;

    const fetchLockStatus = async () => {
      try {
        await instance.get(
          `/lock/status/performance-sheets/${performanceSheetId}`
        );
        // Lock status fetched but not stored in state for now
      } catch (err) {
        console.error("Failed to fetch lock status:", err);
      }
    };

    fetchLockStatus();
  }, [performanceSheetId]);

  const handleEdit = () => {
    setIsEditing(!isEditing);
    // if (!performanceSheetId || !isConnected) return;
    // emit(
    //   "lock:acquire",
    //   {
    //     recordType: "performance-sheets",
    //     recordId: performanceSheetId,
    //     userId: user?.id,
    //   },
    //   (result: any) => {
    //     if (result?.success) {
    //       setIsEditing(true);
    //       setIsLocked(false);
    //       setLockInfo(result.lockInfo);
    //     } else {
    //       setIsLocked(true);
    //       setIsEditing(false);
    //     }
    //   }
    // );
  };

  const handleSave = async () => {
    try {
      await saveRfqWithAutofill();
      setIsEditing(false);
      console.log('✅ Save with autofill completed successfully');
    } catch (error) {
      console.error('❌ Save failed:', error);
      // Keep editing mode if save fails
    }
  };

  const renderTabContent = () => {
    const commonProps = {
      data: performanceData || null,
      isEditing
    };

    if (loading) {
      return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (error) {
      return <div className="flex justify-center items-center h-64 text-red-500">Error loading performance sheet</div>;
    }

    if (!performanceData) {
      return <div className="flex justify-center items-center h-64">No data available</div>;
    }

    // Find the matching tab configuration
    const currentTab = LAZY_PERFORMANCE_TABS.find(tab => tab.value === activeTab);

    if (currentTab) {
      const Component = currentTab.component;
      return <Component {...commonProps} />;
    }

    // Fallback to RFQ if tab not found
    const rfqTab = LAZY_PERFORMANCE_TABS.find(tab => tab.value === "rfq");
    if (rfqTab) {
      const Component = rfqTab.component;
      return <Component {...commonProps} />;
    }

    return <div className="flex justify-center items-center h-64">Tab not found</div>;
  };

  const handleManualSave = async () => {
    await saveRfqWithAutofill();
  };

  const Actions = () => {
    return (
      <div className="flex items-center gap-3">
        {isEditing && performanceData && (
          <ManualAutofillButton
            onSave={handleManualSave}
          />
        )}
        <div className="flex gap-2">
          <Button onClick={isEditing ? handleSave : handleEdit}>
            {isEditing ? <Save size={16} /> : <Lock size={16} />}
            {isEditing ? 'Save' : 'Edit'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Performance Details"
        description="Performance Details"
        actions={<Actions />}
      />

      <Tabs
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as PerformanceTabValue)}
        tabs={visibleTabs.map(tab => ({
          label: tab.dynamicLabel || tab.label,
          value: tab.value
        }))}
      />

      <div className="flex-1 overflow-y-auto">{renderTabContent()}</div>

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
              {links.map((link) => (
                <div
                  key={link.entityType + '-' + link.entityId}
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
              placeholder="Select entity type..."
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
    </div>
  );
};

const PerformanceSheet = () => {
  return (
    <PerformanceSheetProvider>
      <AutoFillProvider>
        <PerformanceSheetContent />
      </AutoFillProvider>
    </PerformanceSheetProvider>
  );
};

export default PerformanceSheet;
