import { AlertCircleIcon, CheckCircleIcon, DollarSignIcon, PackageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import type { IApiResponse } from "@/utils/types";

import { Card, StatusBadge } from "@/components";
import PageHeader from "@/components/layout/page-header";
import { useApi } from "@/hooks/use-api";
import { formatCurrency } from "@/utils";

function ProductDetails() {
  const { id } = useParams();
  const { get } = useApi<IApiResponse<any>>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id)
        return;

      setLoading(true);
      const response = await get(`/catalog/items/${id}`);

      if (response?.success && response.data) {
        setProduct(response.data);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="text-lg">Loading product details...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <div className="text-lg text-error">Product not found</div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title={product.name || "Product Details"}
        description={`SKU: ${product.modelNumber || "N/A"} • ${product.productClass?.name || "No Category"}`}
        goBack
      />

      <div className="p-2 gap-2 flex flex-col flex-1 overflow-hidden">
        <div className="grid grid-cols-3 gap-2 flex-1 overflow-hidden">
          <Card>
            <div className="space-y-2">
              <div className="aspect-square bg-surface rounded-lg flex items-center justify-center border border-border">
                <PackageIcon size={64} className="text-text-muted" />
              </div>

              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-surface rounded border border-border flex items-center justify-center cursor-pointer hover:bg-foreground transition-colors"
                  >
                    <PackageIcon size={20} className="text-text-muted" />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="col-span-2 overflow-hidden">
            <div className="space-y-6 overflow-y-auto h-full">
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
                      <div className="text-sm font-mono text-text">{product.modelNumber || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Category</div>
                      <div className="text-sm text-text">{product.productClass?.name || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Status</div>
                      <StatusBadge label={product.legacy?.status || "Active"} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-text-muted">Brand</div>
                      <div className="text-sm text-text">{product.legacy?.brand || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Model</div>
                      <div className="text-sm text-text">{product.modelNumber || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Supplier</div>
                      <div className="text-sm text-text">{product.legacy?.supplier || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Warranty</div>
                      <div className="text-sm text-text">{product.legacy?.warranty || "1 Year"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
                  <DollarSignIcon size={16} />
                  Pricing & Availability
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-text-muted">Unit Price</div>
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(product.legacy?.unitPrice || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Cost</div>
                    <div className="text-sm text-text">
                      {formatCurrency(product.legacy?.cost || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Margin</div>
                    <div className="text-sm text-text">
                      {product.legacy?.unitPrice && product.legacy?.cost
                        ? `${(((product.legacy.unitPrice - product.legacy.cost) / product.legacy.unitPrice) * 100).toFixed(1)}%`
                        : "-"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-text-muted">Stock Level</div>
                    <div className={`text-sm font-medium flex items-center gap-1 ${
                      (product.legacy?.stock || 0) < 10
                        ? "text-error"
                        : (product.legacy?.stock || 0) < 50 ? "text-warning" : "text-success"
                    }`}
                    >
                      {(product.legacy?.stock || 0) < 10
                        ? (
                            <AlertCircleIcon size={16} />
                          )
                        : (
                            <CheckCircleIcon size={16} />
                          )}
                      {product.legacy?.stock || 0}
                      {" "}
                      units
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-muted">Lead Time</div>
                    <div className="text-sm text-text">
                      {product.legacy?.leadTime || "2-3 weeks"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-text-muted">Description</div>
                <div className="text-sm text-text leading-relaxed">
                  {product.description || "No description available for this product."}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-text-muted">
                  Specifications
                </div>
                <div className="space-y-2">
                  {product.legacy?.specifications
                    ? (
                        Object.entries(product.legacy.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-text-muted capitalize">
                              {key}
                              :
                            </span>
                            <span className="text-text">{value as string}</span>
                          </div>
                        ))
                      )
                    : (
                        <div className="text-sm text-text-muted">
                          No specifications available
                        </div>
                      )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-text-muted">
                  Sales Notes & Key Points
                </div>
                <div className="bg-surface p-3 rounded border border-border">
                  <div className="text-sm text-text whitespace-pre-line">
                    {product.legacy?.salesNotes || "• Highlight key selling points here\n• Mention any special features or benefits\n• Include competitive advantages\n• Note any common customer questions or concerns"}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}

export default ProductDetails;
