import { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Edit2, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { Button, Input, PageHeader, Modal, Select, Tabs, DatePicker, Textarea, Checkbox } from '@/components';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

type FieldType = 'text' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox';

interface Field {
  id: string;
  label: string;
  type: FieldType;
  size: number;
  sequence: number;
  required: boolean;
  default?: any;
  options?: { value: string; label: string }[];
}

interface Subsection {
  id: string;
  title: string;
  sequence: number;
  columns: number;
  fields: Field[];
}

interface Section {
  id: string;
  label: string;
  value: string;
  sequence: number;
  sections: Subsection[];
}

const PerformanceSheetVersionBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, patch } = useApi<any>();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [versionData, setVersionData] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedSubsectionId, setSelectedSubsectionId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSubsection, setEditingSubsection] = useState<Subsection | null>(null);
  const [isSubsectionModalOpen, setIsSubsectionModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'section' | 'subsection' | 'field', id: string, parentId?: string, subParentId?: string } | null>(null);

  const fetchVersion = async () => {
    if (!id) return;

    setLoading(true);
    const response = await get(`/sales/performance-versions/${id}`);

    if (response?.success && response.data) {
      setVersionData(response.data);
      const sectionsData = response.data.sections || [];
      setSections(sectionsData);

      if (sectionsData.length > 0 && !selectedSectionId) {
        const firstSection = sectionsData.reduce((min: Section, section: Section) =>
          section.sequence < min.sequence ? section : min, sectionsData[0]);
        setSelectedSectionId(firstSection.id);

        if (firstSection.sections?.length > 0) {
          const firstSubsection = firstSection.sections.reduce((min: Subsection, subsection: Subsection) =>
            subsection.sequence < min.sequence ? subsection : min, firstSection.sections[0]);
          setSelectedSubsectionId(firstSubsection.id);
        }
      }
    } else {
      toast.error(response?.error || "Failed to fetch version");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchVersion();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;

    try {
      await patch(`/sales/performance-versions/${id}`, {
        sections: sections
      });

      toast.success('Version updated successfully!');
      navigate(`/admin/performance-sheet-versions`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    }
  };

  const handleCancel = () => {
    navigate(`/admin/performance-sheet-versions`);
  };

  const addSection = () => {
    const maxSequence = sections.length > 0
      ? Math.max(...sections.map(s => s.sequence ?? 0))
      : 0;

    const newSection: Section = {
      id: `section-${Date.now()}`,
      label: '',
      value: '',
      sequence: maxSequence + 1,
      sections: []
    };

    setEditingSection(newSection);
    setIsSectionModalOpen(true);
  };

  const saveSection = (section: Section, isNew: boolean = false) => {
    if (isNew) {
      setSections([...sections, section]);
      setSelectedSectionId(section.id);
      setSelectedSubsectionId(null);
    } else {
      setSections(sections.map(s => s.id === section.id ? section : s));
    }
    setIsSectionModalOpen(false);
    setEditingSection(null);
  };

  const confirmRemoveSection = (sectionId: string) => {
    setDeleteConfirmation({ type: 'section', id: sectionId });
  };

  const removeSection = (sectionId: string) => {
    const remainingSections = sections.filter(s => s.id !== sectionId);
    setSections(remainingSections);

    if (selectedSectionId === sectionId && remainingSections.length > 0) {
      const firstSection = remainingSections.sort((a, b) => a.sequence - b.sequence)[0];
      setSelectedSectionId(firstSection.id);
      if (firstSection.sections?.length > 0) {
        setSelectedSubsectionId(firstSection.sections[0].id);
      }
    } else if (remainingSections.length === 0) {
      setSelectedSectionId(null);
      setSelectedSubsectionId(null);
    }
    setDeleteConfirmation(null);
  };

  const editSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setEditingSection(section);
      setIsSectionModalOpen(true);
    }
  };

  const moveSectionUp = (sectionId: string) => {
    const sortedSections = [...sections].sort((a, b) => a.sequence - b.sequence);
    const index = sortedSections.findIndex(s => s.id === sectionId);

    if (index > 0) {
      [sortedSections[index], sortedSections[index - 1]] = [sortedSections[index - 1], sortedSections[index]];
      const updatedSections = sortedSections.map((section, idx) => ({
        ...section,
        sequence: idx + 1
      }));
      setSections(updatedSections);
    }
  };

  const moveSectionDown = (sectionId: string) => {
    const sortedSections = [...sections].sort((a, b) => a.sequence - b.sequence);
    const index = sortedSections.findIndex(s => s.id === sectionId);

    if (index < sortedSections.length - 1) {
      [sortedSections[index], sortedSections[index + 1]] = [sortedSections[index + 1], sortedSections[index]];
      const updatedSections = sortedSections.map((section, idx) => ({
        ...section,
        sequence: idx + 1
      }));
      setSections(updatedSections);
    }
  };

  const addSubsection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const maxSequence = section.sections.length > 0
      ? Math.max(...section.sections.map(s => s.sequence ?? 0))
      : 0;

    const newSubsection: Subsection = {
      id: `subsection-${Date.now()}`,
      title: '',
      sequence: maxSequence + 1,
      columns: 4,
      fields: []
    };

    setEditingSubsection(newSubsection);
    setIsSubsectionModalOpen(true);
  };

  const saveSubsection = (sectionId: string, subsection: Subsection, isNew: boolean = false) => {
    if (isNew) {
      setSections(sections.map(s =>
        s.id === sectionId
          ? { ...s, sections: [...s.sections, subsection] }
          : s
      ));
      setSelectedSubsectionId(subsection.id);
    } else {
      setSections(sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              sections: section.sections.map(sub =>
                sub.id === subsection.id ? subsection : sub
              )
            }
          : section
      ));
    }
    setIsSubsectionModalOpen(false);
    setEditingSubsection(null);
  };

  const confirmRemoveSubsection = (sectionId: string, subsectionId: string) => {
    setDeleteConfirmation({ type: 'subsection', id: subsectionId, parentId: sectionId });
  };

  const removeSubsection = (sectionId: string, subsectionId: string) => {
    setSections(sections.map(section =>
      section.id === sectionId
        ? { ...section, sections: section.sections.filter(s => s.id !== subsectionId) }
        : section
    ));

    if (selectedSubsectionId === subsectionId) {
      const section = sections.find(s => s.id === sectionId);
      const remainingSubsections = section?.sections.filter(s => s.id !== subsectionId) || [];
      if (remainingSubsections.length > 0) {
        setSelectedSubsectionId(remainingSubsections[0].id);
      } else {
        setSelectedSubsectionId(null);
      }
    }
    setDeleteConfirmation(null);
  };

  const editSubsection = (sectionId: string, subsectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    const subsection = section?.sections.find(s => s.id === subsectionId);
    if (subsection) {
      setEditingSubsection(subsection);
      setIsSubsectionModalOpen(true);
    }
  };

  const moveSubsectionUp = (sectionId: string, subsectionId: string) => {
    setSections(sections.map(section => {
      if (section.id !== sectionId) return section;

      const sortedSubsections = [...section.sections].sort((a, b) => a.sequence - b.sequence);
      const index = sortedSubsections.findIndex(s => s.id === subsectionId);

      if (index > 0) {
        [sortedSubsections[index], sortedSubsections[index - 1]] = [sortedSubsections[index - 1], sortedSubsections[index]];
        const updatedSubsections = sortedSubsections.map((subsection, idx) => ({
          ...subsection,
          sequence: idx + 1
        }));
        return { ...section, sections: updatedSubsections };
      }

      return section;
    }));
  };

  const moveSubsectionDown = (sectionId: string, subsectionId: string) => {
    setSections(sections.map(section => {
      if (section.id !== sectionId) return section;

      const sortedSubsections = [...section.sections].sort((a, b) => a.sequence - b.sequence);
      const index = sortedSubsections.findIndex(s => s.id === subsectionId);

      if (index < sortedSubsections.length - 1) {
        [sortedSubsections[index], sortedSubsections[index + 1]] = [sortedSubsections[index + 1], sortedSubsections[index]];
        const updatedSubsections = sortedSubsections.map((subsection, idx) => ({
          ...subsection,
          sequence: idx + 1
        }));
        return { ...section, sections: updatedSubsections };
      }

      return section;
    }));
  };

  const addField = (sectionId: string, subsectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    const subsection = section?.sections.find(s => s.id === subsectionId);
    if (!subsection) return;

    const maxSequence = subsection.fields.length > 0
      ? Math.max(...subsection.fields.map(f => f.sequence ?? 0))
      : 0;

    const newField: Field = {
      id: 'new.field',
      label: 'New Field',
      type: 'text',
      size: 1,
      sequence: maxSequence + 1,
      required: false
    };

    setEditingField(newField);
    setIsFieldModalOpen(true);
  };

  const saveField = (sectionId: string, subsectionId: string, field: Field, isNew: boolean = false) => {
    setSections(sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            sections: section.sections.map(subsection =>
              subsection.id === subsectionId
                ? {
                    ...subsection,
                    fields: isNew
                      ? [...subsection.fields, field]
                      : subsection.fields.map(f => f.id === field.id ? field : f)
                  }
                : subsection
            )
          }
        : section
    ));

    setIsFieldModalOpen(false);
    setEditingField(null);
  };

  const confirmRemoveField = (sectionId: string, subsectionId: string, fieldId: string) => {
    setDeleteConfirmation({ type: 'field', id: fieldId, parentId: subsectionId, subParentId: sectionId });
  };

  const removeField = (sectionId: string, subsectionId: string, fieldId: string) => {
    setSections(sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            sections: section.sections.map(subsection =>
              subsection.id === subsectionId
                ? { ...subsection, fields: subsection.fields.filter(f => f.id !== fieldId) }
                : subsection
            )
          }
        : section
    ));
    setDeleteConfirmation(null);
  };

  const moveFieldUp = (sectionId: string, subsectionId: string, fieldId: string) => {
    setSections(sections.map(section => {
      if (section.id !== sectionId) return section;

      return {
        ...section,
        sections: section.sections.map(subsection => {
          if (subsection.id !== subsectionId) return subsection;

          const sortedFields = [...subsection.fields].sort((a, b) => a.sequence - b.sequence);
          const index = sortedFields.findIndex(f => f.id === fieldId);

          if (index > 0) {
            [sortedFields[index], sortedFields[index - 1]] = [sortedFields[index - 1], sortedFields[index]];
            const updatedFields = sortedFields.map((field, idx) => ({
              ...field,
              sequence: idx + 1
            }));
            return { ...subsection, fields: updatedFields };
          }

          return subsection;
        })
      };
    }));
  };

  const moveFieldDown = (sectionId: string, subsectionId: string, fieldId: string) => {
    setSections(sections.map(section => {
      if (section.id !== sectionId) return section;

      return {
        ...section,
        sections: section.sections.map(subsection => {
          if (subsection.id !== subsectionId) return subsection;

          const sortedFields = [...subsection.fields].sort((a, b) => a.sequence - b.sequence);
          const index = sortedFields.findIndex(f => f.id === fieldId);

          if (index < sortedFields.length - 1) {
            [sortedFields[index], sortedFields[index + 1]] = [sortedFields[index + 1], sortedFields[index]];
            const updatedFields = sortedFields.map((field, idx) => ({
              ...field,
              sequence: idx + 1
            }));
            return { ...subsection, fields: updatedFields };
          }

          return subsection;
        })
      };
    }));
  };

  const handleSelectSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    const section = sections.find(s => s.id === sectionId);
    if (section?.sections && section.sections.length > 0) {
      const firstSubsection = section.sections.reduce((min: Subsection, subsection: Subsection) =>
        subsection.sequence < min.sequence ? subsection : min, section.sections[0]);
      setSelectedSubsectionId(firstSubsection.id);
    } else {
      setSelectedSubsectionId(null);
    }
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const selectedSubsection = selectedSection?.sections.find(s => s.id === selectedSubsectionId);

  const openPreview = () => {
    const previewWindow = window.open('', 'Performance Sheet Preview', 'width=1200,height=800,scrollbars=yes');

    if (!previewWindow) {
      toast.error('Failed to open preview window. Please allow popups.');
      return;
    }

    const visibleTabs = sections
      .sort((a, b) => a.sequence - b.sequence)
      .map(tab => ({ label: tab.label, value: tab.value }));

    const firstTab = visibleTabs[0]?.value || '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Performance Sheet Preview</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; background: #0a0a0a; color: #fafafa; font-family: system-ui, -apple-system, sans-serif; }
            .col-span-1 { grid-column: span 1 / span 1; }
            .col-span-2 { grid-column: span 2 / span 2; }
            .col-span-3 { grid-column: span 3 / span 3; }
            .col-span-4, .col-span-full { grid-column: 1 / -1; }
          </style>
        </head>
        <body>
          <div id="preview-root"></div>
          <script>
            window.previewState = {
              activeTab: '${firstTab}',
              collapsedSections: new Set(),
              tabs: ${JSON.stringify(visibleTabs)},
              sections: ${JSON.stringify(sections)}
            };

            window.setActiveTab = function(tabValue) {
              window.previewState.activeTab = tabValue;
              window.render();
            };

            window.toggleSection = function(sectionId) {
              if (window.previewState.collapsedSections.has(sectionId)) {
                window.previewState.collapsedSections.delete(sectionId);
              } else {
                window.previewState.collapsedSections.add(sectionId);
              }
              window.render();
            };

            window.render = function() {
              const state = window.previewState;
              const activeTabData = state.sections.find(s => s.value === state.activeTab);
              const root = document.getElementById('preview-root');

              const tabsHtml = state.tabs.map(tab => {
                const isActive = state.activeTab === tab.value;
                return \`
                  <button
                    onclick="window.setActiveTab('\${tab.value}')"
                    style="padding: 0.75rem 1rem; border: none; background: \${isActive ? '#0a0a0a' : 'transparent'}; color: \${isActive ? '#fafafa' : '#a3a3a3'}; cursor: pointer; border-bottom: 2px solid \${isActive ? '#3b82f6' : 'transparent'}; transition: all 0.2s; font-size: 0.875rem;"
                  >
                    \${tab.label}
                  </button>
                \`;
              }).join('');

              const sectionsHtml = activeTabData?.sections?.sort((a, b) => a.sequence - b.sequence).map((section, index) => {
                const isCollapsed = state.collapsedSections.has(section.id);
                const isLastSection = index === activeTabData.sections.length - 1;

                const fieldsHtml = !isCollapsed ? section.fields?.sort((a, b) => a.sequence - b.sequence).map(field => {
                  const span = field.size || 1;
                  const spanClass = span >= 4 ? 'col-span-full' : \`col-span-\${span}\`;

                  let inputHtml = '';
                  if (field.type === 'textarea') {
                    inputHtml = \`
                      <textarea
                        disabled
                        placeholder="Enter value..."
                        style="width: 100%; padding: 0.5rem 0.75rem; background: #262626; border: 1px solid #404040; border-radius: 0.375rem; color: #fafafa; font-size: 0.875rem; opacity: 0.6; min-height: 80px; resize: vertical;"
                      ></textarea>
                    \`;
                  } else if (field.type === 'select') {
                    inputHtml = \`
                      <select
                        disabled
                        style="width: 100%; padding: 0.5rem 0.75rem; background: #262626; border: 1px solid #404040; border-radius: 0.375rem; color: #fafafa; font-size: 0.875rem; opacity: 0.6;"
                      >
                        <option>Select...</option>
                      </select>
                    \`;
                  } else if (field.type === 'checkbox') {
                    inputHtml = \`
                      <input
                        type="checkbox"
                        disabled
                        style="width: 1rem; height: 1rem; opacity: 0.6;"
                      />
                    \`;
                  } else {
                    inputHtml = \`
                      <input
                        type="\${field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}"
                        disabled
                        placeholder="Enter value..."
                        style="width: 100%; padding: 0.5rem 0.75rem; background: #262626; border: 1px solid #404040; border-radius: 0.375rem; color: #fafafa; font-size: 0.875rem; opacity: 0.6;"
                      />
                    \`;
                  }

                  return \`
                    <div class="\${spanClass}">
                      <label style="display: block; font-size: 0.875rem; color: #a3a3a3; margin-bottom: 0.5rem;">
                        \${field.label}\${field.required ? ' *' : ''}
                      </label>
                      \${inputHtml}
                    </div>
                  \`;
                }).join('') : '';

                return \`
                  <div style="padding-bottom: 2rem; \${!isLastSection ? 'margin-bottom: 2rem; border-bottom: 1px solid #404040;' : ''}">
                    <div style="display: flex; align-items: center; justify-content: space-between; \${!isCollapsed ? 'margin-bottom: 1rem;' : ''}">
                      <h2 style="font-size: 1.125rem; font-weight: 600; color: #fafafa; margin: 0;">\${section.title}</h2>
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 0.875rem; color: #a3a3a3;">0/\${section.fields?.length || 0}</span>
                        <button
                          onclick="window.toggleSection('\${section.id}')"
                          style="background: none; border: none; color: #a3a3a3; cursor: pointer; padding: 0.25rem; display: flex; align-items: center;"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="transform: \${isCollapsed ? '' : 'rotate(180deg)'}; transition: transform 0.2s;">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                      </div>
                    </div>
                    \${!isCollapsed ? \`
                      <div style="display: grid; gap: 1rem; grid-template-columns: repeat(\${section.columns || 2}, minmax(0, 1fr));">
                        \${fieldsHtml}
                      </div>
                    \` : ''}
                  </div>
                \`;
              }).join('') || '<p style="color: #a3a3a3; text-align: center; padding: 2rem;">No sections defined for this tab</p>';

              root.innerHTML = \`
                <div style="min-height: 100vh; background: #0a0a0a;">
                  <div style="border-bottom: 1px solid #404040; background: #171717; padding: 1.5rem 2rem;">
                    <h1 style="font-size: 1.5rem; font-weight: 600; color: #fafafa; margin: 0;">Performance Sheet Preview</h1>
                    <p style="font-size: 0.875rem; color: #a3a3a3; margin: 0.25rem 0 0 0;">Version Preview</p>
                  </div>

                  <div style="border-bottom: 1px solid #404040; background: #171717;">
                    <div style="display: flex; gap: 0.5rem; padding: 0 2rem;">
                      \${tabsHtml}
                    </div>
                  </div>

                  <div style="display: flex; justify-content: center; width: 100%;">
                    <div style="padding: 2rem; max-width: 64rem; width: 100%;">
                      \${sectionsHtml}
                    </div>
                  </div>
                </div>
              \`;
            };

            window.render();
          </script>
        </body>
      </html>
    `;

    previewWindow.document.open();
    previewWindow.document.write(html);
    previewWindow.document.close();
  };

  const Actions = () => (
    <div className="flex gap-2">
      <Button onClick={openPreview} variant='secondary-outline'>
        <Eye size={16} />
        Preview
      </Button>
      <Button onClick={handleCancel} variant='secondary-outline'>
        <X size={16} />
        Cancel
      </Button>
      <Button onClick={handleSave}>
        <Save size={16} />
        Save Changes
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="text-lg">Loading version...</div>
      </div>
    );
  }

  if (!versionData && !loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="text-error text-lg mb-4">Version not found</div>
        <Button onClick={() => navigate('/admin/performance-sheet-versions')}>
          Back to Versions
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title={`Edit Version: ${versionData?.id?.slice(0, 8)}`}
        description="Design and configure your performance sheet version"
        actions={<Actions />}
      />

      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-3 h-full gap-2">
            <SectionsPanel
              sections={sections}
              selectedSectionId={selectedSectionId}
              onSelectSection={handleSelectSection}
              onAddSection={addSection}
              onEditSection={editSection}
              onRemoveSection={confirmRemoveSection}
              onMoveUp={moveSectionUp}
              onMoveDown={moveSectionDown}
            />

            <SubsectionsPanel
              section={selectedSection}
              selectedSubsectionId={selectedSubsectionId}
              onSelectSubsection={setSelectedSubsectionId}
              onAddSubsection={addSubsection}
              onEditSubsection={editSubsection}
              onRemoveSubsection={confirmRemoveSubsection}
              onMoveUp={moveSubsectionUp}
              onMoveDown={moveSubsectionDown}
            />

            <FieldsPanel
              section={selectedSection}
              subsection={selectedSubsection}
              onAddField={addField}
              onEditField={(field: any) => {
                setEditingField(field);
                setIsFieldModalOpen(true);
              }}
              onRemoveField={confirmRemoveField}
              onMoveUp={moveFieldUp}
              onMoveDown={moveFieldDown}
            />
          </div>
        </div>
      </div>

      {isSectionModalOpen && editingSection && (
        <SectionEditorModal
          section={editingSection}
          onSave={(section: any) => {
            const isNew = !sections.some(s => s.id === section.id);
            saveSection(section, isNew);
          }}
          onClose={() => {
            setIsSectionModalOpen(false);
            setEditingSection(null);
          }}
        />
      )}

      {isSubsectionModalOpen && editingSubsection && (
        <SubsectionEditorModal
          subsection={editingSubsection}
          onSave={(subsection : any) => {
            const isNew = !selectedSection?.sections.some(s => s.id === subsection.id);
            saveSubsection(selectedSectionId!, subsection, isNew);
          }}
          onClose={() => {
            setIsSubsectionModalOpen(false);
            setEditingSubsection(null);
          }}
        />
      )}

      {isFieldModalOpen && editingField && (
        <FieldEditorModal
          field={editingField}
          onSave={(field : any) => {
            const isNew = !selectedSubsection?.fields.some(f => f.id === field.id);
            saveField(selectedSectionId!, selectedSubsectionId!, field, isNew);
          }}
          onClose={() => {
            setIsFieldModalOpen(false);
            setEditingField(null);
          }}
        />
      )}

      {deleteConfirmation && (
        <Modal isOpen={true} onClose={() => setDeleteConfirmation(null)} title="Confirm Delete" size="sm">
          <div className="space-y-4">
            <p className="text-text">
              Are you sure you want to delete this {deleteConfirmation.type}? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary-outline" onClick={() => setDeleteConfirmation(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteConfirmation.type === 'section') {
                    removeSection(deleteConfirmation.id);
                  } else if (deleteConfirmation.type === 'subsection') {
                    removeSubsection(deleteConfirmation.subParentId!, deleteConfirmation.id);
                  } else if (deleteConfirmation.type === 'field') {
                    removeField(deleteConfirmation.subParentId!, deleteConfirmation.parentId!, deleteConfirmation.id);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const SectionsPanel = ({ sections, selectedSectionId, onSelectSection, onAddSection, onEditSection, onRemoveSection, onMoveUp, onMoveDown }: any) => {
  const sortedSections = [...sections].sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="border border-border rounded bg-foreground flex flex-col overflow-hidden">
      <div className="p-2 border-b flex items-center justify-between">
        <h3 className="text-sm text-text-muted">Tabs</h3>
        <Button onClick={onAddSection} size="sm" variant="secondary-outline">
          <Plus size={14} />
        </Button>
      </div>
      <div className="p-2 flex-1 overflow-y-auto space-y-2">
        {sortedSections.map((section: any, index: number) => (
          <div
            key={section.id}
            className={`border border-border rounded ${
              selectedSectionId === section.id
                ? 'bg-primary/10 border-primary'
                : 'bg-surface'
            }`}
          >
            <div
              className="p-2 cursor-pointer"
              onClick={() => onSelectSection(section.id)}
            >
              <div className="font-medium text-sm text-text">{section.label}</div>
              <div className="text-xs text-text-muted">{section.value}</div>
              <div className="text-xs text-text-muted">{section.sections?.length || 0} sections</div>
            </div>
            <div className="flex gap-1 p-2 pt-0">
              <button
                onClick={() => onMoveUp(section.id)}
                disabled={index === 0}
                className="flex-1 px-2 py-1 text-xs bg-surface border border-border rounded text-text hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => onMoveDown(section.id)}
                disabled={index === sortedSections.length - 1}
                className="flex-1 px-2 py-1 text-xs bg-surface border border-border rounded text-text hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ChevronDown size={14} />
              </button>
              <button
                onClick={() => onEditSection(section.id)}
                className="flex-1 px-2 py-1 text-xs bg-surface border border-border rounded text-text hover:bg-background transition-colors flex items-center justify-center"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onRemoveSection(section.id)}
                className="flex-1 px-2 py-1 text-xs bg-error/20 border border-error/50 rounded text-error hover:bg-error/30 transition-colors flex items-center justify-center"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SubsectionsPanel = ({ section, selectedSubsectionId, onSelectSubsection, onAddSubsection, onEditSubsection, onRemoveSubsection, onMoveUp, onMoveDown }: any) => {
  if (!section) {
    return (
      <div className="border border-border rounded bg-foreground flex items-center justify-center">
        <div className="text-text-muted text-sm">Select a tab to view sections</div>
      </div>
    );
  }

  const sortedSubsections = [...section.sections].sort((a: any, b: any) => a.sequence - b.sequence);

  return (
    <div className="border border-border rounded bg-foreground flex flex-col overflow-hidden">
      <div className="p-2 border-b flex items-center justify-between">
        <h3 className="text-sm text-text-muted">Sections</h3>
        <Button onClick={() => onAddSubsection(section.id)} size="sm" variant="secondary-outline">
          <Plus size={14} />
        </Button>
      </div>
      <div className="p-2 flex-1 overflow-y-auto space-y-2">
        {sortedSubsections.map((subsection: any, index: number) => (
          <div
            key={subsection.id}
            className={`border border-border rounded ${
              selectedSubsectionId === subsection.id
                ? 'bg-primary/10 border-primary'
                : 'bg-surface'
            }`}
          >
            <div
              className="p-2 cursor-pointer"
              onClick={() => onSelectSubsection(subsection.id)}
            >
              <div className="font-medium text-sm text-text">{subsection.title}</div>
              <div className="text-xs text-text-muted">{subsection.id}</div>
              <div className="text-xs text-text-muted">{subsection.fields?.length || 0} fields</div>
            </div>
            <div className="flex gap-1 p-2 pt-0">
              <button
                onClick={() => onMoveUp(section.id, subsection.id)}
                disabled={index === 0}
                className="flex-1 px-2 py-1 text-xs bg-surface border border-border rounded text-text hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => onMoveDown(section.id, subsection.id)}
                disabled={index === sortedSubsections.length - 1}
                className="flex-1 px-2 py-1 text-xs bg-surface border border-border rounded text-text hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ChevronDown size={14} />
              </button>
              <button
                onClick={() => onEditSubsection(section.id, subsection.id)}
                className="flex-1 px-2 py-1 text-xs bg-surface border border-border rounded text-text hover:bg-background transition-colors flex items-center justify-center"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onRemoveSubsection(section.id, subsection.id)}
                className="flex-1 px-2 py-1 text-xs bg-error/20 border border-error/50 rounded text-error hover:bg-error/30 transition-colors flex items-center justify-center"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FieldsPanel = ({ section, subsection, onAddField, onEditField, onRemoveField, onMoveUp, onMoveDown }: any) => {
  if (!subsection) {
    return (
      <div className="border border-border rounded bg-foreground flex items-center justify-center">
        <div className="text-text-muted text-sm">Select a section to view fields</div>
      </div>
    );
  }

  const sortedFields = [...subsection.fields].sort((a: any, b: any) => a.sequence - b.sequence);

  return (
    <div className="border border-border rounded bg-foreground flex flex-col">
      <div className="p-2 border-b flex items-center justify-between">
        <h3 className="text-sm text-text-muted">Fields</h3>
        <Button onClick={() => onAddField(section.id, subsection.id)} size="sm" variant="secondary-outline">
          <Plus size={14} />
        </Button>
      </div>
      <div className="p-2 flex-1 overflow-y-auto space-y-2">
        {sortedFields.map((field: any, index: number) => (
          <div
            key={field.id}
            className="border border-border rounded bg-surface"
          >
            <div className="p-2 flex items-center gap-2">
              <div className="flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-text">{field.label}</div>
                <div className="text-xs text-text-muted">
                  {field.id} • {field.type} • span {field.size}
                  {field.required && ' • required'}
                </div>
              </div>
            </div>
            <div className="flex gap-1 p-2 pt-0">
              <button
                onClick={() => onMoveUp(section.id, subsection.id, field.id)}
                disabled={index === 0}
                className="flex-1 px-2 py-1 text-xs bg-surface border border-border rounded text-text hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => onMoveDown(section.id, subsection.id, field.id)}
                disabled={index === sortedFields.length - 1}
                className="flex-1 px-2 py-1 text-xs bg-surface border border-border rounded text-text hover:bg-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ChevronDown size={14} />
              </button>
              <button
                onClick={() => onEditField(field)}
                className="flex-1 px-2 py-1 text-xs bg-surface border border-border rounded text-text hover:bg-background transition-colors flex items-center justify-center"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onRemoveField(section.id, subsection.id, field.id)}
                className="flex-1 px-2 py-1 text-xs bg-error/20 border border-error/50 rounded text-error hover:bg-error/30 transition-colors flex items-center justify-center"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SectionEditorModal = ({ section, onSave, onClose }: any) => {
  const [editedSection, setEditedSection] = useState<Section>(section);

  return (
    <Modal isOpen={true} onClose={onClose} title={section.label ? "Edit Tab" : "Add Tab"} size="md">
      <div className="space-y-4">
        <Input
          label="Tab Label"
          value={editedSection.label}
          onChange={(e) => setEditedSection({ ...editedSection, label: e.target.value })}
          placeholder="e.g., Buyer Details"
        />

        <Input
          label="Tab Value (identifier)"
          value={editedSection.value}
          onChange={(e) => setEditedSection({ ...editedSection, value: e.target.value })}
          placeholder="e.g., buyer-details"
        />

        <div className="flex gap-2 justify-end">
          <Button variant="secondary-outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(editedSection)}>
            Save Tab
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const SubsectionEditorModal = ({ subsection, onSave, onClose }: any) => {
  const [editedSubsection, setEditedSubsection] = useState<Subsection>(subsection);

  return (
    <Modal isOpen={true} onClose={onClose} title={subsection.title ? "Edit Section" : "Add Section"} size="md">
      <div className="space-y-4">
        <Input
          label="Section Title"
          value={editedSubsection.title}
          onChange={(e) => setEditedSubsection({ ...editedSubsection, title: e.target.value })}
          placeholder="e.g., Quote Dates"
        />

        <Input
          label="Number of Columns"
          type="number"
          value={editedSubsection.columns.toString()}
          onChange={(e) => setEditedSubsection({ ...editedSubsection, columns: parseInt(e.target.value) || 4 })}
          placeholder="4"
        />

        <div className="flex gap-2 justify-end">
          <Button variant="secondary-outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(editedSubsection)}>
            Save Section
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const FieldEditorModal = ({ field, onSave, onClose }: any) => {
  const [editedField, setEditedField] = useState<Field>(field);

  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'select', label: 'Select' },
    { value: 'checkbox', label: 'Checkbox' }
  ];

  const fieldSizes: { value: string; label: string }[] = [
    { value: '1', label: 'Span 1 Column' },
    { value: '2', label: 'Span 2 Columns' },
    { value: '3', label: 'Span 3 Columns' },
    { value: '4', label: 'Span 4 Columns (Full Width)' }
  ];

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Field" size="md">
      <div className="space-y-4">
        <Input
          label="Field ID (dot notation)"
          value={editedField.id}
          onChange={(e) => setEditedField({ ...editedField, id: e.target.value })}
          placeholder="e.g., rfq.dates.date"
        />

        <Input
          label="Label"
          value={editedField.label}
          onChange={(e) => setEditedField({ ...editedField, label: e.target.value })}
          placeholder="Field label"
        />

        <Select
          label="Type"
          value={editedField.type}
          onChange={(e) => setEditedField({ ...editedField, type: e.target.value as FieldType })}
          options={fieldTypes}
        />

        <Select
          label="Size (Column Span)"
          value={editedField.size.toString()}
          onChange={(e) => setEditedField({ ...editedField, size: parseInt(e.target.value) })}
          options={fieldSizes}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="required"
            checked={editedField.required}
            onChange={(e) => setEditedField({ ...editedField, required: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="required" className="text-sm text-text">Required</label>
        </div>

        {editedField.type === 'select' && (
          <div>
            <label className="text-sm text-text-muted mb-2 block">Options (JSON)</label>
            <textarea
              value={JSON.stringify(editedField.options || [], null, 2)}
              onChange={(e) => {
                try {
                  const options = JSON.parse(e.target.value);
                  setEditedField({ ...editedField, options });
                } catch (error) {
                  // Invalid JSON, ignore
                }
              }}
              className="w-full p-2 border border-border rounded bg-background text-text font-mono text-xs"
              rows={8}
            />
          </div>
        )}

        <Input
          label="Default Value"
          value={editedField.default || ''}
          onChange={(e) => setEditedField({ ...editedField, default: e.target.value })}
          placeholder="Optional default value"
        />

        <div className="flex gap-2 justify-end">
          <Button variant="secondary-outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(editedField)}>
            Save Field
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PerformanceSheetVersionBuilder;
