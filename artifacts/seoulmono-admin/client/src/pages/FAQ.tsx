import Layout from "@/components/Layout";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, ChevronLeft, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { trpc } from "@/lib/trpc";

export default function FAQ() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useSEO({
    title: "FAQ - 자주 묻는 질문",
    description: "탈모학교 자주 묻는 질문과 답변",
  });

  const { data: allFaqs = [], isLoading } = trpc.faq.list.useQuery();

  const filtered = allFaqs.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(allFaqs.map(f => f.category))).sort();

  const grouped = categories
    .map(cat => ({
      category: cat,
      items: filtered.filter(f => f.category === cat),
    }))
    .filter(g => g.items.length > 0);

  const displayGroups = grouped;

  return (
    <Layout>
      <div className="container py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/customer-service")}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            고객센터로 돌아가기
          </Button>
          <h1 className="text-3xl font-bold mb-2">자주 묻는 질문 (FAQ)</h1>
          <p className="text-muted-foreground">
            고객님께서 자주 문의하시는 질문을 모아두었습니다. 해결되지 않으신 경우 1:1 문의를 이용해 주세요.
          </p>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="질문을 검색하세요..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 카테고리 필터 */}
        {!isLoading && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              전체 ({allFaqs.length})
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat} ({allFaqs.filter(f => f.category === cat).length})
              </Button>
            ))}
          </div>
        )}

        {/* FAQ 목록 */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : displayGroups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {search ? "검색 결과가 없습니다." : "등록된 FAQ가 없습니다."}
              </p>
              <Link href="/customer-service/inquiry">
                <Button className="mt-4">1:1 문의하기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {displayGroups.map(group => (
              <div key={group.category}>
                <h2 className="text-xl font-bold mb-3 pb-2 border-b">{group.category}</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {group.items.map((item) => (
                    <AccordionItem
                      key={item.id}
                      value={`faq-${item.id}`}
                      className="border rounded-lg px-4 last:border-b"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <span className="text-left font-medium">
                          <span className="text-primary font-bold mr-2">Q.</span>
                          {item.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pl-6 whitespace-pre-wrap leading-relaxed">
                        <span className="text-primary font-bold mr-2">A.</span>
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        )}

        {/* 하단 CTA */}
        <Card className="mt-12 bg-muted/30">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-bold mb-2">원하는 답변을 찾지 못하셨나요?</h3>
            <p className="text-muted-foreground mb-4">
              1:1 문의를 통해 궁금하신 사항을 문의해 주시면 신속하게 답변드리겠습니다.
            </p>
            <Link href="/customer-service/inquiry">
              <Button>1:1 문의하기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
