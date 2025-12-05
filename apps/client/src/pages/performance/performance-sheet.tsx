import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Save, Lock, Link, ChevronDown } from "lucide-react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/contexts/auth.context";
import { useSocket } from "@/contexts/socket.context";
import { Button, Modal, PageHeader, Select, Tabs, Input, DatePicker, Textarea, Checkbox } from "@/components";
import { useToast } from "@/hooks/use-toast";
import { ms } from "@/utils";
import Loader from "@/components/ui/loader";
import { getVisibleTabs } from "@/utils/tab-visibility";
import { getReelWidthOptionsForModel, getBackplateDiameterOptionsForModel, getStrWidthOptionsForModel, getStrHorsepowerOptionsForModel, getStrFeedRateOptionsForModelAndHorsepower, getFeedMachineWidthOptionsForModel, getHydThreadingDriveOptionsForModel, getHoldDownAssyOptionsForModel, getCylinderOptionsForHoldDownAssy, getDefaultCylinderForHoldDownAssy, DEFAULT_STR_MODEL, getDefaultStrWidthForModel, getDefaultStrHorsepowerForModel } from "@/utils/performance-sheet";

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
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [, forceUpdate] = useState({});
  const { id: performanceSheetId } = useParams();
  const { emit, isLockConnected, onLockChanged, calculatePerformanceSheet, isPerformanceConnected } = useSocket();
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
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const queryParams = useMemo(() => {
    return {
      include: JSON.stringify(["version", "links"]),
    };
  }, []);

  // Debounced calculation function
  const debouncedCalculate = useCallback((data: Record<string, any>) => {
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }

    calculationTimeoutRef.current = setTimeout(() => {
      if (isPerformanceConnected && performanceSheet?.data?.version?.sections) {
        const bundledData = bundleFormDataByTabsAndSections(data);
        calculatePerformanceSheet(bundledData, "main.py", (response) => {
          if (response?.ok) {
            console.log("Calculation result:", response.result);
            // Merge calculated values without overwriting user input
            if (response.result) {
              console.log("Merging calculated values with current form data");
              setFormData(currentFormData => mergeCalculatedValues(currentFormData, response.result));
            }
          }
        });
      }
    }, 1000); // Wait 1 second after user stops typing
  }, [isPerformanceConnected, performanceSheet, calculatePerformanceSheet]);

  // Helper function to merge calculated values without overwriting user input
  const mergeCalculatedValues = useCallback((currentData: Record<string, any>, calculatedData: Record<string, any>): Record<string, any> => {
    let mergedData = { ...currentData };

    // Define paths for calculated fields that should be updated
    const calculatedFieldPaths = [
      // RFQ FPM values
      'common.feedRates.average.fpm',
      'common.feedRates.max.fpm',
      'common.feedRates.min.fpm',
      // Material specs
      'materialSpecs.material.minBendRadius',
      'materialSpecs.material.minLoopLength',
      'materialSpecs.material.calculatedCoilOD',
      // TDDBHD calculated fields
      'tddbhd.coil.coilWeight',
      'tddbhd.coil.coilOD',
      'tddbhd.reel.dispReelMtr',
      'tddbhd.reel.brakePadDiameter',
      'tddbhd.reel.cylinderBore',
      'tddbhd.reel.webTension.psi',
      'tddbhd.reel.webTension.lbs',
      'tddbhd.reel.torque.atMandrel',
      'tddbhd.reel.torque.rewindRequired',
      'tddbhd.reel.torque.required',
      'tddbhd.reel.holddown.force.required',
      'tddbhd.reel.holddown.force.available',
      'tddbhd.reel.holddown.cylinderPressure',
      'tddbhd.reel.minMaterialWidth',
      'tddbhd.reel.dragBrake.psiAirRequired',
      'tddbhd.reel.dragBrake.holdingForce',
      // Reel Drive calculated fields (key ones)
      'reelDrive.reel.maxWidth',
      'reelDrive.reel.mandrel.diameter',
      'reelDrive.reel.mandrel.length',
      'reelDrive.reel.mandrel.maxRPM',
      'reelDrive.reel.backplate.thickness',
      'reelDrive.reel.backplate.weight',
      'reelDrive.coil.weight',
      'reelDrive.reel.ratio',
      'reelDrive.reel.speed',
      'reelDrive.reel.accelerationRate',
      'reelDrive.reel.torque.empty.torque',
      'reelDrive.reel.torque.full.torque',

      // Feed calculated fields
      'feed.feed.motor',
      'feed.feed.amp',
      'feed.feed.ratio',
      'feed.feed.maxMotorRPM',
      'feed.feed.motorInertia',
      'feed.feed.settleTime',
      'feed.feed.regen',
      'feed.feed.reflInertia',
      'feed.feed.match',
      'feed.feed.materialInLoop',
      'feed.feed.torque.motorPeak',
      'feed.feed.torque.peak',
      'feed.feed.torque.frictional',
      'feed.feed.torque.loop',
      'feed.feed.torque.settle',
      'feed.feed.torque.acceleration',
      'feed.feed.torque.rms.motor',
      'feed.feed.torque.rms.feedAngle1',
      'feed.feed.torque.rms.feedAngle2',
      'feed.feed.pullThru.centerDistance',
      'feed.feed.pullThru.yieldStrength',
      'feed.feed.pullThru.kConst',
      'feed.feed.pullThru.straightenerRolls',
      'feed.feed.pullThru.straightenerTorque',

      // Str Utility calculated fields
      'strUtility.straightener.centerDistance',
      'strUtility.straightener.jackForceAvailable',
      'strUtility.straightener.modulus',
      'strUtility.straightener.maxRollDepth',
      'strUtility.straightener.rolls.straightener.diameter',
      'strUtility.straightener.rolls.pinch.diameter',
      'strUtility.straightener.rolls.straightener.requiredGearTorque',
      'strUtility.straightener.rolls.straightener.ratedTorque',
      'strUtility.straightener.rolls.pinch.requiredGearTorque',
      'strUtility.straightener.rolls.pinch.ratedTorque',
      'strUtility.straightener.gear.faceWidth',
      'strUtility.straightener.gear.contAngle',
      'strUtility.straightener.gear.straightenerRoll.numberOfTeeth',
      'strUtility.straightener.gear.straightenerRoll.dp',
      'strUtility.straightener.gear.pinchRoll.numberOfTeeth',
      'strUtility.straightener.gear.pinchRoll.dp',
      'strUtility.straightener.required.force',
      'strUtility.straightener.required.horsepower',
      'strUtility.straightener.actualCoilWeight',
      'strUtility.straightener.coilOD',
      'strUtility.straightener.torque.straightener',
      'strUtility.straightener.torque.acceleration',
      'strUtility.straightener.torque.brake',
      'strUtility.straightener.required.horsepowerCheck',
      'strUtility.straightener.required.jackForceCheck',
      'strUtility.straightener.required.backupRollsCheck',
      'strUtility.straightener.required.feedRateCheck',
      'strUtility.straightener.required.pinchRollCheck',
      'strUtility.straightener.required.strRollCheck',
      'strUtility.straightener.required.fpmCheck',

      // Roll Str Backbend calculated fields  
      'rollStrBackbend.rollConfiguration',
      'rollStrBackbend.straightener.rollDiameter',
      'rollStrBackbend.straightener.centerDistance',
      'rollStrBackbend.straightener.jackForceAvailable',
      'rollStrBackbend.straightener.rolls.depth.withMaterial',
      'rollStrBackbend.straightener.rolls.backbend.rollers.depthRequired',
      'rollStrBackbend.straightener.rolls.backbend.rollers.forceRequired',
      'rollStrBackbend.straightener.rolls.backbend.yieldMet',
      'rollStrBackbend.straightener.rolls.backbend.radius.comingOffCoil',
      'rollStrBackbend.straightener.rolls.backbend.radius.offCoilAfterSpringback',
      'rollStrBackbend.straightener.rolls.backbend.radius.bendingMomentToYield',
      'rollStrBackbend.straightener.rolls.backbend.radius.oneOffCoil',
      'rollStrBackbend.straightener.rolls.backbend.radius.curveAtYield',
      'rollStrBackbend.straightener.rolls.backbend.radius.radiusAtYield',
      'rollStrBackbend.straightener.rolls.backbend.rollers.first.height',
      'rollStrBackbend.straightener.rolls.backbend.rollers.first.forceRequired',
      'rollStrBackbend.straightener.rolls.backbend.rollers.first.numberOfYieldStrainsAtSurface',

      // Shear calculated fields
      'shear.shear.blade.angleOfBlade',
      'shear.shear.blade.initialCut.length',
      'shear.shear.blade.initialCut.area'
    ];

    // Only update calculated fields, preserve user input fields
    calculatedFieldPaths.forEach(path => {
      const calculatedValue = getNestedValue(calculatedData, path);
      if (calculatedValue !== undefined && calculatedValue !== null) {
        mergedData = setNestedValue(mergedData, path, calculatedValue);
      }
    });

    return mergedData;
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

  const isFieldFilled = (value: any, fieldType: string): boolean => {
    if (value === null || value === undefined) return false;
    if (fieldType === 'checkbox') return true;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return true;
    return false;
  };

  const isCheckField = (fieldId: string): boolean => {
    const lowerFieldId = fieldId.toLowerCase();
    return lowerFieldId.includes('check') || lowerFieldId.endsWith('ok');
  };

  const getCheckStatus = (value: any): 'pass' | 'fail' | 'pending' => {
    if (!value || value === '') return 'pending';
    const strValue = String(value).trim().toLowerCase();

    if (strValue === 'ok' || strValue === 'pass' || strValue === 'yes' ||
      strValue === 'true' || strValue === '✓' || strValue === 'valid') {
      return 'pass';
    }

    if (strValue === 'fail' || strValue === 'no' || strValue === 'false' ||
      strValue === '✗' || strValue === 'error' || strValue === 'not ok' ||
      strValue === 'too small' || strValue === 'too large' || strValue === 'invalid') {
      return 'fail';
    }

    return 'pending';
  };

  const getSectionCheckStats = (section: any) => {
    const checkFields = section.fields?.filter((f: any) => isCheckField(f.id)) || [];
    if (checkFields.length === 0) return null;

    let passed = 0, failed = 0, pending = 0;

    checkFields.forEach((field: any) => {
      const value = getNestedValue(formData, field.id);
      const status = getCheckStatus(value);
      if (status === 'pass') passed++;
      else if (status === 'fail') failed++;
      else pending++;
    });

    return { total: checkFields.length, passed, failed, pending };
  };

  const getTabCheckStats = (tabValue: string) => {
    const tab = performanceSheet?.data?.version?.sections?.find((t: any) => t.value === tabValue);
    if (!tab) return null;

    let totalPassed = 0, totalFailed = 0, totalPending = 0;

    tab.sections?.forEach((section: any) => {
      const stats = getSectionCheckStats(section);
      if (stats) {
        totalPassed += stats.passed;
        totalFailed += stats.failed;
        totalPending += stats.pending;
      }
    });

    const total = totalPassed + totalFailed + totalPending;
    if (total === 0) return null;

    return { total, passed: totalPassed, failed: totalFailed, pending: totalPending };
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

    // Use performanceSheet.data.data as fallback when formData is empty/incomplete
    // This ensures that tab visibility works correctly when the sheet is first loaded
    const dataForVisibility = formData && Object.keys(formData).length > 0
      ? formData
      : performanceSheet.data.data || {};

    const allowedTabs = getVisibleTabs(dataForVisibility);
    const allowedTabValues = new Set(allowedTabs.map(t => t.value));

    return performanceSheet.data.version.sections
      .filter((tab: any) => allowedTabValues.has(tab.value))
      .sort((a: any, b: any) => a.sequence - b.sequence)
      .map((tab: any) => {
        const stats = getTabCheckStats(tab.value);
        let badge = undefined;

        if (stats && stats.total > 0) {
          if (stats.failed > 0) {
            badge = { type: 'fail' as const, text: `${stats.failed} ✗` };
          } else if (stats.pending > 0) {
            badge = { type: 'partial' as const, text: `${stats.passed}/${stats.total}` };
          } else {
            badge = { type: 'pass' as const, text: '✓' };
          }
        }

        const allowedTab = allowedTabs.find(t => t.value === tab.value);
        const displayLabel = allowedTab?.dynamicLabel || tab.label;

        return {
          label: displayLabel,
          value: tab.value,
          badge,
        };
      });
  }, [
    performanceSheet,
    formData,
    formData?.feed?.feed?.application,
    formData?.common?.equipment?.feed?.lineType,
    formData?.feed?.feed?.pullThru?.isPullThru,
    formData?.common?.equipment?.feed?.typeOfLine,
    formData?.materialSpecs?.straightener?.selectRoll,
    formData?.rollStrBackbend?.straightener?.rolls?.typeOfRoll
  ]);

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
      console.log('Performance sheet data loaded:', data);
      console.log('Reference number from server:', data.referenceNumber);
      console.log('Data structure check - common:', data.common);
      console.log('Data structure check - common.equipment:', data.common?.equipment);
      console.log('Data structure check - common.equipment.straightener:', data.common?.equipment?.straightener);

      // Initialize STR fields with defaults if they don't have values
      const originalStrModel = getNestedValue(data, "common.equipment.straightener.model");
      const strModelValue = originalStrModel || DEFAULT_STR_MODEL;
      const strWidthValue = getNestedValue(data, "common.equipment.straightener.width");
      const strHorsepowerValue = getNestedValue(data, "strUtility.straightener.horsepower");

      // Set default STR model if not already set
      if (!originalStrModel) {
        console.log("Setting default STR model:", DEFAULT_STR_MODEL);

        // Ensure the nested structure exists
        if (!data.common) data.common = {};
        if (!data.common.equipment) data.common.equipment = {};
        if (!data.common.equipment.straightener) data.common.equipment.straightener = {};

        // Set the model directly
        data.common.equipment.straightener.model = DEFAULT_STR_MODEL;

        // Verify it was set correctly
        const verifyModel = getNestedValue(data, "common.equipment.straightener.model");
        console.log("Verification - STR model after setting:", verifyModel);
      } else {
        console.log("STR model already set:", originalStrModel);
      }      // Set default STR width if not already set
      if (!strWidthValue) {
        const defaultWidth = getDefaultStrWidthForModel(strModelValue);
        if (defaultWidth) {
          console.log("Setting default STR width:", defaultWidth);
          data.common.equipment.straightener.width = defaultWidth;
        }
      }

      // Set default STR horsepower if not already set
      if (!strHorsepowerValue) {
        const defaultHorsepower = getDefaultStrHorsepowerForModel(strModelValue);
        if (defaultHorsepower) {
          console.log("Setting default STR horsepower:", defaultHorsepower);
          // Ensure strUtility structure exists
          if (!data.strUtility) data.strUtility = {};
          if (!data.strUtility.straightener) data.strUtility.straightener = {};
          data.strUtility.straightener.horsepower = defaultHorsepower;
        }
      }

      // Initialize number of rolls from type of roll default value
      let typeOfRoll = getNestedValue(data, "materialSpecs.straightener.rolls.typeOfRoll");
      const existingNumberOfRolls = getNestedValue(data, "common.equipment.straightener.numberOfRolls");

      // If no type of roll is set, use the first option as default
      if (!typeOfRoll) {
        console.log("No typeOfRoll found, setting default to first option");
        // Ensure materialSpecs structure exists
        if (!data.materialSpecs) data.materialSpecs = {};
        if (!data.materialSpecs.straightener) data.materialSpecs.straightener = {};
        if (!data.materialSpecs.straightener.rolls) data.materialSpecs.straightener.rolls = {};

        // Set default to first roll type option
        typeOfRoll = "7 Roll Str. Backbend";
        data.materialSpecs.straightener.rolls.typeOfRoll = typeOfRoll;
        console.log("Set default typeOfRoll to:", typeOfRoll);
      }

      console.log("Initialization - typeOfRoll:", typeOfRoll);
      console.log("Initialization - existingNumberOfRolls:", existingNumberOfRolls);

      if (typeOfRoll && !existingNumberOfRolls) {
        const rollMatch = typeOfRoll.match(/(\d+)\s*Roll/i);
        if (rollMatch) {
          const numberOfRolls = rollMatch[1];
          console.log("Initialization - Setting numberOfRolls to:", numberOfRolls);
          data.common.equipment.straightener.numberOfRolls = parseFloat(numberOfRolls);
        }
      } setFormData(data);
      setOriginalData(data);

      // Force re-render to refresh dynamic options after initialization
      forceUpdate({});

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

  useEffect(() => {
    if (activeTab && visibleTabs.length > 0) {
      const isActiveTabVisible = visibleTabs.some((tab: any) => tab.value === activeTab);
      if (!isActiveTabVisible) {
        setActiveTab(visibleTabs[0].value);
      }
    }
  }, [activeTab, visibleTabs]);

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

  // Cleanup calculation timeout on unmount
  useEffect(() => {
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, []);

  // Force template refresh when formData changes (to update dependent options)
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      console.log("FormData changed - should trigger dependent field option updates");
    }
  }, [formData]);

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

  const getDynamicOptions = (fieldId: string, field: any) => {
    // Debug removed - STR fields are working correctly

    // Check for dependency-based options first
    if (field.dependsOn && field.dependencyType) {
      const dependentValue = getNestedValue(formData, field.dependsOn);

      // Debug STR dependencies
      if (fieldId.includes('straightener') && (field.dependencyType === 'strWidth' || field.dependencyType === 'strHorsepower')) {
        console.log(`STR Debug - fieldId: ${fieldId}, dependsOn: ${field.dependsOn}, dependentValue:`, dependentValue);
      }

      // Special handling for STR dependencies - use defaults when formData is uninitialized
      const shouldUseDefaults = !dependentValue && (field.dependencyType === 'strWidth' || field.dependencyType === 'strHorsepower' || field.dependencyType === 'strFeedRate');

      if (dependentValue || shouldUseDefaults) {
        switch (field.dependencyType) {
          case "reelWidth":
            return getReelWidthOptionsForModel(dependentValue);
          case "backplateDiameter":
            return getBackplateDiameterOptionsForModel(dependentValue);
          case "hydThreadingDrive":
            return getHydThreadingDriveOptionsForModel(dependentValue);
          case "holdDownAssy":
            return getHoldDownAssyOptionsForModel(dependentValue);
          case "cylinder":
            // Cylinder depends on both model and hold down assembly
            const reelModelValue = getNestedValue(formData, "common.equipment.reel.model");
            if (reelModelValue && dependentValue) {
              return getCylinderOptionsForHoldDownAssy(reelModelValue, dependentValue);
            }
            return [];
          case "strWidth":
            const strWidthModel = dependentValue || DEFAULT_STR_MODEL;
            console.log("STR Width - using model:", strWidthModel, "(dependentValue was:", dependentValue, ")");
            return getStrWidthOptionsForModel(strWidthModel);
          case "strHorsepower":
            const strHpModel = dependentValue || DEFAULT_STR_MODEL;
            console.log("STR Horsepower - using model:", strHpModel, "(dependentValue was:", dependentValue, ")");
            return getStrHorsepowerOptionsForModel(strHpModel);
          case "strFeedRate":
            // Feed rate depends on both horsepower (primary) and model (secondary)
            const secondaryDependentValue = field.secondaryDependsOn ? getNestedValue(formData, field.secondaryDependsOn) : null;
            const modelForFeedRate = secondaryDependentValue || DEFAULT_STR_MODEL;

            // Use default horsepower if none provided (during initialization)
            const horsepowerValue = dependentValue || getDefaultStrHorsepowerForModel(DEFAULT_STR_MODEL);

            console.log("=== STR FEED RATE DEBUG ===");
            console.log("fieldId:", fieldId);
            console.log("dependsOn:", field.dependsOn);
            console.log("original dependentValue (horsepower):", dependentValue);
            console.log("using horsepowerValue:", horsepowerValue);
            console.log("secondaryDependsOn:", field.secondaryDependsOn);
            console.log("secondaryDependentValue (model):", secondaryDependentValue);
            console.log("modelForFeedRate:", modelForFeedRate);
            console.log("shouldUseDefaults:", shouldUseDefaults);

            if (horsepowerValue) {
              const options = getStrFeedRateOptionsForModelAndHorsepower(modelForFeedRate, horsepowerValue);
              console.log("Feed rate options:", options);
              console.log("=== END STR FEED RATE DEBUG ===");
              return options;
            }
            console.log("No horsepower value available, returning empty array");
            console.log("=== END STR FEED RATE DEBUG ===");
            return [];
          case "feedMachineWidth":
            return getFeedMachineWidthOptionsForModel(dependentValue);
        }
      }

      // If dependency field has no value, handle STR fields specially
      if (field.dependencyType === 'strWidth' || field.dependencyType === 'strHorsepower') {
        const defaultModel = DEFAULT_STR_MODEL;

        if (field.dependencyType === 'strWidth') {
          return getStrWidthOptionsForModel(defaultModel);
        } else if (field.dependencyType === 'strHorsepower') {
          return getStrHorsepowerOptionsForModel(defaultModel);
        }
      }

      // If dependency field has no value, return empty array instead of all options for other fields
      return [];
    }

    // Legacy handling for fields not yet migrated to dependency system
    if (fieldId !== "common.equipment.feed.lineType" &&
      fieldId !== "feed.feed.pullThru.isPullThru" &&
      fieldId !== "common.equipment.reel.width" &&
      fieldId !== "common.equipment.reel.backplate.diameter" &&
      fieldId !== "common.equipment.straightener.width" &&
      fieldId !== "strUtility.straightener.horsepower" &&
      fieldId !== "strUtility.straightener.feedRate" &&
      fieldId !== "feed.feed.machineWidth") {
      return field.options || [];
    }

    const applicationValue = getNestedValue(formData, "feed.feed.application");
    const lineTypeValue = getNestedValue(formData, "common.equipment.feed.lineType");
    const reelModelValue = getNestedValue(formData, "common.equipment.reel.model");
    const strModelValue = getNestedValue(formData, "common.equipment.straightener.model");
    const strHorsepowerValue = getNestedValue(formData, "strUtility.straightener.horsepower");
    const feedModelValue = getNestedValue(formData, "common.equipment.feed.model");

    // Dynamic Reel Width Options based on selected model
    if (fieldId === "common.equipment.reel.width") {
      if (reelModelValue) {
        return getReelWidthOptionsForModel(reelModelValue);
      }
      return field.options || [];
    }

    // Dynamic Backplate Diameter Options based on selected model
    if (fieldId === "common.equipment.reel.backplate.diameter") {
      if (reelModelValue) {
        return getBackplateDiameterOptionsForModel(reelModelValue);
      }
      return field.options || [];
    }

    // Dynamic STR Width Options based on selected model
    if (fieldId === "common.equipment.straightener.width") {
      console.log('=== STR WIDTH DEBUG ===');
      console.log('formData.common.equipment:', formData.common?.equipment);
      console.log('formData.common.equipment.straightener:', formData.common?.equipment?.straightener);
      const currentStrModel = getNestedValue(formData, "common.equipment.straightener.model");
      const modelToUse = currentStrModel || DEFAULT_STR_MODEL;
      console.log('currentStrModel:', currentStrModel, 'DEFAULT_STR_MODEL:', DEFAULT_STR_MODEL, 'modelToUse:', modelToUse);
      const options = getStrWidthOptionsForModel(modelToUse);
      console.log('STR Width options result:', options);
      console.log('=== END STR WIDTH DEBUG ===');
      return options;
    }

    // Dynamic STR Horsepower Options based on selected model
    if (fieldId === "strUtility.straightener.horsepower") {
      console.log('=== STR HP DEBUG ===');
      console.log('formData.common.equipment:', formData.common?.equipment);
      console.log('formData.common.equipment.straightener:', formData.common?.equipment?.straightener);
      const currentStrModel = getNestedValue(formData, "common.equipment.straightener.model");
      const modelToUse = currentStrModel || DEFAULT_STR_MODEL;
      console.log('currentStrModel:', currentStrModel, 'DEFAULT_STR_MODEL:', DEFAULT_STR_MODEL, 'modelToUse:', modelToUse);
      const options = getStrHorsepowerOptionsForModel(modelToUse);
      console.log('STR HP options result:', options);
      console.log('=== END STR HP DEBUG ===');
      return options;
    }

    // Dynamic STR Feed Rate Options based on selected model and horsepower
    if (fieldId === "strUtility.straightener.feedRate") {
      const modelToUse = strModelValue || DEFAULT_STR_MODEL;
      if (strHorsepowerValue) {
        return getStrFeedRateOptionsForModelAndHorsepower(modelToUse, strHorsepowerValue);
      }
      // If horsepower is missing, show no options
      return [];
    }

    // Dynamic Feed Machine Width Options based on selected model
    if (fieldId === "feed.feed.machineWidth") {
      if (feedModelValue) {
        return getFeedMachineWidthOptionsForModel(feedModelValue);
      }
      return field.options || [];
    }

    // Dynamic Line Type Options
    if (fieldId === "common.equipment.feed.lineType") {
      if (applicationValue === "Standalone") {
        // Use standalone options when application is Standalone
        return [
          { value: "Feed", label: "Feed" },
          { value: "Straightener", label: "Straightener" },
          { value: "Reel-Motorized", label: "Reel-Motorized" },
          { value: "Reel-Pull Off", label: "Reel-Pull Off" },
          { value: "Straightener-Reel Combination", label: "Straightener-Reel Combination" },
          { value: "Other", label: "Other" },
          { value: "Feed-Shear", label: "Feed-Shear" },
          { value: "Threading Table", label: "Threading Table" },
        ];
      } else if (applicationValue === "Press Feed" || applicationValue === "Cut to Length") {
        // Use conventional/compact options for Press Feed and Cut to Length
        return [
          { value: "Conventional", label: "Conventional" },
          { value: "Compact", label: "Compact" },
        ];
      }
      return field.options || [];
    }

    // Dynamic Pull Through Options
    if (fieldId === "feed.feed.pullThru.isPullThru") {
      if (applicationValue === "Press Feed" || applicationValue === "Cut to Length") {
        // For Press Feed and Cut to Length
        if (lineTypeValue === "Compact") {
          return [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ];
        } else if (lineTypeValue === "Conventional") {
          return [
            { value: "no", label: "No" },
          ];
        }
      } else if (applicationValue === "Standalone") {
        // For Standalone, only show Yes/No for specific line types
        if (lineTypeValue === "Feed" || lineTypeValue === "Feed-Shear" || lineTypeValue === "Other") {
          return [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ];
        } else {
          // For other standalone line types, no pull through options
          return [];
        }
      }
      return field.options || [];
    }

    return field.options || [];
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    console.log("=== FIELD CHANGE DEBUG ===");
    console.log("Field changed:", fieldId, "→", value);

    let updatedData = setNestedValue(formData, fieldId, value);

    // Log critical zero values after field change
    if (fieldId.includes('material') || fieldId.includes('coil') || fieldId.includes('reel') || fieldId.includes('tddbhd') || fieldId.includes('horsepower') || fieldId.includes('pressure')) {
      console.log("=== CRITICAL ZERO VALUE CHECK ===");
      console.log("Air Pressure Available:", getNestedValue(updatedData, "tddbhd.reel.airPressureAvailable"));
      console.log("Cylinder Pressure:", getNestedValue(updatedData, "tddbhd.reel.holddown.cylinderPressure"));
      console.log("Material Thickness:", getNestedValue(updatedData, "common.material.materialThickness"));
      console.log("Coil Width:", getNestedValue(updatedData, "common.material.coilWidth"));
      console.log("Coil ID:", getNestedValue(updatedData, "common.coil.coilID"));
      console.log("Coil Weight:", getNestedValue(updatedData, "tddbhd.coil.coilWeight"));
      console.log("STR HP:", getNestedValue(updatedData, "strUtility.straightener.horsepower"));
      console.log("Reel Width:", getNestedValue(updatedData, "common.equipment.reel.width"));
      console.log("Reel Horsepower:", getNestedValue(updatedData, "common.equipment.reel.horsepower"));
      console.log("Max Yield Strength:", getNestedValue(updatedData, "common.material.maxYieldStrength"));
      console.log("Max Coil OD:", getNestedValue(updatedData, "common.coil.maxCoilOD"));
      console.log("Decel Rate:", getNestedValue(updatedData, "tddbhd.reel.requiredDecelRate"));
      console.log("Coefficient of Friction:", getNestedValue(updatedData, "tddbhd.reel.coefficientOfFriction"));
      console.log("=== END ZERO VALUE CHECK ===");
    }

    // Handle dependent field logic when application changes
    if (fieldId === "feed.feed.application") {
      const currentLineType = getNestedValue(updatedData, "common.equipment.feed.lineType");
      const currentPullThru = getNestedValue(updatedData, "feed.feed.pullThru.isPullThru");

      // Clear line type if it's not valid for the new application
      if (value === "Standalone") {
        // For Standalone, check if current line type is valid
        const validStandaloneTypes = ["Feed", "Straightener", "Reel-Motorized", "Reel-Pull Off", "Straightener-Reel Combination", "Other", "Feed-Shear", "Threading Table"];
        if (currentLineType && !validStandaloneTypes.includes(currentLineType)) {
          updatedData = setNestedValue(updatedData, "common.equipment.feed.lineType", "");
        }
      } else if (value === "Press Feed" || value === "Cut to Length") {
        // For Press Feed/Cut to Length, check if current line type is valid
        const validConventionalTypes = ["Conventional", "Compact"];
        if (currentLineType && !validConventionalTypes.includes(currentLineType)) {
          updatedData = setNestedValue(updatedData, "common.equipment.feed.lineType", "");
        }
      }

      // Clear pull through if it's not valid for the new application/line type combination
      if (currentPullThru) {
        // This will be validated in the next field change when line type is processed
        updatedData = setNestedValue(updatedData, "feed.feed.pullThru.isPullThru", "no");
      }
    }

    // Handle dependent field logic when line type changes
    if (fieldId === "common.equipment.feed.lineType") {
      const applicationValue = getNestedValue(updatedData, "feed.feed.application");
      const currentPullThru = getNestedValue(updatedData, "feed.feed.pullThru.isPullThru");

      if (currentPullThru) {
        let shouldClearPullThru = false;

        if (applicationValue === "Press Feed" || applicationValue === "Cut to Length") {
          // For Press Feed/Cut to Length with Conventional, only "no" is allowed
          if (value === "Conventional" && currentPullThru === "yes") {
            shouldClearPullThru = true;
          }
        } else if (applicationValue === "Standalone") {
          // For Standalone, only specific line types allow pull through
          const allowedPullThruTypes = ["Feed", "Feed-Shear", "Other"];
          if (!allowedPullThruTypes.includes(value)) {
            shouldClearPullThru = true;
          }
        }

        if (shouldClearPullThru) {
          // For standalone types that don't support pull through, clear the field
          if (applicationValue === "Standalone") {
            const allowedPullThruTypes = ["Feed", "Feed-Shear", "Other"];
            if (!allowedPullThruTypes.includes(value)) {
              updatedData = setNestedValue(updatedData, "feed.feed.pullThru.isPullThru", "");
            } else {
              updatedData = setNestedValue(updatedData, "feed.feed.pullThru.isPullThru", "no");
            }
          } else {
            // For Press Feed/Cut to Length with Conventional, set to "no"
            updatedData = setNestedValue(updatedData, "feed.feed.pullThru.isPullThru", "no");
          }
        }
      }
    }

    // Handle dependent field logic when reel model changes
    if (fieldId === "common.equipment.reel.model") {
      const currentWidth = getNestedValue(updatedData, "common.equipment.reel.width");
      const currentBackplate = getNestedValue(updatedData, "common.equipment.reel.backplate.diameter");
      const currentHydDrive = getNestedValue(updatedData, "tddbhd.reel.threadingDrive.hydThreadingDrive");
      const currentHoldDown = getNestedValue(updatedData, "tddbhd.reel.holddown.assy");
      const currentCylinder = getNestedValue(updatedData, "tddbhd.reel.holddown.cylinder");

      // Clear width if it's not valid for the new model
      if (currentWidth && value) {
        const validWidths = getReelWidthOptionsForModel(value).map(option => option.value);
        if (!validWidths.includes(currentWidth)) {
          updatedData = setNestedValue(updatedData, "common.equipment.reel.width", "");
        }
      }

      // Clear backplate diameter if it's not valid for the new model
      if (currentBackplate && value) {
        const validBackplates = getBackplateDiameterOptionsForModel(value).map(option => option.value);
        if (!validBackplates.includes(currentBackplate)) {
          updatedData = setNestedValue(updatedData, "common.equipment.reel.backplate.diameter", "");
        }
      }

      // Clear hydraulic threading drive if it's not valid for the new model
      if (currentHydDrive && value) {
        const validHydDrives = getHydThreadingDriveOptionsForModel(value).map(option => option.value);
        if (!validHydDrives.includes(currentHydDrive)) {
          updatedData = setNestedValue(updatedData, "tddbhd.reel.threadingDrive.hydThreadingDrive", "");
        }
      }

      // Clear hold down assembly if it's not valid for the new model
      if (currentHoldDown && value) {
        const validHoldDowns = getHoldDownAssyOptionsForModel(value).map(option => option.value);
        if (!validHoldDowns.includes(currentHoldDown)) {
          updatedData = setNestedValue(updatedData, "tddbhd.reel.holddown.assy", "");
          // Also clear cylinder since hold down changed
          updatedData = setNestedValue(updatedData, "tddbhd.reel.holddown.cylinder", "");
        } else {
          // Check if current cylinder is still valid for the existing hold down
          if (currentCylinder && value) {
            const validCylinders = getCylinderOptionsForHoldDownAssy(value, currentHoldDown).map(option => option.value);
            if (!validCylinders.includes(currentCylinder)) {
              updatedData = setNestedValue(updatedData, "tddbhd.reel.holddown.cylinder", "");
            }
          }
        }
      }
    }

    // Handle dependent field logic when hold down assembly changes
    if (fieldId === "tddbhd.reel.holddown.assy") {
      const currentCylinder = getNestedValue(updatedData, "tddbhd.reel.holddown.cylinder");
      const reelModelValue = getNestedValue(updatedData, "common.equipment.reel.model");

      if (value && reelModelValue) {
        // Get valid cylinders for the new hold down assembly
        const validCylinders = getCylinderOptionsForHoldDownAssy(reelModelValue, value).map(option => option.value);

        // If current cylinder is not valid for new assembly, auto-select the default
        if (!currentCylinder || !validCylinders.includes(currentCylinder)) {
          const defaultCylinder = getDefaultCylinderForHoldDownAssy(reelModelValue, value);
          updatedData = setNestedValue(updatedData, "tddbhd.reel.holddown.cylinder", defaultCylinder || "");
        }
      } else {
        // Clear cylinder if no valid hold down assembly or reel model
        updatedData = setNestedValue(updatedData, "tddbhd.reel.holddown.cylinder", "");
      }
    }

    // Handle dependent field logic when STR model changes
    if (fieldId === "common.equipment.straightener.model") {
      const currentStrWidth = getNestedValue(updatedData, "common.equipment.straightener.width");
      const currentStrHorsepower = getNestedValue(updatedData, "strUtility.straightener.horsepower");
      const currentStrFeedRate = getNestedValue(updatedData, "strUtility.straightener.feedRate");

      // Clear width if it's not valid for the new model
      if (currentStrWidth && value) {
        const validWidths = getStrWidthOptionsForModel(value).map(option => option.value);
        if (!validWidths.includes(currentStrWidth)) {
          updatedData = setNestedValue(updatedData, "common.equipment.straightener.width", "");
        }
      }

      // Clear horsepower if it's not valid for the new model
      if (currentStrHorsepower && value) {
        const validHorsepowers = getStrHorsepowerOptionsForModel(value).map(option => option.value);
        if (!validHorsepowers.includes(currentStrHorsepower)) {
          updatedData = setNestedValue(updatedData, "strUtility.straightener.horsepower", "");
          // Also clear feed rate since horsepower changed
          updatedData = setNestedValue(updatedData, "strUtility.straightener.feedRate", "");
        } else {
          // Check if current feed rate is still valid for the new model and existing horsepower
          if (currentStrFeedRate) {
            const validFeedRates = getStrFeedRateOptionsForModelAndHorsepower(value, currentStrHorsepower).map(option => option.value);
            if (!validFeedRates.includes(currentStrFeedRate)) {
              updatedData = setNestedValue(updatedData, "strUtility.straightener.feedRate", "");
            }
          }
        }
      } else if (currentStrFeedRate) {
        // Clear feed rate if no horsepower is selected
        updatedData = setNestedValue(updatedData, "strUtility.straightener.feedRate", "");
      }
    }

    // Handle type of roll changes - auto-set number of rolls
    if (fieldId === "materialSpecs.straightener.rolls.typeOfRoll") {
      console.log("=== TYPE OF ROLL CHANGE DEBUG ===");
      console.log("Field ID:", fieldId);
      console.log("New value:", value);

      let numberOfRolls = "";

      // Use regex to extract number from any format like "7 Roll Str Backbend" or "7 Roll Str. Backbend"
      if (value && typeof value === 'string') {
        const rollMatch = value.match(/(\d+)\s*Roll/i);
        if (rollMatch) {
          numberOfRolls = rollMatch[1];
          console.log("Extracted numberOfRolls from regex:", numberOfRolls);
        } else {
          console.log("No number found in type of roll value:", value);
        }
      }

      console.log("Final numberOfRolls to set:", numberOfRolls);

      if (numberOfRolls) {
        console.log("Setting numberOfRolls to:", numberOfRolls);
        updatedData = setNestedValue(updatedData, "common.equipment.straightener.numberOfRolls", parseFloat(numberOfRolls));
        console.log("Updated data after setting numberOfRolls:", getNestedValue(updatedData, "common.equipment.straightener.numberOfRolls"));
      }

      console.log("=== END TYPE OF ROLL CHANGE DEBUG ===");
    }

    // Handle max coil weight changes - auto-populate STR utility coil weight capacity
    if (fieldId === "common.coil.maxCoilWeight") {
      if (value) {
        updatedData = setNestedValue(updatedData, "strUtility.coil.maxCoilWeight", value);
      }
    }

    // Handle dependent field logic when STR horsepower changes
    if (fieldId === "strUtility.straightener.horsepower") {
      const currentStrFeedRate = getNestedValue(updatedData, "strUtility.straightener.feedRate");
      const strModel = getNestedValue(updatedData, "common.equipment.straightener.model");

      // Clear feed rate if it's not valid for the new horsepower
      if (currentStrFeedRate && value && strModel) {
        const validFeedRates = getStrFeedRateOptionsForModelAndHorsepower(strModel, value).map(option => option.value);
        if (!validFeedRates.includes(currentStrFeedRate)) {
          updatedData = setNestedValue(updatedData, "strUtility.straightener.feedRate", "");
        }
      }
    }

    // Handle dependent field logic when Feed model changes
    if (fieldId === "common.equipment.feed.model") {
      const currentMachineWidth = getNestedValue(updatedData, "feed.feed.machineWidth");

      // Clear machine width if it's not valid for the new model
      if (currentMachineWidth && value) {
        const validWidths = getFeedMachineWidthOptionsForModel(value).map(option => option.value);
        if (!validWidths.includes(currentMachineWidth)) {
          updatedData = setNestedValue(updatedData, "feed.feed.machineWidth", "");
        }
      }
    }

    setFormData(updatedData);

    // Trigger debounced calculation
    debouncedCalculate(updatedData);
  };

  const bundleFormDataByTabsAndSections = (data: Record<string, any>) => {
    const bundled: Record<string, any> = {};

    if (!performanceSheet?.data?.version?.sections) return data;

    performanceSheet.data.version.sections.forEach((tab: any) => {
      tab.sections?.forEach((section: any) => {
        section.fields?.forEach((field: any) => {
          const fieldValue = getNestedValue(data, field.id);
          if (fieldValue !== undefined && fieldValue !== null && fieldValue !== "") {
            const keys = field.id.split(".");
            let current = bundled;

            for (let i = 0; i < keys.length - 1; i++) {
              if (!current[keys[i]]) {
                current[keys[i]] = {};
              }
              current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = fieldValue;
          }
        });
      });
    });

    return bundled;
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

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleEdit = () => {
    // Simply enable editing mode without complex socket-based locking
    setIsEditing(true);
    setIsLocked(true);
    setLockInfo({ userId: user?.id, userName: user?.name || user?.email });
    toast.success("Edit mode enabled.");
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
    setIsEditing(false);
    setIsLocked(false);
    setLockInfo(null);
    setModalType(null);
    clearLocalStorage();
    toast.info("Edit cancelled.");

    if (lockExtendIntervalRef.current) {
      clearInterval(lockExtendIntervalRef.current);
      lockExtendIntervalRef.current = null;
    }
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

      setIsEditing(false);
      setIsLocked(false);
      setLockInfo(null);
      setModalType(null);
      setOriginalData(formData);
      clearLocalStorage();
      toast.success("Changes saved successfully.");

      if (lockExtendIntervalRef.current) {
        clearInterval(lockExtendIntervalRef.current);
        lockExtendIntervalRef.current = null;
      }
    } catch (error) {
      console.error("Failed to save performance sheet:", error);
      toast.error("Failed to save performance sheet.");
      setModalType(null);
    }
  };

  const renderField = (field: any) => {
    const value = getNestedValue(formData, field.id) ?? "";

    // Debug logging for reference number field
    if (field.id === "referenceNumber") {
      console.log('Rendering reference number field:');
      console.log('- Field ID:', field.id);
      console.log('- Current formData:', formData);
      console.log('- Retrieved value:', value);
      console.log('- getNestedValue result:', getNestedValue(formData, field.id));
    }

    const isFilled = isFieldFilled(value, field.type);
    const isCheck = isCheckField(field.id);
    const checkStatus = isCheck ? getCheckStatus(value) : null;

    const requiredBgClassName = field.required && isEditing && !isCheck
      ? (isFilled ? 'bg-success-light' : 'bg-error-light')
      : '';

    const checkBorderClassName = isCheck && checkStatus !== 'pending'
      ? (checkStatus === 'pass' ? 'border-l-4 border-l-success' : 'border-l-4 border-l-error')
      : '';

    const checkIconPrefix = isCheck && checkStatus !== 'pending'
      ? (checkStatus === 'pass' ? '✓ ' : '✗ ')
      : '';

    const commonProps = {
      id: field.id,
      name: field.id,
      label: field.label,
      required: field.required || false,
      disabled: !isEditing || isCheck,
      readOnly: field.readOnly || false,
      autoComplete: "off",
      requiredBgClassName,
      checkBorderClassName,
      checkIconPrefix,
    };

    const getSizeClass = () => {
      const span = field.size || 1;
      if (span >= 4) return "col-span-full";
      return `col-span-${span}`;
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
          const dynamicOptions = getDynamicOptions(field.id, field);
          return (
            <Select
              {...commonProps}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              options={dynamicOptions}
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
        <Button variant="secondary" onClick={handleEdit}>
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
  }

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
    <div className="w-full flex-1 flex flex-col overflow-hidden">
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

      <div className="flex-1 overflow-auto">
        <div className="flex justify-center w-full">
          <div className="p-8 max-w-4xl w-full">
            {activeTabData?.sections?.map((section: any, index: number) => {
              const isCollapsed = collapsedSections.has(section.id);
              const totalFields = section.fields?.length || 0;
              const filledFields = section.fields?.filter((field: any) => {
                const value = getNestedValue(formData, field.id);
                return value !== null && value !== undefined && value !== "";
              }).length || 0;
              const isLastSection = index === activeTabData.sections.length - 1;

              return (
                <div key={section.id} className={`pb-8 ${!isLastSection ? 'mb-8 border-b border-border' : ''}`}>
                  <div className={`flex items-center justify-between ${!isCollapsed ? 'mb-4' : ''}`}>
                    <h2 className="text-lg font-semibold text-text">{section.title}</h2>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${filledFields === totalFields ? 'text-success' : 'text-error'}`}>
                        {filledFields}/{totalFields}
                      </span>
                      {(() => {
                        const checkStats = getSectionCheckStats(section);
                        if (!checkStats) return null;

                        return (
                          <span className={`text-xs px-2 py-0.5 rounded font-medium border ${checkStats.failed > 0
                            ? 'bg-error/10 text-error border-error/30'
                            : checkStats.pending > 0
                              ? 'bg-warning/10 text-warning border-warning/30'
                              : 'bg-success/10 text-success border-success/30'
                            }`}>
                            {checkStats.failed > 0 ? `${checkStats.failed} ✗` :
                              checkStats.pending > 0 ? `${checkStats.passed}/${checkStats.total} ✓` :
                                `${checkStats.total} ✓`}
                          </span>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="text-text-muted hover:text-text transition-all cursor-pointer"
                      >
                        <ChevronDown
                          size={20}
                          className={`transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
                        />
                      </button>
                    </div>
                  </div>
                  {!isCollapsed && (
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
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        isOpen={modalType !== null}
        onClose={modalType === 'continue' ? () => { } : closeModal}
        title={getModalConfig().title}
        size={getModalConfig().size}
        overflow={getModalConfig().overflow}>
        {renderModalContent()}
      </Modal>
    </div>
  );
};

export default PerformanceSheet;