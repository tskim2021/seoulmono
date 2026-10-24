import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
// seoulmono-admin: vite 는 개발 모드에서만 필요하다.
// 정적 import 로 두면 운영 번들이 기동 시 vite(devDependency)를 찾다가 죽는다.

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  // 지정자를 변수로 둬야 esbuild 가 정적 해석을 못 해 운영 번들에서 빠진다.
  const viteSpec = "vite";
  const viteConfigSpec = path.resolve(import.meta.dirname, "../../vite.config.ts");
  const { createServer: createViteServer } = await import(viteSpec);
  const viteConfig = (await import(viteConfigSpec)).default;
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));
  // seoulmono-admin: /admin/ 아래에서 서비스된다.
  // nginx 가 접두사를 떼든(proxy_pass 뒤 슬래시) 그대로 넘기든 양쪽 다 동작하도록
  // 접두사가 붙은 경로에도 같은 정적 파일을 물린다.
  app.use("/admin", express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
