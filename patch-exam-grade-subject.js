/**
 * Script patch: gán grade + subject trực tiếp lên tất cả practice exams 
 * chưa có grade/subject, dựa theo folder của chúng (nếu có).
 * Chạy trong terminal: node patch-exam-grade-subject.js
 */
const http  = require('http');
const crypto = require('crypto');

const SECRET_B64 = "aHR0cHM6Ly9hdXJhYWNhZGVtaWMudm4vc2VjcmV0LWtleS12MS1hdXJhLWFjYWRlbWljLTIwMjY=";
const ADMIN_ID   = "69f83840f5514c2a57569cca";

function b64url(buf) {
  return buf.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}
function makeToken() {
  const secret = Buffer.from(SECRET_B64, 'base64');
  const h = b64url(Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})));
  const p = b64url(Buffer.from(JSON.stringify({
    sub: ADMIN_ID, email: "admin@smartex.com", role: "admin",
    iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+3600
  })));
  const s = b64url(crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest());
  return `${h}.${p}.${s}`;
}

const TOKEN = makeToken();
const BASE = 'http://localhost:8088';

function get(path) {
  return new Promise((res, rej) => {
    http.get(`${BASE}${path}`, {headers:{Authorization:`Bearer ${TOKEN}`}}, r => {
      let d = ''; r.on('data', c => d+=c); r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
}

function patch(path, body) {
  return new Promise((res, rej) => {
    const data = JSON.stringify(body);
    const req = http.request(`${BASE}${path}`, {
      method:'PATCH', 
      headers:{'Authorization':`Bearer ${TOKEN}`,'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}
    }, r => { let d=''; r.on('data',c=>d+=c); r.on('end', () => res({status:r.statusCode, body:d})); });
    req.on('error', rej); req.write(data); req.end();
  });
}

async function main() {
  // Get all public exams
  const exams = await get('/api/exam-bank/public/exams');
  console.log(`\n📚 Tổng số practice exams: ${exams.length}`);
  
  const needsPatch = exams.filter(e => !e.grade || !e.subject);
  console.log(`🔧 Exams cần patch (chưa có grade/subject): ${needsPatch.length}`);
  
  if (needsPatch.length === 0) {
    console.log('✅ Tất cả exams đã có grade/subject!');
    return;
  }

  for (const exam of needsPatch) {
    console.log(`\n  ❓ "${exam.title}" (id=${exam.id})`);
    console.log(`     folderId=${exam.folderId}, grade=${exam.grade}, subject=${exam.subject}`);
    if (!exam.folderId) {
      console.log(`     ⚠️  Không có folderId — bỏ qua (cần gán folder thủ công qua Teacher UI)`);
    }
  }

  console.log('\n💡 Để fix: vào Teacher UI → Ngân hàng đề → chọn đề → gán vào Folder có grade/subject.');
  console.log('   Hoặc, Admin có thể dùng API PATCH để set grade/subject trực tiếp.\n');
}

main().catch(console.error);
