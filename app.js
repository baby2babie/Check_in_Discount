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
const bigCapsule     = document.getElementById('bigCapsule');
const halfTop        = document.getElementById('halfTop');
const halfBottom     = document.getElementById('halfBottom');
const halfTopInner   = document.getElementById('halfTopInner');
const halfBottomInner = document.getElementById('halfBottomInner');
const resultTierLabel = document.getElementById('resultTierLabel');
const resultPrize    = document.getElementById('resultPrize');
const resultNote     = document.getElementById('resultNote');
const rarityRibbon   = document.getElementById('rarityRibbon');
const closeBtn       = document.getElementById('closeBtn');
const cabinet        = document.querySelector('.cabinet');
const stage          = document.querySelector('.stage');
const tickRing       = document.getElementById('tickRing');
const crankGlow      = document.getElementById('crankGlow');
const screenFlash    = document.getElementById('screenFlash');
const confettiLayer  = document.getElementById('confettiLayer');
const flapLid        = document.getElementById('flapLid');
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
const FROST = "#DCEEF5"; // กระจกฝ้าฟ้าอ่อน — ใช้เป็นสีฐานของทุกลูกเหมือนกันหมด
const BAND_ANGLE = 100; // มุมแถบสี/ตะเข็บ — ใช้ร่วมกันทั้ง background และการหมุนตัวเลขให้ตรงแนวตะเข็บ
const NEW_PALETTE = [
  { main:"#F2C230", shine:"#FFE58A" },
  { main:"#2E7FD1", shine:"#6FB4EC" },
  { main:"#C1372C", shine:"#E8703F" },
  { main:"#3FA07A", shine:"#7FD1AF" },
  { main:"#8B5CF6", shine:"#C4B5FD" },
];
const CAPSULE_NUMBERS = [5, 10, 15, 20, 25, 30, 50];

function shadeColor(hex, percent){
  const num = parseInt(hex.replace("#",""), 16);
  let r = (num>>16) + Math.round(255*percent/100);
  let g = ((num>>8)&0x00FF) + Math.round(255*percent/100);
  let b = (num&0x0000FF) + Math.round(255*percent/100);
  r = Math.max(0,Math.min(255,r)); g = Math.max(0,Math.min(255,g)); b = Math.max(0,Math.min(255,b));
  return "#" + (0x1000000 + r*0x10000 + g*0x100 + b).toString(16).slice(1);
}

// สร้าง background แบบ "โดมฝ้า + แถบสีทแยงมุมไล่เฉดมีมิติ + ตะเข็บบาง + ไฮไลต์ฟุ้ง" ในเลเยอร์เดียว
// คืนทั้ง background string และสีเงาที่เข้าชุดกัน (ใช้กับ box-shadow ให้ดูพรีเมียมขึ้น ไม่ใช่เงาดำแบน)
function gachaBallStyle(mainColor, shineColor, splitPct){
  const angle = BAND_ANGLE;
  const s = splitPct;
  const mainLight = shadeColor(mainColor, 14);
  const mainDark  = shadeColor(mainColor, -20);
  const seam      = shadeColor(mainColor, -30);
  const background = [
    `radial-gradient(circle at 22% 18%, rgba(255,255,255,.95), rgba(255,255,255,0) 34%)`,               // ไฮไลต์ฟุ้งนุ่ม
    `linear-gradient(${angle}deg, transparent 0%, transparent ${s-9}%, ${shineColor} ${s-9}%, ${shineColor} ${s+3}%, transparent ${s+3}%, transparent 100%)`, // แถบชายน์
    `linear-gradient(${angle}deg, transparent 0%, transparent ${s-0.6}%, ${seam} ${s-0.6}%, ${seam} ${s+0.6}%, transparent ${s+0.6}%, transparent 100%)`,   // ตะเข็บบาง
    `linear-gradient(${angle}deg, ${FROST} 0%, ${FROST} ${s}%, ${mainLight} ${s+1}%, ${mainColor} ${s+18}%, ${mainDark} 100%)` // แถบสีไล่เฉดมีมิติ
  ].join(', ');
  return { background, shadowHex: mainDark };
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

    const size = 26 + Math.random() * 20;
    const left = Math.random() * 78;
    const top = 26 + Math.pow(Math.random(), 1.7) * 70;
    const rot = (Math.random() * 360).toFixed(1); // หมุนเต็มวง สุ่มทิศทางอิสระ เหมือนแคปซูลถูกเขย่าคละกันจริงๆ

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
      const split = 25 + Math.random() * 40; // สัดส่วนแถบสีต่อลูกไม่เท่ากัน เหมือนของจริง
      const { background, shadowHex } = gachaBallStyle(col.main, col.shine, split);
      c.style.background = background;
      c.style.setProperty('--shadow-color', shadowHex + 'B3');
      // ตัวเลขส่วนลดปั๊มอยู่ในโซนสีของแคปซูล — หมุนตามแนวตะเข็บ (BAND_ANGLE) ไม่ใช่แนวนอนตรงๆ
      // เพราะแนวนอนจะตัดกับแนวตะเข็บทแยงมุมเกือบ 90 องศา ดูขัดตา ไม่เป็นธรรมชาติ
      // ตำแหน่งไม่บังคับกึ่งกลางเป๊ะ เพราะแคปซูลกลิ้งคละทิศทางแล้ว ขอแค่อยู่ในโซนสีคร่าวๆ ก็พอ
      const num = document.createElement('div');
      num.className = 'capsule-number';
      num.textContent = CAPSULE_NUMBERS[Math.floor(Math.random()*CAPSULE_NUMBERS.length)];
      num.style.fontSize = (size * 0.3) + 'px';
      num.style.transform = `rotate(${BAND_ANGLE}deg)`;
      c.appendChild(num);
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
//  SUSPENSE EFFECTS — เล่นระหว่างรอผลจริงจาก backend
//  (แทนที่จะปล่อยให้ค้างเฉยๆ ตรงข้อความ "ลุ้นๆ...")
// ============================================================
let suspenseDotsTimer = null;
let suspenseShakeTimers = [];
const SHAKE_OFFSETS_MS = [100, 550, 1300, 2200]; // จังหวะไม่สมมาตร ถี่ขึ้นเรื่อยๆ ให้รู้สึกใกล้จะได้ผล

function burstShake(capsuleEl){
  capsuleEl.classList.remove('shake-burst'); void capsuleEl.offsetWidth; capsuleEl.classList.add('shake-burst');
}

function startSuspenseEffects(capsuleEl){
  capsuleEl.classList.add('landed'); // แคปซูลขยายใหญ่ขึ้นค้างไว้ระหว่างรอ
  let dots = 0;
  suspenseDotsTimer = setInterval(()=>{
    dots = (dots + 1) % 4;
    instruction.textContent = "ลุ้นๆ" + ".".repeat(dots);
  }, 350);
  suspenseShakeTimers = SHAKE_OFFSETS_MS.map(ms => setTimeout(()=>burstShake(capsuleEl), ms));
}

function stopSuspenseEffects(){
  clearInterval(suspenseDotsTimer);
  suspenseShakeTimers.forEach(t => clearTimeout(t));
  suspenseShakeTimers = [];
  suspenseDotsTimer = null;
}

// กันไม่ให้ค้างตลอดไปถ้า backend ไม่ตอบเลย
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
  const { background, shadowHex } = isPaid
    ? { background:`radial-gradient(circle at 32% 28%, #fff, var(--gold) 55%, var(--gold-deep))`, shadowHex:'#B4822A' }
    : gachaBallStyle(col.main, col.shine, 35 + Math.random()*30);

  const falling = document.createElement('div');
  falling.className = 'falling-capsule drop';
  falling.style.background = background;
  falling.style.setProperty('--shadow-color', shadowHex + 'B3');
  dropZone.appendChild(falling);
  instruction.textContent = "แคปซูลกำลังหล่นลงราง...";

  jigglePile();

  setTimeout(()=>{
    flapLid.classList.add('open');
    startSuspenseEffects(falling);
  }, 700);

  setTimeout(async ()=>{
    const result = await apiPromise;
    stopSuspenseEffects();

    dropZone.innerHTML = "";
    flapLid.classList.remove('open');

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
  }, 1050);
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

  // สีแคปซูลลูกใหญ่ที่จะเด้งเข้ามาบัง แล้วแตกออกเป็น 2 ซีก — โทนเดียวกับแคปซูลในโดม
  const col = NEW_PALETTE[Math.floor(Math.random()*NEW_PALETTE.length)];
  const { background: capsuleBg, shadowHex } = isPaid
    ? { background:`radial-gradient(circle at 32% 28%, #fff, var(--gold) 55%, var(--gold-deep))`, shadowHex:'#B4822A' }
    : gachaBallStyle(col.main, col.shine, 35 + Math.random()*30);
  bigCapsule.style.background = capsuleBg;
  bigCapsule.style.setProperty('--shadow-color', shadowHex + 'B3');
  halfTopInner.style.background = capsuleBg;
  halfBottomInner.style.background = capsuleBg;

  // รีเซ็ตสถานะแอนิเมชันทั้งหมดก่อนเล่นใหม่
  bigCapsule.classList.remove('bounce-in','hide');
  halfTop.classList.remove('crack-go');
  halfBottom.classList.remove('crack-go');
  document.querySelectorAll('.burst').forEach(el=>el.remove());
  document.querySelectorAll('.confetti-piece').forEach(el=>el.remove());
  screenFlash.classList.remove('go','big');
  stage.classList.remove('shake-big');
  void bigCapsule.offsetWidth;

  overlay.classList.remove('show'); void overlay.offsetWidth; overlay.classList.add('show');
  bigCapsule.classList.add('bounce-in');

  // ~950ms: แคปซูลเด้งนิ่งแล้ว — แฟลช + เริ่มแตกออกเป็น 2 ซีก
  setTimeout(()=>{
    screenFlash.classList.add('go');
    if(rarity === 'legendary') screenFlash.classList.add('big');
    if(rarity !== 'common') stage.classList.add('shake-big');
    bigCapsule.classList.add('hide');
    halfTop.classList.add('crack-go');
    halfBottom.classList.add('crack-go');
  }, 950);

  // ~1250ms: ซีกแคปซูลแตกหายไปพอดีกับตอนป้ายรางวัลเด้งขึ้นมา (ตรงกับ card-rise delay 1.25s ใน CSS)
  setTimeout(()=>{
    if(rarity !== 'common'){ rarityRibbon.classList.remove('shine'); void rarityRibbon.offsetWidth; rarityRibbon.classList.add('shine'); }

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

    if(rarity === 'legendary') spawnConfetti(46);
    else if(rarity === 'rare') spawnConfetti(20);
  }, 1250);
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
