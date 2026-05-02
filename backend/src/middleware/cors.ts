import corsLib from "cors";
import { cfg } from "../config.js";

const origins = cfg.ALLOWED_ORIGINS.split(",").map((o) => o.trim());

export const corsMiddleware = corsLib({
  origin: (origin, cb) => {
    if (!origin || origins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: false,
});
