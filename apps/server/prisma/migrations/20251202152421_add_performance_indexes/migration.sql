/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `user_settings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO', 'ARCHIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('UPLOADING', 'READY', 'PROCESSING', 'FAILED', 'DELETED');

-- AlterTable
ALTER TABLE "quote_items" ADD COLUMN     "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "tax" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" "AssetType" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'READY',
    "storageProvider" TEXT NOT NULL DEFAULT 'local',
    "url" TEXT NOT NULL,
    "cdnUrl" TEXT,
    "thumbnailUrl" TEXT,
    "metadata" JSONB,
    "tags" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assets_key_key" ON "assets"("key");

-- CreateIndex
CREATE INDEX "assets_type_idx" ON "assets"("type");

-- CreateIndex
CREATE INDEX "assets_status_idx" ON "assets"("status");

-- CreateIndex
CREATE INDEX "assets_uploadedById_idx" ON "assets"("uploadedById");

-- CreateIndex
CREATE INDEX "assets_createdAt_idx" ON "assets"("createdAt");

-- CreateIndex
CREATE INDEX "assets_deletedAt_idx" ON "assets"("deletedAt");

-- CreateIndex
CREATE INDEX "addresses_companyId_deletedAt_idx" ON "addresses"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "addresses_companyId_isPrimary_idx" ON "addresses"("companyId", "isPrimary");

-- CreateIndex
CREATE INDEX "addresses_deletedAt_idx" ON "addresses"("deletedAt");

-- CreateIndex
CREATE INDEX "bug_reports_status_idx" ON "bug_reports"("status");

-- CreateIndex
CREATE INDEX "bug_reports_createdAt_idx" ON "bug_reports"("createdAt");

-- CreateIndex
CREATE INDEX "bug_reports_createdById_idx" ON "bug_reports"("createdById");

-- CreateIndex
CREATE INDEX "chats_employeeId_deletedAt_idx" ON "chats"("employeeId", "deletedAt");

-- CreateIndex
CREATE INDEX "chats_employeeId_idx" ON "chats"("employeeId");

-- CreateIndex
CREATE INDEX "chats_deletedAt_idx" ON "chats"("deletedAt");

-- CreateIndex
CREATE INDEX "chats_createdAt_idx" ON "chats"("createdAt");

-- CreateIndex
CREATE INDEX "chats_createdById_idx" ON "chats"("createdById");

-- CreateIndex
CREATE INDEX "coil_types_isArchived_sortOrder_idx" ON "coil_types"("isArchived", "sortOrder");

-- CreateIndex
CREATE INDEX "coil_types_legacyId_idx" ON "coil_types"("legacyId");

-- CreateIndex
CREATE INDEX "companies_status_deletedAt_idx" ON "companies"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "companies_deletedAt_idx" ON "companies"("deletedAt");

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "companies"("name");

-- CreateIndex
CREATE INDEX "companies_createdAt_idx" ON "companies"("createdAt");

-- CreateIndex
CREATE INDEX "company_relationships_childId_idx" ON "company_relationships"("childId");

-- CreateIndex
CREATE INDEX "configuration_options_optionId_idx" ON "configuration_options"("optionId");

-- CreateIndex
CREATE INDEX "configuration_options_deletedAt_idx" ON "configuration_options"("deletedAt");

-- CreateIndex
CREATE INDEX "configurations_productClassId_isActive_idx" ON "configurations"("productClassId", "isActive");

-- CreateIndex
CREATE INDEX "configurations_productClassId_idx" ON "configurations"("productClassId");

-- CreateIndex
CREATE INDEX "configurations_isTemplate_idx" ON "configurations"("isTemplate");

-- CreateIndex
CREATE INDEX "configurations_isActive_deletedAt_idx" ON "configurations"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "configurations_deletedAt_idx" ON "configurations"("deletedAt");

-- CreateIndex
CREATE INDEX "contacts_companyId_deletedAt_idx" ON "contacts"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "contacts_deletedAt_idx" ON "contacts"("deletedAt");

-- CreateIndex
CREATE INDEX "contacts_addressId_idx" ON "contacts"("addressId");

-- CreateIndex
CREATE INDEX "contacts_type_idx" ON "contacts"("type");

-- CreateIndex
CREATE INDEX "contacts_isPrimary_idx" ON "contacts"("isPrimary");

-- CreateIndex
CREATE INDEX "departments_deletedAt_idx" ON "departments"("deletedAt");

-- CreateIndex
CREATE INDEX "departments_createdById_idx" ON "departments"("createdById");

-- CreateIndex
CREATE INDEX "drafts_createdById_entityType_idx" ON "drafts"("createdById", "entityType");

-- CreateIndex
CREATE INDEX "drafts_updatedAt_idx" ON "drafts"("updatedAt");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_to_idx" ON "email_logs"("to");

-- CreateIndex
CREATE INDEX "email_logs_createdAt_idx" ON "email_logs"("createdAt");

-- CreateIndex
CREATE INDEX "email_logs_sentAt_idx" ON "email_logs"("sentAt");

-- CreateIndex
CREATE INDEX "employees_departmentId_idx" ON "employees"("departmentId");

-- CreateIndex
CREATE INDEX "employees_managerId_idx" ON "employees"("managerId");

-- CreateIndex
CREATE INDEX "employees_isActive_deletedAt_idx" ON "employees"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "employees_deletedAt_idx" ON "employees"("deletedAt");

-- CreateIndex
CREATE INDEX "external_access_links_purpose_idx" ON "external_access_links"("purpose");

-- CreateIndex
CREATE INDEX "external_access_links_resourceType_resourceId_idx" ON "external_access_links"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "external_access_links_expiresAt_idx" ON "external_access_links"("expiresAt");

-- CreateIndex
CREATE INDEX "external_access_links_revokedAt_idx" ON "external_access_links"("revokedAt");

-- CreateIndex
CREATE INDEX "external_access_links_createdById_idx" ON "external_access_links"("createdById");

-- CreateIndex
CREATE INDEX "form_conditional_rules_formId_isActive_idx" ON "form_conditional_rules"("formId", "isActive");

-- CreateIndex
CREATE INDEX "form_conditional_rules_targetType_targetId_idx" ON "form_conditional_rules"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "form_conditional_rules_isActive_idx" ON "form_conditional_rules"("isActive");

-- CreateIndex
CREATE INDEX "form_conditional_rules_createdById_idx" ON "form_conditional_rules"("createdById");

-- CreateIndex
CREATE INDEX "form_fields_sectionId_idx" ON "form_fields"("sectionId");

-- CreateIndex
CREATE INDEX "form_fields_controlType_idx" ON "form_fields"("controlType");

-- CreateIndex
CREATE INDEX "form_fields_dataType_idx" ON "form_fields"("dataType");

-- CreateIndex
CREATE INDEX "form_fields_createdById_idx" ON "form_fields"("createdById");

-- CreateIndex
CREATE INDEX "form_pages_formId_idx" ON "form_pages"("formId");

-- CreateIndex
CREATE INDEX "form_pages_createdById_idx" ON "form_pages"("createdById");

-- CreateIndex
CREATE INDEX "form_sections_pageId_idx" ON "form_sections"("pageId");

-- CreateIndex
CREATE INDEX "form_sections_createdById_idx" ON "form_sections"("createdById");

-- CreateIndex
CREATE INDEX "form_submissions_formId_status_idx" ON "form_submissions"("formId", "status");

-- CreateIndex
CREATE INDEX "form_submissions_formId_deletedAt_idx" ON "form_submissions"("formId", "deletedAt");

-- CreateIndex
CREATE INDEX "form_submissions_formId_idx" ON "form_submissions"("formId");

-- CreateIndex
CREATE INDEX "form_submissions_status_idx" ON "form_submissions"("status");

-- CreateIndex
CREATE INDEX "form_submissions_deletedAt_idx" ON "form_submissions"("deletedAt");

-- CreateIndex
CREATE INDEX "form_submissions_createdAt_idx" ON "form_submissions"("createdAt");

-- CreateIndex
CREATE INDEX "form_submissions_createdById_idx" ON "form_submissions"("createdById");

-- CreateIndex
CREATE INDEX "forms_status_idx" ON "forms"("status");

-- CreateIndex
CREATE INDEX "forms_createdAt_idx" ON "forms"("createdAt");

-- CreateIndex
CREATE INDEX "forms_createdById_idx" ON "forms"("createdById");

-- CreateIndex
CREATE INDEX "items_type_isActive_idx" ON "items"("type", "isActive");

-- CreateIndex
CREATE INDEX "items_productClassId_idx" ON "items"("productClassId");

-- CreateIndex
CREATE INDEX "items_isActive_deletedAt_idx" ON "items"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "items_deletedAt_idx" ON "items"("deletedAt");

-- CreateIndex
CREATE INDEX "items_modelNumber_idx" ON "items"("modelNumber");

-- CreateIndex
CREATE INDEX "journey_contacts_journeyId_deletedAt_idx" ON "journey_contacts"("journeyId", "deletedAt");

-- CreateIndex
CREATE INDEX "journey_contacts_isPrimary_idx" ON "journey_contacts"("isPrimary");

-- CreateIndex
CREATE INDEX "journey_contacts_deletedAt_idx" ON "journey_contacts"("deletedAt");

-- CreateIndex
CREATE INDEX "journey_interactions_journeyId_deletedAt_idx" ON "journey_interactions"("journeyId", "deletedAt");

-- CreateIndex
CREATE INDEX "journey_interactions_journeyId_idx" ON "journey_interactions"("journeyId");

-- CreateIndex
CREATE INDEX "journey_interactions_interactionType_idx" ON "journey_interactions"("interactionType");

-- CreateIndex
CREATE INDEX "journey_interactions_deletedAt_idx" ON "journey_interactions"("deletedAt");

-- CreateIndex
CREATE INDEX "journey_interactions_createdAt_idx" ON "journey_interactions"("createdAt");

-- CreateIndex
CREATE INDEX "journeys_status_deletedAt_idx" ON "journeys"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "journeys_rsmId_status_idx" ON "journeys"("rsmId", "status");

-- CreateIndex
CREATE INDEX "journeys_customerId_idx" ON "journeys"("customerId");

-- CreateIndex
CREATE INDEX "journeys_dealerId_idx" ON "journeys"("dealerId");

-- CreateIndex
CREATE INDEX "journeys_rsmId_idx" ON "journeys"("rsmId");

-- CreateIndex
CREATE INDEX "journeys_deletedAt_idx" ON "journeys"("deletedAt");

-- CreateIndex
CREATE INDEX "journeys_startDate_idx" ON "journeys"("startDate");

-- CreateIndex
CREATE INDEX "journeys_createdAt_idx" ON "journeys"("createdAt");

-- CreateIndex
CREATE INDEX "machine_statuses_machineId_state_idx" ON "machine_statuses"("machineId", "state");

-- CreateIndex
CREATE INDEX "machine_statuses_machineId_startTime_idx" ON "machine_statuses"("machineId", "startTime");

-- CreateIndex
CREATE INDEX "machine_statuses_machineId_idx" ON "machine_statuses"("machineId");

-- CreateIndex
CREATE INDEX "machine_statuses_state_idx" ON "machine_statuses"("state");

-- CreateIndex
CREATE INDEX "machine_statuses_startTime_idx" ON "machine_statuses"("startTime");

-- CreateIndex
CREATE INDEX "machine_statuses_createdAt_idx" ON "machine_statuses"("createdAt");

-- CreateIndex
CREATE INDEX "machines_type_enabled_idx" ON "machines"("type", "enabled");

-- CreateIndex
CREATE INDEX "machines_enabled_deletedAt_idx" ON "machines"("enabled", "deletedAt");

-- CreateIndex
CREATE INDEX "machines_deletedAt_idx" ON "machines"("deletedAt");

-- CreateIndex
CREATE INDEX "messages_chatId_createdAt_idx" ON "messages"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_chatId_idx" ON "messages"("chatId");

-- CreateIndex
CREATE INDEX "messages_role_idx" ON "messages"("role");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex
CREATE INDEX "notes_entityType_entityId_idx" ON "notes"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "notes_deletedAt_idx" ON "notes"("deletedAt");

-- CreateIndex
CREATE INDEX "notes_createdBy_idx" ON "notes"("createdBy");

-- CreateIndex
CREATE INDEX "ntfy_devices_enabled_isDown_idx" ON "ntfy_devices"("enabled", "isDown");

-- CreateIndex
CREATE INDEX "ntfy_devices_isDown_idx" ON "ntfy_devices"("isDown");

-- CreateIndex
CREATE INDEX "ntfy_devices_deletedAt_idx" ON "ntfy_devices"("deletedAt");

-- CreateIndex
CREATE INDEX "ntfy_devices_createdById_idx" ON "ntfy_devices"("createdById");

-- CreateIndex
CREATE INDEX "option_categories_displayOrder_idx" ON "option_categories"("displayOrder");

-- CreateIndex
CREATE INDEX "option_categories_legacyId_idx" ON "option_categories"("legacyId");

-- CreateIndex
CREATE INDEX "option_details_optionHeaderId_isActive_idx" ON "option_details"("optionHeaderId", "isActive");

-- CreateIndex
CREATE INDEX "option_details_optionHeaderId_idx" ON "option_details"("optionHeaderId");

-- CreateIndex
CREATE INDEX "option_details_itemId_idx" ON "option_details"("itemId");

-- CreateIndex
CREATE INDEX "option_details_isActive_deletedAt_idx" ON "option_details"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "option_details_deletedAt_idx" ON "option_details"("deletedAt");

-- CreateIndex
CREATE INDEX "option_headers_optionCategoryId_isActive_idx" ON "option_headers"("optionCategoryId", "isActive");

-- CreateIndex
CREATE INDEX "option_headers_optionCategoryId_idx" ON "option_headers"("optionCategoryId");

-- CreateIndex
CREATE INDEX "option_headers_isActive_deletedAt_idx" ON "option_headers"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "option_headers_deletedAt_idx" ON "option_headers"("deletedAt");

-- CreateIndex
CREATE INDEX "option_headers_displayOrder_idx" ON "option_headers"("displayOrder");

-- CreateIndex
CREATE INDEX "option_headers_legacyId_idx" ON "option_headers"("legacyId");

-- CreateIndex
CREATE INDEX "option_rule_targets_optionId_idx" ON "option_rule_targets"("optionId");

-- CreateIndex
CREATE INDEX "option_rule_targets_deletedAt_idx" ON "option_rule_targets"("deletedAt");

-- CreateIndex
CREATE INDEX "option_rule_triggers_optionId_idx" ON "option_rule_triggers"("optionId");

-- CreateIndex
CREATE INDEX "option_rule_triggers_deletedAt_idx" ON "option_rule_triggers"("deletedAt");

-- CreateIndex
CREATE INDEX "option_rules_isActive_deletedAt_idx" ON "option_rules"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "option_rules_action_idx" ON "option_rules"("action");

-- CreateIndex
CREATE INDEX "option_rules_priority_idx" ON "option_rules"("priority");

-- CreateIndex
CREATE INDEX "option_rules_deletedAt_idx" ON "option_rules"("deletedAt");

-- CreateIndex
CREATE INDEX "performance_sheet_links_performanceSheetId_idx" ON "performance_sheet_links"("performanceSheetId");

-- CreateIndex
CREATE INDEX "performance_sheet_links_entityType_entityId_idx" ON "performance_sheet_links"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "performance_sheet_links_deletedAt_idx" ON "performance_sheet_links"("deletedAt");

-- CreateIndex
CREATE INDEX "performance_sheet_versions_deletedAt_idx" ON "performance_sheet_versions"("deletedAt");

-- CreateIndex
CREATE INDEX "performance_sheet_versions_createdAt_idx" ON "performance_sheet_versions"("createdAt");

-- CreateIndex
CREATE INDEX "performance_sheets_versionId_deletedAt_idx" ON "performance_sheets"("versionId", "deletedAt");

-- CreateIndex
CREATE INDEX "performance_sheets_versionId_idx" ON "performance_sheets"("versionId");

-- CreateIndex
CREATE INDEX "performance_sheets_deletedAt_idx" ON "performance_sheets"("deletedAt");

-- CreateIndex
CREATE INDEX "product_classes_parentId_idx" ON "product_classes"("parentId");

-- CreateIndex
CREATE INDEX "product_classes_isActive_idx" ON "product_classes"("isActive");

-- CreateIndex
CREATE INDEX "product_classes_depth_idx" ON "product_classes"("depth");

-- CreateIndex
CREATE INDEX "quote_details_quoteId_status_idx" ON "quote_details"("quoteId", "status");

-- CreateIndex
CREATE INDEX "quote_details_status_deletedAt_idx" ON "quote_details"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "quote_details_deletedAt_idx" ON "quote_details"("deletedAt");

-- CreateIndex
CREATE INDEX "quote_details_createdAt_idx" ON "quote_details"("createdAt");

-- CreateIndex
CREATE INDEX "quote_details_createdById_idx" ON "quote_details"("createdById");

-- CreateIndex
CREATE INDEX "quote_headers_status_deletedAt_idx" ON "quote_headers"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "quote_headers_rsmId_idx" ON "quote_headers"("rsmId");

-- CreateIndex
CREATE INDEX "quote_headers_customerId_idx" ON "quote_headers"("customerId");

-- CreateIndex
CREATE INDEX "quote_headers_dealerId_idx" ON "quote_headers"("dealerId");

-- CreateIndex
CREATE INDEX "quote_headers_journeyId_idx" ON "quote_headers"("journeyId");

-- CreateIndex
CREATE INDEX "quote_headers_deletedAt_idx" ON "quote_headers"("deletedAt");

-- CreateIndex
CREATE INDEX "quote_headers_createdAt_idx" ON "quote_headers"("createdAt");

-- CreateIndex
CREATE INDEX "quote_headers_createdById_idx" ON "quote_headers"("createdById");

-- CreateIndex
CREATE INDEX "quote_items_quoteRevisionId_deletedAt_idx" ON "quote_items"("quoteRevisionId", "deletedAt");

-- CreateIndex
CREATE INDEX "quote_items_quoteRevisionId_idx" ON "quote_items"("quoteRevisionId");

-- CreateIndex
CREATE INDEX "quote_items_configurationId_idx" ON "quote_items"("configurationId");

-- CreateIndex
CREATE INDEX "quote_items_itemId_idx" ON "quote_items"("itemId");

-- CreateIndex
CREATE INDEX "quote_items_deletedAt_idx" ON "quote_items"("deletedAt");

-- CreateIndex
CREATE INDEX "quote_items_lineNumber_idx" ON "quote_items"("lineNumber");

-- CreateIndex
CREATE INDEX "quote_notes_quoteRevisionId_deletedAt_idx" ON "quote_notes"("quoteRevisionId", "deletedAt");

-- CreateIndex
CREATE INDEX "quote_notes_deletedAt_idx" ON "quote_notes"("deletedAt");

-- CreateIndex
CREATE INDEX "quote_notes_createdById_idx" ON "quote_notes"("createdById");

-- CreateIndex
CREATE INDEX "quote_terms_quoteRevisionId_idx" ON "quote_terms"("quoteRevisionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- AddForeignKey
ALTER TABLE "quote_notes" ADD CONSTRAINT "quote_notes_quoteRevisionId_fkey" FOREIGN KEY ("quoteRevisionId") REFERENCES "quote_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
