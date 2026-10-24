import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RefreshCcw, JapaneseYen } from "lucide-react";
import { toast } from "sonner";

function getShopToken(): string | null {
  return localStorage.getItem("allddaom_token");
}

async function callShopApi(path: string, init?: RequestInit) {
  const token = getShopToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "요청에 실패했습니다.");
  return data;
}

export default function AdminPricingSettings() {
  const [hasToken, setHasToken] = useState(!!getShopToken());
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [rate, setRate] = useState("");
  const [status, setStatus] = useState<{ total: number; converted: number; pending: number } | null>(null);

  const refresh = async () => {
    if (!getShopToken()) {
      setHasToken(false);
      return;
    }
    setHasToken(true);
    setLoading(true);
    try {
      const data = await callShopApi("/api/admin/pricing/jpy-status");
      setStatus({ total: data.total, converted: data.converted, pending: data.pending });
      if (data.rate) setRate(String(data.rate));
    } catch (err: any) {
      toast.error(err.message || "상태를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const saveRate = async () => {
    const rateNum = parseFloat(rate);
    if (!rateNum || rateNum <= 0) {
      toast.error("正しい為替レートを入力してください。");
      return;
    }
    try {
      await callShopApi("/api/admin/pricing/jpy-rate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: rateNum }),
      });
      toast.success("為替レートを保存しました。");
      refresh();
    } catch (err: any) {
      toast.error(err.message || "저장에 실패했습니다.");
    }
  };

  const convertNow = async () => {
    if (
      !confirm(
        "현재 설정된 환율로 아직 변환되지 않은 모든 상품 가격을 엔화로 변환합니다. 원래 가격(원화)은 별도 컬럼에 자동 백업됩니다. 계속할까요?"
      )
    )
      return;
    setConverting(true);
    try {
      const data = await callShopApi("/api/admin/pricing/convert-to-jpy", { method: "POST" });
      toast.success(`${data.converted}개 상품 가격이 엔화로 변환되었습니다.`);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "변환에 실패했습니다.");
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <JapaneseYen className="w-6 h-6" />
        엔화 가격 변환
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        원화 기준으로 등록된 상품 가격을 설정한 환율로 일괄 변환합니다. 원래 가격은 자동 백업되어 언제든 복원할 수 있습니다.
      </p>

      {!hasToken ? (
        <div className="border rounded-lg p-5 bg-muted/40 text-sm">
          <p className="mb-3">
            이 기능은 쇼핑몰 로그인 세션이 필요합니다. 아래 링크를 새 탭으로 열어 관리자 계정으로 한 번 로그인한 뒤,
            이 페이지를 새로고침 해주세요.
          </p>
          <a href="/login" target="_blank" rel="noreferrer" className="text-primary underline">
            seoulmono.com 로그인 페이지 열기 →
          </a>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCcw className="w-4 h-4 mr-1.5" />
              새로고침
            </Button>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-5 space-y-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{status ? status.total : "-"}</p>
              <p className="text-xs text-muted-foreground mt-1">すべての商品</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{status ? status.converted : "-"}</p>
              <p className="text-xs text-muted-foreground mt-1">変換済み</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{status ? status.pending : "-"}</p>
              <p className="text-xs text-muted-foreground mt-1">未変換</p>
            </div>
          </div>

          <Separator />

          <div>
            <Label htmlFor="jpy-rate" className="mb-1.5 block">
              환율 (1원 = ? 엔)
            </Label>
            <div className="flex gap-2">
              <Input
                id="jpy-rate"
                type="number"
                step="0.0001"
                placeholder="例: 0.1147"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
              <Button onClick={saveRate} disabled={loading}>
                저장
              </Button>
            </div>
          </div>

          <Button className="w-full" onClick={convertNow} disabled={converting || loading}>
            {converting ? "変換中..." : "今すぐ円に変換する"}
          </Button>

          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading} className="w-full">
            <RefreshCcw className="w-4 h-4 mr-1.5" />
            상태 새로고침
          </Button>
        </div>
      )}
    </div>
  );
}
