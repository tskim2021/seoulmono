import { invokeLLM } from "../_core/llm";
import { generateImage } from "../_core/imageGeneration";
import * as db from "../db";
import type { DiscussionAutoSetting } from "../../drizzle/schema";

const STYLE_LABELS: Record<string, string> = {
  debate: "찬반 토론형",
  opinion: "의견 교환형",
  question: "질문/토의형",
  poll: "투표/설문형",
  experience: "경험 공유형",
};

const STYLE_PROMPTS: Record<string, string> = {
  debate: `[찬반 토론형 작성 가이드]
- 명확한 찬반 입장이 나뉠 수 있는 주제를 선정합니다.
- 양쪽 입장의 근거를 균형 있게 제시합니다.
- 독자가 자신의 의견을 밝히고 싶어지도록 유도합니다.
- 결론을 내리지 않고 열린 질문으로 마무리합니다.`,

  opinion: `[의견 교환형 작성 가이드]
- 다양한 관점에서 생각해볼 수 있는 주제를 다룹니다.
- 하나의 정답이 없는 주제를 선정합니다.
- 자신의 의견을 먼저 제시하되, 다른 의견도 환영하는 톤으로 작성합니다.
- 구체적인 경험이나 사례를 포함하여 공감을 유도합니다.`,

  question: `[질문/토의형 작성 가이드]
- 커뮤니티 구성원들의 지식과 경험을 모을 수 있는 질문을 던집니다.
- 구체적이고 명확한 질문을 제시합니다.
- 질문의 배경과 맥락을 충분히 설명합니다.
- 답변자들이 다양한 관점에서 응답할 수 있도록 열린 질문을 사용합니다.`,

  poll: `[투표/설문형 작성 가이드]
- 2~5개의 선택지를 제시하는 형태로 작성합니다.
- 각 선택지에 대한 간략한 설명을 포함합니다.
- 투표 참여를 유도하는 흥미로운 도입부를 작성합니다.
- 선택지 외에도 자유 의견을 남길 수 있도록 안내합니다.`,

  experience: `[경험 공유형 작성 가이드]
- 특정 제품이나 건강 관련 경험을 공유하는 형태로 작성합니다.
- 구체적인 사용 경험, 효과, 주의사항 등을 포함합니다.
- 다른 사용자들도 자신의 경험을 공유하도록 유도합니다.
- 솔직하고 균형 잡힌 톤으로 작성합니다.`,
};

interface GeneratedDiscussion {
  title: string;
  content: string;
  tags: string[];
}

/**
 * 토론 제목과 주제를 기반으로 이미지 생성 프롬프트를 만듭니다.
 */
function buildImagePrompt(title: string, topic: string, keywords?: string | null): string {
  const keywordPart = keywords ? `, related to ${keywords}` : "";
  return `A clean, professional, modern illustration for a community discussion forum post titled "${title}". The image should represent the topic of "${topic}"${keywordPart}. Use a vibrant but professional color palette. The style should be flat design or minimalist illustration, suitable for a health community discussion board. No text in the image. High quality, 16:9 aspect ratio.`;
}

/**
 * AI 이미지를 생성하고 URL을 반환합니다. 실패 시 null을 반환합니다.
 */
async function generateDiscussionImage(title: string, topic: string, keywords?: string | null): Promise<string | null> {
  try {
    const prompt = buildImagePrompt(title, topic, keywords);
    const result = await generateImage({ prompt });
    if (result.url) {
      console.log(`[DiscussionGenerator] Image generated for: "${title}"`);
      return result.url;
    }
    return null;
  } catch (err: any) {
    console.error(`[DiscussionGenerator] Image generation failed for: "${title}"`, err.message);
    return null;
  }
}

/**
 * 특정 설정에 따라 토론광장 토론 주제를 AI로 생성합니다.
 */
export async function generateDiscussionPost(
  setting: DiscussionAutoSetting,
  systemUserId: number,
  triggeredBy: "scheduler" | "manual" = "scheduler"
): Promise<{ success: boolean; discussionId?: number; title?: string; error?: string }> {
  const startTime = Date.now();

  try {
    // 1) AI로 토론 주제 생성
    const generated = await generateDiscussionContent(setting);
    if (!generated) {
      const elapsed = Date.now() - startTime;
      await db.createDiscussionAutoLog({
        settingId: setting.id,
        status: "failed",
        errorMessage: "AI 토론 주제 생성 실패: LLM 응답 없음",
        executionTimeMs: elapsed,
        triggeredBy,
        discussionId: null,
        generatedTitle: null,
      });
      return { success: false, error: "AI 토론 주제 생성 실패" };
    }

    // 2) 이미지 자동 생성 (설정이 활성화된 경우)
    let imageUrl: string | null = null;
    if (setting.autoGenerateImage) {
      imageUrl = await generateDiscussionImage(generated.title, setting.topic, setting.keywords);
    }

    // 3) 토론광장에 글 작성 (이미지가 있으면 본문 상단에 삽입)
    let finalContent = generated.content;
    if (imageUrl) {
      finalContent = `![${generated.title}](${imageUrl})\n\n${generated.content}`;
    }

    const discussionId = await db.createDiscussion({
      userId: systemUserId,
      categoryId: setting.categoryId ?? undefined,
      title: generated.title,
      content: finalContent,
      tags: generated.tags && generated.tags.length > 0 ? generated.tags : undefined,
    });

    const elapsed = Date.now() - startTime;
    await db.createDiscussionAutoLog({
      settingId: setting.id,
      status: "success",
      discussionId: Number(discussionId),
      generatedTitle: generated.title,
      executionTimeMs: elapsed,
      triggeredBy,
      errorMessage: null,
    });

    console.log(`[DiscussionGenerator] Generated discussion: "${generated.title}" (ID: ${discussionId}, ${elapsed}ms${imageUrl ? ", with image" : ""})`);
    return { success: true, discussionId: Number(discussionId), title: generated.title };
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    const errorMsg = err.message || "알 수 없는 오류";
    await db.createDiscussionAutoLog({
      settingId: setting.id,
      status: "failed",
      errorMessage: errorMsg,
      executionTimeMs: elapsed,
      triggeredBy,
      discussionId: null,
      generatedTitle: null,
    });
    console.error(`[DiscussionGenerator] Error generating discussion for setting ${setting.id}:`, err);
    return { success: false, error: errorMsg };
  }
}

/**
 * LLM을 사용하여 토론광장 토론 주제를 생성합니다.
 */
async function generateDiscussionContent(setting: DiscussionAutoSetting): Promise<GeneratedDiscussion | null> {
  const styleLabel = STYLE_LABELS[setting.discussionStyle] || "찬반 토론형";
  const styleGuide = STYLE_PROMPTS[setting.discussionStyle] || STYLE_PROMPTS.debate;
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  const systemPrompt =
    setting.promptTemplate ||
    `당신은 건강/의약품/영양 분야의 커뮤니티 토론 진행자입니다.
토론광장에 올릴 흥미롭고 참여를 유도하는 토론 주제를 작성합니다.
글은 한국어로 작성하며, 친근하면서도 전문적인 톤으로 작성합니다.
다양한 의견이 나올 수 있는 개방적인 주제를 선정합니다.
마크다운 형식으로 작성하되, 소제목(##), 목록, 강조(**) 등을 적절히 활용합니다.`;

  const keywordsInfo = setting.keywords ? `\n관련 키워드: ${setting.keywords}` : "";
  const keywordsEnInfo = setting.keywordsEn ? `\n영어 키워드: ${setting.keywordsEn}` : "";

  const userPrompt = `오늘 날짜: ${today}

주제 분야: ${setting.topic}${keywordsInfo}${keywordsEnInfo}

토론 스타일: ${styleLabel}

${styleGuide}

위 주제와 스타일에 맞는 토론광장 글을 1개 작성해주세요.

작성 규칙:
1. 제목은 토론 참여를 유도하는 흥미로운 질문이나 주제여야 합니다 (50자 이내).
2. 본문은 마크다운 형식으로 최소 500자 이상 작성합니다.
3. 토론의 배경과 맥락을 충분히 설명합니다.
4. 다양한 관점에서 의견을 나눌 수 있도록 열린 질문을 포함합니다.
5. 이전에 작성한 글과 중복되지 않도록 새로운 관점이나 주제를 다룹니다.
6. 댓글로 의견을 남기도록 유도하는 문구를 포함합니다.
7. 관련 태그를 3~5개 제안합니다.

다음 JSON 형식으로 응답해주세요:
{
  "title": "토론 제목",
  "content": "토론 본문 (마크다운 형식)",
  "tags": ["태그1", "태그2", "태그3"]
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "discussion_post",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "토론 제목" },
            content: { type: "string", description: "토론 본문 (마크다운)" },
            tags: { type: "array", items: { type: "string" }, description: "관련 태그 목록" },
          },
          required: ["title", "content", "tags"],
          additionalProperties: false,
        },
      },
    },
  });

  const responseContent = response.choices[0]?.message?.content;
  if (!responseContent || typeof responseContent !== "string") return null;

  try {
    const parsed = JSON.parse(responseContent) as GeneratedDiscussion;
    if (!parsed.title || !parsed.content) return null;
    return parsed;
  } catch {
    console.error("[DiscussionGenerator] Failed to parse LLM response:", responseContent);
    return null;
  }
}

/**
 * 모든 활성화된 설정에 대해 토론 주제를 자동 생성합니다.
 */
export async function generateAllEnabledDiscussionPosts(
  systemUserId: number,
  triggeredBy: "scheduler" | "manual" = "scheduler"
): Promise<{
  totalGenerated: number;
  results: Array<{ settingId: number; success: boolean; discussionId?: number; title?: string; error?: string }>;
}> {
  const settings = await db.getEnabledDiscussionAutoSettings();
  let totalGenerated = 0;
  const results: Array<{ settingId: number; success: boolean; discussionId?: number; title?: string; error?: string }> = [];

  for (const setting of settings) {
    const result = await generateDiscussionPost(setting, systemUserId, triggeredBy);
    if (result.success) totalGenerated++;
    results.push({
      settingId: setting.id,
      success: result.success,
      discussionId: result.discussionId,
      title: result.title,
      error: result.error,
    });
  }

  console.log(`[DiscussionGenerator] Auto generation complete: ${totalGenerated}/${settings.length} discussions generated`);
  return { totalGenerated, results };
}
