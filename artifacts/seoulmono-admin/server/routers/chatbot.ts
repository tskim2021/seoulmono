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
お客様が現在ご覧の商品情報:
- 商品名: ${productById.name}
- 価格: ${productById.salePrice ?? productById.price}円 ${productById.salePrice ? `(定価 ${productById.price}円)` : ""}
- 説明: ${productById.description ?? "なし"}
- 在庫: ${productById.stock}個
- オプション: ${options.map(o => `${o.name}: ${(o.values as any[]).map((v: any) => `${v.value}(${v.price.toLocaleString()}円, 在庫${v.stock}個)`).join(", ")}`).join(" / ")}
`;
      }
    }

    // 최근 인기 상품 정보
    const { products: popularProducts } = await db.getProducts({ sort: "popular", limit: 5 });
    const popularContext = popularProducts.length > 0 ? `
人気商品TOP5:
${popularProducts.map((p, i) => `${i + 1}. ${p.name} - ${(p.salePrice ?? p.price).toLocaleString()}円`).join("\n")}
` : "";

    // 카테고리 정보
    const categories = await db.getAllCategories();
    const categoryContext = categories.length > 0 ? `
カテゴリ: ${categories.filter(c => !c.parentId).map(c => c.name).join(", ")}
` : "";

    // 주문/배송 정보 (로그인 사용자)
    let orderContext = "";
    if (ctx.user) {
      const { orders } = await db.getUserOrders(ctx.user.id, 1, 3);
      if (orders.length > 0) {
        orderContext = `
お客様の最近のご注文:
${orders.map(o => `- 注文番号: ${o.orderNumber}, 状態: ${o.status}, 金額: ${o.totalAmount.toLocaleString()}円`).join("\n")}
`;
      }
    }

    const systemPrompt = `あなたはソウルモノのショッピングモールのAIカスタマーサポート担当です。丁寧かつ専門的にお客様をサポートしてください。

役割:
- 商品のおすすめと詳細情報のご案内
- ご注文・配送状況のご案内
- 交換・返品手続きのご案内
- クーポン・ポイントの利用方法のご案内
- ショッピングモールのご利用案内

ショップのポリシー:
- 5,000円以上のご購入で送料無料（未満の場合は送料500円）
- ご購入金額の1%をポイント還元
- お支払い後7日以内の交換・返品が可能
- ポイントは1ポイントからご利用可能

${productContext}
${popularContext}
${categoryContext}
${orderContext}

回答ルール:
- 日本語で回答してください
- 簡潔で親切に回答してください
- 商品をおすすめする際は具体的な商品名と価格を案内してください
- わからない情報は「カスタマーサポート（平日 09:00-18:00）までお問い合わせください」と案内してください
- Markdown形式で回答してください`;

    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      ...input.messages.filter(m => m.role !== "system").map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const result = await invokeLLM({ messages });
    return {
      content: result.choices[0]?.message?.content ?? "申し訳ございません。しばらくしてからもう一度お試しください。",
    };
  }),

  // 추천 질문 목록
  suggestedQuestions: publicProcedure.input(z.object({
    productId: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const general = [
      "人気商品を教えてください",
      "配送にはどのくらいかかりますか？",
      "ポイントの使い方を教えてください",
      "交換・返品の手続きを知りたいです",
    ];

    if (input?.productId) {
      return [
        "この商品のサイズをおすすめしてください",
        "似た商品をおすすめしてください",
        "この商品はいつ届きますか？",
        "クーポンは使えますか？",
      ];
    }

    return general;
  }),
});
