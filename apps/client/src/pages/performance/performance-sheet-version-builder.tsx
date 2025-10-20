import { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, GripVertical, Edit2 } from 'lucide-react';
import { Button, Input, PageHeader, Modal, Select } from '@/components';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

type FieldType = 'text' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox';
type FieldSize = 'sm' | 'md' | 'lg' | 'full';

interface Field {
  id: string;
  label: string;
  type: FieldType;
  size: FieldSize;
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
  const { get, patch, post } = useApi<any>();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [versionData, setVersionData] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedSubsectionId, setSelectedSubsectionId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);

  const fetchVersion = async () => {
    if (!id) return;

    setLoading(true);
    const response = await get(`/sales/performance-sheet-versions/${id}`);

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
      await patch(`/sales/performance-sheet-versions/${id}`, {
        sections: sections
      });

      toast.success('Version updated successfully!');
      navigate(`/sales/performance-sheet-versions`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    }
  };

  const handleCancel = () => {
    navigate(`/sales/performance-sheet-versions`);
  };

  const addSection = () => {
    const maxSequence = sections.length > 0
      ? Math.max(...sections.map(s => s.sequence ?? 0))
      : 0;

    const newSection: Section = {
      id: `section-${Date.now()}`,
      label: 'New Section',
      value: `section-${Date.now()}`,
      sequence: maxSequence + 1,
      sections: []
    };

    setSections([...sections, newSection]);
    setSelectedSectionId(newSection.id);
    setSelectedSubsectionId(null);
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
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setSections(sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    ));
  };

  const addSubsection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const maxSequence = section.sections.length > 0
      ? Math.max(...section.sections.map(s => s.sequence ?? 0))
      : 0;

    const newSubsection: Subsection = {
      id: `subsection-${Date.now()}`,
      title: 'New Subsection',
      sequence: maxSequence + 1,
      columns: 2,
      fields: []
    };

    setSections(sections.map(s =>
      s.id === sectionId
        ? { ...s, sections: [...s.sections, newSubsection] }
        : s
    ));

    setSelectedSubsectionId(newSubsection.id);
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
  };

  const updateSubsection = (sectionId: string, subsectionId: string, updates: Partial<Subsection>) => {
    setSections(sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            sections: section.sections.map(subsection =>
              subsection.id === subsectionId ? { ...subsection, ...updates } : subsection
            )
          }
        : section
    ));
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
      size: 'md',
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
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const selectedSubsection = selectedSection?.sections.find(s => s.id === selectedSubsectionId);

  const Actions = () => (
    <div className="flex gap-2">
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
        <Button onClick={() => navigate('/sales/performance-sheet-versions')}>
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
          <div className="flex h-full gap-2">
            <SectionsPanel
              sections={sections}
              selectedSectionId={selectedSectionId}
              onSelectSection={setSelectedSectionId}
              onAddSection={addSection}
              onRemoveSection={removeSection}
              onUpdateSection={updateSection}
            />

            <SubsectionsPanel
              section={selectedSection}
              selectedSubsectionId={selectedSubsectionId}
              onSelectSubsection={setSelectedSubsectionId}
              onAddSubsection={addSubsection}
              onRemoveSubsection={removeSubsection}
              onUpdateSubsection={updateSubsection}
            />

            <FieldsPanel
              section={selectedSection}
              subsection={selectedSubsection}
              onAddField={addField}
              onEditField={(field) => {
                setEditingField(field);
                setIsFieldModalOpen(true);
              }}
              onRemoveField={removeField}
            />
          </div>
        </div>
      </div>

      {isFieldModalOpen && editingField && (
        <FieldEditorModal
          field={editingField}
          onSave={(field) => {
            const isNew = !selectedSubsection?.fields.some(f => f.id === field.id);
            saveField(selectedSectionId!, selectedSubsectionId!, field, isNew);
          }}
          onClose={() => {
            setIsFieldModalOpen(false);
            setEditingField(null);
          }}
        />
      )}
    </div>
  );
};

const SectionsPanel = ({ sections, selectedSectionId, onSelectSection, onAddSection, onRemoveSection, onUpdateSection }: any) => {
  return (
    <div className="w-64 border border-border rounded bg-foreground flex flex-col">
      <div className="p-2 border-b flex items-center justify-between">
        <h3 className="text-sm text-text-muted">Sections (Tabs)</h3>
        <Button onClick={onAddSection} size="sm" variant="secondary-outline">
          <Plus size={14} />
        </Button>
      </div>
      <div className="p-2 flex-1 overflow-y-auto space-y-1">
        {sections.sort((a: any, b: any) => a.sequence - b.sequence).map((section: any) => (
          <div
            key={section.id}
            className={`p-2 rounded cursor-pointer flex items-center gap-2 ${
              selectedSectionId === section.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-surface text-text-muted'
            }`}
          >
            <GripVertical size={14} className="opacity-50" />
            <div
              className="flex-1"
              onClick={() => onSelectSection(section.id)}
            >
              <div className="font-medium text-sm">{section.label}</div>
              <div className="text-xs opacity-75">{section.value}</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveSection(section.id);
              }}
              className="text-error hover:text-error/80"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const SubsectionsPanel = ({ section, selectedSubsectionId, onSelectSubsection, onAddSubsection, onRemoveSubsection, onUpdateSubsection }: any) => {
  if (!section) {
    return (
      <div className="flex-1 border border-border rounded bg-foreground flex items-center justify-center">
        <div className="text-text-muted text-sm">Select a section to view subsections</div>
      </div>
    );
  }

  return (
    <div className="flex-1 border border-border rounded bg-foreground flex flex-col">
      <div className="p-2 border-b flex items-center justify-between">
        <h3 className="text-sm text-text-muted">Subsections</h3>
        <Button onClick={() => onAddSubsection(section.id)} size="sm" variant="secondary-outline">
          <Plus size={14} />
        </Button>
      </div>
      <div className="p-2 flex-1 overflow-y-auto space-y-2">
        {section.sections.sort((a: any, b: any) => a.sequence - b.sequence).map((subsection: any) => (
          <div
            key={subsection.id}
            className={`p-2 border border-border rounded ${
              selectedSubsectionId === subsection.id
                ? 'bg-primary/10 border-primary'
                : 'bg-surface'
            }`}
          >
            <div className="flex items-start gap-2 mb-2">
              <GripVertical size={14} className="opacity-50 mt-1" />
              <div className="flex-1">
                <Input
                  value={subsection.title}
                  onChange={(e) => onUpdateSubsection(section.id, subsection.id, { title: e.target.value })}
                  placeholder="Subsection title"
                  className="mb-1"
                />
                <Select
                  value={subsection.columns.toString()}
                  onChange={(e) => onUpdateSubsection(section.id, subsection.id, { columns: parseInt(e.target.value) })}
                  options={[
                    { value: '1', label: '1 Column' },
                    { value: '2', label: '2 Columns' },
                    { value: '3', label: '3 Columns' },
                    { value: '4', label: '4 Columns' }
                  ]}
                />
              </div>
              <button
                onClick={() => onRemoveSubsection(section.id, subsection.id)}
                className="text-error hover:text-error/80"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <button
              onClick={() => onSelectSubsection(subsection.id)}
              className="w-full text-xs text-left text-text-muted hover:text-text"
            >
              {subsection.fields?.length || 0} fields
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const FieldsPanel = ({ section, subsection, onAddField, onEditField, onRemoveField }: any) => {
  if (!subsection) {
    return (
      <div className="flex-1 border border-border rounded bg-foreground flex items-center justify-center">
        <div className="text-text-muted text-sm">Select a subsection to view fields</div>
      </div>
    );
  }

  return (
    <div className="flex-1 border border-border rounded bg-foreground flex flex-col">
      <div className="p-2 border-b flex items-center justify-between">
        <h3 className="text-sm text-text-muted">Fields</h3>
        <Button onClick={() => onAddField(section.id, subsection.id)} size="sm" variant="secondary-outline">
          <Plus size={14} />
        </Button>
      </div>
      <div className="p-2 flex-1 overflow-y-auto space-y-1">
        {subsection.fields.sort((a: any, b: any) => a.sequence - b.sequence).map((field: any, index: number) => (
          <div
            key={field.id}
            className="p-2 border border-border rounded bg-surface flex items-center gap-2"
          >
            <GripVertical size={14} className="opacity-50" />
            <div className="flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs font-medium">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-text">{field.label}</div>
              <div className="text-xs text-text-muted">
                {field.id} • {field.type} • {field.size}
                {field.required && ' • required'}
              </div>
            </div>
            <button
              onClick={() => onEditField(field)}
              className="text-text-muted hover:text-text"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onRemoveField(section.id, subsection.id, field.id)}
              className="text-error hover:text-error/80"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
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

  const fieldSizes: { value: FieldSize; label: string }[] = [
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
    { value: 'full', label: 'Full Width' }
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
          label="Size"
          value={editedField.size}
          onChange={(e) => setEditedField({ ...editedField, size: e.target.value as FieldSize })}
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
