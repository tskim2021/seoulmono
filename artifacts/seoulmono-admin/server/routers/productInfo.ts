import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { invokeLLM } from "../_core/llm";

const sectionTypeEnum = z.enum(["faq", "usage", "dosage", "sideEffects", "precautions"]);

// ─── 시스템 프롬프트 ───
const EXPERT_SYSTEM_PROMPT = `あなたは健康食品・医薬部外品に詳しい薬剤師であり、コンテンツエディターです。

基本原則:
1. **正確性**: 科学的根拠のある情報のみ記載します。誇張・虚偽の表現は決して使いません。
2. **簡潔性**: 本当に必要な要点だけを記載します。無理に内容を水増ししません。
3. **自然さ**: 番号の羅列や箇条書きではなく、自然に読める文章で書きます。

出力形式:
- 必ず有効なJSON配列のみを返してください。
- Markdownのコードブロックや説明文は付けず、純粋なJSONのみを返してください。
- 各項目のcontentは、自然につながる2〜4文の文章で書いてください。番号(1,2,3)や箇条書き記号(•,-)による羅列は絶対に使わないでください。
- 改行が必要な場合は \\n を使用してください。
- 必ず3件の項目のみを返してください。`;

// ─── 섹션별 프롬프트 (간결 버전) ───
const SECTION_PROMPTS: Record<string, string> = {
  faq: `次の商品に関する**よくある質問(FAQ)**を、必ず3件だけ作成してください。

返却形式: [{"title": "質問", "content": "回答"}, ...]

最もよくある重要な質問を3つだけ選んでください。質問はお客様が実際に尋ねる話し言葉で、回答は番号の羅列なしで自然につながる文章で書いてください。`,

  usage: `次の商品の**使用方法**を、必ず3項目で作成してください。

返却形式: [{"title": "項目タイトル", "content": "詳細説明"}, ...]

ユーザーが必ず知っておくべき主要な使い方を3つだけ含めてください。contentは番号や箇条書きなしで、自然につながる文章で書いてください。`,

  dosage: `次の商品の**用量・用法**を、必ず3項目で作成してください。

返却形式: [{"title": "項目タイトル", "content": "詳細説明"}, ...]

服用量、服用時間、注意点など、最も重要な3つだけを含めてください。contentは番号や箇条書きなしで、自然につながる文章で書いてください。`,

  sideEffects: `次の商品の**副作用情報**を、必ず3項目で作成してください。

返却形式: [{"title": "副作用の項目", "content": "詳細説明"}, ...]

最も伝えるべき主要な副作用情報を3つだけ含めてください。contentは番号や箇条書きなしで、自然につながる文章で書いてください。不必要に不安を煽らず、重要な情報は漏らさないでください。`,

  precautions: `次の商品の**注意事項**を、必ず3項目で作成してください。

返却形式: [{"title": "注意事項の項目", "content": "詳細説明"}, ...]

ユーザーが必ず知っておくべき最も重要な注意事項を3つだけ含めてください。contentは番号や箇条書きなしで、自然につながる文章で書いてください。`,
};

const SECTION_LABELS: Record<string, string> = {
  faq: "よくある質問 (FAQ)",
  usage: "使用方法",
  dosage: "用量・用法",
  sideEffects: "副作用",
  precautions: "注意事項",
};

export const productInfoRouter = router({
  // 공개: 상품별 정보 섹션 조회
  getByProduct: publicProcedure.input(z.object({
    productId: z.number(),
    sectionType: sectionTypeEnum.optional(),
  })).query(async ({ input }) => {
    return db.getProductInfoSections(input.productId, input.sectionType);
  }),

  // 관리자: 상품별 전체 정보 섹션 조회 (비활성 포함)
  adminGetByProduct: adminProcedure.input(z.object({
    productId: z.number(),
  })).query(async ({ input }) => {
    return db.getProductInfoSectionsAdmin(input.productId);
  }),

  // 관리자: 정보 섹션 생성
  create: adminProcedure.input(z.object({
    productId: z.number(),
    sectionType: sectionTypeEnum,
    title: z.string().min(1).max(255),
    content: z.string().min(1),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input }) => {
    const id = await db.createProductInfoSection({
      productId: input.productId,
      sectionType: input.sectionType,
      title: input.title,
      content: input.content,
      sortOrder: input.sortOrder,
    });
    return { id };
  }),

  // 관리자: 정보 섹션 수정
  update: adminProcedure.input(z.object({
    id: z.number(),
    title: z.string().min(1).max(255).optional(),
    content: z.string().min(1).optional(),
    sortOrder: z.number().optional(),
    isActive: z.number().min(0).max(1).optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateProductInfoSection(id, data);
    return { success: true };
  }),

  // 관리자: 정보 섹션 삭제
  delete: adminProcedure.input(z.object({
    id: z.number(),
  })).mutation(async ({ input }) => {
    await db.deleteProductInfoSection(input.id);
    return { success: true };
  }),

  // 관리자: LLM으로 초안 자동 생성
  generateDraft: adminProcedure.input(z.object({
    productId: z.number(),
    productName: z.string(),
    productDescription: z.string().optional(),
    sectionType: sectionTypeEnum,
  })).mutation(async ({ input }) => {
    const prompt = SECTION_PROMPTS[input.sectionType] || SECTION_PROMPTS.faq;
    const label = SECTION_LABELS[input.sectionType] || input.sectionType;

    try {
      const productContext = [
        `商品名: ${input.productName}`,
        input.productDescription ? `商品説明: ${input.productDescription}` : "",
        `\nこの商品の特性（内服薬、外用薬、健康食品、化粧品など）に合わせて内容を調整してください。`,
      ].filter(Boolean).join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: EXPERT_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `${productContext}\n\n${prompt}`,
          },
        ],
      });

      const rawContent = response.choices?.[0]?.message?.content;
      const text = typeof rawContent === "string" ? rawContent : "[]";
      // Extract JSON from possible markdown code blocks
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const items: { title: string; content: string }[] = JSON.parse(jsonMatch?.[0] ?? "[]");

      // 유효성 검증: title과 content가 모두 있는 항목만 저장
      const validItems = items.filter(
        (item) => item.title && item.title.trim().length > 0 && item.content && item.content.trim().length > 0
      ).slice(0, 3); // 최대 3개만 저장

      if (validItems.length === 0) {
        return { success: false, count: 0, label, error: "AIが有効なコンテンツを生成できませんでした。もう一度お試しください。" };
      }

      // 생성된 항목을 DB에 저장
      const sections = validItems.map((item, idx) => ({
        productId: input.productId,
        sectionType: input.sectionType,
        title: item.title.trim(),
        content: item.content.trim(),
        sortOrder: idx,
        isAutoGenerated: 1,
      }));

      await db.bulkCreateProductInfoSections(sections);

      return { success: true, count: sections.length, label };
    } catch (error) {
      console.error("[ProductInfo] LLM generation failed:", error);
      return { success: false, count: 0, label, error: "AI生成に失敗しました。しばらくしてからもう一度お試しください。" };
    }
  }),

  // 관리자: AI로 상품 상세 설명(content) 생성
  generateDescription: adminProcedure.input(z.object({
    productId: z.number(),
    productName: z.string(),
    productDescription: z.string().optional(),
  })).mutation(async ({ input }) => {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `あなたは健康食品・医薬部外品に詳しい薬剤師であり、商品説明の作成の専門家です。

基本原則:
1. **事実に基づく**: 科学的根拠のある情報のみ記載します。創作や誇張はしません。
2. **情報なしの明記**: 確認できない情報は「該当する情報を確認できません」と正直に記載します。
3. **簡潔さ**: 要点だけを記載します。無理に内容を水増ししません。
4. **自然さ**: 番号の羅列や箇条書きではなく、自然に読める文章で書きます。

出力形式:
- HTML形式で書いてください。（<h3>、<p>、<strong>などを使用）
- Markdownのコードブロックや説明文は付けず、純粋なHTMLのみを返してください。
- 次の3つのセクションで構成してください:
  1. 商品概要（2〜3文）
  2. 主な成分と特徴（2〜3文）
  3. 服用・使用の簡単な案内（1〜2文）
- 各セクションは<h3>タグで見出しを付け、<p>タグで内容を書いてください。
- 全体の分量は200文字以内で簡潔に書いてください。`,
          },
          {
            role: "user",
            content: [
              `商品名: ${input.productName}`,
              input.productDescription ? `商品説明: ${input.productDescription}` : "",
              `\nこの商品の特性（内服薬、外用薬、健康食品、化粧品など）に合わせて内容を調整してください。`,
              `\n事実でない内容は絶対に含めないでください。確認できない情報は「該当する情報を確認できません」と記載してください。`,
            ].filter(Boolean).join("\n"),
          },
        ],
      });

      const rawContent = response.choices?.[0]?.message?.content;
      if (!rawContent || typeof rawContent !== "string" || rawContent.trim().length === 0) {
        return { success: false, content: "", error: "AIが有効なコンテンツを生成できませんでした。" };
      }

      // 마크다운 코드블록 제거
      let content = rawContent.trim();
      content = content.replace(/^```html\n?/i, "").replace(/\n?```$/i, "").trim();

      return { success: true, content };
    } catch (error) {
      console.error("[ProductInfo] Description generation failed:", error);
      return { success: false, content: "", error: "AI生成に失敗しました。しばらくしてからもう一度お試しください。" };
    }
  }),

  // 메인 페이지용: 최근 업데이트된 상품 정보 하이라이트
  highlights: publicProcedure.input(z.object({
    limit: z.number().min(1).max(20).optional(),
  }).nullish()).query(async ({ input }) => {
    return db.getProductInfoHighlights(input?.limit ?? 6);
  }),
});
