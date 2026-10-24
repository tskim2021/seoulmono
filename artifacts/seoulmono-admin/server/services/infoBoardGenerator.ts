import { invokeLLM } from "../_core/llm";
import { generateImage } from "../_core/imageGeneration";
import * as db from "../db";
import type { InfoBoardAutoSetting } from "../../drizzle/schema";

const STYLE_LABELS: Record<string, string> = {
  informative: "情報提供型",
  guide: "ガイド・案内型",
  tips: "ヒント・ノウハウ型",
  comparison: "比較・分析型",
  news: "ニュース・トレンド型",
};

const STYLE_PROMPTS: Record<string, string> = {
  informative: `[情報提供型 作成ガイド]
- テーマに関する要点を体系的に整理します。
- 信頼できるデータと事実に基づいて書きます。
- 読者が日常生活で活用できる実用的な情報を含めます。
- 専門用語は分かりやすく説明します。`,

  guide: `[ガイド・案内型 作成ガイド]
- ステップごとに明確に案内します。
- 初心者でも実践できるよう、やさしく説明します。
- 注意事項とヒントをあわせて提供します。
- 実際の事例や例を含めて理解を助けます。`,

  tips: `[ヒント・ノウハウ型 作成ガイド]
- 実用的ですぐに活用できるヒントを提供します。
- 番号を付けて要点となるヒントを整理します。
- 各ヒントに簡潔な説明を添えます。
- 専門家のアドバイスや経験に基づく内容を含めます。`,

  comparison: `[比較・分析型 作成ガイド]
- 関連する製品、方法、オプションを客観的に比較します。
- メリットとデメリットを明確に整理します。
- 表やリストを使って比較内容を視覚的に整理します。
- 読者の選択に役立つ結論を示します。`,

  news: `[ニュース・トレンド型 作成ガイド]
- 最新のトレンドと動向を分析します。
- 業界の変化とその影響を説明します。
- 今後の展望と予測を含めます。
- 読者に示唆を提供します。`,
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
        errorMessage: "AI記事の生成に失敗しました: LLMの応答がありません",
        executionTimeMs: elapsed,
        triggeredBy,
        postId: null,
        generatedTitle: null,
      });
      return { success: false, error: "AI記事の生成に失敗しました" };
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
        errorMessage: "情報シェア掲示板が見つかりません",
        executionTimeMs: elapsed,
        triggeredBy,
        postId: null,
        generatedTitle: generated.title,
      });
      return { success: false, error: "情報シェア掲示板が見つかりません" };
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
    const errorMsg = err.message || "不明なエラー";
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
  const styleLabel = STYLE_LABELS[setting.postStyle] || "情報提供型";
  const styleGuide = STYLE_PROMPTS[setting.postStyle] || STYLE_PROMPTS.informative;
  const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  const systemPrompt =
    setting.promptTemplate ||
    `あなたは健康・医薬品・栄養分野の専門コンテンツライターです。
情報シェア掲示板に投稿する、有益で信頼できる記事を作成します。
文章は日本語で、専門的でありながら一般の読者にも分かりやすく書きます。
誇張した表現や医学的アドバイスは避け、客観的な情報提供に集中します。
Markdown形式で書き、小見出し(##)、リスト、強調(**)などを適切に活用します。`;

  const keywordsInfo = setting.keywords ? `\n関連キーワード: ${setting.keywords}` : "";
  const keywordsEnInfo = setting.keywordsEn ? `\n英語キーワード: ${setting.keywordsEn}` : "";

  const userPrompt = `今日の日付: ${today}

テーマ: ${setting.topic}${keywordsInfo}${keywordsEnInfo}

執筆スタイル: ${styleLabel}

${styleGuide}

上記のテーマとスタイルに合った情報シェア記事を1件作成してください。

作成ルール:
1. タイトルは興味を引きつつ、内容を正確に表してください（50文字以内）。
2. 本文はMarkdown形式で最低800文字以上書いてください。
3. 小見出し(##)を活用して内容を体系的に構成してください。
4. 実用的で読者の役に立つ情報を含めてください。
5. 以前の記事と重複しないよう、新しい観点やテーマを扱ってください。
6. 記事の最後に「※ この記事は情報提供を目的として作成されており、専門的な医療アドバイスに代わるものではありません。」の一文を含めてください。

次のJSON形式で回答してください:
{
  "title": "記事のタイトル",
  "content": "記事本文（Markdown形式）"
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
            title: { type: "string", description: "記事のタイトル" },
            content: { type: "string", description: "記事本文（Markdown）" },
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
