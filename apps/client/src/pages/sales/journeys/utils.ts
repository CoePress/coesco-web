import { PRIORITY_CONFIG, VALID_DEALER_CONTACTS, VALID_DEALERS, VALID_EQUIPMENT_TYPES, VALID_INDUSTRIES, VALID_JOURNEY_TYPES, VALID_LEAD_SOURCES, VALID_QUOTE_TYPES } from "./constants";

export function getPriorityConfig(priority: string) {
  const p = String(priority ?? "").toUpperCase();
  return PRIORITY_CONFIG[p as keyof typeof PRIORITY_CONFIG] || {
    style: "default",
    color: "bg-gray-400",
    label: "Medium",
  };
}

export function formatDateForDatabase(dateLocal: string) {
  if (!dateLocal)
    return "";
  // Convert "2025-09-11" to "2025-09-11 00:00:00"
  return `${dateLocal} 00:00:00`;
}

export function getValidEquipmentType(value: string) {
  const normalized = VALID_EQUIPMENT_TYPES.find(type =>
    type.toLowerCase() === (value || "").toLowerCase(),
  );
  return normalized || "Unknown";
}

export function getValidQuoteType(value: string) {
  const normalized = VALID_QUOTE_TYPES.find(type =>
    type.toLowerCase() === (value || "").toLowerCase(),
  );
  return normalized || "Standard less than 6 months";
}

export function getValidLeadSource(value: string) {
  const normalized = VALID_LEAD_SOURCES.find(source =>
    source.toLowerCase() === (value || "").toLowerCase(),
  );
  return normalized || "Other";
}

export function getValidJourneyType(value: string) {
  const normalized = VALID_JOURNEY_TYPES.find(type =>
    type.toLowerCase() === (value || "").toLowerCase(),
  );
  return normalized || "Stamping";
}

export function getValidDealer(value: string) {
  if (!value)
    return "";
  const normalized = VALID_DEALERS.find(dealer =>
    dealer.toLowerCase() === value.toLowerCase(),
  );
  return normalized || value;
}

export function getValidDealerContact(value: string) {
  if (!value)
    return "";
  const normalized = VALID_DEALER_CONTACTS.find(contact =>
    contact.toLowerCase() === value.toLowerCase(),
  );
  return normalized || value;
}

export function getValidIndustry(value: string) {
  if (!value)
    return "";
  const normalized = VALID_INDUSTRIES.find(industry =>
    industry.toLowerCase() === value.toLowerCase(),
  );
  return normalized || value;
}

export function fuzzyMatch(text: string, query: string): boolean {
  if (!query)
    return true;

  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  if (textLower.includes(queryLower))
    return true;

  const cleanText = textLower.replace(/[^a-z0-9]/g, "");
  const cleanQuery = queryLower.replace(/[^a-z0-9]/g, "");

  if (cleanText.includes(cleanQuery))
    return true;

  let textIndex = 0;
  let queryIndex = 0;

  while (queryIndex < cleanQuery.length && textIndex < cleanText.length) {
    if (cleanText[textIndex] === cleanQuery[queryIndex]) {
      queryIndex++;
    }
    textIndex++;
  }

  return queryIndex === cleanQuery.length;
}

export interface Employee {
  name: string;
  empNum: number;
  initials: string;
}

export async function fetchDemographicCategory(api: any, category: string, includeHistoric: boolean = false): Promise<string[]> {
  try {
    const demographicData = await api.get("/legacy/std/Demographic/filter/custom", {
      filterField: "Category",
      filterValue: category,
      ...(includeHistoric ? {} : { Use_Status: "NOT:Historical" }),
      fields: "Description",
    });

    if (!Array.isArray(demographicData) || demographicData.length === 0) {
      return [];
    }

    return demographicData.map(item => item.Description).filter(Boolean);
  }
  catch (error) {
    console.error(`Error fetching ${category} data:`, error);
    return [];
  }
}

export async function fetchAvailableRsms(api: any, includeHistoric: boolean = false): Promise<Employee[]> {
  try {
    const rsmData = await api.get("/legacy/std/Demographic/filter/custom", {
      filterField: "Category",
      filterValue: "RSM",
      ...(includeHistoric ? {} : { Use_Status: "NOT:Historical" }),
      fields: "Description",
    });

    if (!Array.isArray(rsmData) || rsmData.length === 0) {
      return [];
    }

    const rsmInitials = rsmData.map(item => item.Description).filter(Boolean);

    if (rsmInitials.length === 0) {
      return [];
    }

    const employeeData = await api.get("/legacy/std/Employee", {
      filter: JSON.stringify({
        filters: [{
          field: "EmpInitials",
          operator: "in",
          values: rsmInitials,
        }],
      }),
      fields: "EmpFirstName,EmpLastName,EmpNum,EmpInitials",
    });

    const employees = Array.isArray(employeeData?.data)
      ? employeeData.data
      : Array.isArray(employeeData) ? employeeData : [];

    const rsmOptions = employees
      .map((employee: any) => ({
        name: `${employee.EmpFirstName || ""} ${employee.EmpLastName || ""}`.trim() || employee.EmpInitials,
        empNum: employee.EmpNum || 0,
        initials: employee.EmpInitials,
      }))
      .filter((rsm: any): rsm is Employee => rsm !== null && rsm.empNum > 0);

    return rsmOptions;
  }
  catch (error) {
    console.error("Error fetching RSM data:", error);
    return [];
  }
}

export async function fetchEmployeeByNumber(api: any, empNum: number): Promise<{ name: string; empNum: number } | null> {
  if (!empNum)
    return null;

  try {
    const employeeData = await api.get("/legacy/std/Employee/filter/custom", {
      filterField: "EmpNum",
      filterValue: empNum,
      limit: 1,
    });

    if (Array.isArray(employeeData) && employeeData.length > 0) {
      const employee = employeeData[0];
      return {
        name: `${employee.EmpFirstName || ""} ${employee.EmpLastName || ""}`.trim() || `Employee ${employee.EmpNum}`,
        empNum: employee.EmpNum,
      };
    }

    return null;
  }
  catch (error) {
    console.error("Error fetching employee data:", error);
    return null;
  }
}
