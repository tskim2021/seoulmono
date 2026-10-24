import { Router, type IRouter } from "express";
import pool from "../lib/mysql";
import { authMiddleware, adminMiddleware } from "../lib/auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Storage } from "@google-cloud/storage";

const router: IRouter = Router();

function decodeFilename(name: string): string {
  try {
    return Buffer.from(name, "latin1").toString("utf8");
  } catch (_) {
    return name;
  }
}

const boardUploadDir = path.resolve(process.cwd(), "uploads/board");
if (!fs.existsSync(boardUploadDir)) {
  fs.mkdirSync(boardUploadDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".hwp", ".zip", ".txt", ".csv", ".ppt", ".pptx"]);

const boardUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, boardUploadDir),
    filename: (_req, file, cb) => {
      file.originalname = decodeFilename(file.originalname);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `board_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    file.originalname = decodeFilename(file.originalname);
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      cb(new Error(`許可されていないファイル形式です: ${ext}`));
      return;
    }
    cb(null, true);
  },
});

const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "";
const SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
let boardGcsBucket: any = null;
if (BUCKET_ID) {
  try {
    const storage = new Storage({
      credentials: {
        audience: "storage",
        subject_token_type: "access_token",
        token_url: `${SIDECAR_ENDPOINT}/token`,
        type: "external_account",
        credential_source: {
          url: `${SIDECAR_ENDPOINT}/credential`,
          format: { type: "json", subject_token_field_name: "access_token" },
        },
        universe_domain: "googleapis.com",
      } as any,
      projectId: "",
    });
    boardGcsBucket = storage.bucket(BUCKET_ID);
  } catch (e) {}
}

const WRITE_DEFAULTS: Record<string, string> = {
  wr_reply: '',
  wr_comment_reply: '',
  ca_name: '',
  wr_option: 'html1',
  wr_link1: '',
  wr_link2: '',
  wr_password: '',
  wr_homepage: '',
  wr_ip: '',
  wr_facebook_user: '',
  wr_twitter_user: '',
  wr_1: '', wr_2: '', wr_3: '', wr_4: '', wr_5: '',
  wr_6: '', wr_7: '', wr_8: '', wr_9: '', wr_10: '',
  wr_seo_title: '',
};

// is_notice 컬럼 추가 (없을 경우)
pool.query("ALTER TABLE g5_write_notice ADD COLUMN IF NOT EXISTS is_notice TINYINT NOT NULL DEFAULT 0").catch(() => {});

function mapNoticeRow(r: any) {
  const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"]);
  let files: any[] = [];
  if (r.wr_1) { try { files = JSON.parse(r.wr_1); } catch (_) {} }
  const images = files
    .filter((f: any) => IMAGE_EXTS.has((f.filename || "").toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || ""))
    .map((f: any) => ({ filename: f.filename, originalname: f.originalname, url: `/api/boards/files/${f.filename}` }));
  return {
    wr_id: r.wr_id,
    wr_subject: r.wr_subject || "",
    wr_content: r.wr_content || "",
    wr_name: r.wr_name || "",
    mb_id: r.mb_id || "",
    wr_datetime: r.wr_datetime || "",
    wr_hit: r.wr_hit || 0,
    wr_comment: r.wr_comment || 0,
    wr_file: Number(r.wr_file) || 0,
    is_notice: Number(r.is_notice) || 0,
    images,
  };
}

router.get("/boards/notice", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    // 관리자 작성 글만 (보안: mb_level >= 9인 회원의 글만 표시)
    const adminFilter = `wr_is_comment = 0 AND mb_id IN (
      SELECT mb_id FROM g5_member WHERE mb_level >= 9
    )`;

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM g5_write_notice WHERE ${adminFilter}`
    );
    const total = Number(countRows[0].total);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT wr_id, wr_subject, wr_content, wr_name, mb_id, wr_datetime, wr_hit, wr_comment, wr_file, wr_1, is_notice
       FROM g5_write_notice
       WHERE ${adminFilter}
       ORDER BY is_notice DESC, wr_num ASC, wr_reply ASC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({ posts: rows.map(mapNoticeRow), total, page, limit });
  } catch (err: any) {
    req.log?.error({ err }, "GetNotices error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.get("/boards/notice/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await pool.query("UPDATE g5_write_notice SET wr_hit = wr_hit + 1 WHERE wr_id = ?", [id]);

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT wr_id, wr_subject, wr_content, wr_name, mb_id, wr_datetime, wr_hit, wr_file, wr_1 FROM g5_write_notice WHERE wr_id = ? AND wr_is_comment = 0",
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "投稿が見つかりません" });
      return;
    }

    const row = rows[0];
    let files: any[] = [];
    if (row.wr_1) {
      try {
        files = JSON.parse(row.wr_1);
      } catch (_) {}
    }

    const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"]);
    res.json({
      ...row,
      files: files.map((f: any) => {
        const ext = (f.filename || "").toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
        return {
          filename: f.filename,
          originalname: f.originalname,
          size: f.size,
          mimetype: f.mimetype,
          url: `/api/boards/files/${f.filename}`,
          isImage: IMAGE_EXTS.has(ext),
        };
      }),
    });
  } catch (err: any) {
    req.log?.error({ err }, "GetNotice error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/boards/notice", authMiddleware, adminMiddleware, boardUpload.array("files", 5), async (req, res) => {
  try {
    const user = (req as any).user;
    const { subject, content } = req.body;
    if (!subject || !content) {
      res.status(400).json({ error: "件名と内容を入力してください" });
      return;
    }

    const files = (req.files as Express.Multer.File[]) || [];

    if (boardGcsBucket && files.length > 0) {
      for (const file of files) {
        try {
          const gcsFile = boardGcsBucket.file(`board-files/${file.filename}`);
          await gcsFile.save(fs.readFileSync(file.path), {
            metadata: { contentType: file.mimetype },
          });
        } catch (e: any) {
          req.log?.error({ err: e }, "Failed to upload board file to GCS");
          for (const f of files) { try { fs.unlinkSync(f.path); } catch (_) {} }
          res.status(500).json({ error: "ファイルのアップロードに失敗しました。もう一度お試しください。" });
          return;
        }
      }
    }

    const [memberRows] = await pool.query<RowDataPacket[]>(
      "SELECT mb_name, mb_email FROM g5_member WHERE mb_id = ?",
      [user.mb_id]
    );
    const mbName = memberRows[0]?.mb_name || user.mb_id;
    const mbEmail = memberRows[0]?.mb_email || "";

    const [maxNum] = await pool.query<RowDataPacket[]>(
      "SELECT MIN(wr_num) as min_num FROM g5_write_notice"
    );
    const wrNum = (maxNum[0]?.min_num || 0) - 1;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const filesMeta = files.map((f) => ({
      filename: f.filename,
      originalname: f.originalname,
      size: f.size,
      mimetype: f.mimetype,
    }));

    const isNotice = req.body.is_notice === "1" || req.body.is_notice === true || req.body.is_notice === 1 ? 1 : 0;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO g5_write_notice (
        wr_num, wr_reply, wr_parent, wr_is_comment, wr_comment, wr_comment_reply,
        ca_name, wr_option, wr_subject, wr_content, wr_seo_title,
        wr_link1, wr_link2, wr_link1_hit, wr_link2_hit, wr_hit, wr_good, wr_nogood,
        mb_id, wr_password, wr_name, wr_email, wr_homepage,
        wr_datetime, wr_file, wr_last, wr_ip,
        wr_facebook_user, wr_twitter_user,
        wr_1, wr_2, wr_3, wr_4, wr_5, wr_6, wr_7, wr_8, wr_9, wr_10, is_notice
      ) VALUES (?, '', 0, 0, 0, '', '', 'html1', ?, ?, '', '', '', 0, 0, 0, 0, 0, ?, '', ?, ?, '', ?, ?, ?, '', '', '', ?, '', '', '', '', '', '', '', '', '', ?)`,
      [wrNum, subject, content, user.mb_id, mbName, mbEmail, now, files.length, now, filesMeta.length > 0 ? JSON.stringify(filesMeta) : "", isNotice]
    );

    const wrId = result.insertId;
    await pool.query("UPDATE g5_write_notice SET wr_parent = ? WHERE wr_id = ?", [wrId, wrId]);

    res.status(201).json({ message: "お知らせを登録しました", wr_id: wrId });
  } catch (err: any) {
    req.log?.error({ err }, "CreateNotice error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.get("/boards/files/:filename", async (req, res) => {
  const filename = (req.params as any).filename;
  if (!/^board_\d+_[a-z0-9]{6}\.[a-z0-9]+$/i.test(filename) || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    res.status(400).json({ error: "ファイル名が正しくありません" });
    return;
  }
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".gif": "image/gif", ".webp": "image/webp", ".pdf": "application/pdf",
    ".doc": "application/msword", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".hwp": "application/x-hwp", ".zip": "application/zip",
    ".txt": "text/plain",
  };
  const contentType = mimeMap[ext] || "application/octet-stream";

  const filePath = path.join(boardUploadDir, filename);
  if (fs.existsSync(filePath)) {
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.sendFile(filePath);
    return;
  }

  if (boardGcsBucket) {
    try {
      const gcsFile = boardGcsBucket.file(`board-files/${filename}`);
      const [exists] = await gcsFile.exists();
      if (exists) {
        const [buffer] = await gcsFile.download();
        fs.writeFileSync(filePath, buffer);
        res.set("Content-Type", contentType);
        res.set("Cache-Control", "public, max-age=86400");
        res.send(buffer);
        return;
      }
    } catch (e: any) {
      req.log?.warn({ err: e }, "GCS board file download failed");
    }
  }

  res.status(404).json({ error: "ファイルが見つかりません" });
});

router.put("/boards/notice/:id", authMiddleware, adminMiddleware, boardUpload.array("files", 5), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { subject, content } = req.body;
    if (!subject || !content) {
      res.status(400).json({ error: "件名と内容を入力してください" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT wr_id, wr_1 FROM g5_write_notice WHERE wr_id = ? AND wr_is_comment = 0",
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "投稿が見つかりません" });
      return;
    }

    let deleteFiles: string[] = [];
    if (req.body.deleteFiles) {
      try { deleteFiles = JSON.parse(req.body.deleteFiles); } catch (_) {
        deleteFiles = Array.isArray(req.body.deleteFiles) ? req.body.deleteFiles : [req.body.deleteFiles];
      }
    }

    let existingFiles: any[] = [];
    try { existingFiles = JSON.parse(rows[0].wr_1 || "[]"); } catch (_) {}

    const keptFiles = existingFiles.filter((f: any) => !deleteFiles.includes(f.filename));

    for (const fname of deleteFiles) {
      const fpath = path.join(boardUploadDir, fname);
      try { if (fs.existsSync(fpath)) fs.unlinkSync(fpath); } catch (_) {}
      if (boardGcsBucket) {
        try { await boardGcsBucket.file(`board-files/${fname}`).delete(); } catch (_) {}
      }
    }

    const newUploads = (req.files as Express.Multer.File[]) || [];
    if (boardGcsBucket && newUploads.length > 0) {
      for (const file of newUploads) {
        try {
          await boardGcsBucket.file(`board-files/${file.filename}`).save(fs.readFileSync(file.path), {
            resumable: false, metadata: { contentType: file.mimetype },
          });
        } catch (e: any) {
          req.log?.error({ err: e }, "Failed to upload board file to GCS");
        }
      }
    }

    const newFileMeta = newUploads.map((f) => ({ filename: f.filename, originalname: f.originalname, size: f.size, mimetype: f.mimetype }));
    const allFiles = [...keptFiles, ...newFileMeta];

    const isNotice = req.body.is_notice === "1" || req.body.is_notice === true || req.body.is_notice === 1 ? 1 : 0;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    await pool.query(
      "UPDATE g5_write_notice SET wr_subject = ?, wr_content = ?, wr_last = ?, wr_1 = ?, wr_file = ?, is_notice = ? WHERE wr_id = ?",
      [subject, content, now, allFiles.length > 0 ? JSON.stringify(allFiles) : "", allFiles.length, isNotice, id]
    );
    res.json({ message: "お知らせを更新しました" });
  } catch (err: any) {
    req.log?.error({ err }, "UpdateNotice error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.delete("/boards/notice", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { ids } = req.body as { ids: number[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: "削除する項目を選択してください" });
      return;
    }
    const placeholders = ids.map(() => "?").join(",");
    await pool.query(
      `DELETE FROM g5_write_notice WHERE wr_id IN (${placeholders}) AND wr_is_comment = 0`,
      ids
    );
    res.json({ message: `${ids.length}件のお知らせを削除しました` });
  } catch (err: any) {
    req.log?.error({ err }, "BulkDeleteNotice error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.delete("/boards/notice/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT wr_id FROM g5_write_notice WHERE wr_id = ? AND wr_is_comment = 0",
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "投稿が見つかりません" });
      return;
    }
    await pool.query("DELETE FROM g5_write_notice WHERE wr_id = ?", [id]);
    res.json({ message: "お知らせを削除しました" });
  } catch (err: any) {
    req.log?.error({ err }, "DeleteNotice error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.get("/boards/qna", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    let whereClause = "WHERE wr_is_comment = 0";
    const queryParams: any[] = [];

    if (user.mb_level < 10) {
      whereClause += " AND mb_id = ?";
      queryParams.push(user.mb_id);
    }

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM g5_write_qna ${whereClause}`,
      queryParams
    );
    const total = Number(countRows[0].total);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT wr_id, wr_subject, wr_content, wr_name, mb_id, wr_datetime, wr_hit, wr_comment, wr_file, wr_1
       FROM g5_write_qna
       ${whereClause}
       ORDER BY wr_num, wr_reply
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    const IMG_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"]);

    res.json({
      posts: rows.map((r: any) => {
        let files: any[] = [];
        if (r.wr_1) {
          try { files = JSON.parse(r.wr_1); } catch (_) {}
        }
        const images = files
          .filter((f: any) => {
            const ext = (f.filename || "").toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
            return IMG_EXTS.has(ext);
          })
          .map((f: any) => ({
            filename: f.filename,
            originalname: f.originalname,
            url: `/api/boards/files/${f.filename}`,
          }));
        return {
          wr_id: r.wr_id,
          wr_subject: r.wr_subject || "",
          wr_content: r.wr_content || "",
          wr_name: r.wr_name || "",
          mb_id: r.mb_id || "",
          wr_datetime: r.wr_datetime || "",
          wr_hit: r.wr_hit || 0,
          wr_comment: r.wr_comment || 0,
          wr_file: Number(r.wr_file) || 0,
          images,
        };
      }),
      total,
      page,
      limit,
    });
  } catch (err: any) {
    req.log?.error({ err }, "GetQna error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.get("/boards/qna/:id", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = Number(req.params.id);
    await pool.query("UPDATE g5_write_qna SET wr_hit = wr_hit + 1 WHERE wr_id = ?", [id]);

    let query = "SELECT wr_id, wr_subject, wr_content, wr_name, mb_id, wr_datetime, wr_hit, wr_file, wr_1 FROM g5_write_qna WHERE wr_id = ? AND wr_is_comment = 0";
    const params: any[] = [id];
    if (user.mb_level < 10) {
      query += " AND mb_id = ?";
      params.push(user.mb_id);
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    if (rows.length === 0) {
      res.status(404).json({ error: "投稿が見つかりません" });
      return;
    }

    const row = rows[0];
    let qnaFiles: any[] = [];
    if (row.wr_1) {
      try { qnaFiles = JSON.parse(row.wr_1); } catch (_) {}
    }
    const IMG_EXTS2 = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"]);

    const [comments] = await pool.query<RowDataPacket[]>(
      "SELECT wr_id, wr_content, wr_name, mb_id, wr_datetime FROM g5_write_qna WHERE wr_parent = ? AND wr_is_comment = 1 ORDER BY wr_id ASC",
      [id]
    );

    res.json({
      ...row,
      files: qnaFiles.map((f: any) => {
        const ext = (f.filename || "").toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
        return {
          filename: f.filename,
          originalname: f.originalname,
          size: f.size,
          mimetype: f.mimetype,
          url: `/api/boards/files/${f.filename}`,
          isImage: IMG_EXTS2.has(ext),
        };
      }),
      comments: comments.map((c: any) => ({
        wr_id: c.wr_id,
        wr_content: c.wr_content || "",
        wr_name: c.wr_name || "",
        mb_id: c.mb_id || "",
        wr_datetime: c.wr_datetime || "",
      })),
    });
  } catch (err: any) {
    req.log?.error({ err }, "GetQnaDetail error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/boards/qna", authMiddleware, boardUpload.array("files", 5), async (req, res) => {
  try {
    const user = (req as any).user;
    const { subject, content } = req.body;
    if (!subject || !content) {
      res.status(400).json({ error: "件名と内容を入力してください" });
      return;
    }

    const [memberRows] = await pool.query<RowDataPacket[]>(
      "SELECT mb_name, mb_email FROM g5_member WHERE mb_id = ?",
      [user.mb_id]
    );
    const mbName = memberRows[0]?.mb_name || user.mb_id;
    const mbEmail = memberRows[0]?.mb_email || "";

    const files = (req.files as Express.Multer.File[]) || [];

    if (boardGcsBucket && files.length > 0) {
      for (const file of files) {
        try {
          const gcsFile = boardGcsBucket.file(`board-files/${file.filename}`);
          const buffer = fs.readFileSync(file.path);
          await gcsFile.save(buffer, {
            resumable: false,
            metadata: { contentType: file.mimetype },
          });
        } catch (e: any) {
          req.log?.error({ err: e }, "Failed to upload qna file to GCS");
          for (const f of files) { try { fs.unlinkSync(f.path); } catch (_) {} }
          res.status(500).json({ error: "ファイルのアップロードに失敗しました。もう一度お試しください。" });
          return;
        }
      }
    }

    const filesMeta = files.map((f) => ({
      filename: f.filename,
      originalname: f.originalname,
      size: f.size,
      mimetype: f.mimetype,
    }));

    const [maxNum] = await pool.query<RowDataPacket[]>(
      "SELECT MIN(wr_num) as min_num FROM g5_write_qna"
    );
    const wrNum = (maxNum[0]?.min_num || 0) - 1;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO g5_write_qna (
        wr_num, wr_reply, wr_parent, wr_is_comment, wr_comment, wr_comment_reply,
        ca_name, wr_option, wr_subject, wr_content, wr_seo_title,
        wr_link1, wr_link2, wr_link1_hit, wr_link2_hit, wr_hit, wr_good, wr_nogood,
        mb_id, wr_password, wr_name, wr_email, wr_homepage,
        wr_datetime, wr_file, wr_last, wr_ip,
        wr_facebook_user, wr_twitter_user,
        wr_1, wr_2, wr_3, wr_4, wr_5, wr_6, wr_7, wr_8, wr_9, wr_10
      ) VALUES (?, '', 0, 0, 0, '', '', 'html1', ?, ?, '', '', '', 0, 0, 0, 0, 0, ?, '', ?, ?, '', ?, ?, ?, '', '', '', ?, '', '', '', '', '', '', '', '', '')`,
      [wrNum, subject, content, user.mb_id, mbName, mbEmail, now, files.length, now, filesMeta.length > 0 ? JSON.stringify(filesMeta) : ""]
    );

    const wrId = result.insertId;
    await pool.query("UPDATE g5_write_qna SET wr_parent = ? WHERE wr_id = ?", [wrId, wrId]);

    res.status(201).json({ message: "お問い合わせを登録しました", wr_id: wrId });
  } catch (err: any) {
    req.log?.error({ err }, "CreateQna error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.put("/boards/qna/:id", authMiddleware, adminMiddleware, boardUpload.array("files", 5), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { subject, content } = req.body;
    if (!subject || !content) {
      res.status(400).json({ error: "件名と内容を入力してください" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT wr_id, wr_1 FROM g5_write_qna WHERE wr_id = ? AND wr_is_comment = 0",
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "投稿が見つかりません" });
      return;
    }

    let deleteFiles: string[] = [];
    if (req.body.deleteFiles) {
      try { deleteFiles = JSON.parse(req.body.deleteFiles); } catch (_) {
        deleteFiles = Array.isArray(req.body.deleteFiles) ? req.body.deleteFiles : [req.body.deleteFiles];
      }
    }

    let existingFiles: any[] = [];
    try { existingFiles = JSON.parse(rows[0].wr_1 || "[]"); } catch (_) {}

    const keptFiles = existingFiles.filter((f: any) => !deleteFiles.includes(f.filename));

    for (const fname of deleteFiles) {
      const fpath = path.join(boardUploadDir, fname);
      try { if (fs.existsSync(fpath)) fs.unlinkSync(fpath); } catch (_) {}
      if (boardGcsBucket) {
        try { await boardGcsBucket.file(`board-files/${fname}`).delete(); } catch (_) {}
      }
    }

    const newUploads = (req.files as Express.Multer.File[]) || [];
    if (boardGcsBucket && newUploads.length > 0) {
      for (const file of newUploads) {
        try {
          await boardGcsBucket.file(`board-files/${file.filename}`).save(fs.readFileSync(file.path), {
            resumable: false, metadata: { contentType: file.mimetype },
          });
        } catch (e: any) {
          req.log?.error({ err: e }, "Failed to upload qna file to GCS");
        }
      }
    }

    const newFileMeta = newUploads.map((f) => ({ filename: f.filename, originalname: f.originalname, size: f.size, mimetype: f.mimetype }));
    const allFiles = [...keptFiles, ...newFileMeta];

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    await pool.query(
      "UPDATE g5_write_qna SET wr_subject = ?, wr_content = ?, wr_last = ?, wr_1 = ?, wr_file = ? WHERE wr_id = ?",
      [subject, content, now, allFiles.length > 0 ? JSON.stringify(allFiles) : "", allFiles.length, id]
    );
    res.json({ message: "お問い合わせを更新しました" });
  } catch (err: any) {
    req.log?.error({ err }, "UpdateQna error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.delete("/boards/qna/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT wr_id FROM g5_write_qna WHERE wr_id = ? AND wr_is_comment = 0",
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "投稿が見つかりません" });
      return;
    }
    await pool.query("DELETE FROM g5_write_qna WHERE wr_id = ? OR wr_parent = ?", [id, id]);
    res.json({ message: "お問い合わせを削除しました" });
  } catch (err: any) {
    req.log?.error({ err }, "DeleteQna error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/boards/qna/:id/comment", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const parentId = Number(req.params.id);
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ error: "回答内容を入力してください" });
      return;
    }

    const [parentRows] = await pool.query<RowDataPacket[]>(
      "SELECT wr_id FROM g5_write_qna WHERE wr_id = ? AND wr_is_comment = 0",
      [parentId]
    );
    if (parentRows.length === 0) {
      res.status(404).json({ error: "元の投稿が見つかりません" });
      return;
    }

    const [memberRows] = await pool.query<RowDataPacket[]>(
      "SELECT mb_name, mb_email FROM g5_member WHERE mb_id = ?",
      [user.mb_id]
    );
    const mbName = memberRows[0]?.mb_name || "管理者";
    const mbEmail = memberRows[0]?.mb_email || "";

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.query<ResultSetHeader>(
      `INSERT INTO g5_write_qna (
        wr_num, wr_reply, wr_parent, wr_is_comment, wr_comment, wr_comment_reply,
        ca_name, wr_option, wr_subject, wr_content, wr_seo_title,
        wr_link1, wr_link2, wr_link1_hit, wr_link2_hit, wr_hit, wr_good, wr_nogood,
        mb_id, wr_password, wr_name, wr_email, wr_homepage,
        wr_datetime, wr_file, wr_last, wr_ip,
        wr_facebook_user, wr_twitter_user,
        wr_1, wr_2, wr_3, wr_4, wr_5, wr_6, wr_7, wr_8, wr_9, wr_10
      ) VALUES (0, '', ?, 1, 0, '', '', 'html1', '', ?, '', '', '', 0, 0, 0, 0, 0, ?, '', ?, ?, '', ?, 0, ?, '', '', '', '', '', '', '', '', '', '', '', '', '')`,
      [parentId, content, user.mb_id, mbName, mbEmail, now, now]
    );

    await pool.query(
      "UPDATE g5_write_qna SET wr_comment = wr_comment + 1, wr_last = ? WHERE wr_id = ?",
      [now, parentId]
    );

    res.status(201).json({ message: "回答を登録しました" });
  } catch (err: any) {
    req.log?.error({ err }, "CreateQnaComment error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.put("/boards/qna/:id/comment/:commentId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const commentId = Number(req.params.commentId);
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ error: "回答内容を入力してください" });
      return;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT wr_id FROM g5_write_qna WHERE wr_id = ? AND wr_is_comment = 1",
      [commentId]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "回答が見つかりません" });
      return;
    }
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    await pool.query(
      "UPDATE g5_write_qna SET wr_content = ?, wr_last = ? WHERE wr_id = ?",
      [content, now, commentId]
    );
    res.json({ message: "回答を更新しました" });
  } catch (err: any) {
    req.log?.error({ err }, "UpdateQnaComment error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.delete("/boards/qna/:id/comment/:commentId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const parentId = Number(req.params.id);
    const commentId = Number(req.params.commentId);
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT wr_id FROM g5_write_qna WHERE wr_id = ? AND wr_is_comment = 1 AND wr_parent = ?",
      [commentId, parentId]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "回答が見つかりません" });
      return;
    }
    await pool.query("DELETE FROM g5_write_qna WHERE wr_id = ?", [commentId]);
    await pool.query(
      "UPDATE g5_write_qna SET wr_comment = GREATEST(wr_comment - 1, 0) WHERE wr_id = ?",
      [parentId]
    );
    res.json({ message: "回答を削除しました" });
  } catch (err: any) {
    req.log?.error({ err }, "DeleteQnaComment error");
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

// ─── B2B Banner Management ────────────────────────────────────────────────────

async function initB2BBanners() {
  // 테이블 생성 (신규 구조: img_pc, img_mobile)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS b2b_banners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      img_pc VARCHAR(600) DEFAULT '',
      img_mobile VARCHAR(600) DEFAULT '',
      title VARCHAR(200) DEFAULT '',
      link_url VARCHAR(500) DEFAULT '',
      is_new_window TINYINT DEFAULT 0,
      start_date DATE NULL,
      end_date DATE NULL,
      sort_order INT DEFAULT 0,
      is_active TINYINT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // 기존 컬럼(type, image_url) → img_pc, img_mobile 마이그레이션
  const [cols] = await pool.query<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='b2b_banners' AND COLUMN_NAME='image_url'"
  );
  if ((cols as any[]).length > 0) {
    // img_pc/img_mobile 컬럼 없으면 추가
    await pool.query("ALTER TABLE b2b_banners ADD COLUMN IF NOT EXISTS img_pc VARCHAR(600) DEFAULT ''").catch(() => {});
    await pool.query("ALTER TABLE b2b_banners ADD COLUMN IF NOT EXISTS img_mobile VARCHAR(600) DEFAULT ''").catch(() => {});
    // 기존 image_url → img_pc 로 복사
    await pool.query("UPDATE b2b_banners SET img_pc = image_url WHERE img_pc = '' AND image_url != ''").catch(() => {});
    // 구 컬럼 제거
    await pool.query("ALTER TABLE b2b_banners DROP COLUMN IF EXISTS type").catch(() => {});
    await pool.query("ALTER TABLE b2b_banners DROP COLUMN IF EXISTS image_url").catch(() => {});
  }
}
initB2BBanners().catch(() => {});

async function uploadBannerFile(file: Express.Multer.File): Promise<string> {
  const url = `/api/boards/files/${file.filename}`;
  if (boardGcsBucket) {
    try {
      await boardGcsBucket.file(`board-files/${file.filename}`).save(
        fs.readFileSync(file.path), { contentType: file.mimetype, resumable: false }
      );
    } catch (_) {}
    try { fs.unlinkSync(file.path); } catch (_) {}
  }
  return url;
}

router.get("/admin/b2b-banners", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM b2b_banners ORDER BY sort_order ASC, id ASC"
    );
    res.json({ banners: rows });
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

router.post("/admin/b2b-banners", authMiddleware, adminMiddleware, boardUpload.fields([{ name: "img_pc", maxCount: 1 }, { name: "img_mobile", maxCount: 1 }]), async (req, res) => {
  try {
    const { title, link_url, is_new_window, start_date, end_date, sort_order, is_active } = req.body;
    const files = req.files as { [f: string]: Express.Multer.File[] } | undefined;
    const pcFile = files?.img_pc?.[0];
    const mobileFile = files?.img_mobile?.[0];

    const imgPc = pcFile ? await uploadBannerFile(pcFile) : (req.body.img_pc_url || "");
    const imgMobile = mobileFile ? await uploadBannerFile(mobileFile) : (req.body.img_mobile_url || "");

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO b2b_banners (img_pc, img_mobile, title, link_url, is_new_window, start_date, end_date, sort_order, is_active) VALUES (?,?,?,?,?,?,?,?,?)",
      [imgPc, imgMobile, title || "", link_url || "", is_new_window === "1" ? 1 : 0, start_date || null, end_date || null, sort_order || 0, is_active === "0" ? 0 : 1]
    );
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM b2b_banners WHERE id = ?", [result.insertId]);
    res.status(201).json({ banner: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

router.put("/admin/b2b-banners/:id", authMiddleware, adminMiddleware, boardUpload.fields([{ name: "img_pc", maxCount: 1 }, { name: "img_mobile", maxCount: 1 }]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, link_url, is_new_window, start_date, end_date, sort_order, is_active } = req.body;
    const files = req.files as { [f: string]: Express.Multer.File[] } | undefined;
    const pcFile = files?.img_pc?.[0];
    const mobileFile = files?.img_mobile?.[0];

    const [existing] = await pool.query<RowDataPacket[]>("SELECT * FROM b2b_banners WHERE id = ?", [id]);
    if (!existing.length) { res.status(404).json({ error: "バナーが見つかりません" }); return; }

    const imgPc = pcFile ? await uploadBannerFile(pcFile) : (req.body.img_pc_url || existing[0].img_pc || "");
    const imgMobile = mobileFile ? await uploadBannerFile(mobileFile) : (req.body.img_mobile_url || existing[0].img_mobile || "");

    await pool.query(
      "UPDATE b2b_banners SET img_pc=?, img_mobile=?, title=?, link_url=?, is_new_window=?, start_date=?, end_date=?, sort_order=?, is_active=? WHERE id=?",
      [imgPc, imgMobile, title ?? existing[0].title, link_url ?? existing[0].link_url, is_new_window === "1" ? 1 : 0, start_date || null, end_date || null, sort_order ?? existing[0].sort_order, is_active === "0" ? 0 : 1, id]
    );
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM b2b_banners WHERE id = ?", [id]);
    res.json({ banner: rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

router.delete("/admin/b2b-banners/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await pool.query("DELETE FROM b2b_banners WHERE id = ?", [id]);
    res.json({ message: "バナーを削除しました" });
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラー" });
  }
});

// ─── 고객센터 공지 게시판 (shop_cs_posts) ───────────────────────────────
pool.query(`CREATE TABLE IF NOT EXISTS shop_cs_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  is_notice TINYINT NOT NULL DEFAULT 0,
  is_active TINYINT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_by VARCHAR(100) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).catch(() => {});

// 공개 - 활성 글 목록 (공지 상단)
router.get("/boards/cs", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const [countRows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as total FROM shop_cs_posts WHERE is_active = 1");
    const total = Number(countRows[0].total);
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, title, content, is_notice, sort_order, created_by, created_at FROM shop_cs_posts WHERE is_active = 1 ORDER BY is_notice DESC, sort_order ASC, id DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
    res.json({ posts: rows, total, page, limit });
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

// 공개 - 글 상세
router.get("/boards/cs/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM shop_cs_posts WHERE id = ? AND is_active = 1", [id]);
    if (!rows.length) { res.status(404).json({ error: "投稿が見つかりません" }); return; }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

// 관리자 - 등록
router.post("/boards/cs", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { title, content, is_notice, is_active, sort_order } = req.body;
    if (!title || !content) { res.status(400).json({ error: "件名と内容を入力してください" }); return; }
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO shop_cs_posts (title, content, is_notice, is_active, sort_order, created_by) VALUES (?, ?, ?, ?, ?, ?)",
      [title, content, is_notice ? 1 : 0, is_active === false || is_active === 0 ? 0 : 1, Number(sort_order) || 0, user.mb_id]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

// 관리자 - 수정
router.put("/boards/cs/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, content, is_notice, is_active, sort_order } = req.body;
    if (!title || !content) { res.status(400).json({ error: "件名と内容を入力してください" }); return; }
    await pool.query(
      "UPDATE shop_cs_posts SET title=?, content=?, is_notice=?, is_active=?, sort_order=? WHERE id=?",
      [title, content, is_notice ? 1 : 0, is_active === false || is_active === 0 ? 0 : 1, Number(sort_order) || 0, id]
    );
    res.json({ message: "更新しました" });
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

// 관리자 - 삭제
router.delete("/boards/cs/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await pool.query("DELETE FROM shop_cs_posts WHERE id = ?", [id]);
    res.json({ message: "削除しました" });
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

// 관리자 - 목록 (비활성 포함)
router.get("/admin/cs", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM shop_cs_posts ORDER BY is_notice DESC, sort_order ASC, id DESC");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.use((err: any, _req: any, res: any, next: any) => {
  if (err && err.message && err.message.includes("許可されていないファイル形式")) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err && err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ error: "ファイルサイズが20MBを超えています" });
    return;
  }
  next(err);
});

export default router;
