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
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PageHeader, StatusBadge, Tabs } from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import { sampleCustomer } from "@/utils/sample-data";
import useGetCompanyOverview from "@/hooks/sales/use-get-company-overview";

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
    <div className="w-full flex-1">
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
        <div className="mx-auto p-2">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-foreground rounded-lg shadow-sm border p-2">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={companyOverview?.company.logo}
                      alt={companyOverview?.company.name}
                      className="h-12 w-12 rounded-lg"
                    />
                    <div>
                      <h2 className="font-semibold text-neutral-400">
                        {companyOverview?.company.name}
                      </h2>
                      <p className="text-sm text-neutral-400">
                        {sampleCustomer.industry}
                      </p>
                    </div>
                  </div>
                  <div className="flex">
                    <button className="text-primary hover:text-primary/80">
                      <Star size={18} />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Building
                      size={16}
                      className="text-neutral-400 mt-1 flex-shrink-0"
                    />
                    <div>
                      <div className="text-sm text-neutral-400">
                        {sampleCustomer.type} Customer
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ExternalLink
                      size={16}
                      className="text-neutral-400 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <a
                        href={`https://${sampleCustomer.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline">
                        {sampleCustomer.website}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin
                      size={16}
                      className="text-neutral-400 mt-1 flex-shrink-0"
                    />
                    <div>
                      <div className="text-sm text-neutral-400 font-medium">
                        Primary Address
                      </div>
                      <div className="text-sm text-neutral-400">
                        {
                          sampleCustomer.addresses.find(
                            (addr) => addr.isPrimary
                          )?.street
                        }
                        ,{" "}
                        {
                          sampleCustomer.addresses.find(
                            (addr) => addr.isPrimary
                          )?.city
                        }
                        ,
                        <br />
                        {
                          sampleCustomer.addresses.find(
                            (addr) => addr.isPrimary
                          )?.state
                        }{" "}
                        {
                          sampleCustomer.addresses.find(
                            (addr) => addr.isPrimary
                          )?.zip
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-foreground rounded-lg shadow-sm border p-2">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-semibold text-neutral-400">
                    Primary Contact
                  </h2>
                  <div>
                    <button className="text-neutral-400 hover:text-neutral-600">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={sampleCustomer.primaryContact.profileImage}
                      alt={sampleCustomer.primaryContact.name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <div className="font-medium text-neutral-400">
                        {sampleCustomer.primaryContact.name}
                      </div>
                      <div className="text-sm text-neutral-400">
                        {sampleCustomer.primaryContact.role}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail
                        size={16}
                        className="text-neutral-400 flex-shrink-0"
                      />
                      <a
                        href={`mailto:${sampleCustomer.primaryContact.email}`}
                        className="text-sm text-primary hover:underline">
                        {sampleCustomer.primaryContact.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone
                        size={16}
                        className="text-neutral-400 flex-shrink-0"
                      />
                      <a
                        href={`tel:${sampleCustomer.primaryContact.phone}`}
                        className="text-sm text-neutral-400">
                        {sampleCustomer.primaryContact.phone}
                      </a>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-neutral-400">
                        Additional Contacts
                      </div>
                      <button className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                        View All <ChevronDown size={14} />
                      </button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {sampleCustomer.additionalContacts
                        .slice(0, 2)
                        .map((contact, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2">
                            <img
                              src={contact.profileImage}
                              alt={contact.name}
                              className="h-6 w-6 rounded-full"
                            />
                            <div className="text-sm text-neutral-400">
                              {contact.name}
                            </div>
                            <div className="text-xs text-neutral-400">
                              ({contact.role})
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-foreground rounded-lg shadow-sm border p-2">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-neutral-400">
                    Additional Information
                  </h3>
                  <div>
                    <button className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm font-medium text-neutral-400 mb-3">
                        Business Details
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-neutral-400">
                            Business Type
                          </div>
                          <div className="text-sm text-neutral-400">
                            Manufacturing & Distribution
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-400">
                            Founded
                          </div>
                          <div className="text-sm text-neutral-400">1995</div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-400">
                            Annual Revenue
                          </div>
                          <div className="text-sm text-neutral-400">
                            $25M - $50M
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-400">
                            Employee Count
                          </div>
                          <div className="text-sm text-neutral-400">
                            150-200
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
                            January 2018
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-400">
                            Contract Type
                          </div>
                          <div className="text-sm text-neutral-400">
                            Strategic Partnership
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-400">
                            Payment Terms
                          </div>
                          <div className="text-sm text-neutral-400">
                            Net 30, Credit Limit: $500K
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-400">
                            Primary Products
                          </div>
                          <div className="text-sm text-neutral-400">
                            CNC Parts, Assembly Services
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
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
            </div>
          </div>
        </div>
      )}

      {activeTab === "quotes" && (
        <div className="text-center py-8 text-neutral-400"></div>
      )}

      {activeTab === "orders" && (
        <div className="text-center py-8 text-neutral-400">
          This tab content is not implemented.
        </div>
      )}
    </div>
  );
};

export default CompanyDetails;
