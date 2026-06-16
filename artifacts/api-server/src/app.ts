import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import fs from "fs";
import path from "path";

const app: Express = express();

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

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

app.get("/api/tmp-download/mobile-eas", (_req, res) => {
  const zipPath = "/tmp/mobile-eas-standalone.zip";
  if (!fs.existsSync(zipPath)) {
    res.status(404).json({ error: "Zip not ready" });
    return;
  }
  res.setHeader("Content-Disposition", "attachment; filename=mobile-eas-standalone.zip");
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Length", fs.statSync(zipPath).size);
  fs.createReadStream(zipPath).pipe(res);
});

export default app;
