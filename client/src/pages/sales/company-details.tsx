import { Edit, MapPin, Star, Plus } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { PageHeader, StatusBadge, Table, Tabs } from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import useGetCompanyOverview from "@/hooks/sales/use-get-company-overview";
import { TableColumn } from "@/components/shared/table";
import useGetQuotes from "@/hooks/sales/use-get-quotes";
import useGetJourneys from "@/hooks/sales/use-get-journeys";

const JourneysTab = () => {
  const [sort, setSort] = useState<"createdAt" | "updatedAt">("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [_, setPage] = useState(1);

  const companyId = useParams().id;

  const filter = useMemo(
    () => ({
      customerId: companyId || "",
    }),
    [companyId]
  );

  const include = useMemo(() => ["createdBy"], []);

  const { journeys, pagination } = useGetJourneys({
    filter,
    include,
  });

  const columns: TableColumn<any>[] = [
    {
      key: "name",
      header: "Name",
      className: "text-primary",
      render: (_, row) => (
        <Link to={`/sales/journeys/${row.id}`}>{row.name}</Link>
      ),
    },
    {
      key: "priority",
      header: "Priority",
    },
    {
      key: "status",
      header: "Status",
      render: (value) => <StatusBadge label={value as string} />,
    },
    {
      key: "totalAmount",
      header: "Total",
      render: (value) => formatCurrency(value as number),
    },
    {
      key: "createdBy.name",
      header: "Created By",
      render: (_, row) =>
        row.createdBy ? (
          <Link
            to={`/sales/team/${row.createdBy.id}?tab=journeys`}
            className="hover:underline">
            {`${row.createdBy.firstName} ${row.createdBy.lastName}`}
          </Link>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={journeys || []}
      total={journeys?.length || 0}
      idField="id"
      pagination
      currentPage={pagination.page}
      totalPages={pagination.totalPages}
      onPageChange={setPage}
      sort={sort}
      order={order}
      onSortChange={(newSort, newOrder) => {
        setSort(newSort as "createdAt" | "updatedAt");
        setOrder(newOrder as "asc" | "desc");
      }}
    />
  );
};

const QuotesTab = () => {
  const [sort, setSort] = useState<"createdAt" | "updatedAt">("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [_, setPage] = useState(1);

  const companyId = useParams().id;

  const filter = useMemo(
    () => ({
      journey: {
        customerId: companyId || "",
      },
    }),
    [companyId]
  );

  const include = useMemo(() => ["journey", "createdBy"], []);

  const { quotes, pagination } = useGetQuotes({
    filter,
    include,
  });

  const columns: TableColumn<any>[] = [
    {
      key: "quoteNumber",
      header: "Quote Number",
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`/sales/quotes/${row.id}`}>{row.number}</Link>
      ),
    },
    {
      key: "revision",
      header: "Revision",
    },
    {
      key: "status",
      header: "Status",
      render: (value) => <StatusBadge label={value as string} />,
    },
    {
      key: "totalAmount",
      header: "Total",
      render: (value) => formatCurrency(value as number),
    },
    {
      key: "journey.name",
      header: "Journey",
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`/sales/journeys/${row.journey.id}`}>{row.journey.name}</Link>
      ),
    },
    {
      key: "createdBy.name",
      header: "Created By",
      render: (_, row) =>
        row.createdBy ? (
          <Link
            to={`/sales/team/${row.createdBy.id}?tab=quotes`}
            className="hover:underline">
            {`${row.createdBy.firstName} ${row.createdBy.lastName}`}
          </Link>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={quotes || []}
      total={quotes?.length || 0}
      idField="id"
      pagination
      currentPage={pagination.page}
      totalPages={pagination.totalPages}
      onPageChange={setPage}
      sort={sort}
      order={order}
      onSortChange={(newSort, newOrder) => {
        setSort(newSort as "createdAt" | "updatedAt");
        setOrder(newOrder as "asc" | "desc");
      }}
    />
  );
};

const CompanyDetails = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    return tab && ["journeys", "quotes", "activity"].includes(tab)
      ? tab
      : "overview";
  });

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab === "overview") {
      searchParams.delete("tab");
    } else {
      searchParams.set("tab", activeTab);
    }
    setSearchParams(searchParams);
  }, [activeTab, searchParams, setSearchParams]);

  const companyId = useParams().id;

  const { companyOverview } = useGetCompanyOverview({
    companyId: companyId || "",
  });

  const pageTitle = `${companyOverview?.company?.name}`;
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
            label:
              activeTab === "overview"
                ? "Edit"
                : activeTab === "journeys"
                ? "New Journey"
                : activeTab === "quotes"
                ? "New Quote"
                : "New Activity",
            variant: "primary",
            icon:
              activeTab === "overview" ? (
                <Edit size={16} />
              ) : (
                <Plus size={16} />
              ),
            onClick: () => {},
          },
        ]}
      />

      <Tabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={[
          { label: "Overview", value: "overview" },
          { label: "Journeys", value: "journeys" },
          { label: "Quotes", value: "quotes" },
          { label: "Activity", value: "activity" },
        ]}
      />
      {activeTab === "overview" && (
        <div className="p-2 flex flex-1 flex-col">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-foreground rounded shadow-sm border p-2">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={companyOverview?.company.logoUrl}
                      alt={companyOverview?.company.name}
                      className="h-12 w-12 rounded"
                    />
                    <div>
                      <h2 className="font-semibold text-primary">
                        {companyOverview?.company.name}
                      </h2>
                      <p className="text-sm text-text">
                        {companyOverview?.company.industry || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-text-muted">Website</div>
                    {companyOverview?.company.website ? (
                      <a
                        href={`https://${companyOverview.company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline">
                        {companyOverview.company.website}
                      </a>
                    ) : (
                      <div className="text-sm text-text">-</div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-text-muted">Email</div>
                    {companyOverview?.company.email ? (
                      <a
                        href={`mailto:${companyOverview.company.email}`}
                        className="text-sm text-primary underline">
                        {companyOverview.company.email}
                      </a>
                    ) : (
                      <div className="text-sm text-text">-</div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-text-muted">Phone</div>
                    <a
                      href={`tel:${companyOverview?.company.phone}`}
                      className="text-sm text-text">
                      {companyOverview?.company.phone || "-"}
                    </a>
                  </div>
                  <div>
                    <div className="text-sm text-text-muted">Fax</div>
                    <div className="text-sm text-text">
                      {companyOverview?.company.fax || "-"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-text-muted">Shipping Address</div>
                    <div className="text-text">
                      123 Business Street, Suite 100
                      <br />
                      New York, NY 10001
                    </div>
                  </div>
                  <div>
                    <div className="text-text-muted">Billing Address</div>
                    <div className="text-text">
                      456 Finance Avenue, Floor 3<br />
                      New York, NY 10002
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-foreground rounded shadow-sm border p-2">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium text-text-muted mb-3">
                      Business Details
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-text-muted">Industry</div>
                        <div className="text-sm text-text">
                          {companyOverview?.company.industry || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-text-muted">Founded</div>
                        <div className="text-sm text-text">
                          {companyOverview?.company.yearFounded || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-text-muted">
                          Annual Revenue
                        </div>
                        <div className="text-sm text-text">
                          {formatCurrency(
                            companyOverview?.company.revenue || 0
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-text-muted">
                          Employee Count
                        </div>
                        <div className="text-sm text-text">
                          {companyOverview?.company.employeeCount || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-muted mb-3">
                      Relationship Details
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-text-muted">
                          Customer Since
                        </div>
                        <div className="text-sm text-text">
                          {companyOverview?.company.customerSince
                            ? formatDate(companyOverview?.company.customerSince)
                            : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-text-muted">
                          Payment Terms
                        </div>
                        <div className="text-sm text-text">
                          {companyOverview?.company.paymentTerms || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-text-muted">
                          Credit Limit
                        </div>
                        <div className="text-sm text-text">
                          {formatCurrency(
                            companyOverview?.company.creditLimit || 0
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-foreground rounded shadow-sm border p-2">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-text-muted">
                      Addresses
                    </div>
                    <button className="text-xs text-text-muted hover:text-text flex items-center gap-1 cursor-pointer">
                      View All
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin
                          size={16}
                          className="text-text-muted"
                        />
                        <div>
                          <div className="text-sm text-text">
                            123 Business Street, Suite 100
                          </div>
                          <div className="text-sm text-text-muted">
                            New York, NY 10001
                          </div>
                        </div>
                      </div>
                      <Star
                        size={16}
                        className="text-primary fill-primary cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin
                          size={16}
                          className="text-text-muted"
                        />
                        <div>
                          <div className="text-sm text-text">
                            456 Finance Avenue, Floor 3
                          </div>
                          <div className="text-sm text-text-muted">
                            New York, NY 10002
                          </div>
                        </div>
                      </div>
                      <Star
                        size={16}
                        className="text-neutral-300 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-text-muted">
                        Contacts
                      </div>
                      <button className="text-xs text-text-muted hover:text-text flex items-center gap-1 cursor-pointer">
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
                            <div className="text-sm text-text">John Smith</div>
                            <div className="text-sm text-text-muted">CEO</div>
                          </div>
                        </div>
                        <Star
                          size={16}
                          className="text-primary fill-primary cursor-pointer"
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
                            <div className="text-sm text-text">Mike Wilson</div>
                            <div className="text-sm text-text-muted">
                              Finance Director
                            </div>
                          </div>
                        </div>
                        <Star
                          size={16}
                          className="text-neutral-300 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="grid grid-cols-2 gap-2">
              <div className="bg-foreground rounded shadow-sm border p-2">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-semibold text-text-muted">
                    Activity Summary
                  </h2>
                  <div>
                    <button className="text-text-muted hover:text-neutral-600">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border rounded p-3">
                    <div className="text-sm text-text-muted uppercase">
                      Total Quotes
                    </div>
                    <div className="text-xl font-semibold text-text-muted mt-1">
                      {sampleCustomer.quotes.length}
                    </div>
                    <div className="text-sm text-text mt-1">
                      {formatCurrency(
                        sampleCustomer.quotes.reduce(
                          (sum, q) => sum + q.amount,
                          0
                        )
                      )}{" "}
                      lifetime
                    </div>
                  </div>
                  <div className="border rounded p-3">
                    <div className="text-sm text-text-muted uppercase">
                      Total Orders
                    </div>
                    <div className="text-xl font-semibold text-text-muted mt-1">
                      {sampleCustomer.orders.length}
                    </div>
                    <div className="text-sm text-text mt-1">
                      {formatCurrency(
                        sampleCustomer.orders.reduce(
                          (sum, o) => sum + o.amount,
                          0
                        )
                      )}{" "}
                      lifetime
                    </div>
                  </div>
                  <div className="border rounded p-3">
                    <div className="text-sm text-text-muted uppercase">
                      Last Activity
                    </div>
                    <div className="text-sm font-medium text-text-muted mt-1">
                      {sampleCustomer.activities[0].description}
                    </div>
                    <div className="text-sm text-text-muted mt-1">
                      {formatDate(sampleCustomer.activities[0].date)}
                    </div>
                  </div>
                  <div className="border rounded p-3">
                    <div className="text-sm text-text-muted uppercase">
                      Last Order
                    </div>
                    <div className="text-sm font-medium text-text-muted mt-1">
                      {sampleCustomer.orders[0].id}
                    </div>
                    <div className="text-sm text-text-muted mt-1">
                      {formatDate(sampleCustomer.orders[0].date)}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 bg-primary text-white px-3 py-2 text-sm rounded flex items-center justify-center gap-2 hover:bg-primary/80">
                    <FileText size={16} />
                    New Quote
                  </button>
                  <button className="flex-1 bg-primary text-white px-3 py-2 text-sm rounded flex items-center justify-center gap-2 hover:bg-primary/80">
                    <DollarSign size={16} />
                    New Order
                  </button>
                </div>
              </div>

              <div className="bg-foreground rounded shadow-sm border p-2">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-text-muted">
                    Recent Activity
                  </h3>
                  <button className="text-sm text-primary hover:text-primary/80">
                    View All
                  </button>
                </div>
                <div className="border rounded p-3">
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
                              <span className="font-medium text-text-muted">
                                {activity.user}
                              </span>
                              <span className="text-text-muted">
                                {" "}
                                {activity.description}
                              </span>
                            </div>
                            <div className="text-sm text-text-muted mt-1">
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

      {activeTab === "journeys" && <JourneysTab />}

      {activeTab === "quotes" && <QuotesTab />}

      {activeTab === "orders" && (
        <div className="text-center py-8 text-text-muted">
          This tab content is not implemented.
        </div>
      )}
    </div>
  );
};

export default CompanyDetails;
