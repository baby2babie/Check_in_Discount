// ============================================================
//  กล่องสุ่มรางวัล — app.js (Premium Edition)
// ============================================================

const GAS_URL = 'https://script.google.com/macros/s/AKfycbx57fi00n2RKu7b5jHu67vzUVwrez1cx6RhW0lvvM9cIkt6_amJzMoVJOJvrwD7imHBnA/exec';
const LIFF_ID = '2004478373-pUgVSZTj';

const LB_CONFIG = [
  { milestone: 7,  name: 'กล่องเงิน',      tier: 'silver', ms: 'ms-silver' },
  { milestone: 14, name: 'กล่องทอง',        tier: 'gold',   ms: 'ms-gold'   },
  { milestone: 21, name: 'กล่องแพลตินัม',   tier: 'plat',   ms: 'ms-plat'   },
  { milestone: 28, name: 'กล่องตำนาน',      tier: 'legend', ms: 'ms-legend' },
];

const TIER_CFG = {
  paid: {
    color: '#C084FC', label: 'PAID BONUS',
    shakeClass: 'shake-soft',
    tensionDur: '3.0s',
    glitch: false,
    ringCol: 'rgba(192,132,252,.3)',
    orbits: [
      { r:53, dur:1.8, planets:[{col:'#E879F9',sz:6,start:0},{col:'#A5F3FC',sz:4,start:180}] },
      { r:80, dur:2.8, planets:[{col:'#C084FC',sz:8,start:60},{col:'#FCA5A5',sz:5,start:200},{col:'#A5F3FC',sz:4,start:320}] },
      { r:103,dur:4.2, planets:[{col:'#E879F9',sz:10,start:90},{col:'#C084FC',sz:5,start:210},{col:'#FCA5A5',sz:4,start:330}] },
    ],
    badge:{ bg:'linear-gradient(145deg,#1e0a2e,#120618)', border:'rgba(232,121,249,.4)', glow:'rgba(192,132,252,.35)' },
    badgeGrad: 'linear-gradient(160deg,#fdf4ff,#E879F9 45%,#7e22ce)',
    btn:{ bg:'linear-gradient(135deg,#E879F9 0%,#A855F7 100%)', color:'#1a0030', glow:'rgba(232,121,249,.5)' },
    confetti: ['#E879F9','#C084FC','#A5F3FC','#FCA5A5','#fff','#F0ABFC'],
  },
  silver: {
    color: '#94A3B8', label: 'SILVER RANK',
    shakeClass: 'shake-soft', tensionDur: '2.6s', glitch: false,
    ringCol: 'rgba(148,163,184,.3)',
    orbits: [
      { r:55, dur:2.2, planets:[{col:'#93D2FF',sz:6,start:0},{col:'#38BFA1',sz:4,start:180}] },
      { r:82, dur:3.8, planets:[{col:'#93D2FF',sz:8,start:60},{col:'#E9A84C',sz:4,start:220},{col:'#93D2FF',sz:5,start:310}] },
      { r:105,dur:5.5, planets:[{col:'#93D2FF',sz:10,start:90},{col:'#9B7EE8',sz:4,start:210},{col:'#93D2FF',sz:4,start:330}] },
    ],
    badge:{ bg:'linear-gradient(145deg,#0a1a2a,#040c14)', border:'rgba(147,210,255,.5)', glow:'rgba(147,210,255,.4)' },
    badgeGrad: 'linear-gradient(160deg,#f0f8ff,#93D2FF 45%,#1a5f8a)',
    btn:{ bg:'linear-gradient(135deg,#475569 0%,#1E293B 100%)', color:'#E2E8F0', glow:'rgba(148,163,184,.4)' },
    confetti: ['#94A3B8','#CBD5E1','#E2E8F0','#fff','#64748B'],
  },
  gold: {
    color: '#F59E0B', label: 'GOLD RANK',
    shakeClass: 'shake-mid', tensionDur: '2.8s', glitch: false,
    ringCol: 'rgba(255,215,0,.32)',
    orbits: [
      { r:53, dur:1.6, planets:[{col:'#FFD700',sz:7,start:0},{col:'#38BFA1',sz:4,start:180}] },
      { r:80, dur:2.8, planets:[{col:'#FFD700',sz:9,start:60},{col:'#E9A84C',sz:5,start:185},{col:'#FF8C00',sz:5,start:305}] },
      { r:103,dur:4.2, planets:[{col:'#FFD700',sz:12,start:120},{col:'#93D2FF',sz:5,start:240},{col:'#FFD700',sz:5,start:5}] },
    ],
    badge:{ bg:'linear-gradient(145deg,#2a1f08,#1a1200)', border:'rgba(255,215,0,.5)', glow:'rgba(255,215,0,.45)' },
    badgeGrad: 'linear-gradient(160deg,#fffde7,#FFD700 45%,#92400E)',
    btn:{ bg:'linear-gradient(135deg,#F59E0B 0%,#B45309 100%)', color:'#1C0A00', glow:'rgba(245,158,11,.55)' },
    confetti: ['#FFD700','#F59E0B','#FEF08A','#fff','#F97316'],
  },
  plat: {
    color: '#A78BFA', label: 'PLATINUM RANK',
    shakeClass: 'shake-hard', tensionDur: '3.0s', glitch: false,
    ringCol: 'rgba(167,139,250,.35)',
    orbits: [
      { r:51, dur:1.1, planets:[{col:'#A78BFA',sz:7,start:0},{col:'#C084FC',sz:4,start:120},{col:'#E9A84C',sz:3,start:240}] },
      { r:78, dur:2.0, planets:[{col:'#A78BFA',sz:9,start:45},{col:'#C084FC',sz:6,start:170},{col:'#93D2FF',sz:4,start:285}] },
      { r:101,dur:3.2, planets:[{col:'#A78BFA',sz:12,start:90},{col:'#C084FC',sz:6,start:205},{col:'#FF5555',sz:4,start:320},{col:'#A78BFA',sz:4,start:5}] },
    ],
    badge:{ bg:'linear-gradient(145deg,#150a2a,#0a0618)', border:'rgba(167,139,250,.5)', glow:'rgba(167,139,250,.45)' },
    badgeGrad: 'linear-gradient(160deg,#faf5ff,#A78BFA 45%,#4c1d95)',
    btn:{ bg:'linear-gradient(135deg,#A78BFA 0%,#5B21B6 100%)', color:'#F5F3FF', glow:'rgba(167,139,250,.55)' },
    confetti: ['#A78BFA','#C084FC','#DDD6FE','#fff','#7C3AED'],
  },
  legend: {
    color: '#EF4444', label: 'LEGENDARY RANK',
    shakeClass: 'shake-chaos', tensionDur: '3.4s', glitch: true,
    ringCol: 'rgba(255,85,85,.42)',
    orbits: [
      { r:50, dur:0.8, planets:[{col:'#FF5555',sz:7,start:0},{col:'#FF8C00',sz:4,start:120},{col:'#FFD700',sz:3,start:240}] },
      { r:77, dur:1.5, planets:[{col:'#FF5555',sz:10,start:60},{col:'#FF8C00',sz:6,start:185},{col:'#FF5555',sz:5,start:305}] },
      { r:100,dur:2.4, planets:[{col:'#FF5555',sz:13,start:90},{col:'#FF8C00',sz:7,start:205},{col:'#FFD700',sz:5,start:315},{col:'#FF5555',sz:4,start:20}] },
    ],
    badge:{ bg:'linear-gradient(145deg,#2a0808,#180404)', border:'rgba(255,85,85,.6)', glow:'rgba(255,60,60,.5)' },
    badgeGrad: 'linear-gradient(160deg,#fff1f2,#FF5555 45%,#7f1d1d)',
    btn:{ bg:'linear-gradient(135deg,#EF4444 0%,#7F1D1D 100%)', color:'#FFF1F2', glow:'rgba(239,68,68,.6)' },
    confetti: ['#FF5555','#FF8C00','#FCA5A5','#fff','#EF4444'],
  }
};

let lbOpening   = false;
let liffReady   = false;
let liffProfile = null;

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
  document.getElementById('lb-grid').innerHTML =
    `<div class="loading" style="color:#EF4444">${msg}</div>`;
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
//  INIT
// ============================================================
async function init() {
  const grid   = document.getElementById('lb-grid');
  const params = new URLSearchParams(window.location.search);
  const room   = params.get('room');
  const token  = params.get('token');
  const isPaid = params.get('paid');

  grid.innerHTML = LB_CONFIG.map(() =>
    `<div class="lb-card lb-skeleton"></div>`
  ).join('');

  await initLiff();

  if (room) {
    document.getElementById('lb-room-label').textContent = 'ห้อง ' + room;
  }

  if (isPaid !== null) {
    await initPaidPage(room);
  } else if (room) {
    await loadLootBoxForRoom(room);
  } else if (token) {
    await loadLootBoxByToken(token);
  } else if (liffReady && liff.isLoggedIn() && liffProfile) {
    await loadLootBoxByUserId(liffProfile.userId);
  } else {
    showError('❌ ไม่พบข้อมูลห้อง');
  }
}

// ============================================================
//  PAID PAGE
// ============================================================
async function initPaidPage(roomNo) {
  document.querySelector('.dash-title h1').textContent = 'กล่องโบนัส';
  document.querySelector('.dash-title p').textContent  = 'รางวัลจากการจ่ายตรงเวลา';
  document.querySelector('.count-wrap').style.display  = 'none';

  const grid = document.getElementById('lb-grid');
  grid.style.cssText = 'display:flex;justify-content:center;width:90%;max-width:380px';
  grid.innerHTML = `<div class="lb-card lb-skeleton" style="width:100%;height:290px"></div>`;

  if (!roomNo) { showError('❌ ไม่พบข้อมูลห้อง'); return; }

  try {
    const result = await callGAS('getLootBoxDataByRoom', { roomNo });
    if (!result.success) { showError('❌ ' + (result.message || 'โหลดไม่ได้')); return; }
    renderPaidCard((result.boxes || {})['PAID'] || {});
  } catch (e) {
    showError('❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ');
  }
}

function renderPaidCard(info) {
  const grid     = document.getElementById('lb-grid');
  const hasBox   = info.token && !info.opened;
  const isOpened = info.token &&  info.opened;
  const isLocked = !info.token;

  const card = document.createElement('div');
  card.className = 'lb-card'
    + (hasBox   ? ' can-open' : '')
    + (isOpened ? ' used'     : '')
    + (isLocked ? ' locked'   : '');
  card.id = 'lb-card-PAID';
  card.setAttribute('data-tier', 'paid');
  card.style.cssText = 'width:100%;padding:40px 20px;--t-color:#C084FC';

  card.innerHTML = `
    <span class="lb-card-icon" style="font-size:64px">${
      isOpened ? '🎁' : hasBox ? '🎁' : '🔒'
    }</span>
    <div class="lb-card-name" style="font-size:16px;margin-top:16px">PAID BONUS</div>
    <div class="lb-card-sub" style="font-size:14px;margin-top:8px">${
      hasBox   ? 'กดเพื่อเปิดกล่อง!' :
      isOpened ? 'เปิดแล้วเดือนนี้'  :
                 'จ่ายตรงเวลาเพื่อรับกล่อง'
    }</div>
    <div class="lb-card-ms ms-paid" style="margin-top:16px">จ่ายตรงเวลา</div>
  `;

  if (hasBox) {
    card.onclick = () => startLootOpen('PAID', 'กล่อง Paid Bonus', 'paid', info.token);
  }

  // ✅ wrap + border trace canvas
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;width:100%';

  if (hasBox) {
    const cv = document.createElement('canvas');
    cv.id = 'paid-trace';
    cv.style.cssText = 'position:absolute;inset:-3px;pointer-events:none;z-index:3;border-radius:27px';
    wrap.appendChild(cv);
  }

  wrap.appendChild(card);
  grid.innerHTML = '';
  grid.appendChild(wrap);

  setTimeout(() => {
    card.classList.add('fade-in');
    if (hasBox) initPaidTrace('paid-trace', wrap);
  }, 300);
}

// ============================================================
//  LOAD DATA
// ============================================================
async function loadLootBoxForRoom(roomNo) {
  try {
    const result = await callGAS('getLootBoxDataByRoom', { roomNo });
    if (!result.success) { showError('❌ ' + (result.message || 'โหลดไม่ได้')); return; }
    renderPage(result);
  } catch (e) { showError('❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ'); }
}

async function loadLootBoxByToken(token) {
  try {
    const result = await callGAS('getLootBoxData', { token });
    if (!result.success) { showError('❌ ' + (result.message || 'Token ไม่ถูกต้อง')); return; }
    renderPage(result);
  } catch (e) { showError('❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ'); }
}

async function loadLootBoxByUserId(userId) {
  try {
    const result = await callGAS('getLootBoxData', { userId });
    if (!result.success) { showError('❌ ' + (result.message || 'โหลดไม่ได้')); return; }
    renderPage(result);
  } catch (e) { showError('❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ'); }
}

// ============================================================
//  RENDER — 4 กล่อง
// ============================================================
function renderPage(result) {
  if (result.roomNo) {
    document.getElementById('lb-room-label').textContent = 'ห้อง ' + result.roomNo;
  }
  document.getElementById('lb-count').textContent = result.totalBox || 0;
  renderLootGrid(result.boxes || {});
}

function renderLootGrid(boxes) {
  const grid = document.getElementById('lb-grid');
  grid.innerHTML = '';

  LB_CONFIG.forEach((cfg, i) => {
    const info     = boxes[cfg.milestone] || {};
    const hasBox   = info.token && !info.opened;
    const isOpened = info.token &&  info.opened;
    const isLocked = !info.token;

    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative';

    if (hasBox) {
      const cv = document.createElement('canvas');
      cv.className = 'sparks';
      cv.id = 'sp-' + cfg.milestone;
      wrap.appendChild(cv);
    }

    const card = document.createElement('div');
    card.className = 'lb-card'
      + (hasBox   ? ' can-open' : '')
      + (isOpened ? ' used'     : '')
      + (isLocked ? ' locked'   : '');
    card.id = 'lb-card-' + cfg.milestone;
    card.setAttribute('data-tier', cfg.tier);
    card.style.setProperty('--t-color', TIER_CFG[cfg.tier].color);
    card.classList.add('float-' + (i + 1));

    card.innerHTML = `
      <span class="lb-card-icon">🎁</span>
      <div class="lb-card-name">${cfg.name.toUpperCase()}</div>
      <div class="lb-card-sub">${
        hasBox   ? 'กดเพื่อเปิดกล่อง' :
        isOpened ? 'เปิดแล้ว'         : 'ยังไม่ถึงรอบ'
      }</div>
      <div class="lb-card-ms ${cfg.ms}">ครบ ${cfg.milestone} วัน</div>
    `;

    if (hasBox) {
      card.onclick = () => startLootOpen(cfg.milestone, cfg.name, cfg.tier, info.token);
    }

    wrap.appendChild(card);
    setTimeout(() => card.classList.add('fade-in'), i * 80);
    grid.appendChild(wrap);

    if (hasBox) {
      setTimeout(() => initSparks('sp-' + cfg.milestone, TIER_CFG[cfg.tier].color), i * 80 + 100);
    }
  });
}

// ============================================================
//  SOLAR SYSTEM HTML
// ============================================================
function buildSolarHTML(tier) {
  const cfg = TIER_CFG[tier];
  const cx = 110, cy = 110, sz = 220;

  let svg = `<svg viewBox="0 0 ${sz} ${sz}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%"><defs>`;
  cfg.orbits.forEach((_,i) =>
    svg += `<filter id="rf${i}${tier}"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
  );
  svg += `</defs>`;
  cfg.orbits.forEach((orb, i) => {
    svg += `<circle cx="${cx}" cy="${cy}" r="${orb.r}" fill="none" stroke="${cfg.ringCol}" stroke-width="${i===2?1.5:1}" filter="url(#rf${i}${tier})"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${orb.r}" fill="none" stroke="${cfg.color}" stroke-width="0.4" opacity="0.25"/>`;
  });
  svg += `</svg>`;

  let planets = '';
  cfg.orbits.forEach(orb => {
    orb.planets.forEach(p => {
      const h = p.sz / 2;
      planets += `<div class="planet-css" style="
        width:${p.sz}px;height:${p.sz}px;margin:-${h}px 0 0 -${h}px;
        background:${p.col};
        box-shadow:0 0 ${p.sz*2}px ${p.col},0 0 ${p.sz*3}px ${p.col}88;
        --s:${p.start}deg;--r:${orb.r}px;
        animation-duration:${orb.dur}s;
        animation-delay:-${(p.start/360*orb.dur).toFixed(2)}s;
      "></div>`;
    });
  });

  const sun = `<div class="box-center" id="box-icon" style="
    background:radial-gradient(circle at 35% 35%,#1a1a24,#08080e);
    border:2px solid ${cfg.color};
    box-shadow:0 0 24px ${cfg.color}88,0 0 50px ${cfg.color}44;
  ">🎁</div>`;

  return svg + planets + sun;
}

// ============================================================
//  OPEN LOOT BOX
// ============================================================
function startLootOpen(milestone, name, tier, token) {
  if (lbOpening) return;
  lbOpening = true;

  if (tier === 'paid') {
    startStardustOpen(token);
    return;
  }

  const cfg     = TIER_CFG[tier];
  const overlay = document.getElementById('lb-overlay');
  const flash   = document.getElementById('flash');

  document.documentElement.style.setProperty('--t-color', cfg.color);
  overlay.style.background = '#000';
  overlay.classList.add('active');
  document.getElementById('result-ui').classList.remove('show');
  document.getElementById('spin-wrap').style.display = 'flex';
  document.getElementById('spin-stage').innerHTML = buildSolarHTML(tier);
  overlay.classList.remove('shake-soft','shake-mid','shake-hard','shake-chaos');
  overlay.classList.add(cfg.shakeClass);

  const boxIcon = document.getElementById('box-icon');
  boxIcon.style.setProperty('--tension-dur', cfg.tensionDur);
  setTimeout(() => {
    boxIcon.classList.add(tier === 'paid' ? 'box-paid-tension' : 'box-tension');
  }, 100);

  if (cfg.glitch) {
    const errColor = tier === 'paid' ? '#C084FC' : '#ff0033';
    ['err1','err2','err3'].forEach(id => {
      const el = document.getElementById(id);
      el.style.color = errColor;
      el.classList.add('show');
    });
    setTimeout(() => boxIcon.classList.add('box-glitch'), 1600);
  }

  callGAS('openLootBox', { token })
    .then(result => {
      const waitTime = cfg.glitch ? 3600 : 2700;
      setTimeout(() => {
        if (!result.success) {
          closeLootPopup();
          showToast('❌ ' + (result.message || 'เกิดข้อผิดพลาด'), 'error');
          lbOpening = false;
          return;
        }

        flash.style.animation = 'flashTrigger .6s forwards';
        setTimeout(() => {
          flash.style.animation = '';
          overlay.classList.remove('shake-soft','shake-mid','shake-hard','shake-chaos');
          ['err1','err2','err3'].forEach(id => document.getElementById(id).classList.remove('show'));
          document.getElementById('spin-wrap').style.display = 'none';
          overlay.style.background = 'radial-gradient(circle,#1E293B 0%,#000 100%)';

          const badge = document.getElementById('res-badge');
          const sym   = badge.querySelector('.res-badge-sym');
          badge.style.cssText = `width:90px;height:90px;border-radius:18px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;animation:badgeFloat 2s ease-in-out infinite alternate;background:${cfg.badge.bg};border:1.5px solid ${cfg.badge.border};box-shadow:0 0 28px ${cfg.badge.glow}`;
          sym.style.cssText   = `font-size:46px;font-weight:900;font-family:Arial Black,sans-serif;position:relative;z-index:1;line-height:1;background:${cfg.badgeGrad};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 14px ${cfg.color})`;
          document.getElementById('res-tier-name').textContent = cfg.label;

          const btn = document.getElementById('btn-claim');
          btn.style.setProperty('--btn-bg',    cfg.btn.bg);
          btn.style.setProperty('--btn-color', cfg.btn.color);
          btn.style.setProperty('--btn-glow',  cfg.btn.glow);
          btn.style.color = cfg.btn.color;

          const valEl = document.getElementById('prize-val');
          valEl.style.animation = 'none';
          valEl.textContent = '0';
          void valEl.offsetWidth;
          valEl.style.animation = '';
          document.getElementById('result-ui').classList.add('show');

          const card = document.getElementById('lb-card-' + milestone);
          if (card) {
            card.classList.add('used');
            card.querySelector('.lb-card-sub').textContent = 'เปิดแล้ว';
            card.onclick = null;
          }
          const cur = Number(document.getElementById('lb-count').textContent) || 0;
          document.getElementById('lb-count').textContent = Math.max(0, cur - 1);

          setTimeout(() => {
            countUp(valEl, result.discount_amount, 1800);
            spawnConfetti(cfg.confetti);
          }, 300);

          lbOpening = false;
        }, 150);
      }, waitTime);
    })
    .catch(() => {
      closeLootPopup();
      showToast('❌ เกิดข้อผิดพลาด กรุณาลองใหม่ครับ', 'error');
      lbOpening = false;
    });
}

// ============================================================
//  CLOSE
// ============================================================
function closeLootPopup() {
  const overlay = document.getElementById('lb-overlay');
  overlay.classList.remove('active','shake-soft','shake-mid','shake-hard','shake-chaos');
  document.getElementById('result-ui').classList.remove('show');
  document.getElementById('spin-stage').innerHTML = '';
  ['err1','err2','err3'].forEach(id => document.getElementById(id).classList.remove('show'));
  spawnConfettiStop();
  lbOpening = false;
}

// ============================================================
//  COUNT UP
// ============================================================
function countUp(el, target, dur) {
  const t0 = performance.now();
  (function step(now) {
    const t = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - t, 6);
    el.textContent = Math.round(e * target);
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = target;
  })(t0);
}

// ============================================================
//  CONFETTI
// ============================================================
function spawnConfetti(cols) {
  const w = document.getElementById('lb-confetti');
  w.innerHTML = ''; w.classList.add('show');
  for (let i = 0; i < 140; i++) {
    const d = document.createElement('div');
    d.className = 'c-dot';
    const sz = 4 + Math.random() * 9, rect = Math.random() > .4;
    d.style.cssText = `left:${Math.random()*100}vw;width:${sz}px;height:${rect?sz*2:sz}px;background:${cols[Math.floor(Math.random()*cols.length)]};border-radius:${rect?'2px':'50%'};animation-duration:${1.6+Math.random()*2.2}s;animation-delay:${Math.random()*.6}s;box-shadow:0 0 6px ${cols[Math.floor(Math.random()*cols.length)]}`;
    w.appendChild(d);
  }
  setTimeout(() => spawnConfettiStop(), 5500);
}

function spawnConfettiStop() {
  const w = document.getElementById('lb-confetti');
  w.classList.remove('show');
  w.innerHTML = '';
}

// ============================================================
//  STARDUST — PAID BOX
// ============================================================
const STAR_COLORS = ['#E879F9','#C084FC','#A5F3FC','#FCA5A5','#F0ABFC','#fff','#DDD6FE'];
let starParticles = [];
let starAnimId    = null;
let starPhase     = 'idle';
let starExplodeT  = 0;
let starGatherT   = 0;

function startStardustOpen(token) {
  const overlay = document.getElementById('paid-overlay');
  const canvas  = document.getElementById('paid-canvas');
  const boxIcon = document.getElementById('paid-box-icon');

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;

  overlay.classList.add('active');
  document.getElementById('paid-result').classList.remove('show');
  boxIcon.style.display = 'flex';

  starPhase    = 'explode';
  starExplodeT = 0;
  starGatherT  = 0;
  createStarParticles(cx, cy);

  setTimeout(() => {
    boxIcon.style.animation = 'none';
    boxIcon.style.transform = 'scale(0)';
  }, 300);

  let apiResult = null;
  callGAS('openLootBox', { token })
    .then(r  => { apiResult = r; })
    .catch(() => { apiResult = { success: false, message: 'เกิดข้อผิดพลาด' }; });

  const ctx = canvas.getContext('2d');

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (starPhase === 'explode') {
      starExplodeT++;
      starParticles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.08; p.vx *= 0.98;
        p.twinkle += 0.1;
        drawStar(ctx, p, .6 + .4 * Math.sin(p.twinkle));
      });
      if (starExplodeT > 60) { starPhase = 'orbit'; starGatherT = 0; }
    }

    else if (starPhase === 'orbit') {
      starGatherT++;
      starParticles.forEach(p => {
        p.orbitAngle += p.orbitSpeed * 1.5;
        p.x = lerp(p.x, cx + Math.cos(p.orbitAngle) * p.orbitR, .08);
        p.y = lerp(p.y, cy + Math.sin(p.orbitAngle) * p.orbitR, .08);
        p.twinkle += 0.12;
        drawStar(ctx, p, .5 + .5 * Math.sin(p.twinkle));
      });
      if (starGatherT > 80) { starPhase = 'gather'; starGatherT = 0; }
    }

    else if (starPhase === 'gather') {
      starGatherT++;
      const progress = Math.min(starGatherT / 60, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);

      starParticles.forEach(p => {
        p.orbitAngle += p.orbitSpeed * (1 + progress * 4);
        const tx = cx + Math.cos(p.orbitAngle) * p.orbitR * (1 - eased);
        const ty = cy + Math.sin(p.orbitAngle) * p.orbitR * (1 - eased);
        p.x = lerp(p.x, tx, .1);
        p.y = lerp(p.y, ty, .1);
        p.size = Math.max(.5, p.size * (1 - eased * .02));
        p.twinkle += .15;
        drawStar(ctx, p, Math.max(0, (1 - eased) * (.6 + .4 * Math.sin(p.twinkle))));
      });

      if (progress > .8) {
        const fa = (progress - .8) / .2 * .6;
        ctx.save();
        ctx.globalAlpha = fa;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
        grad.addColorStop(0, '#E879F9');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 100, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      }

      if (progress >= 1) { starPhase = 'waiting'; starGatherT = 0; }
    }

    else if (starPhase === 'waiting') {
      starGatherT++;
      const pulse = .3 + .3 * Math.sin((starGatherT / 120) * Math.PI * 2);

      ctx.save();
      ctx.globalAlpha = pulse;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 130);
      grad.addColorStop(0, '#E879F9');
      grad.addColorStop(.5, '#C084FC');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 130, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      starGatherT % 1 === 0 && starParticles.slice(0, 20).forEach((p, i) => {
        const a = (starGatherT * .05) + (i / 20) * Math.PI * 2;
        p.x = cx + Math.cos(a) * 50;
        p.y = cy + Math.sin(a) * 50;
        p.twinkle += .2;
        drawStar(ctx, p, .4 + .4 * Math.sin(p.twinkle));
      });

      if (apiResult !== null) {
        starPhase = 'done';
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!apiResult.success) {
          closePaidOverlay();
          showToast('❌ ' + (apiResult.message || 'เกิดข้อผิดพลาด'), 'error');
          lbOpening = false;
          return;
        }

        showStardustResult(apiResult, canvas, cx, cy);
        return;
      }
    }

    starAnimId = requestAnimationFrame(loop);
  }

  loop();
}

function drawStar(ctx, p, alpha) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillStyle   = p.color;
  ctx.shadowColor = p.color;
  ctx.shadowBlur  = 8;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function lerp(a, b, t) { return a + (b - a) * t; }

function createStarParticles(cx, cy) {
  starParticles = [];
  for (let i = 0; i < 120; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    starParticles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 3,
      size: 2 + Math.random() * 4,
      color: randomStarColor(),
      alpha: 1,
      orbitR: 60 + Math.random() * 80,
      orbitSpeed: (Math.random() > .5 ? 1 : -1) * (.02 + Math.random() * .04),
      orbitAngle: angle,
      twinkle: Math.random() * Math.PI * 2
    });
  }
}

function randomStarColor() {
  return STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
}

function showStardustResult(result, canvas, cx, cy) {
  const resultEl = document.getElementById('paid-result');
  const valEl    = document.getElementById('paid-prize-val');

  valEl.style.animation = 'none';
  valEl.textContent = '0';
  void valEl.offsetWidth;
  valEl.style.animation = '';

  resultEl.classList.add('show');

  const card = document.getElementById('lb-card-PAID');
  if (card) {
    card.classList.remove('can-open');
    card.classList.add('used');
    card.querySelector('.lb-card-sub').textContent = 'เปิดแล้วเดือนนี้';
    card.querySelector('.lb-card-icon').textContent = '🎁';
    card.onclick = null;
  }

  setTimeout(() => {
    countUp(valEl, result.discount_amount, 1800);
    spawnStarConfetti(canvas, cx, cy);
  }, 300);

  lbOpening = false;
}

function spawnStarConfetti(canvas, cx, cy) {
  const ctx  = canvas.getContext('2d');
  let drops  = [];
  for (let i = 0; i < 100; i++) {
    drops.push({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 100,
      vx: (Math.random() - .5) * 2,
      vy: 1.5 + Math.random() * 2.5,
      size: 2 + Math.random() * 5,
      color: randomStarColor(),
      alpha: 1,
      twinkle: Math.random() * Math.PI * 2
    });
  }
  function fall() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drops = drops.filter(p => p.alpha > .05);
    drops.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.alpha -= .005;
      p.twinkle += .1;
      drawStar(ctx, p, p.alpha * (.6 + .4 * Math.sin(p.twinkle)));
    });
    if (drops.length) requestAnimationFrame(fall);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  fall();
}

function closePaidOverlay() {
  const overlay = document.getElementById('paid-overlay');
  overlay.classList.remove('active');
  const canvas = document.getElementById('paid-canvas');
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  if (starAnimId) { cancelAnimationFrame(starAnimId); starAnimId = null; }
  starPhase = 'idle';
  const boxIcon = document.getElementById('paid-box-icon');
  boxIcon.style.cssText = '';
  document.getElementById('paid-result').classList.remove('show');
  lbOpening = false;
}

// ============================================================
//  SPARKS — 4 กล่อง
// ============================================================
function initSparks(id, baseColor) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const wrap = canvas.parentElement;
  canvas.width  = wrap.offsetWidth  || 160;
  canvas.height = wrap.offsetHeight || 180;
  const ctx = canvas.getContext('2d');
  const particles = [];
  const cols = [baseColor, '#ffffff', baseColor + 'aa'];

  function spawn() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if      (edge === 0) { x = Math.random() * canvas.width; y = 0; }
    else if (edge === 1) { x = canvas.width;  y = Math.random() * canvas.height; }
    else if (edge === 2) { x = Math.random() * canvas.width; y = canvas.height; }
    else                 { x = 0; y = Math.random() * canvas.height; }
    particles.push({
      x, y,
      vx: (Math.random() - .5) * 1.0,
      vy: (Math.random() - .5) * 1.0,
      size: 1.5 + Math.random() * 2,
      color: cols[Math.floor(Math.random() * cols.length)],
      life: 0,
      maxLife: 45 + Math.random() * 35
    });
  }

  let frame = 0;
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;
    if (frame % 7 === 0) spawn();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      const alpha = 1 - p.life / p.maxLife;
      if (alpha <= 0) { particles.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle   = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(loop);
  }
  loop();
}

// ============================================================
//  BORDER TRACE — PAID กล่องเดียว
// ============================================================
function initPaidTrace(id, wrap) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const W = (wrap.offsetWidth  || 320) + 6;
  const H = (wrap.offsetHeight || 260) + 6;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const r   = 27;
  const perimeter = 2 * (W + H) - (8 - 2 * Math.PI) * r;

  const tracers = [
    { t:0.0,  speed:0.0028, tailLen:0.18, col:'#E879F9' },
    { t:0.33, speed:0.0022, tailLen:0.14, col:'#A5F3FC' },
    { t:0.66, speed:0.0035, tailLen:0.12, col:'#C084FC' },
  ];

  function progressToPoint(prog) {
    prog = ((prog % 1) + 1) % 1;
    const dist   = prog * perimeter;
    const top    = W - 2*r + Math.PI*r/2;
    const right  = top    + H - 2*r + Math.PI*r/2;
    const bottom = right  + W - 2*r + Math.PI*r/2;

    if (dist <= top) {
      const topFlat = W - 2*r;
      if (dist <= topFlat) return { x: r + dist, y: 0 };
      const a = (dist - topFlat) / r - Math.PI/2;
      return { x: W-r + Math.cos(a)*r, y: r + Math.sin(a)*r };
    } else if (dist <= right) {
      const d2 = dist - top;
      if (d2 <= Math.PI*r/2) {
        const a = d2/r;
        return { x: W-r + Math.cos(a)*r, y: r + Math.sin(a)*r };
      }
      const d3 = d2 - Math.PI*r/2;
      if (d3 <= H-2*r) return { x: W, y: r + d3 };
      const a = (d3-(H-2*r))/r;
      return { x: W-r + Math.cos(a)*r, y: H-r + Math.sin(a)*r };
    } else if (dist <= bottom) {
      const d2 = dist - right;
      if (d2 <= Math.PI*r/2) {
        const a = d2/r;
        return { x: W-r + Math.cos(a)*r, y: H-r + Math.sin(a)*r };
      }
      const d3 = d2 - Math.PI*r/2;
      if (d3 <= W-2*r) return { x: W-r-d3, y: H };
      const a = Math.PI + (d3-(W-2*r))/r;
      return { x: r + Math.cos(a)*r, y: H-r + Math.sin(a)*r };
    } else {
      const d2 = dist - bottom;
      if (d2 <= Math.PI*r/2) {
        const a = Math.PI + d2/r;
        return { x: r + Math.cos(a)*r, y: H-r + Math.sin(a)*r };
      }
      const d3 = d2 - Math.PI*r/2;
      if (d3 <= H-2*r) return { x: 0, y: H-r-d3 };
      const a = (3*Math.PI/2) + (d3-(H-2*r))/r;
      return { x: r + Math.cos(a)*r, y: r + Math.sin(a)*r };
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    tracers.forEach(tr => {
      tr.t += tr.speed;
      for (let s = 40; s >= 0; s--) {
        const pt    = progressToPoint(tr.t - (s/40) * tr.tailLen);
        const alpha = (1 - s/40) * 0.9;
        const size  = 2.5 * (1 - s/40 * 0.6);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = tr.col;
        ctx.shadowColor = tr.col;
        ctx.shadowBlur  = 12;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, size, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      }
    });
    requestAnimationFrame(loop);
  }
  loop();
}

// ============================================================
//  START
// ============================================================
init();
