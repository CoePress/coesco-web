import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Edit, FileText, Plus, Calendar, User, Activity } from 'lucide-react';
import { Button, Card, PageHeader, StatusBadge } from '@/components';
import { useApi } from '@/hooks/use-api';
import { IApiResponse } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  updatedById: string;
  createdByName?: string;
  updatedByName?: string;
  pages?: any[];
  _count?: {
    submissions: number;
  };
}

interface Submission {
  id: string;
  status: string;
  createdAt: string;
  submittedBy?: {
    firstName: string;
    lastName: string;
  };
}

const FormDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminContext = location.pathname.startsWith('/admin');
  const isSalesContext = location.pathname.startsWith('/sales');
  const basePath = isAdminContext ? '/admin/forms' : isSalesContext ? '/sales/forms' : '/service/forms';
  const { get } = useApi<IApiResponse<any>>();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    fetchFormDetails();
  }, [id]);

  const fetchFormDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const formResponse = await get(`/forms/${id}`, {
        include: ['pages', '_count']
      });

      if (formResponse?.success && formResponse.data) {
        setForm(formResponse.data);

        const submissionsResponse = await get(`/forms/${id}/submissions`, {
          sort: 'createdAt',
          order: 'desc',
          limit: '5'
        });

        if (submissionsResponse?.success && submissionsResponse.data) {
          const submissions = Array.isArray(submissionsResponse.data)
            ? submissionsResponse.data
            : submissionsResponse.data.items || [];
          setRecentSubmissions(submissions);
        }
      } else {
        setError(formResponse?.error || 'Failed to fetch form details');
      }
    } catch (err) {
      console.error('Error fetching form:', err);
      setError('Failed to load form details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForm = () => {
    navigate(`${basePath}/${id}/submit`);
  };

  const handleEditForm = () => {
    navigate(`/admin/forms/${id}`);
  };

  const handleViewAllSubmissions = () => {
    navigate(`${basePath}/${id}/submissions`);
  };

  const Actions = () => (
    <div className="flex gap-2">
      <Button onClick={() => navigate(basePath)} variant="secondary-outline">
        <ArrowLeft size={16} />
        <span>Back</span>
      </Button>
      {!isAdminContext && (
        <Button onClick={handleSubmitForm}>
          <Plus size={16} />
          <span>Submit Form</span>
        </Button>
      )}
      {isAdminContext && (
        <Button onClick={handleEditForm}>
          <Edit size={16} />
          <span>Edit Form</span>
        </Button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="text-lg">Loading form details...</div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="text-error text-lg mb-4">{error || 'Form not found'}</div>
        <Button onClick={() => navigate(basePath)}>
          Back to Forms
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col">
      <PageHeader
        title={form.name}
        description={form.description}
        actions={<Actions />}
      />

      <div className="p-2 flex flex-col gap-2 flex-1 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <FileText className="text-primary" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-text">
                  {form.pages?.length || 0}
                </div>
                <div className="text-sm text-text-muted">Pages</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <Activity className="text-primary" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-text">
                  {form._count?.submissions || 0}
                </div>
                <div className="text-sm text-text-muted">Submissions</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <User className="text-primary" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-text">
                  {new Date(form.createdAt).toLocaleDateString()}
                </div>
                <div className="text-sm text-text-muted">
                  Created by {form.createdByName || (form.createdById === 'system' ? 'System' : 'Unknown')}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <Calendar className="text-primary" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-text">
                  {new Date(form.updatedAt).toLocaleDateString()}
                </div>
                <div className="text-sm text-text-muted">
                  Updated by {form.updatedByName || (form.updatedById === 'system' ? 'System' : 'Unknown')}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="flex flex-col flex-1 overflow-hidden">
          <div className="p-2 border-b flex items-center justify-between">
            <h3 className="text-sm text-text-muted">Recent Submissions</h3>
            {recentSubmissions.length > 0 && (
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={handleViewAllSubmissions}
              >
                View All
              </Button>
            )}
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <FileText className="text-text-muted mb-2" size={48} />
              <p className="text-text-muted mb-4">No submissions yet</p>
              {!isAdminContext && (
                <Button
                  size="sm"
                  onClick={handleSubmitForm}
                >
                  <Plus size={16} />
                  Submit First Response
                </Button>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-2 flex-1 overflow-y-auto">
              {recentSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-3 bg-surface rounded border border-border hover:bg-surface/80 cursor-pointer transition-colors"
                  onClick={() => navigate(`${basePath}/${id}/submissions/${submission.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-text-muted" />
                    <div>
                      <div className="text-sm font-medium text-text">
                        {submission.submittedBy
                          ? `${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`
                          : 'Anonymous'}
                      </div>
                      <div className="text-xs text-text-muted">
                        {new Date(submission.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <StatusBadge label={submission.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default FormDetail;
