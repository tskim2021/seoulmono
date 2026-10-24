import { invokeLLM } from "../_core/llm";
import { generateImage } from "../_core/imageGeneration";
import * as db from "../db";
import type { InfoBoardAutoSetting } from "../../drizzle/schema";

const STYLE_LABELS: Record<string, string> = {
  informative: "정보 전달형",
  guide: "가이드/안내형",
  tips: "팁/노하우형",
  comparison: "비교/분석형",
  news: "뉴스/트렌드형",
};

const STYLE_PROMPTS: Record<string, string> = {
  informative: `[정보 전달형 작성 가이드]
- 주제에 대한 핵심 정보를 체계적으로 정리합니다.
- 신뢰할 수 있는 데이터와 사실에 기반하여 작성합니다.
- 독자가 실생활에서 활용할 수 있는 실용적인 정보를 포함합니다.
- 전문 용어는 쉽게 풀어서 설명합니다.`,

  guide: `[가이드/안내형 작성 가이드]
- 단계별로 명확하게 안내합니다.
- 초보자도 따라할 수 있도록 쉽게 설명합니다.
- 주의사항과 팁을 함께 제공합니다.
- 실제 사례나 예시를 포함하여 이해를 돕습니다.`,

  tips: `[팁/노하우형 작성 가이드]
- 실용적이고 즉시 활용 가능한 팁을 제공합니다.
- 번호를 매겨 핵심 팁을 정리합니다.
- 각 팁에 대한 간결한 설명을 추가합니다.
- 전문가의 조언이나 경험에 기반한 내용을 포함합니다.`,

  comparison: `[비교/분석형 작성 가이드]
- 관련 제품, 방법, 또는 옵션을 객관적으로 비교합니다.
- 장단점을 명확하게 정리합니다.
- 표나 목록을 활용하여 비교 내용을 시각적으로 정리합니다.
- 독자가 선택에 도움이 되는 결론을 제시합니다.`,

  news: `[뉴스/트렌드형 작성 가이드]
- 최신 트렌드와 동향을 분석합니다.
- 업계 변화와 그 영향을 설명합니다.
- 향후 전망과 예측을 포함합니다.
- 독자에게 시사점을 제공합니다.`,
};

interface GeneratedPost {
  title: string;
  content: string;
}

/**
 * 글 제목과 내용을 기반으로 이미지 생성 프롬프트를 만듭니다.
 */
function buildImagePrompt(title: string, topic: string, keywords?: string | null): string {
  const keywordPart = keywords ? `, related to ${keywords}` : "";
  return `A clean, professional, modern illustration for a health and wellness article titled "${title}". The image should be related to the topic of "${topic}"${keywordPart}. Use a warm, inviting color palette with soft gradients. The style should be flat design or minimalist illustration, suitable for a community health information board. No text in the image. High quality, 16:9 aspect ratio.`;
}

/**
 * AI 이미지를 생성하고 URL을 반환합니다. 실패 시 null을 반환합니다.
 */
async function generatePostImage(title: string, topic: string, keywords?: string | null): Promise<string | null> {
  try {
    const prompt = buildImagePrompt(title, topic, keywords);
    const result = await generateImage({ prompt });
    if (result.url) {
      console.log(`[InfoBoardGenerator] Image generated for: "${title}"`);
      return result.url;
    }
    return null;
  } catch (err: any) {
    console.error(`[InfoBoardGenerator] Image generation failed for: "${title}"`, err.message);
    return null;
  }
}

/**
 * 특정 설정에 따라 정보나눔 게시글을 AI로 생성합니다.
 */
export async function generateInfoBoardPost(
  setting: InfoBoardAutoSetting,
  systemUserId: number,
  triggeredBy: "scheduler" | "manual" = "scheduler"
): Promise<{ success: boolean; postId?: number; title?: string; error?: string }> {
  const startTime = Date.now();

  try {
    // 1) AI로 글 생성
    const generated = await generatePostContent(setting);
    if (!generated) {
      const elapsed = Date.now() - startTime;
      await db.createInfoBoardAutoLog({
        settingId: setting.id,
        status: "failed",
        errorMessage: "AI 글 생성 실패: LLM 응답 없음",
        executionTimeMs: elapsed,
        triggeredBy,
        postId: null,
        generatedTitle: null,
      });
      return { success: false, error: "AI 글 생성 실패" };
    }

    // 2) 이미지 자동 생성 (설정이 활성화된 경우)
    let images: string[] | null = null;
    if (setting.autoGenerateImage) {
      const imageUrl = await generatePostImage(generated.title, setting.topic, setting.keywords);
      if (imageUrl) {
        images = [imageUrl];
      }
    }

    // 3) 정보나눔 게시판에 글 작성
    const board = await db.getBoardBySlug("info");
    if (!board) {
      const elapsed = Date.now() - startTime;
      await db.createInfoBoardAutoLog({
        settingId: setting.id,
        status: "failed",
        errorMessage: "정보나눔 게시판을 찾을 수 없습니다",
        executionTimeMs: elapsed,
        triggeredBy,
        postId: null,
        generatedTitle: generated.title,
      });
      return { success: false, error: "정보나눔 게시판을 찾을 수 없습니다" };
    }

    // 이미지가 있으면 본문 상단에 이미지 마크다운 추가
    let finalContent = generated.content;
    if (images && images.length > 0) {
      finalContent = `![${generated.title}](${images[0]})\n\n${generated.content}`;
    }

    const insertId = await db.createPost({
      boardId: board.id,
      userId: systemUserId,
      title: generated.title,
      content: finalContent,
      images: images,
      rating: null,
      productId: null,
      orderId: null,
      orderItemId: null,
      categoryId: setting.categoryId ?? null,
    });

    const postId = Number(insertId);
    const elapsed = Date.now() - startTime;
    await db.createInfoBoardAutoLog({
      settingId: setting.id,
      status: "success",
      postId,
      generatedTitle: generated.title,
      executionTimeMs: elapsed,
      triggeredBy,
      errorMessage: null,
    });

    console.log(`[InfoBoardGenerator] Generated post: "${generated.title}" (ID: ${postId}, ${elapsed}ms${images ? ", with image" : ""})`);
    return { success: true, postId, title: generated.title };
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    const errorMsg = err.message || "알 수 없는 오류";
    await db.createInfoBoardAutoLog({
      settingId: setting.id,
      status: "failed",
      errorMessage: errorMsg,
      executionTimeMs: elapsed,
      triggeredBy,
      postId: null,
      generatedTitle: null,
    });
    console.error(`[InfoBoardGenerator] Error generating post for setting ${setting.id}:`, err);
    return { success: false, error: errorMsg };
  }
}

/**
 * LLM을 사용하여 정보나눔 게시글 내용을 생성합니다.
 */
async function generatePostContent(setting: InfoBoardAutoSetting): Promise<GeneratedPost | null> {
  const styleLabel = STYLE_LABELS[setting.postStyle] || "정보 전달형";
  const styleGuide = STYLE_PROMPTS[setting.postStyle] || STYLE_PROMPTS.informative;
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  const systemPrompt =
    setting.promptTemplate ||
    `당신은 건강/의약품/영양 분야의 전문 콘텐츠 작성자입니다.
정보나눔 게시판에 올릴 유익하고 신뢰할 수 있는 글을 작성합니다.
글은 한국어로 작성하며, 전문적이면서도 일반 독자가 이해하기 쉽게 작성합니다.
과장된 표현이나 의학적 조언은 피하고, 객관적인 정보 전달에 집중합니다.
마크다운 형식으로 작성하되, 소제목(##), 목록, 강조(**) 등을 적절히 활용합니다.`;

  const keywordsInfo = setting.keywords ? `\n관련 키워드: ${setting.keywords}` : "";
  const keywordsEnInfo = setting.keywordsEn ? `\n영어 키워드: ${setting.keywordsEn}` : "";

  const userPrompt = `오늘 날짜: ${today}

주제: ${setting.topic}${keywordsInfo}${keywordsEnInfo}

작성 스타일: ${styleLabel}

${styleGuide}

위 주제와 스타일에 맞는 정보나눔 게시글을 1개 작성해주세요.

작성 규칙:
1. 제목은 흥미를 끌면서도 정확한 내용을 담아야 합니다 (50자 이내).
2. 본문은 마크다운 형식으로 최소 800자 이상 작성합니다.
3. 소제목(##)을 활용하여 내용을 체계적으로 구성합니다.
4. 실용적이고 독자에게 도움이 되는 정보를 포함합니다.
5. 이전에 작성한 글과 중복되지 않도록 새로운 관점이나 주제를 다룹니다.
6. 글 마지막에 "※ 이 글은 정보 제공 목적으로 작성되었으며, 전문적인 의료 조언을 대체하지 않습니다." 문구를 포함합니다.

다음 JSON 형식으로 응답해주세요:
{
  "title": "게시글 제목",
  "content": "게시글 본문 (마크다운 형식)"
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "info_board_post",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "게시글 제목" },
            content: { type: "string", description: "게시글 본문 (마크다운)" },
          },
          required: ["title", "content"],
          additionalProperties: false,
        },
      },
    },
  });

  const responseContent = response.choices[0]?.message?.content;
  if (!responseContent || typeof responseContent !== "string") return null;

  try {
    const parsed = JSON.parse(responseContent) as GeneratedPost;
    if (!parsed.title || !parsed.content) return null;
    return parsed;
  } catch {
    console.error("[InfoBoardGenerator] Failed to parse LLM response:", responseContent);
    return null;
  }
}

/**
 * 모든 활성화된 설정에 대해 정보나눔 글을 자동 생성합니다.
 */
export async function generateAllEnabledInfoBoardPosts(
  systemUserId: number,
  triggeredBy: "scheduler" | "manual" = "scheduler"
): Promise<{
  totalGenerated: number;
  results: Array<{ settingId: number; success: boolean; postId?: number; title?: string; error?: string }>;
}> {
  const settings = await db.getEnabledInfoBoardAutoSettings();
  let totalGenerated = 0;
  const results: Array<{ settingId: number; success: boolean; postId?: number; title?: string; error?: string }> = [];

  for (const setting of settings) {
    const result = await generateInfoBoardPost(setting, systemUserId, triggeredBy);
    if (result.success) totalGenerated++;
    results.push({
      settingId: setting.id,
      success: result.success,
      postId: result.postId,
      title: result.title,
      error: result.error,
    });
  }

  console.log(`[InfoBoardGenerator] Auto generation complete: ${totalGenerated}/${settings.length} posts generated`);
  return { totalGenerated, results };
}
