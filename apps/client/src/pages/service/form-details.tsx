import { useState, useEffect, useMemo } from 'react';
import { Edit, Plus, FileText } from 'lucide-react';
import {Button, PageHeader, Table } from '@/components';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { IApiResponse } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';

const FormDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get } = useApi<IApiResponse<any>>();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);

  const include = useMemo(
      () => ["pages.sections.fields"],
      []
  );

  const fetchForm = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    const response = await get(`/forms/${id}`, {
      include
    });

    if (response?.success && response.data) {
      setFormData(response.data);
      const pagesData = response.data.pages?.map((page: any) => ({
        ...page,
        sections: page.sections?.map((section: any) => ({
          ...section,
          fields: section.fields || []
        })) || []
      })) || [];
      setPages(pagesData);
    } else {
      const errorMessage = response?.error || "Failed to fetch form";
      setError(errorMessage);
      toast.error(errorMessage);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchForm();
  }, [id]);

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <>
          <Button
            onClick={() => navigate(`/service/forms/${id}/build`)}
            variant='secondary-outline'
          >
            <Edit size={16} />
            <span>Edit Form</span>
          </Button>
          <Button
            onClick={() => navigate(`/service/forms/${id}/submissions`)}
            variant='secondary-outline'
          >
            <FileText size={16} />
            <span>View Submissions</span>
          </Button>
          {formData?.status === 'PUBLISHED' && (
            <Button
              onClick={() => navigate("submit")}
            >
              <Plus size={16} />
              <span>New Submission</span>
            </Button>
          )}
        </>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="text-lg">Loading form...</div>
      </div>
    );
  }

  if (!formData && !loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="text-error text-lg mb-4">Form not found</div>
        <Button onClick={() => navigate('/service/forms')}>
          Back to Forms
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title={formData.name}
        description={formData.description}
        actions={<Actions />}
        goBack
      />

      {error && (
        <div className="p-2">
          <div className="bg-error/10 border border-error/20 rounded p-2 text-error text-sm">
            {error}
          </div>
        </div>
      )}

      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <div className="flex-1 overflow-hidden">
          <Table
            columns={[
              {
                key: 'label',
                header: 'Field Label'
              },
              {
                key: 'controlType',
                header: 'Control Type'
              },
              {
                key: 'dataType',
                header: 'Data Type'
              },
              {
                key: 'isRequired',
                header: 'Required'
              },
              {
                key: 'variable',
                header: 'Variable'
              }
            ]}
            data={pages.sort((a, b) => a.sequence - b.sequence).flatMap((page, pageIndex) => [
              {
                id: `page-${page.id}`,
                isPage: true,
                pageIndex: pageIndex + 1,
                title: page.title,
                label: `Page ${pageIndex + 1}: ${page.title}`,
                controlType: '',
                dataType: '',
                isRequired: false,
                variable: '',
                dividerClass: 'bg-primary'
              },
              ...(page.sections || []).sort((a: any, b: any) => a.sequence - b.sequence).flatMap((section: any, sectionIndex: any) => [
                {
                  id: `section-${section.id}`,
                  isSection: true,
                  sectionIndex: sectionIndex + 1,
                  title: section.title,
                  description: section.description,
                  label: '',
                  controlType: '',
                  dataType: '',
                  isRequired: false,
                  variable: '',
                  dividerClass: 'bg-primary/20'
                },
                ...((section.fields || []).sort((a: any, b: any) => a.sequence - b.sequence).map((field: any) => ({
                  ...field,
                  isField: true
                })) || [])
              ])
            ])}
            total={pages.reduce((acc, page) => acc + 1 + page.sections.reduce((secAcc: any, section: any) => secAcc + 1 + (section.fields?.length || 0), 0), 0)}
            idField="id"
            className="border border-border rounded-sm overflow-hidden"
            emptyMessage="No fields defined in this form"
          />
        </div>
      </div>
    </div>
  );
};

export default FormDetails;