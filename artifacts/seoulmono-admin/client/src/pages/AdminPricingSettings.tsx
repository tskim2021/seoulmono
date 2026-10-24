import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RefreshCcw, JapaneseYen } from "lucide-react";
import { toast } from "sonner";

function getShopToken(): string | null {
  return localStorage.getItem("seoulmono_token");
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
  if (!res.ok) throw new Error(data?.error || "リクエストに失敗しました。");
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
      toast.error(err.message || "ステータスを取得できませんでした。");
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
      toast.error(err.message || "保存に失敗しました。");
    }
  };

  const convertNow = async () => {
    if (
      !confirm(
        "現在設定されている為替レートで、まだ変換されていないすべての商品価格を円に変換します。元の価格（ウォン）は別カラムに自動でバックアップされます。続行しますか？"
      )
    )
      return;
    setConverting(true);
    try {
      const data = await callShopApi("/api/admin/pricing/convert-to-jpy", { method: "POST" });
      toast.success(`${data.converted}件の商品価格を円に変換しました。`);
      refresh();
    } catch (err: any) {
      toast.error(err.message || "変換に失敗しました。");
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <JapaneseYen className="w-6 h-6" />
        円価格への変換
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        ウォン建てで登録されている商品価格を、設定した為替レートで一括変換します。元の価格は自動でバックアップされ、いつでも復元できます。
      </p>

      {!hasToken ? (
        <div className="border rounded-lg p-5 bg-muted/40 text-sm">
          <p className="mb-3">
            この機能にはショップのログインセッションが必要です。下のリンクを新しいタブで開き、管理者アカウントで一度ログインしてから、
            このページを再読み込みしてください。
          </p>
          <a href="/login" target="_blank" rel="noreferrer" className="text-primary underline">
            seoulmono.com ログインページを開く →
          </a>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCcw className="w-4 h-4 mr-1.5" />
              再読み込み
            </Button>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-5 space-y-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{status ? status.total : "-"}</p>
              <p className="text-xs text-muted-foreground mt-1">全商品</p>
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
              為替レート (1ウォン = ? 円)
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
                保存
              </Button>
            </div>
          </div>

          <Button className="w-full" onClick={convertNow} disabled={converting || loading}>
            {converting ? "変換中..." : "今すぐ円に変換する"}
          </Button>

          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading} className="w-full">
            <RefreshCcw className="w-4 h-4 mr-1.5" />
            ステータスを再読み込み
          </Button>
        </div>
      )}
    </div>
  );
}
