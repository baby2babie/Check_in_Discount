// ============================================================
//  กล่องสุ่มรางวัล — app.js (Suspense Reveal Edition)
//  แทนที่กลไกตู้กาชาปอง (crank/dome/mega-capsule) ด้วยเกมการ์ดส่วนลด
//  โครง backend/LIFF/cache/history — คงเดิม 100% จากระบบเดิม
// ============================================================

const GAS_URL = 'https://script.google.com/macros/s/AKfycbx580dyPfzslsut-QGtLrRHCt0Hdv9AscR3OfZF0ZTKYKfKETTKF9DAI7e6wXyhEvYlBw/exec';
const LIFF_ID = '2004478373-aQPYZEpt';

// milestone → ชื่อกาชาปอง (ใช้แสดงในป้าย/ประวัติ) — ลำดับนี้คือลำดับที่ stock queue จะเปิดก่อน-หลัง
const LB_CONFIG = [
  { milestone: 7,  name: 'GACHAPON · SILVER',   tier: 'silver' },
  { milestone: 14, name: 'GACHAPON · GOLD',     tier: 'gold'   },
  { milestone: 21, name: 'GACHAPON · PLATINUM', tier: 'plat'   },
  { milestone: 28, name: 'GACHAPON · LEGEND',   tier: 'legend' },
];
const TIER_COLORS = { silver:'#94A3B8', gold:'#F59E0B', plat:'#A78BFA', legend:'#EF4444', paid:'#C084FC' };

const stockLabels = {
  "7": "เช็คอิน 7 วัน", "14": "เช็คอิน 14 วัน", "21": "เช็คอิน 21 วัน", "28": "เช็คอิน 28 วัน",
  "PAID": "จ่ายตรงเวลา"
};

let liffReady   = false;
let liffProfile = null;
let currentRoomNo = null;
let currentTierLabel = null;

// ============================================================
//  THEME — tier palette (ตาม pattern B ใน SKILL section 3)
//  ผูกสี capsule + ticket ผลลัพธ์เข้ากับ tier ผู้เช่าจริง (currentTierLabel)
// ============================================================
const THEME = {
  "Member":   { bg: "#ECFDF5", border: "#A7F3D0", text: "#065F46", accent: "#10B981", roomNum: "#047857" },
  "Silver":   { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF", accent: "#3B82F6", roomNum: "#1D4ED8" },
  "Gold":     { bg: "#FEFCE8", border: "#FDE047", text: "#854D0E", accent: "#EAB308", roomNum: "#B45309" },
  "Platinum": { bg: "#FAF5FF", border: "#E9D5FF", text: "#6B21A8", accent: "#A855F7", roomNum: "#7E22CE" },
  "Diamond":  { bg: "#ECFEFF", border: "#A5F3FC", text: "#164E63", accent: "#06B6D4", roomNum: "#0E7490" },
  "Legend":   { bg: "#FFF1F2", border: "#FECDD3", text: "#9F1239", accent: "#F43F5E", roomNum: "#BE123C" },
};
function applyTier(tierLabel) {
  const t = THEME[tierLabel] || THEME["Member"];
  const root = document.documentElement.style;
  root.setProperty('--cap-soft', t.border);
  root.setProperty('--cap-mid', t.accent);
  root.setProperty('--cap-deep', t.roomNum);
  root.setProperty('--result-text', t.text);
  root.setProperty('--result-accent', t.accent);
  root.setProperty('--result-border', t.border);
  root.setProperty('--result-bg', t.bg);
}

// ตัวเลขล่อ (decoy) โชว์บนแคปซูลระหว่างเกม — ไม่ใช่รางวัลจริง รางวัลจริงมาจาก backend หลัง openLootBox เท่านั้น
const CAPSULE_NUMBERS = [20, 30, 40, 50, 60, 70, 80, 100];
const N_CAPS = 7;

// ============================================================
//  CACHE (sessionStorage) — เก็บผล render ล่าสุดไว้โชว์ทันทีตอนเปิดแอปรอบถัดไป
//  (stale-while-revalidate: โชว์ของเก่าก่อนเงียบๆ แล้วค่อยทับด้วยของจริงจาก backend)
// ============================================================
const CACHE_MAX_AGE_MS = 30 * 60 * 1000; // เก่าเกิน 30 นาทีไม่ใช้ ป้องกันข้อมูลเพี้ยนนานเกินไป

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
    // sessionStorage อาจเต็ม/ถูกบล็อก (private mode ฯลฯ) — ไม่ critical ต่อการทำงาน ข้ามไปเฉยๆ
  }
}

function tryRenderFromCache(mode, param) {
  try {
    const raw = sessionStorage.getItem(cacheKey(mode, param));
    if (!raw) return false;
    const { result, ts } = JSON.parse(raw);
    if (!result || Date.now() - ts > CACHE_MAX_AGE_MS) return false;
    applyRoomData(result);
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
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function showToast(msg, type = 'success', duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast ' + type;
  setTimeout(() => t.className = 'toast', duration);
}

function showError(msg, retryable = false) {
  instruction.textContent = msg;
  stockCount.textContent  = '';
  plateText.textContent   = 'ไม่พร้อมใช้งาน';
  startBtn.classList.add('hide');
  revealCard.classList.add('cabinet-error');
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
//  DOM refs (ต้องอยู่หลัง element ใน index.html)
// ============================================================
const revealCard    = document.getElementById('revealCard');
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

// stock = milestone keys (string) ที่มีกล่องเปิดได้จริงตอนนี้ เรียงตามลำดับที่จะเปิด
// lootTokens = { "7": token, "PAID": token, ... } token จริงจาก backend สำหรับแต่ละ milestone
let stock = [];
let lootTokens = {};
let busy = true; // true จนกว่าจะโหลดข้อมูลจริงเสร็จ / กำลังเล่นรอบอยู่

function boxNameFor(milestone){
  if(milestone === 'PAID') return 'GACHAPON · BONUS';
  const cfg = LB_CONFIG.find(c => c.milestone === Number(milestone));
  return cfg ? cfg.name : 'GACHAPON · MYSTERY';
}

function updatePlateText(){
  plateText.textContent = stock.length ? boxNameFor(stock[0]) : 'เปิดครบแล้วตอนนี้';
}
function updateStockCount(){
  stockCount.textContent = stock.length ? `เปิดได้อีก ${stock.length} ลูก` : `ไม่มีกาชาปองให้เปิดตอนนี้`;
}

function updateStartState(){
  if(stock.length > 0){
    startBtn.classList.remove('hide');
    titleText.textContent = 'แตะปุ่มด้านล่างเพื่อเริ่ม';
    eyebrowText.textContent = boxNameFor(stock[0]);
    instruction.textContent = 'แตะปุ่มด้านล่างเพื่อลุ้นรางวัล';
  } else {
    startBtn.classList.add('hide');
    titleText.textContent = 'เปิดครบแล้วตอนนี้';
    eyebrowText.textContent = 'ไม่มีกาชาปองให้เปิดในตอนนี้';
    instruction.textContent = '';
  }
}

// ============================================================
//  กันไม่ให้ค้างตลอดไปถ้า backend ไม่ตอบเลย (เหมือนของเดิมเป๊ะ)
// ============================================================
function withTimeout(promise, ms, fallback){
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(()=> resolve(fallback), ms))
  ]);
}
const wait = ms => new Promise(r => setTimeout(r, ms));

function spawnConfetti(count){
  const colors = ["var(--gold)","var(--red-light)","#D9C4FF","#BFF3E1","#C6E6FF","#FFE39A"];
  for(let i=0;i<count;i++){
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    const w = 6 + Math.random()*6;
    const h = w * (1.3 + Math.random()*0.6);
    p.style.width = w + "px";
    p.style.height = h + "px";
    p.style.left = (Math.random()*100) + "vw";
    p.style.background = colors[Math.floor(Math.random()*colors.length)];
    p.style.animationDuration = (2 + Math.random()*1.4) + "s";
    p.style.animationDelay = (Math.random()*0.5) + "s";
    confettiLayer.appendChild(p);
    setTimeout(()=> p.remove(), 4000);
  }
}

// ============================================================
//  SUSPENSE REVEAL — เกมการ์ดส่วนลด (แทนกลไกตู้กาชาปอง/มือดึงเดิม)
//  1 รอบ = 1 กล่อง (stock[0]) — ยิง openLootBox จริงตอนเริ่มรอบพร้อมกับเล่นแอนิเมชัน
//  ตัวเลขบนการ์ดระหว่างเกมเป็นแค่ตัวล่อ (CAPSULE_NUMBERS) รางวัลจริงเฉลยจาก backend ตอนจบเท่านั้น
// ============================================================
let capEls = [];
let currentOrder = [];
let ringRotation = 0;
const radius = 78;

function buildBoard(){
  board.querySelectorAll('.cap, .spark').forEach(el => el.remove());
  const decoys = [...CAPSULE_NUMBERS].sort(()=>Math.random()-0.5).slice(0, N_CAPS);
  capEls = decoys.map((amount, i) => {
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
      </div>
    `;
    board.appendChild(el);
    return el;
  });
  currentOrder = capEls.map((_, i) => i);
  ringRotation = 0;
  renderRing();
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

function closeCaps() {
  capEls.forEach(el => {
    const label = el.querySelector('.cap-label');
    label.classList.remove('show');
    label.textContent = ''; // เอาตัวเลขออกจากผิวการ์ดจริง ไม่ใช่แค่ซ่อนด้วยความจาง
    el.querySelector('.cap-percent').classList.add('show');
  });
  titleText.textContent = "ปิดแล้ว... เตรียมสลับ!";
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
  titleText.textContent = "กำลังสลับ... ตามให้ทัน!";
  const patterns = [
    adjacentSwap, oppositeSwap, mirrorFlip, scrambleJump, splitCounter,
    rotateBy(2), rotateBy(3), rotateBy(-2)
  ];
  let elapsed = 0;
  while (elapsed < 7200) {
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

function enablePicking() {
  return new Promise(resolve => {
    titleText.textContent = "เลือกแคปซูลของคุณ";
    hint.textContent = "แตะเลือกแคปซูลที่คุณคิดว่าใช่";
    capEls.forEach(el => {
      el.classList.add('pickable');
      el.addEventListener('click', (e) => { resolve(e.currentTarget); }, { once: true });
    });
  });
}

function spawnSparks() {
  const cs = getComputedStyle(document.documentElement);
  const colors = [
    cs.getPropertyValue('--cap-mid').trim(),
    cs.getPropertyValue('--cap-deep').trim(),
    cs.getPropertyValue('--cap-soft').trim(),
    '#D85A30'
  ];
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div');
    p.className = 'spark';
    p.style.background = colors[i % colors.length];
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    board.appendChild(p);
    const ang = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 100;
    p.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(${Math.cos(ang)*dist - 50}%, ${Math.sin(ang)*dist - 50}%) rotate(${Math.random()*360}deg) scale(0.4)`, opacity: 0 }
    ], { duration: 950 + Math.random()*400, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' });
    setTimeout(() => p.remove(), 1500);
  }
}

// เล่น 1 รอบเต็ม: โชว์การ์ดล่อ → ปิด → สลับ → ให้เลือก → เฉลยใบอื่น → ลอยเข้ากลาง → รอผลจริงจาก backend → เปิด
async function playRound(milestone, apiPromise){
  buildBoard();
  ticket.classList.remove('show');
  claimBtn.classList.remove('show');
  headline.classList.remove('dim');
  hint.textContent = '';
  eyebrowText.textContent = boxNameFor(milestone);
  titleText.textContent = 'จำตำแหน่งส่วนลดให้ดี';

  await wait(3200);
  closeCaps();
  await wait(500);
  await startShuffle();

  const chosen = await enablePicking();
  const chosenDecoy = chosen.dataset.decoy;

  hint.textContent = '';
  capEls.forEach(el => el.classList.remove('pickable'));
  chosen.classList.add('marked');

  titleText.textContent = "มาดูใบที่คุณไม่ได้เลือกกัน...";
  await wait(600);

  const others = capEls.filter(el => el !== chosen);
  others.sort((a, b) => {
    const ia = capEls.indexOf(a), ib = capEls.indexOf(b);
    return currentOrder[ia] - currentOrder[ib];
  });

  for (const el of others) {
    const label = el.querySelector('.cap-label');
    el.querySelector('.cap-percent').classList.remove('show');
    label.textContent = el.dataset.decoy + '฿';
    el.classList.add('revealed-miss', 'pop');
    label.classList.add('show');
    await wait(480);
    el.classList.remove('pop');
  }

  await wait(700);
  titleText.textContent = "เหลือใบของคุณใบเดียว...";
  others.forEach(el => el.classList.add('faded'));
  await wait(900);
  others.forEach(el => el.classList.add('gone'));

  await wait(300);
  titleText.textContent = "มาดูกันว่าได้เท่าไหร่...";
  chosen.classList.add('to-center');
  chosen.style.transform = 'translate(0px, 0px)';
  await wait(720);
  chosen.classList.add('centered', 'scaled');
  await wait(360);
  for (let i = 0; i < 3; i++) {
    chosen.style.transform = `translate(0px, 0px) rotate(${i % 2 ? 4 : -4}deg)`;
    await wait(90);
  }
  chosen.style.transform = 'translate(0px, 0px)';
  await wait(120);

  // ── รอผลจริงจาก backend — ถ้ายังไม่มาก็สั่นวนลุ้นต่อ (เหมือนของเดิมตอนแคปซูลใบใหญ่สั่นรอผล) ──
  let resolved = false;
  apiPromise.then(() => { resolved = true; });
  chosen.classList.add('waiting');
  while (!resolved) { await wait(700); }
  chosen.classList.remove('waiting');

  const result = await apiPromise;

  if (!result || !result.success) {
    return { success: false, result, chosenDecoy };
  }

  headline.classList.add('dim');
  chosen.classList.add('open');
  spawnSparks();
  screenFlash.classList.remove('go'); void screenFlash.offsetWidth; screenFlash.classList.add('go');
  await wait(450);

  const amount = Number(result.discount_amount) || 0;
  ticketAmt.textContent = amount;
  ticketDesc.textContent = "ส่วนลดเข้ารอบบิลถัดไปอัตโนมัติ";
  ticket.classList.add('show');
  claimBtn.classList.add('show');
  if (amount >= 70) setTimeout(()=> spawnConfetti(24), 150);

  return { success: true, result };
}

// แสดงผลแบบเร็ว (ไม่เล่นเกมใหม่) — ใช้ตอนกู้คืนผลที่เปิดสำเร็จไปแล้วจริง (เช่นหลัง error/retry)
function showQuickTicket(milestone, amount){
  buildBoard();
  capEls.forEach(el => el.classList.add('gone'));
  eyebrowText.textContent = boxNameFor(milestone);
  titleText.textContent = 'กล่องนี้เปิดไปแล้ว — นี่คือรางวัลที่ได้รับ';
  hint.textContent = '';
  headline.classList.add('dim');
  ticketAmt.textContent = amount;
  ticketDesc.textContent = "ส่วนลดเข้ารอบบิลถัดไปอัตโนมัติ";
  ticket.classList.add('show');
  claimBtn.classList.add('show');
}

async function startRound(){
  if (busy && stock.length === 0) return;
  if (stock.length === 0){ instruction.textContent = "ไม่มีกาชาปองให้เปิดแล้วตอนนี้"; return; }
  busy = true;
  startBtn.classList.add('hide');
  retryBtn.style.display = 'none';
  instruction.textContent = "";

  const milestone = stock[0];
  const token = lootTokens[milestone];

  // request จริง — ไม่ถูกยกเลิกแม้ผู้ใช้จะเห็น UI แจ้งว่า "ช้า" แล้วก็ตาม
  const realPromise = callGAS('openLootBox', { token, tierLabel: currentTierLabel }, 30000).catch((err) => {
    console.error('openLootBox failed:', err);
    return { success:false, message:'เชื่อมต่อกับระบบไม่สำเร็จ' };
  });

  const SOFT_TIMEOUT_MS = 4000;
  const HARD_TIMEOUT_MS = 12000;
  const softTimer = setTimeout(()=>{
    if (busy) showToast('เชื่อมต่อช้ากว่าปกติ กำลังรอผลอยู่...', 'error', 3000);
  }, SOFT_TIMEOUT_MS);
  realPromise.finally(()=> clearTimeout(softTimer));

  const apiPromise = withTimeout(
    realPromise,
    HARD_TIMEOUT_MS,
    { success:false, message:'ระบบช้าผิดปกติ กำลังซิงค์ข้อมูลใหม่ให้อัตโนมัติ', hardFail:true }
  );

  const outcome = await playRound(milestone, apiPromise);

  if (outcome.success) {
    stock.shift();
    delete lootTokens[milestone];
    updateStockCount();
    plateText.textContent = boxNameFor(milestone);
    busy = false;
    return;
  }

  // ── เปิดไม่สำเร็จ — เหมือนของเดิม: sync ข้อมูลใหม่ แล้วเช็คว่าจริงๆเปิดสำเร็จไปแล้วหรือเปล่า ──
  const result = outcome.result;
  if (result && result.hardFail) {
    showToast('⏳ ระบบช้าผิดปกติ กำลังซิงค์ข้อมูลให้อัตโนมัติ...', 'error', 4000);
  } else {
    showToast('❌ ' + (result?.message || 'เปิดไม่สำเร็จ'), 'error', 4000);
  }
  instruction.textContent = "🔄 กำลังซิงค์ข้อมูลใหม่...";
  headline.classList.remove('dim');
  ticket.classList.remove('show');
  claimBtn.classList.remove('show');
  board.querySelectorAll('.cap').forEach(el => el.classList.add('gone'));

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
        showToast('🎁 กล่องนี้เปิดสำเร็จไปแล้ว กำลังเปิดหน้าประวัติให้ดูรางวัลที่ได้รับ', 'success', 6000);
        openHistoryOverlay();
        updateStartState();
      }
    } catch (e) {
      showToast('🎁 กล่องนี้เปิดสำเร็จไปแล้ว กำลังเปิดหน้าประวัติให้ดูรางวัลที่ได้รับ', 'success', 6000);
      openHistoryOverlay();
      updateStartState();
    }
  } else {
    // ยังไม่เปิดจริง — กลับสู่สถานะพร้อมเริ่มใหม่ ให้ลองแตะ start อีกครั้ง
    updateStartState();
  }
  busy = false;
}

claimBtn.addEventListener('click', () => {
  ticket.classList.remove('show');
  claimBtn.classList.remove('show');
  headline.classList.remove('dim');
  updatePlateText();
  updateStockCount();
  updateStartState();
});
startBtn.addEventListener('click', startRound);
retryBtn.addEventListener('click', ()=>{
  retryBtn.classList.add('loading');
  instruction.textContent = 'กำลังลองเชื่อมต่อใหม่...';
  reloadLootBoxData().finally(()=> retryBtn.classList.remove('loading'));
});

// ============================================================
//  RENDER จากข้อมูลจริง (getLootBoxDataByRoom / getLootBoxData)
// ============================================================
function updateRoomLabel(room){
  cabRoomBadge.textContent = 'ห้อง ' + room;
  currentRoomNo = room;
  showHistoryButton();
}

function applyRoomData(result){
  revealCard.classList.remove('cabinet-error');
  if(result.roomNo) updateRoomLabel(result.roomNo);
  if(result.tierLabel) { currentTierLabel = result.tierLabel; applyTier(currentTierLabel); }

  stock = [];
  lootTokens = {};
  const order = ['PAID', 7, 14, 21, 28]; // PAID ได้จากจ่ายบิล มักได้เร็วกว่าเช็คอินครบ 7 วันเสมอ เลยเปิดก่อน
  const boxes = result.boxes || {};
  order.forEach(m => {
    const info = boxes[m] || {};
    if(info.token && !info.opened){
      const key = String(m);
      stock.push(key);
      lootTokens[key] = info.token;
    }
  });

  updatePlateText();
  updateStockCount();
}

function renderCabinet(result){
  retryBtn.style.display = 'none';
  applyRoomData(result);
  busy = false;
  updateStartState();
  saveCacheSnapshot(result);
}

async function callGASWithRetry(action, params, retries = 1, delayMs = 1200, timeoutMs = 10000){
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

const DATA_FETCH_TIMEOUT_MS = 18000;

// ============================================================
//  BOOT SOFT-NOTICE — แจ้งผู้ใช้ตอนบูตแอปว่า "กำลังรอ" ไม่ใช่ "ค้าง"
// ============================================================
const BOOT_SOFT_NOTICE_MS = 4000;
const BOOT_SOFT_NOTICE_TEXT = 'เชื่อมต่อช้ากว่าปกติ กำลังรอผลอยู่...';

function showBootSoftNotice(){
  const boot = document.getElementById('boot-mask');
  if (!boot || !document.body.contains(boot)) return;

  let notice = document.getElementById('boot-soft-notice');
  if (!notice) {
    notice = document.createElement('div');
    notice.id = 'boot-soft-notice';
    notice.style.cssText = 'font-family:"Prompt",sans-serif;font-size:13px;color:#94A3B8;margin-top:-8px;text-align:center;padding:0 24px;';
    boot.appendChild(notice);
  }
  notice.textContent = BOOT_SOFT_NOTICE_TEXT;
}
function clearBootSoftNotice(){
  const notice = document.getElementById('boot-soft-notice');
  if (notice) notice.remove();
}
async function withBootSoftNotice(promiseFn){
  const t = setTimeout(showBootSoftNotice, BOOT_SOFT_NOTICE_MS);
  try {
    return await promiseFn();
  } finally {
    clearTimeout(t);
    clearBootSoftNotice();
  }
}

async function loadLootBoxForRoom(roomNo) {
  try {
    const result = await callGASWithRetry('getLootBoxDataByRoom', { roomNo }, 1, 1200, DATA_FETCH_TIMEOUT_MS);
    if (!result.success) { showError('❌ ' + (result.message || 'โหลดไม่ได้'), true); return; }
    renderCabinet(result);
  } catch (e) {
    console.error('loadLootBoxForRoom failed:', e);
    showError('❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ', true);
  }
}
async function loadLootBoxByToken(token) {
  try {
    const result = await callGASWithRetry('getLootBoxData', { token }, 1, 1200, DATA_FETCH_TIMEOUT_MS);
    if (!result.success) { showError('❌ ' + (result.message || 'Token ไม่ถูกต้อง'), true); return; }
    renderCabinet(result);
  } catch (e) {
    console.error('loadLootBoxByToken failed:', e);
    showError('❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ', true);
  }
}
async function loadLootBoxByUserId(userId) {
  try {
    const result = await callGASWithRetry('getLootBoxData', { userId }, 1, 1200, DATA_FETCH_TIMEOUT_MS);
    if (!result.success) { showError('❌ ' + (result.message || 'โหลดไม่ได้'), true); return; }
    renderCabinet(result);
  } catch (e) {
    console.error('loadLootBoxByUserId failed:', e);
    showError('❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ', true);
  }
}

// ============================================================
//  HISTORY BUTTON + OVERLAY (เดิม 100%)
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
    return { name: 'PAID BONUS', color: TIER_COLORS.paid };
  }
  const cfg = LB_CONFIG.find(c => c.milestone === Number(tierRaw));
  if (cfg) return { name: cfg.name, color: TIER_COLORS[cfg.tier] };
  return { name: 'ไม่ทราบ', color: '#8B929C' };
}

function openHistoryOverlay() {
  document.getElementById('history-overlay').classList.add('active');
  loadHistory();
}
function closeHistoryOverlay() {
  document.getElementById('history-overlay').classList.remove('active');
}

async function loadHistory() {
  const body = document.getElementById('history-body');
  body.innerHTML = '<div class="loading">กำลังโหลด...</div>';

  if (!currentRoomNo) {
    body.innerHTML = '<div class="loading">❌ ไม่พบข้อมูลห้อง</div>';
    return;
  }

  try {
    const result = await callGAS('getLootHistory', { roomNo: currentRoomNo });
    if (!result.success) {
      body.innerHTML = `<div class="loading">❌ ${result.message || 'โหลดไม่ได้'}</div>`;
      return;
    }
    renderHistory(result.history || []);
  } catch (e) {
    body.innerHTML = '<div class="loading">❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ</div>';
  }
}

function renderHistory(history) {
  const body = document.getElementById('history-body');

  if (!history.length) {
    body.innerHTML = '<div class="loading">ยังไม่มีประวัติการเปิดกาชาปองครับ</div>';
    return;
  }

  body.innerHTML = history.map(h => {
    const total     = h.items.reduce((s, it) => s + (it.opened ? Number(it.amount) : 0), 0);
    const hasOpened = h.items.some(it => it.opened);

    const itemsHtml = h.items.map(it => {
      const meta = getTierMeta(it.tier);
      const amountHtml = it.opened
        ? `<span class="history-item-amount">฿${Number(it.amount).toLocaleString()}</span>`
        : `<span class="history-item-amount not-opened">ไม่ได้เปิด</span>`;
      return `
        <div class="history-item">
          <span class="history-item-tier" style="--tier-color:${meta.color}">
            <span class="history-item-dot"></span>${meta.name}
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
          <span class="history-month-label">${formatMonthLabel(h.month)}</span>
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
let bootMode  = null; // 'room' | 'token' | 'userId'
let bootParam = null;

function removeBootMask(){
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
    await withBootSoftNotice(() => loadLootBoxForRoom(room));
  } else if (token) {
    bootMode = 'token'; bootParam = token;
    tryRenderFromCache('token', token);
    await withBootSoftNotice(() => loadLootBoxByToken(token));
  } else {
    await initLiff();
    if (liffReady && liff.isLoggedIn() && liffProfile) {
      bootMode = 'userId'; bootParam = liffProfile.userId;
      tryRenderFromCache('userId', liffProfile.userId);
      await withBootSoftNotice(() => loadLootBoxByUserId(liffProfile.userId));
    } else {
      showError('❌ ไม่พบข้อมูลห้อง');
    }
  }

  if (view === 'history' && currentRoomNo) {
    openHistoryOverlay();
  }

  removeBootMask();
}

async function reloadLootBoxData(){
  if(bootMode === 'room') await loadLootBoxForRoom(bootParam);
  else if(bootMode === 'token') await loadLootBoxByToken(bootParam);
  else if(bootMode === 'userId') await loadLootBoxByUserId(bootParam);
  else showError('❌ ไม่พบข้อมูลห้อง');
}

init();
