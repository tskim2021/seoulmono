import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function ChatbotWidget({ productId }: { productId?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const chatMutation = trpc.chatbot.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant" as const, content: String(data.content) }]);
    },
    onError: () => {
      setMessages(prev => [...prev, { role: "assistant", content: "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }]);
    },
  });

  const { data: suggestedQuestions } = trpc.chatbot.suggestedQuestions.useQuery(
    productId ? { productId } : undefined
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [messages, chatMutation.isPending]);

  const handleSend = (content: string) => {
    if (!content.trim() || chatMutation.isPending) return;
    const userMsg: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    chatMutation.mutate({
      messages: newMessages.filter(m => m.role !== "system"),
      productId,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleReset = () => {
    if (messages.length === 0) return;
    if (confirm("대화 내용을 모두 삭제하시겠습니까?")) {
      setMessages([]);
      setInput("");
    }
  };

  const displayMessages = messages.filter(m => m.role !== "system");

  // Compute container style based on screen size
  const containerStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed" as const,
        inset: "0",
        zIndex: 50,
        display: "flex",
        flexDirection: "column" as const,
        overflow: "hidden",
      }
    : {
        position: "fixed" as const,
        bottom: "24px",
        right: "24px",
        zIndex: 50,
        width: "380px",
        height: "600px",
        maxHeight: "calc(100vh - 3rem)",
        display: "flex",
        flexDirection: "column" as const,
        overflow: "hidden",
        borderRadius: "1rem",
        border: "1px solid var(--border)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 sm:w-14 sm:h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-105"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="bg-background animate-in slide-in-from-bottom-4 duration-300"
          style={containerStyle}
        >
          {/* Header */}
          <div
            className={cn(
              "bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between",
              isMobile ? "" : "rounded-t-2xl"
            )}
            style={{ flexShrink: 0 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AIアシスタント</h3>
                <p className="text-xs opacity-80">何でもご質問ください</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {displayMessages.length > 0 && (
                <button
                  onClick={handleReset}
                  className="p-1.5 rounded-full hover:bg-primary-foreground/20 transition-colors"
                  title="会話をリセット"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-primary-foreground/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages - scrollable area */}
          <div
            ref={scrollContainerRef}
            className="overscroll-contain"
            style={{
              flex: "1 1 0%",
              minHeight: 0,
              overflowY: "auto",
            }}
          >
            <div className="p-4">
              {displayMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-1">こんにちは！</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    탈모학교 AI 상담사입니다.<br />무엇을 도와드릴까요?
                  </p>
                  {suggestedQuestions && suggestedQuestions.length > 0 && (
                    <div className="space-y-2 w-full">
                      {suggestedQuestions.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleSend(q)}
                          className="w-full text-left text-sm px-3 py-2 rounded-lg border hover:bg-accent transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {displayMessages.map((msg, i) => (
                    <div key={`msg-${i}-${msg.content.slice(0, 20)}`} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      )}>
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                            <Streamdown>{msg.content}</Streamdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex gap-2 items-start">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-md px-3.5 py-2.5">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Actions (when messages exist) */}
          {displayMessages.length > 0 && suggestedQuestions && (
            <div
              className="px-3 pb-1 bg-background flex gap-1.5 overflow-x-auto scrollbar-hide border-t"
              style={{ flexShrink: 0 }}
            >
              {suggestedQuestions.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={chatMutation.isPending}
                  className="shrink-0 text-xs px-2.5 py-1 rounded-full border hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="p-3 border-t bg-background flex items-end gap-2"
            style={{
              flexShrink: 0,
              paddingBottom: isMobile ? "max(0.75rem, env(safe-area-inset-bottom))" : "0.75rem",
            }}
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力してください..."
              className="min-h-[44px] sm:min-h-[40px] max-h-[100px] resize-none text-sm rounded-xl"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || chatMutation.isPending}
              className="shrink-0 rounded-xl h-11 w-11 sm:h-10 sm:w-10"
            >
              {chatMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
