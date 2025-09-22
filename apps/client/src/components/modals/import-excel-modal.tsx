import { useState, useCallback } from "react";
import { Modal, Button } from "@/components";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, ExternalLink, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as XLSX from 'xlsx';
import { useApi } from "@/hooks/use-api";

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedData: any) => void;
  availableRsms: string[];
}

interface ColumnMapping {
  field: string;
  label: string;
  columnIndex: number;
  enabled: boolean;
  required?: boolean;
}

interface ExcelRow {
  rsm: string;
  dealer: string;
  contactName: string;
  contactEmail: string;
  targetAccount: string;
  city: string;
  state: string;
  country: string;
  leadSource: string;
  mobile: string;
  office: string;
  journeyStep: string;
}

interface ImportResult {
  success: boolean;
  addressesCreated: number;
  contactsCreated: number;
  journeysCreated: number;
  errors: string[];
  createdJourneys: Array<{
    id: string;
    name: string;
    targetAccount: string;
    rsm: string;
    stage: string;
  }>;
}

export const ImportExcelModal = ({
  isOpen,
  onClose,
  onSuccess,
}: ImportExcelModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<ExcelRow[]>([]);
  const [rawData, setRawData] = useState<any[][]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'processing' | 'complete'>('upload');
  const [progress, setProgress] = useState({ 
    current: 0, 
    total: 0, 
    stage: 'Starting...',
    stageProgress: 0,
    stageTotal: 0
  });

  const { post, get } = useApi();

  // Sortable field card component
  const SortableFieldCard = ({ mapping, index }: { mapping: ColumnMapping; index: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: mapping.field });

    return (
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        className={`min-w-[200px] p-3 rounded border transition-all ${
          isDragging 
            ? 'opacity-50 z-50' 
            : 'bg-surface border-border hover:shadow-md cursor-grab active:cursor-grabbing'
        }`}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-text-muted" />
          <div className="flex-1">
            <div className="text-sm font-medium text-text">
              {mapping.label}
              {mapping.required && <span className="text-error ml-1">*</span>}
            </div>
            <div className="text-xs text-text-muted">
              Excel Column {index + 1}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Drag preview component
  const DragPreview = ({ mapping, index }: { mapping: ColumnMapping; index: number }) => (
    <div className="min-w-[200px] p-3 rounded border bg-white dark:bg-gray-800 border-border shadow-lg opacity-90 transform rotate-1">
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-gray-400" />
        <div className="flex-1">
          <div className="text-sm font-medium text-text">
            {mapping.label}
            {mapping.required && <span className="text-red-500 ml-1">*</span>}
          </div>
          <div className="text-xs text-text-muted">
            Excel Column {index + 1}
          </div>
        </div>
      </div>
    </div>
  );

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Default column mapping based on standard import order
  const getDefaultColumnMappings = (): ColumnMapping[] => [
    { field: 'rsm', label: 'RSM', columnIndex: 0, enabled: true },
    { field: 'dealer', label: 'Dealer', columnIndex: 1, enabled: true },
    { field: 'contactName', label: 'Contact Name', columnIndex: 2, enabled: true },
    { field: 'contactEmail', label: 'Contact Email', columnIndex: 3, enabled: true },
    { field: 'targetAccount', label: 'Target Account', columnIndex: 4, enabled: true, required: true },
    { field: 'city', label: 'City', columnIndex: 5, enabled: true },
    { field: 'state', label: 'State/Province', columnIndex: 6, enabled: true },
    { field: 'country', label: 'Country', columnIndex: 7, enabled: true },
    { field: 'leadSource', label: 'Lead Source', columnIndex: 8, enabled: true },
    { field: 'mobile', label: 'Mobile #', columnIndex: 9, enabled: true },
    { field: 'office', label: 'Office #', columnIndex: 10, enabled: true },
    { field: 'journeyStep', label: 'Journey Step', columnIndex: 11, enabled: true },
  ];

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      parseExcelFile(uploadedFile);
    }
  }, []);

  const parseExcelFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Use defval option to fill empty cells with empty strings
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: '',  // This ensures empty cells become empty strings instead of being omitted
          raw: false   // This ensures all values are strings
        }) as any[][];

        // Determine if first row is header
        const firstRow = jsonData[0] || [];
        const hasHeader = firstRow.some((cell: any) => 
          typeof cell === 'string' && (
            cell.toLowerCase().includes('rsm') ||
            cell.toLowerCase().includes('dealer') ||
            cell.toLowerCase().includes('contact') ||
            cell.toLowerCase().includes('target')
          )
        );

        // Skip header row if it exists
        const dataRows = hasHeader ? jsonData.slice(1) : jsonData;
        
        // Filter out completely empty rows - rows where all cells are empty
        const filteredRows = dataRows.filter(row => row && row.some(cell => cell && String(cell).trim()));
        
        // Store filtered data for mapping
        setRawData(filteredRows);
        
        // Initialize column mappings with default values
        setColumnMappings(getDefaultColumnMappings());
        
        setStep('mapping');
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('Error parsing Excel file. Please check the format and try again.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const getLeadSource = (leadSource: string): string => {
    const normalized = leadSource.toLowerCase().trim();
    
    switch (normalized) {
      case 'dealer lead':
        return 'Dealer Lead';
      case 'phone in - existing customer':
        return 'Phone In - Existing Customer';
      case 'coe website (contact form)':
        return 'Coe Website (contact form)';
      case 'cold call - new customer':
        return 'Cold Call - New Customer';
      case 'coe website (email inquiry)':
        return 'Coe Website (Email Inquiry)';
      case 'email - existing customer':
        return 'Email - Existing Customer';
      case 'topspot':
        return 'TopSpot';
      case 'oem lead':
        return 'OEM Lead';
      case 'coe service':
        return 'Coe Service';
      case 'email - new customer':
        return 'Email - New Customer';
      case 'phone in - new customer':
        return 'Phone In - New Customer';
      case 'event - fabtech':
      case 'fabtech':
        return 'Event - Fabtech';
      case 'cold call - prior customer':
        return 'Cold Call - Prior Customer';
      case 'cold call - existing customer':
        return 'Cold Call - Existing Customer';
      case 'customer visit (prior customer)':
        return 'Customer Visit (prior customer)';
      case 'customer visit (current customer)':
        return 'Customer Visit (current customer)';
      case 'email - dealer':
        return 'Email - Dealer';
      case 'event - natm':
      case 'natm':
        return 'Event - NATM';
      case 'event - pma':
      case 'pma':
        return 'Event - PMA';
      case 'phone in - dealer':
        return 'Phone In - Dealer';
      default:
        return 'Other';
    }
  };

  const normalizeCountry = (country: string): string => {
    const normalized = country.toLowerCase().trim();
    if (normalized === 'usa' || normalized === 'us') return 'USA';
    if (normalized === 'canada' || normalized === 'ca') return 'Canada';
    if (normalized === 'mexico' || normalized === 'mx') return 'Mexico';
    return 'other';
  };

  const validateRsm = (rsmInput: string): string => {
    const allowedRsms = [
      'AFK', 'ARC', 'BBS', 'GLS', 'GPI', 'JJD', 
      'JMK', 'KLC', 'MAV', 'NJH', 'RRA', 'RWH', 
      'TAT', 'TCS', 'TLS', 'TWB'
    ];
    
    const trimmed = rsmInput.trim();
    
    // Check for exact match first
    if (allowedRsms.includes(trimmed.toUpperCase())) {
      return trimmed.toUpperCase();
    }
    
    // Try to extract initials and match
    const words = trimmed.split(/\s+/);
    if (words.length >= 2) {
      const initials = words.map(word => word.charAt(0).toUpperCase()).join('');
      if (allowedRsms.includes(initials)) {
        return initials;
      }
    }
    
    // No match found, return empty string
    return '';
  };

  const toggleColumnEnabled = (field: string) => {
    setColumnMappings(prev => prev.map(mapping => 
      mapping.field === field 
        ? { ...mapping, enabled: !mapping.enabled }
        : mapping
    ));
  };

  const handleDragStart = ({ active }: any) => {
    setActiveFieldId(active.id);
  };

  const handleDragEnd = ({ active, over }: any) => {
    setActiveFieldId(null);
    
    if (active.id !== over?.id) {
      const enabledMappings = columnMappings
        .filter(m => m.enabled)
        .sort((a, b) => a.columnIndex - b.columnIndex);
      
      const oldIndex = enabledMappings.findIndex(m => m.field === active.id);
      const newIndex = enabledMappings.findIndex(m => m.field === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedMappings = arrayMove(enabledMappings, oldIndex, newIndex);
        
        // Update column indices based on new order
        const updatedMappings = columnMappings.map(mapping => {
          if (mapping.enabled) {
            const newIndex = reorderedMappings.findIndex(m => m.field === mapping.field);
            return { ...mapping, columnIndex: newIndex };
          }
          return mapping;
        });
        
        setColumnMappings(updatedMappings);
      }
    }
  };

  const generatePreviewFromMapping = useCallback(() => {
    if (rawData.length === 0) return;

    // Get enabled fields in their current arrangement order
    const enabledFields = columnMappings
      .filter(m => m.enabled)
      .sort((a, b) => a.columnIndex - b.columnIndex);

    console.log('Enabled fields in order:', enabledFields.map(f => ({ field: f.field, label: f.label, columnIndex: f.columnIndex })));
    console.log('Sample raw data row:', rawData[0]);

    const mappedData: ExcelRow[] = rawData
      .map((row: any[]) => {
        const mappedRow: any = {};
        
        // Map each field to its corresponding Excel column position
        // The fields are arranged in order, so field at index 0 gets Excel column 0, etc.
        enabledFields.forEach((mapping, excelColumnIndex) => {
          const value = excelColumnIndex < row.length ? String(row[excelColumnIndex] || '').trim() : '';
          mappedRow[mapping.field] = value;
          
          // Debug log for first row
          if (rawData.indexOf(row) === 0) {
            console.log(`Mapping Excel column ${excelColumnIndex} (value: "${value}") to field ${mapping.field} (${mapping.label})`);
          }
        });
        
        // Fill in disabled fields with empty values
        columnMappings.forEach(mapping => {
          if (!mapping.enabled) {
            mappedRow[mapping.field] = '';
          }
        });
        
        return mappedRow as ExcelRow;
      })
      .filter(row => {
        // Only include rows where required fields have values
        const requiredMappings = columnMappings.filter(m => m.required && m.enabled);
        return requiredMappings.every(mapping => row[mapping.field as keyof ExcelRow]);
      });

    console.log('Generated preview data (first row):', mappedData[0]);
    setPreview(mappedData);
    setStep('preview');
  }, [rawData, columnMappings]);

  const processImport = useCallback(async () => {
    setIsProcessing(true);
    setStep('processing');
    
    const result: ImportResult = {
      success: true,
      addressesCreated: 0,
      contactsCreated: 0,
      journeysCreated: 0,
      errors: [],
      createdJourneys: []
    };

    try {
      // Process in batches for better performance
      const BATCH_SIZE = 5; // Process 5 rows concurrently
      const batches = [];
      for (let i = 0; i < preview.length; i += BATCH_SIZE) {
        batches.push(preview.slice(i, i + BATCH_SIZE));
      }

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        // Update overall progress
        const currentRow = batchIndex * BATCH_SIZE;
        setProgress({ 
          current: currentRow, 
          total: preview.length,
          stage: `Processing batch ${batchIndex + 1} of ${batches.length}`,
          stageProgress: 0,
          stageTotal: batch.length * 4 // 4 stages per row: company, address, journey, contact
        });
        
        // Process batch concurrently
        await Promise.all(batch.map(async (row, rowIndex) => {
        try {
          let companyId: number | undefined;
          let addressId: number | undefined;
          
          // Stage 1: Find or create company
          const updateStageProgress = (stage: string, stageIndex: number) => {
            setProgress(prev => ({ 
              ...prev,
              stage: `${stage} (${row.targetAccount})`,
              stageProgress: (rowIndex * 4) + stageIndex,
              stageTotal: batch.length * 4
            }));
          };

          updateStageProgress('Finding/Creating Company', 1);
          
          if (row.targetAccount) {
            try {
              // Check if company with this CustDlrName already exists
              // Try the filter/custom endpoint pattern used elsewhere
              const existingCompanies = await get('/legacy/base/Company/filter/custom', {
                filterField: 'CustDlrName',
                filterValue: row.targetAccount,
                limit: 1
              });
              
              if (existingCompanies && Array.isArray(existingCompanies) && existingCompanies.length > 0) {
                // Use the existing company (most recent if multiple)
                const existingCompany = existingCompanies[0];
                companyId = existingCompany.Company_ID;
              } else {
                result.errors.push(`Company not found for ${row.targetAccount} - skipping row`);
                return;
              }
            } catch (companyError) {
              result.errors.push(`Failed to find company for ${row.targetAccount}: ${companyError}`);
              return;
            }
          }

          // Stage 2: Find or create address
          updateStageProgress('Finding/Creating Address', 2);
          
          if (companyId && (row.city || row.state || row.country)) {
            try {
              // Check if address already exists for this company with same city, state, country
              const normalizedCountry = normalizeCountry(row.country) || 'USA';
              const existingAddresses = await get('/legacy/std/Address/filter/custom', {
                filterField: 'Company_ID',
                filterValue: companyId,
                limit: 100 // Get all addresses for this company to check city/state/country
              });
              
              let existingAddress = null;
              if (existingAddresses && Array.isArray(existingAddresses)) {
                existingAddress = existingAddresses.find(addr => 
                  addr.City?.toLowerCase() === row.city?.toLowerCase() &&
                  addr.State?.toLowerCase() === row.state?.toLowerCase() &&
                  addr.Country?.toLowerCase() === normalizedCountry.toLowerCase() &&
                  (!addr.Address1 || addr.Address1.trim() === '') 
                  // TODO: The above line should check against the address1 field (when added)
                  // Not implemented yet as I don't know how to present the 3 separate fields
                  // to the user in a logical way 
                );
              }
              
              if (existingAddress) {
                // Use existing address
                addressId = existingAddress.Address_ID;
              } else {
                // Create new address
                const addressPayload = {
                  Company_ID: companyId,
                  AddressName: row.targetAccount, // Use target account as address name
                  City: row.city?.substring(0, 20) || '', // Limit to 20 chars
                  State: row.state?.substring(0, 20) || '', // Limit to 20 chars
                  Country: normalizedCountry.substring(0, 25), // Limit to 25 chars
                };

                const addressResponse = await post("/legacy/std/Address", addressPayload);
                if (addressResponse) {
                  // The server should return the created record with the auto-generated ID
                  addressId = addressResponse.Address_ID;
                  result.addressesCreated++;
                }
              }
            } catch (addressError) {
              console.error('Error finding/creating address:', addressError);
              result.errors.push(`Failed to find/create address for ${row.targetAccount}: ${addressError}`);
            }
          }

          let journeyId: string | undefined;

          // Stage 3: Create journey
          updateStageProgress('Creating Journey', 3);
          
          try {
            // Format date as YYYY-MM-DD for the database
            const today = new Date().toISOString().split('T')[0];
            
            const validatedRsm = validateRsm(row.rsm);
            
            const journeyPayload = {
              Project_Name: row.targetAccount,
              Target_Account: row.targetAccount,
              Company_ID: companyId || undefined, // Use undefined instead of null
              RSM: validatedRsm,
              City: row.city,
              State_Province: row.state,
              Country: normalizeCountry(row.country),
              Lead_Source: getLeadSource(row.leadSource),
              Journey_Stage: "Lead", // Default to Lead stage
              Journey_Type: "stamping", // Default type
              Industry: "Other", // Default industry
              Notes: row.journeyStep ? `Initial note: ${row.journeyStep}` : '',
              Journey_Start_Date: today,
              Action_Date: today,
              Journey_Status: 'Active',
              Priority: 'C', // Default medium priority
              Journey_Value: 0,
              Dealer: row.dealer,
            };

            const journeyResponse = await post("/legacy/std/Journey", journeyPayload);
            if (journeyResponse && journeyResponse.ID) {
              // The server should return the created record with the auto-generated ID
              journeyId = journeyResponse.ID;
              result.journeysCreated++;
              
              // Add to created journeys list for display
              result.createdJourneys.push({
                id: journeyId as string,
                name: journeyPayload.Project_Name,
                targetAccount: row.targetAccount,
                rsm: validatedRsm,
                stage: "Lead"
              });
            }
          } catch (journeyError) {
            console.error('Error creating journey:', journeyError);
            result.errors.push(`Failed to create journey for ${row.targetAccount}: ${journeyError}`);
          }

          // Stage 4: Create journey contact
          updateStageProgress('Creating Contact', 4);
          
          if (row.contactName && row.contactEmail && journeyId) {
            try {
              const journeyContactPayload = {
                Jrn_ID: journeyId,
                Contact_Name: row.contactName.substring(0, 50), // Limit to 50 chars
                Contact_Email: row.contactEmail.substring(0, 50), // Limit to 50 chars
                Contact_Office: (row.office || '').substring(0, 30), // Limit to 30 chars
                Contact_Mobile: (row.mobile || '').substring(0, 30), // Limit to 30 chars
                Contact_Position: '', // Could be enhanced later
                Contact_Note: row.journeyStep ? `Initial note: ${row.journeyStep}`.substring(0, 500) : '', // Limit to 500 chars
                IsPrimary: 1, // Set as primary contact - use 1 for true, 0 for false
              };

              const contactResponse = await post("/legacy/std/Journey_Contact", journeyContactPayload);
              if (contactResponse) {
                result.contactsCreated++;
              }
            } catch (contactError) {
              console.error('Error creating journey contact:', contactError);
              result.errors.push(`Failed to create journey contact ${row.contactName}: ${contactError}`);
            }
          }


        } catch (rowError) {
          console.error(`Error processing row for ${row.targetAccount}:`, rowError);
          result.errors.push(`Failed to process ${row.targetAccount}: ${rowError}`);
        }
        })); // Close Promise.all and map
        
        // Update progress after batch completion
        const completedRows = Math.min((batchIndex + 1) * BATCH_SIZE, preview.length);
        setProgress(prev => ({ 
          ...prev,
          current: completedRows,
          stage: batchIndex === batches.length - 1 ? 'Import completed!' : `Batch ${batchIndex + 1} completed`,
          stageProgress: batch.length * 4,
          stageTotal: batch.length * 4
        }));
      } // Close batch processing loop

    } catch (error) {
      console.error('Import process failed:', error);
      result.success = false;
      result.errors.push(`Import failed: ${error}`);
    }

    setImportResult(result);
    setIsProcessing(false);
    setStep('complete');
  }, [preview, post, get]);

  const handleComplete = () => {
    if (importResult?.success) {
      onSuccess(importResult);
    }
    handleCancel();
  };

  const handleCancel = () => {
    setFile(null);
    setPreview([]);
    setRawData([]);
    setColumnMappings([]);
    setActiveFieldId(null);
    setImportResult(null);
    setStep('upload');
    setIsProcessing(false);
    setProgress({ 
      current: 0, 
      total: 0, 
      stage: 'Starting...',
      stageProgress: 0,
      stageTotal: 0
    });
    onClose();
  };

  const renderUploadStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <FileSpreadsheet className="w-16 h-16 mx-auto text-text-muted mb-4" />
        <h3 className="text-lg font-medium text-text mb-2">Import Excel File</h3>
        <p className="text-sm text-text-muted mb-4">
          Upload an Excel file with journey and optional contact data. The file can contain the following columns:
        </p>
        <div className="text-left bg-surface p-3 rounded text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>• RSM</div>
            <div>• Dealer</div>
            <div>• Contact Name</div>
            <div>• Contact Email</div>
            <div>• <span className="font-bold">Target Account *</span></div>
            <div>• City</div>
            <div>• State/Province</div>
            <div>• Country</div>
            <div>• Lead Source</div>
            <div>• Mobile #</div>
            <div>• Office #</div>
            <div>• Journey Step</div>
          </div>
        </div>
      </div>
      
      <div className="border-2 border-dashed border-border rounded-lg p-6">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
          id="excel-upload"
        />
        <label
          htmlFor="excel-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="w-8 h-8 text-text-muted mb-2" />
          <span className="text-sm font-medium text-text">
            {file ? file.name : "Click to upload Excel file"}
          </span>
          <span className="text-xs text-text-muted mt-1">
            .xlsx or .xls files only
          </span>
        </label>
      </div>
    </div>
  );

  const renderMappingStep = () => {
    // Get enabled fields in their current order
    const enabledFields = columnMappings
      .filter(m => m.enabled)
      .sort((a, b) => a.columnIndex - b.columnIndex);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-text">Map Excel Columns</h3>
          <span className="text-sm text-text-muted">
            {rawData.length} rows detected
          </span>
        </div>
        
        <p className="text-sm text-text-muted">
          Arrange the enabled fields below to match your Excel column order. Enable/disable fields as needed.
        </p>

        {/* Field Enable/Disable Controls */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-text">Available Fields</h4>
          <div className="grid grid-cols-2 gap-2">
            {columnMappings.map((mapping) => (
              <div key={mapping.field} className="flex items-center gap-2 p-2 bg-surface rounded">
                <input
                  type="checkbox"
                  checked={mapping.enabled}
                  onChange={() => toggleColumnEnabled(mapping.field)}
                  disabled={mapping.required}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                />
                <span className="text-sm text-text">
                  {mapping.label}
                  {mapping.required && <span className="text-error ml-1">*</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Draggable Column Mapping Row */}
        {enabledFields.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-text">
              Column Order (Drag to rearrange - {enabledFields.length} fields enabled)
            </h4>
            
            {/* Field Mapping Row */}
            <DndContext 
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={enabledFields.map(f => f.field)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {enabledFields.map((mapping, index) => (
                    <SortableFieldCard
                      key={mapping.field}
                      mapping={mapping}
                      index={index}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeFieldId ? (() => {
                  const mapping = enabledFields.find(f => f.field === activeFieldId);
                  const index = enabledFields.findIndex(f => f.field === activeFieldId);
                  return mapping ? <DragPreview mapping={mapping} index={index} /> : null;
                })() : null}
              </DragOverlay>
            </DndContext>

            {/* Excel Column Headers for Reference */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-text">Your Excel Data Preview</h4>
              <div className="overflow-x-auto border rounded">
                <table className="w-full text-xs">
                  <thead className="bg-surface">
                    <tr>
                      {enabledFields.map((field, index) => (
                        <th key={index} className="p-2 text-left whitespace-nowrap border-r">
                          <div>Column {index + 1}</div>
                          <div className="text-xs font-normal text-secondary truncate">
                            → {field.label}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawData.slice(0, 3).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t">
                        {enabledFields.map((_, colIndex) => (
                          <td key={colIndex} className="p-2 whitespace-nowrap border-r text-text-muted max-w-32 truncate">
                            {String(row[colIndex] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 justify-end">
          <Button variant="secondary-outline" onClick={() => setStep('upload')}>
            Back
          </Button>
          <Button 
            variant="primary" 
            onClick={generatePreviewFromMapping}
            disabled={enabledFields.filter(m => m.required).length === 0}
          >
            Generate Preview
          </Button>
        </div>
      </div>
    );
  };

  const renderPreviewStep = () => {
    // Get enabled fields in their mapped order for the preview
    const enabledFields = columnMappings
      .filter(m => m.enabled)
      .sort((a, b) => a.columnIndex - b.columnIndex);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-text">Preview Import Data</h3>
          <span className="text-sm text-text-muted">
            {preview.length} rows found
          </span>
        </div>
        
        {preview.length > 0 ? (
          <div className="max-h-60 overflow-x-auto overflow-y-auto border rounded">
            <table className="w-full text-xs min-w-max">
              <thead className="bg-surface sticky top-0">
                <tr>
                  {enabledFields.map((field) => (
                    <th key={field.field} className="p-2 text-left whitespace-nowrap">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((row, index) => (
                  <tr key={index} className="border-t">
                    {enabledFields.map((field) => (
                      <td key={field.field} className="p-2 whitespace-nowrap max-w-32 truncate">
                        {field.field === 'city' && row.state ? 
                          `${row.city}, ${row.state}` : 
                          field.field === 'mobile' && !row.mobile && row.office ?
                            row.office :
                            row[field.field as keyof ExcelRow] || ''
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 10 && (
              <div className="p-2 text-center text-xs text-text-muted bg-surface">
                ...and {preview.length - 10} more rows
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted">
            No valid data found in the Excel file.
          </div>
        )}
        
        <div className="flex gap-2 justify-end">
          <Button variant="secondary-outline" onClick={() => setStep('mapping')}>
            Back to Mapping
          </Button>
          <Button 
            variant="primary" 
            onClick={processImport}
            disabled={preview.length === 0 || isProcessing}
          >
            {isProcessing ? "Processing..." : `Import ${preview.length} Items`}
          </Button>
        </div>
      </div>
    );
  };

  const renderProcessingStep = () => (
    <div className="text-center py-8">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      <h3 className="text-lg font-medium text-text mb-2">Processing Import...</h3>
      
      {progress.total > 0 && (
        <div className="w-full max-w-md mx-auto space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Overall Progress</span>
              <span>{progress.current} / {progress.total} rows</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Current Stage */}
          <div>
            <div className="text-sm text-text-muted mb-2">
              {progress.stage}
            </div>
            {progress.stageTotal > 0 && (
              <>
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>Batch Progress</span>
                  <span>{progress.stageProgress} / {progress.stageTotal} operations</span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5">
                  <div 
                    className="bg-success h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.stageProgress / progress.stageTotal) * 100}%` }}
                  ></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-4">
      {importResult?.success ? (
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">Import Completed Successfully!</h3>
        </div>
      ) : (
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">Import Completed with Errors</h3>
        </div>
      )}
      
      {importResult && (
        <div className="bg-surface p-4 rounded space-y-2">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-warning">{importResult.addressesCreated}</div>
              <div className="text-text-muted">Addresses Created</div>
            </div>
            <div>
              <div className="font-semibold text-info">{importResult.contactsCreated}</div>
              <div className="text-text-muted">Journey Contacts Created</div>
            </div>
            <div>
              <div className="font-semibold text-primary">{importResult.journeysCreated}</div>
              <div className="text-text-muted">Journeys Created</div>
            </div>
          </div>
          
          {importResult.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-error mb-2">Errors:</h4>
              <div className="max-h-32 overflow-y-auto text-xs text-error space-y-1">
                {importResult.errors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Created Journeys List */}
      {importResult && importResult.createdJourneys.length > 0 && (
        <div className="bg-surface border rounded-lg p-4">
          <h4 className="text-sm font-medium text-text mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            Created Journeys ({importResult.createdJourneys.length})
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {importResult.createdJourneys.map((journey, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-surface rounded border hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                onClick={() => {
                  window.open(`/sales/pipeline/${journey.id}`, '_blank');
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text truncate">
                    {journey.targetAccount}
                  </div>
                  <div className="text-xs text-text-muted">
                    RSM: {journey.rsm} • Stage: {journey.stage}
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-text-muted text-center">
            Click any journey to open in new tab
          </div>
        </div>
      )}
      
      <div className="flex gap-2 justify-end">
        <Button variant="primary" onClick={handleComplete}>
          Done
        </Button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Import from Excel" size="lg">
      <div className="min-h-[400px]">
        {step === 'upload' && renderUploadStep()}
        {step === 'mapping' && renderMappingStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'processing' && renderProcessingStep()}
        {step === 'complete' && renderCompleteStep()}
      </div>
    </Modal>
  );
};