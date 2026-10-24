import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "path";
import fs from "fs";

const app: Express = express();

// 업로드 디렉토리 생성
const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const giftImgsDir = path.join(uploadsDir, "gift-packages");
if (!fs.existsSync(giftImgsDir)) fs.mkdirSync(giftImgsDir, { recursive: true });

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// 업로드 이미지 정적 서빙
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// 공개 정적 파일 서빙 (이벤트 배너 등)
app.use("/public", express.static(path.resolve(process.cwd(), "public")));

export default app;
