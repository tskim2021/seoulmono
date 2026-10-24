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
        '商品名': 'サンプル商品',
        '商品コード': 'example-product',
        'カテゴリ': '衣類',
        '価格': 10000,
        '割引価格': 9000,
        '在庫': 100,
        '簡易説明': 'サンプル商品の説明',
        '詳細説明': '詳細説明の内容',
        'サムネイルURL': 'https://example.com/image.jpg',
        '追加画像URL': 'https://example.com/img1.jpg,https://example.com/img2.jpg',
        'ステータス': '販売中',
        'おすすめ商品': 'N',
        '新商品': 'Y',
        'ベスト': 'N',
        '最低購入ランク': 'bronze',
      },
    ];
    return { template };
  }),
  
  // 주문 운송장 엑셀 템플릿 다운로드 (아이템별)
  getTrackingTemplate: adminProcedure.query(() => {
    const template = [
      {
        '注文番号': 'ORD-20260101-000001',
        'アイテムID': 1,
        '配送業者': 'CJ大韓通運',
        '追跡番号': '1234567890',
        '配送予定日': '2026-01-15',
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
        throw new TRPCError({ code: "BAD_REQUEST", message: "Excelファイルが空です。" });
      }
      
      if (rows.length > 1000) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "一度にアップロードできるのは最大1000件までです。" });
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
        if (!row['商品名']) rowErrors.push('商品名は必須です');
        if (!row['カテゴリ']) rowErrors.push('カテゴリは必須です');
        if (row['価格'] === undefined || row['価格'] === '') rowErrors.push('価格は必須です');
        if (row['在庫'] === undefined || row['在庫'] === '') rowErrors.push('在庫は必須です');
        
        // 카테고리 존재 여부 확인
        if (row['カテゴリ'] && !categoryMap.has(row['カテゴリ'])) {
          rowErrors.push(`カテゴリ「${row['カテゴリ']}」は存在しません`);
        }
        
        // 가격/재고 숫자 형식 확인
        if (row['価格'] !== undefined && isNaN(Number(row['価格']))) {
          rowErrors.push('価格は数値で入力してください');
        }
        if (row['在庫'] !== undefined && isNaN(Number(row['在庫']))) {
          rowErrors.push('在庫は数値で入力してください');
        }
        
        // slug 생성 (상품명 기반, 한글 → 영문 변환 없이 그대로 사용)
        const slug = row['商品コード'] || `product-${Date.now()}-${i}`;
        
        if (rowErrors.length > 0) {
          errors.push({ row: rowNum, errors: rowErrors });
        } else {
          validatedRows.push({
            name: row['商品名'],
            slug,
            categoryId: categoryMap.get(row['カテゴリ'])!,
            price: Number(row['価格']),
            salePrice: row['割引価格'] ? Number(row['割引価格']) : null,
            stock: Number(row['在庫']),
            description: row['簡易説明'] || '',
            content: row['詳細説明'] || '',
            thumbnail: row['サムネイルURL'] || '',
            images: row['追加画像URL'] ? row['追加画像URL'].split(',').map((s: string) => s.trim()) : [],
            status: row['ステータス'] === '売り切れ' ? 'soldout' : row['ステータス'] === '非公開' ? 'inactive' : 'active',
            isFeatured: row['おすすめ商品'] === 'Y' || row['おすすめ商品'] === '1' ? 1 : 0,
            isNew: row['新商品'] === 'Y' || row['新商品'] === '1' ? 1 : 0,
            isBest: row['ベスト'] === 'Y' || row['ベスト'] === '1' ? 1 : 0,
            minGrade: row['最低購入ランク'] || 'bronze',
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
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message || "Excelの解析中にエラーが発生しました。" });
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
        throw new TRPCError({ code: "BAD_REQUEST", message: "Excelファイルが空です。" });
      }
      
      if (rows.length > 1000) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "一度にアップロードできるのは最大1000件までです。" });
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
        if (!row['注文番号']) rowErrors.push('注文番号は必須です');
        if (row['アイテムID'] === undefined || row['アイテムID'] === '') rowErrors.push('アイテムIDは必須です');
        if (!row['配送業者']) rowErrors.push('配送業者は必須です');
        if (!row['追跡番号']) rowErrors.push('追跡番号は必須です');
        
        // 택배사 존재 여부 확인
        if (row['配送業者'] && !carrierMap.has(row['配送業者'])) {
          rowErrors.push(`配送業者「${row['配送業者']}」は存在しません`);
        }
        
        // 아이템ID 숫자 형식 확인
        const itemId = Number(row['アイテムID']);
        if (row['アイテムID'] !== undefined && isNaN(itemId)) {
          rowErrors.push('アイテムIDは数値で入力してください');
        }
        
        // 주문 존재 여부 확인 + 아이템 속하 여부 확인
        if (row['注文番号'] && !isNaN(itemId)) {
          const order = await db.getOrderByNumber(row['注文番号']);
          if (!order) {
            rowErrors.push(`注文番号「${row['注文番号']}」は存在しません`);
          } else {
            const orderItems = await db.getOrderItems(order.id);
            const item = orderItems.find(it => it.id === itemId);
            if (!item) {
              rowErrors.push(`注文「${row['注文番号']}」にアイテムID ${itemId}は存在しません`);
            } else {
              // 기존 운송장 등록 여부 검사
              const existing = await db.getShipmentByOrderItemId(itemId);
              if (existing) {
                rowErrors.push(`アイテムID ${itemId}にはすでに追跡番号が登録されています`);
              }
            }
            
            if (rowErrors.length === 0) {
              validatedRows.push({
                orderId: order.id,
                orderNumber: row['注文番号'],
                orderItemId: itemId,
                carrierId: carrierMap.get(row['配送業者'])!,
                trackingNumber: String(row['追跡番号']),
                estimatedDeliveryDate: row['配送予定日'] || null,
              });
            }
          }
        }
        
        if (rowErrors.length > 0) {
          errors.push({ row: rowNum, orderNumber: row['注文番号'], itemId: row['アイテムID'], errors: rowErrors });
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
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message || "Excelの解析中にエラーが発生しました。" });
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
