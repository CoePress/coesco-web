// A lot of these should actually be database fields

export const STAGES = [
  { id: 1, label: "Lead", weight: 0.20 },
  { id: 2, label: "Qualified", weight: 0.40 },
  { id: 3, label: "Presentations", weight: 0.60 },
  { id: 4, label: "Negotiation", weight: 0.90 },
  { id: 5, label: "Closed Won", weight: 1.0 },
  { id: 6, label: "Closed Lost", weight: 0.0 },
];

export const PRIORITY_CONFIG = {
  A: { style: "error", color: "bg-red-500", label: "Highest" },
  B: { style: "warning", color: "bg-orange-500", label: "High" },
  C: { style: "default", color: "bg-yellow-500", label: "Medium" },
  D: { style: "success", color: "bg-green-500", label: "Lowest" },
} as const;

export const VALID_EQUIPMENT_TYPES = ["Standard", "Custom", "Unknown"];

export const VALID_QUOTE_TYPES = [
  "Standard more than 6 months",
  "Standard less than 6 months",
  "Budgetary",
];

export const VALID_LEAD_SOURCES = [
  "Dealer Lead",
  "Phone In - Existing Customer",
  "Coe Website (contact form)",
  "Cold Call - New Customer",
  "Other",
  "Coe Website (Email Inquiry)",
  "Email - Existing Customer",
  "TopSpot",
  "OEM Lead",
  "Coe Service",
  "Email - New Customer",
  "Phone In - New Customer",
  "Event - Fabtech",
  "Cold Call - Prior Customer",
  "Cold Call - Existing Customer",
  "Customer Visit (prior customer)",
  "Customer Visit (current customer)",
  "Email - Dealer",
  "Event - NATM",
  "Event - PMA",
  "Phone In - Dealer",
];

export const VALID_JOURNEY_TYPES = [
  "Stamping",
  "CTL",
  "Parts",
  "Rollforming",
  "Service",
];

export const VALID_DEALERS = [
  "H & O Die Supply, Inc.",
  "Mid Atlantic Machinery",
  "Visionary Manufacturing Solutions",
  "Sterling Fabrication Technology",
  "Coe Press Equipment Corp.",
  "Metal Forming Equipment Systems, LLC",
  "Sanson Northwest Inc.",
  "Press Automation, Inc.",
  "TCR Inc.",
  "Production Resources Inc.",
  "Liakos Industrial Sales, LLC",
  "Other",
  "Promotores Tecnicos, S.A. De C.V.",
  "C.J. Smith Machinery",
  "Southern States Machinery Inc.",
  "Stafford Machinery Company",
  "CNI - Consultamex LLC",
];

export const VALID_DEALER_CONTACTS = [
  "Greg Liakos",
  "Ryan Bowman",
  "Al Kosir",
  "Dave Smith",
  "Scott Bradt",
  "Josh Kowal",
  "Dave DeFrees",
  "Brian Stafford",
  "Arthur Anderson",
  "Hunter Coe",
  "Todd Wenzel",
  "Greg Chmielewski",
  "Jim Meyer",
  "Brian Landry",
  "Clint Ponton",
  "Francisco Oranday",
  "Juan Carlos Estrada",
  "Kevin Houston",
];

export const VALID_INDUSTRIES = [
  "Contract Stamping",
  "Press OEM",
  "Construction",
  "Energy / Motors / Transformers",
  "Integrator",
  "Auto Tier 1 & 2",
  "Auto OEM",
  "Marine",
  "Appliances",
  "Lawn Equipment",
  "Contract Rollforming",
  "HVAC / Air Handling",
  "Packaging",
  "Mobile Heavy Equipment / Locomotive",
  "Other",
  "Storage / Lockers / Hardware",
  "Contract Fabricating",
  "Furniture & Components",
  "Electrical Components / Lighting",
  "RV / Trailers",
  "Military / Defense",
  "Medical",
];

export const VALID_CONFIDENCE_LEVELS = [
  "Closed Won",
  "Closed Lost",
  "90%",
  "75%",
  "50%",
  "25%",
];

export const VALID_REASON_WON = [
  "Coe Quality",
  "Customer Relationship",
  "Pricing",
  "Coe Controls",
  "Lead Time",
];

export const VALID_REASON_LOST = [
  "Competitor Price",
  "Project Dropped",
  "Outside of Budget",
  "Bought Used",
  "Spam",
  "No Response",
  "Work not awarded",
  "Project Outsourced",
  "Lead Time",
  "Competitor Relationship",
  "Not a fit",
  "Other",
  "Different COE Equipment Selected",
  "Coe Controls",
  "Parts/Svc Opportunity",
];

export const VALID_PRESENTATION_METHODS = [
  "In Person",
  "Web Meeting",
  "Phone",
  "Email",
];
