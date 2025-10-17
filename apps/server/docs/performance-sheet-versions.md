# Performance Sheet Versions

## Overview

Performance Sheet Versions define the structure and fields for performance sheets. They use a nested structure of tabs, sections, and fields that can be dynamically rendered in the client application.

## Data Structure

```
PerformanceSheetVersion
└── sections (array) - Top-level tabs
    └── sections (array) - Sections within each tab
        └── fields (array) - Form fields within each section
```

## Structure Breakdown

### 1. Tab Level (Root sections)

Each tab represents a top-level navigation item in the performance sheet.

**Properties:**
- `id` (string): Unique identifier for the tab
- `label` (string): Display name shown in the tab bar
- `value` (string): Internal value used for routing/state
- `sequence` (number): Display order (ascending)
- `sections` (array): Array of section objects

**Example:**
```json
{
  "id": "tab-rfq",
  "label": "RFQ",
  "value": "rfq",
  "sequence": 1,
  "sections": [...]
}
```

### 2. Section Level

Sections organize fields into logical groups within a tab.

**Properties:**
- `id` (string): Unique identifier for the section
- `title` (string): Section heading displayed above fields
- `sequence` (number): Display order within the tab
- `columns` (number): Grid column count (1-4 typical)
- `fields` (array): Array of field objects

**Example:**
```json
{
  "id": "section-rfq-info",
  "title": "RFQ Information",
  "sequence": 1,
  "columns": 2,
  "fields": [...]
}
```

### 3. Field Level

Fields are the actual input controls for data entry.

**Properties:**
- `id` (string): Unique identifier and data key
- `label` (string): Field label displayed to user
- `type` (string): Field type (see types below)
- `size` (string): Field width (`sm`, `md`, `lg`, `full`)
- `sequence` (number): Display order within the section
- `required` (boolean): Whether field is mandatory
- `options` (array, optional): Options for select/dropdown fields

**Example:**
```json
{
  "id": "rfq-customer",
  "label": "Customer",
  "type": "text",
  "size": "md",
  "sequence": 1,
  "required": true
}
```

## Field Types

### Available Types

| Type | Description | Use Case |
|------|-------------|----------|
| `text` | Single-line text input | Names, short text |
| `number` | Numeric input | Quantities, measurements |
| `date` | Date picker | Dates only |
| `textarea` | Multi-line text area | Notes, descriptions |
| `select` | Dropdown with options | Predefined choices |
| `checkbox` | Boolean checkbox | Yes/No, true/false |

### Select Field Options

For `select` type fields, include an `options` array:

```json
{
  "id": "coat-type",
  "label": "Coating Type",
  "type": "select",
  "size": "md",
  "sequence": 1,
  "required": false,
  "options": [
    { "label": "None", "value": "none" },
    { "label": "Galvanized", "value": "galvanized" },
    { "label": "Painted", "value": "painted" },
    { "label": "Powder Coated", "value": "powder" }
  ]
}
```

## Field Sizes

Field size determines how much horizontal space a field occupies in the grid:

- `sm`: Small (1 column span)
- `md`: Medium (1 column span, but may have different styling)
- `lg`: Large (2 column spans)
- `full`: Full width (spans all columns)

## Creating a Performance Sheet Version

### Using the Repository

```typescript
import { performanceSheetVersionRepository } from "@/repositories";

const sampleTabs = [
  {
    id: "tab-general",
    label: "General Info",
    value: "general",
    sequence: 1,
    sections: [
      {
        id: "section-basic",
        title: "Basic Information",
        sequence: 1,
        columns: 2,
        fields: [
          {
            id: "project-name",
            label: "Project Name",
            type: "text",
            size: "md",
            sequence: 1,
            required: true
          },
          {
            id: "project-date",
            label: "Project Date",
            type: "date",
            size: "md",
            sequence: 2,
            required: true
          }
        ]
      }
    ]
  }
];

await performanceSheetVersionRepository.create({
  sections: sampleTabs,
  createdById: "user-id",
  updatedById: "user-id",
}, undefined, true);
```

## Best Practices

### Organization
1. Group related fields into logical sections
2. Use clear, descriptive labels
3. Order fields in a logical flow (top to bottom, left to right)
4. Keep tabs focused on specific aspects

### Field Design
1. Use appropriate field types for data
2. Set `required: true` only for essential fields
3. Provide clear options for select fields
4. Use `full` size for textarea fields
5. Balance field sizes across columns for visual harmony

### Scaling to Large Versions
1. Break complex forms into multiple tabs
2. Limit sections per tab (3-5 recommended)
3. Limit fields per section (8-12 recommended)
4. Use consistent naming conventions for IDs
5. Document field purposes for maintenance

### Naming Conventions

**Tab IDs:** `tab-{name}` (e.g., `tab-rfq`, `tab-material-specs`)

**Section IDs:** `section-{description}` (e.g., `section-basic-info`, `section-coating`)

**Field IDs:** `{context}-{field}` (e.g., `rfq-customer`, `mat-thickness`)

## Example: Complete Structure

```json
{
  "sections": [
    {
      "id": "tab-project",
      "label": "Project Details",
      "value": "project",
      "sequence": 1,
      "sections": [
        {
          "id": "section-info",
          "title": "Project Information",
          "sequence": 1,
          "columns": 2,
          "fields": [
            {
              "id": "proj-name",
              "label": "Project Name",
              "type": "text",
              "size": "lg",
              "sequence": 1,
              "required": true
            },
            {
              "id": "proj-date",
              "label": "Start Date",
              "type": "date",
              "size": "md",
              "sequence": 2,
              "required": true
            },
            {
              "id": "proj-status",
              "label": "Status",
              "type": "select",
              "size": "md",
              "sequence": 3,
              "required": true,
              "options": [
                { "label": "Planning", "value": "planning" },
                { "label": "Active", "value": "active" },
                { "label": "Completed", "value": "completed" }
              ]
            },
            {
              "id": "proj-notes",
              "label": "Notes",
              "type": "textarea",
              "size": "full",
              "sequence": 4,
              "required": false
            }
          ]
        }
      ]
    }
  ]
}
```

## Current Seed Templates

The system includes two pre-built performance sheet templates:

### 1. RFQ Tab
**Sections:** 10 sections covering the complete RFQ workflow
- Basic Information (16 fields)
- Line Configuration (4 fields)
- Coil Specifications (12 fields)
- Material Specifications (4 fields)
- Equipment Configuration (7 fields)
- Press Information (1 field)
- Dies Information (3 fields)
- Feed Requirements (12 fields)
- Space & Mounting Requirements (5 fields)
- Special Requirements (1 field)

**Total:** 65+ fields

### 2. TDDBHD Tab
**Sections:** 6 sections for tension, drag, brake, and hold-down calculations
- Customer & Date (2 fields)
- Reel & Material Specs (9 fields)
- Coil, Brake & Other Specs (8 fields)
- Threading Drive (5 fields)
- Hold Down (6 fields)
- Drag Brake (5 fields)

**Total:** 35+ fields

Both templates are exported from `apps/server/src/templates/performance-sheet.ts` and can be imported and used in the seed file or extended for custom implementations.

## Notes

- The structure is stored as JSON in the database
- Changes to a version affect all performance sheets using that version
- Consider creating new versions instead of modifying existing ones
- Field IDs are used as keys in the performance sheet data object
- The client dynamically renders the form based on this structure
- Option constants (dropdowns) are defined in `performance-sheet.ts` and referenced by the seeds
