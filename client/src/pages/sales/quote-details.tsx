import {
  Edit,
  CheckCircle,
  XCircle,
  Send,
  Download,
  Copy,
  DollarSign,
  Printer,
  Eye,
  MessageSquare,
  History,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, PageHeader, StatusBadge, Tabs } from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import { sampleQuote } from "@/utils/sample-data";

const QuoteDetails = () => {
  const [activeTab, setActiveTab] = useState("details");

  const navigate = useNavigate();

  const formatHistoryItem = (item: { action: string }) => {
    const actionMap = {
      created: "Created quote",
      edited: "Edited quote",
      submitted: "Submitted for approval",
      approved: "Approved quote",
      sent: "Sent quote to client",
      accepted: "Quote accepted by client",
      rejected: "Quote rejected by client",
      expired: "Quote expired",
    };

    return actionMap[item.action as keyof typeof actionMap] || item.action;
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
            icon: <Download size={16} />,
            onClick: () => {},
          },
          {
            type: "button",
            label: "Revise",
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
            <Send size={16} />
            Send
          </Button>
          <Button
            onClick={() => {}}
            variant="secondary-outline">
            <Download size={16} />
            Download
          </Button>
          <Button
            onClick={() => {}}
            variant="secondary-outline">
            <Copy size={16} />
            Duplicate
          </Button>
          <Button
            onClick={() => {}}
            variant="secondary-outline">
            <DollarSign size={16} />
            Convert to Order
          </Button>
          <Button
            onClick={() => {}}
            variant="secondary-outline">
            <Printer size={16} />
            Print
          </Button>
          <Button
            onClick={() => {}}
            variant="secondary-outline">
            <Eye size={16} />
            Preview
          </Button>
        </div>
      </div>

      <Tabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={[
          { label: "Details", value: "details" },
          { label: "History", value: "history" },
          { label: "Messages", value: "messages" },
          { label: "Approvals", value: "approvals" },
        ]}
      />

      <div className="mx-auto p-2">
        {activeTab === "details" && (
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
                        sampleQuote.status === "accepted"
                          ? CheckCircle
                          : XCircle
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
                  onClick={() => {}}
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

            <div className="bg-foreground rounded-lg shadow-sm border p-4">
              <h2 className="font-semibold text-text-muted mb-2">
                Payment Terms & Conditions
              </h2>
              <p className="text-sm text-text-muted">
                {sampleQuote.paymentTerms}
              </p>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-foreground rounded-lg shadow-sm border overflow-hidden">
            <div className="px-4 py-3 bg-foreground border-b">
              <h2 className="font-semibold text-text-muted">Quote History</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {sampleQuote.history.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4">
                    <div className="mt-0.5">
                      <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-primary">
                        <History size={16} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <div className="text-sm font-medium text-text-muted">
                          {formatHistoryItem(item)}
                        </div>
                        <div className="text-sm text-text-muted">
                          {formatDate(item.date)}
                        </div>
                      </div>
                      <div className="text-sm text-text-muted mt-1">
                        {item.user} • {item.note}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="bg-foreground rounded-lg shadow-sm border overflow-hidden">
            <div className="px-4 py-3 bg-foreground border-b flex justify-between items-center">
              <h2 className="font-semibold text-text-muted">Messages</h2>
              <Button
                onClick={() => {}}
                variant="secondary-outline">
                <MessageSquare size={16} />
                New Message
              </Button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {sampleQuote.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.direction === "outgoing"
                        ? "bg-primary text-foreground ml-12"
                        : "bg-surface text-text-muted mr-12"
                    }`}>
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium text-sm">{message.user}</div>
                      <div className="text-xs">{formatDate(message.date)}</div>
                    </div>
                    <div className="text-sm">{message.message}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="relative">
                  <textarea
                    className="w-full border rounded-lg p-3 pr-12 text-sm"
                    rows={3}
                    placeholder="Type your message here..."></textarea>
                  <div className="absolute right-3 bottom-3">
                    <Button
                      onClick={() => {}}
                      variant="secondary-outline">
                      <Send size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "approvals" && (
          <div className="bg-foreground rounded-lg shadow-sm border overflow-hidden">
            <div className="px-4 py-3 bg-foreground border-b flex justify-between items-center">
              <h2 className="font-semibold text-text-muted">
                Approval Workflow
              </h2>
              <div className="text-sm">
                <span className="font-medium">Status:</span>
                <span className="text-primary ml-1">Approved</span>
              </div>
            </div>
            <div className="p-4">
              {sampleQuote.approvals.map((approval) => (
                <div
                  key={approval.id}
                  className="flex gap-4 items-start">
                  <div className="mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-primary">
                      <CheckCircle size={16} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <div className="text-sm font-medium text-neutral-400">
                        Approved by {approval.user}
                      </div>
                      <div className="text-sm text-neutral-400">
                        {formatDate(approval.date)}
                      </div>
                    </div>
                    <div className="text-sm text-neutral-400 mt-1">
                      {approval.note}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteDetails;
