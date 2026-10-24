import mysql from "mysql2/promise";

async function main() {
  const my = await mysql.createConnection({
    host: process.env.TALMO_MYSQL_HOST,
    user: process.env.TALMO_MYSQL_USER,
    password: process.env.TALMO_MYSQL_PASSWORD,
    database: process.env.TALMO_MYSQL_DATABASE,
    connectTimeout: 15000,
  });

  const [tables] = await my.query("SHOW TABLES LIKE '%item%'") as any[];
  console.log("item 관련 테이블:", JSON.stringify(tables));

  const [cols] = await my.query("DESCRIBE g5_shop_item_use") as any[];
  console.log("\ng5_shop_item_use 컬럼:", JSON.stringify(cols, null, 2));

  const [rows] = await my.query("SELECT * FROM g5_shop_item_use ORDER BY it_id DESC LIMIT 3") as any[];
  console.log("\n샘플 데이터:", JSON.stringify(rows, null, 2));

  const [cnt] = await my.query("SELECT COUNT(*) as total FROM g5_shop_item_use") as any[];
  console.log("\n총 개수:", cnt[0].total);

  await my.end();
}

main().catch(console.error);
