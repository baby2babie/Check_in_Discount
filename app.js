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
  refreshWheelColors();
  if (wheelCtx && wheelValues.length) drawWheel();
}

// ตัวเลขล่อ (decoy) โชว์บนวงล้อระหว่างหมุน — คือชุดค่า discount_amount ที่ไม่ซ้ำกันทั้งหมดจากชีท LOOT_BOX จริง
// (ครบทุก tier/milestone พอดี 7 ค่า = จำนวนช่องบนวงล้อพอดี) การันตีว่ารางวัลจริงที่ backend ส่งมาตอนจบ
// จะเป็นหนึ่งใน 7 ค่านี้เสมอ
const CAPSULE_NUMBERS = [5, 10, 15, 20, 25, 30, 50];
const N_CAPS = 7;

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
const wheelSpinBtn = document.getElementById('wheelSpinBtn');
const wheelCanvas  = document.getElementById('wheelCanvas');
const wheelCtx     = wheelCanvas.getContext('2d');
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
//  SUSPENSE REVEAL — วงล้อเปิดคูปอง
//  1 รอบ = 1 กล่อง (stock[0]) — ยิง openLootBox จริง "ตอนผู้เล่นกดหมุน" (ไม่ใช่ตอนกดเริ่ม)
//  ถ้าผู้เล่นยังไม่กดหมุน/ปิดหน้าไปก่อน คูปองจะยังไม่ถูกใช้ กลับมาเล่นใหม่ได้
//  ตัวเลขบนวงล้อระหว่างหมุนเป็นแค่ตัวล่อ (CAPSULE_NUMBERS) รางวัลจริงเฉลยจาก backend ตอนวงล้อหยุดเท่านั้น
// ============================================================
let wheelValues = [];       // ตัวเลขล่อ 7 ค่าที่สับตำแหน่งไว้บนวงล้อรอบนี้
let wheelRotation = 0;      // มุมหมุนปัจจุบัน (เรเดียน)
let wheelSize = 0;          // ขนาดจริง (css px) ของ canvas — คำนวณใหม่จาก .board ผ่าน layoutWheel()
let wheelLoopHandle = null; // requestAnimationFrame handle ของช่วงหมุนวนไม่ทราบผล
let wheelColors = { paper: '#FFFFFF', pas: '#EAF3EF', ink: '#1C2320', inkTier: '#2F6553', tier: '#4E8F78', line: 'rgba(28,35,32,.12)' };

function refreshWheelColors() {
  const cs = getComputedStyle(document.documentElement);
  wheelColors = {
    paper:   cs.getPropertyValue('--paper').trim()   || wheelColors.paper,
    pas:     cs.getPropertyValue('--pas').trim()     || wheelColors.pas,
    ink:     cs.getPropertyValue('--ink').trim()     || wheelColors.ink,
    inkTier: cs.getPropertyValue('--tier-ink').trim()|| wheelColors.inkTier,
    tier:    cs.getPropertyValue('--tier').trim()    || wheelColors.tier,
    line:    cs.getPropertyValue('--line').trim()    || wheelColors.line,
  };
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ขนาด canvas ผูกกับความกว้างจริงของบอร์ด (รองรับ retina ผ่าน devicePixelRatio) — เรียกตอน build และตอน resize
function layoutWheel() {
  const size = board.clientWidth * 0.88; // ตรงกับ width 88% ใน .wheel-canvas
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
  const r = wheelSize / 2 - 3;
  const n = wheelValues.length;
  if (!n) return;
  const slice = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, wheelSize, wheelSize);
  for (let i = 0; i < n; i++) {
    const start = wheelRotation + i * slice;
    const end = start + slice;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, r, start, end);
    ctx.closePath();
    ctx.fillStyle = (i % 2 === 0) ? wheelColors.paper : wheelColors.pas;
    ctx.fill();

    if (i === highlightIdx) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = wheelColors.tier;
      ctx.fill();
      ctx.restore();
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = wheelColors.line;
    ctx.stroke();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = (i % 2 === 0) ? wheelColors.ink : wheelColors.inkTier;
    const fontSize = Math.max(14, Math.min(22, wheelSize * 0.055));
    ctx.font = '300 ' + fontSize + 'px "Anuphan","Sarabun",sans-serif';
    ctx.fillText(wheelValues[i] + '฿', r - 14, fontSize * 0.32);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(center, center, r, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = wheelColors.tier;
  ctx.stroke();
}

// สับตัวเลขล่อใหม่ 1 ชุดสำหรับรอบนี้ — ใช้ทั้งพรีวิวตอน idle และตอนเริ่มเล่นจริง
function buildWheelValues() {
  wheelValues = shuffleArray([...CAPSULE_NUMBERS]);
  wheelRotation = 0;
  layoutWheel();
  refreshWheelColors();
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

// หมุนวนต่อเนื่องระหว่างที่ยังไม่รู้ผลจริงจาก backend (ไม่ทราบเป้าหมาย จึงหมุนด้วยความเร็วคงที่)
function startContinuousSpin() {
  let last = null;
  let velocity = 0;
  const maxVel = 0.011;   // เรเดียน/ms ความเร็วสูงสุด
  const accel = 0.00002;  // เร่งความเร็วช่วงแรก
  function loop(ts) {
    if (last == null) last = ts;
    const dt = ts - last; last = ts;
    velocity = Math.min(maxVel, velocity + accel * dt);
    wheelRotation += velocity * dt;
    drawWheel();
    wheelLoopHandle = requestAnimationFrame(loop);
  }
  wheelLoopHandle = requestAnimationFrame(loop);
}
function stopContinuousSpin() {
  if (wheelLoopHandle) cancelAnimationFrame(wheelLoopHandle);
  wheelLoopHandle = null;
}

// หมุนวนรอผลจริงจาก backend อย่างน้อย MIN_SPIN_MS (กันดูเหมือนหยุดกึกทันทีถ้า backend ตอบไวเกินไป)
async function spinWhileWaiting(apiPromise) {
  startContinuousSpin();
  const MIN_SPIN_MS = 1800;
  const [result] = await Promise.all([apiPromise, wait(MIN_SPIN_MS)]);
  return result;
}

// เมื่อรู้ผลจริงแล้ว — หยุดหมุนวนแล้วเข้าสู่ช่วงชะลอไปหยุดที่ช่องตรงกับรางวัลจริง
async function landOnAmount(amount) {
  stopContinuousSpin();

  let targetIndex = wheelValues.indexOf(amount);
  if (targetIndex === -1) {
    // เผื่อ backend ส่งค่านอกชุดตัวเลขล่อ (ไม่ควรเกิดตามปกติ) — สุ่มช่องแล้วสลับให้โชว์ค่าจริงตอนจะหยุด
    targetIndex = Math.floor(Math.random() * wheelValues.length);
    wheelValues[targetIndex] = amount;
  }

  const n = wheelValues.length;
  const slice = (Math.PI * 2) / n;
  const pointerAngle = -Math.PI / 2;
  const targetCenter = targetIndex * slice + slice / 2;
  const extraSpins = 3 + Math.floor(Math.random() * 2);
  const finalRotation = pointerAngle - targetCenter + Math.PI * 2 * extraSpins;

  const startRotation = wheelRotation;
  const delta = finalRotation - (startRotation % (Math.PI * 2));
  const duration = 2600;
  const power = 4.2 + Math.random() * 0.8;
  const easeOut = t => 1 - Math.pow(1 - t, power);

  await new Promise(resolve => {
    let startTime = null;
    function frame(ts) {
      if (!startTime) startTime = ts;
      const t = Math.min(1, (ts - startTime) / duration);
      wheelRotation = startRotation + delta * easeOut(t);
      drawWheel(currentSliceIndex());
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
      drawWheel(targetIndex);
      if (t < 1) requestAnimationFrame(frame);
      else { wheelRotation = base; drawWheel(targetIndex); resolve(); }
    }
    requestAnimationFrame(frame);
  });
}

// รอผู้เล่นกดหมุน (แตะปุ่ม "หมุนเลย" หรือแตะที่ตัววงล้อเอง) ก่อนจะยิง backend จริง
function enableSpinTap() {
  return new Promise(resolve => {
    wheelSpinBtn.classList.remove('hide');
    wheelCanvas.style.cursor = 'pointer';
    setPhase(1);
    setTitle('พร้อมหมุนแล้ว');
    setHint('แตะวงล้อหรือกดหมุนเพื่อลุ้นส่วนลด');
    function commit() {
      wheelSpinBtn.removeEventListener('click', commit);
      wheelCanvas.removeEventListener('click', commit);
      wheelSpinBtn.classList.add('hide');
      wheelCanvas.style.cursor = 'default';
      resolve();
    }
    wheelSpinBtn.addEventListener('click', commit, { once: true });
    wheelCanvas.addEventListener('click', commit, { once: true });
  });
}

// เล่น 1 รอบเต็ม: สับเลขล่อ → รอผู้เล่นกดหมุน → ยิง backend จริง → หมุนวนรอผล → ชะลอไปหยุดที่ผลจริง → เฉลย
async function playRound(milestone, requestOpen) {
  setState('play');
  buildWheelValues();
  ticket.classList.remove('show');
  claimBtn.classList.remove('show');

  await enableSpinTap();

  // ผู้เล่นกดหมุนแล้ว — ตอนนี้เท่านั้นที่ส่งคำขอเปิดคูปองจริง
  const apiPromise = requestOpen();

  setPhase(2);
  setTitle('กำลังหมุน...');
  setHint('');

  const result = await spinWhileWaiting(apiPromise);

  if (!result || !result.success) {
    stopContinuousSpin();
    return { success: false, result };
  }

  const amount = Number(result.discount_amount) || 0;
  await landOnAmount(amount);

  setTitle('มาดูกันว่าได้เท่าไหร่');
  await wait(150);

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
  stopContinuousSpin();
  setState('result');
  setPhase(2);
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
  stopContinuousSpin();

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
