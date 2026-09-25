import http from "http";
import app from "./app";
import { PORT } from "./config/env";
import { initSocket } from "./config/socket";
import { processDueDeletions } from "./modules/platform-admin/church.service";

const server = http.createServer(app);

// Socket.IO — all connection logging is inside initSocket
const io = initSocket(server);

// Store io instance in app for access in controllers
app.set('io', io);

server.listen(PORT, () => {
  console.log(`[server] Running on port ${PORT}`);
});

// Safety-net sweep for churches cancelled 14+ days ago — also triggerable
// manually via POST /platform-admin/maintenance/process-deletions, which
// matters here since this process doesn't stay up continuously in dev.
const DELETION_SWEEP_INTERVAL_MS = 12 * 60 * 60 * 1000;
setInterval(() => {
  processDueDeletions().catch((err) => console.error("[deletion] Sweep failed:", err));
}, DELETION_SWEEP_INTERVAL_MS);