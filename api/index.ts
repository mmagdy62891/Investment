import "dotenv/config";
import { createApp } from "../server/src/app.js";

// Vercel serverless entrypoint: exports the Express app directly (no app.listen —
// Vercel's Node runtime invokes it per-request). The client is deployed separately
// as static output per vercel.json; this function only ever receives /api/* traffic.
export default createApp();
