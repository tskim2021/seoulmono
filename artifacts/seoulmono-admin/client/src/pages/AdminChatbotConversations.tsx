import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, User, Bot } from "lucide-react";
import Paginator from "@/components/Paginator";
import { Streamdown } from "streamdown";

export default function AdminChatbotConversations() {
  const [page, setPage] = useState(1);
  const limit = 20;
  
  const { data, isLoading } = trpc.chatbotAdmin.getConversations.useQuery({ page, limit });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const conversations = data?.conversations || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            会話履歴
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ユーザーとチャットボットの会話履歴を確認できます。
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          合計 <span className="font-semibold text-foreground">{total}</span>件
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>会話一覧</CardTitle>
          <CardDescription>
            直近の会話履歴が新しい順に表示されます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>会話履歴がありません。</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {conversations.map((conv: any) => (
                  <div key={conv.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {conv.userId ? (
                          <Badge variant="outline">ユーザーID: {conv.userId}</Badge>
                        ) : (
                          <Badge variant="secondary">匿名</Badge>
                        )}
                        {conv.productId && (
                          <Badge variant="outline">商品ID: {conv.productId}</Badge>
                        )}
                      </div>
                      <span>{new Date(conv.createdAt).toLocaleString('ja-JP')}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex gap-2 items-start">
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <User className="w-3 h-3" />
                        </div>
                        <div className="flex-1 bg-secondary/50 rounded-lg p-3 text-sm">
                          {conv.userMessage}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 items-start">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="w-3 h-3 text-primary" />
                        </div>
                        <div className="flex-1 bg-muted rounded-lg p-3 text-sm">
                          <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                            <Streamdown>{conv.botResponse}</Streamdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <Paginator page={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
