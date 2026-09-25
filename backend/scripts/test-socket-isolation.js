// Throwaway test script — connects two Socket.IO clients as staff of two
// DIFFERENT churches and proves church A's real-time events never reach
// church B. Not part of the app; run manually, delete whenever.
//
// Usage:
//   SOCKET_URL="https://your-codespace-4000.app.github.dev" \
//   TOKEN_A="<church A staff JWT>" \
//   TOKEN_B="<church B staff JWT>" \
//   node scripts/test-socket-isolation.js
//
// Both tokens must belong to ADMIN/PASTOR/MEDIA accounts (scripture:update
// requires one of those roles) — the admin account created at church
// signup, or any staff account you invited afterward, works. Get a token
// from POST /auth/login (+ /auth/totp/verify) same as everywhere else.
//
// Needs socket.io-client installed. If it's not already a devDependency:
//   npm install --no-save socket.io-client

const { io } = require("socket.io-client");

const SOCKET_URL = process.env.SOCKET_URL;
const TOKEN_A = process.env.TOKEN_A;
const TOKEN_B = process.env.TOKEN_B;

if (!SOCKET_URL || !TOKEN_A || !TOKEN_B) {
  console.error("Missing SOCKET_URL, TOKEN_A, or TOKEN_B — see usage comment at the top of this file.");
  process.exit(1);
}

const connect = (label, token) =>
  new Promise((resolve, reject) => {
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });
    const timeout = setTimeout(() => reject(new Error(`${label}: connect timed out`)), 8000);

    socket.on("connect", () => {
      clearTimeout(timeout);
      console.log(`[${label}] connected (${socket.id})`);
      resolve(socket);
    });

    socket.on("connect_error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`${label}: connect_error — ${err.message}`));
    });
  });

async function main() {
  const [socketA, socketB] = await Promise.all([connect("A", TOKEN_A), connect("B", TOKEN_B)]);

  let bReceivedLeak = false;
  socketB.on("scripture:update", (payload) => {
    bReceivedLeak = true;
    console.log("[B] received scripture:update — THIS SHOULD NOT HAPPEN:", payload);
  });

  let aReceivedOwn = false;
  socketA.on("scripture:update", (payload) => {
    aReceivedOwn = true;
    console.log("[A] received its own scripture:update (expected):", payload);
  });

  console.log("\n[A] emitting scripture:update...\n");
  socketA.emit("scripture:update", {
    reference: "Isolation Test 1:1",
    text: "If church B sees this, the isolation fix has a bug.",
  });

  // Give the server a moment to broadcast and both clients a moment to receive.
  await new Promise((resolve) => setTimeout(resolve, 2000));

  socketA.disconnect();
  socketB.disconnect();

  console.log("\n── Result ──────────────────────────────");
  console.log(`Church A received its own broadcast: ${aReceivedOwn ? "yes (expected)" : "NO — unexpected, check the server"}`);
  console.log(`Church B received church A's broadcast: ${bReceivedLeak ? "YES — LEAK, isolation is broken" : "no (expected — isolation holds)"}`);
  console.log("─────────────────────────────────────────\n");

  process.exit(bReceivedLeak || !aReceivedOwn ? 1 : 0);
}

main().catch((err) => {
  console.error("Test script failed:", err.message);
  process.exit(1);
});
