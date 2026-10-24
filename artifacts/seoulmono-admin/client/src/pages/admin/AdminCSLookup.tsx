import { useState, useRef } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  formatPrice, formatDate, formatDateTime,
  getGradeLabel, getOrderStatusLabel, getOrderStatusColor, formatOrderNumber,
} from "@/lib/utils";
import {
  Search, User, ShoppingBag, Coins, Phone, Mail,
  ExternalLink, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminCSLookup() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchResult = trpc.admin.csSearch.useQuery(
    { query: activeQuery },
    { enabled: !!activeQuery },
  );

  const detailQuery = trpc.admin.userDetailFull.useQuery(
    { id: selectedUserId! },
    { enabled: !!selectedUserId },
  );
  const ordersQuery = trpc.admin.userOrders.useQuery(
    { userId: selectedUserId!, page: 1, limit: 20 },
    { enabled: !!selectedUserId },
  );

  const utils = trpc.useUtils();
  const [pointAmount, setPointAmount] = useState(0);
  const [pointDesc, setPointDesc] = useState("");
  const addPoints = trpc.admin.addUserPoints.useMutation({
    onSuccess: () => {
      utils.admin.userDetailFull.invalidate({ id: selectedUserId! });
      setPointAmount(0);
      setPointDesc("");
      toast.success("포인트가 지급되었습니다.");
    },
    onError: () => toast.error("포인트 지급에 실패했습니다."),
  });

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;
    setSelectedUserId(null);
    setActiveQuery(q);
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId);
  };

  const data = searchResult.data;
  const detail = detailQuery.data;
  const orders = ordersQuery.data?.orders ?? [];
  const ordersTotal = ordersQuery.data?.total ?? 0;

  const displayUser = detail?.user ?? (
    data?.type === "order" ? data.user : null
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">고객 통합 조회</h1>

      {/* ═══ 검색창 ═══ */}
      <div className="bg-card border rounded-xl p-5 elegant-shadow">
        <p className="text-sm text-muted-foreground mb-3">
          이름, 이메일, 전화번호, 또는 주문번호로 검색하세요.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              className="pl-9"
              placeholder="예) 홍길동 / hong@email.com / 01012345678 / 주문번호"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={!query.trim()}>
            <Search className="w-4 h-4 mr-1" /> 조회
          </Button>
        </div>
      </div>

      {searchResult.isLoading && (
        <div className="text-center py-8 text-muted-foreground text-sm">검색 중...</div>
      )}

      {/* ═══ 검색 결과 ─ 회원 목록 ═══ */}
      {data && data.type === "user" && !selectedUserId && (
        <div className="bg-card border rounded-xl overflow-hidden elegant-shadow">
          <div className="px-5 py-3 border-b bg-secondary/30 flex items-center justify-between">
            <span className="font-medium text-sm">검색 결과 <span className="text-muted-foreground">({data.total}명)</span></span>
          </div>
          {data.users.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="divide-y">
              {data.users.map((u: any) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-accent/20 cursor-pointer"
                  onClick={() => handleSelectUser(u.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{u.name ?? "-"}</span>
                        <Badge variant="secondary" className="text-[10px]">{getGradeLabel(u.grade)}</Badge>
                        {u.role === "admin" && <Badge className="text-[10px]">관리자</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{u.email ?? "-"}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone ?? "-"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <div className="text-muted-foreground text-xs">주문</div>
                      <div className="font-medium">{(u.orderCount ?? 0)}건</div>
                    </div>
                    <div className="text-right">
                      <div className="text-muted-foreground text-xs">결제액</div>
                      <div className="font-medium price-text">{formatPrice(u.totalPaid ?? 0)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-muted-foreground text-xs">포인트</div>
                      <div className="font-medium">{(u.points ?? 0).toLocaleString()}P</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ 주문번호 검색 결과 ─ 바로 고객 프로필로 ═══ */}
      {data && data.type === "order" && !selectedUserId && (
        <div
          className="bg-card border rounded-xl p-4 hover:bg-accent/10 cursor-pointer elegant-shadow"
          onClick={() => handleSelectUser((data as any).user.id)}
        >
          <p className="text-xs text-muted-foreground mb-1">주문번호로 고객 확인됨</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <span className="font-medium">{(data as any).user.name ?? "-"}</span>
              <span className="text-sm text-muted-foreground ml-2">{(data as any).user.email ?? "-"}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </div>
        </div>
      )}

      {/* ═══ 선택된 고객 ─ 통합 프로필 ═══ */}
      {selectedUserId && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedUserId(null)}>
              ← 목록으로
            </Button>
            <Link href={`/admin/users/${selectedUserId}`}>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-3.5 h-3.5 mr-1" /> 전체 상세 페이지
              </Button>
            </Link>
          </div>

          {detailQuery.isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-36 bg-gray-200 rounded-xl" />
              <div className="h-64 bg-gray-200 rounded-xl" />
            </div>
          ) : displayUser ? (
            <>
              {/* 회원 정보 카드 */}
              <div className="bg-card border rounded-xl p-5 elegant-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" /> 회원 정보
                  </h2>
                  <Badge variant={displayUser.role === "admin" ? "default" : "secondary"}>
                    {displayUser.role === "admin" ? "관리자" : "일반 회원"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <InfoCell label="이름" value={displayUser.name ?? "-"} />
                  <InfoCell label="아이디(이메일)" value={displayUser.email ?? "-"} />
                  <InfoCell label="전화번호" value={displayUser.phone ?? "-"} />
                  <InfoCell label="등급" value={getGradeLabel(displayUser.grade)} />
                  <InfoCell label="포인트" value={`${(displayUser.points ?? 0).toLocaleString()}P`} />
                  <InfoCell label="총 구매액" value={formatPrice(displayUser.totalSpent ?? 0)} />
                  <InfoCell label="가입일" value={formatDate(displayUser.createdAt)} />
                  <InfoCell label="최근 로그인" value={displayUser.lastSignedIn ? formatDateTime(displayUser.lastSignedIn) : "-"} />
                </div>

                {/* 포인트 지급 */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" /> 포인트 지급/차감
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Input
                      type="number"
                      placeholder="금액 (음수 가능)"
                      className="max-w-[140px] h-8 text-sm"
                      value={pointAmount || ""}
                      onChange={e => setPointAmount(Number(e.target.value))}
                    />
                    <Input
                      placeholder="사유"
                      className="max-w-[260px] h-8 text-sm"
                      value={pointDesc}
                      onChange={e => setPointDesc(e.target.value)}
                    />
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        if (!pointAmount || !pointDesc) { toast.error("금액과 사유를 입력해주세요."); return; }
                        addPoints.mutate({ userId: selectedUserId!, amount: pointAmount, description: pointDesc });
                      }}
                      disabled={addPoints.isPending}
                    >
                      지급
                    </Button>
                  </div>
                </div>
              </div>

              {/* 주문 이력 */}
              <div className="bg-card border rounded-xl p-5 elegant-shadow">
                <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                  <ShoppingBag className="w-4 h-4" /> 주문 이력
                  <span className="text-sm font-normal text-muted-foreground">({ordersTotal}건)</span>
                </h2>
                {orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">주문 내역이 없습니다.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-secondary/50 text-xs text-muted-foreground">
                          <th className="text-left py-2 px-3">주문번호</th>
                          <th className="text-center py-2 px-3">상태</th>
                          <th className="text-left py-2 px-3">상품</th>
                          <th className="text-right py-2 px-3">결제금액</th>
                          <th className="text-left py-2 px-3">수령인</th>
                          <th className="text-left py-2 px-3">주문일</th>
                          <th className="text-center py-2 px-3">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {orders.map((o: any) => (
                          <tr key={o.id} className="hover:bg-accent/10">
                            <td className="py-2 px-3 font-mono text-xs">{formatOrderNumber(o.orderNumber)}</td>
                            <td className="py-2 px-3 text-center">
                              <Badge variant="secondary" className={`text-[10px] ${getOrderStatusColor(o.status)}`}>
                                {getOrderStatusLabel(o.status)}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-xs text-muted-foreground max-w-[180px] truncate">
                              {o.firstProductName ?? "-"}
                              {(o.itemCount ?? 0) > 1 && <span className="ml-1 text-muted-foreground"> 외 {o.itemCount - 1}종</span>}
                            </td>
                            <td className="py-2 px-3 text-right font-medium price-text">
                              {formatPrice(o.totalAmount - (o.discountAmount ?? 0) - (o.pointsUsed ?? 0))}
                            </td>
                            <td className="py-2 px-3">{o.recipientName ?? "-"}</td>
                            <td className="py-2 px-3 text-muted-foreground text-xs">{formatDate(o.createdAt)}</td>
                            <td className="py-2 px-3 text-center">
                              <Link href={`/admin/orders/${o.id}`}>
                                <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                                  상세
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">회원 정보를 불러올 수 없습니다.</div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-all">{value}</p>
    </div>
  );
}
