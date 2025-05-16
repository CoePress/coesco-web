import {
  Edit,
  Phone,
  Mail,
  MapPin,
  Building,
  CheckCircle,
  XCircle,
  Plus,
  FileText,
  DollarSign,
  ExternalLink,
  MoreHorizontal,
  Star,
  ChevronDown,
  Download,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader, StatusBadge, Tabs } from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import { sampleCustomer } from "@/utils/sample-data";

const CustomerDetails = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const navigate = useNavigate();

  const pageTitle = `${sampleCustomer.name}`;
  const pageDescription = `Customer since ${formatDate(
    sampleCustomer.createdAt
  )}`;

  return (
    <div className="w-full flex-1">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        backButton
        onBack={() => navigate("/sales/customers")}
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
          { label: "Quotes & Orders", value: "quotes" },
          { label: "Activity", value: "activity" },
          { label: "Notes & Files", value: "notes" },
          { label: "Settings", value: "settings" },
        ]}
      />

      <div className="mx-auto p-4">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-foreground rounded-lg shadow-sm border p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={sampleCustomer.logo}
                    alt={sampleCustomer.name}
                    className="h-12 w-12 rounded-lg"
                  />
                  <div>
                    <h2 className="font-semibold text-neutral-400">
                      {sampleCustomer.name}
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
                        sampleCustomer.addresses.find((addr) => addr.isPrimary)
                          ?.street
                      }
                      ,{" "}
                      {
                        sampleCustomer.addresses.find((addr) => addr.isPrimary)
                          ?.city
                      }
                      ,
                      <br />
                      {
                        sampleCustomer.addresses.find((addr) => addr.isPrimary)
                          ?.state
                      }{" "}
                      {
                        sampleCustomer.addresses.find((addr) => addr.isPrimary)
                          ?.zip
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-foreground rounded-lg shadow-sm border p-4">
              <div className="flex justify-between items-start mb-4">
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

            <div className="bg-foreground rounded-lg shadow-sm border p-4">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-semibold text-neutral-400">
                  Activity Summary
                </h2>
                <div>
                  <button className="text-neutral-400 hover:text-neutral-600">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="bg-foreground rounded-lg shadow-sm border">
            <div className="p-4">
              {activeTab === "overview" && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-neutral-400">
                        Recent Quotes
                      </h3>
                      <button className="text-sm text-primary hover:text-primary/80">
                        View All
                      </button>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-foreground">
                          <tr>
                            <th
                              scope="col"
                              className="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">
                              ID
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">
                              Date
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">
                              Status
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-foreground divide-y divide-neutral-400">
                          {sampleCustomer.quotes.map((quote, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-neutral-600 cursor-pointer">
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-primary">
                                {quote.id}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-neutral-400">
                                {formatDate(quote.date)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <StatusBadge
                                  label={quote.status}
                                  icon={
                                    quote.status === "Accepted"
                                      ? CheckCircle
                                      : XCircle
                                  }
                                  variant={
                                    quote.status === "Accepted"
                                      ? "success"
                                      : quote.status === "Pending"
                                      ? "warning"
                                      : "default"
                                  }
                                />
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-neutral-400">
                                {formatCurrency(quote.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-neutral-400">
                        Recent Orders
                      </h3>
                      <button className="text-sm text-primary hover:text-primary/80">
                        View All
                      </button>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-neutral-400">
                        <thead className="bg-foreground">
                          <tr>
                            <th
                              scope="col"
                              className="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">
                              ID
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">
                              Date
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">
                              Status
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-2 text-left text-xs font-medium text-neutral-400 uppercase">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-foreground divide-y divide-neutral-400">
                          {sampleCustomer.orders.map((order, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-neutral-600 cursor-pointer">
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-primary">
                                {order.id}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-neutral-400">
                                {formatDate(order.date)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <StatusBadge
                                  label={order.status}
                                  icon={
                                    order.status === "Completed"
                                      ? CheckCircle
                                      : XCircle
                                  }
                                  variant={
                                    order.status === "Completed"
                                      ? "success"
                                      : order.status === "In Progress"
                                      ? "info"
                                      : "default"
                                  }
                                />
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-neutral-400">
                                {formatCurrency(order.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-neutral-400">
                        Recent Activities
                      </h3>
                      <button className="text-sm text-primary hover:text-primary/80">
                        View All
                      </button>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="space-y-3">
                        {sampleCustomer.activities.map((activity, idx) => (
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
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-neutral-400">Notes</h3>
                      <button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
                        <Plus size={14} />
                        Add Note
                      </button>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="space-y-4">
                        {sampleCustomer.notes.map((note, idx) => (
                          <div
                            key={idx}
                            className="border-b pb-3 last:border-b-0 last:pb-0">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-2">
                                <img
                                  src={note.profileImage}
                                  alt=""
                                  className="h-6 w-6 rounded-full"
                                />
                                <span className="text-sm font-medium text-neutral-400">
                                  {note.author}
                                </span>
                              </div>
                              <span className="text-xs text-neutral-400">
                                {formatDate(note.date)}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-400 mt-2">
                              {note.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== "overview" && (
                <div className="text-center py-8 text-neutral-400">
                  This tab content is not implemented in this demo.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
