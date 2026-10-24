import { Router, type IRouter } from "express";
import pool from "../lib/mysql";
const router: IRouter = Router();
router.get("/healthz", async (_req, res) => {
  try {
    await pool.query("SELECT 1 FROM seoulmono_settings LIMIT 1");
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});
export default router;
