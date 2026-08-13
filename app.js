// ============================================================
//  กล่องสุ่มรางวัล — app.js (Gachapon Edition)
//  UI: ตู้กาชาปอง — logic เชื่อม backend คงเดิม 100% (ไม่สุ่มฝั่ง client)
// ============================================================

const GAS_URL = 'https://script.google.com/macros/s/AKfycbx57fi00n2RKu7b5jHu67vzUVwrez1cx6RhW0lvvM9cIkt6_amJzMoVJOJvrwD7imHBnA/exec';
const LIFF_ID = '2004478373-aQPYZEpt';

// milestone → ชื่อกาชาปอง (ใช้แสดงในตู้/ป้าย/ประวัติ) — ลำดับนี้คือลำดับที่ stock queue จะเปิดก่อน-หลัง
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

// ============================================================
//  UTILS
// ============================================================
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
    renderCabinetPreview(result);
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
  crank.style.pointerEvents = 'none';
  crankBase.classList.add('hide-breathe');
  cabinet.classList.add('cabinet-error'); // หรี่/ลดสีตู้เล็กน้อย ให้รู้สึกว่า "แจ้งเตือน" ไม่ใช่ "ค้าง"
  updateIdleHints();
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
const pile           = document.getElementById('pile');
const crank          = document.getElementById('crank');
const dropZone       = document.getElementById('dropZone');
const instruction    = document.getElementById('instruction');
const stockCount     = document.getElementById('stockCount');
const overlay        = document.getElementById('overlay');
const prizeCard      = document.getElementById('prizeCard');
const resultTierLabel = document.getElementById('resultTierLabel');
const resultPrize    = document.getElementById('resultPrize');
const resultNote     = document.getElementById('resultNote');
const rarityRibbon   = document.getElementById('rarityRibbon');
const closeBtn       = document.getElementById('closeBtn');
const cabinet        = document.querySelector('.cabinet');
const tickRing       = document.getElementById('tickRing');
const crankGlow      = document.getElementById('crankGlow');
const screenFlash    = document.getElementById('screenFlash');
const confettiLayer  = document.getElementById('confettiLayer');
const idlePulse      = document.getElementById('idlePulse');
const crankArrow     = document.getElementById('crankArrow');
const crankBase      = document.querySelector('.crank-base');
const retryBtn       = document.getElementById('retryBtn');
const crankWrap      = document.getElementById('crankWrap');
const cabRoomBadge   = document.getElementById('cabRoomBadge');
const plateText      = document.getElementById('plateText');

// วงแหวน + จังหวะหายใจ + ลูกศรชี้ที่มือหมุน: โชว์เฉพาะตอนเครื่องว่างและยังมีกล่องให้เปิด
// เงียบสนิททันทีตอนกำลังหมุน/กำลังลุ้นผล ไม่ใช่หายไปถาวรหลังแตะครั้งแรกอีกต่อไป
function updateIdleHints(){
  const shouldShow = !busy && stock.length > 0;
  idlePulse.classList.toggle('hide', !shouldShow);
  crankArrow.classList.toggle('hide', !shouldShow);
  crankBase.classList.toggle('hide-breathe', !shouldShow);
}

const DOME_FILL = 15;
const FROST = "#EAF6FB"; // กระจกฝ้าใส ครึ่งบนของลูกแคปซูล — ใช้เป็นสีฐานของทุกลูกเหมือนกันหมด
const NEW_PALETTE = [
  { main:"#F2941A", shine:"#FFCB80" }, // ส้ม
  { main:"#2E9E4F", shine:"#8FE3A8" }, // เขียว
  { main:"#2E7FD1", shine:"#8FC4F5" }, // น้ำเงิน
  { main:"#29ABE2", shine:"#9FE0F5" }, // ฟ้า
  { main:"#C1372C", shine:"#E8703F" }, // แดง
  { main:"#F2C230", shine:"#FFE58A" }, // เหลือง
  { main:"#8B5CF6", shine:"#C4B5FD" }, // ม่วง
  { main:"#E64980", shine:"#FFB8D2" }, // ชมพู
];
const CAPSULE_NUMBERS = [20, 30, 40, 50, 60, 70, 80, 100];

// สร้าง background ทรงกลม "แคปซูลน้ำ" 2 โทน — ครึ่งบนกระจกใส ครึ่งล่างสีสันเข้ม
// พร้อมเส้นไฮไลต์บางๆ ตรงระดับน้ำ + แสงเงาวาวมุมบนซ้าย เลียนแบบภาพตัวอย่าง
// angleDeg คือมุมของเส้นแบ่งกระจก/สี — ปรับต่อลูกให้ไม่เท่ากัน จำลองว่าแต่ละลูกถูกมองจากมุมกล้อง/องศาเอียงคนละแบบ
function gachaBallBg(mainColor, shineColor, levelPct, angleDeg){
  const lvl = levelPct;
  const ang = angleDeg;
  return [
    `radial-gradient(circle at 30% 20%, rgba(255,255,255,.95), rgba(255,255,255,0) 40%)`,
    `linear-gradient(${ang}deg, transparent 0%, transparent ${lvl-4}%, ${shineColor} ${lvl-4}%, ${shineColor} ${lvl-1}%, rgba(0,0,0,.16) ${lvl-1}%, rgba(0,0,0,.16) ${lvl+0.6}%, transparent ${lvl+0.6}%, transparent 100%)`,
    `linear-gradient(${ang}deg, ${FROST} 0%, ${FROST} ${lvl}%, ${mainColor} ${lvl}%, ${mainColor} 100%)`
  ].join(', ');
}

// ชั้นเปลือกทึบสี วางทับ "บนสุด" เหนือตั๋วอีกที — ใช้ angle/level ตัวเดียวกับพื้นหลังลูกเป๊ะ (รวมเส้นไฮไลต์ระดับน้ำด้วย)
// เพื่อให้ส่วนทึบของแคปซูลบังตั๋วที่จมอยู่ใต้เส้นระดับน้ำไว้จริง เนียนสนิทไปกับพื้นหลังลูก ไม่ใช่สี่เหลี่ยมสีทึบลอยๆ
function gachaBallShellTop(mainColor, shineColor, levelPct, angleDeg){
  const lvl = levelPct;
  const ang = angleDeg;
  return [
    `linear-gradient(${ang}deg, transparent 0%, transparent ${lvl-4}%, ${shineColor} ${lvl-4}%, ${shineColor} ${lvl-1}%, rgba(0,0,0,.16) ${lvl-1}%, rgba(0,0,0,.16) ${lvl+0.6}%, transparent ${lvl+0.6}%, transparent 100%)`,
    `linear-gradient(${ang}deg, transparent 0%, transparent ${lvl}%, ${mainColor} ${lvl}%, ${mainColor} 100%)`
  ].join(', ');
}

// องศาเส้นแบ่งที่เป็นไปได้ — ผสมทั้งเกือบตั้ง (มองจากด้านข้าง/มุมสูง เห็นตั๋วเกือบเต็ม) และเกือบนอน (มองตรง)
const SPLIT_ANGLES = [95, 120, 150, 175, 195, 220, 255, 280];

function hexToRgba(hex, alpha){
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0,2), 16);
  const g = parseInt(h.substring(2,4), 16);
  const b = parseInt(h.substring(4,6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// stock = milestone keys (string) ที่มีกล่องเปิดได้จริงตอนนี้ เรียงตามลำดับที่จะเปิด
// lootTokens = { "7": token, "PAID": token, ... } token จริงจาก backend สำหรับแต่ละ milestone
let stock = [];
let lootTokens = {};
let busy = true; // true จนกว่าจะโหลดข้อมูลจริงเสร็จ

function renderPile(){
  pile.innerHTML = "";
  const hasPaid = stock.includes('PAID');
  const paidIndex = hasPaid ? Math.floor(Math.random() * DOME_FILL) : -1;
  for(let i = 0; i < DOME_FILL; i++){
    const c = document.createElement('div');
    c.className = 'capsule';

    const size = 34 + Math.random() * 24;
    const left = Math.random() * 78;
    const top = 26 + Math.pow(Math.random(), 1.7) * 70;
    const rot = (Math.random() * 34 - 17).toFixed(1);

    c.style.width = size + "px";
    c.style.height = size + "px";
    c.style.left = left + "%";
    c.style.top = top + "%";
    c.style.setProperty('--rot', rot + 'deg');
    c.style.transform = `rotate(var(--rot))`;
    c.style.zIndex = Math.round(top * 10 + size);
    c.style.animationDelay = (Math.random() * 120) + 'ms';

    if(i === paidIndex){
      c.classList.add('shimmer');
    } else {
      const col = NEW_PALETTE[Math.floor(Math.random()*NEW_PALETTE.length)];
      const angle = SPLIT_ANGLES[Math.floor(Math.random()*SPLIT_ANGLES.length)] + (Math.random() * 14 - 7);
      const level = 26 + Math.random() * 40; // ระดับน้ำสีในลูกไม่เท่ากัน บางลูกมุมสูงเห็นตั๋วเกือบเต็ม บางลูกสีเยอะกว่า เหมือนของจริง
      c.style.background = gachaBallBg(col.main, col.shine, level, angle);

      // ลำดับชั้นแบบแคปซูลจริง: (1) ฝาใส/พื้นหลังลูก อยู่ล่างสุด (2) ตั๋ว อยู่ตรงกลาง (3) เปลือกทึบสี อยู่บนสุด
      // ทำให้ส่วนทึบบังตั๋วที่จมอยู่ใต้เส้นระดับน้ำไว้จริง เห็นตั๋วแค่ผ่านฝาใสเท่านั้น
      // ดันตำแหน่งตั๋วเข้าไปทาง "ฝั่งฝาใส" ตามสัดส่วนพื้นที่สีของลูกนั้นๆ ให้ตั๋วอยู่ในโซนใสเป็นหลักเสมอ (เห็นตั๋วเกือบเต็มใบแบบภาพตัวอย่าง)
      const splitTilt = angle - 180;
      const tilt = (splitTilt * 0.4 + (Math.random() * 10 - 5)).toFixed(1);
      const ticketRotation = Number((-rot * 1 + Number(tilt)).toFixed(1));
      const rad = angle * Math.PI / 180;
      const clearDirX = -Math.sin(rad);
      const clearDirY = Math.cos(rad);
      const pushPct = Math.min(15, Math.max(0, (level - 32) * 0.34));
      const offX = (clearDirX * pushPct + (Math.random() * 6 - 3)).toFixed(1);
      const offY = (clearDirY * pushPct + (Math.random() * 6 - 3)).toFixed(1);
      const ticket = document.createElement('div');
      ticket.className = 'capsule-ticket';
      // ขนาดตั๋วพอดีลูก ไม่ใหญ่จนล้น ไม่เล็กจนดูลอย — ลูกใหญ่ตั๋วขยับสัดส่วนลงนิดหน่อยให้ดูเนียนตา
      const ticketWidthFactor = 0.68 + Math.random() * 0.12 - Math.min(0.05, size / 3400);
      ticket.style.width = (size * ticketWidthFactor) + 'px';
      ticket.style.borderRadius = (size * 0.06) + 'px';
      ticket.style.padding = (size * 0.03) + 'px 0';
      ticket.style.left = (50 + Number(offX)) + '%';
      ticket.style.top = (50 + Number(offY)) + '%';
      ticket.style.transform = `translate(-50%,-50%) rotate(${ticketRotation}deg)`;
      ticket.style.border = (size * 0.016 + 1) + 'px solid ' + hexToRgba(col.main, .55);
      const sparkSize = (size * ticketWidthFactor * 0.15).toFixed(1);
      ticket.innerHTML =
        `<span class="capsule-ticket-spark" style="top:5%;left:6%;font-size:${sparkSize}px;color:${col.main}">✦</span>` +
        `<div class="capsule-ticket-label" style="font-size:${(size * 0.105).toFixed(1)}px">ส่วนลด</div>` +
        `<div class="capsule-ticket-amount" style="font-size:${(size * 0.255).toFixed(1)}px;color:${col.main}">${CAPSULE_NUMBERS[Math.floor(Math.random()*CAPSULE_NUMBERS.length)]}</div>` +
        `<div class="capsule-ticket-unit" style="font-size:${(size * 0.095).toFixed(1)}px">บาท</div>` +
        `<span class="capsule-ticket-spark" style="bottom:5%;right:6%;font-size:${sparkSize}px;color:${col.main}">✦</span>`;
      c.appendChild(ticket);

      // เปลือกทึบสีวางทับตั๋วอีกที (เลเยอร์บนสุด) — ใช้ angle/level เดียวกับพื้นหลังลูกเป๊ะ
      const shell = document.createElement('div');
      shell.className = 'capsule-shell-top';
      shell.style.background = gachaBallShellTop(col.main, col.shine, level, angle);
      c.appendChild(shell);

      // ชั้นแสงสะท้อนกระจกทับหน้าตั๋วอีกที ให้ตั๋วดูเหมือนอยู่ลึกเข้าไปหลังผิวโค้งใส ไม่ใช่แปะลอยอยู่หน้าลูก
      const shine = document.createElement('div');
      shine.className = 'capsule-glass-shine';
      c.appendChild(shine);

      // เงาขอบโค้งทึบของเปลือกแคปซูล ทับบนสุด — ทำให้ตั๋วส่วนที่ชิดขอบดูจางลง/มืดลงเหมือนถูกความหนาของเปลือกบัง
      const rimShade = document.createElement('div');
      rimShade.className = 'capsule-rim-shade';
      c.appendChild(rimShade);
    }
    pile.appendChild(c);
  }
  stockCount.textContent = stock.length ? `เปิดได้อีก ${stock.length} ลูก` : `ไม่มีกาชาปองให้เปิดตอนนี้`;
}

function rarityOf(amount){
  if(amount >= 30) return 'legendary';
  if(amount >= 15) return 'rare';
  return 'common';
}

function boxNameFor(milestone){
  if(milestone === 'PAID') return 'GACHAPON · BONUS';
  const cfg = LB_CONFIG.find(c => c.milestone === Number(milestone));
  return cfg ? cfg.name : 'GACHAPON · MYSTERY';
}

function updatePlateText(){
  plateText.textContent = stock.length ? boxNameFor(stock[0]) : 'เปิดครบแล้วตอนนี้';
}

function spawnRatchetTicks(){
  const TICK_COUNT = 10;
  for(let i=0;i<TICK_COUNT;i++){
    const t = document.createElement('div');
    t.className = 'ratchet-tick';
    const angle = (360 / TICK_COUNT) * i;
    t.style.setProperty('--tick-angle', `${angle}deg`);
    t.style.animationDelay = (i * 45) + 'ms';
    tickRing.appendChild(t);
    requestAnimationFrame(()=> t.classList.add('go'));
    setTimeout(()=> t.remove(), 700);
  }
}

function jigglePile(){
  pile.classList.remove('jiggle');
  void pile.offsetWidth;
  pile.classList.add('jiggle');
}

// ============================================================
//  กันไม่ให้ค้างตลอดไปถ้า backend ไม่ตอบเลย
//  สำคัญ: 8 วิแรกเป็นแค่ "แจ้งเตือนว่าช้า" ไม่ใช่การยกเลิกจริง — request จริงยังทำงานต่อเบื้องหลัง
//  แล้วผลจริงจะถูกใช้ทันทีที่ backend ตอบกลับมา (ป้องกัน token เพี้ยนจากการ retry ซ้ำทั้งที่ backend เปิดกล่องไปแล้ว)
//  จะขึ้น hard-fail (ซิงค์ข้อมูลใหม่จาก server ให้อัตโนมัติ ไม่ต้องปิดแอปเอง) ก็ต่อเมื่อรอนานเกิน HARD_TIMEOUT_MS จริงๆ เท่านั้น
// ============================================================
function withTimeout(promise, ms, fallback){
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(()=> resolve(fallback), ms))
  ]);
}

// ============================================================
//  OPEN LOOT BOX — เรียก backend จริง ไม่สุ่มฝั่ง client
// ============================================================
function playOpen(){
  if(busy) return;
  if(stock.length === 0){ instruction.textContent = "ไม่มีกาชาปองให้เปิดแล้วตอนนี้"; return; }
  busy = true;
  updateIdleHints();
  crank.classList.add('turn');
  cabinet.classList.remove('rumble'); void cabinet.offsetWidth; cabinet.classList.add('rumble');
  crankWrap.classList.remove('rumble'); void crankWrap.offsetWidth; crankWrap.classList.add('rumble');
  pile.classList.remove('jiggle'); void pile.offsetWidth; pile.classList.add('jiggle');
  spawnRatchetTicks();
  crankGlow.classList.remove('go'); void crankGlow.offsetWidth; crankGlow.classList.add('go');
  instruction.textContent = "";

  const milestone = stock[0];
  const token = lootTokens[milestone];

  // request จริง — ไม่ถูกยกเลิกแม้ผู้ใช้จะเห็น UI แจ้งว่า "ช้า" แล้วก็ตาม
  // timeout ยาวกว่า HARD_TIMEOUT_MS ด้านล่าง เพราะที่นี่ตั้งใจปล่อยให้ request จริงทำงานต่อเบื้องหลัง
  // ไม่อยากให้ callGAS ไป abort ตัด request ทิ้งก่อนที่ logic soft/hard timeout ด้านล่างจะได้ทำงานตามที่ออกแบบไว้
  const realPromise = callGAS('openLootBox', { token }, 30000).catch((err) => {
    // เก็บ error จริงไว้ดูใน console เพื่อวินิจฉัยสาเหตุ (network ล่ม / CORS / parse JSON ไม่ได้ ฯลฯ)
    // ส่วนข้อความที่โชว์ผู้ใช้เอาไว้แค่บอกว่าต่อไม่ติด ไม่ต้องมีรายละเอียดทางเทคนิค
    console.error('openLootBox failed:', err);
    return { success:false, message:'เชื่อมต่อกับระบบไม่สำเร็จ' };
  });

  const SOFT_TIMEOUT_MS = 8000;  // แค่เปลี่ยนข้อความแจ้งเตือน ไม่ตัดการรอผลจริง
  const HARD_TIMEOUT_MS = 25000; // รอจริงนานสุดก่อนจะยอมแพ้และแนะนำให้รีโหลด
  const softTimer = setTimeout(()=>{
    if(busy) instruction.textContent = "เชื่อมต่อช้ากว่าปกติ กำลังรอผลอยู่...";
  }, SOFT_TIMEOUT_MS);
  realPromise.finally(()=> clearTimeout(softTimer));

  const apiPromise = withTimeout(
    realPromise,
    HARD_TIMEOUT_MS,
    { success:false, message:'ระบบช้าผิดปกติ กำลังซิงค์ข้อมูลใหม่ให้อัตโนมัติ', hardFail:true }
  );

  setTimeout(()=>{
    crank.classList.remove('turn');
    cabinet.classList.remove('rumble');
    crankWrap.classList.remove('rumble');
    pile.classList.remove('jiggle');
    dropCapsule(milestone, apiPromise);
  }, 780);
}

function dropCapsule(milestone, apiPromise){
  const isPaid = milestone === 'PAID';
  const col = NEW_PALETTE[Math.floor(Math.random()*NEW_PALETTE.length)];
  const angle = SPLIT_ANGLES[Math.floor(Math.random()*SPLIT_ANGLES.length)] + (Math.random() * 14 - 7);
  const capsuleBg = isPaid
    ? gachaBallBg('#B4822A', '#F5DFA0', 35 + Math.random()*30, angle)
    : gachaBallBg(col.main, col.shine, 35 + Math.random()*30, angle);

  const falling = document.createElement('div');
  falling.className = 'falling-capsule drop';
  falling.style.background = capsuleBg;
  dropZone.appendChild(falling);
  jigglePile();

  setTimeout(()=>{
    launchCapsuleFullscreen(falling, capsuleBg, milestone, apiPromise, isPaid);
  }, 700);
}

// ============================================================
//  แคปซูลเด้งขึ้นบังจอเต็มที่ ค้างลุ้นผลจาก backend
//  แล้วแตกออกเป็น 2 ซีก เผยป้ายรางวัล (overlay เดิม)
// ============================================================
let megaShakeTimers = [];

// ============================================================
//  รอยร้าวเปลือกแคปซูลใบใหญ่แบบ "กำลังจะฟักออกมา" (เส้นเดียว ไม่ใช่ใยแมงมุม)
//  ทรงรอยร้าวเป็น filled polygon เรียวธรรมชาติจริง (ไม่ใช่ stroke ความหนาคงที่)
//  สั่นครั้งที่ 1: รอยร้าวหลักโผล่ ยังไม่มีแสง — สั่นครั้งที่ 2: ขยายตัว+แตกฝอย+เริ่มมีแสง
//  สั่นครั้งที่ 3-4: แสงจ้าขึ้นเรื่อยๆ ก่อนมีชนวนแสงวิ่งพุ่งแล้ววาบสุดตอนแตกออกจริง
// ============================================================
const MEGA_CRACK_SHAPES = {
  // รอยร้าวหลัก (ทรงเรียวสองข้าง หนาตรงกลาง) + กิ่งแยกขึ้นบน — รวมเป็น 1 shape ต่อเนื่อง
  1: {
    fills: [
      "M27,58 L35,52.1 L31,47.7 L41,43.4 L49,45.7 L57,41.9 L64,45.7 L71,42.1 L78,49 L71,43.9 L64,48.3 L57,44.1 L49,48.3 L41,46.6 L31,50.3 L35,53.9 Z",
      "M57,41.9 L53,32.4 L56,24 L53,33.6 L57,44.1 Z"
    ],
    cores: [
      "M27,58 L35,53 L31,49 L41,45 L49,47 L57,43 L64,47 L71,43 L78,49",
      "M57,43 L53,33 L56,24"
    ]
  },
  // รอยร้าวขยายตัว: ปลายทั้งสองข้างยืดออกไปอีก + แตกกิ่งใหม่เล็กตรงกลาง (ทรงเรียวเช่นกัน)
  2: {
    fills: [
      "M78,49 L81.5,50.6 L85,53 L81.5,51.4 Z",
      "M56,24 L57.5,20.3 L59,16 L57,20.5 Z",
      "M41,45 L38.2,41.9 L36,38 L38.8,41.1 Z"
    ],
    cores: []
  }
};
// รอยแตกฝอยบางๆ แซมรอบรอยร้าวหลัก โผล่พร้อมสั่นครั้งที่ 2 ให้ดูเป็นธรรมชาติเหมือนเปลือกไข่จริง
const MEGA_CRACK_HAIRLINES = ["M31,49 L28,53", "M64,47 L67,40", "M53,33 L48,30"];

function createMegaCrack(){
  const wrap = document.createElement('div');
  wrap.className = 'mega-crack';
  let svgBody = '';
  for(const lvl of [1,2]){
    MEGA_CRACK_SHAPES[lvl].fills.forEach(d=>{
      svgBody += `<path class="crack-shadow lvl${lvl}" d="${d}"/>`;
      svgBody += `<path class="crack-glow lvl${lvl}" d="${d}"/>`;
    });
    MEGA_CRACK_SHAPES[lvl].cores.forEach(d=>{
      svgBody += `<path class="crack-core lvl${lvl}" pathLength="100" d="${d}"/>`;
    });
  }
  MEGA_CRACK_HAIRLINES.forEach(d=>{
    svgBody += `<path class="crack-hairline lvl2" pathLength="100" d="${d}"/>`;
  });
  wrap.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">${svgBody}</svg>`;
  return wrap;
}

// วงคลื่นกระแทกขยายออกจากลูกแคปซูล ให้ความรู้สึกอลังการตอนกระแทกแต่ละจังหวะ
function spawnShockwaveRing(mega, big){
  const rect = mega.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const ring = document.createElement('div');
  ring.className = 'mega-ring' + (big ? ' big' : '');
  const size = rect.width * (big ? 1.15 : 0.92);
  ring.style.left = cx + 'px';
  ring.style.top = cy + 'px';
  ring.style.width = size + 'px';
  ring.style.height = size + 'px';
  document.body.appendChild(ring);
  setTimeout(()=> ring.remove(), big ? 950 : 650);
}

// สะเก็ดแสงกระเด็นออกจากบริเวณรอยร้าวตอนกระแทกแต่ละจังหวะ (ตำแหน่ง % อ้างอิงตาม viewBox 0-100)
function spawnCrackSparks(mega, count){
  for(let i=0;i<count;i++){
    const s = document.createElement('div');
    s.className = 'crack-spark';
    const px = 45 + (Math.random()*22 - 11);
    const py = 45 + (Math.random()*14 - 7);
    s.style.left = px + '%';
    s.style.top  = py + '%';
    const ang = Math.random()*Math.PI*2;
    const dist = 8 + Math.random()*14;
    s.style.setProperty('--dx', Math.cos(ang)*dist + 'px');
    s.style.setProperty('--dy', Math.sin(ang)*dist + 'px');
    s.style.animationDelay = (Math.random()*0.05) + 's';
    mega.appendChild(s);
    setTimeout(()=> s.remove(), 650);
  }
}

// สะเก็ดแสงตอนแตกจริง — วางตำแหน่งอิงพิกัดหน้าจอ (ไม่ใช่ลูกของ mega) เพราะ mega จะถูกลบทิ้งเร็วกว่าที่แอนิเมชันจะเล่นจบ
function spawnBurstSparks(mega, count){
  const rect = mega.getBoundingClientRect();
  for(let i=0;i<count;i++){
    const s = document.createElement('div');
    s.className = 'crack-spark';
    s.style.position = 'fixed';
    s.style.left = (rect.left + rect.width * (0.34 + Math.random()*0.32)) + 'px';
    s.style.top  = (rect.top + rect.height * (0.34 + Math.random()*0.24)) + 'px';
    const ang = Math.random()*Math.PI*2;
    const dist = 16 + Math.random()*28;
    s.style.setProperty('--dx', Math.cos(ang)*dist + 'px');
    s.style.setProperty('--dy', Math.sin(ang)*dist + 'px');
    s.style.animationDelay = (Math.random()*0.05) + 's';
    document.body.appendChild(s);
    setTimeout(()=> s.remove(), 700);
  }
}

function launchCapsuleFullscreen(fallingEl, capsuleBg, milestone, apiPromise, isPaid){
  const rect = fallingEl.getBoundingClientRect();
  fallingEl.remove();

  const dim = document.createElement('div');
  dim.className = 'mega-dim';
  document.body.appendChild(dim);
  requestAnimationFrame(()=> dim.classList.add('on'));

  // แสงรัศมีหมุนรอบจอ เพิ่มความอลังการตอนพลังสะสมก่อนแตก
  const megaRays = document.createElement('div');
  megaRays.className = 'mega-rays';
  document.body.appendChild(megaRays);

  const mega = document.createElement('div');
  mega.className = 'mega-capsule';
  mega.style.background = capsuleBg;
  mega.style.left   = rect.left + 'px';
  mega.style.top    = rect.top + 'px';
  mega.style.width  = rect.width + 'px';
  mega.style.height = rect.height + 'px';
  document.body.appendChild(mega);

  // แสงระยิบระยับลอยรอบลูก แทนป้ายตั๋ว — ไม่มีข้อความ/ตัวเลขใดๆ ให้เห็นก่อนผลจริง
  const megaSparkles = document.createElement('div');
  megaSparkles.className = 'mega-sparkles';
  const SPARKLE_COUNT = 10;
  const sparkleSpecs = Array.from({length: SPARKLE_COUNT}, (_, i) => ({
    angle: (360 / SPARKLE_COUNT) * i + (Math.random() * 22 - 11),
    radius: 42 + Math.random() * 14,
    glyph: Math.random() > 0.5 ? '✦' : '✧',
    delay: (Math.random() * 1.4).toFixed(2),
    duration: (0.9 + Math.random() * 0.9).toFixed(2)
  }));

  requestAnimationFrame(()=>{
    mega.style.transition = 'left .85s cubic-bezier(.22,1.6,.4,1), top .85s cubic-bezier(.22,1.6,.4,1), width .85s cubic-bezier(.22,1.6,.4,1), height .85s cubic-bezier(.22,1.6,.4,1), box-shadow .45s ease-out';
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
    mega.style.left   = (window.innerWidth / 2 - size / 2) + 'px';
    mega.style.top    = (window.innerHeight / 2 - size / 2) + 'px';
    mega.style.width  = size + 'px';
    mega.style.height = size + 'px';

    sparkleSpecs.forEach(spec => {
      const rad = spec.angle * Math.PI / 180;
      const star = document.createElement('div');
      star.className = 'mega-sparkle';
      star.textContent = spec.glyph;
      star.style.left = (50 + Math.cos(rad) * spec.radius) + '%';
      star.style.top  = (50 + Math.sin(rad) * spec.radius) + '%';
      star.style.fontSize = (size * (0.07 + Math.random() * 0.05)).toFixed(1) + 'px';
      star.style.animationDelay = spec.delay + 's';
      star.style.animationDuration = spec.duration + 's';
      megaSparkles.appendChild(star);
    });
    mega.appendChild(megaSparkles);
  });

  // รอยร้าวแบบเปลือกไข่กำลังฟัก ค่อยๆ ลามทีละระดับตอนเขย่าแต่ละครั้ง
  const megaCrack = createMegaCrack();
  mega.appendChild(megaCrack);

  // สั่นตามจังหวะเดิม 4 ครั้งแรก (950/1500/2200/2900ms) แล้ว "วนต่อ" ที่ระดับแสงจ้าสุดทุกๆ 700ms
  // ไปเรื่อยๆ จนกว่าผลจริงจาก backend จะมาถึง — กันไม่ให้ลูกนิ่งค้างเงียบถ้า backend ตอบช้ากว่า 2.9 วิ
  // (เดิมมีแค่ 4 จังหวะตายตัว พอ backend ช้ากว่านั้นลูกจะหยุดสั่นเฉยๆ แล้วเหมือนค้างจนกว่าผลจะมา)
  const SHAKE_GAPS_MS = [950, 550, 700, 700]; // ดีเลย์เริ่มต้น แล้วช่วงห่างระหว่างครั้งที่ 1→2, 2→3, 3→4
  const SHAKE_LOOP_GAP_MS = 700; // ช่วงห่างของทุกครั้งถัดจากนั้น วนไปเรื่อยๆ
  let shakeIndex = 0;
  function scheduleNextShake(delay){
    const t = setTimeout(()=>{
      const i = shakeIndex++;
      // จังหวะพลังพุ่งวาบมืดสลัวลงเสี้ยววินาทีก่อนกระแทก แล้วสว่างกลับ ให้ความรู้สึกทรงพลัง
      dim.classList.add('surge');
      setTimeout(()=> dim.classList.remove('surge'), 110);

      mega.classList.remove('mega-shake'); void mega.offsetWidth; mega.classList.add('mega-shake');
      spawnCrackSparks(mega, Math.min(3 + i, 10));
      spawnShockwaveRing(mega, false);
      setTimeout(()=>{
        if(i === 0){
          // สั่นครั้งที่ 1: รอยร้าวหลักโผล่แบบธรรมชาติ ยังไม่มีแสง
          megaCrack.querySelectorAll('.crack-shadow.lvl1').forEach(p => p.classList.add('show'));
        } else if(i === 1){
          // สั่นครั้งที่ 2: รอยร้าวขยายตัว/แตกฝอยเพิ่ม พร้อมเริ่มมีแสงจ้าเรืองออกมา
          megaCrack.querySelectorAll('.crack-shadow.lvl2, .crack-hairline').forEach(p => p.classList.add('show'));
          megaCrack.classList.add('glow-1');
          mega.classList.add('glow-1');
          megaRays.classList.add('glow-1');
        } else if(i === 2){
          // สั่นครั้งที่ 3: แสงสว่างมากขึ้น
          megaCrack.classList.remove('glow-1'); megaCrack.classList.add('glow-2');
          mega.classList.remove('glow-1'); mega.classList.add('glow-2');
          megaRays.classList.remove('glow-1'); megaRays.classList.add('glow-2');
        } else {
          // สั่นครั้งที่ 4 เป็นต้นไป: ค้างที่แสงจ้าสุด (glow-3) แล้วสั่นวนซ้ำไปเรื่อยๆ จนกว่าผลจะมาถึงจริง
          megaCrack.classList.remove('glow-2'); megaCrack.classList.add('glow-3');
          mega.classList.remove('glow-2'); mega.classList.add('glow-3');
          megaRays.classList.remove('glow-2'); megaRays.classList.add('glow-3');
        }
      }, 90);

      const nextDelay = i + 1 < SHAKE_GAPS_MS.length ? SHAKE_GAPS_MS[i + 1] : SHAKE_LOOP_GAP_MS;
      scheduleNextShake(nextDelay);
    }, delay);
    megaShakeTimers.push(t);
  }
  scheduleNextShake(SHAKE_GAPS_MS[0]);

  const MIN_LAUNCH_MS = 950; // กันไว้ให้เห็นจังหวะเด้งบังจอเต็มที่ก่อนเสมอ แม้ backend จะตอบเร็วกว่านี้
  setTimeout(async ()=>{
    const result = await apiPromise;

    megaShakeTimers.forEach(t => clearTimeout(t));
    megaShakeTimers = [];

    splitCapsuleOpen(mega, dim, megaCrack, megaRays, ()=>{
      dropZone.innerHTML = "";

      if(!result || !result.success){
        // ทุกกรณี fail ที่นี่ (ไม่ว่า hardFail หรือ network error ทั่วไป) มีความเสี่ยงเหมือนกัน:
        // backend อาจเปิดกล่องสำเร็จไปแล้วจริง แค่ client ไม่ได้รับผลตอบกลับทัน
        // ถ้าปล่อยให้กดซ้ำด้วย token เดิมจะวนลูป fail ตลอด (token ถูกใช้ไปแล้วฝั่ง backend)
        // ต้อง resync สถานะจริงจาก server ทุกครั้งที่ fail แทนที่จะเชื่อ stock/token เดิมในเครื่อง
        if(result && result.hardFail){
          showToast('⏳ ระบบช้าผิดปกติ กำลังซิงค์ข้อมูลให้อัตโนมัติ...', 'error', 4000);
        } else {
          showErrorCard(result && result.message);
        }
        instruction.textContent = "🔄 กำลังซิงค์ข้อมูลใหม่...";
        const attemptedMilestone = milestone;
        reloadLootBoxData().then(()=>{
          // ถ้ากล่องนี้หายไปจาก stock หลัง resync แปลว่า backend เปิดสำเร็จไปแล้วจริง
          // (แค่ client ไม่ได้รับผลตอบกลับ) ต้องบอกผู้ใช้ ไม่งั้นจะไม่รู้เลยว่าได้รางวัลไปแล้ว
          if(!stock.includes(attemptedMilestone)){
            showToast('🎁 กล่องนี้เปิดสำเร็จไปแล้ว กำลังเปิดหน้าประวัติให้ดูรางวัลที่ได้รับ', 'success', 6000);
            openHistoryOverlay();
          }
        });
        return;
      }

      // เปิดสำเร็จ — ตัด milestone นี้ออกจาก stock queue จริง
      stock.shift();
      delete lootTokens[milestone];
      renderPile();
      updatePlateText();
      pile.classList.add('pile-settle');
      setTimeout(()=> pile.classList.remove('pile-settle'), 400);

      showResult(milestone, result, isPaid);
      instruction.textContent = stock.length ? "แตะที่จับอีกครั้งเพื่อเปิดลูกถัดไป" : "เปิดครบแล้วตอนนี้";
      busy = false;
      updateIdleHints();
    });
  }, MIN_LAUNCH_MS);
}

function splitCapsuleOpen(mega, dim, megaCrack, megaRays, onDone){
  const doSplit = ()=>{
    const rect = mega.getBoundingClientRect();

    const top = document.createElement('div');
    top.className = 'mega-half mega-top';
    top.style.background = mega.style.background;
    top.style.left = rect.left + 'px';
    top.style.top = rect.top + 'px';
    top.style.width = rect.width + 'px';
    top.style.height = rect.height + 'px';

    const bottom = document.createElement('div');
    bottom.className = 'mega-half mega-bottom';
    bottom.style.background = mega.style.background;
    bottom.style.left = rect.left + 'px';
    bottom.style.top = rect.top + 'px';
    bottom.style.width = rect.width + 'px';
    bottom.style.height = rect.height + 'px';

    document.body.appendChild(top);
    document.body.appendChild(bottom);
    mega.remove();

    // เฟลชสองชั้นซ้อนกัน (แกนขาวจ้าตรงกลาง + วงไล่สีทองด้านนอก) ให้แสงมีมิติและอลังการขึ้น
    const flashCore = document.createElement('div');
    flashCore.className = 'mega-flash core';
    document.body.appendChild(flashCore);
    requestAnimationFrame(()=> flashCore.classList.add('go'));

    const flash = document.createElement('div');
    flash.className = 'mega-flash';
    document.body.appendChild(flash);
    requestAnimationFrame(()=> flash.classList.add('go'));

    requestAnimationFrame(()=>{
      top.classList.add('mega-split-top');
      bottom.classList.add('mega-split-bottom');
    });

    dim.classList.remove('on');

    // เผยป้ายรางวัลทันทีตอนแสงแฟลชขึ้น ไม่ต้องรอซีกแคปซูลบินสุดก่อน
    setTimeout(()=> onDone(), 180);

    // เคลียร์ element ซีกแคปซูล/แสง/dim/รัศมีทิ้งหลังเล่นแอนิเมชันจบจริง
    setTimeout(()=>{
      top.remove();
      bottom.remove();
      dim.remove();
      flash.remove();
      flashCore.remove();
      megaRays.remove();
    }, 640);
  };

  if(megaCrack){
    // ก่อนแยกเปลือกจริง: ร้าวลามเต็มลูก → ชนวนแสงวิ่งพุ่งเร็วๆ ตามรอยร้าว →
    // คลื่นกระแทกวงใหญ่ + สะเก็ดแสงพรู + กล้องสั่นทั้งจอ → วาบสว่างสุดแล้วค่อยแตกออก
    megaCrack.querySelectorAll('.crack-shadow').forEach(p => p.classList.add('show'));
    void megaCrack.offsetWidth;
    megaCrack.classList.add('fuse');
    setTimeout(()=>{
      megaCrack.classList.add('shatter');
      megaRays.classList.add('shatter');
      spawnShockwaveRing(mega, true);
      spawnBurstSparks(mega, 16);
      document.body.classList.add('mega-camera-shake');
      setTimeout(()=> document.body.classList.remove('mega-camera-shake'), 360);
      setTimeout(doSplit, 90);
    }, 150);
  } else {
    doSplit();
  }
}

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

// เปิดไม่สำเร็จ — โชว์การ์ดตรงกลางจอแบบเดียวกับรางวัล (จุดที่ผู้ใช้กำลังมองอยู่พอดีตอนจบแอนิเมชัน)
// แทนที่จะให้เห็นแค่ toast เล็กๆ บนสุดจอซึ่งพลาดง่ายมาก หลังแอนิเมชันเต็มจอจบลง
function showErrorCard(message){
  prizeCard.classList.add('error-state');
  rarityRibbon.classList.remove('shine');
  rarityRibbon.textContent = '⚠️ ลองใหม่อีกครั้ง';
  resultTierLabel.textContent = '';
  resultPrize.textContent = 'เปิดไม่สำเร็จ';
  resultNote.textContent = message || 'เกิดข้อผิดพลาด ลองแตะที่จับอีกครั้งได้เลยครับ';
  closeBtn.textContent = 'ลองใหม่อีกครั้ง';

  document.querySelectorAll('.burst').forEach(el=>el.remove());
  screenFlash.classList.remove('go','big');

  overlay.classList.remove('show'); void overlay.offsetWidth; overlay.classList.add('show');
}

function showResult(milestone, result, isPaid){
  prizeCard.classList.remove('error-state');
  closeBtn.textContent = 'เก็บรางวัล 🎉';
  const amount = Number(result.discount_amount) || 0;
  const rarity = rarityOf(amount);

  resultTierLabel.textContent = (stockLabels[milestone] || milestone).toUpperCase();
  resultPrize.textContent = `ส่วนลด ${amount} บาท`;
  resultNote.textContent = "ส่วนลดเข้ารอบบิลถัดไปอัตโนมัติ";

  // ป้ายเดียวกันทุกระดับ — ไม่บอกว่าได้ของ "ดี/ธรรมดา" แค่ไหน ให้ความรู้สึกดีเท่ากันทุกรางวัล
  rarityRibbon.textContent = '🎉 ยินดีด้วย!';
  rarityRibbon.classList.remove('shine');
  if(rarity !== 'common'){ void rarityRibbon.offsetWidth; rarityRibbon.classList.add('shine'); }

  document.querySelectorAll('.burst').forEach(el=>el.remove());

  const count = rarity === 'legendary' ? 28 : rarity === 'rare' ? 18 : 9;
  for(let i=0;i<count;i++){
    const b = document.createElement('div');
    b.className = 'burst';
    const angle = Math.random()*Math.PI*2;
    const dist = 30 + Math.random()*30;
    b.style.setProperty('--dx', `${Math.cos(angle)*dist}px`);
    b.style.setProperty('--dy', `${Math.sin(angle)*dist}px`);
    b.style.background = Math.random() > .5 ? 'var(--gold)' : NEW_PALETTE[Math.floor(Math.random()*NEW_PALETTE.length)].main;
    prizeCard.appendChild(b);
    setTimeout(()=> b.classList.add('go'), 10);
  }

  screenFlash.classList.remove('go','big'); void screenFlash.offsetWidth;
  document.querySelectorAll('.confetti-piece').forEach(el=>el.remove());

  if(rarity === 'legendary'){
    screenFlash.classList.add('go','big');
    setTimeout(()=> spawnConfetti(46), 300);
  } else if(rarity === 'rare'){
    screenFlash.classList.add('go');
    setTimeout(()=> spawnConfetti(20), 300);
  } else {
    screenFlash.classList.add('go');
  }

  overlay.classList.remove('show'); void overlay.offsetWidth; overlay.classList.add('show');
}

closeBtn.addEventListener('click', ()=> overlay.classList.remove('show'));
crank.addEventListener('click', playOpen);
crank.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); playOpen(); } });
retryBtn.addEventListener('click', ()=>{
  retryBtn.classList.add('loading');
  instruction.textContent = 'กำลังลองเชื่อมต่อใหม่...';
  reloadLootBoxData().finally(()=> retryBtn.classList.remove('loading'));
});

// ============================================================
//  RENDER CABINET จากข้อมูลจริง (getLootBoxDataByRoom / getLootBoxData)
// ============================================================
function updateRoomLabel(room){
  cabRoomBadge.textContent = 'ห้อง ' + room;
  currentRoomNo = room;
  showHistoryButton();
}

// ดึง logic ที่ใช้ร่วมกันระหว่าง "โชว์จาก cache ทันที" กับ "โชว์จากผลจริง" ออกมาเป็นก้อนเดียว
function applyCabinetData(result){
  cabinet.classList.remove('cabinet-error');
  if(result.roomNo) updateRoomLabel(result.roomNo);

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

  renderPile();
  updatePlateText();
}

// โชว์ตู้จาก cache ทันทีระหว่างรอ backend ตอบจริง — ยังไม่เปิด crank ให้หมุน
// (token ใน cache อาจเก่ากว่าความจริงแล้ว เช่น เพิ่งเปิดไปจากเครื่องอื่น จึงต้องรอผลจริงก่อนอนุญาตให้กด)
function renderCabinetPreview(result){
  applyCabinetData(result);
  instruction.textContent = "กำลังซิงค์ข้อมูลล่าสุด...";
}

function renderCabinet(result){
  retryBtn.style.display = 'none';
  applyCabinetData(result);
  crank.style.pointerEvents = '';
  busy = false;
  updateIdleHints();
  instruction.textContent = stock.length
    ? "แตะที่จับเพื่อลุ้นรางวัล"
    : "ยังไม่มีกาชาปองให้เปิดในตอนนี้";
  saveCacheSnapshot(result);
}

// เรียก callGAS พร้อม retry อัตโนมัติ 1 ครั้งถ้า fetch ล้มเหลวจริง (เน็ตหลุด/parse พัง ฯลฯ)
// ไม่ retry ถ้า backend ตอบกลับมาแบบ success:false ชัดเจน (เช่น token ผิด) เพราะลองใหม่ก็ไม่ช่วย
// timeoutMs สั้นกว่า default (10s) เพราะการ "โหลดข้อมูลตู้ตอนเปิดแอป" ควรรู้ผล/ขึ้น error เร็ว
// ต่างจาก openLootBox ที่ยอมรอนานกว่าได้เพราะเป็น action ที่แก้ไขข้อมูลจริงฝั่ง backend
const DATA_FETCH_TIMEOUT_MS = 6000;

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
let bootMode  = null; // 'room' | 'token' | 'userId' — จำวิธีโหลดข้อมูลตอนเปิดแอปไว้ ใช้ซิงค์ใหม่ทีหลังได้โดยไม่ต้องปิดแอป
let bootParam = null;

// ค่อยๆ จางจอ loading ออกแทนหายวับทันที (กันภาพกระตุก) — ปลอดภัยเรียกซ้ำได้ เช็ค element เองก่อน
function removeBootMask(){
  const boot = document.getElementById('boot-mask');
  if (!boot || boot.classList.contains('fade-out')) return;
  boot.classList.add('fade-out');
  setTimeout(() => boot.remove(), 350);
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const room   = params.get('room');
  const token  = params.get('token');
  const view   = params.get('view');

  crank.style.pointerEvents = 'none'; // ปิดจนกว่าจะโหลดข้อมูลจริงเสร็จ

  // มี room/token → ยิง data fetch ทันที ไม่ต้องรอ LIFF handshake ก่อน (ไม่จำเป็นต้องใช้ LIFF profile ใน 2 path นี้)
  if (room) {
    bootMode = 'room'; bootParam = room;
    tryRenderFromCache('room', room); // โชว์ของรอบก่อนทันทีระหว่างรอ backend ตอบจริง (ถ้ามี cache)
    await loadLootBoxForRoom(room);
  } else if (token) {
    bootMode = 'token'; bootParam = token;
    tryRenderFromCache('token', token);
    await loadLootBoxByToken(token);
  } else {
    // ไม่มี room/token → ต้องพึ่ง LIFF profile จริงๆ ค่อย await ตรงนี้ (cache ยังใช้ไม่ได้เพราะยังไม่รู้ userId)
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

// ซิงค์ข้อมูลกล่อง/token ใหม่จาก server ด้วยวิธีเดียวกับตอนบูตแอป
// ใช้ตอน request เปิดกล่องช้าผิดปกติจนหมดเวลา เพื่อดึงสถานะจริงมาแทนที่จะให้ผู้ใช้ปิดแอปเอง
async function reloadLootBoxData(){
  busy = true;
  updateIdleHints();
  if(bootMode === 'room') await loadLootBoxForRoom(bootParam);
  else if(bootMode === 'token') await loadLootBoxByToken(bootParam);
  else if(bootMode === 'userId') await loadLootBoxByUserId(bootParam);
  else showError('❌ ไม่พบข้อมูลห้อง');
}

init();
