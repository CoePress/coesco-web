import {
  FileText,
  Users,
  DollarSign,
  BarChart2,
  Calendar,
  Plus,
  Search,
  Filter,
  Eye,
  Copy,
  MoreHorizontal,
  Clock,
  Star,
} from "lucide-react";
import { useState } from "react";

import { formatDate } from "@/utils";
import { Button, PageHeader } from "@/components";

const Reports = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const reportTemplates = [
    {
      id: "sales-performance",
      name: "Sales Performance Report",
      description: "Comprehensive overview of sales metrics and KPIs",
      icon: <BarChart2 size={20} />,
      category: "Sales",
      lastUsed: "2 days ago",
      popular: true,
    },
    {
      id: "customer-analysis",
      name: "Customer Analysis Report",
      description: "Detailed customer segmentation and behavior analysis",
      icon: <Users size={20} />,
      category: "Customer",
      lastUsed: "1 week ago",
      popular: true,
    },
    {
      id: "revenue-forecast",
      name: "Revenue Forecast Report",
      description: "Projected revenue based on historical data and trends",
      icon: <DollarSign size={20} />,
      category: "Financial",
      lastUsed: "3 days ago",
      popular: false,
    },
    {
      id: "quarterly-review",
      name: "Quarterly Business Review",
      description: "Complete quarterly performance and metrics summary",
      icon: <Calendar size={20} />,
      category: "Business",
      lastUsed: "1 month ago",
      popular: true,
    },
  ];

  const recentReports = [
    {
      id: 1,
      name: "Q2 2025 Sales Performance",
      template: "Sales Performance Report",
      createdBy: "Jane Foster",
      createdAt: "2025-06-30",
      status: "completed",
    },
    {
      id: 2,
      name: "TechCorp Customer Analysis",
      template: "Customer Analysis Report",
      createdBy: "Steve Rogers",
      createdAt: "2025-06-28",
      status: "draft",
    },
    {
      id: 3,
      name: "H1 2025 Revenue Review",
      template: "Revenue Forecast Report",
      createdBy: "Tony Stark",
      createdAt: "2025-06-25",
      status: "completed",
    },
  ];

  const pageTitle = "Reports";
  const pageDescription = "Create and manage your business reports";

  return (
    <div className="w-full flex-1">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={
          <>
            <Button
              onClick={() => {}}
              variant="outline">
              <Filter size={16} />
              Filter
            </Button>
            <Button onClick={() => {}}>
              <Plus size={16} />
              New Report
            </Button>
          </>
        }
      />

      <div className="p-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-lg border p-4 mb-4">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search templates..."
                  className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">
                  Report Templates
                </h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {reportTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? "border-primary bg-blue-50"
                          : "border-gray-200 hover:border-primary hover:bg-gray-50"
                      }`}>
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedTemplate === template.id
                              ? "bg-blue-100 text-primary"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                          {template.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {template.name}
                              </h3>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {template.description}
                              </p>
                            </div>
                            {template.popular && (
                              <span className="text-yellow-500">
                                <Star
                                  size={16}
                                  fill="currentColor"
                                />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              {template.category}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={12} />
                              {template.lastUsed}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-gray-900">
                    Template Preview
                  </h2>
                  <div className="flex gap-2">
                    <button className="text-gray-700 px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 hover:bg-gray-100">
                      <Eye size={16} />
                      Preview
                    </button>
                    <button className="text-gray-700 px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 hover:bg-gray-100">
                      <Copy size={16} />
                      Duplicate
                    </button>
                    <button className="bg-primary text-white px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 hover:bg-blue-700">
                      <Plus size={16} />
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                {selectedTemplate ? (
                  <div className="aspect-[8.5/11] bg-gray-50 rounded-lg border border-dashed flex items-center justify-center">
                    <div className="text-center">
                      <FileText
                        size={48}
                        className="mx-auto text-gray-400 mb-2"
                      />
                      <p className="text-sm text-gray-600">
                        Select "Preview" to view the full template
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[8.5/11] bg-gray-50 rounded-lg border border-dashed flex items-center justify-center">
                    <p className="text-sm text-gray-500">
                      Select a template to preview
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">Recent Reports</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Template
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Created By
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentReports.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {report.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {report.template}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {report.createdBy}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                              report.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                            {report.status === "completed" ? (
                              <>
                                <span className="w-1 h-1 mr-1.5 rounded-full bg-green-500" />
                                Completed
                              </>
                            ) : (
                              <>
                                <span className="w-1 h-1 mr-1.5 rounded-full bg-yellow-500" />
                                Draft
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
