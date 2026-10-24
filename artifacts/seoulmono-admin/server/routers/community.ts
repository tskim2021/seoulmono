import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import { invokeLLM } from "../_core/llm";

export const communityRouter = router({
  boards: publicProcedure.query(async () => {
    return db.getAllBoards();
  }),
  boardBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    return db.getBoardBySlug(input.slug);
  }),
  recentBySlug: publicProcedure.input(z.object({
    slug: z.string(),
    limit: z.number().int().min(1).max(100).optional(),
  })).query(async ({ input }) => {
    const board = await db.getBoardBySlug(input.slug);
    if (!board) return [];
    const result = await db.getPosts(board.id, 1, input.limit ?? 5);
    return result.posts;
  }),
  posts: publicProcedure.input(z.object({
    boardId: z.number(),
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
    categoryId: z.number().optional(),
    productId: z.number().optional(),
  })).query(async ({ input }) => {
    return db.getPosts(input.boardId, input.page ?? 1, input.limit ?? 20, input.search, input.categoryId, input.productId);
  }),
  postById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getPostById(input.id);
  }),
  createPost: protectedProcedure.input(z.object({
    boardId: z.number(),
    title: z.string().min(1),
    content: z.string().min(1),
    productId: z.number().optional(),
    images: z.array(z.string()).optional(),
    rating: z.number().min(1).max(5).optional(),
  })).mutation(async ({ ctx, input }) => {
    const postId = await db.createPost({
      ...input,
      userId: ctx.user.id,
      productId: input.productId ?? null,
      images: input.images ?? null,
      rating: input.rating ?? null,
    });

    // 1:1 문의 게시판(boardId=7)에 글 작성 시 자동응답 생성
    if (input.boardId === 7) {
      setImmediate(async () => {
        try {
          const adminId = await db.getFirstAdminUserId();
          if (!adminId) return;

          const allFaqs = await db.getFaqs(undefined, true);

          // ── 자연어 자동응답 생성 엔진 ──
          const fullText = `${input.title} ${input.content}`.toLowerCase();

          // 1) 토픽 감지
          const TOPIC_MAP: Array<{ keys: string[]; topic: string; intro: string }> = [
            { keys: ["배송조회", "배송 조회", "배송정보", "운송장", "배송확인", "배송추적", "어디", "위치", "配送状況", "追跡", "追跡番号", "届く場所", "どこ"], topic: "배송조회", intro: "配送状況の確認方法についてご案内いたします。" },
            { keys: ["배송기간", "배송 기간", "얼마나", "며칠", "소요", "기간", "何日", "どのくらい", "日数", "期間"], topic: "배송기간", intro: "配送にかかる期間についてご案内いたします。" },
            { keys: ["파손", "훼손", "불량", "하자", "깨진", "부서진", "破損", "不良", "壊れ", "傷"], topic: "파손", intro: "商品の破損・不良についてご案内いたします。" },
            { keys: ["반품", "교환", "환불", "취소", "돌려", "返品", "交換", "返金"], topic: "반품교환", intro: "返品・交換・返金についてご案内いたします。" },
            { keys: ["취소", "주문취소", "주문 취소", "キャンセル", "注文取消"], topic: "취소", intro: "ご注文のキャンセルについてご案内いたします。" },
            { keys: ["결제", "카드", "무통장", "입금", "결제수단", "결제방법", "支払い", "決済", "クレジット", "銀行振込", "振込"], topic: "결제", intro: "お支払いについてご案内いたします。" },
            { keys: ["주소", "배송지", "변경", "住所", "お届け先", "変更"], topic: "배송지변경", intro: "お届け先の変更についてご案内いたします。" },
            { keys: ["통관", "관세", "세관", "관부가세", "通関", "関税", "税関"], topic: "통관", intro: "通関および関税・消費税についてご案内いたします。" },
            { keys: ["정품", "가품", "진품", "正規品", "偽物", "本物"], topic: "정품", intro: "商品の正規品かどうかについてご案内いたします。" },
            { keys: ["성분", "원료", "재료", "함량", "成分", "原料", "含有"], topic: "성분", intro: "商品の成分についてご案内いたします。" },
            { keys: ["유통기한", "만료", "기한", "使用期限", "賞味期限", "期限"], topic: "유통기한", intro: "使用期限についてご案内いたします。" },
            { keys: ["사용법", "복용법", "어떻게", "사용방법", "먹는", "使い方", "飲み方", "使用方法", "服用"], topic: "사용법", intro: "商品の使用方法についてご案内いたします。" },
            { keys: ["회원", "포인트", "등급", "적립", "会員", "ポイント", "ランク"], topic: "회원포인트", intro: "会員ランクおよびポイントについてご案内いたします。" },
          ];

          const detectedTopic = TOPIC_MAP.find(t => t.keys.some(k => fullText.includes(k)));

          // 2) FAQ 키워드 매칭 (스코어링)
          const tokenize = (text: string): string[] => {
            const cleaned = text.replace(/[?？!！.,;:'"()\[\]{}]/g, " ");
            const words = cleaned.split(/\s+/).filter(w => w.length >= 2);
            const subs: string[] = [];
            for (const w of words) {
              subs.push(w);
              if (w.length >= 4) subs.push(w.slice(0, 3), w.slice(1, 4));
            }
            return [...new Set(subs)];
          };

          const tokens = tokenize(fullText);
          const titleTokens = tokenize(input.title.toLowerCase());

          const scored = allFaqs.map(faq => {
            const faqText = `${faq.question} ${faq.answer}`.toLowerCase();
            let score = 0;
            for (const t of tokens) if (faqText.includes(t)) score++;
            for (const t of titleTokens) if (faqText.includes(t)) score += 2; // 제목 가중치 2배
            return { faq, score };
          });

          const matched = scored
            .filter(s => s.score >= 2)
            .sort((a, b) => b.score - a.score)
            .slice(0, 2)
            .map(s => s.faq);

          // 3) 자연어 문장 합성
          const CONNECTORS = ["なお、", "ちなみに、", "また、"];
          const CLOSINGS = [
            "上記がお役に立てば幸いです。",
            "ほかにご不明な点がございましたら、いつでもお問い合わせください。",
            "お客様のお困りごとが早く解決することを願っております。",
          ];

          let answer: string;

          if (matched.length > 0) {
            const intro = detectedTopic?.intro ?? "お問い合わせの内容についてご案内いたします。";

            // 각 FAQ 답변을 자연스러운 문장으로 변환
            const paragraphs = matched.map((faq, i) => {
              // 답변 끝 마침표 정리
              const answerText = faq.answer.trim().replace(/\s*\n\s*/g, " ");
              if (i === 0) return answerText;
              const connector = CONNECTORS[(i - 1) % CONNECTORS.length];
              // 첫 글자 소문자화(한국어엔 해당 없지만 일관성 유지)
              return `${connector}${answerText}`;
            });

            const closing = CLOSINGS[Math.floor(Math.random() * CLOSINGS.length)];

            answer = [
              `こんにちは、ソウルモノ カスタマーサポートです。`,
              ``,
              `${intro}`,
              ``,
              paragraphs.join("\n\n"),
              ``,
              closing,
              ``,
              `自動応答にご満足いただけない場合は、下の［担当者の回答をリクエスト］ボタンを押してください。営業日1日以内（平日 09:00–18:00）に担当者が直接ご回答いたします。`,
            ].join("\n");
          } else {
            // 매칭 없음 → 접수 확인 메시지
            const noMatchIntros = [
              "お問い合わせを確かに承りました。",
              "貴重なお問い合わせをありがとうございます。",
              "お問い合わせありがとうございます。",
            ];
            const noMatchBodies = [
              "お問い合わせ内容を確認いたしました。担当者が確認のうえ、できるだけ早くご回答いたします。",
              "お問い合わせ内容を担当者が確認しております。営業日1〜2日以内に詳しくご回答いたします。",
            ];
            const ni = Math.floor(Math.random() * noMatchIntros.length);
            const bi = Math.floor(Math.random() * noMatchBodies.length);
            answer = [
              `こんにちは、ソウルモノ カスタマーサポートです。`,
              ``,
              `${noMatchIntros[ni]}`,
              ``,
              `${noMatchBodies[bi]}`,
              ``,
              `自動応答にご満足いただけない場合は、下の［担当者の回答をリクエスト］ボタンを押してください。営業日1日以内（平日 09:00–18:00）に担当者が直接ご回答いたします。`,
            ].join("\n");
          }
          if (!answer) return;

          await db.createInquiryReply({
            postId,
            adminId,
            content: answer,
            isAutoReply: 1,
          } as any);
        } catch (err) {
          console.error("[AutoReply] 자동응답 생성 실패:", err);
        }
      });
    }

    return { success: true, postId };
  }),
  updatePost: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    images: z.array(z.string()).optional(),
    rating: z.number().min(1).max(5).optional(),
  })).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;
    await db.updatePost(id, ctx.user.id, data);
    return { success: true };
  }),
  deletePost: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const isAdmin = ctx.user.role === "admin";
    await db.deletePost(input.id, ctx.user.id, isAdmin);
    return { success: true };
  }),
  // Comments
  comments: publicProcedure.input(z.object({ postId: z.number() })).query(async ({ input }) => {
    return db.getComments(input.postId);
  }),
  createComment: protectedProcedure.input(z.object({
    postId: z.number(),
    content: z.string().min(1),
    parentId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    await db.createComment({
      postId: input.postId,
      userId: ctx.user.id,
      content: input.content,
      parentId: input.parentId ?? null,
      isAdmin: ctx.user.role === "admin" ? 1 : 0,
    });
    const post = await db.getPostById(input.postId);
    if (post && post.userId !== ctx.user.id) {
      await db.createNotification(post.userId, "comment", "新しいコメントが付きました", `「${post.title}」に新しいコメントが付きました。`, `/community/post/${input.postId}`);
    }
    return { success: true };
  }),
  deleteComment: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const isAdmin = ctx.user.role === "admin";
    await db.deleteComment(input.id, ctx.user.id, isAdmin);
    return { success: true };
  }),
  // Product reviews
  productReviews: publicProcedure.input(z.object({
    productId: z.number(),
    page: z.number().optional(),
    limit: z.number().optional(),
  })).query(async ({ input }) => {
    return db.getProductReviews(input.productId, input.page ?? 1, input.limit ?? 10);
  }),
  // Image upload for reviews/posts (authenticated users)
  uploadImage: protectedProcedure.input(z.object({
    base64: z.string().min(1),
    fileName: z.string().min(1),
    contentType: z.string().min(1),
  })).mutation(async ({ ctx, input }) => {
    const ext = input.fileName.split(".").pop() || "jpg";
    const key = `reviews/${ctx.user.id}/${nanoid(12)}.${ext}`;
    const buffer = Buffer.from(input.base64, "base64");
    const { url } = await storagePut(key, buffer, input.contentType);
    return { url };
  }),

  // ─── 리뷰 기능 강화 ───

  // 리뷰 대기 주문 목록 (배송완료 + 미작성)
  reviewPending: protectedProcedure.query(async ({ ctx }) => {
    return db.getReviewPendingItems(ctx.user.id);
  }),

  // 리뷰 포인트 설정 조회 (공개)
  reviewPointSettings: publicProcedure.query(async () => {
    return db.getReviewPointSettings();
  }),

  // 리뷰 작성 + 포인트 자동 적립
  createReview: protectedProcedure.input(z.object({
    productId: z.number(),
    orderId: z.number(),
    orderItemId: z.number(),
    title: z.string().min(1),
    content: z.string().min(1),
    images: z.array(z.string()).optional(),
    rating: z.number().min(1).max(5),
  })).mutation(async ({ ctx, input }) => {
    // 배송 완료 검증
    const order = await db.getOrderById(input.orderId);
    if (!order || order.userId !== ctx.user.id) {
      throw new TRPCError({ code: "NOT_FOUND", message: "注文が見つかりません。" });
    }
    if (order.status !== "delivered") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "配送完了した注文のみレビューを投稿できます。" });
    }
    
    // review 게시판 찾기
    const boards = await db.getAllBoards();
    const reviewBoard = boards.find(b => b.boardType === "review");
    if (!reviewBoard) throw new TRPCError({ code: "NOT_FOUND", message: "レビュー掲示板がありません。" });

    const result = await db.createReviewWithPoints({
      boardId: reviewBoard.id,
      userId: ctx.user.id,
      productId: input.productId,
      orderId: input.orderId,
      orderItemId: input.orderItemId,
      title: input.title,
      content: input.content,
      images: input.images,
      rating: input.rating,
    });

    return { success: true, postId: result.postId, pointsEarned: result.pointsEarned };
  }),

  // --- Review Replies (Admin) ---
  reviewReplies: publicProcedure.input(z.object({ postId: z.number() })).query(async ({ input }) => {
    return db.getReviewReplies(input.postId);
  }),

  createReviewReply: adminProcedure.input(z.object({
    postId: z.number(),
    content: z.string().min(1),
  })).mutation(async ({ ctx, input }) => {
    const replyId = await db.createReviewReply({
      postId: input.postId,
      userId: ctx.user.id,
      content: input.content,
    });
    try {
      const post = await db.getPostById(input.postId);
      if (post && post.userId !== ctx.user.id) {
        await db.createNotification(post.userId, "review", "レビューに返信が付きました", `「${post.title}」に管理者の返信が登録されました。`, `/community/post/${input.postId}`);
      }
    } catch (e) { console.error("[reviewReply] notify failed:", e); }
    return { success: true, replyId };
  }),

  updateReviewReply: adminProcedure.input(z.object({
    id: z.number(),
    content: z.string().min(1),
  })).mutation(async ({ input }) => {
    await db.updateReviewReply(input.id, input.content);
    return { success: true };
  }),

  deleteReviewReply: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteReviewReply(input.id);
    return { success: true };
  }),

  adminReviews: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getReviewsForAdmin(input?.page ?? 1, input?.limit ?? 20);
  }),

  // --- All Product Q&A (public list) ---
  allProductQnA: publicProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
    productId: z.number().optional(),
    onlyUnanswered: z.boolean().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getAllProductQnA({
      page: input?.page ?? 1,
      limit: input?.limit ?? 20,
      search: input?.search,
      productId: input?.productId,
      onlyUnanswered: input?.onlyUnanswered ?? false,
    });
  }),

  // --- Product Q&A ---
  productQnA: publicProcedure.input(z.object({
    productId: z.number(),
    page: z.number().optional(),
    limit: z.number().optional(),
  })).query(async ({ input }) => {
    return db.getProductQnA(input.productId, input.page ?? 1, input.limit ?? 10);
  }),

  createProductQnA: protectedProcedure.input(z.object({
    productId: z.number(),
    title: z.string().min(1),
    content: z.string().min(1),
  })).mutation(async ({ ctx, input }) => {
    const postId = await db.createProductQnA({
      userId: ctx.user.id,
      productId: input.productId,
      title: input.title,
      content: input.content,
    });
    return { success: true, postId };
  }),

  reviewProducts: publicProcedure.input(z.object({ boardId: z.number() })).query(async ({ input }) => {
    return db.getReviewBoardProducts(input.boardId);
  }),

  answerQnA: adminProcedure.input(z.object({
    postId: z.number(),
    content: z.string().min(1),
  })).mutation(async ({ ctx, input }) => {
    await db.createComment({
      postId: input.postId,
      userId: ctx.user.id,
      content: input.content,
      parentId: null,
      isAdmin: 1,
    });
    await db.adminUpdatePost(input.postId, { isAnswered: 1 });
    const post = await db.getPostById(input.postId);
    if (post && post.userId !== ctx.user.id) {
      await db.createNotification(post.userId, "comment", "Q&Aに回答が登録されました", `「${post.title}」に管理者の回答が登録されました。`, `/shop/item.php?t_id=${post.productId}`);
    }
    return { success: true };
  }),

  adminProductQnA: adminProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    onlyUnanswered: z.boolean().optional(),
  }).optional()).query(async ({ input }) => {
    return db.getProductQnAForAdmin({
      page: input?.page ?? 1,
      limit: input?.limit ?? 30,
      onlyUnanswered: input?.onlyUnanswered ?? false,
    });
  }),

  myInquiries: protectedProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
  })).query(async ({ ctx, input }) => {
    return db.getPosts(7, input.page ?? 1, input.limit ?? 20, input.search, undefined, undefined, ctx.user.id);
  }),

  myQnA: protectedProcedure.input(z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
  })).query(async ({ ctx, input }) => {
    return db.getPosts(4, input.page ?? 1, input.limit ?? 20, input.search, undefined, undefined, ctx.user.id);
  }),

  getMyInquiryReplies: protectedProcedure.input(z.object({
    postId: z.number(),
  })).query(async ({ ctx, input }) => {
    const post = await db.getPostById(input.postId);
    if (!post || post.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
    return db.getInquiryReplies(input.postId);
  }),

  requestHumanAgent: protectedProcedure.input(z.object({
    postId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const post = await db.getPostById(input.postId);
    if (!post || post.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
    await db.requestHumanAgent(input.postId);
    return { success: true };
  }),

  aiAutoReply: publicProcedure.input(z.object({
    title: z.string(),
    content: z.string(),
    category: z.string().optional(),
    history: z.array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })).optional(),
  })).mutation(async ({ input }) => {
    const allFaqs = await db.getFaqs(undefined, true);

    const categoryLabels: Record<string, string> = {
      order: "ご注文・お支払い", shipping: "配送", return: "返品・交換",
      product: "商品", member: "会員", etc: "その他",
    };
    const categoryLabel = input.category ? (categoryLabels[input.category] ?? "その他") : "その他";

    const faqContext = allFaqs.length > 0
      ? "\n\n=== FAQナレッジベース ===\n" +
        allFaqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")
      : "";

    const systemPrompt = `あなたはソウルモノのショッピングモールのAIカスタマーサポート担当です。
ソウルモノは、薄毛ケア関連の健康食品およびケア製品を専門に販売するオンラインショップです。

[回答の原則]
- 下記のFAQナレッジベースを優先的に参照してください
- FAQにない内容は、一般的なショップのポリシーに基づいて回答してください
- 確実でない内容は「担当者へのお問い合わせボタンを押してください」と案内してください
- 回答は明確かつ簡潔に、必要に応じて番号付きリストを活用してください
- 親切で共感的なトーンを保ってください${faqContext}`;

    const priorMessages = (input.history ?? []).map(h => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    }));

    const userMessage = priorMessages.length === 0
      ? `[お問い合わせ種別: ${categoryLabel}]\nタイトル: ${input.title}\n\n${input.content}`
      : input.content;

    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          ...priorMessages,
          { role: "user", content: userMessage },
        ],
      });
      const raw = response.choices[0]?.message?.content;
      const answer = typeof raw === "string" ? raw.trim() : "";
      return { answer: answer || "申し訳ございません。回答の生成に失敗しました。担当者へお問い合わせください。" };
    } catch {
      return { answer: "申し訳ございません。AIサービスに一時的な問題が発生しました。担当者へ直接お問い合わせください。" };
    }
  }),
});
