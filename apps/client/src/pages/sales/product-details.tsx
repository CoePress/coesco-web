import { useParams } from "react-router-dom";
import { Card, StatusBadge } from "@/components";
import { formatCurrency } from "@/utils";
import PageHeader from "@/components/layout/page-header";
import { PackageIcon, DollarSignIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react";

const ProductDetails = () => {
  const { id } = useParams();

  // Sample product data
  const product = {
    id: id || "1",
    name: "Industrial Hydraulic Press 2000T",
    sku: "IHP-2000-XL",
    category: "Machinery",
    status: "Active",
    unitPrice: 85000,
    cost: 52000,
    stock: 3,
    leadTime: "8-12 weeks",
    brand: "PowerPress Industries",
    model: "PP-2000XL",
    weight: "15,000 lbs",
    dimensions: "12' x 8' x 14'",
    warranty: "2 Years",
    supplier: "PowerPress Manufacturing Co.",
    description: "Heavy-duty industrial hydraulic press designed for high-volume metal forming operations. Features precision controls, safety systems, and robust construction for demanding manufacturing environments. Ideal for automotive, aerospace, and general manufacturing applications requiring consistent, high-force pressing operations.",
    specifications: {
      "Maximum Force": "2000 Tons",
      "Working Height": "48 inches",
      "Daylight Opening": "60 inches", 
      "Bed Size": "72 x 48 inches",
      "Ram Speed": "15 ipm approach, 3 ipm pressing",
      "Motor Power": "75 HP",
      "Hydraulic Pressure": "3000 PSI",
      "Control System": "PLC with HMI touchscreen",
      "Safety Features": "Light curtains, emergency stops, two-hand operation"
    },
    salesNotes: "• Key selling point: Industry-leading 2000-ton capacity in compact footprint\n• Highlight: Advanced PLC control system reduces setup time by 40%\n• Competitive advantage: Best-in-class safety features exceed OSHA requirements\n• Common question: 'What's the power requirement?' - Answer: 480V, 3-phase, 100 amp service\n• Financing available: 0% for 12 months or extended terms up to 84 months\n• Installation included within 500 miles of our facility"
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      <PageHeader
        title={product.name || "Product Details"}
        description={`SKU: ${product.sku || "N/A"} • ${product.category || "No Category"}`}
        goBack
      />

      <div className="p-2 gap-2 flex flex-col flex-1">
        <div className="grid grid-cols-3 gap-2">
          {/* Product Images */}
          <Card>
            <div className="space-y-4">
              {/* Main Product Image */}
              <div className="aspect-square bg-surface rounded-lg flex items-center justify-center border border-border">
                <PackageIcon size={64} className="text-text-muted" />
              </div>
              
              {/* Additional Images Scroll */}
              <div className="space-y-2">
                <div className="text-xs text-text-muted">Additional Images</div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-16 h-16 bg-surface rounded border border-border flex items-center justify-center cursor-pointer hover:bg-foreground transition-colors">
                      <PackageIcon size={24} className="text-text-muted" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Product Details & Pricing */}
          <Card className="col-span-2">
            <div className="space-y-6">
              {/* Product Information */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-text-muted">Product Information</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-text-muted">Product Name</div>
                      <div className="text-sm font-medium text-text">{product.name || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">SKU</div>
                      <div className="text-sm font-mono text-text">{product.sku || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Category</div>
                      <div className="text-sm text-text">{product.category || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Status</div>
                      <StatusBadge label={product.status || "Active"} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-text-muted">Brand</div>
                      <div className="text-sm text-text">{product.brand || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Model</div>
                      <div className="text-sm text-text">{product.model || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Supplier</div>
                      <div className="text-sm text-text">{product.supplier || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Warranty</div>
                      <div className="text-sm text-text">{product.warranty || "1 Year"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
                  <DollarSignIcon size={16} />
                  Pricing & Availability
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-text-muted">Unit Price</div>
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(product.unitPrice || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Cost</div>
                    <div className="text-sm text-text">
                      {formatCurrency(product.cost || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Margin</div>
                    <div className="text-sm text-text">
                      {product.unitPrice && product.cost 
                        ? `${(((product.unitPrice - product.cost) / product.unitPrice) * 100).toFixed(1)}%`
                        : "-"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-text-muted">Stock Level</div>
                    <div className={`text-sm font-medium flex items-center gap-1 ${
                      (product.stock || 0) < 10 ? 'text-error' : 
                      (product.stock || 0) < 50 ? 'text-warning' : 'text-success'
                    }`}>
                      {(product.stock || 0) < 10 ? (
                        <AlertCircleIcon size={16} />
                      ) : (
                        <CheckCircleIcon size={16} />
                      )}
                      {product.stock || 0} units
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Lead Time</div>
                    <div className="text-sm text-text">
                      {product.leadTime || "2-3 weeks"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-text-muted">Description</div>
                <div className="text-sm text-text leading-relaxed">
                  {product.description || "No description available for this product."}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Specifications & Sales Notes */}
        <div className="grid grid-cols-2 gap-2">
          <Card>
            <div className="space-y-3">
              <div className="text-sm font-medium text-text-muted">
                Specifications
              </div>
              <div className="space-y-2">
                {product.specifications ? (
                  Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-text-muted capitalize">{key}:</span>
                      <span className="text-text">{value as string}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-text-muted">
                    No specifications available
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <div className="text-sm font-medium text-text-muted">
                Sales Notes & Key Points
              </div>
              <div className="bg-surface p-3 rounded border border-border">
                <div className="text-sm text-text whitespace-pre-line">
                  {product.salesNotes || "• Highlight key selling points here\n• Mention any special features or benefits\n• Include competitive advantages\n• Note any common customer questions or concerns"}
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default ProductDetails;