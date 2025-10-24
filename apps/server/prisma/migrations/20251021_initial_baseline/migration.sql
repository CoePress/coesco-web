-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('PASSWORD_RESET', 'EMAIL_VERIFICATION', 'TWO_FACTOR_AUTH');

-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('AUTOMOTIVE', 'CONSTRUCTION', 'MANUFACTURING', 'OTHER');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SANDBOX', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "JourneyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JourneyType" AS ENUM ('STAMPING', 'CTL', 'ROLL_FORMING', 'UPGRADE', 'PARTS', 'SERVICE', 'RETROFIT');

-- CreateEnum
CREATE TYPE "JourneySource" AS ENUM ('WEBSITE', 'SOCIAL_MEDIA', 'REFERRAL', 'EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "JourneyPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "JourneyInteractionType" AS ENUM ('EMAIL', 'PHONE', 'IN_PERSON', 'VIDEO_CALL', 'TEXT_MESSAGE', 'SOCIAL_MEDIA', 'OTHER');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "QuoteRevisionStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'REVISED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('Equipment', 'Parts', 'Service');

-- CreateEnum
CREATE TYPE "OptionRuleAction" AS ENUM ('DISABLE', 'REQUIRE');

-- CreateEnum
CREATE TYPE "MachineType" AS ENUM ('LATHE', 'MILL', 'GRINDER', 'OTHER');

-- CreateEnum
CREATE TYPE "MachineControllerType" AS ENUM ('MAZAK', 'FANUC', 'OTHER');

-- CreateEnum
CREATE TYPE "MachineState" AS ENUM ('ACTIVE', 'SETUP', 'IDLE', 'ALARM', 'OFFLINE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FormFieldRestrictions" AS ENUM ('REQUIRED', 'READ_ONLY', 'HIDDEN_ON_DEVICE', 'HIDDEN_ON_REPORT');

-- CreateEnum
CREATE TYPE "FormFieldControlType" AS ENUM ('INPUT', 'TEXT_AREA', 'TEXTBOX', 'DROPDOWN', 'RADIO_BUTTON', 'MULTI_SELECT', 'BUTTON_GROUP', 'GEO_LOCATION', 'DATE_SELECTOR', 'TIME_SELECTOR', 'STAMP', 'SKETCH_PAD', 'CAMERA', 'SIGNATURE_PAD');

-- CreateEnum
CREATE TYPE "FormFieldDataType" AS ENUM ('TEXT', 'EMAIL', 'EMAIL_ADDRESS', 'URL', 'PHONE_NUMBER', 'INTEGER', 'DECIMAL', 'CURRENCY', 'GEO_LOCATION', 'DATE', 'TIME', 'DATE_TIME', 'IMAGE', 'SIGNATURE');

-- CreateEnum
CREATE TYPE "FormSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ConditionalTarget" AS ENUM ('PAGE', 'SECTION', 'FIELD');

-- CreateEnum
CREATE TYPE "ConditionalAction" AS ENUM ('SHOW', 'HIDE', 'ENABLE', 'DISABLE', 'REQUIRE', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "ConditionalOperator" AS ENUM ('AND', 'OR');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "AccessPurpose" AS ENUM ('FORM_SUBMISSION', 'FILE_DOWNLOAD', 'CUSTOMER_FEEDBACK');

-- CreateEnum
CREATE TYPE "BugReportStatus" AS ENUM ('SUBMITTED', 'IN_JIRA', 'FAILED');

-- CreateEnum
CREATE TYPE "LoginMethod" AS ENUM ('PASSWORD', 'MICROSOFT', 'SSO', 'API_KEY', 'TEST_LOGIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "microsoftId" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "title" TEXT NOT NULL,
    "hireDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "terminationDate" TIMESTAMP(3),
    "departmentId" TEXT,
    "managerId" TEXT,
    "isSalaried" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "condition" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "condition" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "scope" JSONB NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_exceptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "scope" JSONB NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "industry" "Industry",
    "yearFounded" INTEGER,
    "revenue" INTEGER,
    "employeeCount" TEXT,
    "customerSince" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "creditLimit" INTEGER,
    "taxId" TEXT,
    "logoUrl" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "legacy" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postal_code" (
    "countryCode" CHAR(2) NOT NULL,
    "postalCode" VARCHAR(20) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "postal_code_pkey" PRIMARY KEY ("countryCode","postalCode")
);

-- CreateTable
CREATE TABLE "journeys" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "rsmId" TEXT,
    "customerId" TEXT,
    "customerAddressId" TEXT,
    "customerContactId" TEXT,
    "dealerId" TEXT,
    "dealerAddressId" TEXT,
    "dealerContactId" TEXT,
    "startDate" TIMESTAMP(3),
    "status" "JourneyStatus",
    "type" "JourneyType",
    "source" "JourneySource",
    "priority" "JourneyPriority",
    "confidence" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_notes" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'note',
    "body" TEXT NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "journey_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_interactions" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "interactionType" "JourneyInteractionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "journey_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_headers" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT,
    "year" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "rsmId" TEXT,
    "customerId" TEXT,
    "customerContactId" TEXT,
    "customerAddressId" TEXT,
    "dealerId" TEXT,
    "dealerContactId" TEXT,
    "dealerAddressId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'C',
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "status" "QuoteStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "legacy" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "quote_headers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_details" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "revision" TEXT NOT NULL DEFAULT 'A',
    "quoteDate" TIMESTAMP(3),
    "status" "QuoteRevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedById" TEXT,
    "sentById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "quote_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_items" (
    "id" TEXT NOT NULL,
    "quoteRevisionId" TEXT NOT NULL,
    "configurationId" TEXT,
    "itemId" TEXT,
    "model" TEXT,
    "name" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_terms" (
    "id" TEXT NOT NULL,
    "quoteRevisionId" TEXT NOT NULL,
    "percentage" INTEGER,
    "netDays" INTEGER NOT NULL DEFAULT 0,
    "amount" DECIMAL(65,30),
    "verbiage" TEXT,
    "dueOrder" INTEGER,
    "customTerms" TEXT,
    "notToExceed" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_notes" (
    "id" TEXT NOT NULL,
    "quoteRevisionId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "quote_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coil_types" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "multiplier" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 999,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "legacyId" TEXT,

    CONSTRAINT "coil_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_classes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "product_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "productClassId" TEXT,
    "modelNumber" TEXT,
    "name" TEXT,
    "description" TEXT,
    "specifications" JSONB NOT NULL DEFAULT '{}',
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leadTime" INTEGER,
    "type" "ItemType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "option_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "multiple" BOOLEAN NOT NULL DEFAULT false,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "standard" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL,
    "legacyId" TEXT,

    CONSTRAINT "option_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_class_option_categories" (
    "productClassId" TEXT NOT NULL,
    "optionCategoryId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "product_class_option_categories_pkey" PRIMARY KEY ("productClassId","optionCategoryId")
);

-- CreateTable
CREATE TABLE "option_headers" (
    "id" TEXT NOT NULL,
    "optionCategoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "legacyId" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "option_headers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "option_details" (
    "id" TEXT NOT NULL,
    "optionHeaderId" TEXT NOT NULL,
    "productClassId" TEXT,
    "itemId" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "option_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "option_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "action" "OptionRuleAction" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "condition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "option_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "option_rule_targets" (
    "ruleId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "option_rule_targets_pkey" PRIMARY KEY ("ruleId","optionId")
);

-- CreateTable
CREATE TABLE "option_rule_triggers" (
    "ruleId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "option_rule_triggers_pkey" PRIMARY KEY ("ruleId","optionId")
);

-- CreateTable
CREATE TABLE "configurations" (
    "id" TEXT NOT NULL,
    "productClassId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isTemplate" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuration_options" (
    "configurationId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "configuration_options_pkey" PRIMARY KEY ("configurationId","optionId")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MachineType" NOT NULL,
    "controllerType" "MachineControllerType" NOT NULL,
    "connectionUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "deletedById" TEXT,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_statuses" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "state" "MachineState" NOT NULL,
    "execution" TEXT NOT NULL,
    "controller" TEXT NOT NULL,
    "program" TEXT,
    "tool" TEXT,
    "metrics" JSONB,
    "alarmCode" TEXT,
    "alarmMessage" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_sheet_versions" (
    "id" TEXT NOT NULL,
    "sections" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "performance_sheet_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_sheets" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "name" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "performance_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_sheet_links" (
    "id" TEXT NOT NULL,
    "performanceSheetId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "performance_sheet_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_pages" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "form_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_sections" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "form_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "variable" TEXT NOT NULL,
    "controlType" "FormFieldControlType" NOT NULL,
    "dataType" "FormFieldDataType" NOT NULL,
    "options" JSONB NOT NULL DEFAULT '{}',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isReadOnly" BOOLEAN NOT NULL DEFAULT false,
    "isHiddenOnDevice" BOOLEAN NOT NULL DEFAULT false,
    "isHiddenOnReport" BOOLEAN NOT NULL DEFAULT false,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_submissions" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "status" "FormSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "answers" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_conditional_rules" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "name" TEXT,
    "targetType" "ConditionalTarget" NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" "ConditionalAction" NOT NULL,
    "conditions" JSONB NOT NULL,
    "operator" "ConditionalOperator" NOT NULL DEFAULT 'AND',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "form_conditional_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "model" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "diff" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "parentTable" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'New Chat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fileUrl" TEXT,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drafts" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "data" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ntfy_devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "pingIntervalSec" INTEGER NOT NULL DEFAULT 30,
    "maxMissedPings" INTEGER NOT NULL DEFAULT 3,
    "currentMissedPings" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastPingTime" TIMESTAMP(3),
    "lastPingSuccess" BOOLEAN,
    "isDown" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "ntfy_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_access_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "purpose" "AccessPurpose" NOT NULL,
    "resourceId" TEXT,
    "resourceType" TEXT,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "external_access_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bug_reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userEmail" TEXT,
    "userName" TEXT,
    "url" TEXT,
    "userAgent" TEXT,
    "issueKey" TEXT,
    "issueUrl" TEXT,
    "status" "BugReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "bug_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "deviceName" TEXT,
    "location" JSONB,
    "loginMethod" "LoginMethod" NOT NULL,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "logoutAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
    "suspiciousReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "username" TEXT,
    "loginMethod" "LoginMethod" NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_microsoftId_key" ON "users"("microsoftId");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_key" ON "tokens"("token");

-- CreateIndex
CREATE INDEX "tokens_token_idx" ON "tokens"("token");

-- CreateIndex
CREATE INDEX "tokens_userId_type_idx" ON "tokens"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_number_key" ON "employees"("number");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_number_idx" ON "employees"("number");

-- CreateIndex
CREATE INDEX "employees_createdById_idx" ON "employees"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "role_assignments_userId_idx" ON "role_assignments"("userId");

-- CreateIndex
CREATE INDEX "role_assignments_roleId_idx" ON "role_assignments"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "role_assignments_userId_roleId_scopeKey_key" ON "role_assignments"("userId", "roleId", "scopeKey");

-- CreateIndex
CREATE INDEX "permission_exceptions_userId_idx" ON "permission_exceptions"("userId");

-- CreateIndex
CREATE INDEX "permission_exceptions_permissionId_idx" ON "permission_exceptions"("permissionId");

-- CreateIndex
CREATE INDEX "companies_createdById_idx" ON "companies"("createdById");

-- CreateIndex
CREATE INDEX "contacts_createdById_idx" ON "contacts"("createdById");

-- CreateIndex
CREATE INDEX "addresses_createdById_idx" ON "addresses"("createdById");

-- CreateIndex
CREATE INDEX "journeys_createdById_idx" ON "journeys"("createdById");

-- CreateIndex
CREATE INDEX "journey_interactions_createdById_idx" ON "journey_interactions"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "quote_headers_year_number_key" ON "quote_headers"("year", "number");

-- CreateIndex
CREATE UNIQUE INDEX "quote_details_quoteId_revision_key" ON "quote_details"("quoteId", "revision");

-- CreateIndex
CREATE INDEX "quote_items_createdById_idx" ON "quote_items"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "product_classes_code_key" ON "product_classes"("code");

-- CreateIndex
CREATE INDEX "items_createdById_idx" ON "items"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "option_categories_name_key" ON "option_categories"("name");

-- CreateIndex
CREATE INDEX "product_class_option_categories_createdById_idx" ON "product_class_option_categories"("createdById");

-- CreateIndex
CREATE INDEX "option_headers_createdById_idx" ON "option_headers"("createdById");

-- CreateIndex
CREATE INDEX "option_details_createdById_idx" ON "option_details"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "option_details_productClassId_optionHeaderId_key" ON "option_details"("productClassId", "optionHeaderId");

-- CreateIndex
CREATE INDEX "option_rules_createdById_idx" ON "option_rules"("createdById");

-- CreateIndex
CREATE INDEX "option_rule_targets_createdById_idx" ON "option_rule_targets"("createdById");

-- CreateIndex
CREATE INDEX "option_rule_triggers_createdById_idx" ON "option_rule_triggers"("createdById");

-- CreateIndex
CREATE INDEX "configurations_createdById_idx" ON "configurations"("createdById");

-- CreateIndex
CREATE INDEX "configuration_options_createdById_idx" ON "configuration_options"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "machines_slug_key" ON "machines"("slug");

-- CreateIndex
CREATE INDEX "machines_createdById_idx" ON "machines"("createdById");

-- CreateIndex
CREATE INDEX "performance_sheet_versions_createdById_idx" ON "performance_sheet_versions"("createdById");

-- CreateIndex
CREATE INDEX "performance_sheets_createdById_idx" ON "performance_sheets"("createdById");

-- CreateIndex
CREATE INDEX "performance_sheet_links_createdById_idx" ON "performance_sheet_links"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "form_pages_formId_sequence_key" ON "form_pages"("formId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "form_sections_pageId_sequence_key" ON "form_sections"("pageId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "form_fields_sectionId_sequence_key" ON "form_fields"("sectionId", "sequence");

-- CreateIndex
CREATE INDEX "form_conditional_rules_formId_targetId_idx" ON "form_conditional_rules"("formId", "targetId");

-- CreateIndex
CREATE INDEX "audit_logs_model_idx" ON "audit_logs"("model");

-- CreateIndex
CREATE INDEX "audit_logs_recordId_idx" ON "audit_logs"("recordId");

-- CreateIndex
CREATE INDEX "audit_logs_changedBy_idx" ON "audit_logs"("changedBy");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "tag_parentTable_parentId_idx" ON "tag"("parentTable", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "tag_parentTable_parentId_description_key" ON "tag"("parentTable", "parentId", "description");

-- CreateIndex
CREATE INDEX "drafts_entityType_entityId_idx" ON "drafts"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "drafts_createdById_idx" ON "drafts"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "external_access_links_token_key" ON "external_access_links"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshToken_key" ON "sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_userId_isActive_idx" ON "sessions"("userId", "isActive");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "sessions_lastActivityAt_idx" ON "sessions"("lastActivityAt");

-- CreateIndex
CREATE INDEX "login_history_userId_idx" ON "login_history"("userId");

-- CreateIndex
CREATE INDEX "login_history_timestamp_idx" ON "login_history"("timestamp");

-- CreateIndex
CREATE INDEX "login_history_success_idx" ON "login_history"("success");

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_exceptions" ADD CONSTRAINT "permission_exceptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_exceptions" ADD CONSTRAINT "permission_exceptions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_rsmId_fkey" FOREIGN KEY ("rsmId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_customerAddressId_fkey" FOREIGN KEY ("customerAddressId") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_customerContactId_fkey" FOREIGN KEY ("customerContactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_dealerAddressId_fkey" FOREIGN KEY ("dealerAddressId") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_dealerContactId_fkey" FOREIGN KEY ("dealerContactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_interactions" ADD CONSTRAINT "journey_interactions_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "journeys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_details" ADD CONSTRAINT "quote_details_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quote_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quoteRevisionId_fkey" FOREIGN KEY ("quoteRevisionId") REFERENCES "quote_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "configurations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_terms" ADD CONSTRAINT "quote_terms_quoteRevisionId_fkey" FOREIGN KEY ("quoteRevisionId") REFERENCES "quote_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_classes" ADD CONSTRAINT "product_classes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "product_classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_class_option_categories" ADD CONSTRAINT "product_class_option_categories_productClassId_fkey" FOREIGN KEY ("productClassId") REFERENCES "product_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_class_option_categories" ADD CONSTRAINT "product_class_option_categories_optionCategoryId_fkey" FOREIGN KEY ("optionCategoryId") REFERENCES "option_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_headers" ADD CONSTRAINT "option_headers_optionCategoryId_fkey" FOREIGN KEY ("optionCategoryId") REFERENCES "option_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_details" ADD CONSTRAINT "option_details_optionHeaderId_fkey" FOREIGN KEY ("optionHeaderId") REFERENCES "option_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_details" ADD CONSTRAINT "option_details_productClassId_fkey" FOREIGN KEY ("productClassId") REFERENCES "product_classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_details" ADD CONSTRAINT "option_details_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_rule_targets" ADD CONSTRAINT "option_rule_targets_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "option_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_rule_targets" ADD CONSTRAINT "option_rule_targets_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "option_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_rule_triggers" ADD CONSTRAINT "option_rule_triggers_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "option_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_rule_triggers" ADD CONSTRAINT "option_rule_triggers_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "option_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configurations" ADD CONSTRAINT "configurations_productClassId_fkey" FOREIGN KEY ("productClassId") REFERENCES "product_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration_options" ADD CONSTRAINT "configuration_options_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "configurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuration_options" ADD CONSTRAINT "configuration_options_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "option_headers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_statuses" ADD CONSTRAINT "machine_statuses_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_sheets" ADD CONSTRAINT "performance_sheets_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "performance_sheet_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_sheet_links" ADD CONSTRAINT "performance_sheet_links_performanceSheetId_fkey" FOREIGN KEY ("performanceSheetId") REFERENCES "performance_sheets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_pages" ADD CONSTRAINT "form_pages_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_sections" ADD CONSTRAINT "form_sections_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "form_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "form_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_conditional_rules" ADD CONSTRAINT "form_conditional_rules_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

