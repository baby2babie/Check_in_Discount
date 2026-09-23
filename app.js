// ============================================================
//  คูปองส่วนลด — app.js (Minimal Premium Edition)
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
  "7": "เช็คอิน 7 วัน", "14": "เช็คอิน 14 วัน", "21": "เช็คอิน 21 วัน", "28": "เช็คอิน 28 วัน",
  "PAID": "จ่ายตรงเวลา"
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
  "Member":   { deep:"#25453A", accent:"#4E8F78", tint:"#EAF3EF", line:"#C5DDD3", ink:"#2F6553", pas:"#CFE9DE", pas2:"#A9D6C4" },
  "Silver":   { deep:"#2D3B52", accent:"#6F86A6", tint:"#ECF0F6", line:"#CAD5E4", ink:"#3D5677", pas:"#D6E2F1", pas2:"#B4C8E2" },
  "Gold":     { deep:"#5A4419", accent:"#B38A38", tint:"#F6F0E2", line:"#E3D2A8", ink:"#7A5C1D", pas:"#F6E6BE", pas2:"#EBCF8E" },
  "Platinum": { deep:"#3E3563", accent:"#8574B5", tint:"#F0EDF7", line:"#D8D0EA", ink:"#56478A", pas:"#E0D9F3", pas2:"#C6BBE8" },
  "Diamond":  { deep:"#1F4A54", accent:"#3F98A8", tint:"#E7F3F5", line:"#BFDFE4", ink:"#1F6572", pas:"#CBE9EE", pas2:"#A3D3DC" },
  "Legend":   { deep:"#5C2530", accent:"#B5505E", tint:"#F8ECEE", line:"#E8C6CB", ink:"#86303C", pas:"#F5D5DA", pas2:"#EAB0BA" },
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
  s.setProperty('--tier-glow', t.accent + '38');
  s.setProperty('--tier-glow-2', t.accent + '1A');
}

// ตัวเลขล่อ (decoy) โชว์บนคูปองระหว่างเกม — คือชุดค่า discount_amount ที่ไม่ซ้ำกันทั้งหมดจากชีท LOOT_BOX จริง
// (ครบทุก tier/milestone พอดี 7 ค่า = จำนวนใบพอดี) การันตีว่ารางวัลจริงที่ backend ส่งมาตอนจบ
// จะเป็นหนึ่งใน 7 ค่านี้เสมอ
const CAPSULE_NUMBERS = [5, 10, 15, 20, 25, 30, 50];
const N_CAPS = 7;

// ตัวเลขสำหรับเฉลยใบที่ไม่ได้เลือก "หลังรู้ผลจริงแล้ว" — ตัดค่าที่ตรงกับรางวัลจริงออกก่อนเสมอ
// เพื่อการันตีว่าใบอื่นจะไม่โชว์ตัวเลขซ้ำกับรางวัลที่ผู้เล่นได้จริง
function decoysExcluding(amount) {
  const pool = [...CAPSULE_NUMBERS];
  const idx = pool.indexOf(amount);
  if (idx !== -1) pool.splice(idx, 1); else pool.pop(); // เผื่อ backend ให้ค่านอกชุด — ตัดออก 1 ตัวให้จำนวนพอดีกับใบที่เหลือ
  for (let i = pool.length - 1; i > 0; i--) {            // สลับสุ่ม
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

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

function tryRenderFromCache(mode, param) {
  try {
    const raw = sessionStorage.getItem(cacheKey(mode, param));
    if (!raw) return false;
    const { result, ts } = JSON.parse(raw);
    if (!result || Date.now() - ts > CACHE_MAX_AGE_MS) return false;
    applyRoomData(result);
    renderStateUI(); // ปุ่มเริ่มยังซ่อนอยู่ จนกว่าข้อมูลจริงจะมา (busy = true)
    instruction.textContent = "กำลังซิงค์ข้อมูลล่าสุด...";
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
const stepEls     = Array.prototype.slice.call(document.querySelectorAll('#steps li'));

// stock = milestone keys (string) ที่มีคูปองเปิดได้จริงตอนนี้ เรียงตามลำดับที่จะเปิด
// lootTokens = { "7": token, "PAID": token, ... } token จริงจาก backend สำหรับแต่ละ milestone
let stock = [];
let lootTokens = {};
let busy = true;        // true จนกว่าจะโหลดข้อมูลจริงเสร็จ / กำลังเล่นรอบอยู่
let loadFailed = false; // โหลดข้อมูลล่าสุดล้มเหลว (ใช้คงสถานะ error ไว้ ไม่ให้ถูกทับด้วยข้อมูลเก่า)
let manualRetryCount = 0; // จำนวนครั้งที่ผู้ใช้กด "ลองเชื่อมต่อใหม่" แล้วยังพลาดซ้ำ — ใช้แนะนำให้เปิดลิงก์ใหม่หลังลองหลายครั้งไม่สำเร็จ

// ============================================================
//  UI helpers
// ============================================================
function setState(s) { revealCard.dataset.state = s; }

// แถบ 4 ขั้น: 0 = ยังไม่เริ่ม, 1 จำ, 2 สลับ, 3 เลือก, 4 เฉลย
function setPhase(n) {
  stepEls.forEach((li, i) => {
    li.classList.toggle('done', i < n - 1);
    li.classList.toggle('active', i === n - 1);
  });
}

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
  setTitle('ไม่พร้อมใช้งาน');
  // ลองเชื่อมต่อใหม่ด้วยตัวเองไม่ได้ผลติดต่อกันหลายครั้ง — session อาจหมดอายุ แนะนำให้เปิดลิงก์ใหม่แทน
  const hintText = manualRetryCount >= 2
    ? `${msg} ลองเชื่อมต่อใหม่หลายครั้งแล้วยังไม่สำเร็จ — ลองปิดหน้านี้แล้วเปิดลิงก์เข้ามาใหม่อีกครั้ง`
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
  return cfg ? cfg.name : 'พิเศษ';
}
function couponSummary(milestone) {
  const reason = stockLabels[String(milestone)];
  return reason ? `คูปอง ${boxNameFor(milestone)} จาก${reason}` : `คูปอง ${boxNameFor(milestone)}`;
}

function updateStockCount() {
  stockCount.textContent = stock.length;
}

// วาดหน้า idle / empty ตาม stock (ไม่แตะปุ่ม)
function renderStateUI() {
  setPhase(0);
  if (stock.length > 0) {
    setState('idle');
    setTitle('พร้อมเปิดคูปองแล้ว');
    setHint(couponSummary(stock[0]));
    buildIdlePreview();
  } else {
    setState('empty');
    setTitle('ไม่มีคูปองให้เปิดตอนนี้');
    setHint('สิทธิ์ใหม่จะปรากฏเมื่อเช็คอินครบตามเกณฑ์หรือจ่ายบิลตรงเวลา');
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
  const colors = ['var(--tier)', 'var(--tier)', 'var(--tier-line)', 'var(--tier-deep)'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    const w = 3 + Math.random() * 3;
    const h = w * (2 + Math.random() * 1.5);
    p.style.width = w + 'px';
    p.style.height = h + 'px';
    p.style.left = (Math.random() * 100) + 'vw';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = (2.6 + Math.random() * 1.6) + 's';
    p.style.animationDelay = (Math.random() * 0.6) + 's';
    confettiLayer.appendChild(p);
    setTimeout(() => p.remove(), 5000);
  }
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
//  SUSPENSE REVEAL — เกมคูปองส่วนลด
//  1 รอบ = 1 กล่อง (stock[0]) — ยิง openLootBox จริง "ตอนผู้เล่นกดเลือกการ์ด" (ไม่ใช่ตอนกดเริ่ม)
//  ถ้าผู้เล่นยังไม่เลือก/ปิดหน้าไปก่อน คูปองจะยังไม่ถูกใช้ กลับมาเล่นใหม่ได้
//  ตัวเลขบนการ์ดระหว่างเกมเป็นแค่ตัวล่อ (CAPSULE_NUMBERS) รางวัลจริงเฉลยจาก backend ตอนจบเท่านั้น
// ============================================================
let capEls = [];
let currentOrder = [];
let ringRotation = 0;
let radius = 120; // คำนวณใหม่จากขนาดจริงของ .board ผ่าน layoutMetrics()
let dealTimer = null;

// ขนาดการ์ด/รัศมีวงแหวน/ขนาดตัวเลขตั๋ว ผูกกับความกว้างจริงของบอร์ด — เรียกตอน build และตอน resize
function layoutMetrics() {
  const size = board.clientWidth;
  if (!size) return;
  const capW = size * 0.285;
  const capH = capW * 0.64;
  const rs = document.documentElement.style;
  rs.setProperty('--cap-w', capW + 'px');
  rs.setProperty('--cap-h', capH + 'px');
  rs.setProperty('--amt-fs', (size * 0.25) + 'px');
  radius = size * 0.365;
}
window.addEventListener('resize', () => { layoutMetrics(); renderRing(); });

function clearCards() {
  clearTimeout(dealTimer);
  board.querySelectorAll('.cap').forEach(el => el.remove());
  capEls = [];
  currentOrder = [];
  ringRotation = 0;
}

function cardHTML() {
  return `
    <div class="cap-body">
      <span class="cap-shadow"></span>
      <div class="cap-flip">
        <div class="cap-face cap-front">
          <span class="cf-wm">฿</span>
          <span class="cap-label"></span>
        </div>
        <div class="cap-face cap-back">
          <span class="cb-wm">฿</span>
          <span class="cb-q">?</span>
        </div>
      </div>
      <span class="cap-ring"></span>
    </div>`;
}

// สร้างการ์ด 7 ใบ — mode: 'closed' (คว่ำ พร้อมเล่น) | 'empty' (ช่องว่างเส้นประ)
function createCards(mode) {
  layoutMetrics();
  clearCards();
  const empty = mode === 'empty';
  for (let i = 0; i < N_CAPS; i++) {
    const el = document.createElement('div');
    el.className = 'cap dealing ' + (empty ? 'empty' : 'closed idle');
    el.style.setProperty('--deal', (i * 50) + 'ms');
    el.style.setProperty('--d', (i * 0.35).toFixed(2) + 's');
    el.innerHTML = cardHTML();
    board.appendChild(el);
    capEls.push(el);
  }
  currentOrder = capEls.map((_, i) => i);
  void board.offsetWidth; // ยืนยันตำแหน่งเริ่มที่กลางวง แล้วค่อยลอยออก
  renderRing();
  capEls.forEach(el => el.classList.add('dealt'));
  dealTimer = setTimeout(() => capEls.forEach(el => el.classList.remove('dealing', 'dealt')), 1300);
}

function hasPristineIdleCards() {
  return capEls.length === N_CAPS && capEls.every(el =>
    el.isConnected && el.classList.contains('idle') && el.classList.contains('closed'));
}
function hasEmptySlots() {
  return capEls.length === N_CAPS && capEls.every(el => el.isConnected && el.classList.contains('empty'));
}

// พรีวิวก่อนกดเริ่ม — การ์ดคว่ำ 7 ใบ กันหน้าแรกดูโล่ง
function buildIdlePreview() {
  if (hasPristineIdleCards()) { layoutMetrics(); renderRing(); return; }
  createCards('closed');
}
function showEmptySlots() {
  if (hasEmptySlots()) { layoutMetrics(); renderRing(); return; }
  createCards('empty');
}

// เริ่มรอบเล่นจริง — ใช้การ์ดคว่ำจากพรีวิวต่อ (พลิกหงายให้เห็นตัวเลข) หรือสร้างใหม่ถ้าสภาพไม่พร้อม
function buildBoard() {
  layoutMetrics();
  if (!hasPristineIdleCards()) createCards('closed');
  clearTimeout(dealTimer);
  const decoys = [...CAPSULE_NUMBERS].sort(() => Math.random() - 0.5).slice(0, N_CAPS);
  capEls.forEach((el, i) => {
    el.classList.remove('idle', 'dealing', 'dealt');
    el.dataset.decoy = decoys[i];
    el.querySelector('.cap-label').innerHTML = `${decoys[i]}<small>฿</small>`;
  });
  currentOrder = capEls.map((_, i) => i);
  ringRotation = 0;
  renderRing();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    capEls.forEach(el => el.classList.remove('closed'));
  }));
}

function slotAngle(s) { return (360 / N_CAPS) * s - 90 + ringRotation; }

function renderRing() {
  capEls.forEach((el, i) => {
    if (el.classList.contains('to-center') || el.classList.contains('centered')) return;
    const rad = slotAngle(currentOrder[i]) * Math.PI / 180;
    el.style.transform = `translate(${Math.cos(rad) * radius}px, ${Math.sin(rad) * radius}px)`;
  });
}
function slotOccupants() {
  const arr = new Array(N_CAPS);
  capEls.forEach((el, i) => { arr[currentOrder[i]] = i; });
  return arr;
}
function swapSlots(a, b) {
  const occ = slotOccupants();
  const ba = occ[a], bb = occ[b];
  if (ba === undefined || bb === undefined) return;
  currentOrder[ba] = b;
  currentOrder[bb] = a;
}

// คว่ำการ์ดทุกใบ แล้วเอาตัวเลขออกจาก DOM หลังพลิกจบ
function closeCaps() {
  capEls.forEach(el => el.classList.add('closed'));
  setTitle('ปิดแล้ว เตรียมสลับ');
  setTimeout(() => {
    capEls.forEach(el => {
      const label = el.querySelector('.cap-label');
      if (label) label.textContent = '';
    });
  }, 700);
}

function spinSegment(dur, dir) {
  return new Promise(res => {
    const start = performance.now();
    (function loop(now) {
      ringRotation += 3.5 * dir;
      renderRing();
      if (now - start < dur) requestAnimationFrame(loop);
      else res();
    })(performance.now());
  });
}
async function settle(fn) {
  fn();
  capEls.forEach(el => el.classList.add('settling'));
  renderRing();
  await wait(560);
  capEls.forEach(el => el.classList.remove('settling'));
}
const adjacentSwap = () => { for (let s = 0; s + 1 < N_CAPS; s += 2) swapSlots(s, s + 1); };
const oppositeSwap = () => { const h = Math.floor(N_CAPS/2); for (let s = 0; s < h; s++) swapSlots(s, s + h); };
const mirrorFlip   = () => { for (let s = 0; s < Math.floor(N_CAPS/2); s++) swapSlots(s, N_CAPS - 1 - s); };
const scrambleJump = () => {
  const sh = [...Array(N_CAPS).keys()];
  for (let i = sh.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [sh[i], sh[j]] = [sh[j], sh[i]]; }
  currentOrder = capEls.map((_, i) => sh[i]);
};
const splitCounter = () => {
  const h = Math.floor(N_CAPS/2);
  for (let s = 0; s < h; s++) swapSlots(s, (s + 1) % h);
  for (let s = h; s < N_CAPS; s++) { const rel = s - h, len = N_CAPS - h; swapSlots(s, h + ((rel - 1 + len) % len)); }
};
const rotateBy = (k) => () => {
  const occ = slotOccupants();
  const newOrder = new Array(N_CAPS);
  for (let s = 0; s < N_CAPS; s++) {
    const box = occ[s];
    if (box !== undefined) newOrder[box] = ((s + k) % N_CAPS + N_CAPS) % N_CAPS;
  }
  currentOrder = newOrder;
};

async function startShuffle() {
  setTitle('กำลังสลับ ตามให้ทัน');
  const patterns = [
    adjacentSwap, oppositeSwap, mirrorFlip, scrambleJump, splitCounter,
    rotateBy(2), rotateBy(3), rotateBy(-2)
  ];
  let elapsed = 0;
  while (elapsed < 4600) {
    if (Math.random() < 0.45) {
      const dur = 600 + Math.random() * 500;
      await spinSegment(dur, Math.random() > 0.5 ? 1 : -1);
      elapsed += dur;
    } else {
      await settle(patterns[Math.floor(Math.random() * patterns.length)]);
      elapsed += 560;
    }
  }
}

function onCapKey(e) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); }
}
function enablePicking() {
  return new Promise(resolve => {
    setPhase(3);
    setTitle('เลือกคูปอง 1 ใบ');
    setHint('แตะใบที่คุณคิดว่าใช่');
    capEls.forEach((el, i) => {
      el.classList.add('pickable');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `เลือกคูปองใบที่ ${i + 1}`);
      el.tabIndex = 0;
      el.addEventListener('keydown', onCapKey);
      el.addEventListener('click', (e) => { resolve(e.currentTarget); }, { once: true });
    });
  });
}
function disablePicking() {
  capEls.forEach(el => {
    el.classList.remove('pickable');
    el.removeAttribute('role');
    el.removeAttribute('aria-label');
    el.removeAttribute('tabindex');
    el.removeEventListener('keydown', onCapKey);
  });
}

function presentTicket(milestone, amount, celebrate = true) {
  ticketTier.textContent = `คูปอง ${boxNameFor(milestone)}`;
  ticketDesc.textContent = 'ส่วนลดเข้ารอบบิลถัดไปอัตโนมัติ';
  ticket.setAttribute('aria-label', `คูปอง ${boxNameFor(milestone)} ส่วนลดค่าเช่า ${amount} บาท`);
  ticket.classList.add('show');
  claimBtn.classList.add('show');
  if (celebrate) {
    countUp(ticketAmt, amount);
    spawnConfetti(amount >= 70 ? 28 : 16);
  } else {
    ticketAmt.textContent = amount;
  }
}

// เล่น 1 รอบเต็ม: โชว์ตัวเลข → คว่ำ → สลับ → ให้เลือก → เฉลยใบอื่น → ลอยเข้ากลาง → รอผลจริงจาก backend → เปิด
async function playRound(milestone, requestOpen) {
  setState('play');
  buildBoard();
  ticket.classList.remove('show');
  claimBtn.classList.remove('show');
  setPhase(1);
  setTitle('จำตำแหน่งส่วนลดให้ดี');
  setHint('');

  await wait(2200);
  closeCaps();
  await wait(650);
  setPhase(2);
  await startShuffle();

  const chosen = await enablePicking();

  // ผู้เล่นเลือกแล้ว — ตอนนี้เท่านั้นที่ส่งคำขอเปิดคูปองจริง และเริ่มนับเวลา HARD_TIMEOUT_MS
  const apiPromise = requestOpen();

  setHint('');
  disablePicking();
  chosen.classList.add('marked');

  const others = capEls.filter(el => el !== chosen);
  others.sort((a, b) => {
    const ia = capEls.indexOf(a), ib = capEls.indexOf(b);
    return currentOrder[ia] - currentOrder[ib];
  });

  setPhase(4);
  setTitle('มาดูใบที่คุณไม่ได้เลือก');
  await wait(500);

  // รอผลจริงจาก backend อย่างเงียบๆ ก่อนเริ่มเฉลย (ปกติไวมาก ผู้เล่นแทบไม่รู้สึกถึงจังหวะรอนี้)
  // ต้องรู้ผลจริงก่อนเสมอ เพื่อเลือกตัวเลขเฉลยใบอื่นที่ไม่ซ้ำกับรางวัลที่ได้จริง
  const pendingTimer = setTimeout(() => chosen.classList.add('pending'), 900);
  const [result] = await Promise.all([apiPromise, wait(500)]);
  clearTimeout(pendingTimer);
  chosen.classList.remove('pending');

  if (!result || !result.success) {
    return { success: false, result };
  }

  const amount = Number(result.discount_amount) || 0;

  // เฉลยใบอื่นด้วยตัวเลขที่เหลือจากชุดรางวัลจริง (ตัดค่าที่ตรงกับผลจริงออกก่อนแล้ว)
  // การันตีว่าตัวเลขที่เฉลยจะไม่ซ้ำกับรางวัลที่ผู้เล่นได้จริงเลย
  const revealPool = decoysExcluding(amount);
  others.forEach((el, i) => { el.dataset.decoy = revealPool[i]; });

  for (const el of others) {
    el.querySelector('.cap-label').innerHTML = `${el.dataset.decoy}<small>฿</small>`;
    el.classList.add('revealed-miss');
    el.classList.remove('closed'); // พลิกหงาย
    await wait(420);
  }

  await wait(600);
  setTitle('เหลือใบของคุณใบเดียว');
  others.forEach(el => el.classList.add('faded'));
  await wait(700);
  others.forEach(el => el.classList.add('gone'));

  await wait(200);
  setTitle('มาดูกันว่าได้เท่าไหร่');
  chosen.classList.add('to-center');
  chosen.style.transform = 'translate(0px, 0px)';
  await wait(430);
  chosen.classList.add('centered', 'scaled');
  await wait(200);
  chosen.classList.add('suspense-shake');
  await wait(850);
  chosen.classList.remove('suspense-shake');
  await wait(150);

  chosen.classList.add('open');
  screenFlash.classList.remove('go'); void screenFlash.offsetWidth; screenFlash.classList.add('go');
  await wait(450);

  setState('result');
  setTitle('คุณได้รับส่วนลด');
  setHint('');
  presentTicket(milestone, amount);

  return { success: true, result };
}

// แสดงผลแบบเร็ว (ไม่เล่นเกมใหม่) — ใช้ตอนกู้คืนผลที่เปิดสำเร็จไปแล้วจริง (เช่นหลัง error/retry)
function showQuickTicket(milestone, amount) {
  clearCards();
  setState('result');
  setPhase(4);
  setTitle('คูปองใบนี้เปิดไปแล้ว');
  setHint('นี่คือส่วนลดที่คุณได้รับ');
  presentTicket(milestone, amount, false);
}

async function startRound() {
  if (busy) return; // กันกดซ้ำระหว่างรอบกำลังเล่นอยู่
  if (stock.length === 0) { instruction.textContent = "ไม่มีคูปองให้เปิดตอนนี้"; return; }
  busy = true;
  startBtn.classList.add('hide');
  retryBtn.style.display = 'none';
  instruction.textContent = "";

  const milestone = stock[0];
  const token = lootTokens[milestone];

  const HARD_TIMEOUT_MS = 30000;   // เวลารอ backend หลังผู้เล่นกดเลือกการ์ด (มิลลิวินาที) — ปรับตัวเลขนี้ได้

  // ส่งคำขอเปิดจริง "ตอนผู้เล่นกดเลือกการ์ด" (playRound เป็นคนเรียก)
  // request ไม่ถูกยกเลิกแม้ backend จะตอบช้า (auto-resync ผ่าน HARD_TIMEOUT_MS ถ้าช้าเกินไปจริงๆ)
  // นับเวลา HARD_TIMEOUT_MS จากตอนเลือก (แอนิเมชันหลังเลือกใช้ราว 7 วินาที ที่เหลือคือเวลารอผลจริง)
  const requestOpen = () => {
    const realPromise = callGAS('openLootBox', { token, tierLabel: currentTierLabel }, 45000).catch((err) => {
      console.error('openLootBox failed:', err);
      return { success: false, message: 'เชื่อมต่อกับระบบไม่สำเร็จ' };
    });
    return withTimeout(
      realPromise,
      HARD_TIMEOUT_MS,
      { success: false, message: 'ระบบช้าผิดปกติ กำลังซิงค์ข้อมูลใหม่ให้อัตโนมัติ', hardFail: true }
    );
  };

  const outcome = await playRound(milestone, requestOpen);

  if (outcome.success) {
    stock.shift();
    delete lootTokens[milestone];
    updateStockCount();
    busy = false;
    return;
  }

  // ── เปิดไม่สำเร็จ: sync ข้อมูลใหม่ แล้วเช็คว่าจริงๆ เปิดสำเร็จไปแล้วหรือเปล่า ──
  const result = outcome.result;
  if (result && result.hardFail) {
    showToast('ระบบช้าผิดปกติ กำลังซิงค์ข้อมูลให้อัตโนมัติ', 'error', 4000);
  } else {
    showToast(result?.message || 'เปิดไม่สำเร็จ', 'error', 4000);
  }
  setPhase(0);
  setTitle('กำลังซิงค์ข้อมูล');
  setHint('');
  instruction.textContent = "กำลังซิงค์ข้อมูลใหม่...";

  // ถ้า openLootBox ยังประมวลผลอยู่ ให้เวลาสั้น ๆ ก่อนอ่านสถานะใหม่
  // โดยไม่ยิง openLootBox ซ้ำ ป้องกันการเปิดซ้ำ/แข่งกันเขียนข้อมูล
  if (result && result.hardFail) {
    await wait(1200);
  }
  ticket.classList.remove('show');
  claimBtn.classList.remove('show');
  capEls.forEach(el => el.classList.add('gone'));

  await reloadLootBoxData();

  if (!stock.includes(milestone)) {
    // กล่องนี้หายจาก stock แล้ว = เปิดสำเร็จไปแล้วจริง — ดึงผลจริงมาโชว์แทน
    try {
      const historyResult = await callGAS('getLootHistory', { roomNo: currentRoomNo });
      const thisMonth = historyResult.history?.find(h =>
        h.items.some(it => String(it.tier) === String(milestone) && it.opened)
      );
      const matchedItem = thisMonth?.items.find(it => String(it.tier) === String(milestone) && it.opened);

      if (matchedItem) {
        showQuickTicket(milestone, matchedItem.amount);
      } else {
        showToast('คูปองใบนี้เปิดสำเร็จไปแล้ว กำลังเปิดประวัติให้ดูส่วนลดที่ได้รับ', 'success', 6000);
        openHistoryOverlay();
        updateStartState();
      }
    } catch (e) {
      showToast('คูปองใบนี้เปิดสำเร็จไปแล้ว กำลังเปิดประวัติให้ดูส่วนลดที่ได้รับ', 'success', 6000);
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
startBtn.addEventListener('click', startRound);
retryBtn.addEventListener('click', () => {
  manualRetryCount++;
  retryBtn.classList.add('loading');
  instruction.textContent = 'กำลังลองเชื่อมต่อใหม่...';
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

const DATA_FETCH_TIMEOUT_MS = 10000;   // เวลารอโหลดข้อมูลคูปองต่อครั้ง (ลองใหม่อัตโนมัติ 1 รอบถ้าพลาด รวมสูงสุดราว 10+10 วินาที)

async function loadLootBoxForRoom(roomNo) {
  try {
    const result = await callGASWithRetry('getLootBoxDataByRoom', { roomNo }, 1, 1200, DATA_FETCH_TIMEOUT_MS);
    if (!result.success) { showError(result.message || 'โหลดข้อมูลไม่ได้', true); return; }
    renderCabinet(result);
  } catch (e) {
    console.error('loadLootBoxForRoom failed:', e);
    showError('โหลดข้อมูลไม่ได้ กรุณาลองใหม่อีกครั้ง', true);
  }
}
async function loadLootBoxByToken(token) {
  try {
    const result = await callGASWithRetry('getLootBoxData', { token }, 1, 1200, DATA_FETCH_TIMEOUT_MS);
    if (!result.success) { showError(result.message || 'ลิงก์ไม่ถูกต้อง', true); return; }
    renderCabinet(result);
  } catch (e) {
    console.error('loadLootBoxByToken failed:', e);
    showError('โหลดข้อมูลไม่ได้ กรุณาลองใหม่อีกครั้ง', true);
  }
}
async function loadLootBoxByUserId(userId) {
  try {
    const result = await callGASWithRetry('getLootBoxData', { userId }, 1, 1200, DATA_FETCH_TIMEOUT_MS);
    if (!result.success) { showError(result.message || 'โหลดข้อมูลไม่ได้', true); return; }
    renderCabinet(result);
  } catch (e) {
    console.error('loadLootBoxByUserId failed:', e);
    showError('โหลดข้อมูลไม่ได้ กรุณาลองใหม่อีกครั้ง', true);
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
      ${withRetry ? '<button class="btn ghost" type="button" onclick="loadHistory()">ลองใหม่</button>' : ''}
    </div>`;
}

async function loadHistory() {
  const body = document.getElementById('history-body');
  body.innerHTML = '<div class="h-skel" aria-label="กำลังโหลด"><i></i><i></i><i></i><i></i></div>';

  if (!currentRoomNo) {
    body.innerHTML = historyMessage('ไม่พบข้อมูลห้อง', '', false);
    return;
  }

  try {
    const result = await callGAS('getLootHistory', { roomNo: currentRoomNo });
    if (!result.success) {
      body.innerHTML = historyMessage('โหลดประวัติไม่ได้', result.message || '', true);
      return;
    }
    renderHistory(result.history || []);
  } catch (e) {
    body.innerHTML = historyMessage('โหลดข้อมูลไม่ได้', 'กรุณาลองใหม่อีกครั้ง', true);
  }
}

function renderHistory(history) {
  const body = document.getElementById('history-body');

  if (!history.length) {
    body.innerHTML = historyMessage('ยังไม่มีประวัติการเปิดคูปอง', 'คูปองที่เปิดแล้วจะแสดงที่นี่', false);
    return;
  }

  body.innerHTML = history.map(h => {
    const total     = h.items.reduce((s, it) => s + (it.opened ? Number(it.amount) : 0), 0);
    const hasOpened = h.items.some(it => it.opened);

    const rows = h.items.map(it => {
      const meta = getTierMeta(it.tier);
      const amountHtml = it.opened
        ? `<span class="h-amount">฿${Number(it.amount).toLocaleString()}</span>`
        : `<span class="h-amount is-muted">ไม่ได้เปิด</span>`;
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

    const statusHtml = hasOpened
      ? `<span class="h-status ${h.applied ? 'applied' : ''}">${h.applied ? 'ตัดบิลแล้ว' : 'รอตัดบิล'}</span>`
      : '';

    const totalHtml = hasOpened
      ? `<div class="h-total">
           <span class="h-total-label">รวมส่วนลด</span>
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

async function init() {
  applyTier('Member'); // ค่าเริ่มต้นก่อนรู้ tier จริง

  const params = new URLSearchParams(window.location.search);
  const room   = params.get('room');
  const token  = params.get('token');
  const view   = params.get('view');

  startBtn.classList.add('hide'); // ปิดจนกว่าจะโหลดข้อมูลจริงเสร็จ

  if (room) {
    bootMode = 'room'; bootParam = room;
    tryRenderFromCache('room', room);
    await loadLootBoxForRoom(room);
  } else if (token) {
    bootMode = 'token'; bootParam = token;
    tryRenderFromCache('token', token);
    await loadLootBoxByToken(token);
  } else {
    await initLiff();
    if (liffReady && liff.isLoggedIn() && liffProfile) {
      bootMode = 'userId'; bootParam = liffProfile.userId;
      tryRenderFromCache('userId', liffProfile.userId);
      await loadLootBoxByUserId(liffProfile.userId);
    } else {
      showError('ไม่พบข้อมูลห้อง');
    }
  }

  if (view === 'history' && currentRoomNo) {
    openHistoryOverlay();
  }

  removeBootMask();
}

async function reloadLootBoxData() {
  if (bootMode === 'room') await loadLootBoxForRoom(bootParam);
  else if (bootMode === 'token') await loadLootBoxByToken(bootParam);
  else if (bootMode === 'userId') await loadLootBoxByUserId(bootParam);
  else showError('ไม่พบข้อมูลห้อง');
}

init();
