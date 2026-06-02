// ============================================================
//  กล่องสุ่มรางวัล — app.js (Elemental Edition)
// ============================================================

const GAS_URL = 'https://script.google.com/macros/s/AKfycbx57fi00n2RKu7b5jHu67vzUVwrez1cx6RhW0lvvM9cIkt6_amJzMoVJOJvrwD7imHBnA/exec';
const LIFF_ID = '2004478373-aQPYZEpt';

const LB_CONFIG = [
  { milestone: 7,  name: 'Crystal Box', tier: 'silver', ms: 'ms-silver' },
  { milestone: 14, name: 'Ember Box',   tier: 'gold',   ms: 'ms-gold'   },
  { milestone: 21, name: 'Nebula Box',  tier: 'plat',   ms: 'ms-plat'   },
  { milestone: 28, name: 'Cyber Box',   tier: 'legend', ms: 'ms-legend' },
];

const TIER_CFG = {

  // ── 💎 CRYSTAL ICE ──
  silver: {
    color: '#BAE6FD', label: 'CRYSTAL RANK',
    shakeClass: 'shake-soft', tensionDur: '2.6s', glitch: false,
    ringCol: 'rgba(186,230,253,.25)',
    orbits: [
      { r:53, dur:2.4, planets:[{col:'#E0F2FE',sz:6,start:0},{col:'#7DD3FC',sz:4,start:180}] },
      { r:80, dur:3.8, planets:[{col:'#BAE6FD',sz:8,start:60},{col:'#F0F9FF',sz:5,start:220},{col:'#38BDF8',sz:4,start:310}] },
      { r:103,dur:5.5, planets:[{col:'#E0F2FE',sz:10,start:90},{col:'#7DD3FC',sz:4,start:210},{col:'#BAE6FD',sz:4,start:330}] },
    ],
    badge:{ bg:'linear-gradient(145deg,#060f1f,#020810)', border:'rgba(186,230,253,.5)', glow:'rgba(186,230,253,.4)' },
    badgeGrad:'linear-gradient(160deg,#f0f9ff,#BAE6FD 45%,#0369A1)',
    btn:{ bg:'linear-gradient(135deg,#38BDF8 0%,#0369A1 100%)', color:'#F0F9FF', glow:'rgba(56,189,248,.5)' },
    confetti:['#BAE6FD','#E0F2FE','#7DD3FC','#fff','#38BDF8','#F0F9FF'],
    icon:'❄️',
  },

  // ── 🔥 FIRE EMBER ──
  gold: {
    color: '#F97316', label: 'EMBER RANK',
    shakeClass: 'shake-mid', tensionDur: '2.8s', glitch: false,
    ringCol: 'rgba(249,115,22,.32)',
    orbits: [
      { r:53, dur:1.6, planets:[{col:'#FCD34D',sz:7,start:0},{col:'#EF4444',sz:4,start:180}] },
      { r:80, dur:2.8, planets:[{col:'#F97316',sz:9,start:60},{col:'#FCD34D',sz:5,start:185},{col:'#EF4444',sz:5,start:305}] },
      { r:103,dur:4.2, planets:[{col:'#FCD34D',sz:12,start:120},{col:'#F97316',sz:5,start:240},{col:'#EF4444',sz:5,start:5}] },
    ],
    badge:{ bg:'linear-gradient(145deg,#1a0800,#0d0400)', border:'rgba(249,115,22,.5)', glow:'rgba(249,115,22,.5)' },
    badgeGrad:'linear-gradient(160deg,#fff7ed,#F97316 45%,#7C2D12)',
    btn:{ bg:'linear-gradient(135deg,#F97316 0%,#7C2D12 100%)', color:'#FFF7ED', glow:'rgba(249,115,22,.6)' },
    confetti:['#F97316','#EF4444','#FCD34D','#fff','#FB923C','#FEF08A'],
    icon:'🔥',
  },

  // ── 🌌 GALAXY NEBULA ──
  plat: {
    color: '#818CF8', label: 'NEBULA RANK',
    shakeClass: 'shake-hard', tensionDur: '3.0s', glitch: false,
    ringCol: 'rgba(129,140,248,.3)',
    orbits: [
      { r:51, dur:1.1, planets:[{col:'#818CF8',sz:7,start:0},{col:'#06B6D4',sz:4,start:120},{col:'#7C3AED',sz:3,start:240}] },
      { r:78, dur:2.0, planets:[{col:'#818CF8',sz:9,start:45},{col:'#2563EB',sz:6,start:170},{col:'#06B6D4',sz:4,start:285}] },
      { r:101,dur:3.2, planets:[{col:'#7C3AED',sz:12,start:90},{col:'#818CF8',sz:6,start:205},{col:'#06B6D4',sz:4,start:320},{col:'#2563EB',sz:4,start:5}] },
    ],
    badge:{ bg:'linear-gradient(145deg,#080520,#03020d)', border:'rgba(129,140,248,.5)', glow:'rgba(129,140,248,.5)' },
    badgeGrad:'linear-gradient(160deg,#eef2ff,#818CF8 45%,#1e1b4b)',
    btn:{ bg:'linear-gradient(135deg,#818CF8 0%,#3730A3 100%)', color:'#EEF2FF', glow:'rgba(129,140,248,.6)' },
    confetti:['#818CF8','#06B6D4','#7C3AED','#2563EB','#fff','#C7D2FE'],
    icon:'🌌',
  },

  // ── ⚡ CYBER NEON ──
  legend: {
    color: '#00FF88', label: 'CYBER RANK',
    shakeClass: 'shake-chaos', tensionDur: '3.4s', glitch: true,
    ringCol: 'rgba(0,255,136,.35)',
    orbits: [
      { r:50, dur:0.8, planets:[{col:'#00FF88',sz:7,start:0},{col:'#FF00FF',sz:4,start:120},{col:'#00FFFF',sz:3,start:240}] },
      { r:77, dur:1.5, planets:[{col:'#00FF88',sz:10,start:60},{col:'#FF00FF',sz:6,start:185},{col:'#00FFFF',sz:5,start:305}] },
      { r:100,dur:2.4, planets:[{col:'#00FF88',sz:13,start:90},{col:'#FF00FF',sz:7,start:205},{col:'#00FFFF',sz:5,start:315},{col:'#00FF88',sz:4,start:20}] },
    ],
    badge:{ bg:'linear-gradient(145deg,#001a0d,#000d06)', border:'rgba(0,255,136,.6)', glow:'rgba(0,255,136,.5)' },
    badgeGrad:'linear-gradient(160deg,#f0fff8,#00FF88 45%,#003319)',
    btn:{ bg:'linear-gradient(135deg,#00FF88 0%,#003319 100%)', color:'#001a0d', glow:'rgba(0,255,136,.6)' },
    confetti:['#00FF88','#FF00FF','#00FFFF','#fff','#39FF14','#FF00FF'],
    icon:'⚡',
  },

  // ── 🌸 AURORA BOREALIS ──
  paid: {
    color: '#E879F9', label: 'AURORA BONUS',
    shakeClass: 'shake-soft', tensionDur: '3.0s', glitch: false,
    ringCol: 'rgba(232,121,249,.3)',
    orbits: [
      { r:53, dur:1.8, planets:[{col:'#E879F9',sz:6,start:0},{col:'#34D399',sz:4,start:180}] },
      { r:80, dur:2.8, planets:[{col:'#38BDF8',sz:8,start:60},{col:'#E879F9',sz:5,start:200},{col:'#34D399',sz:4,start:320}] },
      { r:103,dur:4.2, planets:[{col:'#E879F9',sz:10,start:90},{col:'#38BDF8',sz:5,start:210},{col:'#34D399',sz:4,start:330}] },
    ],
    badge:{ bg:'linear-gradient(145deg,#12042a,#060218)', border:'rgba(232,121,249,.4)', glow:'rgba(56,189,248,.35)' },
    badgeGrad:'linear-gradient(160deg,#fdf4ff,#E879F9 30%,#38BDF8 60%,#34D399)',
    btn:{ bg:'linear-gradient(135deg,#E879F9 0%,#38BDF8 50%,#34D399 100%)', color:'#0a0618', glow:'rgba(232,121,249,.5)' },
    confetti:['#E879F9','#38BDF8','#34D399','#fff','#F0ABFC','#A5F3FC'],
    icon:'✨',
  }
};

// Aurora star colors
const AURORA_COLORS = ['#E879F9','#38BDF8','#34D399','#F0ABFC','#A5F3FC','#6EE7B7','#fff','#DDD6FE'];

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
  t.className = 'toast ' + type;
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
  document.querySelector('.dash-title h1').textContent = 'AURORA BONUS';
  document.querySelector('.dash-title p').textContent  = 'จ่ายตรงเวลา รับรางวัลพิเศษ';
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
  card.style.cssText = 'width:100%;padding:40px 20px;--t-color:#E879F9';

  card.innerHTML = `
    <span class="lb-card-icon" style="font-size:64px">${isOpened ? '✨' : hasBox ? '✨' : '🔒'}</span>
    <div class="lb-card-name" style="font-size:14px;margin-top:16px">AURORA BONUS</div>
    <div class="lb-card-sub" style="font-size:13px;margin-top:8px">${
      hasBox   ? 'กดเพื่อรับรางวัล Aurora!' :
      isOpened ? 'รับแล้วเดือนนี้'          :
                 'จ่ายตรงเวลาเพื่อรับกล่อง'
    }</div>
    <div class="lb-card-ms ms-paid" style="margin-top:16px">จ่ายตรงเวลา</div>
  `;

  if (hasBox) {
    card.onclick = () => startLootOpen('PAID', 'Aurora Bonus', 'paid', info.token);
  }

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;width:100%';

  if (hasBox) {
    const cv = document.createElement('canvas');
    cv.id = 'paid-trace';
    cv.style.cssText = 'position:absolute;inset:-3px;pointer-events:none;z-index:3;border-radius:23px';
    wrap.appendChild(cv);
  }

  wrap.appendChild(card);
  grid.innerHTML = '';
  grid.appendChild(wrap);

  setTimeout(() => {
    card.classList.add('fade-in');
    if (hasBox) initAuroraTrace('paid-trace', wrap);
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
//  RENDER
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
    const t        = TIER_CFG[cfg.tier];

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
    card.style.setProperty('--t-color', t.color);
    card.classList.add('float-' + (i + 1));

    card.innerHTML = `
      <span class="lb-card-icon">${t.icon}</span>
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
    setTimeout(() => card.classList.add('fade-in'), i * 100);
    grid.appendChild(wrap);

    if (hasBox) {
      setTimeout(() => initElementalSparks('sp-' + cfg.milestone, t), i * 100 + 120);
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
    svg += `<filter id="rf${i}${tier}"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
  );
  svg += `</defs>`;
  cfg.orbits.forEach((orb, i) => {
    svg += `<circle cx="${cx}" cy="${cy}" r="${orb.r}" fill="none" stroke="${cfg.ringCol}" stroke-width="${i===2?1.5:1}" filter="url(#rf${i}${tier})"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${orb.r}" fill="none" stroke="${cfg.color}" stroke-width="0.3" opacity="0.2"/>`;
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
  ">${cfg.icon}</div>`;

  return svg + planets + sun;
}

// ============================================================
//  ELEMENTAL SPARKS (per tier)
// ============================================================
function initElementalSparks(id, tierCfg) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const wrap = canvas.parentElement;
  canvas.width  = wrap.offsetWidth  || 160;
  canvas.height = wrap.offsetHeight || 180;
  const ctx = canvas.getContext('2d');
  const particles = [];
  // Use tier's confetti colors for sparks
  const cols = tierCfg.confetti.slice(0, 3);

  function spawn() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if      (edge === 0) { x = Math.random() * canvas.width; y = 0; }
    else if (edge === 1) { x = canvas.width;  y = Math.random() * canvas.height; }
    else if (edge === 2) { x = Math.random() * canvas.width; y = canvas.height; }
    else                 { x = 0; y = Math.random() * canvas.height; }
    particles.push({
      x, y,
      vx: (Math.random() - .5) * 1.2,
      vy: (Math.random() - .5) * 1.2,
      size: 1.5 + Math.random() * 2.5,
      color: cols[Math.floor(Math.random() * cols.length)],
      life: 0,
      maxLife: 40 + Math.random() * 40
    });
  }

  let frame = 0;
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;
    if (frame % 6 === 0) spawn();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life++;
      const alpha = 1 - p.life / p.maxLife;
      if (alpha <= 0) { particles.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle   = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = 10;
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
//  AURORA BORDER TRACE (PAID)
// ============================================================
function initAuroraTrace(id, wrap) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const W = (wrap.offsetWidth  || 320) + 6;
  const H = (wrap.offsetHeight || 260) + 6;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const r   = 23;
  const perimeter = 2 * (W + H) - (8 - 2 * Math.PI) * r;

  const tracers = [
    { t:0.0,  speed:0.003,  tailLen:0.18, col:'#E879F9' },
    { t:0.33, speed:0.0025, tailLen:0.15, col:'#38BDF8' },
    { t:0.66, speed:0.0035, tailLen:0.13, col:'#34D399' },
    { t:0.15, speed:0.002,  tailLen:0.10, col:'#F0ABFC' },
  ];

  function progressToPoint(prog) {
    prog = ((prog % 1) + 1) % 1;
    const dist = prog * perimeter;
    const top  = W - 2*r + Math.PI*r/2;
    const right  = top + H - 2*r + Math.PI*r/2;
    const bottom = right + W - 2*r + Math.PI*r/2;

    if (dist <= top) {
      const topFlat = W - 2*r;
      if (dist <= topFlat) return { x: r + dist, y: 0 };
      const a = (dist - topFlat) / r - Math.PI/2;
      return { x: W-r + Math.cos(a)*r, y: r + Math.sin(a)*r };
    } else if (dist <= right) {
      const d2 = dist - top;
      if (d2 <= Math.PI*r/2) { const a = d2/r; return { x: W-r + Math.cos(a)*r, y: r + Math.sin(a)*r }; }
      const d3 = d2 - Math.PI*r/2;
      if (d3 <= H-2*r) return { x: W, y: r + d3 };
      const a = (d3-(H-2*r))/r;
      return { x: W-r + Math.cos(a)*r, y: H-r + Math.sin(a)*r };
    } else if (dist <= bottom) {
      const d2 = dist - right;
      if (d2 <= Math.PI*r/2) { const a = d2/r; return { x: W-r + Math.cos(a)*r, y: H-r + Math.sin(a)*r }; }
      const d3 = d2 - Math.PI*r/2;
      if (d3 <= W-2*r) return { x: W-r-d3, y: H };
      const a = Math.PI + (d3-(W-2*r))/r;
      return { x: r + Math.cos(a)*r, y: H-r + Math.sin(a)*r };
    } else {
      const d2 = dist - bottom;
      if (d2 <= Math.PI*r/2) { const a = Math.PI + d2/r; return { x: r + Math.cos(a)*r, y: H-r + Math.sin(a)*r }; }
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
        ctx.shadowBlur  = 14;
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
//  OPEN LOOT BOX
// ============================================================
function startLootOpen(milestone, name, tier, token) {
  if (lbOpening) return;
  lbOpening = true;

  if (tier === 'paid') {
    startAuroraOpen(token);
    return;
  }

  const cfg     = TIER_CFG[tier];
  const overlay = document.getElementById('lb-overlay');
  const flash   = document.getElementById('flash');

  document.documentElement.style.setProperty('--t-color', cfg.color);
  overlay.style.background = '#04060f';
  overlay.classList.add('active');
  document.getElementById('result-ui').classList.remove('show');
  document.getElementById('spin-wrap').style.display = 'flex';
  document.getElementById('spin-stage').innerHTML = buildSolarHTML(tier);
  overlay.classList.remove('shake-soft','shake-mid','shake-hard','shake-chaos');
  overlay.classList.add(cfg.shakeClass);

  const boxIcon = document.getElementById('box-icon');
  boxIcon.style.setProperty('--tension-dur', cfg.tensionDur);
  setTimeout(() => boxIcon.classList.add('box-tension'), 100);

  if (cfg.glitch) {
    ['err1','err2','err3'].forEach(id => document.getElementById(id).classList.add('show'));
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

        flash.style.animation = 'flashTrigger .5s forwards';
        setTimeout(() => {
          flash.style.animation = '';
          overlay.classList.remove('shake-soft','shake-mid','shake-hard','shake-chaos');
          ['err1','err2','err3'].forEach(id => document.getElementById(id).classList.remove('show'));
          document.getElementById('spin-wrap').style.display = 'none';
          overlay.style.background = 'radial-gradient(circle,#0f1629 0%,#04060f 100%)';

          const badge = document.getElementById('res-badge');
          const sym   = badge.querySelector('.res-badge-sym');
          badge.style.cssText = `width:90px;height:90px;border-radius:18px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;animation:badgeFloat 2s ease-in-out infinite alternate;background:${cfg.badge.bg};border:1.5px solid ${cfg.badge.border};box-shadow:0 0 28px ${cfg.badge.glow}`;
          sym.style.cssText   = `font-size:46px;position:relative;z-index:1;line-height:1;background:${cfg.badgeGrad};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 14px ${cfg.color})`;
          sym.textContent = cfg.icon;
          document.getElementById('res-tier-name').textContent = cfg.label;
          document.getElementById('res-tier-name').style.color = cfg.color;

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
          valEl.style.setProperty('--t-color', cfg.color);
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
  for (let i = 0; i < 150; i++) {
    const d = document.createElement('div');
    d.className = 'c-dot';
    const sz = 3 + Math.random() * 9, rect = Math.random() > .4;
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
//  AURORA OPEN — PAID BOX (new aurora wave effect)
// ============================================================
let auroraParticles = [];
let auroraAnimId    = null;
let auroraPhase     = 'idle';
let auroraT         = 0;
let apiResultPaid   = null;

function startAuroraOpen(token) {
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

  auroraPhase    = 'wave';
  auroraT        = 0;
  apiResultPaid  = null;
  createAuroraParticles(cx, cy);

  setTimeout(() => {
    boxIcon.style.animation = 'none';
    boxIcon.classList.add('box-paid-tension');
  }, 400);

  callGAS('openLootBox', { token })
    .then(r  => { apiResultPaid = r; })
    .catch(() => { apiResultPaid = { success: false, message: 'เกิดข้อผิดพลาด' }; });

  const ctx = canvas.getContext('2d');

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    auroraT++;

    // Draw aurora wave background
    drawAuroraWaves(ctx, canvas.width, canvas.height, auroraT);

    if (auroraPhase === 'wave') {
      auroraParticles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.05; p.vx *= 0.99;
        p.life++;
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        drawAuroraDot(ctx, p, alpha);
      });

      if (auroraT > 90) { auroraPhase = 'gather'; }
    }

    else if (auroraPhase === 'gather') {
      const progress = Math.min((auroraT - 90) / 80, 1);
      auroraParticles.forEach(p => {
        p.orbitAngle += p.orbitSpeed * (1 + progress * 3);
        const tx = cx + Math.cos(p.orbitAngle) * p.orbitR * (1 - progress * 0.8);
        const ty = cy + Math.sin(p.orbitAngle) * p.orbitR * (1 - progress * 0.8);
        p.x = lerp(p.x, tx, .08);
        p.y = lerp(p.y, ty, .08);
        drawAuroraDot(ctx, p, 0.7);
      });

      if (progress >= 1) { auroraPhase = 'waiting'; }
    }

    else if (auroraPhase === 'waiting') {
      // Pulsing aurora core
      const pulse = 0.4 + 0.3 * Math.sin(auroraT * 0.05);
      const colors = ['#E879F9','#38BDF8','#34D399'];
      colors.forEach((col, i) => {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120 + i * 20);
        grad.addColorStop(0, col + '88');
        grad.addColorStop(1, 'transparent');
        ctx.save();
        ctx.globalAlpha = pulse * (1 - i * 0.2);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 120 + i * 20, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      });

      // Orbiting particles
      auroraParticles.slice(0, 30).forEach((p, i) => {
        const a = (auroraT * 0.04) + (i / 30) * Math.PI * 2;
        const r = 55 + Math.sin(auroraT * 0.03 + i) * 10;
        p.x = cx + Math.cos(a) * r;
        p.y = cy + Math.sin(a) * r;
        drawAuroraDot(ctx, p, 0.5 + 0.3 * Math.sin(auroraT * 0.1 + i));
      });

      if (apiResultPaid !== null) {
        auroraPhase = 'done';
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!apiResultPaid.success) {
          closePaidOverlay();
          showToast('❌ ' + (apiResultPaid.message || 'เกิดข้อผิดพลาด'), 'error');
          lbOpening = false;
          return;
        }

        showAuroraResult(apiResultPaid, canvas, cx, cy);
        return;
      }
    }

    auroraAnimId = requestAnimationFrame(loop);
  }

  loop();
}

function drawAuroraWaves(ctx, W, H, t) {
  const waves = [
    { col: '#E879F9', amp: 60, freq: 0.008, speed: 0.02, y: H * 0.3 },
    { col: '#38BDF8', amp: 50, freq: 0.006, speed: 0.015, y: H * 0.5 },
    { col: '#34D399', amp: 40, freq: 0.01,  speed: 0.025, y: H * 0.7 },
  ];

  waves.forEach(w => {
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = w.col;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) {
      const y = w.y + Math.sin(x * w.freq + t * w.speed) * w.amp;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function drawAuroraDot(ctx, p, alpha) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillStyle   = p.color;
  ctx.shadowColor = p.color;
  ctx.shadowBlur  = 10;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function lerp(a, b, t) { return a + (b - a) * t; }

function createAuroraParticles(cx, cy) {
  auroraParticles = [];
  for (let i = 0; i < 120; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    auroraParticles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 3,
      size: 2 + Math.random() * 4,
      color: AURORA_COLORS[Math.floor(Math.random() * AURORA_COLORS.length)],
      life: 0, maxLife: 90,
      orbitR: 50 + Math.random() * 80,
      orbitSpeed: (Math.random() > .5 ? 1 : -1) * (.02 + Math.random() * .04),
      orbitAngle: angle,
    });
  }
}

function showAuroraResult(result, canvas, cx, cy) {
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
    card.querySelector('.lb-card-sub').textContent = 'รับแล้วเดือนนี้';
    card.onclick = null;
  }

  setTimeout(() => {
    countUp(valEl, result.discount_amount, 1800);
    spawnAuroraConfetti(canvas);
  }, 300);

  lbOpening = false;
}

function spawnAuroraConfetti(canvas) {
  const ctx  = canvas.getContext('2d');
  let drops  = [];
  for (let i = 0; i < 120; i++) {
    drops.push({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 100,
      vx: (Math.random() - .5) * 2,
      vy: 1.5 + Math.random() * 2.5,
      size: 2 + Math.random() * 5,
      color: AURORA_COLORS[Math.floor(Math.random() * AURORA_COLORS.length)],
      alpha: 1,
    });
  }
  function fall() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drops = drops.filter(p => p.alpha > .05);
    drops.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.alpha -= .005;
      drawAuroraDot(ctx, p, p.alpha);
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
  if (auroraAnimId) { cancelAnimationFrame(auroraAnimId); auroraAnimId = null; }
  auroraPhase = 'idle';
  const boxIcon = document.getElementById('paid-box-icon');
  boxIcon.style.cssText = '';
  boxIcon.classList.remove('box-paid-tension');
  document.getElementById('paid-result').classList.remove('show');
  lbOpening = false;
}

// ============================================================
//  START
// ============================================================
init();
