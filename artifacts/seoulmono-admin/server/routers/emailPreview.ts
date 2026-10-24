import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "../_core/trpc";

// 이메일 미리보기: 쇼핑몰 API(같은 서버)가 "실제 발송에 쓰는 것과 같은 코드"로 만든 샘플 메일을 받아 관리자 화면에 전달한다.
// 읽기 전용이며 어떤 메일도 발송하지 않는다. 쇼핑몰 API의 이 주소는 서버 내부(127.0.0.1)에서만 열린다.
const SHOP_MAIL_PREVIEW_URL = "http://127.0.0.1:8080/api/internal/mail-previews";

export type MailPreviewVariant = { key: string; label: string; subject: string; html: string; text: string };
export type MailPreviewTemplate = {
  key: string;
  group: "customer" | "admin";
  name: string;
  to: string;
  when: string;
  note: string;
  variants: MailPreviewVariant[];
};
export type MailPreviewResponse = {
  generatedAt: string;
  sender: { fromName: string; fromAddress: string; replyTo: string; adminTo: string };
  templates: MailPreviewTemplate[];
  planned: { name: string; note: string }[];
};

export const emailPreviewRouter = router({
  list: adminProcedure.query(async (): Promise<MailPreviewResponse> => {
    try {
      const res = await fetch(SHOP_MAIL_PREVIEW_URL, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as MailPreviewResponse;
    } catch (e: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `쇼핑몰 서버에서 메일 샘플을 가져오지 못했습니다. (${e?.message ?? e})`,
      });
    }
  }),
});
