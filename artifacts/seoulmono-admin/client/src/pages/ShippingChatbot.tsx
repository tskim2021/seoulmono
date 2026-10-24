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
    question: "배송은 얼마나 걸리나요?",
    answer: "일반적으로 주문 후 2-3일 이내에 배송이 완료됩니다. 우체국 택배의 경우 영업일 기준이며, 주말 및 공휴일은 제외됩니다."
  },
  {
    question: "배송비는 얼마인가요?",
    answer: "기본 배송비는 3,000원이며, 50,000원 이상 구매 시 무료배송입니다. 도서산간 지역은 추가 배송비가 발생할 수 있습니다."
  },
  {
    question: "배송 조회는 어떻게 하나요?",
    answer: "운송장 번호를 입력하시면 실시간 배송 현황을 확인하실 수 있습니다. 마이페이지 > 주문내역에서도 조회 가능합니다."
  },
  {
    question: "배송지 변경이 가능한가요?",
    answer: "배송 준비 중 상태에서만 변경 가능합니다. 이미 발송된 경우 택배사에 직접 문의하셔야 합니다."
  },
];

export default function ShippingChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "안녕하세요! 배송 문의 챗봇입니다. 운송장 번호를 입력하시거나 아래 자주 묻는 질문을 선택해주세요.",
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
            ? `운송장 번호 ${input}의 배송 상태는 "${result.status}"입니다. 자세한 내용은 주문 상세 페이지에서 확인하실 수 있습니다.`
            : `운송장 번호 ${input}를 찾을 수 없습니다. 번호를 다시 확인해주세요.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      } catch (e) {
        const botMessage: Message = {
          role: "bot",
          content: "배송 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
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
          : "죄송합니다. 정확한 답변을 찾지 못했습니다. 운송장 번호를 입력하시거나 아래 자주 묻는 질문을 선택해주세요.",
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
        <h1 className="text-3xl font-bold">배송 문의 챗봇</h1>
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
                <p className="text-sm">입력 중...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* FAQ 버튼 */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">자주 묻는 질문:</p>
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
            placeholder="운송장 번호 또는 질문을 입력하세요..."
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
