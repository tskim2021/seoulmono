import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { invokeLLM, type Message } from "../_core/llm";
import * as db from "../db";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export const chatbotRouter = router({
  // 카테고리별 문답 조회 (public)
  getQnaByCategory: publicProcedure.input(z.object({
    categoryId: z.number(),
  })).query(async ({ input }) => {
    return await db.getChatbotQnaByCategory(input.categoryId);
  }),
  
  // 대화 이력 저장
  saveConversation: publicProcedure.input(z.object({
    userMessage: z.string(),
    botResponse: z.string(),
    productId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    return await db.saveChatbotConversation({
      userId: ctx.user?.id,
      userMessage: input.userMessage,
      botResponse: input.botResponse,
      productId: input.productId,
    });
  }),
  chat: publicProcedure.input(z.object({
    messages: z.array(messageSchema),
    productId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    // 상품 컨텍스트 수집
    let productContext = "";
    if (input.productId) {
      const productById = await db.getProductById(input.productId);
      if (productById) {
        const options = await db.getProductOptions(input.productId);
        productContext = `
현재 고객이 보고 있는 상품 정보:
- 상품명: ${productById.name}
- 가격: ${productById.salePrice ?? productById.price}원 ${productById.salePrice ? `(정가 ${productById.price}원)` : ""}
- 설명: ${productById.description ?? "없음"}
- 재고: ${productById.stock}개
- 옵션: ${options.map(o => `${o.name}: ${(o.values as any[]).map((v: any) => `${v.value}(${v.price.toLocaleString()}원, 재고${v.stock}개)`).join(", ")}`).join(" / ")}
`;
      }
    }

    // 최근 인기 상품 정보
    const { products: popularProducts } = await db.getProducts({ sort: "popular", limit: 5 });
    const popularContext = popularProducts.length > 0 ? `
인기 상품 TOP 5:
${popularProducts.map((p, i) => `${i + 1}. ${p.name} - ${(p.salePrice ?? p.price).toLocaleString()}원`).join("\n")}
` : "";

    // 카테고리 정보
    const categories = await db.getAllCategories();
    const categoryContext = categories.length > 0 ? `
카테고리: ${categories.filter(c => !c.parentId).map(c => c.name).join(", ")}
` : "";

    // 주문/배송 정보 (로그인 사용자)
    let orderContext = "";
    if (ctx.user) {
      const { orders } = await db.getUserOrders(ctx.user.id, 1, 3);
      if (orders.length > 0) {
        orderContext = `
고객의 최근 주문:
${orders.map(o => `- 주문번호: ${o.orderNumber}, 상태: ${o.status}, 금액: ${o.totalAmount.toLocaleString()}원`).join("\n")}
`;
      }
    }

    const systemPrompt = `당신은 탈모학교 쇼핑몰의 AI 고객 상담사입니다. 친절하고 전문적으로 고객을 도와주세요.

역할:
- 상품 추천 및 상세 정보 안내
- 주문/배송 상태 안내
- 교환/반품 절차 안내
- 쿠폰/포인트 사용 방법 안내
- 일반적인 쇼핑몰 이용 안내

쇼핑몰 정책:
- 5만원 이상 구매 시 무료배송 (미만 시 배송비 3,000원)
- 구매 금액의 1% 포인트 적립
- 결제 후 7일 이내 교환/반품 가능
- 포인트는 1포인트부터 사용 가능

${productContext}
${popularContext}
${categoryContext}
${orderContext}

답변 규칙:
- 한국어로 답변하세요
- 간결하고 친절하게 답변하세요
- 상품 추천 시 구체적인 상품명과 가격을 안내하세요
- 모르는 정보는 "고객센터(평일 09:00-18:00)로 문의해주세요"로 안내하세요
- 마크다운 형식으로 답변하세요`;

    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      ...input.messages.filter(m => m.role !== "system").map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const result = await invokeLLM({ messages });
    return {
      content: result.choices[0]?.message?.content ?? "죄송합니다. 잠시 후 다시 시도해주세요.",
    };
  }),

  // 추천 질문 목록
  suggestedQuestions: publicProcedure.input(z.object({
    productId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const general = [
      "인기 상품을 추천해주세요",
      "배송은 얼마나 걸리나요?",
      "포인트 사용 방법을 알려주세요",
      "교환/반품 절차가 궁금해요",
    ];

    if (input?.productId) {
      return [
        "이 상품의 사이즈 추천해주세요",
        "비슷한 상품 추천해주세요",
        "이 상품 배송은 언제 되나요?",
        "쿠폰 적용 가능한가요?",
      ];
    }

    return general;
  }),
});
