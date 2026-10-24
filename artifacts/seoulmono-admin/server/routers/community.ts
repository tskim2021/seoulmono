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
            { keys: ["배송조회", "배송 조회", "배송정보", "운송장", "배송확인", "배송추적", "어디", "위치"], topic: "배송조회", intro: "배송 현황 확인 방법에 대해 안내드리겠습니다." },
            { keys: ["배송기간", "배송 기간", "얼마나", "며칠", "소요", "기간"], topic: "배송기간", intro: "배송 소요 기간에 대해 안내드리겠습니다." },
            { keys: ["파손", "훼손", "불량", "하자", "깨진", "부서진"], topic: "파손", intro: "상품 파손 및 불량 문제에 대해 안내드리겠습니다." },
            { keys: ["반품", "교환", "환불", "취소", "돌려"], topic: "반품교환", intro: "반품·교환·환불 관련하여 안내드리겠습니다." },
            { keys: ["취소", "주문취소", "주문 취소"], topic: "취소", intro: "주문 취소 관련하여 안내드리겠습니다." },
            { keys: ["결제", "카드", "무통장", "입금", "결제수단", "결제방법"], topic: "결제", intro: "결제 관련하여 안내드리겠습니다." },
            { keys: ["주소", "배송지", "변경"], topic: "배송지변경", intro: "배송지 변경 관련하여 안내드리겠습니다." },
            { keys: ["통관", "관세", "세관", "관부가세"], topic: "통관", intro: "통관 및 관부가세 관련하여 안내드리겠습니다." },
            { keys: ["정품", "가품", "진품"], topic: "정품", intro: "상품 정품 여부에 대해 안내드리겠습니다." },
            { keys: ["성분", "원료", "재료", "함량"], topic: "성분", intro: "상품 성분 관련하여 안내드리겠습니다." },
            { keys: ["유통기한", "만료", "기한"], topic: "유통기한", intro: "유통기한 관련하여 안내드리겠습니다." },
            { keys: ["사용법", "복용법", "어떻게", "사용방법", "먹는"], topic: "사용법", intro: "상품 사용 방법에 대해 안내드리겠습니다." },
            { keys: ["회원", "포인트", "등급", "적립"], topic: "회원포인트", intro: "회원 등급 및 포인트 관련하여 안내드리겠습니다." },
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
          const CONNECTORS = ["아울러 ", "참고로 ", "또한 "];
          const CLOSINGS = [
            "위 내용이 도움이 되셨으면 합니다.",
            "더 궁금하신 점이 있으시면 언제든지 문의해 주세요.",
            "고객님의 불편함이 빠르게 해결되기를 바랍니다.",
          ];

          let answer: string;

          if (matched.length > 0) {
            const intro = detectedTopic?.intro ?? "문의하신 내용에 대해 안내드리겠습니다.";

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
              `안녕하세요, 탈모학교 고객지원팀입니다.`,
              ``,
              `${intro}`,
              ``,
              paragraphs.join("\n\n"),
              ``,
              closing,
              ``,
              `자동응답이 만족스럽지 않으시면 하단의 [상담사 답변 요청하기] 버튼을 눌러주세요. 영업일 기준 1일 이내(평일 09:00–18:00)에 담당 상담사가 직접 답변드립니다.`,
            ].join("\n");
          } else {
            // 매칭 없음 → 접수 확인 메시지
            const noMatchIntros = [
              "문의해 주신 내용을 잘 접수하였습니다.",
              "소중한 문의 감사드립니다.",
              "문의 주셔서 감사합니다.",
            ];
            const noMatchBodies = [
              "고객님의 문의 내용을 확인하였으며, 담당 상담사가 검토 후 최대한 빠르게 답변드리겠습니다.",
              "문의하신 내용을 상담사가 검토 중에 있으며, 영업일 기준 1~2일 내로 상세한 답변을 드리겠습니다.",
            ];
            const ni = Math.floor(Math.random() * noMatchIntros.length);
            const bi = Math.floor(Math.random() * noMatchBodies.length);
            answer = [
              `안녕하세요, 탈모학교 고객지원팀입니다.`,
              ``,
              `${noMatchIntros[ni]}`,
              ``,
              `${noMatchBodies[bi]}`,
              ``,
              `자동응답이 만족스럽지 않으시면 하단의 [상담사 답변 요청하기] 버튼을 눌러주세요. 영업일 기준 1일 이내(평일 09:00–18:00)에 담당 상담사가 직접 답변드립니다.`,
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
      await db.createNotification(post.userId, "comment", "새 댓글이 달렸습니다", `"${post.title}"에 새 댓글이 달렸습니다.`, `/community/post/${input.postId}`);
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
      throw new TRPCError({ code: "NOT_FOUND", message: "주문을 찾을 수 없습니다." });
    }
    if (order.status !== "delivered") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "배송 완료된 주문만 리뷰를 작성할 수 있습니다." });
    }
    
    // review 게시판 찾기
    const boards = await db.getAllBoards();
    const reviewBoard = boards.find(b => b.boardType === "review");
    if (!reviewBoard) throw new TRPCError({ code: "NOT_FOUND", message: "리뷰 게시판이 없습니다." });

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
        await db.createNotification(post.userId, "review", "\uB9AC\uBDF0\uC5D0 \uB2F5\uBCC0\uC774 \uB2EC\uB838\uC2B5\uB2C8\uB2E4", `"${post.title}"\uC5D0 \uAD00\uB9AC\uC790 \uB2F5\uBCC0\uC774 \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`, `/community/post/${input.postId}`);
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
      await db.createNotification(post.userId, "comment", "Q&A에 답변이 등록되었습니다", `"${post.title}"에 관리자 답변이 등록되었습니다.`, `/shop/item.php?t_id=${post.productId}`);
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
      order: "주문/결제", shipping: "배송", return: "반품/교환",
      product: "상품", member: "회원", etc: "기타",
    };
    const categoryLabel = input.category ? (categoryLabels[input.category] ?? "기타") : "기타";

    const faqContext = allFaqs.length > 0
      ? "\n\n=== FAQ 지식베이스 ===\n" +
        allFaqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")
      : "";

    const systemPrompt = `당신은 탈모학교 쇼핑몰의 AI 고객 상담사입니다.
탈모학교는 탈모 관련 건강기능식품 및 케어 제품을 전문으로 판매하는 온라인 쇼핑몰입니다.

[답변 원칙]
- 아래 FAQ 지식베이스를 우선적으로 참고하세요
- FAQ에 없는 내용은 일반적인 쇼핑몰 정책에 근거해 답변하세요
- 확실하지 않은 내용은 "담당자에게 문의 버튼을 눌러주세요"라고 안내하세요
- 답변은 명확하고 간결하게, 필요시 번호 목록을 활용하세요
- 친절하고 공감하는 톤을 유지하세요${faqContext}`;

    const priorMessages = (input.history ?? []).map(h => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    }));

    const userMessage = priorMessages.length === 0
      ? `[문의 유형: ${categoryLabel}]\n제목: ${input.title}\n\n${input.content}`
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
      return { answer: answer || "죄송합니다. 답변 생성에 실패했습니다. 담당자에게 문의해주세요." };
    } catch {
      return { answer: "죄송합니다. AI 서비스에 일시적인 문제가 발생했습니다. 담당자에게 직접 문의해주세요." };
    }
  }),
});
