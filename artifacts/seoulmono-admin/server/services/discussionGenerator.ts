import { invokeLLM } from "../_core/llm";
import { generateImage } from "../_core/imageGeneration";
import * as db from "../db";
import type { DiscussionAutoSetting } from "../../drizzle/schema";

const STYLE_LABELS: Record<string, string> = {
  debate: "賛否討論型",
  opinion: "意見交換型",
  question: "質問・討議型",
  poll: "投票・アンケート型",
  experience: "体験共有型",
};

const STYLE_PROMPTS: Record<string, string> = {
  debate: `[賛否討論型 作成ガイド]
- 賛成・反対がはっきり分かれるテーマを選びます。
- 双方の立場の根拠をバランスよく示します。
- 読者が自分の意見を述べたくなるように促します。
- 結論は出さず、オープンな問いかけで締めくくります。`,

  opinion: `[意見交換型 作成ガイド]
- さまざまな観点から考えられるテーマを扱います。
- 唯一の正解がないテーマを選びます。
- まず自分の意見を示しつつ、他の意見も歓迎するトーンで書きます。
- 具体的な体験や事例を盛り込み、共感を促します。`,

  question: `[質問・討議型 作成ガイド]
- コミュニティの皆さんの知識や経験を集められる質問を投げかけます。
- 具体的で明確な質問を示します。
- 質問の背景と文脈を十分に説明します。
- 回答者がさまざまな観点から答えられるよう、オープンな質問を用います。`,

  poll: `[投票・アンケート型 作成ガイド]
- 2〜5個の選択肢を提示する形で書きます。
- 各選択肢に簡単な説明を添えます。
- 投票への参加を促す興味を引く導入を書きます。
- 選択肢以外にも自由に意見を書けるよう案内します。`,

  experience: `[体験共有型 作成ガイド]
- 特定の製品や健康に関する体験を共有する形で書きます。
- 具体的な使用体験、効果、注意事項などを含めます。
- 他のユーザーにも体験を共有してもらえるよう促します。
- 率直でバランスの取れたトーンで書きます。`,
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
        errorMessage: "AIディスカッション題材の生成に失敗しました: LLMの応答がありません",
        executionTimeMs: elapsed,
        triggeredBy,
        discussionId: null,
        generatedTitle: null,
      });
      return { success: false, error: "AIディスカッション題材の生成に失敗しました" };
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
    const errorMsg = err.message || "不明なエラー";
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
  const styleLabel = STYLE_LABELS[setting.discussionStyle] || "賛否討論型";
  const styleGuide = STYLE_PROMPTS[setting.discussionStyle] || STYLE_PROMPTS.debate;
  const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  const systemPrompt =
    setting.promptTemplate ||
    `あなたは健康・医薬品・栄養分野のコミュニティのディスカッション進行役です。
ディスカッション広場に投稿する、興味深く参加を促す討論テーマを作成します。
文章は日本語で、親しみやすく、かつ専門的なトーンで書きます。
さまざまな意見が出せるオープンなテーマを選びます。
Markdown形式で書き、小見出し(##)、リスト、強調(**)などを適切に活用します。`;

  const keywordsInfo = setting.keywords ? `\n関連キーワード: ${setting.keywords}` : "";
  const keywordsEnInfo = setting.keywordsEn ? `\n英語キーワード: ${setting.keywordsEn}` : "";

  const userPrompt = `今日の日付: ${today}

テーマ分野: ${setting.topic}${keywordsInfo}${keywordsEnInfo}

ディスカッションのスタイル: ${styleLabel}

${styleGuide}

上記のテーマとスタイルに合ったディスカッション広場の投稿を1件作成してください。

作成ルール:
1. タイトルは議論への参加を促す興味深い問いやテーマにしてください（50文字以内）。
2. 本文はMarkdown形式で最低500文字以上書いてください。
3. 議論の背景と文脈を十分に説明してください。
4. さまざまな観点から意見交換できるよう、オープンな問いを含めてください。
5. 以前の投稿と重複しないよう、新しい観点やテーマを扱ってください。
6. コメントで意見を書き込むよう促す一文を含めてください。
7. 関連タグを3〜5個提案してください。

次のJSON形式で回答してください:
{
  "title": "ディスカッションのタイトル",
  "content": "ディスカッション本文（Markdown形式）",
  "tags": ["タグ1", "タグ2", "タグ3"]
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
            title: { type: "string", description: "ディスカッションのタイトル" },
            content: { type: "string", description: "ディスカッション本文（Markdown）" },
            tags: { type: "array", items: { type: "string" }, description: "関連タグ一覧" },
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
