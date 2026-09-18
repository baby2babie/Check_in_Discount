// ============================================================
//  คูปองส่วนลด — app.js (Suspense Reveal Edition / cleaned)
//  โครง backend / LIFF / cache / history — logic เดิม
//  ที่แก้: การหมุนคิดตามเวลาจริง, ตัด busy-wait, จัดการ state error,
//          ตัด dead code, ผูก event ใน JS แทน inline onclick
// ============================================================

'use strict';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbx580dyPfzslsut-QGtLrRHCt0Hdv9AscR3OfZF0ZTKYKfKETTKF9DAI7e6wXyhEvYlBw/exec';
const LIFF_ID = '2004478373-aQPYZEpt';

// milestone → ชื่อคูปอง (ใช้แสดงในป้าย/ประวัติ)
const LB_CONFIG = [
  { milestone: 7,  name: 'คูปอง · SILVER',   tier: 'silver' },
  { milestone: 14, name: 'คูปอง · GOLD',     tier: 'gold'   },
  { milestone: 21, name: 'คูปอง · PLATINUM', tier: 'plat'   },
  { milestone: 28, name: 'คูปอง · LEGEND',   tier: 'legend' },
];
const TIER_COLORS = { silver:'#94A3B8', gold:'#F59E0B', plat:'#A78BFA', legend:'#EF4444', paid:'#C084FC' };

// PAID ได้จากจ่ายบิล มักได้เร็วกว่าเช็คอินครบ 7 วัน จึงอยู่หัวคิว
const BOX_ORDER = ['PAID', 7, 14, 21, 28];

// ============================================================
//  DOM refs (สคริปต์โหลดแบบ defer — DOM พร้อมแล้วแน่นอน)
// ============================================================
const revealCard     = document.getElementById('revealCard');
const plateText      = document.getElementById('plateText');
const instruction    = document.getElementById('instruction');
const stockCount     = document.getElementById('stockCount');
const retryBtn       = document.getElementById('retryBtn');
const cabRoomBadge   = document.getElementById('cabRoomBadge');
const screenFlash    = document.getElementById('screenFlash');
const confettiLayer  = document.getElementById('confettiLayer');

const board       = document.getElementById('board');
const headline    = document.getElementById('headline');
const eyebrowText = document.getElementById('eyebrowText');
const titleText   = document.getElementById('titleText');
const hint        = document.getElementById('hint');
const ticket      = document.getElementById('ticket');
const ticketAmt   = document.getElementById('ticketAmount');
const ticketDesc  = document.getElementById('ticketDesc');
const claimBtn    = document.getElementById('claimBtn');
const startBtn    = document.getElementById('startBtn');

const historyBtn     = document.getElementById('btn-history');
const historyClose   = document.getElementById('btn-history-close');
const historyOverlay = document.getElementById('history-overlay');
const historyBody    = document.getElementById('history-body');
const toastEl        = document.getElementById('toast');

// ============================================================
//  STATE
// ============================================================
let liffReady        = false;
let liffProfile      = null;
let redirecting      = false;   // กำลัง redirect ไป LINE login — อย่าโชว์ error ทับ
let currentRoomNo    = null;
let currentTierLabel = null;

let stock      = [];    // milestone keys (string) ที่ยังเปิดได้ เรียงตามลำดับเปิด
let lootTokens = {};    // { "7": token, "PAID": token, ... }
let busy       = true;  // true ตอนกำลังโหลด / กำลังเล่นรอบอยู่
let hasError   = false; // การ์ดอยู่ในสถานะ error — ห้ามเปิดปุ่ม start ทับ

let bootMode  = null;   // 'room' | 'token' | 'userId'
let bootParam = null;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ============================================================
//  THEME — tier palette
// ============================================================
const THEME = {
  Member:   { bg:'#ECFDF5', border:'#A7F3D0', text:'#065F46', accent:'#10B981', deep:'#047857' },
  Silver:   { bg:'#EFF6FF', border:'#BFDBFE', text:'#1E40AF', accent:'#3B82F6', deep:'#1D4ED8' },
  Gold:     { bg:'#FEFCE8', border:'#FDE047', text:'#854D0E', accent:'#EAB308', deep:'#B45309' },
  Platinum: { bg:'#FAF5FF', border:'#E9D5FF', text:'#6B21A8', accent:'#A855F7', deep:'#7E22CE' },
  Diamond:  { bg:'#ECFEFF', border:'#A5F3FC', text:'#164E63', accent:'#06B6D4', deep:'#0E7490' },
  Legend:   { bg:'#FFF1F2', border:'#FECDD3', text:'#9F1239', accent:'#F43F5E', deep:'#BE123C' },
};

function applyTier(tierLabel) {
  const t = THEME[tierLabel] || THEME.Member;
  const root = document.documentElement.style;
  root.setProperty('--cap-soft', t.border);
  root.setProperty('--cap-mid', t.accent);
  root.setProperty('--cap-deep', t.deep);
  root.setProperty('--result-text', t.text);
  root.setProperty('--result-accent', t.accent);
  root.setProperty('--result-border', t.border);
  root.setProperty('--result-bg', t.bg);
}

// ============================================================
//  GAME CONFIG
// ============================================================
// ตัวเลขล่อ (decoy) โชว์บนการ์ดระหว่างเกม — ไม่ใช่รางวัลจริง
// รางวัลจริงมาจาก backend หลัง openLootBox เท่านั้น
const CAPSULE_NUMBERS = [20, 30, 40, 50, 60, 70, 80, 100];
const N_CAPS = Math.min(7, CAPSULE_NUMBERS.length);
const RADIUS = 78;

// จังหวะเกม (ms) — ปรับที่เดียวได้ทั้งเกม
const T = prefersReducedMotion
  ? { memorize: 900, closeHold: 200, shuffle: 600, revealStep: 160, fadeOut: 250, toCenter: 250 }
  : { memorize: 2600, closeHold: 420, shuffle: 5400, revealStep: 380, fadeOut: 700, toCenter: 700 };

const SPIN_SPEED = 215;   // องศา/วินาที — คิดตามเวลาจริง ไม่ผูกกับ refresh rate
const CONFETTI_MIN_AMOUNT = 70;

// ============================================================
//  UTIL
// ============================================================
const wait = ms => new Promise(r => setTimeout(r, ms));

function withTimeout(promise, ms, fallback) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise(resolve => { timer = setTimeout(() => resolve(fallback), ms); }),
  ]);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
  ));
}

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function callGAS(action, params = {}, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...params }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function callGASWithRetry(action, params, retries = 1, delayMs = 1200, timeoutMs = 10000) {
  try {
    return await callGAS(action, params, timeoutMs);
  } catch (e) {
    if (retries > 0) {
      await wait(delayMs);
      return callGASWithRetry(action, params, retries - 1, delayMs, timeoutMs);
    }
    throw e;
  }
}

let toastTimer = null;
function showToast(msg, type = 'success', duration = 3000) {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.className = 'toast ' + type;
  toastTimer = setTimeout(() => { toastEl.className = 'toast'; }, duration);
}

function showError(msg, retryable = false) {
  hasError = true;
  busy = true;
  instruction.textContent = msg;
  stockCount.textContent = '';
  plateText.textContent = 'ไม่พร้อมใช้งาน';
  startBtn.classList.add('hide');
  revealCard.classList.add('is-error');
  retryBtn.classList.toggle('show', retryable);
}

// ============================================================
//  CACHE (sessionStorage) — stale-while-revalidate
// ============================================================
const CACHE_MAX_AGE_MS = 30 * 60 * 1000;
const cacheKey = (mode, param) => `gacha_cache_${mode}_${param}`;

function saveCacheSnapshot(result) {
  if (!bootMode || !bootParam) return;
  try {
    sessionStorage.setItem(cacheKey(bootMode, bootParam), JSON.stringify({ result, ts: Date.now() }));
  } catch (e) {
    // sessionStorage เต็ม/ถูกบล็อก (private mode) — ไม่ critical
  }
}

function tryRenderFromCache(mode, param) {
  try {
    const raw = sessionStorage.getItem(cacheKey(mode, param));
    if (!raw) return false;
    const { result, ts } = JSON.parse(raw);
    if (!result || Date.now() - ts > CACHE_MAX_AGE_MS) return false;
    applyRoomData(result);
    instruction.textContent = 'กำลังซิงค์ข้อมูลล่าสุด...';
    removeBootMask();
    return true;
  } catch (e) {
    return false;
  }
}

// ============================================================
//  LABELS / STATE VIEW
// ============================================================
function boxNameFor(milestone) {
  if (String(milestone) === 'PAID') return 'คูปอง · BONUS';
  const cfg = LB_CONFIG.find(c => c.milestone === Number(milestone));
  return cfg ? cfg.name : 'คูปอง · MYSTERY';
}

function updatePlateText() {
  plateText.textContent = stock.length ? boxNameFor(stock[0]) : 'เปิดครบแล้วตอนนี้';
}

function updateStockCount() {
  stockCount.textContent = stock.length
    ? `เปิดได้อีก ${stock.length} สิทธิ์`
    : 'ไม่มีสิทธิ์เปิดคูปองตอนนี้';
}

function updateStartState() {
  if (hasError) return; // อย่าเปิดปุ่ม start ทับสถานะ error
  if (stock.length > 0) {
    startBtn.classList.remove('hide');
    titleText.textContent = 'แตะปุ่มด้านล่างเพื่อเริ่ม';
    eyebrowText.textContent = boxNameFor(stock[0]);
    instruction.textContent = 'แตะปุ่มด้านล่างเพื่อลุ้นรางวัล';
  } else {
    startBtn.classList.add('hide');
    titleText.textContent = 'เปิดครบแล้วตอนนี้';
    eyebrowText.textContent = 'ไม่มีคูปองให้เปิดในตอนนี้';
    instruction.textContent = '';
  }
}

// ============================================================
//  EFFECTS
// ============================================================
function spawnConfetti(count) {
  const colors = ['var(--gold)', 'var(--red-light)', '#D9C4FF', '#BFF3E1', '#C6E6FF', '#FFE39A'];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    const w = 6 + Math.random() * 6;
    p.style.width = w + 'px';
    p.style.height = w * (1.3 + Math.random() * 0.6) + 'px';
    p.style.left = (Math.random() * 100) + 'vw';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = (2 + Math.random() * 1.4) + 's';
    p.style.animationDelay = (Math.random() * 0.5) + 's';
    p.addEventListener('animationend', () => p.remove(), { once: true });
    frag.appendChild(p);
  }
  confettiLayer.appendChild(frag);
}

function spawnSparks() {
  const cs = getComputedStyle(document.documentElement);
  const colors = [
    cs.getPropertyValue('--cap-mid').trim(),
    cs.getPropertyValue('--cap-deep').trim(),
    cs.getPropertyValue('--cap-soft').trim(),
    '#D85A30',
  ];
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div');
    p.className = 'spark';
    p.style.background = colors[i % colors.length];
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    board.appendChild(p);

    const ang = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 100;
    if (typeof p.animate === 'function') {
      const anim = p.animate([
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist - 50}%, ${Math.sin(ang) * dist - 50}%) rotate(${Math.random() * 360}deg) scale(.4)`, opacity: 0 },
      ], { duration: 950 + Math.random() * 400, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' });
      anim.finished.then(() => p.remove(), () => p.remove());
    } else {
      setTimeout(() => p.remove(), 1200);
    }
  }
}

function flashScreen() {
  screenFlash.classList.remove('go');
  void screenFlash.offsetWidth; // force reflow ให้ animation เล่นซ้ำได้
  screenFlash.classList.add('go');
}

// ============================================================
//  SUSPENSE REVEAL — เกมคูปองส่วนลด
//  1 รอบ = 1 กล่อง (stock[0]) — ยิง openLootBox จริงพร้อมกับเล่นแอนิเมชัน
// ============================================================
let capEls = [];
let currentOrder = [];
let ringRotation = 0;

function buildBoard() {
  board.querySelectorAll('.cap, .spark').forEach(el => el.remove());
  const decoys = shuffled(CAPSULE_NUMBERS).slice(0, N_CAPS);
  capEls = decoys.map(amount => {
    const el = document.createElement('div');
    el.className = 'cap';
    el.dataset.decoy = amount;
    el.innerHTML = `
      <div class="cap-shadow"></div>
      <div class="cap-body">
        <div class="cap-face">
          <div class="cap-shine"></div>
          <div class="cap-percent">฿</div>
        </div>
        <div class="cap-label show">${amount}฿</div>
      </div>`;
    board.appendChild(el);
    return el;
  });
  currentOrder = capEls.map((_, i) => i);
  ringRotation = 0;
  renderRing();
}

const slotAngle = s => (360 / N_CAPS) * s - 90 + ringRotation;

function renderRing() {
  for (let i = 0; i < capEls.length; i++) {
    const el = capEls[i];
    if (el.classList.contains('to-center') || el.classList.contains('centered')) continue;
    const rad = slotAngle(currentOrder[i]) * Math.PI / 180;
    el.style.transform =
      `translate3d(${(Math.cos(rad) * RADIUS).toFixed(2)}px, ${(Math.sin(rad) * RADIUS).toFixed(2)}px, 0)`;
  }
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

function closeCaps() {
  capEls.forEach(el => {
    const label = el.querySelector('.cap-label');
    label.classList.remove('show');
    label.textContent = ''; // เอาตัวเลขออกจากผิวการ์ดจริง ไม่ใช่แค่ซ่อนด้วยความจาง
    el.querySelector('.cap-percent').classList.add('show');
  });
  titleText.textContent = 'ปิดแล้ว... เตรียมสลับ!';
}

// หมุนวงแหวนแบบคิดตามเวลาจริง (delta time) — ความเร็วเท่ากันทุกเครื่อง
function spinSegment(dur, dir) {
  return new Promise(resolve => {
    if (prefersReducedMotion) {
      ringRotation += 40 * dir;
      renderRing();
      setTimeout(resolve, dur);
      return;
    }
    board.classList.add('spinning');
    let last = performance.now();
    const start = last;
    const loop = now => {
      const dt = Math.min(now - last, 50) / 1000; // เผื่อกรณีสลับแท็บกลับมา
      last = now;
      ringRotation = (ringRotation + SPIN_SPEED * dir * dt) % 360;
      renderRing();
      if (now - start < dur) requestAnimationFrame(loop);
      else { board.classList.remove('spinning'); resolve(); }
    };
    requestAnimationFrame(loop);
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
const oppositeSwap = () => { const h = Math.floor(N_CAPS / 2); for (let s = 0; s < h; s++) swapSlots(s, s + h); };
const mirrorFlip   = () => { for (let s = 0; s < Math.floor(N_CAPS / 2); s++) swapSlots(s, N_CAPS - 1 - s); };
const scrambleJump = () => { currentOrder = shuffled([...Array(N_CAPS).keys()]).slice(0, capEls.length); };
const splitCounter = () => {
  const h = Math.floor(N_CAPS / 2);
  for (let s = 0; s < h; s++) swapSlots(s, (s + 1) % h);
  for (let s = h; s < N_CAPS; s++) {
    const rel = s - h, len = N_CAPS - h;
    swapSlots(s, h + ((rel - 1 + len) % len));
  }
};
const rotateBy = k => () => {
  const occ = slotOccupants();
  const newOrder = new Array(N_CAPS);
  for (let s = 0; s < N_CAPS; s++) {
    const box = occ[s];
    if (box !== undefined) newOrder[box] = ((s + k) % N_CAPS + N_CAPS) % N_CAPS;
  }
  currentOrder = newOrder;
};

const SHUFFLE_PATTERNS = [
  adjacentSwap, oppositeSwap, mirrorFlip, scrambleJump, splitCounter,
  rotateBy(2), rotateBy(3), rotateBy(-2),
];

async function startShuffle() {
  titleText.textContent = 'กำลังสลับ... ตามให้ทัน!';
  let elapsed = 0;
  while (elapsed < T.shuffle) {
    if (Math.random() < 0.45) {
      const dur = 600 + Math.random() * 500;
      await spinSegment(dur, Math.random() > 0.5 ? 1 : -1);
      elapsed += dur;
    } else {
      await settle(SHUFFLE_PATTERNS[Math.floor(Math.random() * SHUFFLE_PATTERNS.length)]);
      elapsed += 560;
    }
  }
}

function enablePicking() {
  return new Promise(resolve => {
    const ctrl = new AbortController();
    titleText.textContent = 'เลือกการ์ดของคุณ';
    hint.textContent = 'แตะการ์ดที่คุณคิดว่าใช่';

    capEls.forEach((el, i) => {
      el.classList.add('pickable');
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', `เลือกการ์ดใบที่ ${i + 1}`);

      const pick = () => {
        ctrl.abort(); // ตัด listener ทุกใบพร้อมกัน ไม่ทิ้ง handler ค้าง
        capEls.forEach(c => {
          c.classList.remove('pickable');
          c.removeAttribute('role');
          c.removeAttribute('tabindex');
          c.removeAttribute('aria-label');
        });
        resolve(el);
      };

      el.addEventListener('click', pick, { signal: ctrl.signal });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      }, { signal: ctrl.signal });
    });
  });
}

// เล่น 1 รอบเต็ม: โชว์การ์ดล่อ → ปิด → สลับ → ให้เลือก → เฉลยใบอื่น → เข้ากลาง → รอผลจริง → เปิด
async function playRound(milestone, apiPromise) {
  buildBoard();
  ticket.classList.remove('show');
  ticket.setAttribute('aria-hidden', 'true');
  claimBtn.classList.remove('show');
  headline.classList.remove('dim');
  hint.textContent = '';
  eyebrowText.textContent = boxNameFor(milestone);
  titleText.textContent = 'จำตำแหน่งส่วนลดให้ดี';

  await wait(T.memorize);
  closeCaps();
  await wait(T.closeHold);
  await startShuffle();

  const chosen = await enablePicking();
  hint.textContent = '';
  chosen.classList.add('marked');

  titleText.textContent = 'มาดูใบที่คุณไม่ได้เลือกกัน...';
  await wait(600);

  // เฉลยใบที่ไม่ถูกเลือก เรียงตามตำแหน่งบนวง เพื่อให้ตาไล่ตามได้
  const others = capEls
    .filter(el => el !== chosen)
    .sort((a, b) => currentOrder[capEls.indexOf(a)] - currentOrder[capEls.indexOf(b)]);

  for (const el of others) {
    const label = el.querySelector('.cap-label');
    el.querySelector('.cap-percent').classList.remove('show');
    label.textContent = el.dataset.decoy + '฿';
    el.classList.add('revealed-miss', 'pop');
    label.classList.add('show');
    await wait(T.revealStep);
    el.classList.remove('pop');
  }

  await wait(600);
  titleText.textContent = 'เหลือใบของคุณใบเดียว...';
  others.forEach(el => el.classList.add('faded'));
  await wait(T.fadeOut);
  others.forEach(el => el.classList.add('gone'));

  await wait(280);
  titleText.textContent = 'มาดูกันว่าได้เท่าไหร่...';
  chosen.classList.add('to-center');
  chosen.style.transform = 'translate3d(0,0,0)';
  await wait(T.toCenter);
  chosen.classList.add('centered', 'scaled');
  await wait(320);

  // ── รอผลจริงจาก backend — ถ้ายังไม่มาก็สั่นลุ้นต่อ (ไม่ต้อง poll แล้ว) ──
  chosen.classList.add('waiting');
  const result = await apiPromise;
  chosen.classList.remove('waiting');

  if (!result || !result.success) return { success: false, result };

  headline.classList.add('dim');
  chosen.classList.add('open');
  spawnSparks();
  flashScreen();
  await wait(420);

  showTicket(Number(result.discount_amount) || 0);
  return { success: true, result };
}

function showTicket(amount) {
  ticketAmt.textContent = amount;
  ticketDesc.textContent = 'ส่วนลดเข้ารอบบิลถัดไปอัตโนมัติ';
  ticket.classList.add('show');
  ticket.setAttribute('aria-hidden', 'false');
  claimBtn.classList.add('show');
  if (amount >= CONFETTI_MIN_AMOUNT && !prefersReducedMotion) {
    setTimeout(() => spawnConfetti(24), 150);
  }
}

// แสดงผลแบบเร็ว (ไม่เล่นเกมใหม่) — ใช้ตอนกู้คืนผลที่เปิดสำเร็จไปแล้วจริง
function showQuickTicket(milestone, amount) {
  buildBoard();
  capEls.forEach(el => el.classList.add('gone'));
  eyebrowText.textContent = boxNameFor(milestone);
  titleText.textContent = 'กล่องนี้เปิดไปแล้ว — นี่คือรางวัลที่ได้รับ';
  hint.textContent = '';
  headline.classList.add('dim');
  showTicket(Number(amount) || 0);
}

// ============================================================
//  ROUND FLOW
// ============================================================
const SOFT_TIMEOUT_MS = 4000;
const HARD_TIMEOUT_MS = 12000;

async function startRound() {
  if (busy) return;                 // กันกดซ้ำ/กดระหว่างโหลด
  if (stock.length === 0) {
    instruction.textContent = 'ไม่มีคูปองให้เปิดแล้วตอนนี้';
    return;
  }

  busy = true;
  startBtn.classList.add('hide');
  retryBtn.classList.remove('show');
  instruction.textContent = '';

  const milestone = stock[0];
  const token = lootTokens[milestone];

  // request จริง — ไม่ถูกยกเลิกแม้ UI จะแจ้งว่า "ช้า" แล้ว
  const realPromise = callGAS('openLootBox', { token, tierLabel: currentTierLabel }, 30000)
    .catch(err => {
      console.error('openLootBox failed:', err);
      return { success: false, message: 'เชื่อมต่อกับระบบไม่สำเร็จ' };
    });

  // แจ้งเตือน "ช้ากว่าปกติ" เฉพาะตอน request ยังไม่เสร็จจริง
  // (ของเดิมเช็คจาก busy ที่ true ตลอดช่วงแอนิเมชัน → เตือนเกือบทุกครั้ง)
  let settled = false;
  realPromise.then(() => { settled = true; });
  const softTimer = setTimeout(() => {
    if (!settled) showToast('เชื่อมต่อช้ากว่าปกติ กำลังรอผลอยู่...', 'error', 3000);
  }, SOFT_TIMEOUT_MS);
  realPromise.finally(() => clearTimeout(softTimer));

  const apiPromise = withTimeout(realPromise, HARD_TIMEOUT_MS, {
    success: false,
    message: 'ระบบช้าผิดปกติ กำลังซิงค์ข้อมูลใหม่ให้อัตโนมัติ',
    hardFail: true,
  });

  const outcome = await playRound(milestone, apiPromise);

  if (outcome.success) {
    stock.shift();
    delete lootTokens[milestone];
    updateStockCount();
    plateText.textContent = boxNameFor(milestone); // คงชื่อกล่องที่เพิ่งเปิดไว้จนกดเก็บรางวัล
    busy = false;
    return;
  }

  await recoverFromFailedOpen(milestone, outcome.result);
  busy = false;
}

// เปิดไม่สำเร็จ — sync ข้อมูลใหม่ แล้วเช็คว่าจริงๆ เปิดสำเร็จไปแล้วหรือเปล่า
async function recoverFromFailedOpen(milestone, result) {
  if (result && result.hardFail) {
    showToast('⏳ ระบบช้าผิดปกติ กำลังซิงค์ข้อมูลให้อัตโนมัติ...', 'error', 4000);
  } else {
    showToast('❌ ' + ((result && result.message) || 'เปิดไม่สำเร็จ'), 'error', 4000);
  }

  instruction.textContent = '🔄 กำลังซิงค์ข้อมูลใหม่...';
  headline.classList.remove('dim');
  ticket.classList.remove('show');
  ticket.setAttribute('aria-hidden', 'true');
  claimBtn.classList.remove('show');
  capEls.forEach(el => el.classList.add('gone'));

  await reloadLootBoxData();
  if (hasError) return; // reload ล้มเหลว — ปล่อยให้หน้า error กับปุ่มลองใหม่ทำงาน

  if (stock.includes(milestone)) {
    updateStartState(); // ยังไม่เปิดจริง — กลับสู่สถานะพร้อมเริ่มใหม่
    return;
  }

  // กล่องนี้หายจาก stock แล้ว = เปิดสำเร็จไปแล้วจริง — ดึงผลจริงมาโชว์
  try {
    const historyResult = await callGAS('getLootHistory', { roomNo: currentRoomNo });
    const matched = (historyResult.history || [])
      .flatMap(h => h.items || [])
      .find(it => String(it.tier) === String(milestone) && it.opened);

    if (matched) {
      showQuickTicket(milestone, matched.amount);
      return;
    }
  } catch (e) {
    console.warn('recover history lookup failed:', e);
  }

  showToast('🎁 กล่องนี้เปิดสำเร็จไปแล้ว กำลังเปิดหน้าประวัติให้ดูรางวัลที่ได้รับ', 'success', 6000);
  openHistoryOverlay();
  updateStartState();
}

claimBtn.addEventListener('click', () => {
  ticket.classList.remove('show');
  ticket.setAttribute('aria-hidden', 'true');
  claimBtn.classList.remove('show');
  headline.classList.remove('dim');
  updatePlateText();
  updateStockCount();
  updateStartState();
});

startBtn.addEventListener('click', startRound);

retryBtn.addEventListener('click', () => {
  retryBtn.classList.add('loading');
  instruction.textContent = 'กำลังลองเชื่อมต่อใหม่...';
  reloadLootBoxData().finally(() => retryBtn.classList.remove('loading'));
});

// ============================================================
//  RENDER จากข้อมูลจริง
// ============================================================
function updateRoomLabel(room) {
  cabRoomBadge.textContent = 'ห้อง ' + room;
  currentRoomNo = room;
  historyBtn.classList.add('show');
}

function applyRoomData(result) {
  revealCard.classList.remove('is-error');
  hasError = false;
  retryBtn.classList.remove('show');

  if (result.roomNo) updateRoomLabel(result.roomNo);
  if (result.tierLabel) { currentTierLabel = result.tierLabel; applyTier(currentTierLabel); }

  stock = [];
  lootTokens = {};
  const boxes = result.boxes || {};
  BOX_ORDER.forEach(m => {
    const info = boxes[m] || {};
    if (info.token && !info.opened) {
      const key = String(m);
      stock.push(key);
      lootTokens[key] = info.token;
    }
  });

  updatePlateText();
  updateStockCount();
}

function renderCabinet(result) {
  applyRoomData(result);
  busy = false;
  updateStartState();
  saveCacheSnapshot(result);
}

const DATA_FETCH_TIMEOUT_MS = 18000;

async function loadLootBox(action, params, failMsg) {
  try {
    const result = await callGASWithRetry(action, params, 1, 1200, DATA_FETCH_TIMEOUT_MS);
    if (!result.success) { showError('❌ ' + (result.message || failMsg), true); return; }
    renderCabinet(result);
  } catch (e) {
    console.error(action + ' failed:', e);
    showError('❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ', true);
  }
}

async function reloadLootBoxData() {
  if (bootMode === 'room')        await loadLootBox('getLootBoxDataByRoom', { roomNo: bootParam }, 'โหลดไม่ได้');
  else if (bootMode === 'token')  await loadLootBox('getLootBoxData', { token: bootParam }, 'Token ไม่ถูกต้อง');
  else if (bootMode === 'userId') await loadLootBox('getLootBoxData', { userId: bootParam }, 'โหลดไม่ได้');
  else showError('❌ ไม่พบข้อมูลห้อง');
}

// ============================================================
//  BOOT SOFT-NOTICE — แจ้งว่า "กำลังรอ" ไม่ใช่ "ค้าง"
// ============================================================
const BOOT_SOFT_NOTICE_MS = 4000;

function showBootSoftNotice() {
  const boot = document.getElementById('boot-mask');
  if (!boot || !boot.isConnected) return;
  let notice = document.getElementById('boot-soft-notice');
  if (!notice) {
    notice = document.createElement('div');
    notice.id = 'boot-soft-notice';
    notice.className = 'boot-notice';
    boot.appendChild(notice);
  }
  notice.textContent = 'เชื่อมต่อช้ากว่าปกติ กำลังรอผลอยู่...';
}

async function withBootSoftNotice(fn) {
  const timer = setTimeout(showBootSoftNotice, BOOT_SOFT_NOTICE_MS);
  try {
    return await fn();
  } finally {
    clearTimeout(timer);
    const notice = document.getElementById('boot-soft-notice');
    if (notice) notice.remove();
  }
}

function removeBootMask() {
  const boot = document.getElementById('boot-mask');
  if (!boot || boot.classList.contains('fade-out')) return;
  boot.classList.add('fade-out');
  setTimeout(() => boot.remove(), 350);
}

// ============================================================
//  LIFF
// ============================================================
async function initLiff() {
  try {
    await liff.init({ liffId: LIFF_ID, withLoginOnExternalBrowser: true });
    liffReady = true;
    if (!liff.isLoggedIn()) {
      redirecting = true;
      liff.login({ redirectUri: location.href });
      return;
    }
    liffProfile = await liff.getProfile();
  } catch (e) {
    console.warn('LIFF init failed:', e);
    liffReady = false;
  }
}

// ============================================================
//  HISTORY
// ============================================================
const TH_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                   'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

function formatMonthLabel(monthKey) {
  const [y, m] = String(monthKey).split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) return String(monthKey);
  return `${TH_MONTHS[m - 1]} ${y + 543}`;
}

function getTierMeta(tierRaw) {
  if (String(tierRaw).trim() === 'PAID') return { name: 'PAID BONUS', color: TIER_COLORS.paid };
  const cfg = LB_CONFIG.find(c => c.milestone === Number(tierRaw));
  if (cfg) return { name: cfg.name, color: TIER_COLORS[cfg.tier] };
  return { name: 'ไม่ทราบ', color: '#8B929C' };
}

function openHistoryOverlay() {
  historyOverlay.classList.add('active');
  document.body.classList.add('no-scroll');
  historyClose.focus({ preventScroll: true });
  loadHistory();
}

function closeHistoryOverlay() {
  historyOverlay.classList.remove('active');
  document.body.classList.remove('no-scroll');
}

historyBtn.addEventListener('click', openHistoryOverlay);
historyClose.addEventListener('click', closeHistoryOverlay);
historyOverlay.addEventListener('click', e => {
  if (e.target === historyOverlay) closeHistoryOverlay(); // แตะฉากหลังเพื่อปิด
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && historyOverlay.classList.contains('active')) closeHistoryOverlay();
});

let historyRequestId = 0;
async function loadHistory() {
  const reqId = ++historyRequestId; // กันผลเก่ามาทับตอนเปิด-ปิดรัวๆ
  historyBody.innerHTML = '<div class="loading">กำลังโหลด...</div>';

  if (!currentRoomNo) {
    historyBody.innerHTML = '<div class="loading">❌ ไม่พบข้อมูลห้อง</div>';
    return;
  }

  try {
    const result = await callGAS('getLootHistory', { roomNo: currentRoomNo });
    if (reqId !== historyRequestId) return;
    if (!result.success) {
      historyBody.innerHTML = `<div class="loading">❌ ${escapeHtml(result.message || 'โหลดไม่ได้')}</div>`;
      return;
    }
    renderHistory(result.history || []);
  } catch (e) {
    if (reqId !== historyRequestId) return;
    historyBody.innerHTML = '<div class="loading">❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ</div>';
  }
}

function renderHistory(history) {
  if (!history.length) {
    historyBody.innerHTML = '<div class="loading">ยังไม่มีประวัติการเปิดคูปองส่วนลดครับ</div>';
    return;
  }

  historyBody.innerHTML = history.map(h => {
    const items = h.items || [];
    const total = items.reduce((s, it) => s + (it.opened ? Number(it.amount) || 0 : 0), 0);
    const hasOpened = items.some(it => it.opened);

    const itemsHtml = items.map(it => {
      const meta = getTierMeta(it.tier);
      const amountHtml = it.opened
        ? `<span class="history-item-amount">฿${(Number(it.amount) || 0).toLocaleString()}</span>`
        : '<span class="history-item-amount not-opened">ไม่ได้เปิด</span>';
      return `
        <div class="history-item">
          <span class="history-item-tier" style="--tier-color:${meta.color}">
            <span class="history-item-dot"></span>${escapeHtml(meta.name)}
          </span>
          ${amountHtml}
        </div>`;
    }).join('');

    const statusHtml = hasOpened
      ? `<span class="history-status ${h.applied ? 'applied' : 'pending'}">${h.applied ? 'ตัดบิลแล้ว' : 'รอตัดบิล'}</span>`
      : '';

    const totalHtml = hasOpened
      ? `<div class="history-total">
           <span class="history-total-label">รวม</span>
           <span class="history-total-amount">฿${total.toLocaleString()}</span>
         </div>`
      : '';

    return `
      <div class="history-month">
        <div class="history-month-head">
          <span class="history-month-label">${escapeHtml(formatMonthLabel(h.month))}</span>
          ${statusHtml}
        </div>
        <div class="history-items">${itemsHtml}</div>
        ${totalHtml}
      </div>`;
  }).join('');
}

// ============================================================
//  INIT
// ============================================================
async function init() {
  applyTier('Member'); // ค่าเริ่มต้นก่อนรู้ tier จริง

  const params = new URLSearchParams(location.search);
  const room  = params.get('room');
  const token = params.get('token');
  const view  = params.get('view');

  if (room) {
    bootMode = 'room'; bootParam = room;
  } else if (token) {
    bootMode = 'token'; bootParam = token;
  } else {
    await initLiff();
    if (redirecting) return; // กำลังเด้งไปหน้า login — ไม่ต้องทำอะไรต่อ
    if (liffReady && liffProfile) {
      bootMode = 'userId'; bootParam = liffProfile.userId;
    } else {
      showError('❌ ไม่พบข้อมูลห้อง');
      removeBootMask();
      return;
    }
  }

  tryRenderFromCache(bootMode, bootParam);
  await withBootSoftNotice(reloadLootBoxData);

  if (view === 'history' && currentRoomNo) openHistoryOverlay();
  removeBootMask();
}

init();
