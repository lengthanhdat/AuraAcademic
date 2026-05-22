/**
 * delete-all-folders.js
 * Xoá toàn bộ ExamBankFolder qua API admin.
 * Chạy: node delete-all-folders.js
 */
const http = require("http");
const crypto = require("crypto");

// ─── Config ────────────────────────────────────────────────────
const BASE     = "http://localhost:8088";
const SECRET   = Buffer.from(
  "aHR0cHM6Ly9hdXJhYWNhZGVtaWMudm4vc2VjcmV0LWtleS12MS1hdXJhLWFjYWRlbWljLTIwMjY=",
  "base64"
);
const ADMIN_ID = "69f83840f5514c2a57569cca";

// ─── JWT helper ────────────────────────────────────────────────
function b64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function makeToken() {
  const h = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const p = b64url(Buffer.from(JSON.stringify({
    sub: ADMIN_ID, email: "admin@aura.com", role: "admin",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  })));
  const s = b64url(crypto.createHmac("sha256", SECRET).update(`${h}.${p}`).digest());
  return `${h}.${p}.${s}`;
}

const TOKEN = makeToken();

// ─── HTTP helpers ──────────────────────────────────────────────
function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "localhost", port: 8088,
      path, method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  console.log("🔍 Lấy danh sách folders...\n");

  // Lấy tất cả folders qua teacher endpoint
  const { status, body: folders } = await request(
    "GET",
    `/api/exam-bank/teacher/${ADMIN_ID}/folders`
  );

  if (status !== 200 || !Array.isArray(folders)) {
    console.error("❌ Không lấy được folder list. Status:", status, folders);
    console.error("👉 Đảm bảo backend đang chạy tại port 8088.");
    process.exit(1);
  }

  console.log(`📁 Tìm thấy ${folders.length} folders.\n`);
  if (folders.length === 0) {
    console.log("✅ Không có folder nào để xoá.");
    return;
  }

  // Xác nhận
  console.log("⚠️  Sẽ xoá:");
  folders.slice(0, 10).forEach((f) => console.log(`   - ${f.name}`));
  if (folders.length > 10) console.log(`   ... và ${folders.length - 10} folder khác`);
  console.log("\n🗑️  Bắt đầu xoá...\n");

  let deleted = 0, failed = 0;
  for (const folder of folders) {
    const r = await request("DELETE", `/api/exam-bank/folders/${folder.id}`);
    if (r.status === 200 || r.status === 204) {
      deleted++;
      process.stdout.write(`\r✅ Đã xoá ${deleted}/${folders.length}`);
    } else {
      failed++;
      console.error(`\n❌ Lỗi xoá "${folder.name}": ${r.status}`);
    }
  }

  console.log(`\n\n🎉 Hoàn thành: ${deleted} xoá thành công, ${failed} thất bại.`);
}

main().catch((err) => {
  console.error("❌ Lỗi:", err.message);
  console.error("👉 Đảm bảo backend đang chạy tại http://localhost:8088");
});
