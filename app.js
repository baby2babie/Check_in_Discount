// ============================================================
//  กล่องสุ่มรางวัล — app.js (Premium Edition) OA_TEST 19/7/69
// ============================================================

const GAS_URL = 'https://script.google.com/macros/s/AKfycbx57fi00n2RKu7b5jHu67vzUVwrez1cx6RhW0lvvM9cIkt6_amJzMoVJOJvrwD7imHBnA/exec';
const LIFF_ID = '2004478373-aQPYZEpt';

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
  const view   = params.get('view');

  if (room) {
    document.getElementById('lb-room-label').textContent = 'ห้อง ' + room;
  }

  if (isPaid !== null) {
    // ---- PAID PAGE ----
    document.querySelector('.dash-title h1').textContent = 'กล่องโบนัส';
    document.querySelector('.dash-title p').textContent  = 'รางวัลจากการจ่ายตรงเวลา';
    document.querySelector('.count-wrap').style.display  = 'none';

    grid.style.cssText = 'display:flex;justify-content:center;width:90%;max-width:380px';
    grid.innerHTML = `<div class="lb-card lb-skeleton" style="width:100%;height:290px"></div>`;

    await initLiff();
    await initPaidPage(room);
  } else {
    // ---- CHECK-IN PAGE ----
    grid.innerHTML = LB_CONFIG.map(() =>
      `<div class="lb-card lb-skeleton"></div>`
    ).join('');

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
  }

  if (view === 'history' && currentRoomNo) {
    openHistoryOverlay();
  }

  // ✅ ทุกอย่าง render เสร็จแล้ว ค่อยเอา mask ออก
  document.getElementById('boot-mask')?.remove();
}

// ============================================================
//  PAID PAGE
// ============================================================
async function initPaidPage(roomNo) {
  if (!roomNo) { showError('❌ ไม่พบข้อมูลห้อง'); return; }

  try {
    const result = await callGAS('getLootBoxDataByRoom', { roomNo });
    if (!result.success) { showError('❌ ' + (result.message || 'โหลดไม่ได้')); return; }
    currentRoomNo = roomNo;
    showHistoryButton();
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
  card.className = 'gp-entry'
    + (hasBox   ? ' can-open' : '')
    + (isOpened ? ' used'     : '')
    + (isLocked ? ' locked'   : '');
  card.id = 'lb-card-PAID';
  card.setAttribute('data-tier', 'paid');

  card.innerHTML = `
    <div class="gp-entry-cabinet">
      <div class="gp-entry-sign">
        <span class="gp-entry-sign-jp">ガシャポン</span>
        <span class="gp-entry-sign-th">PAID BONUS</span>
      </div>
      <div class="gp-entry-rivets"><span></span><span></span><span></span><span></span><span></span><span></span></div>

      <div class="gp-entry-dome">
        <div class="gp-entry-dome-shine"></div>
        <div class="gp-entry-prize-sticker">
          <div class="grid">
            <span style="background:#FFC9DE"></span><span style="background:#BFF3E1"></span><span style="background:#FFE39A"></span>
            <span style="background:#C6E6FF"></span><span style="background:#D9C4FF"></span><span style="background:#FFC9DE"></span>
          </div>
          <div class="gp-entry-cap-label">PRIZE</div>
        </div>
        <div class="gp-entry-pile" id="gpEntryPile"></div>
        ${isLocked ? '<div class="gp-entry-lock">🔒</div>' : ''}
        ${isOpened ? '<div class="gp-entry-lock">✓</div>' : ''}
      </div>

      <div class="gp-entry-plate">No.7 ★ FOUNDER TIER MACHINE</div>

      <div class="gp-entry-coin-crank-row">
        <div class="gp-entry-coin-slot">
          <div class="slot"></div>
          <div class="label">ช่องหยอด</div>
        </div>
        <div class="gp-entry-crank-wrap">
          <div class="gp-entry-crank-base"></div>
          <div class="gp-entry-crank-arm"></div>
          <div class="gp-entry-crank-knob"></div>
        </div>
      </div>

      <div class="gp-entry-chute"></div>

      <div class="gp-entry-flap-wrap">
        <div class="gp-entry-flap-tray"></div>
        <div class="gp-entry-flap-lid"><div class="gp-entry-flap-handle"></div></div>
      </div>
    </div>
    <div class="gp-entry-legs"><span></span><span></span></div>
    <div class="gp-entry-msg">${
      hasBox   ? 'แตะที่ตู้เพื่อลุ้นรางวัล 🎉' :
      isOpened ? 'เปิดแล้วเดือนนี้ กลับมาใหม่รอบบิลหน้า' :
                 'จ่ายตรงเวลาเพื่อรับกล่อง'
    }</div>
  `;

  if (hasBox) {
    card.onclick = () => startLootOpen('PAID', 'กล่อง Paid Bonus', 'paid', info.token);
  }

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;width:100%';

  if (hasBox) {
    const cv = document.createElement('canvas');
    cv.className = 'sparks';
    cv.id = 'paid-entry-sparks';
    wrap.appendChild(cv);
  }

  wrap.appendChild(card);
  grid.innerHTML = '';
  grid.appendChild(wrap);

  setTimeout(() => {
    card.classList.add('fade-in');
    if (hasBox) {
      gpRenderEntryPile();
      initSparks('paid-entry-sparks', '#E879F9');
    }
  }, 300);
}

// Idle dome preview shown on the entry card, before the box is opened —
// same capsule visuals as the overlay dome (gpRenderPile), smaller fill.
function gpRenderEntryPile() {
  const pile = document.getElementById('gpEntryPile');
  if (!pile) return;
  pile.innerHTML = '';
  const FILL = 12;
  const goldIndex = Math.floor(Math.random() * FILL);
  for (let i = 0; i < FILL; i++) {
    const c = document.createElement('div');
    c.className = 'gp-capsule';
    const size = 26 + Math.random() * 16;
    c.style.width = size + 'px';
    c.style.height = size + 'px';
    c.style.left = (Math.random() * 78) + '%';
    c.style.top = (18 + Math.pow(Math.random(), 1.6) * 68) + '%';
    c.style.transform = `rotate(${(Math.random() * 30 - 15).toFixed(1)}deg)`;
    if (i === goldIndex) {
      c.classList.add('gp-shimmer');
    } else {
      const base = GP_PALETTE[Math.floor(Math.random() * GP_PALETTE.length)];
      c.style.background = `radial-gradient(circle at 32% 28%, #fff, ${base} 60%, ${gpShade(base, -14)})`;
    }
    pile.appendChild(c);
  }
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
    currentRoomNo = result.roomNo;
    showHistoryButton();
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
    startGachaponOpen(token);
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
//  GACHAPON — PAID BOX
//  Replaces the old "stardust" reveal. Check-in tier boxes
//  (silver/gold/plat/legend) use the separate solar-system flow
//  above and are untouched by this section.
// ============================================================
const GP_PALETTE = ['#FFC9DE', '#BFF3E1', '#FFE39A', '#C6E6FF', '#D9C4FF'];
let gpBusy = false;

function gpShade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) + Math.round(255 * percent / 100);
  let g = (num >> 8 & 0x00FF) + Math.round(255 * percent / 100);
  let b = (num & 0x0000FF) + Math.round(255 * percent / 100);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

// Dome is filled with decorative capsules for visual weight — this has
// nothing to do with how many boxes are actually openable. That count
// still comes from the PAID card itself (one per billing cycle).
function gpRenderPile() {
  const pile = document.getElementById('gpPile');
  if (!pile) return;
  pile.innerHTML = '';
  const FILL = 16;
  const goldIndex = Math.floor(Math.random() * FILL);
  for (let i = 0; i < FILL; i++) {
    const c = document.createElement('div');
    c.className = 'gp-capsule';
    const size = 34 + Math.random() * 22;
    c.style.width = size + 'px';
    c.style.height = size + 'px';
    c.style.left = (Math.random() * 78) + '%';
    c.style.top = (18 + Math.pow(Math.random(), 1.6) * 68) + '%';
    c.style.transform = `rotate(${(Math.random() * 30 - 15).toFixed(1)}deg)`;
    if (i === goldIndex) {
      c.classList.add('gp-shimmer');
    } else {
      const base = GP_PALETTE[Math.floor(Math.random() * GP_PALETTE.length)];
      c.style.background = `radial-gradient(circle at 32% 28%, #fff, ${base} 60%, ${gpShade(base, -14)})`;
    }
    pile.appendChild(c);
  }
}

function startGachaponOpen(token) {
  if (gpBusy) return;
  gpBusy = true;

  const overlay = document.getElementById('paid-overlay');
  const cabinet = document.getElementById('gpCabinet');
  const crank   = document.getElementById('gpCrank');
  const chute   = document.getElementById('gpChute');
  const result  = document.getElementById('gpResult');
  const hint    = document.getElementById('gpHint');
  const crackWrap = document.getElementById('gpCrackWrap');

  overlay.classList.add('active');
  result.classList.remove('show');
  crackWrap.classList.remove('go');
  chute.innerHTML = '';
  hint.textContent = 'กำลังหมุน...';
  gpRenderPile();
  crank.classList.add('gp-turn');

  let apiResult = null;
  callGAS('openLootBox', { token })
    .then(r => { apiResult = r; })
    .catch(() => { apiResult = { success: false, message: 'เกิดข้อผิดพลาด' }; });

  // capsule drop — purely visual, timed independently of the API call
  setTimeout(() => {
    const falling = document.createElement('div');
    falling.className = 'gp-falling drop';
    falling.style.background = 'radial-gradient(circle at 32% 28%, #fff, #FFD873 55%, #F5AE3C)';
    chute.appendChild(falling);
    hint.textContent = 'แคปซูลกำลังหล่นลงราง...';
  }, 350);

  setTimeout(() => {
    cabinet.classList.add('gp-shake');
    hint.textContent = 'ลุ้นๆ...';
    setTimeout(() => cabinet.classList.remove('gp-shake'), 350);
  }, 1100);

  // Wait for both the drop animation to feel complete AND the real
  // openLootBox response before revealing — never fabricate a result.
  const waitForApi = () => {
    if (apiResult === null) { setTimeout(waitForApi, 100); return; }
    crank.classList.remove('gp-turn');

    if (!apiResult.success) {
      closePaidOverlay();
      showToast('❌ ' + (apiResult.message || 'เกิดข้อผิดพลาด'), 'error');
      return;
    }
    setTimeout(() => gpShowResult(apiResult), 200);
  };
  setTimeout(waitForApi, 1400);
}

function gpShowResult(result) {
  const amount    = result.discount_amount;
  const isJackpot = amount >= 50;
  const isRare    = amount >= 30;

  const crackTop    = document.getElementById('gpCrackTop');
  const crackBottom = document.getElementById('gpCrackBottom');
  const crackWrap   = document.getElementById('gpCrackWrap');
  const ribbon      = document.getElementById('gpRibbon');
  const valEl       = document.getElementById('paid-prize-val');
  const resultWrap  = document.getElementById('gpResult');
  const flash       = document.getElementById('flash');
  const overlay     = document.getElementById('paid-overlay');

  // ✅ วาบขาวตอนเผยผล เหมือนฝั่งกล่องเช็คอิน
  if (flash) {
    flash.style.animation = 'none';
    void flash.offsetWidth;
    flash.style.animation = 'flashTrigger .6s forwards';
  }

  // ✅ แจ็คพอต — สั่นแรงพิเศษ
  if (isJackpot && overlay) {
    overlay.classList.add('shake-mid');
    setTimeout(() => overlay.classList.remove('shake-mid'), 1000);
  }

  const capGrad = 'radial-gradient(circle at 32% 28%, #fff, #FFD873 55%, #F5AE3C)';
  crackTop.style.background = capGrad;
  crackBottom.style.background = capGrad;

  ribbon.textContent = isJackpot ? '★ แจ็คพอต' : isRare ? '✦ หายาก' : '✓ ยินดีด้วย';

  valEl.className = 'gp-ticket-val' + (isJackpot ? ' jackpot' : '');
  valEl.style.animation = 'none';
  valEl.textContent = '0';
  void valEl.offsetWidth;
  valEl.style.animation = '';

  crackWrap.classList.remove('go');
  void crackWrap.offsetWidth;
  crackWrap.classList.add('go');

  resultWrap.classList.add('show');

  const card = document.getElementById('lb-card-PAID');
  if (card) {
    card.classList.remove('can-open');
    card.classList.add('used');
    const msg = card.querySelector('.gp-entry-msg');
    if (msg) msg.textContent = 'เปิดแล้วเดือนนี้ กลับมาใหม่รอบบิลหน้า';
    const dome = card.querySelector('.gp-entry-dome');
    if (dome && !dome.querySelector('.gp-entry-lock')) {
      const lock = document.createElement('div');
      lock.className = 'gp-entry-lock';
      lock.textContent = '✓';
      dome.appendChild(lock);
    }
    card.onclick = null;
  }

  const confetti = isJackpot
    ? ['#FFD700', '#F5AE3C', '#fff', '#FCA5A5']
    : isRare
    ? ['#FFD873', '#F5AE3C', '#fff', '#D9C4FF']
    : ['#FFD873', '#fff', '#F2E9D6'];

  setTimeout(() => {
    countUp(valEl, amount, isJackpot ? 2200 : 1400);
    spawnConfetti(confetti);
  }, 200);

  gpBusy = false;
  lbOpening = false;
}

function closePaidOverlay() {
  const overlay = document.getElementById('paid-overlay');
  overlay.classList.remove('active', 'shake-mid');
  document.getElementById('gpResult').classList.remove('show');
  document.getElementById('gpCrackWrap').classList.remove('go');
  document.getElementById('gpChute').innerHTML = '';
  document.getElementById('gpCrank').classList.remove('gp-turn');
  document.getElementById('gpCabinet').classList.remove('gp-shake');
  gpBusy = false;
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
//  HISTORY BUTTON + OVERLAY
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
    return { name: 'PAID BONUS', color: TIER_CFG.paid.color };
  }
  const cfg = LB_CONFIG.find(c => c.milestone === Number(tierRaw));
  if (cfg) return { name: cfg.name, color: TIER_CFG[cfg.tier].color };
  return { name: 'ไม่ทราบ', color: '#475569' };
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
//  START
// ============================================================
init();
