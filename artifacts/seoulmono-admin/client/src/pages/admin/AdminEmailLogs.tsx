import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useState } from "react";
import { Mail, Send, Search, Eye } from "lucide-react";
import Paginator from "@/components/Paginator";
import { formatDateTime } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminEmailLogs() {
  const [page, setPage] = useState(1);
  const [userIdFilter, setUserIdFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  
  const { data, isLoading } = trpc.admin.emailLogs.useQuery({
    page,
    limit: 20,
    userId: userIdFilter ? Number(userIdFilter) : undefined,
  });
  
  const utils = trpc.useUtils();
  const resendMut = trpc.admin.resendEmail.useMutation({
    onSuccess: () => {
      toast.success("이메일이 재발송되었습니다");
      utils.admin.emailLogs.invalidate();
    },
    onError: (error: any) => {
      toast.error(`재발송 실패: ${error.message}`);
    },
  });

  const handleResend = (logId: number) => {
    if (confirm("이 이메일을 재발송하시겠습니까?")) {
      resendMut.mutate({ logId });
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="w-6 h-6" />
          이메일 발송 이력
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          시스템에서 발송된 모든 이메일 내역을 확인하고 재발송할 수 있습니다
        </p>
      </div>

      <Card className="p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="사용자 ID로 필터링..."
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={() => setUserIdFilter("")}>
            초기화
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
      ) : !data || data.logs.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          발송된 이메일이 없습니다
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {data.logs.map((log: any) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={log.status === "sent" ? "default" : "destructive"}>
                        {log.status === "sent" ? "발송 완료" : "발송 실패"}
                      </Badge>
                      {log.userId && (
                        <span className="text-xs text-muted-foreground">
                          사용자 ID: {log.userId}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium truncate">{log.subject}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        수신: {log.recipient}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(new Date(log.sentAt))}
                      </div>
                      {log.errorMessage && (
                        <div className="text-xs text-destructive mt-2">
                          에러: {log.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResend(log.id)}
                      disabled={resendMut.isPending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>이메일 내용 미리보기</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">제목</div>
                <div className="text-sm text-muted-foreground">{selectedLog.subject}</div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">수신자</div>
                <div className="text-sm text-muted-foreground">{selectedLog.recipient}</div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">내용</div>
                <div
                  className="border rounded-lg p-4 bg-gray-50"
                  dangerouslySetInnerHTML={{ __html: selectedLog.htmlContent }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
