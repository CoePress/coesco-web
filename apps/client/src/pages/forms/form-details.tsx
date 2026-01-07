import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Edit, FileText, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";

interface Field {
  id: string;
  label: string;
  variable: string;
  controlType: string;
  dataType: string;
  isRequired: boolean;
  sequence: number;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  sequence: number;
  fields: Field[];
}

interface Page {
  id: string;
  title: string;
  sequence: number;
  sections: Section[];
}

interface Form {
  id: string;
  name: string;
  description?: string;
  status: string;
  pages: Page[];
}

interface ApiResponse {
  success: boolean;
  data: Form;
}

const FormDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, get } = useApi<ApiResponse>();
  const [pages, setPages] = useState<Page[]>([]);

  useEffect(() => {
    if (id) {
      get(`/forms/${id}?include=${JSON.stringify(["pages.sections.fields"])}`);
    }
  }, [id]);

  useEffect(() => {
    if (data?.data) {
      const pagesData = data.data.pages?.map((page) => ({
        ...page,
        sections: page.sections?.map((section) => ({
          ...section,
          fields: section.fields || [],
        })) || [],
      })) || [];
      setPages(pagesData.sort((a, b) => a.sequence - b.sequence));
    }
  }, [data]);

  const form = data?.data;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || "Form not found"}</p>
        <Button onClick={() => navigate("/forms")}>Back to Forms</Button>
      </div>
    );
  }

  const flattenedItems = pages.flatMap((page, pageIndex) => [
    {
      id: `page-${page.id}`,
      type: "page" as const,
      label: `Page ${pageIndex + 1}: ${page.title}`,
      controlType: "",
      dataType: "",
      isRequired: false,
      variable: "",
    },
    ...page.sections.flatMap((section, sectionIndex) => [
      {
        id: `section-${section.id}`,
        type: "section" as const,
        label: `Section ${sectionIndex + 1}: ${section.title}`,
        controlType: "",
        dataType: "",
        isRequired: false,
        variable: "",
      },
      ...section.fields.map((field) => ({
        id: field.id,
        type: "field" as const,
        label: field.label,
        controlType: field.controlType,
        dataType: field.dataType,
        isRequired: field.isRequired,
        variable: field.variable,
      })),
    ]),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="border-b px-4 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/forms")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{form.name}</h1>
            <p className="text-sm text-muted-foreground">
              {form.description || "No description"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to={`/forms/${id}/edit`}>
                <Edit className="size-4" />
                Edit Form
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/forms/${id}/submissions`}>
                <FileText className="size-4" />
                View Submissions
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/forms/${id}/submit`}>
                <Plus className="size-4" />
                New Submission
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-md border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-sm font-medium text-muted-foreground">
                <th className="px-4 py-3">Field Label</th>
                <th className="px-4 py-3">Control Type</th>
                <th className="px-4 py-3">Data Type</th>
                <th className="px-4 py-3">Required</th>
                <th className="px-4 py-3">Variable</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {flattenedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No fields defined in this form
                  </td>
                </tr>
              ) : (
                flattenedItems.map((item) => (
                  <tr
                    key={item.id}
                    className={
                      item.type === "page"
                        ? "bg-primary/10 font-medium"
                        : item.type === "section"
                        ? "bg-muted/30 font-medium text-sm"
                        : "hover:bg-muted/20"
                    }
                  >
                    <td className="px-4 py-3">
                      {item.type === "page" && (
                        <span className="text-primary">{item.label}</span>
                      )}
                      {item.type === "section" && (
                        <span className="pl-4 text-muted-foreground">{item.label}</span>
                      )}
                      {item.type === "field" && (
                        <span className="pl-8">{item.label}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.controlType || "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.dataType || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {item.type === "field" && (
                        <span
                          className={`text-xs ${
                            item.isRequired ? "text-primary" : "text-muted-foreground"
                          }`}
                        >
                          {item.isRequired ? "Yes" : "No"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {item.variable || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FormDetails;
