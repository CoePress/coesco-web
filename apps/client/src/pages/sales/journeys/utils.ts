import { PRIORITY_CONFIG, VALID_EQUIPMENT_TYPES, VALID_QUOTE_TYPES, VALID_LEAD_SOURCES, VALID_JOURNEY_TYPES, VALID_DEALERS, VALID_DEALER_CONTACTS, VALID_INDUSTRIES } from './constants';

export const getPriorityConfig = (priority: string) => {
  const p = String(priority ?? "").toUpperCase();
  return PRIORITY_CONFIG[p as keyof typeof PRIORITY_CONFIG] || {
    style: "default",
    color: "bg-gray-400",
    label: "Medium"
  };
};

export const formatDateForDatabase = (dateLocal: string) => {
  if (!dateLocal) return "";
  // Convert "2025-09-11" to "2025-09-11 00:00:00"
  return dateLocal + " 00:00:00";
};

export const getValidEquipmentType = (value: string) => {
  const normalized = VALID_EQUIPMENT_TYPES.find(type => 
    type.toLowerCase() === (value || "").toLowerCase()
  );
  return normalized || "Unknown";
};

export const getValidQuoteType = (value: string) => {
  const normalized = VALID_QUOTE_TYPES.find(type => 
    type.toLowerCase() === (value || "").toLowerCase()
  );
  return normalized || "Standard less than 6 months";
};

export const getValidLeadSource = (value: string) => {
  const normalized = VALID_LEAD_SOURCES.find(source => 
    source.toLowerCase() === (value || "").toLowerCase()
  );
  return normalized || "Other";
};

export const getValidJourneyType = (value: string) => {
  const normalized = VALID_JOURNEY_TYPES.find(type => 
    type.toLowerCase() === (value || "").toLowerCase()
  );
  return normalized || "Stamping";
};

export const getValidDealer = (value: string) => {
  if (!value) return "";
  const normalized = VALID_DEALERS.find(dealer => 
    dealer.toLowerCase() === value.toLowerCase()
  );
  return normalized || value;
};

export const getValidDealerContact = (value: string) => {
  if (!value) return "";
  const normalized = VALID_DEALER_CONTACTS.find(contact => 
    contact.toLowerCase() === value.toLowerCase()
  );
  return normalized || value;
};

export const getValidIndustry = (value: string) => {
  if (!value) return "";
  const normalized = VALID_INDUSTRIES.find(industry => 
    industry.toLowerCase() === value.toLowerCase()
  );
  return normalized || value;
};

export const fuzzyMatch = (text: string, query: string): boolean => {
  if (!query) return true;

  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  if (textLower.includes(queryLower)) return true;

  const cleanText = textLower.replace(/[^a-z0-9]/g, '');
  const cleanQuery = queryLower.replace(/[^a-z0-9]/g, '');

  if (cleanText.includes(cleanQuery)) return true;

  let textIndex = 0;
  let queryIndex = 0;

  while (queryIndex < cleanQuery.length && textIndex < cleanText.length) {
    if (cleanText[textIndex] === cleanQuery[queryIndex]) {
      queryIndex++;
    }
    textIndex++;
  }

  return queryIndex === cleanQuery.length;
};

export interface Employee {
  name: string;
  empNum: number;
  initials: string;
}

export const fetchAvailableRsms = async (api: any, includeHistoric: boolean = false): Promise<Employee[]> => {
  try {
    const rsmData = await api.get('/legacy/std/Demographic/filter/custom', {
      filterField: 'Category',
      filterValue: 'RSM',
      ...(includeHistoric ? {} : { Use_Status: 'NOT:Historical' }),
      fields: 'Description'
    });

    if (!Array.isArray(rsmData) || rsmData.length === 0) {
      return [];
    }

    const rsmInitials = rsmData.map(item => item.Description).filter(Boolean);

    if (rsmInitials.length === 0) {
      return [];
    }

    const employeePromises = rsmInitials.map(initials =>
      api.get('/legacy/std/Employee/filter/custom', {
        filterField: 'EmpInitials',
        filterValue: initials,
        fields: 'EmpFirstName,EmpLastName,EmpNum'
      })
    );

    const employeeResults = await Promise.all(employeePromises);

    const rsmOptions = employeeResults
      .map((result, index) => {
        if (Array.isArray(result) && result.length > 0) {
          const employee = result[0];
          return {
            name: `${employee.EmpFirstName || ''} ${employee.EmpLastName || ''}`.trim() || employee.EmpInitials || rsmInitials[index],
            empNum: employee.EmpNum || 0,
            initials: rsmInitials[index]
          };
        }
        return null;
      })
      .filter((rsm): rsm is Employee => rsm !== null && rsm.empNum > 0);

    return rsmOptions;
  } catch (error) {
    console.error('Error fetching RSM data:', error);
    return [];
  }
};

export const fetchEmployeeByNumber = async (api: any, empNum: number): Promise<{ name: string; empNum: number } | null> => {
  if (!empNum) return null;

  try {
    const employeeData = await api.get('/legacy/std/Employee/filter/custom', {
      filterField: 'EmpNum',
      filterValue: empNum,
      limit: 1
    });

    if (Array.isArray(employeeData) && employeeData.length > 0) {
      const employee = employeeData[0];
      return {
        name: `${employee.EmpFirstName || ''} ${employee.EmpLastName || ''}`.trim() || `Employee ${employee.EmpNum}`,
        empNum: employee.EmpNum
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching employee data:', error);
    return null;
  }
};