import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { orders, orderItems } from "../../drizzle/schema";
import { sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "관리자만 접근 가능합니다" });
  }
  return next({ ctx });
});

export const salesReportRouter = router({
  // 매출 리포트 자동 생성
  generate: adminProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      reportType: z.enum(["daily", "weekly", "monthly"]),
    }))
    .mutation(async ({ input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB 연결 실패" });

      // 기간 내 주문 데이터 조회
      const ordersData = await dbConn
        .select()
        .from(orders)
        .where(sql`created_at BETWEEN ${input.startDate} AND ${input.endDate}`);

      // 기간 내 주문 상품 데이터 조회
      const orderItemsData = await dbConn
        .select()
        .from(orderItems)
        .where(sql`order_id IN (SELECT id FROM orders WHERE created_at BETWEEN ${input.startDate} AND ${input.endDate})`);

      // 통계 계산
      const totalRevenue = ordersData.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
      const totalOrders = ordersData.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const completedOrders = ordersData.filter((o: any) => o.status === "delivered").length;
      const canceledOrders = ordersData.filter((o: any) => o.status === "canceled").length;

      // 상품별 판매 통계
      const productSales: Record<number, { count: number; revenue: number }> = {};
      for (const item of orderItemsData) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { count: 0, revenue: 0 };
        }
        productSales[item.productId].count += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      }

      // 상위 판매 상품
      const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .map(([id, stats]) => ({ productId: Number(id), ...stats }));

      // 상품 정보 조회
      const topProductsWithInfo = await Promise.all(
        topProducts.map(async (p) => {
          const product = await db.getProductById(p.productId);
          return { ...p, productName: product?.name || "알 수 없음" };
        })
      );

      // LLM으로 인사이트 생성
      const reportData = {
        period: `${input.startDate} ~ ${input.endDate}`,
        reportType: input.reportType,
        totalRevenue,
        totalOrders,
        avgOrderValue,
        completedOrders,
        canceledOrders,
        topProducts: topProductsWithInfo,
      };

      const llmResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "당신은 전문 이커머스 데이터 분석가입니다. 주어진 매출 데이터를 분석하여 핵심 인사이트와 개선 제안을 한국어로 작성해주세요.",
          },
          {
            role: "user",
            content: `다음 매출 데이터를 분석하여 리포트를 작성해주세요:\n\n${JSON.stringify(reportData, null, 2)}\n\n다음 항목을 포함해주세요:\n1. 전체 요약 (2-3문장)\n2. 주요 지표 분석\n3. 상위 판매 상품 분석\n4. 개선 제안 (3가지)\n5. 다음 기간 예측`,
          },
        ],
      });

      const aiInsights = llmResponse.choices[0]?.message?.content || "분석 실패";

      return {
        ...reportData,
        aiInsights,
      };
    }),
});
