// ============================================================
//  คูปองส่วนลด — app.js (Suspense Reveal Edition)
//  แทนที่กลไกตู้กาชาปอง (crank/dome/mega-capsule) เดิม ด้วยเกมคูปองส่วนลด
//  โครง backend/LIFF/cache/history — คงเดิม 100% จากระบบเดิม
// ============================================================

const GAS_URL = 'https://script.google.com/macros/s/AKfycbx580dyPfzslsut-QGtLrRHCt0Hdv9AscR3OfZF0ZTKYKfKETTKF9DAI7e6wXyhEvYlBw/exec';
const LIFF_ID = '2004478373-aQPYZEpt';

// milestone → ชื่อคูปอง (ใช้แสดงในป้าย/ประวัติ) — ลำดับนี้คือลำดับที่ stock queue จะเปิดก่อน-หลัง
const LB_CONFIG = [
  { milestone: 7,  name: 'คูปอง · SILVER',   tier: 'silver' },
  { milestone: 14, name: 'คูปอง · GOLD',     tier: 'gold'   },
  { milestone: 21, name: 'คูปอง · PLATINUM', tier: 'plat'   },
  { milestone: 28, name: 'คูปอง · LEGEND',   tier: 'legend' },
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

// ตัวเลขล่อ (decoy) โชว์บนคูปองระหว่างเกม — นี่คือชุดค่า discount_amount ที่ไม่ซ้ำกันทั้งหมดจากชีท LOOT_BOX จริง
// (ครบทุก tier/milestone พอดี 7 ค่า = จำนวนใบพอดี) การันตีว่ารางวัลจริงที่ backend ส่งมาตอนจบ
// จะเป็นหนึ่งใน 7 ค่านี้เสมอ ไม่มีทางที่ตัวเลขจริงจะไม่ตรงกับที่โชว์ให้จำไว้ตอนต้นเกม
const CAPSULE_NUMBERS = [5, 10, 15, 20, 25, 30, 50];
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
const stepGuide   = document.getElementById('stepGuide');

// stock = milestone keys (string) ที่มีกล่องเปิดได้จริงตอนนี้ เรียงตามลำดับที่จะเปิด
// lootTokens = { "7": token, "PAID": token, ... } token จริงจาก backend สำหรับแต่ละ milestone
let stock = [];
let lootTokens = {};
let busy = true; // true จนกว่าจะโหลดข้อมูลจริงเสร็จ / กำลังเล่นรอบอยู่

function boxNameFor(milestone){
  if(milestone === 'PAID') return 'คูปอง · BONUS';
  const cfg = LB_CONFIG.find(c => c.milestone === Number(milestone));
  return cfg ? cfg.name : 'คูปอง · MYSTERY';
}

function updatePlateText(){
  plateText.textContent = stock.length ? boxNameFor(stock[0]) : 'เปิดครบแล้วตอนนี้';
}
function updateStockCount(){
  stockCount.textContent = stock.length ? `เปิดได้อีก ${stock.length} สิทธิ์` : `ไม่มีสิทธิ์เปิดคูปองตอนนี้`;
}

function updateStartState(){
  if(stock.length > 0){
    startBtn.classList.remove('hide');
    startBtn.classList.add('idle-pulse');
    stepGuide.style.display = 'flex';
    titleText.textContent = 'แตะปุ่มด้านล่างเพื่อเริ่ม';
    eyebrowText.textContent = 'คุณได้รับสิทธิ์เปิดคูปองส่วนลด'; // ไม่ซ้ำกับ plate ด้านบนที่โชว์ชื่อ tier อยู่แล้ว
    instruction.textContent = '';
    buildIdlePreview(); // โชว์การ์ดพรีวิวจางๆ กันหน้าแรกดูโล่งก่อนกดเริ่ม
  } else {
    startBtn.classList.add('hide');
    startBtn.classList.remove('idle-pulse');
    stepGuide.style.display = 'none';
    titleText.textContent = 'เปิดครบแล้วตอนนี้';
    eyebrowText.textContent = 'ไม่มีคูปองให้เปิดในตอนนี้';
    instruction.textContent = '';
    board.querySelectorAll('.cap').forEach(el => el.remove());
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
//  SUSPENSE REVEAL — เกมคูปองส่วนลด (แทนกลไกตู้กาชาปอง/มือดึงเดิม)
//  1 รอบ = 1 กล่อง (stock[0]) — ยิง openLootBox จริงตอนเริ่มรอบพร้อมกับเล่นแอนิเมชัน
//  ตัวเลขบนการ์ดระหว่างเกมเป็นแค่ตัวล่อ (CAPSULE_NUMBERS) รางวัลจริงเฉลยจาก backend ตอนจบเท่านั้น
// ============================================================
let capEls = [];
let currentOrder = [];
let ringRotation = 0;
let radius = 78; // คำนวณใหม่ทุกครั้งจากขนาดจริงของ .board ผ่าน layoutMetrics() (responsive แทนค่าตายตัวเดิม)

// คำนวณขนาดการ์ด (ตัวแปร CSS --cap-w/--cap-h) และรัศมีวงแหวนใหม่ตามความกว้างจริงของ .board
// เรียกตอน build บอร์ด (ทั้งพรีวิวและรอบเล่นจริง) และตอน resize จอ เพื่อให้การ์ดขยาย/หดตามพื้นที่จอเสมอ
function layoutMetrics(){
  const size = board.clientWidth;
  const capW = size * 0.32;
  const capH = capW * 0.62; // ทรงตั๋วเตี้ยกว้าง (เดิมเป็นแคปซูลวงรี 58x46 คงที่)
  document.documentElement.style.setProperty('--cap-w', capW + 'px');
  document.documentElement.style.setProperty('--cap-h', capH + 'px');
  radius = size * 0.345;
}
window.addEventListener('resize', () => { layoutMetrics(); renderRing(); });

// พรีวิวก่อนกดเริ่ม (idle ghost cards) — กันหน้าแรกดูโล่ง ให้เห็นล่วงหน้าว่ามีคูปองรออยู่ 7 ใบ
function buildIdlePreview(){
  layoutMetrics();
  board.querySelectorAll('.cap, .spark').forEach(el => el.remove());
  for (let i = 0; i < N_CAPS; i++){
    const el = document.createElement('div');
    el.className = 'cap ghost';
    const angle = (360 / N_CAPS) * i - 90;
    const rad = angle * Math.PI / 180;
    el.style.transform = `translate(${Math.cos(rad) * radius}px, ${Math.sin(rad) * radius}px)`;
    el.innerHTML = `
      <div class="cap-shadow"></div>
      <div class="cap-body" style="animation-delay:${(i * 0.18).toFixed(2)}s">
        <div class="cap-face">
          <div class="cap-stub"><span class="stub-icon">%</span></div>
          <div class="tear-line"></div>
          <div class="cap-notch top"></div>
          <div class="cap-notch bottom"></div>
          <div class="cap-main"><div class="cap-percent show">?</div></div>
          <div class="cap-shine"></div>
        </div>
      </div>`;
    board.appendChild(el);
  }
}

function buildBoard(){
  layoutMetrics();
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
          <div class="cap-stub"><span class="stub-icon">%</span></div>
          <div class="tear-line"></div>
          <div class="cap-notch top"></div>
          <div class="cap-notch bottom"></div>
          <div class="cap-main">
            <div class="cap-percent">฿</div>
            <div class="cap-label show">${amount}฿</div>
          </div>
          <div class="cap-shine"></div>
        </div>
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

function enablePicking() {
  return new Promise(resolve => {
    titleText.textContent = "เลือกคูปองของคุณ";
    hint.textContent = "แตะเลือกคูปองที่คุณคิดว่าใช่";
    capEls.forEach(el => {
      el.classList.add('pickable');
      el.addEventListener('click', (e) => { resolve(e.currentTarget); }, { once: true });
    });
  });
}


// เล่น 1 รอบเต็ม: โชว์การ์ดล่อ → ปิด → สลับ → ให้เลือก → เฉลยใบอื่น → ลอยเข้ากลาง → รอผลจริงจาก backend → เปิด
async function playRound(milestone, apiPromise){
  buildBoard();
  ticket.classList.remove('show');
  claimBtn.classList.remove('show');
  headline.classList.remove('dim');
  hint.textContent = '';
  // ไม่ตั้ง eyebrowText ซ้ำกับ plate (plate โชว์ชื่อ tier/กล่องอยู่แล้วด้านบน) — ให้ titleText นำสายตาแทน
  titleText.textContent = 'จำตำแหน่งส่วนลดให้ดี';

  await wait(2200);
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
  await wait(430);
  chosen.classList.add('centered', 'scaled');
  await wait(200);
  chosen.classList.add('suspense-shake');
  await wait(850);
  chosen.classList.remove('suspense-shake');
  await wait(120);

  // ── รอผลจริงจาก backend ──
  // ไม่ polling ทุก 700ms เพราะทำให้รู้สึกเหมือนหน้าเว็บค้าง
  chosen.classList.add('waiting');
  const result = await apiPromise;
  chosen.classList.remove('waiting');

  if (!result || !result.success) {
    return { success: false, result, chosenDecoy };
  }

  headline.classList.add('dim');
  chosen.classList.add('open');
  screenFlash.classList.remove('go'); void screenFlash.offsetWidth; screenFlash.classList.add('go');
  await wait(450);

  const amount = Number(result.discount_amount) || 0;
  ticketAmt.textContent = amount;
  ticketDesc.textContent = "ส่วนลดเข้ารอบบิลถัดไปอัตโนมัติ";
  ticket.classList.add('show');
  claimBtn.classList.add('show');
  spawnConfetti(amount >= 70 ? 40 : 22); // โปรยริบบิ้นทุกครั้งที่เปิดสำเร็จ (ยิ่งได้เยอะยิ่งโปรยถี่ขึ้น)

  return { success: true, result };
}

// แสดงผลแบบเร็ว (ไม่เล่นเกมใหม่) — ใช้ตอนกู้คืนผลที่เปิดสำเร็จไปแล้วจริง (เช่นหลัง error/retry)
function showQuickTicket(milestone, amount){
  buildBoard();
  capEls.forEach(el => el.classList.add('gone'));
  titleText.textContent = 'กล่องนี้เปิดไปแล้ว — นี่คือรางวัลที่ได้รับ';
  hint.textContent = '';
  headline.classList.add('dim');
  ticketAmt.textContent = amount;
  ticketDesc.textContent = "ส่วนลดเข้ารอบบิลถัดไปอัตโนมัติ";
  ticket.classList.add('show');
  claimBtn.classList.add('show');
}

async function startRound(){
  if (busy) return; // กันกดซ้ำระหว่างรอบกำลังเล่นอยู่ (เดิมเช็ค `busy && stock.length===0` ซึ่งแทบไม่มีผลจริง เพราะ stock ยังไม่ shift จนกว่าจะสำเร็จ)
  if (stock.length === 0){ instruction.textContent = "ไม่มีคูปองให้เปิดแล้วตอนนี้"; return; }
  busy = true;
  startBtn.classList.add('hide');
  startBtn.classList.remove('idle-pulse');
  stepGuide.style.display = 'none';
  retryBtn.style.display = 'none';
  instruction.textContent = "";

  const milestone = stock[0];
  const token = lootTokens[milestone];

  // request จริง — ไม่ถูกยกเลิกแม้ backend จะตอบช้าก็ตาม (auto-resync ผ่าน HARD_TIMEOUT_MS ด้านล่างถ้าช้าเกินไปจริงๆ)
  const realPromise = callGAS('openLootBox', { token, tierLabel: currentTierLabel }, 30000).catch((err) => {
    console.error('openLootBox failed:', err);
    return { success:false, message:'เชื่อมต่อกับระบบไม่สำเร็จ' };
  });

  const HARD_TIMEOUT_MS = 15000;

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

  // ถ้า openLootBox ยังประมวลผลอยู่ ให้เวลาสั้น ๆ ก่อนอ่านสถานะใหม่
  // โดยไม่ยิง openLootBox ซ้ำ ป้องกันการเปิดซ้ำ/แข่งกันเขียนข้อมูล
  if (result && result.hardFail) {
    await wait(1200);
  }
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
    body.innerHTML = '<div class="loading">ยังไม่มีประวัติการเปิดคูปองส่วนลดครับ</div>';
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
