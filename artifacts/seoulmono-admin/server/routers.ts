import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { categoryRouter } from "./routers/category";
import { productRouter } from "./routers/product";
import { cartRouter } from "./routers/cart";
import { wishlistRouter } from "./routers/wishlist";
import { orderRouter } from "./routers/order";
import { communityRouter } from "./routers/community";
import { userRouter } from "./routers/user";
import { adminRouter } from "./routers/admin";
import { couponRouter } from "./routers/coupon";
import { shippingRouter } from "./routers/shipping";
import { chatbotRouter } from "./routers/chatbot";
import { chatbotAdminRouter } from "./routers/chatbotAdmin";
import { recommendationRouter } from "./routers/recommendation";
import { priceAlertRouter } from "./routers/priceAlert";
import { compareRouter } from "./routers/compare";
import { salesReportRouter } from "./routers/salesReport";
import { restockAlertRouter } from "./routers/restockAlert";
import { bulkActionsRouter } from "./routers/bulkActions";
import { excelUploadRouter } from "./routers/excelUpload";
import { webhooksRouter } from "./routers/webhooks";
import { shippingMonitorRouter } from "./routers/shippingMonitor";
import { reviewsRouter } from "./routers/reviews";
import { uploadRouter } from "./routers/upload";
import { paymentRouter } from "./routers/payment";
import { paymentSettingsRouter } from "./routers/paymentSettings";
import { newsRouter } from "./routers/news";
import { productInfoRouter } from "./routers/productInfo";
import { discussionRouter } from "./routers/discussion";
import { infoBoardRouter } from "./routers/infoBoard";
import { infoBoardAutoRouter } from "./routers/infoBoardAuto";
import { discussionAutoRouter } from "./routers/discussionAuto";
import { addressRouter } from "./routers/address";
import { localAuthRouter } from "./routers/localAuth";
import { stripeRouter } from "./routers/stripe";
import { faqRouter } from "./routers/faq";
import { promoCodeRouter } from "./routers/promoCode";
import { adminLogsRouter } from "./routers/adminLogs";
import { fulfilmentRouter } from "./routers/fulfilment";
import { emailPreviewRouter } from "./routers/emailPreview";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  localAuth: localAuthRouter,
  category: categoryRouter,
  product: productRouter,
  cart: cartRouter,
  wishlist: wishlistRouter,
  order: orderRouter,
  community: communityRouter,
  user: userRouter,
  admin: adminRouter,
  coupon: couponRouter,
  shipping: shippingRouter,
  chatbot: chatbotRouter,
  chatbotAdmin: chatbotAdminRouter,
  recommendation: recommendationRouter,
  priceAlert: priceAlertRouter,
  compare: compareRouter,
  salesReport: salesReportRouter,
  restockAlert: restockAlertRouter,
  bulkActions: bulkActionsRouter,
  excelUpload: excelUploadRouter,
  webhooks: webhooksRouter,
  shippingMonitor: shippingMonitorRouter,
  reviews: reviewsRouter,
  upload: uploadRouter,
  payment: paymentRouter,
  paymentSettings: paymentSettingsRouter,
  news: newsRouter,
  productInfo: productInfoRouter,
  discussion: discussionRouter,
  infoBoard: infoBoardRouter,
  infoBoardAuto: infoBoardAutoRouter,
  discussionAuto: discussionAutoRouter,
  address: addressRouter,
  stripe: stripeRouter,
  faq: faqRouter,
  promoCode: promoCodeRouter,
  adminLogs: adminLogsRouter,
  fulfilment: fulfilmentRouter,
  emailPreview: emailPreviewRouter,
});

export type AppRouter = typeof appRouter;
