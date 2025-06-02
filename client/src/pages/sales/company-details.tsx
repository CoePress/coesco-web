import {
  Edit,
  Phone,
  Mail,
  MapPin,
  Building,
  FileText,
  DollarSign,
  ExternalLink,
  MoreHorizontal,
  Star,
  ChevronDown,
  Download,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PageHeader, StatusBadge, Table, Tabs } from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import useGetCompanyOverview from "@/hooks/sales/use-get-company-overview";
import { TableColumn } from "@/components/shared/table";
import useGetQuotes from "@/hooks/sales/use-get-quotes";

const sampleCompanyMetrics = {
  businessType: "Manufacturer & Supplier",
  relationshipType: "Strategic Partner",
  onTimeDelivery: 98.5,
  qualityRating: 4.8,
  avgOrderValue: 125000,
  orderFrequency: 2.3,
  totalValue: 2500000,
  activeProjects: 3,
  recentActivity: [
    {
      user: "John Smith",
      description: "Updated manufacturing specifications for Project Alpha",
      date: "2024-03-15T10:30:00Z",
      profileImage: "https://i.pravatar.cc/150?img=1",
      type: "manufacturing",
    },
    {
      user: "Sarah Johnson",
      description: "Submitted new supplier qualification documents",
      date: "2024-03-14T15:45:00Z",
      profileImage: "https://i.pravatar.cc/150?img=2",
      type: "supplier",
    },
    {
      user: "Mike Wilson",
      description: "Approved joint development agreement",
      date: "2024-03-13T09:15:00Z",
      profileImage: "https://i.pravatar.cc/150?img=3",
      type: "partnership",
    },
    {
      user: "Lisa Brown",
      description: "Completed quality audit for supplier certification",
      date: "2024-03-12T14:20:00Z",
      profileImage: "https://i.pravatar.cc/150?img=4",
      type: "quality",
    },
    {
      user: "David Chen",
      description: "Updated shared manufacturing capacity",
      date: "2024-03-11T11:30:00Z",
      profileImage: "https://i.pravatar.cc/150?img=5",
      type: "manufacturing",
    },
  ],
};

const QuotesTab = () => {
  const [sort, setSort] = useState<"createdAt" | "updatedAt">("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const companyId = useParams().id;

  // Memoize the filter object to prevent infinite re-renders
  const filter = useMemo(
    () => ({
      journey: {
        customerId: companyId || "",
      },
    }),
    [companyId]
  );

  const columns: TableColumn<any>[] = [
    {
      key: "id",
      header: "Quote Number",
      className: "text-primary",
    },
    {
      key: "quoteDate",
      header: "Quote Date",
    },
    {
      key: "status",
      header: "Status",
      render: (value) => <StatusBadge label={value} />,
    },
    {
      key: "total",
      header: "Total",
    },
  ];

  const { quotes, loading, error, refresh, pagination } = useGetQuotes({
    filter,
  });

  return (
    <Table
      columns={columns}
      data={quotes || []}
      total={pagination?.total || 0}
      currentPage={page}
      totalPages={pagination?.totalPages || 1}
      onPageChange={setPage}
      onSortChange={(sort, order) => {
        setSort(sort as "createdAt" | "updatedAt");
        setOrder(order);
      }}
      sort={sort}
      order={order}
    />
  );
};
const CompanyDetails = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const navigate = useNavigate();

  const companyId = useParams().id;

  const { companyOverview, loading, error } = useGetCompanyOverview({
    companyId: companyId || "",
  });

  const pageTitle = companyOverview?.company?.name;
  const pageDescription = companyOverview?.company?.createdAt
    ? `Customer since ${formatDate(companyOverview.company.createdAt)}`
    : "";

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        backButton
        onBack={() => navigate("/sales/companies")}
        actions={[
          {
            type: "button",
            label: "Export",
            variant: "secondary-outline",
            icon: <Download size={16} />,
            onClick: () => {},
          },
          {
            type: "button",
            label: "Edit",
            variant: "primary",
            icon: <Edit size={16} />,
            onClick: () => {},
          },
        ]}
      />

      <Tabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={[
          { label: "Overview", value: "overview" },
          { label: "Quotes", value: "quotes" },
          { label: "Orders", value: "orders" },
          { label: "Sales", value: "sales" },
          { label: "Activity", value: "activity" },
          { label: "Notes", value: "notes" },
        ]}
      />
      {activeTab === "overview" && (
        <div className="p-2 flex flex-1 flex-col">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-foreground rounded-lg shadow-sm border p-2">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={companyOverview?.company.logoUrl}
                      alt={companyOverview?.company.name}
                      className="h-12 w-12 rounded"
                    />
                    <div>
                      <h2 className="font-semibold text-neutral-400">
                        {companyOverview?.company.name}
                      </h2>
                      <p className="text-sm text-neutral-400">
                        {companyOverview?.company.industry || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-neutral-400">Website</div>
                    {companyOverview?.company.website ? (
                      <a
                        href={`https://${companyOverview.company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline">
                        {companyOverview.company.website}
                      </a>
                    ) : (
                      <div className="text-sm text-neutral-400">-</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400">Email</div>
                    {companyOverview?.company.email ? (
                      <a
                        href={`mailto:${companyOverview.company.email}`}
                        className="text-sm text-primary hover:underline">
                        {companyOverview.company.email}
                      </a>
                    ) : (
                      <div className="text-sm text-neutral-400">-</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400">Phone</div>
                    <a
                      href={`tel:${companyOverview?.company.phone}`}
                      className="text-sm text-neutral-400">
                      {companyOverview?.company.phone || "-"}
                    </a>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400">Fax</div>
                    <div className="text-sm text-neutral-400">
                      {companyOverview?.company.fax || "-"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-neutral-400">Shipping Address</div>
                    <div className="text-neutral-400">
                      123 Business Street, Suite 100
                      <br />
                      New York, NY 10001
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-400">Billing Address</div>
                    <div className="text-neutral-400">
                      456 Finance Avenue, Floor 3<br />
                      New York, NY 10002
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-foreground rounded-lg shadow-sm border p-2">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium text-neutral-400 mb-3">
                      Business Details
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-neutral-400">Industry</div>
                        <div className="text-sm text-neutral-400">
                          {companyOverview?.company.industry || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-400">Founded</div>
                        <div className="text-sm text-neutral-400">
                          {companyOverview?.company.yearFounded || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-400">
                          Annual Revenue
                        </div>
                        <div className="text-sm text-neutral-400">
                          {formatCurrency(
                            companyOverview?.company.revenue || 0
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-400">
                          Employee Count
                        </div>
                        <div className="text-sm text-neutral-400">
                          {companyOverview?.company.employeeCount || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-400 mb-3">
                      Relationship Details
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-neutral-400">
                          Customer Since
                        </div>
                        <div className="text-sm text-neutral-400">
                          {companyOverview?.company.customerSince
                            ? formatDate(companyOverview?.company.customerSince)
                            : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-400">
                          Payment Terms
                        </div>
                        <div className="text-sm text-neutral-400">
                          {companyOverview?.company.paymentTerms || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-400">
                          Credit Limit
                        </div>
                        <div className="text-sm text-neutral-400">
                          {formatCurrency(
                            companyOverview?.company.creditLimit || 0
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-foreground rounded-lg shadow-sm border p-2">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-neutral-400">
                      Addresses
                    </div>
                    <button className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer">
                      View All
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin
                          size={16}
                          className="text-neutral-400"
                        />
                        <div>
                          <div className="text-sm text-neutral-400">
                            123 Business Street, Suite 100
                          </div>
                          <div className="text-xs text-neutral-400">
                            New York, NY 10001
                          </div>
                        </div>
                      </div>
                      <Star
                        size={16}
                        className="text-primary fill-primary"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin
                          size={16}
                          className="text-neutral-400"
                        />
                        <div>
                          <div className="text-sm text-neutral-400">
                            456 Finance Avenue, Floor 3
                          </div>
                          <div className="text-xs text-neutral-400">
                            New York, NY 10002
                          </div>
                        </div>
                      </div>
                      <Star
                        size={16}
                        className="text-neutral-300"
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-neutral-400">
                        Contacts
                      </div>
                      <button className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer">
                        View All
                      </button>
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src="https://i.pravatar.cc/150?img=1"
                            alt="John Smith"
                            className="h-6 w-6 rounded-full"
                          />
                          <div>
                            <div className="text-sm text-neutral-400">
                              John Smith
                            </div>
                            <div className="text-xs text-neutral-400">CEO</div>
                          </div>
                        </div>
                        <Star
                          size={16}
                          className="text-primary fill-primary"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src="https://i.pravatar.cc/150?img=3"
                            alt="Mike Wilson"
                            className="h-6 w-6 rounded-full"
                          />
                          <div>
                            <div className="text-sm text-neutral-400">
                              Mike Wilson
                            </div>
                            <div className="text-xs text-neutral-400">
                              Finance Director
                            </div>
                          </div>
                        </div>
                        <Star
                          size={16}
                          className="text-neutral-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="grid grid-cols-2 gap-2">
              <div className="bg-foreground rounded-lg shadow-sm border p-2">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-semibold text-neutral-400">
                    Activity Summary
                  </h2>
                  <div>
                    <button className="text-neutral-400 hover:text-neutral-600">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border rounded-lg p-3">
                    <div className="text-xs text-neutral-400 uppercase">
                      Total Quotes
                    </div>
                    <div className="text-xl font-semibold text-neutral-400 mt-1">
                      {sampleCustomer.quotes.length}
                    </div>
                    <div className="text-sm text-neutral-400 mt-1">
                      {formatCurrency(
                        sampleCustomer.quotes.reduce(
                          (sum, q) => sum + q.amount,
                          0
                        )
                      )}{" "}
                      lifetime
                    </div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-xs text-neutral-400 uppercase">
                      Total Orders
                    </div>
                    <div className="text-xl font-semibold text-neutral-400 mt-1">
                      {sampleCustomer.orders.length}
                    </div>
                    <div className="text-sm text-neutral-400 mt-1">
                      {formatCurrency(
                        sampleCustomer.orders.reduce(
                          (sum, o) => sum + o.amount,
                          0
                        )
                      )}{" "}
                      lifetime
                    </div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-xs text-neutral-400 uppercase">
                      Last Activity
                    </div>
                    <div className="text-sm font-medium text-neutral-400 mt-1">
                      {sampleCustomer.activities[0].description}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      {formatDate(sampleCustomer.activities[0].date)}
                    </div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-xs text-neutral-400 uppercase">
                      Last Order
                    </div>
                    <div className="text-sm font-medium text-neutral-400 mt-1">
                      {sampleCustomer.orders[0].id}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      {formatDate(sampleCustomer.orders[0].date)}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 bg-primary text-white px-3 py-2 text-sm rounded-md flex items-center justify-center gap-2 hover:bg-primary/80">
                    <FileText size={16} />
                    New Quote
                  </button>
                  <button className="flex-1 bg-primary text-white px-3 py-2 text-sm rounded-md flex items-center justify-center gap-2 hover:bg-primary/80">
                    <DollarSign size={16} />
                    New Order
                  </button>
                </div>
              </div>

              <div className="bg-foreground rounded-lg shadow-sm border p-2">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-neutral-400">
                    Recent Activity
                  </h3>
                  <button className="text-sm text-primary hover:text-primary/80">
                    View All
                  </button>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="space-y-3">
                    {sampleCompanyMetrics.recentActivity.map(
                      (activity, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3">
                          <div className="flex-shrink-0">
                            <img
                              src={activity.profileImage}
                              alt=""
                              className="h-8 w-8 rounded-full"
                            />
                          </div>
                          <div>
                            <div className="text-sm">
                              <span className="font-medium text-neutral-400">
                                {activity.user}
                              </span>
                              <span className="text-neutral-400">
                                {" "}
                                {activity.description}
                              </span>
                            </div>
                            <div className="text-xs text-neutral-400 mt-1">
                              {formatDate(activity.date)}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      )}

      {activeTab === "quotes" && <QuotesTab />}

      {activeTab === "orders" && (
        <div className="text-center py-8 text-neutral-400">
          This tab content is not implemented.
        </div>
      )}
    </div>
  );
};

export default CompanyDetails;
