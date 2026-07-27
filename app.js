// ============================================================
//  กล่องสุ่มรางวัล — app.js (Gachapon Edition)
//  UI: ตู้กาชาปอง — logic เชื่อม backend คงเดิม 100% (ไม่สุ่มฝั่ง client)
// ============================================================

const GAS_URL = 'https://script.google.com/macros/s/AKfycbx57fi00n2RKu7b5jHu67vzUVwrez1cx6RhW0lvvM9cIkt6_amJzMoVJOJvrwD7imHBnA/exec';
const LIFF_ID = '2004478373-aQPYZEpt';

// milestone → ชื่อกล่อง (ใช้แสดงในตู้/ป้าย/ประวัติ) — ลำดับนี้คือลำดับที่ stock queue จะเปิดก่อน-หลัง
const LB_CONFIG = [
  { milestone: 7,  name: 'กล่องเงิน',      tier: 'silver' },
  { milestone: 14, name: 'กล่องทอง',        tier: 'gold'   },
  { milestone: 21, name: 'กล่องแพลตินัม',   tier: 'plat'   },
  { milestone: 28, name: 'กล่องตำนาน',      tier: 'legend' },
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
async function callGAS(action, params = {}) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...params })
  });
  return res.json();
}

function showToast(msg, type = 'success', duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast ' + type;
  setTimeout(() => t.className = 'toast', duration);
}

function showError(msg) {
  instruction.textContent = msg;
  stockCount.textContent  = '';
  plateText.textContent   = 'ไม่พร้อมใช้งาน';
  crank.style.pointerEvents = 'none';
  crankBase.classList.add('hide-breathe');
  dismissTapHints();
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
const crankBase      = document.querySelector('.crank-base');
const crankWrap      = document.getElementById('crankWrap');
const cabRoomBadge   = document.getElementById('cabRoomBadge');
const plateText      = document.getElementById('plateText');

function dismissTapHints(){
  idlePulse.classList.add('hide');
  crankBase.classList.add('hide-breathe');
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
function gachaBallBg(mainColor, shineColor, levelPct){
  const lvl = levelPct;
  return [
    `radial-gradient(circle at 30% 20%, rgba(255,255,255,.95), rgba(255,255,255,0) 40%)`,
    `linear-gradient(180deg, transparent 0%, transparent ${lvl-3}%, ${shineColor} ${lvl-3}%, ${shineColor} ${lvl+1}%, transparent ${lvl+1}%, transparent 100%)`,
    `linear-gradient(180deg, ${FROST} 0%, ${FROST} ${lvl}%, ${mainColor} ${lvl}%, ${mainColor} 100%)`
  ].join(', ');
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
      const level = 38 + Math.random() * 26; // ระดับน้ำสีในลูกไม่เท่ากัน เหมือนของจริง
      c.style.background = gachaBallBg(col.main, col.shine, level);

      // ป้ายตั๋วส่วนลด "บรรจุอยู่ในแคปซูล" จริงๆ — ขนาดใหญ่เกือบเต็มลูก ตำแหน่ง/มุมเอียงสุ่มแบบธรรมชาติ
      // ไม่มีลูกไหนอยู่กลางเป๊ะเหมือนกันหมด แล้วให้ขอบวงกลมของแคปซูล (overflow:hidden) ตัดขอบตั๋วที่เกินออกไปเอง เหมือนของจริงที่ตั๋วถูกอัดอยู่ในเปลือกใส
      const tilt = (Math.random() * 34 - 17).toFixed(1);
      const offX = (Math.random() * 20 - 10).toFixed(1);
      const offY = (Math.random() * 18 - 9).toFixed(1);
      const ticket = document.createElement('div');
      ticket.className = 'capsule-ticket';
      ticket.style.width = (size * (0.8 + Math.random() * 0.16)) + 'px';
      ticket.style.borderRadius = (size * 0.07) + 'px';
      ticket.style.padding = (size * 0.032) + 'px 0';
      ticket.style.left = (50 + Number(offX)) + '%';
      ticket.style.top = (50 + Number(offY)) + '%';
      ticket.style.transform = `translate(-50%,-50%) rotate(${(-rot * 1 + Number(tilt))}deg)`;
      ticket.innerHTML =
        `<div class="capsule-ticket-label" style="font-size:${(size * 0.105).toFixed(1)}px">ส่วนลด</div>` +
        `<div class="capsule-ticket-amount" style="font-size:${(size * 0.25).toFixed(1)}px;color:${col.main}">${CAPSULE_NUMBERS[Math.floor(Math.random()*CAPSULE_NUMBERS.length)]}</div>` +
        `<div class="capsule-ticket-unit" style="font-size:${(size * 0.095).toFixed(1)}px">บาท</div>`;
      c.appendChild(ticket);
    }
    pile.appendChild(c);
  }
  stockCount.textContent = stock.length ? `เปิดได้อีก ${stock.length} กล่อง` : `ไม่มีกล่องให้เปิดตอนนี้`;
}

function rarityOf(amount){
  if(amount >= 30) return 'legendary';
  if(amount >= 15) return 'rare';
  return 'common';
}

function boxNameFor(milestone){
  if(milestone === 'PAID') return 'กล่อง PAID';
  const cfg = LB_CONFIG.find(c => c.milestone === Number(milestone));
  return cfg ? cfg.name : 'กล่องลึกลับ';
}

function updatePlateText(){
  plateText.textContent = stock.length ? `ถัดไป: ${boxNameFor(stock[0])}` : 'เปิดครบแล้วตอนนี้';
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
  if(stock.length === 0){ instruction.textContent = "ไม่มีกล่องให้เปิดแล้วตอนนี้"; return; }
  busy = true;
  dismissTapHints();
  crank.classList.add('turn');
  cabinet.classList.remove('rumble'); void cabinet.offsetWidth; cabinet.classList.add('rumble');
  crankWrap.classList.remove('rumble'); void crankWrap.offsetWidth; crankWrap.classList.add('rumble');
  pile.classList.remove('jiggle'); void pile.offsetWidth; pile.classList.add('jiggle');
  spawnRatchetTicks();
  crankGlow.classList.remove('go'); void crankGlow.offsetWidth; crankGlow.classList.add('go');
  instruction.textContent = "กำลังหมุน...";

  const milestone = stock[0];
  const token = lootTokens[milestone];
  const apiPromise = withTimeout(
    callGAS('openLootBox', { token }).catch(() => ({ success:false, message:'เกิดข้อผิดพลาด' })),
    8000,
    { success:false, message:'เชื่อมต่อช้าเกินไป ลองใหม่อีกครั้งครับ' }
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
  const capsuleBg = isPaid
    ? `radial-gradient(circle at 32% 28%, #fff, var(--gold) 55%, var(--gold-deep))`
    : gachaBallBg(col.main, col.shine, 35 + Math.random()*30);

  const falling = document.createElement('div');
  falling.className = 'falling-capsule drop';
  falling.style.background = capsuleBg;
  dropZone.appendChild(falling);
  instruction.textContent = "แคปซูลกำลังหล่นลงราง...";
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
let megaDotsTimer = null;

function launchCapsuleFullscreen(fallingEl, capsuleBg, milestone, apiPromise, isPaid){
  const rect = fallingEl.getBoundingClientRect();
  fallingEl.remove();

  const dim = document.createElement('div');
  dim.className = 'mega-dim';
  document.body.appendChild(dim);
  requestAnimationFrame(()=> dim.classList.add('on'));

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
    mega.style.transition = 'left .85s cubic-bezier(.22,1.6,.4,1), top .85s cubic-bezier(.22,1.6,.4,1), width .85s cubic-bezier(.22,1.6,.4,1), height .85s cubic-bezier(.22,1.6,.4,1)';
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

  instruction.textContent = "ลุ้นๆ...";
  let dots = 0;
  megaDotsTimer = setInterval(()=>{
    dots = (dots + 1) % 4;
    instruction.textContent = "ลุ้นๆ" + ".".repeat(dots);
  }, 350);

  const SHAKE_OFFSETS_MS = [950, 1500, 2200, 2900]; // เริ่มสั่นหลังเด้งขึ้นบังจอเต็มที่แล้วเท่านั้น
  megaShakeTimers = SHAKE_OFFSETS_MS.map(ms => setTimeout(()=>{
    mega.classList.remove('mega-shake'); void mega.offsetWidth; mega.classList.add('mega-shake');
  }, ms));

  const MIN_LAUNCH_MS = 950; // กันไว้ให้เห็นจังหวะเด้งบังจอเต็มที่ก่อนเสมอ แม้ backend จะตอบเร็วกว่านี้
  setTimeout(async ()=>{
    const result = await apiPromise;

    clearInterval(megaDotsTimer);
    megaShakeTimers.forEach(t => clearTimeout(t));
    megaShakeTimers = [];

    splitCapsuleOpen(mega, dim, ()=>{
      dropZone.innerHTML = "";

      if(!result || !result.success){
        showToast('❌ ' + (result && result.message || 'เกิดข้อผิดพลาด'), 'error');
        instruction.textContent = stock.length ? "👉 แตะที่จับเพื่อลองใหม่" : "ไม่มีกล่องให้เปิดแล้วตอนนี้";
        busy = false;
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
      instruction.textContent = stock.length ? "👉 แตะที่จับอีกครั้งเพื่อเปิดกล่องถัดไป" : "เปิดครบแล้วตอนนี้";
      busy = false;
    });
  }, MIN_LAUNCH_MS);
}

function splitCapsuleOpen(mega, dim, onDone){
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

  // เคลียร์ element ซีกแคปซูล/แสง/dim ทิ้งหลังเล่นแอนิเมชันจบจริง
  setTimeout(()=>{
    top.remove();
    bottom.remove();
    dim.remove();
    flash.remove();
  }, 640);
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

function showResult(milestone, result, isPaid){
  const amount = Number(result.discount_amount) || 0;
  const rarity = rarityOf(amount);

  resultTierLabel.textContent = (stockLabels[milestone] || milestone).toUpperCase();
  resultPrize.textContent = `ส่วนลด ${amount} บาท`;
  resultNote.textContent = isPaid
    ? "กล่องจ่ายตรงเวลา — เปิดได้ 1 ครั้งต่อรอบบิลเท่านั้น"
    : "เพิ่มเข้ายอดส่วนลดรอบบิลถัดไปแล้วครับ";

  rarityRibbon.textContent = rarity === 'legendary' ? '★ พิเศษสุด' : rarity === 'rare' ? '✦ หายาก' : '✓ ธรรมดา';
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

// ============================================================
//  RENDER CABINET จากข้อมูลจริง (getLootBoxDataByRoom / getLootBoxData)
// ============================================================
function updateRoomLabel(room){
  cabRoomBadge.textContent = 'ห้อง ' + room;
  currentRoomNo = room;
  showHistoryButton();
}

function renderCabinet(result){
  if(result.roomNo) updateRoomLabel(result.roomNo);

  stock = [];
  lootTokens = {};
  const order = [7, 14, 21, 28, 'PAID'];
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
  crank.style.pointerEvents = '';
  busy = false;
  instruction.textContent = stock.length
    ? "👉 แตะที่จับเพื่อลุ้นรางวัล"
    : "ยังไม่มีกล่องให้เปิดในตอนนี้";
}

async function loadLootBoxForRoom(roomNo) {
  try {
    const result = await callGAS('getLootBoxDataByRoom', { roomNo });
    if (!result.success) { showError('❌ ' + (result.message || 'โหลดไม่ได้')); return; }
    renderCabinet(result);
  } catch (e) { showError('❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ'); }
}

async function loadLootBoxByToken(token) {
  try {
    const result = await callGAS('getLootBoxData', { token });
    if (!result.success) { showError('❌ ' + (result.message || 'Token ไม่ถูกต้อง')); return; }
    renderCabinet(result);
  } catch (e) { showError('❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ'); }
}

async function loadLootBoxByUserId(userId) {
  try {
    const result = await callGAS('getLootBoxData', { userId });
    if (!result.success) { showError('❌ ' + (result.message || 'โหลดไม่ได้')); return; }
    renderCabinet(result);
  } catch (e) { showError('❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ'); }
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
    body.innerHTML = '<div class="loading">ยังไม่มีประวัติการเปิดกล่องครับ</div>';
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
async function init() {
  const params = new URLSearchParams(window.location.search);
  const room   = params.get('room');
  const token  = params.get('token');
  const view   = params.get('view');

  crank.style.pointerEvents = 'none'; // ปิดจนกว่าจะโหลดข้อมูลจริงเสร็จ

  await initLiff();

  if (room) {
    await loadLootBoxForRoom(room);
  } else if (token) {
    await loadLootBoxByToken(token);
  } else if (liffReady && liff.isLoggedIn() && liffProfile) {
    await loadLootBoxByUserId(liffProfile.userId);
  } else {
    showError('❌ ไม่พบข้อมูลห้อง');
  }

  if (view === 'history' && currentRoomNo) {
    openHistoryOverlay();
  }

  document.getElementById('boot-mask')?.remove();
}

init();
