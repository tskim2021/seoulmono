import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { invokeLLM } from "../_core/llm";

const sectionTypeEnum = z.enum(["faq", "usage", "dosage", "sideEffects", "precautions"]);

// ─── 시스템 프롬프트 ───
const EXPERT_SYSTEM_PROMPT = `당신은 건강기능식품·의약외품 전문 약사이자 콘텐츠 에디터입니다.

핵심 원칙:
1. **정확성**: 과학적 근거가 있는 정보만 작성합니다. 과장·허위 표현을 절대 사용하지 않습니다.
2. **간결성**: 꼭 필요한 핵심 정보만 담습니다. 억지로 내용을 늘리지 않습니다.
3. **자연스러움**: 번호 나열이나 목록 형식이 아닌, 자연스럽게 읽히는 문장으로 작성합니다.

출력 형식:
- 반드시 유효한 JSON 배열만 반환하세요.
- 마크다운 코드블록, 설명 텍스트 없이 순수 JSON만 반환하세요.
- 각 항목의 content는 자연스럽게 이어지는 2~4문장의 글로 작성하세요. 번호(1,2,3)나 불릿(•,-) 나열 형식은 절대 사용하지 마세요.
- 줄바꿈이 필요한 경우 \\n을 사용하세요.
- 정확히 3개의 항목만 반환하세요.`;

// ─── 섹션별 프롬프트 (간결 버전) ───
const SECTION_PROMPTS: Record<string, string> = {
  faq: `다음 상품에 대한 **자주 묻는 질문(FAQ)**을 정확히 3개만 작성해주세요.

반환 형식: [{"title": "질문", "content": "답변"}, ...]

가장 많이 물어볼 만한 핵심 질문 3가지만 선별하세요. 질문은 고객이 실제로 물어보는 구어체로, 답변은 번호 나열 없이 자연스럽게 이어지는 문장으로 작성하세요.`,

  usage: `다음 상품의 **사용방법**을 정확히 3개 항목으로 작성해주세요.

반환 형식: [{"title": "항목 제목", "content": "상세 설명"}, ...]

사용자가 반드시 알아야 할 핵심 사용법 3가지만 담으세요. content는 번호나 목록 없이 자연스럽게 이어지는 문장으로 작성하세요.`,

  dosage: `다음 상품의 **용량과 용법**을 정확히 3개 항목으로 작성해주세요.

반환 형식: [{"title": "항목 제목", "content": "상세 설명"}, ...]

복용량, 복용 시간, 주의할 점 등 가장 중요한 3가지만 담으세요. content는 번호나 목록 없이 자연스럽게 이어지는 문장으로 작성하세요.`,

  sideEffects: `다음 상품의 **부작용 정보**를 정확히 3개 항목으로 작성해주세요.

반환 형식: [{"title": "부작용 항목", "content": "상세 설명"}, ...]

가장 알려야 할 핵심 부작용 정보 3가지만 담으세요. content는 번호나 목록 없이 자연스럽게 이어지는 문장으로 작성하세요. 불필요한 공포감을 주지 않되, 중요한 정보는 빠뜨리지 마세요.`,

  precautions: `다음 상품의 **주의사항**을 정확히 3개 항목으로 작성해주세요.

반환 형식: [{"title": "주의사항 항목", "content": "상세 설명"}, ...]

사용자가 반드시 알아야 할 가장 중요한 주의사항 3가지만 담으세요. content는 번호나 목록 없이 자연스럽게 이어지는 문장으로 작성하세요.`,
};

const SECTION_LABELS: Record<string, string> = {
  faq: "자주 묻는 질문 (FAQ)",
  usage: "사용방법",
  dosage: "용량/용법",
  sideEffects: "부작용",
  precautions: "주의사항",
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
        `상품명: ${input.productName}`,
        input.productDescription ? `상품 설명: ${input.productDescription}` : "",
        `\n이 상품의 특성(경구 복용제, 외용제, 건강기능식품, 화장품 등)에 맞게 내용을 조정하세요.`,
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
        return { success: false, count: 0, label, error: "AI가 유효한 콘텐츠를 생성하지 못했습니다. 다시 시도해주세요." };
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
      return { success: false, count: 0, label, error: "AI 생성에 실패했습니다. 잠시 후 다시 시도해주세요." };
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
            content: `당신은 건강기능식품·의약외품 전문 약사이자 상품 설명 작성 전문가입니다.

핵심 원칙:
1. **사실 기반**: 과학적 근거가 있는 정보만 작성합니다. 창작하거나 과장하지 않습니다.
2. **정보 없음 표기**: 확인할 수 없는 정보는 "해당 정보를 확인할 수 없습니다"라고 정직하게 표기합니다.
3. **간결함**: 핵심 정보만 담습니다. 억지로 내용을 늘리지 않습니다.
4. **자연스러움**: 번호 나열이나 목록 형식이 아닌, 자연스럽게 읽히는 문장으로 작성합니다.

출력 형식:
- HTML 형식으로 작성하세요. (<h3>, <p>, <strong> 등 사용)
- 마크다운 코드블록이나 설명 텍스트 없이 순수 HTML만 반환하세요.
- 다음 3가지 섹션으로 구성하세요:
  1. 상품 개요 (2~3문장)
  2. 주요 성분 및 특징 (2~3문장)
  3. 복용/사용 간단 안내 (1~2문장)
- 각 섹션은 <h3> 태그로 제목을 달고, <p> 태그로 내용을 작성하세요.
- 전체 분량은 200자 이내로 간결하게 작성하세요.`,
          },
          {
            role: "user",
            content: [
              `상품명: ${input.productName}`,
              input.productDescription ? `상품 설명: ${input.productDescription}` : "",
              `\n이 상품의 특성(경구 복용제, 외용제, 건강기능식품, 화장품 등)에 맞게 내용을 조정하세요.`,
              `\n사실이 아닌 내용은 절대 포함하지 마세요. 확인할 수 없는 정보는 "해당 정보를 확인할 수 없습니다"라고 표기하세요.`,
            ].filter(Boolean).join("\n"),
          },
        ],
      });

      const rawContent = response.choices?.[0]?.message?.content;
      if (!rawContent || typeof rawContent !== "string" || rawContent.trim().length === 0) {
        return { success: false, content: "", error: "AI가 유효한 콘텐츠를 생성하지 못했습니다." };
      }

      // 마크다운 코드블록 제거
      let content = rawContent.trim();
      content = content.replace(/^```html\n?/i, "").replace(/\n?```$/i, "").trim();

      return { success: true, content };
    } catch (error) {
      console.error("[ProductInfo] Description generation failed:", error);
      return { success: false, content: "", error: "AI 생성에 실패했습니다. 잠시 후 다시 시도해주세요." };
    }
  }),

  // 메인 페이지용: 최근 업데이트된 상품 정보 하이라이트
  highlights: publicProcedure.input(z.object({
    limit: z.number().min(1).max(20).optional(),
  }).nullish()).query(async ({ input }) => {
    return db.getProductInfoHighlights(input?.limit ?? 6);
  }),
});
