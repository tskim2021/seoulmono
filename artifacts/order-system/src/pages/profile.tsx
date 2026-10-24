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
        <p className="text-slate-400 font-medium">보유한 쿠폰이 없습니다.</p>
        <p className="text-sm text-slate-400 mt-1">관리자가 쿠폰을 발급하면 여기에 표시됩니다.</p>
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
                  {c.cp_type === 1 ? `${c.cp_price}% 할인` : formatCurrency(c.cp_price) + " 할인"}
                  {c.cp_minimum > 0 && <span className="text-xs font-normal ml-2 text-slate-500">{formatCurrency(c.cp_minimum)} 이상 주문 시</span>}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {c.cp_end && c.cp_end !== "0000-00-00"
                    ? `만료일: ${c.cp_end}`
                    : "유효기간 무제한"
                  }
                  {c.cp_maximum > 0 && c.cp_type === 1 && ` · 최대 ${formatCurrency(c.cp_maximum)} 할인`}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              {isUsed ? (
                <Badge className="bg-slate-200 text-slate-500">사용됨</Badge>
              ) : isExpired ? (
                <Badge className="bg-red-100 text-red-500">만료됨</Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-700">사용 가능</Badge>
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
          <p className="text-sm text-amber-700 font-medium">현재 보유 포인트</p>
          <p className="text-2xl font-black text-amber-600">{currentPoint.toLocaleString()} <span className="text-base font-bold">P</span></p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : history.length === 0 ? (
        <div className="py-16 text-center">
          <Coins className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">포인트 내역이 없습니다.</p>
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
                className="px-3 py-1.5 text-sm font-medium rounded-lg border disabled:opacity-40 hover:bg-slate-50">이전</button>
              <span className="px-3 py-1.5 text-sm font-medium">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border disabled:opacity-40 hover:bg-slate-50">다음</button>
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
    return <div className="py-24 text-center text-slate-500 font-bold">프로필 정보를 불러올 수 없습니다.</div>;
  }

  const licenseUrl = profile.business_license_file
    ? `${import.meta.env.BASE_URL}api/auth/business-license/${profile.business_license_file}`.replace(/\/\//g, '/')
    : null;

  const myPoint = Number(me?.mb_point || 0);

  return (
    <div className="animate-in fade-in duration-300 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">내 정보</h1>
        <p className="text-slate-500 mt-2 font-medium">가입 정보 및 쿠폰/포인트를 확인할 수 있습니다.</p>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("info")}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab === "info" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}
        >
          내 정보
        </button>
        <button
          onClick={() => setTab("coupon")}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${tab === "coupon" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Ticket className="w-3.5 h-3.5" /> 내 쿠폰
        </button>
        <button
          onClick={() => setTab("point")}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${tab === "point" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Coins className="w-3.5 h-3.5" /> 포인트
        </button>
      </div>

      {tab === "info" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg">
              <User className="w-5 h-5 text-primary" />
              기본 정보
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoItem icon={User} label="아이디" value={profile.mb_id} />
              <InfoItem icon={User} label="이름" value={profile.mb_name} />
              <InfoItem icon={Mail} label="이메일" value={profile.mb_email} />
              <InfoItem icon={Phone} label="연락처" value={profile.mb_hp} />
              <InfoItem icon={Calendar} label="가입일" value={profile.mb_datetime ? format(new Date(profile.mb_datetime), 'yyyy년 MM월 dd일') : '-'} />
              <div>
                <span className="text-sm text-slate-500 font-bold block mb-1">승인 상태</span>
                {profile.is_approved ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">승인됨</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">승인 대기</Badge>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg">
              <Building2 className="w-5 h-5 text-blue-500" />
              사업자 정보
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoItem icon={Building2} label="업체명" value={profile.company_name} />
              <InfoItem icon={FileText} label="사업자등록번호" value={profile.business_number} />
              <InfoItem icon={User} label="대표자" value={profile.representative} />
              <InfoItem icon={FileText} label="업태" value={profile.business_type} />
              <InfoItem icon={FileText} label="종목" value={profile.business_category} />
              <InfoItem icon={MapPin} label="주소" value={profile.company_address} />
            </div>
          </Card>

          {licenseUrl && (
            <Card className="p-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-lg">
                <FileText className="w-5 h-5 text-amber-500" />
                사업자등록증
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">사업자등록증 파일</p>
                    <p className="text-xs text-slate-500">{profile.business_license_file}</p>
                  </div>
                </div>
                <a href={licenseUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-bold">
                  <Download className="w-4 h-4" />
                  보기
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
            내 쿠폰
          </h3>
          <CouponTab />
        </Card>
      )}

      {tab === "point" && (
        <Card className="p-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 text-lg">
            <Coins className="w-5 h-5 text-amber-500" />
            포인트 내역
          </h3>
          <PointTab currentPoint={myPoint} />
        </Card>
      )}
    </div>
  );
}
