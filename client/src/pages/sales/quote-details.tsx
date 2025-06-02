import {
  Edit,
  CheckCircle,
  XCircle,
  Download,
  DollarSign,
  Plus,
  MoreHorizontal,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Modal,
  PageHeader,
  StatusBadge,
  PageSearch,
  Table,
  Tabs,
} from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import { sampleQuote } from "@/utils/sample-data";
import { useState } from "react";

const sampleConfigurations = [
  {
    id: "cfg-1",
    name: "Enterprise Core Platform",
    description: "Complete enterprise solution with advanced features",
    pricing: {
      basePrice: 250000,
      adjustments: 25000,
      totalPrice: 275000,
    },
    options: [
      { name: "Advanced Analytics", price: 15000 },
      { name: "Premium Support", price: 10000 },
    ],
  },
  {
    id: "cfg-2",
    name: "Standard Business Package",
    description: "Essential features for growing businesses",
    pricing: {
      basePrice: 125000,
      adjustments: 12500,
      totalPrice: 137500,
    },
    options: [
      { name: "Basic Analytics", price: 7500 },
      { name: "Standard Support", price: 5000 },
    ],
  },
  {
    id: "cfg-3",
    name: "Professional Suite",
    description: "Professional tools for specialized needs",
    pricing: {
      basePrice: 180000,
      adjustments: 18000,
      totalPrice: 198000,
    },
    options: [
      { name: "Professional Tools", price: 12000 },
      { name: "Priority Support", price: 6000 },
    ],
  },
  {
    id: "cfg-4",
    name: "Basic Starter Kit",
    description: "Entry-level solution for small businesses",
    pricing: {
      basePrice: 75000,
      adjustments: 7500,
      totalPrice: 82500,
    },
    options: [
      { name: "Basic Support", price: 5000 },
      { name: "Essential Features", price: 2500 },
    ],
  },
];

const QuoteDetails = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("items");

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const pageTitle = `${sampleQuote.name}`;
  const pageDescription = `${sampleQuote.id} • ${formatDate(sampleQuote.date)}`;

  return (
    <div className="w-full flex-1">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        backButton
        onBack={() => navigate("/sales/quotes")}
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
            label: "Revise",
            variant: "primary",
            icon: <Edit size={16} />,
            onClick: () => {},
          },
        ]}
      />

      <div className="bg-foreground border-b px-4 py-2">
        <div className="flex gap-2">
          <Button
            onClick={() => {}}
            variant="secondary-outline">
            <ArrowUpRight size={16} />
            Request Approval
          </Button>
          <Button
            onClick={() => {}}
            variant="secondary-outline">
            <DollarSign size={16} />
            Convert to Order
          </Button>
        </div>
      </div>

      <div className="mx-auto p-2">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-foreground rounded-lg shadow-sm border p-4 col-span-2">
              <h2 className="font-semibold text-text-muted mb-4">
                Quote Summary
              </h2>
              <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                <div>
                  <div className="text-sm text-text-muted">Quote ID</div>
                  <div className="text-sm font-medium text-text-muted">
                    {sampleQuote.id}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Date Created</div>
                  <div className="text-sm font-medium text-text-muted">
                    {formatDate(sampleQuote.date)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Expiry Date</div>
                  <div className="text-sm font-medium text-text-muted">
                    {formatDate(sampleQuote.expiry)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Status</div>
                  <StatusBadge
                    label={sampleQuote.status}
                    icon={
                      sampleQuote.status === "accepted" ? CheckCircle : XCircle
                    }
                    variant={
                      sampleQuote.status === "accepted"
                        ? "success"
                        : sampleQuote.status === "rejected"
                        ? "error"
                        : "default"
                    }
                  />
                </div>
                <div>
                  <div className="text-sm text-text-muted">Valid For</div>
                  <div className="text-sm font-medium text-text-muted">
                    {sampleQuote.validFor}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Assigned To</div>
                  <div className="text-sm font-medium text-text-muted">
                    {sampleQuote.assignedTo}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Payment Terms</div>
                  <div className="text-sm font-medium text-text-muted">
                    {sampleQuote.terms}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-text-muted">Description</div>
                  <div className="text-sm font-medium text-text-muted">
                    {sampleQuote.description}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t">
                <div className="text-sm text-text-muted">Notes</div>
                <div className="text-sm text-text-muted mt-1">
                  {sampleQuote.notes}
                </div>
              </div>
            </div>

            <div className="bg-foreground rounded-lg shadow-sm border p-4">
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-semibold text-text-muted">Customer</h2>
                <a
                  href={`/sales/customers/${sampleQuote.customer.id}`}
                  className="text-sm text-primary hover:underline">
                  View Customer
                </a>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-text-muted">Company</div>
                  <div className="text-sm font-medium text-text-muted">
                    {sampleQuote.customer.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Contact</div>
                  <div className="text-sm font-medium text-text-muted">
                    {sampleQuote.customer.contact}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Email</div>
                  <div className="text-sm font-medium text-text-muted">
                    {sampleQuote.customer.email}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Phone</div>
                  <div className="text-sm font-medium text-text-muted">
                    {sampleQuote.customer.phone}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Address</div>
                  <div className="text-sm font-medium text-text-muted">
                    {sampleQuote.customer.address}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-foreground rounded-lg shadow-sm border overflow-hidden">
            <div className="px-4 py-3 bg-foreground border-b flex justify-between items-center">
              <h2 className="font-semibold text-text-muted">Quote Items</h2>
              <Button
                onClick={toggleModal}
                variant="secondary-outline">
                <Plus size={16} />
                Add Item
              </Button>
            </div>
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-foreground">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                    Item
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
                    Quantity
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
                    Unit Price
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
                    Discount
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
                    Tax
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
                    Total
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-foreground divide-y divide-border">
                {sampleQuote.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-muted">
                        {item.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-text-muted">
                        {item.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm text-text-muted">
                        {item.quantity}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm text-text-muted">
                        {formatCurrency(item.unitPrice)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm text-text-muted">
                        {formatCurrency(item.discount)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm text-text-muted">
                        {formatCurrency(item.tax)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-text-muted">
                        {formatCurrency(item.total)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button className="text-text-muted hover:text-text">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-foreground">
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-3 text-right text-sm font-medium text-text-muted">
                    Subtotal
                  </td>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-right text-sm font-medium text-text-muted">
                    {formatCurrency(sampleQuote.amount)}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-3 text-right text-sm font-medium text-text-muted">
                    Discount (
                    {sampleQuote.discount.type === "percentage"
                      ? `${sampleQuote.discount.value}%`
                      : "Fixed"}
                    )
                  </td>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-right text-sm font-medium text-text-muted">
                    -{formatCurrency(sampleQuote.discount.amount)}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-3 text-right text-sm font-medium text-text-muted">
                    Tax
                  </td>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-right text-sm font-medium text-text-muted">
                    {formatCurrency(sampleQuote.tax)}
                  </td>
                  <td></td>
                </tr>
                <tr className="border-t border-border">
                  <td
                    colSpan={5}
                    className="px-4 py-3 text-right text-sm font-bold text-text-muted">
                    Total
                  </td>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-right text-sm font-bold text-text-muted">
                    {formatCurrency(sampleQuote.totalAmount)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={toggleModal}
        title="Add Item to Quote"
        size="lg">
        <div className="flex flex-col gap-4">
          <Tabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabs={[
              { label: "Items", value: "items" },
              { label: "Configurations", value: "configurations" },
            ]}
          />

          <PageSearch
            placeholder={`Search ${activeTab}...`}
            filters={[
              { label: "Category", icon: ChevronDown, onClick: () => {} },
              { label: "Price Range", icon: ChevronDown, onClick: () => {} },
            ]}
          />

          {activeTab === "items" ? (
            <Table
              columns={[
                {
                  key: "name",
                  header: "Item",
                  className: "text-primary",
                },
                {
                  key: "description",
                  header: "Description",
                },
                {
                  key: "unitPrice",
                  header: "Unit Price",
                  render: (value) => formatCurrency(value as number),
                  className: "text-right",
                },
                {
                  key: "quantity",
                  header: "Quantity",
                  render: (_, row) => (
                    <input
                      type="number"
                      min="1"
                      defaultValue="1"
                      className="w-20 px-2 py-1 border rounded text-right"
                    />
                  ),
                  className: "text-right",
                },
              ]}
              data={sampleQuote.items}
              total={sampleQuote.items.length}
              onRowClick={(row) => {
                console.log("Selected item:", row);
                toggleModal();
              }}
            />
          ) : (
            <Table
              columns={[
                {
                  key: "name",
                  header: "Configuration",
                  className: "text-primary",
                },
                {
                  key: "description",
                  header: "Description",
                },
                {
                  key: "pricing.totalPrice",
                  header: "Total Price",
                  render: (_, row) => formatCurrency(row.pricing.totalPrice),
                  className: "text-right",
                },
                {
                  key: "quantity",
                  header: "Quantity",
                  render: (_, row) => (
                    <input
                      type="number"
                      min="1"
                      defaultValue="1"
                      className="w-20 px-2 py-1 border rounded text-right"
                    />
                  ),
                  className: "text-right",
                },
              ]}
              data={sampleConfigurations}
              total={sampleConfigurations.length}
              onRowClick={(row) => {
                console.log("Selected configuration:", row);
                toggleModal();
              }}
            />
          )}

          <div className="flex justify-between gap-2 pt-4 border-t">
            {activeTab === "configurations" && (
              <Button
                variant="secondary-outline"
                onClick={() => navigate("/sales/catalog/builder")}>
                <Plus size={16} />
                New Config
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="secondary-outline"
                onClick={toggleModal}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuoteDetails;
