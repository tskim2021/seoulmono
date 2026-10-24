import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import boardsRouter from "./boards";
import addressesRouter from "./addresses";
import settingsRouter from "./settings";
import couponsRouter from "./coupons";
import trackingRouter from "./tracking";
import shopRouter from "./shop";
import shopAdminRouter from "./shop-admin";
import giftsRouter from "./gifts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(adminRouter);
router.use(boardsRouter);
router.use(addressesRouter);
router.use(settingsRouter);
router.use(couponsRouter);
router.use(trackingRouter);
router.use(shopRouter);
router.use(shopAdminRouter);
router.use(giftsRouter);

export default router;
