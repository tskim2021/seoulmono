import { useCompareStore } from "@/stores/compareStore";
import { Button } from "@/components/ui/button";
import { GitCompare, X } from "lucide-react";
import { useLocation } from "wouter";

export default function CompareWidget() {
  const { productIds, removeProduct, clearAll } = useCompareStore();
  const [, navigate] = useLocation();

  if (productIds.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-6 z-40 bg-card rounded-lg elegant-shadow-lg p-4 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5" />
          <span className="font-semibold">比較リスト ({productIds.length}/4)</span>
        </div>
        <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 w-6 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-2 mb-3">
        {productIds.map((id) => (
          <div key={id} className="flex items-center justify-between text-sm">
            <span>商品ID: {id}</span>
            <Button variant="ghost" size="sm" onClick={() => removeProduct(id)} className="h-6 w-6 p-0">
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        onClick={() => navigate(`/compare?ids=${productIds.join(',')}`)}
        className="w-full"
        disabled={productIds.length < 2}
      >
        比較する ({productIds.length}件)
      </Button>
    </div>
  );
}
