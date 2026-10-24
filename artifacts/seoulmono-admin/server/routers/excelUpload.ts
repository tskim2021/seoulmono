import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import * as XLSX from "xlsx";

// ─── 상품 엑셀 업로드 ───
export const excelUploadRouter = router({
  // 상품 엑셀 템플릿 다운로드
  getProductTemplate: adminProcedure.query(() => {
    const template = [
      {
        '상품명': '예시 상품',
        '상품코드': 'example-product',
        '카테고리': '의류',
        '가격': 10000,
        '할인가': 9000,
        '재고': 100,
        '간단설명': '예시 상품 설명',
        '상세설명': '상세 설명 내용',
        '썸네일URL': 'https://example.com/image.jpg',
        '추가이미지URL': 'https://example.com/img1.jpg,https://example.com/img2.jpg',
        '상태': '판매중',
        '추천상품': 'N',
        '신상품': 'Y',
        '베스트': 'N',
        '최소구매등급': 'bronze',
      },
    ];
    return { template };
  }),
  
  // 주문 운송장 엑셀 템플릿 다운로드 (아이템별)
  getTrackingTemplate: adminProcedure.query(() => {
    const template = [
      {
        '주문번호': 'ORD-20260101-000001',
        '아이템ID': 1,
        '택배사': 'CJ대한통운',
        '운송장번호': '1234567890',
        '예상배송일': '2026-01-15',
      },
    ];
    return { template };
  }),

  // 상품 엑셀 파싱 및 검증
  parseProductExcel: adminProcedure.input(z.object({
    base64Data: z.string(), // 엑셀 파일을 base64로 인코딩한 데이터
  })).mutation(async ({ input }) => {
    try {
      // base64 디코딩
      const buffer = Buffer.from(input.base64Data, 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // JSON으로 변환
      const rows = XLSX.utils.sheet_to_json(sheet) as any[];
      
      if (rows.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "엑셀 파일이 비어있습니다." });
      }
      
      if (rows.length > 1000) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "한 번에 최대 1000개까지만 업로드할 수 있습니다." });
      }
      
      // 카테고리 목록 조회 (검증용)
      const categories = await db.getAllCategories();
      const categoryMap = new Map(categories.map(c => [c.name, c.id]));
      
      // 유효성 검증 및 변환
      const validatedRows = [];
      const errors = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // 엑셀 행 번호 (헤더 제외)
        const rowErrors: string[] = [];
        
        // 필수 필드 검증
        if (!row['상품명']) rowErrors.push('상품명은 필수입니다');
        if (!row['카테고리']) rowErrors.push('카테고리는 필수입니다');
        if (row['가격'] === undefined || row['가격'] === '') rowErrors.push('가격은 필수입니다');
        if (row['재고'] === undefined || row['재고'] === '') rowErrors.push('재고는 필수입니다');
        
        // 카테고리 존재 여부 확인
        if (row['카테고리'] && !categoryMap.has(row['카테고리'])) {
          rowErrors.push(`카테고리 '${row['카테고리']}'가 존재하지 않습니다`);
        }
        
        // 가격/재고 숫자 형식 확인
        if (row['가격'] !== undefined && isNaN(Number(row['가격']))) {
          rowErrors.push('가격은 숫자여야 합니다');
        }
        if (row['재고'] !== undefined && isNaN(Number(row['재고']))) {
          rowErrors.push('재고는 숫자여야 합니다');
        }
        
        // slug 생성 (상품명 기반, 한글 → 영문 변환 없이 그대로 사용)
        const slug = row['상품코드'] || `product-${Date.now()}-${i}`;
        
        if (rowErrors.length > 0) {
          errors.push({ row: rowNum, errors: rowErrors });
        } else {
          validatedRows.push({
            name: row['상품명'],
            slug,
            categoryId: categoryMap.get(row['카테고리'])!,
            price: Number(row['가격']),
            salePrice: row['할인가'] ? Number(row['할인가']) : null,
            stock: Number(row['재고']),
            description: row['간단설명'] || '',
            content: row['상세설명'] || '',
            thumbnail: row['썸네일URL'] || '',
            images: row['추가이미지URL'] ? row['추가이미지URL'].split(',').map((s: string) => s.trim()) : [],
            status: row['상태'] === '품절' ? 'soldout' : row['상태'] === '비활성' ? 'inactive' : 'active',
            isFeatured: row['추천상품'] === 'Y' || row['추천상품'] === '1' ? 1 : 0,
            isNew: row['신상품'] === 'Y' || row['신상품'] === '1' ? 1 : 0,
            isBest: row['베스트'] === 'Y' || row['베스트'] === '1' ? 1 : 0,
            minGrade: row['최소구매등급'] || 'bronze',
          });
        }
      }
      
      return {
        success: errors.length === 0,
        totalRows: rows.length,
        validRows: validatedRows.length,
        errorRows: errors.length,
        validatedData: validatedRows,
        errors,
      };
    } catch (error: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message || "엑셀 파싱 중 오류가 발생했습니다." });
    }
  }),
  
  // 상품 일괄 등록
  bulkCreateProducts: adminProcedure.input(z.object({
    products: z.array(z.object({
      name: z.string(),
      slug: z.string(),
      categoryId: z.number(),
      price: z.number(),
      salePrice: z.number().nullable().optional(),
      stock: z.number(),
      description: z.string().optional(),
      content: z.string().optional(),
      thumbnail: z.string().optional(),
      images: z.array(z.string()).optional(),
      status: z.enum(['active', 'inactive', 'soldout']).optional(),
      isFeatured: z.number().optional(),
      isNew: z.number().optional(),
      isBest: z.number().optional(),
      minGrade: z.enum(['bronze', 'silver', 'gold', 'vip', 'vvip']).optional(),
    })),
  })).mutation(async ({ input }) => {
    const results = [];
    for (const product of input.products) {
      try {
        const productId = await db.createProduct(product as any);
        results.push({ success: true, productId, name: product.name });
      } catch (error: any) {
        results.push({ success: false, error: error.message, name: product.name });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    return {
      totalCount: input.products.length,
      successCount,
      failCount,
      results,
    };
  }),
  
  // ─── 주문 엑셀 업로드 (운송장 일괄 입력) ───
  parseTrackingExcel: adminProcedure.input(z.object({
    base64Data: z.string(),
  })).mutation(async ({ input }) => {
    try {
      const buffer = Buffer.from(input.base64Data, 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet) as any[];
      
      if (rows.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "엑셀 파일이 비어있습니다." });
      }
      
      if (rows.length > 1000) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "한 번에 최대 1000개까지만 업로드할 수 있습니다." });
      }
      
      // 택배사 목록 조회
      const carriers = await db.getActiveCarriers();
      const carrierMap = new Map(carriers.map(c => [c.name, c.id]));
      
      const validatedRows = [];
      const errors = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const rowErrors: string[] = [];
        
        // 필수 필드 검증
        if (!row['주문번호']) rowErrors.push('주문번호는 필수입니다');
        if (row['아이템ID'] === undefined || row['아이템ID'] === '') rowErrors.push('아이템ID는 필수입니다');
        if (!row['택배사']) rowErrors.push('택배사는 필수입니다');
        if (!row['운송장번호']) rowErrors.push('운송장번호는 필수입니다');
        
        // 택배사 존재 여부 확인
        if (row['택배사'] && !carrierMap.has(row['택배사'])) {
          rowErrors.push(`택배사 '${row['택배사']}'가 존재하지 않습니다`);
        }
        
        // 아이템ID 숫자 형식 확인
        const itemId = Number(row['아이템ID']);
        if (row['아이템ID'] !== undefined && isNaN(itemId)) {
          rowErrors.push('아이템ID는 숫자여야 합니다');
        }
        
        // 주문 존재 여부 확인 + 아이템 속하 여부 확인
        if (row['주문번호'] && !isNaN(itemId)) {
          const order = await db.getOrderByNumber(row['주문번호']);
          if (!order) {
            rowErrors.push(`주문번호 '${row['주문번호']}'가 존재하지 않습니다`);
          } else {
            const orderItems = await db.getOrderItems(order.id);
            const item = orderItems.find(it => it.id === itemId);
            if (!item) {
              rowErrors.push(`주문 '${row['주문번호']}'에 아이템ID ${itemId}이 존재하지 않습니다`);
            } else {
              // 기존 운송장 등록 여부 검사
              const existing = await db.getShipmentByOrderItemId(itemId);
              if (existing) {
                rowErrors.push(`아이템ID ${itemId}에 이미 운송장이 등록되어 있습니다`);
              }
            }
            
            if (rowErrors.length === 0) {
              validatedRows.push({
                orderId: order.id,
                orderNumber: row['주문번호'],
                orderItemId: itemId,
                carrierId: carrierMap.get(row['택배사'])!,
                trackingNumber: String(row['운송장번호']),
                estimatedDeliveryDate: row['예상배송일'] || null,
              });
            }
          }
        }
        
        if (rowErrors.length > 0) {
          errors.push({ row: rowNum, orderNumber: row['주문번호'], itemId: row['아이템ID'], errors: rowErrors });
        }
      }
      
      return {
        success: errors.length === 0,
        totalRows: rows.length,
        validRows: validatedRows.length,
        errorRows: errors.length,
        validatedData: validatedRows,
        errors,
      };
    } catch (error: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message || "엑셀 파싱 중 오류가 발생했습니다." });
    }
  }),
  
  // 운송장 일괄 등록 (아이템별)
  bulkCreateShipments: adminProcedure.input(z.object({
    shipments: z.array(z.object({
      orderId: z.number(),
      orderNumber: z.string(),
      orderItemId: z.number(),
      carrierId: z.number(),
      trackingNumber: z.string(),
      estimatedDeliveryDate: z.string().nullable().optional(),
    })),
  })).mutation(async ({ input }) => {
    const results = [];
    const processedOrderIds = new Set<number>();
    
    for (const shipment of input.shipments) {
      try {
        await db.createShipment({
          orderId: shipment.orderId,
          orderItemId: shipment.orderItemId,
          carrierId: shipment.carrierId,
          trackingNumber: shipment.trackingNumber,
          status: 'picked_up',
          estimatedDeliveryDate: shipment.estimatedDeliveryDate ? new Date(shipment.estimatedDeliveryDate) : null,
          shippedAt: new Date(),
        });
        
        processedOrderIds.add(shipment.orderId);
        results.push({ success: true, orderNumber: shipment.orderNumber, orderItemId: shipment.orderItemId });
      } catch (error: any) {
        results.push({ success: false, error: error.message, orderNumber: shipment.orderNumber, orderItemId: shipment.orderItemId });
      }
    }
    
    // 주문별로 한 번만 상태 변경
    for (const orderId of processedOrderIds) {
      try {
        await db.updateOrderStatus(orderId, 'shipping');
      } catch (e) {
        console.error(`[bulkCreateShipments] 주문 ${orderId} 상태 변경 실패:`, e);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    return {
      totalCount: input.shipments.length,
      successCount,
      failCount,
      results,
    };
  }),
});
