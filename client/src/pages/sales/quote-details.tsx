import {
  Edit,
  CheckCircle,
  Download,
  DollarSign,
  Plus,
  MoreHorizontal,
  ArrowUpRight,
  ChevronDown,
  PenBox,
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";

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
import { useMemo, useState } from "react";
import useGetQuoteOverview from "@/hooks/sales/use-get-quote-overview";
import useGetItems from "@/hooks/sales/use-get-items";

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

  const quoteId = useParams().id;

  const { quoteOverview, loading, error } = useGetQuoteOverview({
    quoteId: quoteId || "",
  });

  const { items, loading: itemsLoading, error: itemsError } = useGetItems();

  console.log(items);

  const quoteItems = useMemo(() => {
    return quoteOverview?.quoteItems || [];
  }, [quoteOverview]);

  const subtotal = useMemo(() => {
    return quoteItems.reduce((acc: number, item: any) => acc + item.price, 0);
  }, [quoteItems]);

  const discount = useMemo(() => {
    return quoteItems.reduce(
      (acc: number, item: any) => acc + item.discount,
      0
    );
  }, [quoteItems]);

  const tax = useMemo(() => {
    return quoteItems.reduce((acc: number, item: any) => acc + item.tax, 0);
  }, [quoteItems]);

  const total = useMemo(() => {
    return subtotal - discount + tax;
  }, [subtotal, discount, tax]);

  const customer = useMemo(() => {
    return quoteOverview?.customer || null;
  }, [quoteOverview]);

  const dealer = useMemo(() => {
    return quoteOverview?.dealer || null;
  }, [quoteOverview]);

  const itemCount = useMemo(() => {
    return quoteItems.reduce(
      (acc: number, item: any) => acc + item.quantity,
      0
    );
  }, [quoteItems]);

  const pageTitle = `${customer?.name} • ${quoteOverview?.quote?.number} (${quoteOverview?.quote?.revision})`;
  const pageDescription = `${
    quoteOverview?.quote?.status
  } • ${itemCount} items • ${formatCurrency(total)}`;

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

      <div className="bg-foreground border-b p-2">
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
            {/* Overview */}
            <div className="bg-foreground rounded shadow-sm border p-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between items-start col-span-2">
                  <div className="text-sm font-medium text-neutral-400">
                    Quote Details
                  </div>
                  <StatusBadge
                    label={quoteOverview?.quote?.status}
                    icon={
                      quoteOverview?.quote?.status === "accepted"
                        ? CheckCircle
                        : PenBox
                    }
                    variant={
                      quoteOverview?.quote?.status === "accepted"
                        ? "success"
                        : "default"
                    }
                  />
                </div>

                <div>
                  <div className="text-xs text-neutral-400">Number</div>
                  <div className="text-sm text-neutral-400">
                    {quoteOverview?.quote?.number}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Revision</div>
                  <div className="text-sm text-neutral-400">
                    {quoteOverview?.quote?.revision || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Created On</div>
                  <div className="text-sm text-neutral-400">
                    {quoteOverview?.quote?.createdAt
                      ? formatDate(quoteOverview?.quote?.createdAt)
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Created By</div>
                  <div className="text-sm text-neutral-400">
                    {quoteOverview?.quote?.createdById
                      ? `${quoteOverview?.quote?.createdBy?.firstName} ${quoteOverview?.quote?.createdBy?.lastName}`
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Approved On</div>
                  <div className="text-sm text-neutral-400">
                    {quoteOverview?.quote?.approvedAt
                      ? formatDate(quoteOverview?.quote?.approvedAt)
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Approved By</div>
                  <div className="text-sm text-neutral-400">
                    {quoteOverview?.quote?.approvedById
                      ? quoteOverview?.quote?.approvedBy?.name
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Expires On</div>
                  <div className="text-sm text-neutral-400">
                    {quoteOverview?.quote?.expiryDate
                      ? formatDate(quoteOverview?.quote?.expiryDate)
                      : "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer */}
            <div className="bg-foreground rounded shadow-sm border p-2">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium text-neutral-400 mb-3">
                      Customer Details
                    </div>

                    <Link
                      to={`/sales/companies/${customer?.id}`}
                      className="text-sm text-neutral-400 hover:text-neutral-500">
                      View
                    </Link>
                  </div>
                  {customer ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-neutral-400">Name</div>
                        <div className="text-sm text-neutral-400">
                          {customer?.name || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-400">Contact</div>
                        <div className="text-sm text-neutral-400">
                          {customer?.contact || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-400">Email</div>
                        <div className="text-sm text-neutral-400">
                          {customer?.email || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-400">Phone</div>
                        <div className="text-sm text-neutral-400">
                          {customer?.phone || "-"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-neutral-400 text-center">
                      No customer associated with this quote
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dealer */}
            <div className="bg-foreground rounded shadow-sm border p-2">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium text-neutral-400">
                      Dealer Details
                    </div>

                    {dealer && (
                      <Link
                        to={`/sales/companies/${dealer?.id}`}
                        className="text-sm text-neutral-400 hover:text-neutral-500">
                        View
                      </Link>
                    )}
                  </div>
                  {dealer ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-neutral-400">Name</div>
                        <div className="text-sm text-neutral-400">
                          {dealer?.name || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-400">Contact</div>
                        <div className="text-sm text-neutral-400">
                          {dealer?.contact || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-400">Email</div>
                        <div className="text-sm text-neutral-400">
                          {dealer?.email || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-400">Phone</div>
                        <div className="text-sm text-neutral-400">
                          {dealer?.phone || "-"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-neutral-400 text-center">
                      No dealer associated with this quote
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-foreground rounded shadow-sm border overflow-hidden">
            <div className="p-2 bg-foreground border-b flex justify-between items-center">
              <h2 className="font-semibold text-text-muted text-sm">
                Quote Items
              </h2>
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
                    className="p-2 text-left text-xs font-medium text-text-muted uppercase">
                    Item
                  </th>
                  <th
                    scope="col"
                    className="p-2 text-left text-xs font-medium text-text-muted uppercase">
                    Description
                  </th>
                  <th
                    scope="col"
                    className="p-2 text-right text-xs font-medium text-text-muted uppercase">
                    Quantity
                  </th>
                  <th
                    scope="col"
                    className="p-2 text-right text-xs font-medium text-text-muted uppercase">
                    Unit Price
                  </th>
                  <th
                    scope="col"
                    className="p-2 text-right text-xs font-medium text-text-muted uppercase">
                    Discount
                  </th>
                  <th
                    scope="col"
                    className="p-2 text-right text-xs font-medium text-text-muted uppercase">
                    Tax
                  </th>
                  <th
                    scope="col"
                    className="p-2 text-right text-xs font-medium text-text-muted uppercase">
                    Total
                  </th>
                  <th
                    scope="col"
                    className="p-2 text-right text-xs font-medium text-text-muted uppercase">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody className="bg-foreground divide-y divide-border">
                {quoteItems.map((item: any) => (
                  <tr key={item.id}>
                    <td className="p-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-muted">
                        {item.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-text-muted">
                        {item.description}
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap text-right">
                      <div className="text-sm text-text-muted">
                        {item.quantity}
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap text-right">
                      <div className="text-sm text-text-muted">
                        {formatCurrency(item.unitPrice)}
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap text-right">
                      <div className="text-sm text-text-muted">
                        {formatCurrency(item.discount)}
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap text-right">
                      <div className="text-sm text-text-muted">
                        {formatCurrency(item.tax)}
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-text-muted">
                        {formatCurrency(item.total)}
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap text-right">
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
                    className="p-2 text-right text-xs uppercase text-text-muted">
                    Subtotal
                  </td>
                  <td
                    colSpan={2}
                    className="p-2 text-right text-xs text-text-muted">
                    {formatCurrency(subtotal)}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td
                    colSpan={5}
                    className="p-2 text-right text-xs uppercase text-text-muted">
                    Discount
                  </td>
                  <td
                    colSpan={2}
                    className="p-2 text-right text-xs text-text-muted">
                    {discount > 0 ? "-" : ""} {formatCurrency(discount)}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td
                    colSpan={5}
                    className="p-2 text-right text-xs uppercase text-text-muted">
                    Tax
                  </td>
                  <td
                    colSpan={2}
                    className="p-2 text-right text-xs text-text-muted">
                    {formatCurrency(tax)}
                  </td>
                  <td></td>
                </tr>
                <tr className="border-t border-border">
                  <td
                    colSpan={5}
                    className="p-2 text-right text-xs uppercase font-bold text-text-muted">
                    Total
                  </td>
                  <td
                    colSpan={2}
                    className="p-2 text-right text-xs font-bold text-text-muted">
                    {formatCurrency(total)}
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
                  render: (_) => (
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
              data={items || []}
              total={items?.length || 0}
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
                  render: (_) => (
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
