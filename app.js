// ============================================================
//  วงล้อส่วนลด — app.js (Minimal Premium Edition)
//  UI/UX ใหม่ทั้งหมด · โครง backend / LIFF / cache / history / ลอจิกเกม คงเดิม
//  สถานะหน้าจอควบคุมผ่าน data-state บน #revealCard:
//  loading | idle | play | result | empty | error
// ============================================================

const GAS_URL = 'https://script.google.com/macros/s/AKfycbx580dyPfzslsut-QGtLrRHCt0Hdv9AscR3OfZF0ZTKYKfKETTKF9DAI7e6wXyhEvYlBw/exec';
const LIFF_ID = '2004478373-aQPYZEpt';

// milestone → ชื่อคูปอง — ลำดับนี้คือลำดับที่ stock queue จะเปิดก่อน-หลัง
const LB_CONFIG = [
  { milestone: 7,  name: 'Silver',   tier: 'silver' },
  { milestone: 14, name: 'Gold',     tier: 'gold'   },
  { milestone: 21, name: 'Platinum', tier: 'plat'   },
  { milestone: 28, name: 'Legend',   tier: 'legend' },
];
const TIER_COLORS = { silver:'#7F93AD', gold:'#B38A38', plat:'#8574B5', legend:'#B5505E', paid:'#3F98A8' };

const stockLabels = {
  "7": "เช็คอินครบ 7 วัน", "14": "เช็คอินครบ 14 วัน", "21": "เช็คอินครบ 21 วัน", "28": "เช็คอินครบ 28 วัน",
  "PAID": "ชำระบิลตรงเวลา"
};

const REDUCED_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

let liffReady   = false;
let liffProfile = null;
let currentRoomNo = null;
let currentTierLabel = null;

// ============================================================
//  THEME — สี tier ของผู้เช่า (โทนหม่น ใช้เป็นสีเน้นเท่านั้น)
//  pas/pas2 = พื้นหลังการ์ด (พาสเทล) · ink = ตัวอักษรบนพาสเทล · accent = แถบ/จุด/วงแหวน · tint = พื้นส่วนล่างตั๋ว
// ============================================================
const THEME = {
  "Member":   { deep:"#25453A", accent:"#4E8F78", tint:"#EAF3EF", line:"#C5DDD3", ink:"#2F6553", pas:"#CFE9DE", pas2:"#A9D6C4", a1:"#3CB88F", a2:"#1F8A66", a3:"#0C5740" },
  "Silver":   { deep:"#2D3B52", accent:"#6F86A6", tint:"#ECF0F6", line:"#CAD5E4", ink:"#3D5677", pas:"#D6E2F1", pas2:"#B4C8E2", a1:"#6B97E0", a2:"#3A66B5", a3:"#1B3B7E" },
  "Gold":     { deep:"#5A4419", accent:"#B38A38", tint:"#F6F0E2", line:"#E3D2A8", ink:"#7A5C1D", pas:"#F6E6BE", pas2:"#EBCF8E", a1:"#F7BE2E", a2:"#CC8A08", a3:"#84540A" },
  "Platinum": { deep:"#3E3563", accent:"#8574B5", tint:"#F0EDF7", line:"#D8D0EA", ink:"#56478A", pas:"#E0D9F3", pas2:"#C6BBE8", a1:"#A275EA", a2:"#7440C2", a3:"#451F8A" },
  "Diamond":  { deep:"#1F4A54", accent:"#3F98A8", tint:"#E7F3F5", line:"#BFDFE4", ink:"#1F6572", pas:"#CBE9EE", pas2:"#A3D3DC", a1:"#1DBFD8", a2:"#0E8CA3", a3:"#095A6B" },
  "Legend":   { deep:"#5C2530", accent:"#B5505E", tint:"#F8ECEE", line:"#E8C6CB", ink:"#86303C", pas:"#F5D5DA", pas2:"#EAB0BA", a1:"#EE4D68", a2:"#C21F3E", a3:"#7A0E26" },
  "Founder":  { deep:"#5C3A1E", accent:"#B8763E", tint:"#FDF6EC", line:"#D9B382", ink:"#8A4B1F", pas:"#F3DDBF", pas2:"#E4C193", a1:"#F29A41", a2:"#C46A18", a3:"#7A3B0A" },
};
function applyTier(tierLabel) {
  const t = THEME[tierLabel] || THEME["Member"];
  const s = document.documentElement.style;
  s.setProperty('--tier', t.accent);
  s.setProperty('--tier-deep', t.deep);
  s.setProperty('--tier-soft', t.tint);
  s.setProperty('--tier-line', t.line);
  s.setProperty('--tier-ink', t.ink);
  s.setProperty('--pas', t.pas);
  s.setProperty('--pas2', t.pas2);
  s.setProperty('--pin', t.ink);
  // สีตัวเลขรางวัลบนตั๋ว: ชุด 3 เฉดสดของแต่ละระดับ (สว่าง / กลาง / เข้ม)
  s.setProperty('--amt-1', t.a1);
  s.setProperty('--amt-2', t.a2);
  s.setProperty('--amt-3', t.a3);
  s.setProperty('--amt-sh', t.a3 + '44');
  s.setProperty('--tier-glow', t.accent + '38');
  s.setProperty('--tier-glow-2', t.accent + '1A');
  if (wheelCtx && wheelValues.length) drawWheel();
}

// ตัวเลขล่อ (decoy) โชว์บนวงล้อระหว่างหมุน — คือชุดค่า discount_amount ที่ไม่ซ้ำกันทั้งหมดจากชีท LOOT_BOX จริง
// (ครบทุก tier/milestone พอดี 7 ค่า = จำนวนช่องบนวงล้อพอดี) การันตีว่ารางวัลจริงที่ backend ส่งมาตอนจบ
// จะเป็นหนึ่งใน 7 ค่านี้เสมอ — ค่าสูงสุดจะเป็นช่องสีทองโดยอัตโนมัติ
// เปิดใช้ Jackpot: เพิ่ม 100 ต่อท้ายรายการ (ต้องเพิ่มแถวในชีท LOOT_BOX + รัน SQL ก่อน)
const JACKPOT_AMOUNT = 100;
const CAPSULE_NUMBERS = [5, 10, 15, 20, 25, 30, 50, 100];
const N_CAPS = 8;

// ============================================================
//  CACHE (sessionStorage) — stale-while-revalidate
//  โชว์ผลล่าสุดทันทีตอนเปิดแอปรอบถัดไป แล้วค่อยทับด้วยของจริงจาก backend
// ============================================================
const CACHE_MAX_AGE_MS = 30 * 60 * 1000; // เก่าเกิน 30 นาทีไม่ใช้

function cacheKey(mode, param) {
  return `gacha_cache_${mode}_${param}`;
}

function saveCacheSnapshot(result) {
  try {
    if (!bootMode || !bootParam) return;
    sessionStorage.setItem(
      cacheKey(bootMode, bootParam),
      JSON.stringify({ result, ts: Date.now() })
    );
  } catch (e) {
    // sessionStorage อาจเต็ม/ถูกบล็อก (private mode ฯลฯ) — ไม่ critical ข้ามไปเฉยๆ
  }
}

function clearCacheSnapshot() {
  try { if (bootMode && bootParam) sessionStorage.removeItem(cacheKey(bootMode, bootParam)); } catch (e) {}
}

function tryRenderFromCache(mode, param) {
  try {
    const raw = sessionStorage.getItem(cacheKey(mode, param));
    if (!raw) return false;
    const { result, ts } = JSON.parse(raw);
    if (!result || Date.now() - ts > CACHE_MAX_AGE_MS) return false;
    applyRoomData(result);
    renderStateUI(); // ปุ่มเริ่มยังซ่อนอยู่ จนกว่าข้อมูลจริงจะมา (busy = true)
    instruction.textContent = "กำลังอัปเดตข้อมูลล่าสุด...";
    removeBootMask();
    return true;
  } catch (e) {
    return false;
  }
}

async function callGAS(action, params = {}, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...params }),
      signal: ctrl.signal
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Backend ส่งข้อมูลไม่ใช่ JSON');
    }
  } finally {
    clearTimeout(t);
  }
}

// ============================================================
//  DOM refs
// ============================================================
const revealCard    = document.getElementById('revealCard');   // .app — ถือ data-state
const instruction   = document.getElementById('instruction');
const stockCount    = document.getElementById('stockCount');
const retryBtn      = document.getElementById('retryBtn');
const cabRoomBadge  = document.getElementById('cabRoomBadge');
const screenFlash   = document.getElementById('screenFlash');
const confettiLayer = document.getElementById('confettiLayer');
const toastEl       = document.getElementById('toast');

const board       = document.getElementById('board');
const titleText   = document.getElementById('titleText');
const hint        = document.getElementById('hint');
const ticket      = document.getElementById('ticket');
const ticketAmt   = document.getElementById('ticketAmount');
const ticketTier  = document.getElementById('ticketTier');
const ticketDesc  = document.getElementById('ticketDesc');
const claimBtn    = document.getElementById('claimBtn');
const startBtn    = document.getElementById('startBtn');
const bgm         = document.getElementById('bgm');
const btnMusic    = document.getElementById('btn-music');
const wheelCanvas  = document.getElementById('wheelCanvas');
const wheelCtx     = wheelCanvas.getContext('2d');

// stock = milestone keys (string) ที่มีคูปองเปิดได้จริงตอนนี้ เรียงตามลำดับที่จะเปิด
// lootTokens = { "7": token, "PAID": token, ... } token จริงจาก backend สำหรับแต่ละ milestone
let stock = [];
let lootTokens = {};
let busy = true;        // true จนกว่าจะโหลดข้อมูลจริงเสร็จ / กำลังเล่นรอบอยู่
let loadFailed = false; // โหลดข้อมูลล่าสุดล้มเหลว (ใช้คงสถานะ error ไว้ ไม่ให้ถูกทับด้วยข้อมูลเก่า)
let manualRetryCount = 0; // จำนวนครั้งที่ผู้ใช้กด "ลองอีกที" แล้วยังพลาดซ้ำ — ใช้แนะนำให้เปิดลิงก์ใหม่หลังลองหลายครั้งไม่สำเร็จ

// ============================================================
//  UI helpers
// ============================================================
function setState(s) { revealCard.dataset.state = s; }

// เดิมใช้ไฮไลต์แถบขั้นตอน (หมุน/เฉลย) — เอาแถบออกแล้วเพราะเห็นผลตอนวงล้อหยุดอยู่แล้ว
// เก็บฟังก์ชันไว้เป็นจุดเรียกเปล่าๆ กันโค้ดจุดอื่นที่ยังเรียก setPhase(...) พัง
function setPhase(_n) {}

function setTitle(text) {
  if (titleText.textContent === text) return;
  titleText.textContent = text;
  titleText.classList.remove('swap');
  void titleText.offsetWidth;
  titleText.classList.add('swap');
}
function setHint(text) { hint.textContent = text; }

let toastTimer = null;
function showToast(msg, type = 'success', duration = 3000) {
  toastEl.textContent = msg;
  toastEl.className = 'toast ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.className = 'toast'; }, duration);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function showError(msg, retryable = false) {
  loadFailed = true;
  setState('error');
  setPhase(0);
  setTitle('ไม่สามารถเชื่อมต่อได้');
  // ลองใหม่ด้วยตัวเองไม่ได้ผลติดต่อกันหลายครั้ง — session อาจหมดอายุ แนะนำให้เปิดลิงก์ใหม่แทน
  const hintText = manualRetryCount >= 2
    ? `${msg} ลองหลายครั้งแล้วยังไม่สำเร็จ กรุณาปิดหน้านี้แล้วเปิดลิงก์ใหม่อีกครั้ง`
    : msg;
  setHint(hintText);
  instruction.textContent = '';
  stockCount.textContent = '–';
  startBtn.classList.add('hide');
  showEmptySlots();
  retryBtn.style.display = retryable ? 'block' : 'none';
}

// ============================================================
//  LIFF
// ============================================================
async function initLiff() {
  if (liffReady && liffProfile) return;   // เรียกซ้ำตอนกดลองใหม่ ไม่ต้อง init ซ้ำ
  try {
    await liff.init({ liffId: LIFF_ID, withLoginOnExternalBrowser: true });
    liffReady = true;
    if (!liff.isLoggedIn()) { liff.login({ redirectUri: location.href }); return; }
    liffProfile = await liff.getProfile();
  } catch (e) {
    console.warn('LIFF init failed:', e);
    liffReady = false;
  }
}

// ============================================================
//  ชื่อคูปอง / ข้อความประกอบ
// ============================================================
function boxNameFor(milestone) {
  if (String(milestone) === 'PAID') return 'Bonus';
  const cfg = LB_CONFIG.find(c => c.milestone === Number(milestone));
  return cfg ? cfg.name : 'Special';
}
function couponSummary(milestone) {
  const reason = stockLabels[String(milestone)];
  const via = /^(เช็คอิน|ชำระ)/.test(reason || '') ? 'จากการ' : 'จาก';
  return reason ? `สิทธิ์ ${boxNameFor(milestone)} ${via}${reason}` : `สิทธิ์ ${boxNameFor(milestone)}`;
}

function updateStockCount() {
  stockCount.textContent = stock.length;
}

// วาดหน้า idle / empty ตาม stock (ไม่แตะปุ่ม)
function renderStateUI() {
  setPhase(0);
  if (stock.length > 0) {
    setState('idle');
    setTitle('พร้อมลุ้นรางวัลแล้ว');
    setHint(couponSummary(stock[0]));
    buildIdlePreview();
  } else {
    setState('empty');
    setTitle('ขณะนี้ไม่มีสิทธิ์ลุ้นรางวัล');
    setHint('สิทธิ์ใหม่จะปรากฏเมื่อเช็คอินครบตามเกณฑ์ หรือชำระบิลตรงเวลา');
    showEmptySlots();
  }
}

function updateStartState() {
  renderStateUI();
  instruction.textContent = '';
  startBtn.classList.toggle('hide', stock.length === 0);
}

// ============================================================
//  กันไม่ให้ค้างตลอดไปถ้า backend ไม่ตอบเลย
// ============================================================
function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(fallback), ms))
  ]);
}
const wait = ms => new Promise(r => setTimeout(r, ms));

// ============================================================
//  REVEAL FX
// ============================================================
function spawnConfetti(count) {
  if (REDUCED_MOTION) return;
  const colors = PAL.drops || ['#E8B94A', '#F6D77C', '#C8202E', 'var(--tier)'];
  const shape = PAL.shape;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    const w = 3 + Math.random() * 3;
    const h = w * (2 + Math.random() * 1.5);
    if (shape) { const sz = w * (shape === 'snow' ? 1.8 : shape === 'drop' ? 2.2 : 3.2); p.style.width = sz + 'px'; p.style.height = (shape === 'drop' ? sz * 1.35 : sz) + 'px'; p.classList.add('shape-' + shape); }
    else { p.style.width = w + 'px'; p.style.height = h + 'px'; }
    p.style.left = (Math.random() * 100) + 'vw';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = (2.6 + Math.random() * 1.6) + 's';
    p.style.animationDelay = (Math.random() * 0.6) + 's';
    confettiLayer.appendChild(p);
    setTimeout(() => p.remove(), 5000);
  }
}

// ---------- Jackpot Celebration ----------
// ฝนเหรียญ/ดาวทอง 3 ระลอก (ไม่ใช้แฟลชเต็มจอ) — ใช้เฉพาะตอนได้ Jackpot
function spawnGoldShower() {
  if (REDUCED_MOTION) return;
  const wave = (n) => {
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      const star = Math.random() < 0.35;
      p.className = 'confetti-piece gold' + (star ? ' star' : '');
      const s = 7 + Math.random() * 7;
      p.style.width = s + 'px'; p.style.height = s + 'px';
      p.style.left = (Math.random() * 100) + 'vw';
      p.style.animationDuration = (2.4 + Math.random() * 1.8) + 's';
      p.style.animationDelay = (Math.random() * 0.5) + 's';
      confettiLayer.appendChild(p);
      setTimeout(() => p.remove(), 5200);
    }
  };
  wave(34); setTimeout(() => wave(26), 700); setTimeout(() => wave(20), 1500);
}

// ตัวเลขนับขึ้นจาก 0 ตอนเฉลย
function countUp(el, to, dur = 900) {
  if (REDUCED_MOTION || to <= 0) { el.textContent = to; return; }
  const t0 = performance.now();
  const ease = p => 1 - Math.pow(1 - p, 3);
  (function tick(now) {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = Math.round(to * ease(p));
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
  setTimeout(() => { el.textContent = to; }, dur + 150); // กันกรณีแท็บถูกพัก rAF
}

// ============================================================
//  SUSPENSE REVEAL — วงล้อเปิดคูปอง
//  1 รอบ = 1 กล่อง (stock[0]) — ยิง openLootBox จริง "ตอนผู้เล่นกดหมุน" (ไม่ใช่ตอนกดเริ่ม)
//  ถ้าผู้เล่นยังไม่กดหมุน/ปิดหน้าไปก่อน คูปองจะยังไม่ถูกใช้ กลับมาเล่นใหม่ได้
//  ตัวเลขบนวงล้อระหว่างหมุนเป็นแค่ตัวล่อ (CAPSULE_NUMBERS) รางวัลจริงเฉลยจาก backend ตอนวงล้อหยุดเท่านั้น
// ============================================================
let wheelValues = [];       // ตัวเลขล่อ 7 ค่าที่สับตำแหน่งไว้บนวงล้อรอบนี้
let wheelRotation = 0;      // มุมหมุนปัจจุบัน (เรเดียน)
let wheelSize = 0;          // ขนาดจริง (css px) ของ canvas — คำนวณใหม่จาก .board ผ่าน layoutWheel()
let wheelLoopHandle = null; // requestAnimationFrame handle ของช่วงหมุนวนไม่ทราบผล
let wheelVelocity = 0;      // ความเร็วปัจจุบัน (เรเดียน/ms) — เก็บไว้ต่อเนื่องจังหวะตอนเข้าสู่ช่วงชะลอ
const WHEEL_V0 = 0.011;     // ความเร็วสูงสุดตอนหมุนวน (เรเดียน/ms)
const MIN_SPIN_MS  = 2500;  // หมุนเร็วคงที่อย่างน้อยกี่ ms ก่อนเริ่มชะลอ
const DECEL_MIN_MS = 5000;  // ช่วงชะลอจนหยุดอย่างน้อยกี่ ms — ปรับตัวเลขนี้ได้ (แนะนำ 5000–6000)
// สีบนวงล้อ — ช่องที่มีค่ามากที่สุดเป็นสีทองเสมอ ที่เหลือสลับแดง/ครีมเริ่มจากช่องถัดจากทองตามเข็มนาฬิกา
// (7 ช่อง = ทอง 1 + แดง/ครีมอย่างละ 3 จึงไม่มีสีซ้ำชิดกัน) ไม่ผูกกับ tier ของผู้เช่า
// ตัวเลขสับตำแหน่งใหม่ทุกรอบ ทองจึงย้ายตามเลขสูงสุดไปด้วย
// ============================================================
//  ธีมเทศกาล — เลือกอัตโนมัติจากเดือน (FEST_PERIODS) เดือนที่ไม่อยู่ในตาราง = วงล้อปกติแดงทองเดิม
//  เพิ่มธีมใหม่ = เพิ่มชุดสีใน PALS + แถวใน FEST_PERIODS + ข้อความใน FEST_TEXT + สไตล์ใน style.css (html[data-fest="ชื่อ"])
//  ลองดูธีมนอกช่วงเดือนได้โดยต่อท้ายลิงก์ ?fest=songkran (ผู้ใช้ทั่วไปไม่เห็น)
// ============================================================
const PALS = {
  normal: { red:{bg:'#C8202E',ink:'#FFF4D6'}, cream:{bg:'#FFF1DC',ink:'#8E1019'}, gold:{bg:'#E8B94A',ink:'#4A0E14'},
            rim:['#FFE9A8','#E8B94A','#B97F1C','#F6D77C'], groove:'#5A0E16', stroke:'rgba(255,233,168,.9)', bulbOn:'#FFFBE6', bulbGlow:'rgba(255,226,140,.95)', bulbOff:'#C98E22', deco:'bulb', drops:null, shape:null },
  valentine: { red:{bg:'#D8315B',ink:'#FFFFFF'}, cream:{bg:'#FFEAF0',ink:'#B01E4A'}, gold:{bg:'#F6C26B',ink:'#6A1530'},
            rim:['#FFE0EA','#F28FB0','#C2466F','#FFC2D6'], groove:'#7A1237', stroke:'rgba(255,255,255,.95)', bulbOn:'#FFFFFF', bulbGlow:'rgba(255,140,185,.95)', bulbOff:'#E07AA0', deco:'heart', drops:['#FF5C8A','#FFB3C7','#FFFFFF','#E0315B'], shape:'heart' },
  songkran: { red:{bg:'#1597C2',ink:'#FFFFFF'}, cream:{bg:'#E8F9FD',ink:'#0A6A8E'}, gold:{bg:'#FFC94D',ink:'#6A3B00'},
            rim:['#BFEFFF','#52C6E8','#1A8DB5','#A7E6F7'], groove:'#0B5878', stroke:'rgba(255,255,255,.95)', bulbOn:'#FFB000', bulbGlow:'rgba(255,190,40,.9)', bulbOff:'#F08A00', deco:'flower', drops:['#58C8EE','#BFEFFF','#FFFFFF','#FFB000'], shape:'drop' },
  loykrathong: { red:{bg:'#1E3F8F',ink:'#FFE9A8'}, cream:{bg:'#FFF0D2',ink:'#1B2F6E'}, gold:{bg:'#FFB62E',ink:'#3A1A00'},
            rim:['#FFE9A8','#E8B94A','#9C6B12','#FFE08A'], groove:'#0A1740', stroke:'rgba(255,233,168,.9)', bulbOn:'#FFD36A', bulbGlow:'rgba(255,165,40,.95)', bulbOff:'#9C6B12', deco:'flame', drops:['#FFB62E','#FFD36A','#FFF3C4','#FF8A1F'], shape:'spark' },
  christmas: { red:{bg:'#C21F2E',ink:'#FFFFFF'}, cream:{bg:'#FFFFFF',ink:'#1E6B3C'}, gold:{bg:'#F2C14E',ink:'#4A0E14'},
            rim:['#8EDDA9','#2E9A5A','#14653A','#6CC48E'], groove:'#0B3A22', stroke:'rgba(255,255,255,.95)', bulbOn:'#FFFFFF', bulbGlow:'rgba(255,255,255,.9)', bulbOff:'#7FA890', deco:'light', drops:['#FFFFFF','#E4F2FF','#FFFFFF','#C9E6FF'], shape:'snow' }
};
const FEST_PERIODS = window.FEST_PERIODS || [];   // ตารางเดือนอยู่ใน <head> ของ index.html
let PAL = PALS.normal;
function currentFest() {
  const q = new URLSearchParams(location.search).get('fest');
  if (q && PALS[q]) return q;
  const md = new Date(Date.now() + 7 * 3600e3).toISOString().slice(5, 10);
  const hit = FEST_PERIODS.find(f => md >= f.from && md <= f.to);
  return hit ? hit.name : null;
}
function setFest(name) {
  PAL = PALS[name] || PALS.normal;
  if (name && PALS[name]) document.documentElement.dataset.fest = name;
  const hg = document.getElementById('histGarland');   // พวงตกแต่งหัวหน้าประวัติ = สำเนาพวงด้านบนของธีมนั้น
  if (hg) { hg.innerHTML = ''; const src = name && document.querySelector('.fest-top svg[data-for="' + name + '"]'); if (src) hg.appendChild(src.cloneNode(true)); }
  else delete document.documentElement.dataset.fest;
  if (typeof wheelValues !== 'undefined' && wheelValues.length) drawWheel();
}
const SLICE_RED   = { bg: '#C8202E', ink: '#FFF4D6' };
const SLICE_CREAM = { bg: '#FFF1DC', ink: '#8E1019' };
const SLICE_GOLD  = { bg: '#E8B94A', ink: '#4A0E14' };
function sliceStyle(i, n, goldIdx) {
  if (i === goldIdx) return PAL.gold;
  const k = (i - goldIdx - 1 + n) % n;   // ลำดับตั้งแต่ช่องหลังทองเป็นต้นไป
  return k % 2 === 0 ? PAL.red : PAL.cream;
}
const RIM_BULBS = 20; // จำนวนหลอดไฟบนกรอบทอง

// ============================================================
//  เพลงพื้นหลัง — สุ่ม 1 เพลงจาก BGM_LIST ตอนโหลดหน้า (ไฟล์อยู่ assets/ ต้องนำไปวางเอง)
//  เริ่มเล่นตอนกด "ลุ้นรางวัล" เท่านั้น (ต้องมี user gesture เบราว์เซอร์/LIFF ถึงจะยอมให้เล่น)
//  หยุดทันทีตอนออกจากหน้า/ปิด LIFF ผ่าน pagehide — ปุ่มลำโพงคุมแค่ mute ไม่ทำให้เพลงหยุดเล่นจริง
//  (เอาเสียงสังเคราะห์ Web Audio ชุดเดิม — ensureAudio/playTick/playWin — ออกแล้ว เพราะเล่นทับกับเพลงนี้)
// ============================================================
const BGM_LIST = ['assets/bgm1.mp3', 'assets/bgm2.mp3', 'assets/bgm3.mp3', 'assets/bgm4.mp3', 'assets/bgm5.mp3'];
bgm.src = BGM_LIST[Math.floor(Math.random() * BGM_LIST.length)]; // ตั้ง src ไว้ล่วงหน้า กดเริ่มแล้วเล่นได้ทันที
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
let musicOn = lsGet('bgmOn') !== '0'; // ค่าเริ่มต้น = เปิดเสียง
bgm.volume = 0.65;
bgm.muted = !musicOn;

function setMusicBtnUI() {
  btnMusic.setAttribute('aria-pressed', String(musicOn));
}
setMusicBtnUI();

btnMusic.addEventListener('click', () => {
  musicOn = !musicOn;
  bgm.muted = !musicOn;
  lsSet('bgmOn', musicOn ? '1' : '0');
  setMusicBtnUI();
});

window.addEventListener('pagehide', () => { bgm.pause(); });

// เริ่มโหลดไฟล์เพลงหลังข้อมูลหลักมาแล้วเท่านั้น (ไม่แย่งเน็ตกับการโหลดข้อมูล)
let bgmWarmed = false;
function warmBgm() {
  if (bgmWarmed) return;
  bgmWarmed = true;
  try { bgm.preload = 'auto'; bgm.load(); } catch (e) {}
}


function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ขนาด canvas ผูกกับความกว้างจริงของบอร์ด (รองรับ retina ผ่าน devicePixelRatio) — เรียกตอน build และตอน resize
// ปรับขนาดกรอบวงล้อให้เต็มพื้นที่ว่างจริงของ .stage (ทั้งกว้างและสูง) — ไม่ต้องเลื่อนจอ ใหญ่สุดเท่าที่จอให้
function fitBoard() {
  const stage = board.parentElement;
  if (!stage) return;
  const cs = getComputedStyle(stage);
  const h = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const w = stage.clientWidth;
  const size = Math.floor(Math.min(w, h, 420));
  if (size >= 200) board.style.width = size + 'px';
}

function layoutWheel() {
  fitBoard();
  const size = board.clientWidth * 0.92; // ตรงกับ width 92% ใน .wheel-canvas
  if (!size) return;
  wheelSize = size;
  const dpr = window.devicePixelRatio || 1;
  wheelCanvas.width = size * dpr;
  wheelCanvas.height = size * dpr;
  wheelCanvas.style.width = size + 'px';
  wheelCanvas.style.height = size + 'px';
  wheelCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', () => { layoutWheel(); drawWheel(); });
// พื้นที่ว่างเปลี่ยน (แถบ LINE ซ่อน/แสดง, หมุนจอ, ฟอนต์โหลดเสร็จ) — คำนวณขนาดและวาดใหม่ให้ตรงเสมอ
if (window.ResizeObserver) new ResizeObserver(() => { layoutWheel(); drawWheel(); }).observe(board.parentElement);

function currentSliceIndex() {
  const n = wheelValues.length;
  if (!n) return 0;
  const slice = (Math.PI * 2) / n;
  const pointerAngle = -Math.PI / 2;
  const normalized = ((pointerAngle - wheelRotation) % (Math.PI * 2) + Math.PI * 4) % (Math.PI * 2);
  return Math.floor(normalized / slice);
}

function drawWheel(highlightIdx) {
  if (!wheelCtx || !wheelSize) return;
  const ctx = wheelCtx;
  const center = wheelSize / 2;
  const R = wheelSize / 2 - 3;      // รัศมีนอกสุด (ขอบกรอบทอง)
  const rimW = R * 0.11;            // ความหนากรอบทอง
  const r = R - rimW;               // รัศมีของช่องรางวัล
  const n = wheelValues.length;
  if (!n) return;
  const slice = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, wheelSize, wheelSize);

  // กรอบทอง (ไม่หมุนตามช่อง) + ร่องแดงเข้มด้านใน
  const rim = ctx.createLinearGradient(0, 0, wheelSize, wheelSize);
  rim.addColorStop(0, PAL.rim[0]);
  rim.addColorStop(0.35, PAL.rim[1]);
  rim.addColorStop(0.65, PAL.rim[2]);
  rim.addColorStop(1, PAL.rim[3]);
  ctx.beginPath();
  ctx.arc(center, center, R, 0, Math.PI * 2);
  ctx.fillStyle = rim;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(center, center, r + 1.5, 0, Math.PI * 2);
  ctx.fillStyle = PAL.groove;
  ctx.fill();

  // ช่องรางวัล (ช่องที่มีเลขสูงสุดเป็นสีทอง)
  const goldIdx = wheelValues.indexOf(Math.max(...wheelValues));
  for (let i = 0; i < n; i++) {
    const start = wheelRotation + i * slice;
    const end = start + slice;
    const c = sliceStyle(i, n, goldIdx);
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, r, start, end);
    ctx.closePath();
    ctx.fillStyle = c.bg;
    ctx.fill();

    if (i === highlightIdx) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#FFE9A8';
      ctx.fill();
      ctx.restore();
    }

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = PAL.stroke;
    ctx.stroke();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = c.ink;
    const fontSize = Math.max(14, Math.min(26, wheelSize * 0.06));
    ctx.font = '600 ' + fontSize + 'px "Anuphan","Sarabun",sans-serif';
    ctx.fillText(wheelValues[i] + '฿', r - 14, fontSize * 0.32);
    ctx.restore();
  }

  // หลอดไฟบนกรอบ — สลับติด/ดับทุก ~0.4 วินาที (ปิดเมื่อผู้ใช้ตั้งค่าลดแอนิเมชัน)
  const phase = REDUCED_MOTION ? 0 : Math.floor(performance.now() / 420) % 2;
  const rb = R - rimW / 2;
  for (let i = 0; i < RIM_BULBS; i++) {
    const ang = (i / RIM_BULBS) * Math.PI * 2 - Math.PI / 2;
    const on = (i + phase) % 2 === 0;
    const bx = center + Math.cos(ang) * rb, by = center + Math.sin(ang) * rb, R = rimW * 0.27;
    ctx.save();
    let fill = on ? PAL.bulbOn : PAL.bulbOff;
    if (PAL.deco === 'light') fill = (on ? ['#FF4A4A', '#FFD84A', '#FFFFFF', '#5CE08A'] : ['#A33B3B', '#A88A22', '#9DB5A5', '#2E8A52'])[i % 4];   // ไฟคริสต์มาสสลับสี
    if (on) { ctx.shadowColor = (PAL.deco === 'light') ? fill : PAL.bulbGlow; ctx.shadowBlur = 8; }
    ctx.fillStyle = fill;
    ctx.beginPath();
    if (PAL.deco === 'heart') {                         // หัวใจ
      const s = R * 1.55;
      ctx.moveTo(bx, by + s * 0.5);
      ctx.bezierCurveTo(bx - s * 1.1, by - s * 0.1, bx - s * 0.5, by - s * 0.85, bx, by - s * 0.32);
      ctx.bezierCurveTo(bx + s * 0.5, by - s * 0.85, bx + s * 1.1, by - s * 0.1, bx, by + s * 0.5);
    } else if (PAL.deco === 'flame') {                  // เปลวเทียนกระทง
      const s = R * 1.7;
      ctx.moveTo(bx, by - s * 0.95);
      ctx.bezierCurveTo(bx + s * 0.85, by - s * 0.2, bx + s * 0.7, by + s * 0.6, bx, by + s * 0.6);
      ctx.bezierCurveTo(bx - s * 0.7, by + s * 0.6, bx - s * 0.85, by - s * 0.2, bx, by - s * 0.95);
    } else {
      ctx.arc(bx, by, R, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
    if (PAL.deco === 'flower') {                       // ดอกดาวเรือง (พวงมาลัยรอบวงล้อ): กลีบรอบวง + เกสรกลาง
      for (let q = 0; q < 6; q++) { const a = q * Math.PI / 3; ctx.beginPath(); ctx.arc(bx + Math.cos(a) * rimW * 0.2, by + Math.sin(a) * rimW * 0.2, rimW * 0.15, 0, Math.PI * 2); ctx.fillStyle = on ? '#FFC21A' : '#F28C00'; ctx.fill(); }
      ctx.beginPath(); ctx.arc(bx, by, rimW * 0.12, 0, Math.PI * 2); ctx.fillStyle = '#C45A00'; ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
}

// ให้หลอดไฟกระพริบตอนวงล้ออยู่นิ่ง (ตอนหมุน/ชะลอ มีการวาดทุกเฟรมอยู่แล้ว)
if (!REDUCED_MOTION) {
  setInterval(() => {
    const s = revealCard.dataset.state;
    if (document.hidden || (s !== 'idle' && s !== 'empty' && s !== 'loading')) return;
    drawWheel();
  }, 420);
}

// สับตัวเลขล่อใหม่ 1 ชุดสำหรับรอบนี้ — ใช้ทั้งพรีวิวตอน idle และตอนเริ่มเล่นจริง
function buildWheelValues() {
  wheelValues = shuffleArray([...CAPSULE_NUMBERS]);
  wheelRotation = 0;
  layoutWheel();
  drawWheel();
}

function buildIdlePreview() {
  if (!wheelValues.length) { buildWheelValues(); return; }
  layoutWheel();
  drawWheel();
}
function showEmptySlots() {
  layoutWheel();
  drawWheel();
}

// หมุนวนต่อเนื่องระหว่างที่ยังไม่รู้ผลจริงจาก backend (ไม่ทราบเป้าหมาย จึงเร่งขึ้นไปที่ความเร็วสูงสุดแล้วคงที่)
function startContinuousSpin() {
  let last = null;
  wheelVelocity = 0;
  let lastTickIdx = null;
  const accel = 0.00004; // เร่งความเร็วช่วงแรก (ถึง WHEEL_V0 ภายใน ~275ms)
  function loop(ts) {
    if (last == null) last = ts;
    const dt = ts - last; last = ts;
    wheelVelocity = Math.min(WHEEL_V0, wheelVelocity + accel * dt);
    wheelRotation += wheelVelocity * dt;
    const idx = currentSliceIndex();
    if (idx !== lastTickIdx) { lastTickIdx = idx; }
    drawWheel();
    wheelLoopHandle = requestAnimationFrame(loop);
  }
  wheelLoopHandle = requestAnimationFrame(loop);
}
function stopContinuousSpin() {
  if (wheelLoopHandle) cancelAnimationFrame(wheelLoopHandle);
  wheelLoopHandle = null;
}

// หมุนวนรอผลจริงจาก backend อย่างน้อย MIN_SPIN_MS (กันดูเหมือนหยุดกึกทันทีถ้า backend ตอบไวเกินไป
// และให้เวลาเร่งขึ้นความเร็วสูงสุดก่อน จะได้ชะลอต่อเนื่องแบบไม่สะดุดในขั้นตอนถัดไป)
async function spinWhileWaiting(apiPromise) {
  startContinuousSpin();
  const [result] = await Promise.all([apiPromise, wait(MIN_SPIN_MS)]);
  return result;
}

// เมื่อรู้ผลจริงแล้ว — ชะลอจากความเร็วปัจจุบันไปหยุดที่ช่องตรงกับรางวัลจริง
// ใช้ cubic ease-out: ความเร็วเริ่มต้น = v0 พอดี (ต่อเนื่องจากช่วงหมุนวน) แล้วค่อยๆ ช้าลงจนหยุด
// ระยะทาง delta ถูกบังคับให้ไม่น้อยกว่า v0 x DECEL_MIN_MS / 3 จึงชะลออย่างน้อย DECEL_MIN_MS ทุกรอบ (T = 3 x delta / v0)
async function landOnAmount(amount) {
  const v0 = wheelVelocity || WHEEL_V0;
  stopContinuousSpin();

  let targetIndex = wheelValues.indexOf(amount);
  if (targetIndex === -1) {
    // เผื่อ backend ส่งค่านอกชุดตัวเลขล่อ (ไม่ควรเกิดตามปกติ) — สุ่มช่องแล้วสลับให้โชว์ค่าจริงตอนจะหยุด
    targetIndex = Math.floor(Math.random() * wheelValues.length);
    wheelValues[targetIndex] = amount;
  }

  const TAU = Math.PI * 2;
  const n = wheelValues.length;
  const slice = TAU / n;
  const pointerAngle = -Math.PI / 2;
  const targetCenter = targetIndex * slice + slice / 2;
  const jitter = (Math.random() - 0.5) * slice * 0.6;      // หยุดในช่องแต่ไม่ตรงกลางเป๊ะทุกครั้ง (ไม่เข้าใกล้ขอบช่อง)
  const finalMod = (((pointerAngle - targetCenter + jitter) % TAU) + TAU) % TAU;

  const startRotation = wheelRotation;
  const minDelta = (v0 * DECEL_MIN_MS) / 3;
  let delta = (((finalMod - startRotation) % TAU) + TAU) % TAU;
  while (delta < minDelta) delta += TAU;
  const decelDuration = (3 * delta) / v0;

  await new Promise(resolve => {
    let startTime = null;
    function frame(ts) {
      if (!startTime) startTime = ts;
      const t = Math.min(1, (ts - startTime) / decelDuration);
      wheelRotation = startRotation + delta * (1 - Math.pow(1 - t, 3));
      drawWheel();                                          // ไม่ไฮไลต์ช่องระหว่างชะลอ — ผู้เล่นจะได้ไม่รู้ผลก่อนวงล้อหยุด
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });

  // เหวี่ยงส่ายเล็กน้อยก่อนหยุดสนิท เหมือนวงล้อจริงที่มีแรงเฉื่อย — ใช้เท่ากันทุกช่อง ไม่เกี่ยวกับมูลค่ารางวัล
  await new Promise(resolve => {
    const base = wheelRotation;
    let t0 = null;
    const dur = 700;
    function frame(ts) {
      if (!t0) t0 = ts;
      const t = Math.min(1, (ts - t0) / dur);
      const decay = Math.pow(1 - t, 2);
      wheelRotation = base + Math.sin(t * Math.PI * 3) * 0.045 * decay;
      drawWheel();                                          // ช่วงส่ายก่อนหยุดก็ยังไม่ไฮไลต์
      if (t < 1) requestAnimationFrame(frame);
      else { wheelRotation = base; drawWheel(); resolve(); }   // หยุดสนิท ไม่ไฮไลต์ช่อง
    }
    requestAnimationFrame(frame);
  });
}

// ตั๋วเฉลยรางวัล — เรียกตอนวงล้อหยุดแล้ว (celebrate=true) หรือตอนกู้คืนผลเก่าแบบเงียบๆ (celebrate=false)
function presentTicket(milestone, amount, celebrate = true) {
  const isJackpot = Number(amount) >= JACKPOT_AMOUNT;
  ticketTier.textContent = isJackpot ? 'Jackpot' : `${boxNameFor(milestone)} Coupon`;
  ticket.classList.toggle('jackpot', isJackpot);
  revealCard.dataset.jp = isJackpot ? '1' : '0';   // เปิดแสงรัศมีทองหลังตั๋วผ่าน CSS
  ticketDesc.textContent = 'หักจากบิลรอบถัดไปโดยอัตโนมัติ';
  ticket.setAttribute('aria-label', `${boxNameFor(milestone)} Coupon ส่วนลดค่าเช่า ${amount} บาท`);
  ticket.classList.add('show');
  claimBtn.classList.add('show');
  if (celebrate) {
    countUp(ticketAmt, amount);
    if (isJackpot) spawnGoldShower();
    else spawnConfetti(16);
  } else {
    ticketAmt.textContent = amount;
  }
}

// เล่น 1 รอบเต็ม: สับเลขล่อ → ยิง backend จริงทันที (กดเริ่มครั้งเดียวจบ) → หมุนวนรอผล → ชะลอไปหยุดที่ผลจริง → เฉลย
async function playRound(milestone, requestOpen) {
  setState('play');
  revealCard.dataset.jp = '0';
  buildWheelValues();
  ticket.classList.remove('show');
  claimBtn.classList.remove('show');

  setPhase(1);
  setTitle('กำลังลุ้นรางวัล');
  setHint('กรุณารอสักครู่');

  // ยิงคำขอเปิดคูปองจริงทันทีที่เริ่มรอบ (ผู้เล่นกดเริ่มไปแล้วครั้งเดียว ถือว่าคอมมิทแล้ว)
  const apiPromise = requestOpen();

  const result = await spinWhileWaiting(apiPromise);

  if (!result || !result.success) {
    stopContinuousSpin();
    return { success: false, result };
  }

  const amount = Number(result.discount_amount) || 0;
  setPhase(2);
  await landOnAmount(amount);

  await wait(500); // ให้วงล้อนิ่งสนิทและเห็นช่องที่หยุดสักครู่ แล้วขึ้นตั๋วเลย (ตัดแฟลชหน้าจอออกแล้ว)

  setState('result');
  const jackpot = amount >= JACKPOT_AMOUNT;
  setTitle(jackpot ? 'JACKPOT! ยินดีด้วย' : 'ขอแสดงความยินดี');
  setHint(jackpot ? 'รางวัลพิเศษประจำเดือนนี้ เป็นของคุณ' : 'คุณได้รับส่วนลดค่าเช่า');
  presentTicket(milestone, amount);

  return { success: true, result };
}

// แสดงผลแบบเร็ว (ไม่เล่นเกมใหม่) — ใช้ตอนกู้คืนผลที่เปิดสำเร็จไปแล้วจริง (เช่นหลัง error/retry)
function showQuickTicket(milestone, amount) {
  stopContinuousSpin();
  setState('result');
  setPhase(2);
  setTitle('สิทธิ์นี้ถูกใช้แล้ว');
  setHint('นี่คือส่วนลดที่คุณได้รับ');
  presentTicket(milestone, amount, false);
}

async function startRound() {
  if (busy) return; // กันกดซ้ำระหว่างรอบกำลังเล่นอยู่
  if (stock.length === 0) { instruction.textContent = "ขณะนี้ไม่มีสิทธิ์ให้ใช้"; return; }
  busy = true;
  startBtn.classList.add('hide');
  retryBtn.style.display = 'none';
  instruction.textContent = "";

  const milestone = stock[0];
  const token = lootTokens[milestone];

  const HARD_TIMEOUT_MS = 30000;   // เวลารอ backend หลังผู้เล่นกดเริ่ม (มิลลิวินาที) — ปรับตัวเลขนี้ได้

  // ส่งคำขอเปิดจริง "ตอนผู้เล่นกดเริ่ม" (playRound เป็นคนเรียก)
  // request ไม่ถูกยกเลิกแม้ backend จะตอบช้า (auto-resync ผ่าน HARD_TIMEOUT_MS ถ้าช้าเกินไปจริงๆ)
  const requestOpen = () => {
    const realPromise = callGAS('openLootBox', { token }, 45000).catch((err) => {
      console.error('openLootBox failed:', err);
      return { success: false, message: 'เชื่อมต่อกับระบบไม่สำเร็จ' };
    });
    return withTimeout(
      realPromise,
      HARD_TIMEOUT_MS,
      { success: false, message: 'ระบบตอบสนองช้า กำลังตรวจสอบผลให้อัตโนมัติ', hardFail: true }
    );
  };

  const outcome = await playRound(milestone, requestOpen);

  if (outcome.success) {
    stock.shift();
    delete lootTokens[milestone];
    updateStockCount();
    clearCacheSnapshot();   // กันหน้าเปิดรอบหน้าโชว์สิทธิ์เก่าที่เพิ่งใช้ไป
    busy = false;
    return;
  }

  // ── เปิดไม่สำเร็จ: sync ข้อมูลใหม่ แล้วเช็คว่าจริงๆ เปิดสำเร็จไปแล้วหรือเปล่า ──
  const result = outcome.result;
  if (result && result.hardFail) {
    showToast('ระบบตอบสนองช้า กำลังตรวจสอบผลให้อัตโนมัติ', 'error', 4000);
  } else {
    showToast(result?.message || 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง', 'error', 4000);
  }
  setPhase(0);
  setTitle('กำลังตรวจสอบข้อมูล');
  setHint('');
  instruction.textContent = "กำลังอัปเดตข้อมูลล่าสุด...";

  // ถ้า openLootBox ยังประมวลผลอยู่ ให้เวลาสั้น ๆ ก่อนอ่านสถานะใหม่
  // โดยไม่ยิง openLootBox ซ้ำ ป้องกันการเปิดซ้ำ/แข่งกันเขียนข้อมูล
  ticket.classList.remove('show');
  claimBtn.classList.remove('show');
  stopContinuousSpin();

  if (result && result.hardFail) {
    // backend อาจยังประมวลผลอยู่ — เช็กสถานะซ้ำสูงสุด 4 รอบ (ห่างกัน ~2.5 วินาที) ไม่ยิง openLootBox ซ้ำ
    for (let i = 0; i < 4; i++) {
      await wait(2500);
      await reloadLootBoxData();
      if (loadFailed || !stock.includes(milestone)) break;
    }
  } else {
    await reloadLootBoxData();
  }

  if (!stock.includes(milestone)) {
    // กล่องนี้หายจาก stock แล้ว = เปิดสำเร็จไปแล้วจริง — ดึงผลจริงมาโชว์แทน
    try {
      const historyResult = await callGAS('getLootHistory', { roomNo: currentRoomNo });
      const months = [...(historyResult.history || [])].sort((x, y) => String(y.month).localeCompare(String(x.month)));
      const thisMonth = months.find(h =>
        h.items.some(it => String(it.tier) === String(milestone) && it.opened)
      );
      const matchedItem = thisMonth?.items.find(it => String(it.tier) === String(milestone) && it.opened);

      if (matchedItem) {
        showQuickTicket(milestone, matchedItem.amount);
      } else {
        showToast('สิทธิ์นี้ถูกใช้เรียบร้อยแล้ว กำลังเปิดประวัติให้ดูผล', 'success', 6000);
        openHistoryOverlay();
        updateStartState();
      }
    } catch (e) {
      showToast('สิทธิ์นี้ถูกใช้เรียบร้อยแล้ว กำลังเปิดประวัติให้ดูผล', 'success', 6000);
      openHistoryOverlay();
      updateStartState();
    }
  } else if (!loadFailed) {
    // ยังไม่เปิดจริง — กลับสู่สถานะพร้อมเริ่มใหม่ ให้ลองแตะเริ่มอีกครั้ง
    updateStartState();
  }
  // ถ้าซิงค์ไม่สำเร็จ คงหน้า error + ปุ่มลองใหม่ไว้ (showError จัดการแล้ว)
  busy = false;
}

claimBtn.addEventListener('click', () => {
  ticket.classList.remove('show');
  claimBtn.classList.remove('show');
  updateStockCount();
  updateStartState();
});
startBtn.addEventListener('click', () => {
  bgm.play().catch(() => {}); // กัน error เต็มหน้าถ้าเบราว์เซอร์ยังบล็อกอยู่ ไม่กระทบการเล่นเกม
  startRound();
});
retryBtn.addEventListener('click', () => {
  manualRetryCount++;
  retryBtn.classList.add('loading');
  instruction.textContent = 'กำลังเชื่อมต่อใหม่...';
  reloadLootBoxData().finally(() => retryBtn.classList.remove('loading'));
});

// ============================================================
//  RENDER จากข้อมูลจริง (getLootBoxDataByRoom / getLootBoxData)
// ============================================================
function updateRoomLabel(room) {
  cabRoomBadge.textContent = 'ห้อง ' + room;
  currentRoomNo = room;
  showHistoryButton();
}

function applyRoomData(result) {
  if (result.roomNo) updateRoomLabel(result.roomNo);
  if (result.tierLabel) { currentTierLabel = result.tierLabel; applyTier(currentTierLabel); }

  stock = [];
  lootTokens = {};
  const order = ['PAID', 7, 14, 21, 28]; // PAID ได้จากจ่ายบิล มักได้เร็วกว่าเช็คอินครบ 7 วันเสมอ เลยเปิดก่อน
  const boxes = result.boxes || {};
  order.forEach(m => {
    const info = boxes[m] || {};
    if (info.token && !info.opened) {
      const key = String(m);
      stock.push(key);
      lootTokens[key] = info.token;
    }
  });

  updateStockCount();
}

function renderCabinet(result) {
  loadFailed = false;
  manualRetryCount = 0;
  retryBtn.style.display = 'none';
  applyRoomData(result);
  busy = false;
  updateStartState();
  saveCacheSnapshot(result);
  warmBgm();
}


async function callGASWithRetry(action, params, retries = 1, delayMs = 1200, timeoutMs = 10000) {
  try {
    return await callGAS(action, params, timeoutMs);
  } catch (e) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, delayMs));
      return callGASWithRetry(action, params, retries - 1, delayMs, timeoutMs);
    }
    throw e;
  }
}

const DATA_FETCH_TIMEOUT_MS = 10000;   // เวลารอโหลดข้อมูลต่อครั้ง (ลองใหม่อัตโนมัติ 1 รอบถ้าพลาด รวมสูงสุดราว 10+10 วินาที)

async function loadLootBoxForRoom(roomNo) {
  try {
    const result = await callGASWithRetry('getLootBoxDataByRoom', { roomNo }, 1, 1200, DATA_FETCH_TIMEOUT_MS);
    if (!result.success) { showError(result.message || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง', true); return; }
    renderCabinet(result);
  } catch (e) {
    console.error('loadLootBoxForRoom failed:', e);
    showError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง', true);
  }
}
async function loadLootBoxByToken(token) {
  try {
    const result = await callGASWithRetry('getLootBoxData', { token }, 1, 1200, DATA_FETCH_TIMEOUT_MS);
    if (!result.success) { showError(result.message || 'ลิงก์ไม่ถูกต้อง กรุณาขอลิงก์ใหม่', true); return; }
    renderCabinet(result);
  } catch (e) {
    console.error('loadLootBoxByToken failed:', e);
    showError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง', true);
  }
}
async function loadLootBoxByUserId(userId) {
  try {
    const result = await callGASWithRetry('getLootBoxData', { userId }, 1, 1200, DATA_FETCH_TIMEOUT_MS);
    if (!result.success) { showError(result.message || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง', true); return; }
    renderCabinet(result);
  } catch (e) {
    console.error('loadLootBoxByUserId failed:', e);
    showError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง', true);
  }
}

// ============================================================
//  HISTORY BUTTON + SHEET
// ============================================================
function showHistoryButton() {
  document.getElementById('btn-history').classList.add('show');
}

const TH_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

function formatMonthLabel(monthKey) {
  const [y, m] = String(monthKey).split('-').map(Number);
  if (!y || !m) return monthKey;
  return `${TH_MONTHS[m - 1]} ${y + 543}`;
}

function getTierMeta(tierRaw) {
  if (String(tierRaw).trim() === 'PAID') {
    return { name: 'Bonus', reason: stockLabels.PAID, color: TIER_COLORS.paid };
  }
  const cfg = LB_CONFIG.find(c => c.milestone === Number(tierRaw));
  if (cfg) return { name: cfg.name, reason: stockLabels[String(cfg.milestone)] || '', color: TIER_COLORS[cfg.tier] };
  return { name: 'ไม่ทราบ', reason: '', color: '#8B929C' };
}

let historyLastFocus = null;

function openHistoryOverlay() {
  const overlay = document.getElementById('history-overlay');
  if (overlay.classList.contains('active')) return;
  historyLastFocus = document.activeElement;
  overlay.classList.add('active');
  document.body.classList.add('lock');
  revealCard.inert = true;
  document.getElementById('history-close').focus();
  loadHistory();
}
function closeHistoryOverlay() {
  document.getElementById('history-overlay').classList.remove('active');
  document.body.classList.remove('lock');
  revealCard.inert = false;
  if (historyLastFocus && historyLastFocus.focus) historyLastFocus.focus();
}
document.getElementById('history-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'history-overlay') closeHistoryOverlay();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('history-overlay').classList.contains('active')) {
    closeHistoryOverlay();
  }
});

function historyMessage(title, sub, withRetry) {
  return `
    <div class="h-empty">
      <p class="h-empty-title">${esc(title)}</p>
      ${sub ? `<p>${esc(sub)}</p>` : ''}
      ${withRetry ? '<button class="btn ghost" type="button" onclick="loadHistory()">ลองอีกครั้ง</button>' : ''}
    </div>`;
}

function historyCacheKey() { return 'gacha_hist_' + currentRoomNo; }

async function loadHistory() {
  const body = document.getElementById('history-body');

  if (!currentRoomNo) {
    body.innerHTML = historyMessage('ไม่พบข้อมูลห้อง', '', false);
    return;
  }

  // โชว์ของที่เคยโหลดไว้ทันที (ถ้ามี) แล้วค่อยทับด้วยข้อมูลล่าสุด
  let shownFromCache = false;
  try {
    const raw = sessionStorage.getItem(historyCacheKey());
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached && Array.isArray(cached.history)) { renderHistory(cached.history); shownFromCache = true; }
    }
  } catch (e) {}
  if (!shownFromCache) {
    body.innerHTML = '<div class="h-skel" aria-label="กำลังโหลด"><i></i><i></i><i></i><i></i></div>';
  }

  try {
    const result = await callGASWithRetry('getLootHistory', { roomNo: currentRoomNo }, 1, 1200, 15000);
    if (!result.success) {
      if (!shownFromCache) body.innerHTML = historyMessage('ไม่สามารถโหลดประวัติได้', result.message || '', true);
      return;
    }
    const history = result.history || [];
    renderHistory(history);
    try { sessionStorage.setItem(historyCacheKey(), JSON.stringify({ history, ts: Date.now() })); } catch (e) {}
  } catch (e) {
    if (!shownFromCache) body.innerHTML = historyMessage('ไม่สามารถโหลดประวัติได้', 'กรุณาลองใหม่อีกครั้ง', true);
  }
}

function renderHistory(history) {
  const body = document.getElementById('history-body');

  if (!history.length) {
    body.innerHTML = historyMessage('ยังไม่มีประวัติ', 'ผลที่ได้รับจะแสดงที่นี่', false);
    return;
  }

  body.innerHTML = history.map(h => {
    const total     = h.items.reduce((s, it) => s + (it.opened ? Number(it.amount) : 0), 0);
    const hasOpened = h.items.some(it => it.opened);

    const rows = h.items.map(it => {
      const meta = getTierMeta(it.tier);
      const amountHtml = it.opened
        ? `<span class="h-amount">฿${Number(it.amount).toLocaleString()}</span>`
        : `<span class="h-amount is-muted">ยังไม่ได้ใช้สิทธิ์</span>`;
      return `
        <li class="h-row">
          <span class="h-tier" style="--tier-color:${meta.color}">
            <i class="h-dot"></i>
            <span class="h-text">
              <span class="h-name">${esc(meta.name)}</span>
              ${meta.reason ? `<span class="h-reason">${esc(meta.reason)}</span>` : ''}
            </span>
          </span>
          ${amountHtml}
        </li>`;
    }).join('');

    // เดือนที่ไม่ได้ใช้สิทธิ์เลยและยังไม่ตัดบิล ไม่มีส่วนลดรอหัก จึงไม่โชว์ "รอหักบิล"
    const statusHtml = (h.applied || hasOpened)
      ? `<span class="h-status ${h.applied ? 'applied' : ''}">${h.applied ? 'หักบิลแล้ว' : 'รอหักบิล'}</span>`
      : '';

    const totalHtml = hasOpened
      ? `<div class="h-total">
           <span class="h-total-label">รวมส่วนลดที่ได้รับ</span>
           <span class="h-total-amount">฿${total.toLocaleString()}</span>
         </div>`
      : '';

    return `
      <section class="h-month">
        <div class="h-head">
          <span class="h-month-label">${esc(formatMonthLabel(h.month))}</span>
          ${statusHtml}
        </div>
        <ul class="h-list">${rows}</ul>
        ${totalHtml}
      </section>`;
  }).join('');
}

// ============================================================
//  INIT
// ============================================================
let bootMode  = null; // 'room' | 'token' | 'userId'
let bootParam = null;

function removeBootMask() {
  const boot = document.getElementById('boot-mask');
  if (!boot || boot.classList.contains('fade-out')) return;
  boot.classList.add('fade-out');
  setTimeout(() => boot.remove(), 350);
}

// โหลดข้อมูลตามโหมดที่เปิดมา (room / token / LIFF userId) — ใช้ทั้งตอนเปิดหน้าและตอนกด "ลองอีกครั้ง" ที่ยังไม่เคยรู้โหมด
async function bootLoad() {
  const params = new URLSearchParams(window.location.search);
  const room   = params.get('room');
  const token  = params.get('token');

  if (room) {
    bootMode = 'room'; bootParam = room;
    if (!tryRenderFromCache('room', room)) instruction.textContent = 'กำลังโหลดข้อมูล...';
    await loadLootBoxForRoom(room);
  } else if (token) {
    bootMode = 'token'; bootParam = token;
    if (!tryRenderFromCache('token', token)) instruction.textContent = 'กำลังโหลดข้อมูล...';
    await loadLootBoxByToken(token);
  } else {
    await initLiff();
    if (liffReady && !liff.isLoggedIn()) return;   // กำลังพาไปหน้า login ของ LINE ไม่ต้องโชว์ error
    if (liffReady && liffProfile) {
      bootMode = 'userId'; bootParam = liffProfile.userId;
      if (!tryRenderFromCache('userId', liffProfile.userId)) instruction.textContent = 'กำลังโหลดข้อมูล...';
      await loadLootBoxByUserId(liffProfile.userId);
    } else {
      showError('เชื่อมต่อ LINE ไม่สำเร็จ', true);
    }
  }
}

async function init() {
  setFest(currentFest());   // เลือกธีมเทศกาลตามเดือน
  applyTier('Member'); // ค่าเริ่มต้นก่อนรู้ tier จริง
  startBtn.classList.add('hide'); // ปิดจนกว่าจะโหลดข้อมูลจริงเสร็จ
  buildWheelValues();   // วาดวงล้อรอไว้ทันที (ตัวเลขล่อ) ไม่ให้เป็นวงกลมว่างระหว่างรอข้อมูล

  const params = new URLSearchParams(window.location.search);
  // คงหน้ารอไว้จนข้อมูลพร้อม (รอครั้งเดียว เข้าวงล้อแล้วกดได้เลย) — ถ้ารอนานผิดปกติให้ข้อความบอก
  setTimeout(() => {
    const t = document.querySelector('#boot-mask .boot-text');
    if (t) t.textContent = 'กำลังเชื่อมต่อ ใช้เวลานานกว่าปกติเล็กน้อย';
  }, 6000);

  await bootLoad();

  if (params.get('view') === 'history' && currentRoomNo) {
    openHistoryOverlay();
  }

  removeBootMask();
}

async function reloadLootBoxData() {
  if (bootMode === 'room') await loadLootBoxForRoom(bootParam);
  else if (bootMode === 'token') await loadLootBoxByToken(bootParam);
  else if (bootMode === 'userId') await loadLootBoxByUserId(bootParam);
  else await bootLoad();
}

init();