import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Send, Bot, User } from "lucide-react";
import { toast } from "sonner";

type Message = {
  role: "user" | "bot";
  content: string;
  timestamp: Date;
};

const FAQ_DATA = [
  {
    question: "配送にはどのくらいかかりますか？",
    answer: "通常、ご注文後2〜3日以内に配送が完了します。営業日基準で、土日祝日は除きます。"
  },
  {
    question: "送料はいくらですか？",
    answer: "基本送料は3,000円で、50,000円以上のご購入で送料無料です。離島・山間部など一部地域は追加送料が発生する場合があります。"
  },
  {
    question: "配送状況の確認方法を教えてください",
    answer: "追跡番号を入力すると、リアルタイムの配送状況を確認できます。マイページ > 注文履歴からも確認可能です。"
  },
  {
    question: "配送先の変更はできますか？",
    answer: "配送準備中のステータスのみ変更可能です。すでに発送済みの場合は、配送業者へ直接お問い合わせください。"
  },
];

export default function ShippingChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "こんにちは！配送お問い合わせチャットボットです。追跡番号を入力するか、下のよくあるご質問をお選びください。",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const trackShipment = trpc.shipping.trackByTrackingNumber.useMutation();
  
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    
    // 운송장 번호 패턴 감지 (숫자 10-13자리)
    const trackingPattern = /^\d{10,13}$/;
    if (trackingPattern.test(input.trim())) {
      try {
        const result = await trackShipment.mutateAsync({ trackingNumber: input.trim() });
        const botMessage: Message = {
          role: "bot",
          content: result.found 
            ? `追跡番号 ${input} の配送ステータスは「${result.status}」です。詳細は注文詳細ページでご確認いただけます。`
            : `追跡番号 ${input} が見つかりません。番号をご確認の上、もう一度お試しください。`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      } catch (e) {
        const botMessage: Message = {
          role: "bot",
          content: "配送状況の確認中にエラーが発生しました。しばらくしてからもう一度お試しください。",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } else {
      // FAQ 검색
      const matchedFAQ = FAQ_DATA.find(faq => 
        input.includes(faq.question.slice(0, 3)) || faq.question.includes(input.slice(0, 3))
      );
      
      const botMessage: Message = {
        role: "bot",
        content: matchedFAQ 
          ? matchedFAQ.answer
          : "申し訳ございません。適切な回答が見つかりませんでした。追跡番号を入力するか、下のよくあるご質問をお選びください。",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }
    
    setInput("");
    setLoading(false);
  };
  
  const handleFAQClick = (faq: typeof FAQ_DATA[0]) => {
    const userMessage: Message = {
      role: "user",
      content: faq.question,
      timestamp: new Date(),
    };
    const botMessage: Message = {
      role: "bot",
      content: faq.answer,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage, botMessage]);
  };
  
  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">配送お問い合わせチャットボット</h1>
      </div>
      
      <Card className="p-6">
        {/* 메시지 목록 */}
        <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
          {messages.map((msg) => (
            <div key={`${msg.role}-${msg.timestamp.getTime()}`} className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.role === "bot" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {msg.role === "bot" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className={`flex-1 p-3 rounded-lg ${msg.role === "bot" ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">{msg.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 p-3 rounded-lg bg-muted">
                <p className="text-sm">入力中...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* FAQ 버튼 */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">よくあるご質問:</p>
          <div className="flex flex-wrap gap-2">
            {FAQ_DATA.map((faq) => (
              <Button
                key={faq.question}
                variant="outline"
                size="sm"
                onClick={() => handleFAQClick(faq)}
              >
                {faq.question}
              </Button>
            ))}
          </div>
        </div>
        
        {/* 입력 필드 */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="追跡番号または質問を入力してください..."
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
