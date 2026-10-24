import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetProfile, useGetMe, customFetch } from "@workspace/api-client-react";
import { Card, Badge } from "../components/ui";
import { Loader2, User, Building2, FileText, Phone, Mail, MapPin, Calendar, Download, Ticket, Coins, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "../lib/utils";

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <div>
      <span className="text-sm text-slate-500 font-bold block mb-1">{label}</span>
      <span className="text-slate-900 font-medium">{value || '-'}</span>
    </div>
  );
}

function CouponTab() {
  const { data: couponsData, isLoading } = useQuery({
    queryKey: ["my-coupons-all"],
    queryFn: () => customFetch<{ coupons: any[] }>("/api/my/coupons?all=1"),
  });
  const coupons = couponsData?.coupons || [];

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (coupons.length === 0) {
    return (
      <div className="py-16 text-center">
        <Ticket className="w-14 h-14 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-400 font-medium">保有しているクーポンがありません。</p>
        <p className="text-sm text-slate-400 mt-1">管理者がクーポンを発行すると、ここに表示されます。</p>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      {coupons.map(c => {
        const isUsed = !!c.od_id;
        const isExpired = c.is_expired;
        const isActive = !isUsed && !isExpired;

        return (
          <div key={c.cp_no} className={`p-4 rounded-xl border-2 flex items-center justify-between gap-4 transition-colors ${
            isActive ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50 opacity-60"
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isActive ? "bg-emerald-100" : "bg-slate-200"
              }`}>
                <Ticket className={`w-6 h-6 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
              </div>
              <div>
                <p className="font-bold text-slate-900">{c.cp_subject}</p>
                <p className={`text-sm font-bold ${isActive ? "text-emerald-700" : "text-slate-400"}`}>
                  {c.cp_type === 1 ? `${c.cp_price}%割引` : formatCurrency(c.cp_price) + " 割引"}
                  {c.cp_minimum > 0 && <span className="text-xs font-normal ml-2 text-slate-500">{formatCurrency(c.cp_minimum)} 以上のご注文時</span>}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {c.cp_end && c.cp_end !== "0000-00-00"
                    ? `有効期限: ${c.cp_end}`
                    : "有効期限なし"
                  }
                  {c.cp_maximum > 0 && c.cp_type === 1 && ` · 最大 ${formatCurrency(c.cp_maximum)} 割引`}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              {isUsed ? (
                <Badge className="bg-slate-200 text-slate-500">使用済み</Badge>
              ) : isExpired ? (
                <Badge className="bg-red-100 text-red-500">期限切れ</Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-700">利用可能</Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PointTab({ currentPoint }: { currentPoint: number }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["my-points", page],
    queryFn: () => customFetch<{ current_point: number; history: any[]; total: number; limit: number }>(`/api/my/points?page=${page}`),
  });
  const history = data?.history || [];
  const total = data?.total || 0;
  const limit = data?.limit || 20;
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-4">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Coins className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <p className="text-sm text-amber-700 font-medium">現在の保有ポイント</p>
          <p className="text-2xl font-black text-amber-600">{currentPoint.toLocaleString()} <span className="text-base font-bold">P</span></p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : history.length === 0 ? (
        <div className="py-16 text-center">
          <Coins className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">ポイント履歴がありません。</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {history.map((h: any) => {
              const isGain = h.po_point > 0;
              const amount = isGain ? h.po_point : h.po_use_point;
              return (
                <div key={h.po_id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isGain ? "bg-emerald-100" : "bg-red-100"}`}>
                      {isGain ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{h.po_content || "-"}</p>
                      <p className="text-xs text-slate-400">{h.po_datetime?.slice(0, 16) || ""}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold ${isGain ? "text-emerald-600" : "text-red-500"}`}>
                      {isGain ? "+" : "-"}{amount.toLocaleString()}P
                    </p>
                    <p className="text-xs text-slate-400">{h.po_mb_point.toLocaleString()}P</p>
                  </div>
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border disabled:opacity-40 hover:bg-slate-50">前へ</button>
              <span className="px-3 py-1.5 text-sm font-medium">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border disabled:opacity-40 hover:bg-slate-50">次へ</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Profile() {
  const { data: profile, isLoading } = useGetProfile();
  const { data: me } = useGetMe({ query: { staleTime: 0 } });
  const [tab, setTab] = useState<"info" | "coupon" | "point">("info");

  if (isLoading) {
    return <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return <div className="py-24 text-center text-slate-500 font-bold">プロフィール情報を読み込めません。</div>;
  }

  const licenseUrl = profile.business_license_file
    ? `${import.meta.env.BASE_URL}api/auth/business-license/${profile.business_license_file}`.replace(/\/\//g, '/')
    : null;

  const myPoint = Number(me?.mb_point || 0);

  return (
    <div className="animate-in fade-in duration-300 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">マイ情報</h1>
        <p className="text-slate-500 mt-2 font-medium">登録情報およびクーポン・ポイントをご確認いただけます。</p>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("info")}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab === "info" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}
        >
          マイ情報
        </button>
        <button
          onClick={() => setTab("coupon")}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${tab === "coupon" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Ticket className="w-3.5 h-3.5" /> マイクーポン
        </button>
        <button
          onClick={() => setTab("point")}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${tab === "point" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Coins className="w-3.5 h-3.5" /> ポイント
        </button>
      </div>

      {tab === "info" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg">
              <User className="w-5 h-5 text-primary" />
              基本情報
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoItem icon={User} label="ID" value={profile.mb_id} />
              <InfoItem icon={User} label="お名前" value={profile.mb_name} />
              <InfoItem icon={Mail} label="メールアドレス" value={profile.mb_email} />
              <InfoItem icon={Phone} label="連絡先" value={profile.mb_hp} />
              <InfoItem icon={Calendar} label="登録日" value={profile.mb_datetime ? format(new Date(profile.mb_datetime), 'yyyy年MM月dd日') : '-'} />
              <div>
                <span className="text-sm text-slate-500 font-bold block mb-1">承認状況</span>
                {profile.is_approved ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">承認済み</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">承認待ち</Badge>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg">
              <Building2 className="w-5 h-5 text-blue-500" />
              事業者情報
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoItem icon={Building2} label="取引先名" value={profile.company_name} />
              <InfoItem icon={FileText} label="事業者登録番号" value={profile.business_number} />
              <InfoItem icon={User} label="代表者" value={profile.representative} />
              <InfoItem icon={FileText} label="業態" value={profile.business_type} />
              <InfoItem icon={FileText} label="業種" value={profile.business_category} />
              <InfoItem icon={MapPin} label="住所" value={profile.company_address} />
            </div>
          </Card>

          {licenseUrl && (
            <Card className="p-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-lg">
                <FileText className="w-5 h-5 text-amber-500" />
                事業者登録証
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">事業者登録証ファイル</p>
                    <p className="text-xs text-slate-500">{profile.business_license_file}</p>
                  </div>
                </div>
                <a href={licenseUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-bold">
                  <Download className="w-4 h-4" />
                  表示
                </a>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === "coupon" && (
        <Card className="p-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg">
            <Ticket className="w-5 h-5 text-emerald-500" />
            マイクーポン
          </h3>
          <CouponTab />
        </Card>
      )}

      {tab === "point" && (
        <Card className="p-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg">
            <Coins className="w-5 h-5 text-amber-500" />
            ポイント履歴
          </h3>
          <PointTab currentPoint={myPoint} />
        </Card>
      )}
    </div>
  );
}
