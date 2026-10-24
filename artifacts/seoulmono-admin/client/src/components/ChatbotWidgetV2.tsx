import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles, RefreshCw, ArrowLeft, FolderTree } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ViewMode = "welcome" | "categories" | "qna" | "chat";

type NavigationState = {
  mode: ViewMode;
  categoryId?: number;
  categoryName?: string;
};

export function ChatbotWidgetV2({ productId }: { productId?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // 네비게이션 스택
  const [navStack, setNavStack] = useState<NavigationState[]>([{ mode: "welcome" }]);
  const currentNav = navStack[navStack.length - 1];

  // 챗봇 설정 및 카테고리 데이터
  const { data: settings } = trpc.chatbotAdmin.getSettings.useQuery();
  const { data: categories } = trpc.chatbotAdmin.getCategories.useQuery();
  const { data: qnaList } = trpc.chatbot.getQnaByCategory.useQuery(
    { categoryId: currentNav.categoryId! },
    { enabled: currentNav.mode === "qna" && !!currentNav.categoryId }
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const saveConversationMutation = trpc.chatbot.saveConversation.useMutation();

  const chatMutation = trpc.chatbot.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant" as const, content: String(data.content) }]);
    },
    onError: () => {
      setMessages(prev => [...prev, { role: "assistant", content: settings?.responseUnavailableMessage || "죄송합니다. 일시적인 오류가 발생했습니다." }]);
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [messages, chatMutation.isPending, currentNav]);

  const handleSend = (content: string) => {
    if (!content.trim() || chatMutation.isPending) return;
    const userMsg: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    
    // 채팅 모드로 전환
    if (currentNav.mode !== "chat") {
      setNavStack([...navStack, { mode: "chat" }]);
    }
    
    chatMutation.mutate({
      messages: newMessages.filter(m => m.role !== "system"),
      productId,
    }, {
      onSuccess: (data) => {
        // 대화 이력 저장
        saveConversationMutation.mutate({
          userMessage: content.trim(),
          botResponse: String(data.content),
          productId,
        });
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleReset = () => {
    if (messages.length === 0 && navStack.length === 1) return;
    if (confirm("대화를 초기화하시겠습니까?")) {
      setMessages([]);
      setInput("");
      setNavStack([{ mode: "welcome" }]);
    }
  };

  const handleBack = () => {
    if (navStack.length > 1) {
      setNavStack(navStack.slice(0, -1));
    }
  };

  const handleCategoryClick = (categoryId: number, categoryName: string) => {
    // 하위 카테고리가 있는지 확인
    const hasSubcategories = categories?.some(c => c.parentId === categoryId);
    
    if (hasSubcategories) {
      // 하위 카테고리 목록 표시
      setNavStack([...navStack, { mode: "categories", categoryId, categoryName }]);
    } else {
      // 문답 목록 표시
      setNavStack([...navStack, { mode: "qna", categoryId, categoryName }]);
    }
  };

  const handleQnaClick = (question: string, answer: string) => {
    // 문답 내용을 메시지로 추가
    setMessages([
      { role: "user", content: question },
      { role: "assistant", content: answer },
    ]);
    setNavStack([...navStack, { mode: "chat" }]);
    
    // 대화 이력 저장
    saveConversationMutation.mutate({
      userMessage: question,
      botResponse: answer,
      productId,
    });
  };

  const handleAIChat = () => {
    setNavStack([...navStack, { mode: "chat" }]);
  };

  const displayMessages = messages.filter(m => m.role !== "system");

  // 현재 표시할 카테고리 목록
  const displayCategories = categories?.filter(c => {
    if (currentNav.mode === "welcome" || !currentNav.categoryId) {
      return !c.parentId; // 최상위 카테고리만
    }
    return c.parentId === currentNav.categoryId; // 선택된 카테고리의 하위 카테고리
  }) || [];

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
        width: "400px",
        height: "650px",
        maxHeight: "calc(100vh - 3rem)",
        display: "flex",
        flexDirection: "column" as const,
        overflow: "hidden",
        borderRadius: "1rem",
        border: "1px solid var(--border)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      };

  // 챗봇이 비활성화된 경우
  if (!settings?.isEnabled) {
    return null;
  }

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
              {navStack.length > 1 && (
                <button
                  onClick={handleBack}
                  className="p-1.5 rounded-full hover:bg-primary-foreground/20 transition-colors"
                  title="戻る"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  {currentNav.categoryName || "AI 상담사"}
                </h3>
                <p className="text-xs opacity-80">
                  {currentNav.mode === "welcome" && "무엇이든 물어보세요"}
                  {currentNav.mode === "categories" && "카테고리 선택"}
                  {currentNav.mode === "qna" && "질문 선택"}
                  {currentNav.mode === "chat" && "AI와 대화 중"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {(displayMessages.length > 0 || navStack.length > 1) && (
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

          {/* Content Area */}
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
              {/* Welcome Screen */}
              {currentNav.mode === "welcome" && (
                <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">こんにちは！</h4>
                    <p className="text-sm text-muted-foreground">
                      {settings?.greetingMessage || "탈모학교 AI 상담사입니다. 무엇을 도와드릴까요?"}
                    </p>
                  </div>
                  
                  {displayCategories.length > 0 && (
                    <div className="space-y-2 w-full">
                      <p className="text-xs text-muted-foreground font-medium">カテゴリ別お問い合わせ</p>
                      {displayCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategoryClick(cat.id, cat.name)}
                          className="w-full text-left text-sm px-4 py-3 rounded-lg border hover:bg-accent transition-colors flex items-center gap-2"
                        >
                          {cat.icon && <span className="text-lg">{cat.icon}</span>}
                          <div className="flex-1">
                            <div className="font-medium">{cat.name}</div>
                            {cat.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">{cat.description}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="w-full pt-2">
                    <button
                      onClick={handleAIChat}
                      className="w-full text-sm px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                    >
                      AI와 직접 대화하기
                    </button>
                  </div>
                </div>
              )}

              {/* Categories Screen */}
              {currentNav.mode === "categories" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">サブカテゴリを選択してください</p>
                  {displayCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id, cat.name)}
                      className="w-full text-left text-sm px-4 py-3 rounded-lg border hover:bg-accent transition-colors flex items-center gap-2"
                    >
                      {cat.icon && <span className="text-lg">{cat.icon}</span>}
                      <div className="flex-1">
                        <div className="font-medium">{cat.name}</div>
                        {cat.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">{cat.description}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* QnA Screen */}
              {currentNav.mode === "qna" && qnaList && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">よくあるご質問を選択してください</p>
                  {qnaList.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">登録された質問はありません。</p>
                    </div>
                  ) : (
                    qnaList.map((qna: any) => (
                      <button
                        key={qna.id}
                        onClick={() => handleQnaClick(qna.question, qna.answer)}
                        className="w-full text-left text-sm px-4 py-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="font-medium">{qna.question}</div>
                      </button>
                    ))
                  )}
                  <div className="pt-2">
                    <button
                      onClick={handleAIChat}
                      className="w-full text-sm px-4 py-2 rounded-lg bg-muted hover:bg-accent transition-colors"
                    >
                      AI와 직접 대화하기
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Screen */}
              {currentNav.mode === "chat" && (
                <>
                  {displayMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Bot className="w-8 h-8 text-primary" />
                      </div>
                      <h4 className="font-semibold mb-1">AIとチャットする</h4>
                      <p className="text-sm text-muted-foreground">
                        궁금한 점을 자유롭게 물어보세요
                      </p>
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
                </>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area - only show in chat mode */}
          {currentNav.mode === "chat" && (
            <div
              className={cn(
                "border-t bg-background px-3 py-3",
                isMobile ? "" : "rounded-b-2xl"
              )}
              style={{ flexShrink: 0 }}
            >
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="メッセージを入力してください..."
                  className="resize-none text-sm min-h-[40px] max-h-[120px]"
                  rows={1}
                  disabled={chatMutation.isPending}
                />
                <Button
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || chatMutation.isPending}
                  size="icon"
                  className="shrink-0 h-10 w-10"
                >
                  {chatMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
