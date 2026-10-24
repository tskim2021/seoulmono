import app from "./app";
import { logger } from "./lib/logger";
import pool from "./lib/mysql";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const FOOTER_SEED: Record<string, string> = {
  footer_company: "주식회사 와이앤에이치에스",
  footer_ceo: "윤석민",
  footer_address: "서울특별시 중랑구 용마산로 536 (망우동)",
  footer_business_num: "429-81-03401",
  footer_online_num: "2024-서울중랑-1470",
  footer_privacy: "윤석민",
  footer_tel: "010-2051-5692",
  footer_cs_tel: "010-2051-5692",
  footer_cs_hours: "평일 : 10:00 ~ 18:00",
  footer_cs_lunch: "점심시간 : 12:00 ~ 13:00  일요일 / 공휴일 휴무",
};

async function initTempPwTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seoulmono_temp_pw (
        mb_id VARCHAR(20) PRIMARY KEY,
        temp_hash VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL
      )
    `);
  } catch (err) {
    logger.error({ err }, "[init] seoulmono_temp_pw 테이블 생성 실패");
  }
}

async function seedFooterDefaults() {
  try {
    for (const [key, value] of Object.entries(FOOTER_SEED)) {
      await pool.query(
        "INSERT INTO seoulmono_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = IF(setting_value = '' OR setting_key IN ('footer_tel','footer_cs_tel'), VALUES(setting_value), setting_value)",
        [key, value]
      );
    }
    logger.info("[seed] 푸터 기본값 초기화 완료");
  } catch (err) {
    logger.error({ err }, "[seed] 푸터 기본값 초기화 실패");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  await initTempPwTable();
  await seedFooterDefaults();
});
