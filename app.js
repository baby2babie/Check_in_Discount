ชื่อไฟล์: app.js

const SUPABASE_FUNCTION_URL =
  'https://wclzlckdruudzjnslwjb.supabase.co/functions/v1/gachapon';

const LIFF_ID = '2004478373-aQPYZEpt';

// ============================================================
//  GACHAPON — SUPABASE EDITION
//  Frontend: LIFF + Supabase Edge Function
//  ไม่สุ่มรางวัลฝั่ง Client
// ============================================================

const LB_CONFIG = [
  { milestone: 7,  name: 'GACHAPON · SILVER',   tier: 'silver' },
  { milestone: 14, name: 'GACHAPON · GOLD',     tier: 'gold'   },
  { milestone: 21, name: 'GACHAPON · PLATINUM', tier: 'plat'   },
  { milestone: 28, name: 'GACHAPON · LEGEND',   tier: 'legend' },
];

const TIER_COLORS = {
  silver: '#94A3B8',
  gold: '#F59E0B',
  plat: '#A78BFA',
  legend: '#EF4444',
  paid: '#C084FC'
};

const stockLabels = {
  '7': 'เช็คอิน 7 วัน',
  '14': 'เช็คอิน 14 วัน',
  '21': 'เช็คอิน 21 วัน',
  '28': 'เช็คอิน 28 วัน',
  'PAID': 'จ่ายตรงเวลา'
};

let liffReady = false;
let liffProfile = null;
let currentRoomNo = null;

let stock = [];
let lootTokens = {};
let busy = true;

let bootMode = null;
let bootParam = null;


// ============================================================
//  SUPABASE API
// ============================================================

async function callSupabase(action, params = {}, timeoutMs = 15000) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const payload = {
      action,
      ...params
    };

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },

      body: JSON.stringify(payload),

      signal: controller.signal
    });

    const text = await response.text();

    let result;

    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('Supabase invalid JSON:', text);

      throw new Error(
        `Supabase returned invalid JSON: ${text.slice(0, 300)}`
      );
    }

    if (!response.ok) {
      throw new Error(
        result.error ||
        result.message ||
        `HTTP ${response.status}`
      );
    }

    return result;

  } finally {
    clearTimeout(timer);
  }
}


// ============================================================
//  RETRY
// ============================================================

async function callSupabaseWithRetry(
  action,
  params = {},
  retries = 2,
  delayMs = 800,
  timeoutMs = 15000
) {
  try {
    return await callSupabase(
      action,
      params,
      timeoutMs
    );

  } catch (error) {

    if (retries <= 0) {
      throw error;
    }

    console.warn(
      `Supabase request failed. Retry left: ${retries}`,
      error
    );

    await new Promise(resolve =>
      setTimeout(resolve, delayMs)
    );

    return callSupabaseWithRetry(
      action,
      params,
      retries - 1,
      delayMs,
      timeoutMs
    );
  }
}


// ============================================================
//  UTILS
// ============================================================

function showToast(
  message,
  type = 'success',
  duration = 3000
) {
  const toast = document.getElementById('toast');

  if (!toast) return;

  toast.textContent = message;
  toast.className = 'toast ' + type;

  setTimeout(() => {
    toast.className = 'toast';
  }, duration);
}


function showError(
  message,
  retryable = false
) {
  if (instruction) {
    instruction.textContent = message;
  }

  if (stockCount) {
    stockCount.textContent = '';
  }

  if (plateText) {
    plateText.textContent = 'ไม่พร้อมใช้งาน';
  }

  if (crank) {
    crank.style.pointerEvents = 'none';
  }

  if (crankBase) {
    crankBase.classList.add('hide-breathe');
  }

  updateIdleHints();

  if (retryBtn) {
    retryBtn.style.display =
      retryable ? 'block' : 'none';
  }
}


// ============================================================
//  LIFF
// ============================================================

async function initLiff() {

  try {

    if (
      typeof liff === 'undefined'
    ) {
      throw new Error(
        'LIFF SDK ยังไม่พร้อม'
      );
    }

    await liff.init({
      liffId: LIFF_ID,
      withLoginOnExternalBrowser: true
    });

    liffReady = true;

    if (!liff.isLoggedIn()) {

      instruction.textContent =
        'กำลังเข้าสู่ระบบ LINE...';

      liff.login({
        redirectUri: location.href
      });

      return 'redirecting';
    }

    liffProfile =
      await liff.getProfile();

    if (!liffProfile?.userId) {
      throw new Error(
        'ไม่พบ LINE userId'
      );
    }

    console.log(
      'LIFF user:',
      liffProfile.userId
    );

    return 'ready';

  } catch (error) {

    console.warn(
      'LIFF init failed:',
      error
    );

    liffReady = false;
    liffProfile = null;

    return 'failed';
  }
}


// ============================================================
//  DOM
// ============================================================

const pile =
  document.getElementById('pile');

const crank =
  document.getElementById('crank');

const dropZone =
  document.getElementById('dropZone');

const instruction =
  document.getElementById('instruction');

const stockCount =
  document.getElementById('stockCount');

const overlay =
  document.getElementById('overlay');

const prizeCard =
  document.getElementById('prizeCard');

const resultTierLabel =
  document.getElementById('resultTierLabel');

const resultPrize =
  document.getElementById('resultPrize');

const resultNote =
  document.getElementById('resultNote');

const rarityRibbon =
  document.getElementById('rarityRibbon');

const closeBtn =
  document.getElementById('closeBtn');

const cabinet =
  document.querySelector('.cabinet');

const tickRing =
  document.getElementById('tickRing');

const crankGlow =
  document.getElementById('crankGlow');

const screenFlash =
  document.getElementById('screenFlash');

const confettiLayer =
  document.getElementById('confettiLayer');

const idlePulse =
  document.getElementById('idlePulse');

const crankArrow =
  document.getElementById('crankArrow');

const crankBase =
  document.querySelector('.crank-base');

const retryBtn =
  document.getElementById('retryBtn');

const crankWrap =
  document.getElementById('crankWrap');

const cabRoomBadge =
  document.getElementById('cabRoomBadge');

const plateText =
  document.getElementById('plateText');


// ============================================================
//  IDLE UI
// ============================================================

function updateIdleHints() {

  const shouldShow =
    !busy &&
    stock.length > 0;

  if (idlePulse) {
    idlePulse.classList.toggle(
      'hide',
      !shouldShow
    );
  }

  if (crankArrow) {
    crankArrow.classList.toggle(
      'hide',
      !shouldShow
    );
  }

  if (crankBase) {
    crankBase.classList.toggle(
      'hide-breathe',
      !shouldShow
    );
  }
}


// ============================================================
//  CAPSULE CONFIG
// ============================================================

const DOME_FILL = 15;

const FROST = '#EAF6FB';

const NEW_PALETTE = [
  {
    main: '#F2941A',
    shine: '#FFCB80'
  },
  {
    main: '#2E9E4F',
    shine: '#8FE3A8'
  },
  {
    main: '#2E7FD1',
    shine: '#8FC4F5'
  },
  {
    main: '#29ABE2',
    shine: '#9FE0F5'
  },
  {
    main: '#C1372C',
    shine: '#E8703F'
  },
  {
    main: '#F2C230',
    shine: '#FFE58A'
  },
  {
    main: '#8B5CF6',
    shine: '#C4B5FD'
  },
  {
    main: '#E64980',
    shine: '#FFB8D2'
  }
];

const CAPSULE_NUMBERS =
  [20, 30, 40, 50, 60, 70, 80, 100];

const SPLIT_ANGLES =
  [95, 120, 150, 175, 195, 220, 255, 280];


// ============================================================
//  CAPSULE BACKGROUND
// ============================================================

function gachaBallBg(
  mainColor,
  shineColor,
  levelPct,
  angleDeg
) {

  const lvl = levelPct;
  const ang = angleDeg;

  return [
    `radial-gradient(
      circle at 30% 20%,
      rgba(255,255,255,.95),
      rgba(255,255,255,0) 40%
    )`,

    `linear-gradient(
      ${ang}deg,
      transparent 0%,
      transparent ${lvl - 4}%,
      ${shineColor} ${lvl - 4}%,
      ${shineColor} ${lvl - 1}%,
      rgba(0,0,0,.16) ${lvl - 1}%,
      rgba(0,0,0,.16) ${lvl + .6}%,
      transparent ${lvl + .6}%,
      transparent 100%
    )`,

    `linear-gradient(
      ${ang}deg,
      ${FROST} 0%,
      ${FROST} ${lvl}%,
      ${mainColor} ${lvl}%,
      ${mainColor} 100%
    )`
  ].join(', ');
}


function gachaBallShellTop(
  mainColor,
  shineColor,
  levelPct,
  angleDeg
) {

  const lvl = levelPct;
  const ang = angleDeg;

  return [
    `linear-gradient(
      ${ang}deg,
      transparent 0%,
      transparent ${lvl - 4}%,
      ${shineColor} ${lvl - 4}%,
      ${shineColor} ${lvl - 1}%,
      rgba(0,0,0,.16) ${lvl - 1}%,
      rgba(0,0,0,.16) ${lvl + .6}%,
      transparent ${lvl + .6}%,
      transparent 100%
    )`,

    `linear-gradient(
      ${ang}deg,
      transparent 0%,
      transparent ${lvl}%,
      ${mainColor} ${lvl}%,
      ${mainColor} 100%
    )`
  ].join(', ');
}


function hexToRgba(
  hex,
  alpha
) {

  const h =
    hex.replace('#', '');

  const r =
    parseInt(
      h.substring(0, 2),
      16
    );

  const g =
    parseInt(
      h.substring(2, 4),
      16
    );

  const b =
    parseInt(
      h.substring(4, 6),
      16
    );

  return `rgba(${r},${g},${b},${alpha})`;
}


// ============================================================
//  RENDER PILE
// ============================================================

function renderPile() {

  if (!pile) return;

  pile.innerHTML = '';

  const hasPaid =
    stock.includes('PAID');

  const paidIndex =
    hasPaid
      ? Math.floor(
          Math.random() * DOME_FILL
        )
      : -1;

  for (
    let i = 0;
    i < DOME_FILL;
    i++
  ) {

    const capsule =
      document.createElement('div');

    capsule.className =
      'capsule';

    const size =
      34 + Math.random() * 24;

    const left =
      Math.random() * 78;

    const top =
      26 +
      Math.pow(
        Math.random(),
        1.7
      ) * 70;

    const rot =
      (
        Math.random() * 34 -
        17
      ).toFixed(1);

    capsule.style.width =
      size + 'px';

    capsule.style.height =
      size + 'px';

    capsule.style.left =
      left + '%';

    capsule.style.top =
      top + '%';

    capsule.style.setProperty(
      '--rot',
      rot + 'deg'
    );

    capsule.style.transform =
      `rotate(var(--rot))`;

    capsule.style.zIndex =
      Math.round(
        top * 10 + size
      );

    capsule.style.animationDelay =
      (
        Math.random() * 120
      ) + 'ms';


    if (i === paidIndex) {

      capsule.classList.add(
        'shimmer'
      );

    } else {

      const color =
        NEW_PALETTE[
          Math.floor(
            Math.random() *
            NEW_PALETTE.length
          )
        ];

      const angle =
        SPLIT_ANGLES[
          Math.floor(
            Math.random() *
            SPLIT_ANGLES.length
          )
        ] +
        (
          Math.random() * 14 -
          7
        );

      const level =
        26 +
        Math.random() * 40;

      capsule.style.background =
        gachaBallBg(
          color.main,
          color.shine,
          level,
          angle
        );


      const splitTilt =
        angle - 180;

      const tilt =
        (
          splitTilt * .4 +
          (
            Math.random() * 10 -
            5
          )
        ).toFixed(1);

      const ticketRotation =
        Number(
          (
            -rot +
            Number(tilt)
          ).toFixed(1)
        );

      const rad =
        angle *
        Math.PI /
        180;

      const clearDirX =
        -Math.sin(rad);

      const clearDirY =
        Math.cos(rad);

      const pushPct =
        Math.min(
          15,
          Math.max(
            0,
            (level - 32) * .34
          )
        );

      const offX =
        (
          clearDirX * pushPct +
          (
            Math.random() * 6 -
            3
          )
        ).toFixed(1);

      const offY =
        (
          clearDirY * pushPct +
          (
            Math.random() * 6 -
            3
          )
        ).toFixed(1);

      const ticket =
        document.createElement('div');

      ticket.className =
        'capsule-ticket';

      const ticketWidthFactor =
        .68 +
        Math.random() * .12 -
        Math.min(
          .05,
          size / 3400
        );

      ticket.style.width =
        (
          size *
          ticketWidthFactor
        ) + 'px';

      ticket.style.borderRadius =
        (
          size * .06
        ) + 'px';

      ticket.style.padding =
        (
          size * .03
        ) + 'px 0';

      ticket.style.left =
        (
          50 +
          Number(offX)
        ) + '%';

      ticket.style.top =
        (
          50 +
          Number(offY)
        ) + '%';

      ticket.style.transform =
        `translate(-50%,-50%)
         rotate(${ticketRotation}deg)`;

      ticket.style.border =
        (
          size * .016 + 1
        ) +
        'px solid ' +
        hexToRgba(
          color.main,
          .55
        );

      const sparkSize =
        (
          size *
          ticketWidthFactor *
          .15
        ).toFixed(1);

      ticket.innerHTML =

        `<span
          class="capsule-ticket-spark"
          style="
            top:5%;
            left:6%;
            font-size:${sparkSize}px;
            color:${color.main}
          "
        >✦</span>` +

        `<div
          class="capsule-ticket-label"
          style="font-size:${(
            size * .105
          ).toFixed(1)}px"
        >ส่วนลด</div>` +

        `<div
          class="capsule-ticket-amount"
          style="
            font-size:${(
              size * .255
            ).toFixed(1)}px;
            color:${color.main}
          "
        >${
          CAPSULE_NUMBERS[
            Math.floor(
              Math.random() *
              CAPSULE_NUMBERS.length
            )
          ]
        }</div>` +

        `<div
          class="capsule-ticket-unit"
          style="font-size:${(
            size * .095
          ).toFixed(1)}px"
        >บาท</div>` +

        `<span
          class="capsule-ticket-spark"
          style="
            bottom:5%;
            right:6%;
            font-size:${sparkSize}px;
            color:${color.main}
          "
        >✦</span>`;

      capsule.appendChild(
        ticket
      );


      const shell =
        document.createElement('div');

      shell.className =
        'capsule-shell-top';

      shell.style.background =
        gachaBallShellTop(
          color.main,
          color.shine,
          level,
          angle
        );

      capsule.appendChild(
        shell
      );


      const shine =
        document.createElement('div');

      shine.className =
        'capsule-glass-shine';

      capsule.appendChild(
        shine
      );


      const rimShade =
        document.createElement('div');

      rimShade.className =
        'capsule-rim-shade';

      capsule.appendChild(
        rimShade
      );
    }

    pile.appendChild(
      capsule
    );
  }

  if (stockCount) {
    stockCount.textContent =
      stock.length
        ? `เปิดได้อีก ${stock.length} ลูก`
        : 'ไม่มีกาชาปองให้เปิดตอนนี้';
  }
}


// ============================================================
//  HELPERS
// ============================================================

function rarityOf(amount) {

  if (amount >= 30)
    return 'legendary';

  if (amount >= 15)
    return 'rare';

  return 'common';
}


function boxNameFor(milestone) {

  if (milestone === 'PAID')
    return 'GACHAPON · BONUS';

  const cfg =
    LB_CONFIG.find(
      c =>
        c.milestone ===
        Number(milestone)
    );

  return cfg
    ? cfg.name
    : 'GACHAPON · MYSTERY';
}


function updatePlateText() {

  if (!plateText) return;

  plateText.textContent =
    stock.length
      ? boxNameFor(stock[0])
      : 'เปิดครบแล้วตอนนี้';
}


// ============================================================
//  CRANK EFFECT
// ============================================================

function spawnRatchetTicks() {

  const TICK_COUNT = 10;

  for (
    let i = 0;
    i < TICK_COUNT;
    i++
  ) {

    const tick =
      document.createElement('div');

    tick.className =
      'ratchet-tick';

    const angle =
      (360 / TICK_COUNT) *
      i;

    tick.style.setProperty(
      '--tick-angle',
      `${angle}deg`
    );

    tick.style.animationDelay =
      (i * 45) + 'ms';

    tickRing.appendChild(
      tick
    );

    requestAnimationFrame(() => {
      tick.classList.add('go');
    });

    setTimeout(() => {
      tick.remove();
    }, 700);
  }
}


function jigglePile() {

  pile.classList.remove(
    'jiggle'
  );

  void pile.offsetWidth;

  pile.classList.add(
    'jiggle'
  );
}


// ============================================================
//  OPEN LOOT BOX
// ============================================================

function playOpen() {

  if (busy)
    return;

  if (!stock.length) {

    instruction.textContent =
      'ไม่มีกาชาปองให้เปิดแล้วตอนนี้';

    return;
  }

  if (!liffProfile?.userId) {

    showError(
      '❌ ไม่พบ LINE User กรุณาเปิดผ่าน LINE ใหม่',
      true
    );

    return;
  }

  busy = true;

  updateIdleHints();

  crank.classList.add(
    'turn'
  );

  cabinet.classList.remove(
    'rumble'
  );

  void cabinet.offsetWidth;

  cabinet.classList.add(
    'rumble'
  );

  crankWrap.classList.remove(
    'rumble'
  );

  void crankWrap.offsetWidth;

  crankWrap.classList.add(
    'rumble'
  );

  pile.classList.remove(
    'jiggle'
  );

  void pile.offsetWidth;

  pile.classList.add(
    'jiggle'
  );

  spawnRatchetTicks();

  crankGlow.classList.remove(
    'go'
  );

  void crankGlow.offsetWidth;

  crankGlow.classList.add(
    'go'
  );

  instruction.textContent =
    '';

  const milestone =
    stock[0];

  const token =
    lootTokens[milestone];


  if (!token) {

    console.error(
      'Missing loot token:',
      milestone
    );

    busy = false;

    showError(
      '❌ ไม่พบ token ของกาชาปองนี้ กรุณาซิงค์ข้อมูลใหม่',
      true
    );

    return;
  }


  // ========================================================
  //  IMPORTANT
  //  สุ่มรางวัลอยู่ฝั่ง Supabase
  //  Client ส่ง token + line_user_id เท่านั้น
  // ========================================================

  const realPromise =
    callSupabase(
      'openLootBox',
      {
        token,
        line_user_id:
          liffProfile.userId
      },
      20000
    )
    .catch(error => {

      console.error(
        'openLootBox failed:',
        error
      );

      return {
        success: false,
        message:
          error.name === 'AbortError'
            ? 'ระบบใช้เวลานานเกินไป'
            : 'เชื่อมต่อกับระบบไม่สำเร็จ'
      };
    });


  const SOFT_TIMEOUT_MS =
    8000;

  const HARD_TIMEOUT_MS =
    18000;


  const softTimer =
    setTimeout(() => {

      if (busy) {

        instruction.textContent =
          'เชื่อมต่อช้ากว่าปกติ กำลังรอผลอยู่...';
      }

    }, SOFT_TIMEOUT_MS);


  realPromise.finally(() => {
    clearTimeout(softTimer);
  });


  const apiPromise =
    withTimeout(
      realPromise,
      HARD_TIMEOUT_MS,
      {
        success: false,
        message:
          'ระบบใช้เวลานานผิดปกติ',
        hardFail: true
      }
    );


  setTimeout(() => {

    crank.classList.remove(
      'turn'
    );

    cabinet.classList.remove(
      'rumble'
    );

    crankWrap.classList.remove(
      'rumble'
    );

    pile.classList.remove(
      'jiggle'
    );

    dropCapsule(
      milestone,
      apiPromise
    );

  }, 780);
}


function withTimeout(
  promise,
  ms,
  fallback
) {

  return Promise.race([
    promise,

    new Promise(resolve => {

      setTimeout(
        () => resolve(fallback),
        ms
      );

    })
  ]);
}


// ============================================================
//  DROP CAPSULE
// ============================================================

function dropCapsule(
  milestone,
  apiPromise
) {

  const isPaid =
    milestone === 'PAID';

  const color =
    NEW_PALETTE[
      Math.floor(
        Math.random() *
        NEW_PALETTE.length
      )
    ];

  const angle =
    SPLIT_ANGLES[
      Math.floor(
        Math.random() *
        SPLIT_ANGLES.length
      )
    ] +
    (
      Math.random() * 14 -
      7
    );

  const capsuleBg =
    isPaid

      ? gachaBallBg(
          '#B4822A',
          '#F5DFA0',
          35 + Math.random() * 30,
          angle
        )

      : gachaBallBg(
          color.main,
          color.shine,
          35 + Math.random() * 30,
          angle
        );


  const falling =
    document.createElement('div');

  falling.className =
    'falling-capsule drop';

  falling.style.background =
    capsuleBg;

  dropZone.appendChild(
    falling
  );

  jigglePile();


  setTimeout(() => {

    launchCapsuleFullscreen(
      falling,
      capsuleBg,
      milestone,
      apiPromise,
      isPaid
    );

  }, 700);
}


// ============================================================
//  MEGA CRACK
// ============================================================

let megaShakeTimers = [];


const MEGA_CRACK_SHAPES = {

  1: {

    fills: [

      'M27,58 L35,52.1 L31,47.7 L41,43.4 L49,45.7 L57,41.9 L64,45.7 L71,42.1 L78,49 L71,43.9 L64,48.3 L57,44.1 L49,48.3 L41,46.6 L31,50.3 L35,53.9 Z',

      'M57,41.9 L53,32.4 L56,24 L53,33.6 L57,44.1 Z'
    ],

    cores: [

      'M27,58 L35,53 L31,49 L41,45 L49,47 L57,43 L64,47 L71,43 L78,49',

      'M57,43 L53,33 L56,24'
    ]
  },

  2: {

    fills: [

      'M78,49 L81.5,50.6 L85,53 L81.5,51.4 Z',

      'M56,24 L57.5,20.3 L59,16 L57,20.5 Z',

      'M41,45 L38.2,41.9 L36,38 L38.8,41.1 Z'
    ],

    cores: []
  }
};


const MEGA_CRACK_HAIRLINES = [
  'M31,49 L28,53',
  'M64,47 L67,40',
  'M53,33 L48,30'
];


function createMegaCrack() {

  const wrap =
    document.createElement('div');

  wrap.className =
    'mega-crack';

  let svgBody = '';

  for (
    const level of [1, 2]
  ) {

    MEGA_CRACK_SHAPES[
      level
    ].fills.forEach(d => {

      svgBody +=
        `<path
          class="crack-shadow lvl${level}"
          d="${d}"
        />`;

      svgBody +=
        `<path
          class="crack-glow lvl${level}"
          d="${d}"
        />`;

    });


    MEGA_CRACK_SHAPES[
      level
    ].cores.forEach(d => {

      svgBody +=
        `<path
          class="crack-core lvl${level}"
          pathLength="100"
          d="${d}"
        />`;

    });
  }


  MEGA_CRACK_HAIRLINES
    .forEach(d => {

      svgBody +=
        `<path
          class="crack-hairline lvl2"
          pathLength="100"
          d="${d}"
        />`;

    });


  wrap.innerHTML =
    `<svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
    >
      ${svgBody}
    </svg>`;


  return wrap;
}


// ============================================================
//  SHOCKWAVE
// ============================================================

function spawnShockwaveRing(
  mega,
  big
) {

  const rect =
    mega.getBoundingClientRect();

  const cx =
    rect.left +
    rect.width / 2;

  const cy =
    rect.top +
    rect.height / 2;

  const ring =
    document.createElement('div');

  ring.className =
    'mega-ring' +
    (big ? ' big' : '');

  const size =
    rect.width *
    (big ? 1.15 : .92);

  ring.style.left =
    cx + 'px';

  ring.style.top =
    cy + 'px';

  ring.style.width =
    size + 'px';

  ring.style.height =
    size + 'px';

  document.body.appendChild(
    ring
  );

  setTimeout(() => {
    ring.remove();
  }, big ? 950 : 650);
}


// ============================================================
//  CRACK SPARKS
// ============================================================

function spawnCrackSparks(
  mega,
  count
) {

  for (
    let i = 0;
    i < count;
    i++
  ) {

    const spark =
      document.createElement('div');

    spark.className =
      'crack-spark';

    const px =
      45 +
      Math.random() * 22 -
      11;

    const py =
      45 +
      Math.random() * 14 -
      7;

    spark.style.left =
      px + '%';

    spark.style.top =
      py + '%';

    const angle =
      Math.random() *
      Math.PI *
      2;

    const distance =
      8 +
      Math.random() * 14;

    spark.style.setProperty(
      '--dx',
      Math.cos(angle) *
      distance +
      'px'
    );

    spark.style.setProperty(
      '--dy',
      Math.sin(angle) *
      distance +
      'px'
    );

    spark.style.animationDelay =
      (
        Math.random() * .05
      ) + 's';

    mega.appendChild(
      spark
    );

    setTimeout(() => {
      spark.remove();
    }, 650);
  }
}


// ============================================================
//  BURST SPARKS
// ============================================================

function spawnBurstSparks(
  mega,
  count
) {

  const rect =
    mega.getBoundingClientRect();

  for (
    let i = 0;
    i < count;
    i++
  ) {

    const spark =
      document.createElement('div');

    spark.className =
      'crack-spark';

    spark.style.position =
      'fixed';

    spark.style.left =
      (
        rect.left +
        rect.width *
        (
          .34 +
          Math.random() * .32
        )
      ) + 'px';

    spark.style.top =
      (
        rect.top +
        rect.height *
        (
          .34 +
          Math.random() * .24
        )
      ) + 'px';

    const angle =
      Math.random() *
      Math.PI *
      2;

    const distance =
      16 +
      Math.random() * 28;

    spark.style.setProperty(
      '--dx',
      Math.cos(angle) *
      distance +
      'px'
    );

    spark.style.setProperty(
      '--dy',
      Math.sin(angle) *
      distance +
      'px'
    );

    spark.style.animationDelay =
      (
        Math.random() * .05
      ) + 's';

    document.body.appendChild(
      spark
    );

    setTimeout(() => {
      spark.remove();
    }, 700);
  }
}


// ============================================================
//  FULLSCREEN CAPSULE
// ============================================================

function launchCapsuleFullscreen(
  fallingEl,
  capsuleBg,
  milestone,
  apiPromise,
  isPaid
) {

  const rect =
    fallingEl.getBoundingClientRect();

  fallingEl.remove();


  const dim =
    document.createElement('div');

  dim.className =
    'mega-dim';

  document.body.appendChild(
    dim
  );

  requestAnimationFrame(() => {
    dim.classList.add('on');
  });


  const megaRays =
    document.createElement('div');

  megaRays.className =
    'mega-rays';

  document.body.appendChild(
    megaRays
  );


  const mega =
    document.createElement('div');

  mega.className =
    'mega-capsule';

  mega.style.background =
    capsuleBg;

  mega.style.left =
    rect.left + 'px';

  mega.style.top =
    rect.top + 'px';

  mega.style.width =
    rect.width + 'px';

  mega.style.height =
    rect.height + 'px';

  document.body.appendChild(
    mega
  );


  const megaSparkles =
    document.createElement('div');

  megaSparkles.className =
    'mega-sparkles';

  const SPARKLE_COUNT = 10;

  const sparkleSpecs =
    Array.from(
      {
        length:
          SPARKLE_COUNT
      },
      () => ({

        angle:
          Math.random() * 360,

        radius:
          42 +
          Math.random() * 14,

        glyph:
          Math.random() > .5
            ? '✦'
            : '✧',

        delay:
          (
            Math.random() * 1.4
          ).toFixed(2),

        duration:
          (
            .9 +
            Math.random() * .9
          ).toFixed(2)
      })
    );


  requestAnimationFrame(() => {

    mega.style.transition =
      'left .85s cubic-bezier(.22,1.6,.4,1),' +
      'top .85s cubic-bezier(.22,1.6,.4,1),' +
      'width .85s cubic-bezier(.22,1.6,.4,1),' +
      'height .85s cubic-bezier(.22,1.6,.4,1),' +
      'box-shadow .45s ease-out';


    const size =
      Math.min(
        window.innerWidth,
        window.innerHeight
      ) * .8;


    mega.style.left =
      (
        window.innerWidth / 2 -
        size / 2
      ) + 'px';

    mega.style.top =
      (
        window.innerHeight / 2 -
        size / 2
      ) + 'px';

    mega.style.width =
      size + 'px';

    mega.style.height =
      size + 'px';


    sparkleSpecs.forEach(
      spec => {

        const rad =
          spec.angle *
          Math.PI /
          180;

        const star =
          document.createElement('div');

        star.className =
          'mega-sparkle';

        star.textContent =
          spec.glyph;

        star.style.left =
          (
            50 +
            Math.cos(rad) *
            spec.radius
          ) + '%';

        star.style.top =
          (
            50 +
            Math.sin(rad) *
            spec.radius
          ) + '%';

        star.style.fontSize =
          (
            size *
            (
              .07 +
              Math.random() * .05
            )
          ).toFixed(1) +
          'px';

        star.style.animationDelay =
          spec.delay + 's';

        star.style.animationDuration =
          spec.duration + 's';

        megaSparkles.appendChild(
          star
        );
      }
    );

    mega.appendChild(
      megaSparkles
    );
  });


  const megaCrack =
    createMegaCrack();

  mega.appendChild(
    megaCrack
  );


  const SHAKE_GAPS_MS =
    [950, 550, 700, 700];

  const SHAKE_LOOP_GAP_MS =
    700;

  let shakeIndex = 0;


  function scheduleNextShake(
    delay
  ) {

    const timer =
      setTimeout(() => {

        const index =
          shakeIndex++;

        dim.classList.add(
          'surge'
        );

        setTimeout(() => {
          dim.classList.remove(
            'surge'
          );
        }, 110);


        mega.classList.remove(
          'mega-shake'
        );

        void mega.offsetWidth;

        mega.classList.add(
          'mega-shake'
        );


        spawnCrackSparks(
          mega,
          Math.min(
            3 + index,
            10
          )
        );


        spawnShockwaveRing(
          mega,
          false
        );


        setTimeout(() => {

          if (index === 0) {

            megaCrack
              .querySelectorAll(
                '.crack-shadow.lvl1'
              )
              .forEach(p =>
                p.classList.add(
                  'show'
                )
              );

          } else if (
            index === 1
          ) {

            megaCrack
              .querySelectorAll(
                '.crack-shadow.lvl2,' +
                '.crack-hairline'
              )
              .forEach(p =>
                p.classList.add(
                  'show'
                )
              );

            megaCrack.classList.add(
              'glow-1'
            );

            mega.classList.add(
              'glow-1'
            );

            megaRays.classList.add(
              'glow-1'
            );

          } else if (
            index === 2
          ) {

            megaCrack.classList.remove(
              'glow-1'
            );

            megaCrack.classList.add(
              'glow-2'
            );

            mega.classList.remove(
              'glow-1'
            );

            mega.classList.add(
              'glow-2'
            );

            megaRays.classList.remove(
              'glow-1'
            );

            megaRays.classList.add(
              'glow-2'
            );

          } else {

            megaCrack.classList.remove(
              'glow-2'
            );

            megaCrack.classList.add(
              'glow-3'
            );

            mega.classList.remove(
              'glow-2'
            );

            mega.classList.add(
              'glow-3'
            );

            megaRays.classList.remove(
              'glow-2'
            );

            megaRays.classList.add(
              'glow-3'
            );
          }

        }, 90);


        const nextDelay =
          index + 1 <
          SHAKE_GAPS_MS.length

            ? SHAKE_GAPS_MS[
                index + 1
              ]

            : SHAKE_LOOP_GAP_MS;


        scheduleNextShake(
          nextDelay
        );

      }, delay);


    megaShakeTimers.push(
      timer
    );
  }


  scheduleNextShake(
    SHAKE_GAPS_MS[0]
  );


  const MIN_LAUNCH_MS =
    950;


  setTimeout(
    async () => {

      const result =
        await apiPromise;


      megaShakeTimers.forEach(
        timer =>
          clearTimeout(timer)
      );

      megaShakeTimers = [];


      splitCapsuleOpen(
        mega,
        dim,
        megaCrack,
        megaRays,
        () => {

          dropZone.innerHTML =
            '';


          if (
            !result ||
            !result.success
          ) {

            const attemptedMilestone =
              milestone;


            if (
              result?.hardFail
            ) {

              showToast(
                '⏳ ระบบช้าผิดปกติ กำลังซิงค์ข้อมูล...',
                'error',
                4000
              );

            } else {

              showErrorCard(
                result?.message ||
                result?.error
              );
            }


            instruction.textContent =
              '🔄 กำลังซิงค์ข้อมูลใหม่...';


            reloadLootBoxData()
              .then(() => {

                if (
                  !stock.includes(
                    attemptedMilestone
                  )
                ) {

                  showToast(
                    '🎁 กล่องนี้เปิดสำเร็จไปแล้ว กำลังเปิดประวัติให้ดูรางวัล',
                    'success',
                    6000
                  );

                  openHistoryOverlay();
                }

              })
              .catch(error => {

                console.error(
                  'Resync failed:',
                  error
                );

                busy = false;

                updateIdleHints();

              });

            return;
          }


          // ==================================================
          //  SUCCESS
          // ==================================================

          stock.shift();

          delete lootTokens[
            milestone
          ];

          renderPile();

          updatePlateText();

          pile.classList.add(
            'pile-settle'
          );

          setTimeout(() => {

            pile.classList.remove(
              'pile-settle'
            );

          }, 400);


          showResult(
            milestone,
            result,
            isPaid
          );


          instruction.textContent =
            stock.length

              ? 'แตะที่จับอีกครั้งเพื่อเปิดลูกถัดไป'

              : 'เปิดครบแล้วตอนนี้';


          busy = false;

          updateIdleHints();

        }
      );

    },
    MIN_LAUNCH_MS
  );
}


// ============================================================
//  SPLIT CAPSULE
// ============================================================

function splitCapsuleOpen(
  mega,
  dim,
  megaCrack,
  megaRays,
  onDone
) {

  const doSplit = () => {

    const rect =
      mega.getBoundingClientRect();


    const top =
      document.createElement('div');

    top.className =
      'mega-half mega-top';

    top.style.background =
      mega.style.background;

    top.style.left =
      rect.left + 'px';

    top.style.top =
      rect.top + 'px';

    top.style.width =
      rect.width + 'px';

    top.style.height =
      rect.height + 'px';


    const bottom =
      document.createElement('div');

    bottom.className =
      'mega-half mega-bottom';

    bottom.style.background =
      mega.style.background;

    bottom.style.left =
      rect.left + 'px';

    bottom.style.top =
      rect.top + 'px';

    bottom.style.width =
      rect.width + 'px';

    bottom.style.height =
      rect.height + 'px';


    document.body.appendChild(
      top
    );

    document.body.appendChild(
      bottom
    );

    mega.remove();


    const flashCore =
      document.createElement('div');

    flashCore.className =
      'mega-flash core';

    document.body.appendChild(
      flashCore
    );

    requestAnimationFrame(() => {
      flashCore.classList.add(
        'go'
      );
    });


    const flash =
      document.createElement('div');

    flash.className =
      'mega-flash';

    document.body.appendChild(
      flash
    );

    requestAnimationFrame(() => {
      flash.classList.add(
        'go'
      );
    });


    requestAnimationFrame(() => {

      top.classList.add(
        'mega-split-top'
      );

      bottom.classList.add(
        'mega-split-bottom'
      );

    });


    dim.classList.remove(
      'on'
    );


    setTimeout(
      () => onDone(),
      180
    );


    setTimeout(() => {

      top.remove();
      bottom.remove();
      dim.remove();
      flash.remove();
      flashCore.remove();
      megaRays.remove();

    }, 640);
  };


  if (megaCrack) {

    megaCrack
      .querySelectorAll(
        '.crack-shadow'
      )
      .forEach(p =>
        p.classList.add(
          'show'
        )
      );

    void megaCrack.offsetWidth;

    megaCrack.classList.add(
      'fuse'
    );


    setTimeout(() => {

      megaCrack.classList.add(
        'shatter'
      );

      megaRays.classList.add(
        'shatter'
      );

      spawnShockwaveRing(
        mega,
        true
      );

      spawnBurstSparks(
        mega,
        16
      );

      document.body.classList.add(
        'mega-camera-shake'
      );


      setTimeout(() => {

        document.body.classList.remove(
          'mega-camera-shake'
        );

      }, 360);


      setTimeout(
        doSplit,
        90
      );

    }, 150);

  } else {

    doSplit();
  }
}


// ============================================================
//  CONFETTI
// ============================================================

function spawnConfetti(
  count
) {

  const colors = [
    'var(--gold)',
    'var(--red-light)',
    '#D9C4FF',
    '#BFF3E1',
    '#C6E6FF',
    '#FFE39A'
  ];


  for (
    let i = 0;
    i < count;
    i++
  ) {

    const piece =
      document.createElement('div');

    piece.className =
      'confetti-piece';

    const width =
      6 +
      Math.random() * 6;

    const height =
      width *
      (
        1.3 +
        Math.random() * .6
      );

    piece.style.width =
      width + 'px';

    piece.style.height =
      height + 'px';

    piece.style.left =
      (
        Math.random() * 100
      ) + 'vw';

    piece.style.background =
      colors[
        Math.floor(
          Math.random() *
          colors.length
        )
      ];

    piece.style.animationDuration =
      (
        2 +
        Math.random() * 1.4
      ) + 's';

    piece.style.animationDelay =
      (
        Math.random() * .5
      ) + 's';

    confettiLayer.appendChild(
      piece
    );

    setTimeout(() => {
      piece.remove();
    }, 4000);
  }
}


// ============================================================
//  ERROR CARD
// ============================================================

function showErrorCard(
  message
) {

  prizeCard.classList.add(
    'error-state'
  );

  rarityRibbon.classList.remove(
    'shine'
  );

  rarityRibbon.textContent =
    '⚠️ ลองใหม่อีกครั้ง';

  resultTierLabel.textContent =
    '';

  resultPrize.textContent =
    'เปิดไม่สำเร็จ';

  resultNote.textContent =
    message ||
    'เกิดข้อผิดพลาด ลองใหม่อีกครั้งได้เลยครับ';

  closeBtn.textContent =
    'ลองใหม่อีกครั้ง';


  document
    .querySelectorAll(
      '.burst'
    )
    .forEach(el =>
      el.remove()
    );


  screenFlash.classList.remove(
    'go',
    'big'
  );


  overlay.classList.remove(
    'show'
  );

  void overlay.offsetWidth;

  overlay.classList.add(
    'show'
  );
}


// ============================================================
//  SHOW RESULT
// ============================================================

function showResult(
  milestone,
  result,
  isPaid
) {

  prizeCard.classList.remove(
    'error-state'
  );

  closeBtn.textContent =
    'เก็บรางวัล 🎉';


  const amount =
    Number(
      result.discount_amount
    ) || 0;


  const rarity =
    rarityOf(amount);


  resultTierLabel.textContent =
    (
      stockLabels[
        milestone
      ] ||
      milestone
    ).toUpperCase();


  resultPrize.textContent =
    `ส่วนลด ${amount} บาท`;


  resultNote.textContent =
    'ส่วนลดเข้ารอบบิลถัดไปอัตโนมัติ';


  rarityRibbon.textContent =
    '🎉 ยินดีด้วย!';

  rarityRibbon.classList.remove(
    'shine'
  );


  if (
    rarity !== 'common'
  ) {

    void rarityRibbon.offsetWidth;

    rarityRibbon.classList.add(
      'shine'
    );
  }


  document
    .querySelectorAll(
      '.burst'
    )
    .forEach(el =>
      el.remove()
    );


  const count =
    rarity === 'legendary'
      ? 28
      : rarity === 'rare'
        ? 18
        : 9;


  for (
    let i = 0;
    i < count;
    i++
  ) {

    const burst =
      document.createElement('div');

    burst.className =
      'burst';


    const angle =
      Math.random() *
      Math.PI *
      2;

    const distance =
      30 +
      Math.random() * 30;


    burst.style.setProperty(
      '--dx',
      `${Math.cos(angle) * distance}px`
    );

    burst.style.setProperty(
      '--dy',
      `${Math.sin(angle) * distance}px`
    );


    burst.style.background =
      Math.random() > .5

        ? 'var(--gold)'

        : NEW_PALETTE[
            Math.floor(
              Math.random() *
              NEW_PALETTE.length
            )
          ].main;


    prizeCard.appendChild(
      burst
    );


    setTimeout(() => {
      burst.classList.add(
        'go'
      );
    }, 10);
  }


  screenFlash.classList.remove(
    'go',
    'big'
  );

  void screenFlash.offsetWidth;


  document
    .querySelectorAll(
      '.confetti-piece'
    )
    .forEach(el =>
      el.remove()
    );


  if (
    rarity === 'legendary'
  ) {

    screenFlash.classList.add(
      'go',
      'big'
    );

    setTimeout(
      () => spawnConfetti(46),
      300
    );

  } else if (
    rarity === 'rare'
  ) {

    screenFlash.classList.add(
      'go'
    );

    setTimeout(
      () => spawnConfetti(20),
      300
    );

  } else {

    screenFlash.classList.add(
      'go'
    );
  }


  overlay.classList.remove(
    'show'
  );

  void overlay.offsetWidth;

  overlay.classList.add(
    'show'
  );
}


// ============================================================
//  CABINET
// ============================================================

function updateRoomLabel(
  room
) {

  if (cabRoomBadge) {

    cabRoomBadge.textContent =
      'ห้อง ' + room;
  }

  currentRoomNo =
    room;

  showHistoryButton();
}


function renderCabinet(
  result
) {

  retryBtn.style.display =
    'none';


  if (
    result.roomNo
  ) {

    updateRoomLabel(
      result.roomNo
    );
  }


  stock = [];
  lootTokens = {};


  const order = [
    'PAID',
    7,
    14,
    21,
    28
  ];


  const boxes =
    result.boxes || {};


  order.forEach(
    milestone => {

      const info =
        boxes[
          milestone
        ] ||
        boxes[
          String(milestone)
        ] ||
        {};


      if (
        info.token &&
        !info.opened
      ) {

        const key =
          String(milestone);

        stock.push(
          key
        );

        lootTokens[key] =
          info.token;
      }
    }
  );


  renderPile();

  updatePlateText();


  crank.style.pointerEvents =
    '';


  busy = false;

  updateIdleHints();


  instruction.textContent =
    stock.length

      ? 'แตะที่จับเพื่อลุ้นรางวัล'

      : 'ยังไม่มีกาชาปองให้เปิดในตอนนี้';
}


// ============================================================
//  LOAD DATA
// ============================================================

async function loadLootBoxByUserId(
  lineUserId
) {

  try {

    if (!lineUserId) {

      showError(
        '❌ ไม่พบ LINE User ID',
        true
      );

      return;
    }


    const result =
      await callSupabaseWithRetry(
        'getLootBoxData',
        {
          line_user_id:
            lineUserId
        },
        2,
        800,
        15000
      );


    if (!result.success) {

      showError(
        '❌ ' +
        (
          result.message ||
          result.error ||
          'โหลดข้อมูลไม่ได้'
        ),
        true
      );

      return;
    }


    renderCabinet(
      result
    );

  } catch (error) {

    console.error(
      'loadLootBoxByUserId failed:',
      error
    );

    showError(
      '❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ',
      true
    );
  }
}


// ============================================================
//  OPTIONAL ROOM MODE
//  ใช้ได้ถ้า Edge Function รองรับ room_no
// ============================================================

async function loadLootBoxForRoom(
  roomNo
) {

  try {

    const result =
      await callSupabaseWithRetry(
        'getLootBoxData',
        {
          room_no:
            roomNo,

          line_user_id:
            liffProfile?.userId ||
            null
        },
        2,
        800,
        15000
      );


    if (!result.success) {

      showError(
        '❌ ' +
        (
          result.message ||
          result.error ||
          'โหลดไม่ได้'
        ),
        true
      );

      return;
    }


    renderCabinet(
      result
    );

  } catch (error) {

    console.error(
      'loadLootBoxForRoom failed:',
      error
    );

    showError(
      '❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ',
      true
    );
  }
}


// ============================================================
//  OPTIONAL TOKEN MODE
// ============================================================

async function loadLootBoxByToken(
  token
) {

  try {

    const result =
      await callSupabaseWithRetry(
        'getLootBoxData',
        {
          token,

          line_user_id:
            liffProfile?.userId ||
            null
        },
        2,
        800,
        15000
      );


    if (!result.success) {

      showError(
        '❌ ' +
        (
          result.message ||
          result.error ||
          'Token ไม่ถูกต้อง'
        ),
        true
      );

      return;
    }


    renderCabinet(
      result
    );

  } catch (error) {

    console.error(
      'loadLootBoxByToken failed:',
      error
    );

    showError(
      '❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ',
      true
    );
  }
}


// ============================================================
//  HISTORY
// ============================================================

function showHistoryButton() {

  const button =
    document.getElementById(
      'btn-history'
    );

  if (button) {
    button.classList.add(
      'show'
    );
  }
}


const TH_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม'
];


function formatMonthLabel(
  monthKey
) {

  const [
    year,
    month
  ] =
    String(monthKey)
      .split('-')
      .map(Number);


  if (!year || !month)
    return monthKey;


  return `${
    TH_MONTHS[month - 1]
  } ${
    year + 543
  }`;
}


function getTierMeta(
  tierRaw
) {

  if (
    String(tierRaw)
      .trim()
      .toUpperCase() ===
    'PAID'
  ) {

    return {
      name:
        'PAID BONUS',

      color:
        TIER_COLORS.paid
    };
  }


  const cfg =
    LB_CONFIG.find(
      item =>
        item.milestone ===
        Number(tierRaw)
    );


  if (cfg) {

    return {
      name:
        cfg.name,

      color:
        TIER_COLORS[
          cfg.tier
        ]
    };
  }


  return {
    name:
      'ไม่ทราบ',

    color:
      '#8B929C'
  };
}


function openHistoryOverlay() {

  const historyOverlay =
    document.getElementById(
      'history-overlay'
    );

  if (!historyOverlay)
    return;


  historyOverlay.classList.add(
    'active'
  );

  loadHistory();
}


function closeHistoryOverlay() {

  const historyOverlay =
    document.getElementById(
      'history-overlay'
    );

  if (!historyOverlay)
    return;


  historyOverlay.classList.remove(
    'active'
  );
}


async function loadHistory() {

  const body =
    document.getElementById(
      'history-body'
    );


  if (!body)
    return;


  body.innerHTML =
    '<div class="loading">กำลังโหลด...</div>';


  if (
    !liffProfile?.userId
  ) {

    body.innerHTML =
      '<div class="loading">❌ ไม่พบ LINE User</div>';

    return;
  }


  try {

    const result =
      await callSupabaseWithRetry(
        'getLootHistory',
        {
          line_user_id:
            liffProfile.userId
        },
        1,
        700,
        12000
      );


    if (!result.success) {

      body.innerHTML =
        `<div class="loading">
          ❌ ${
            result.message ||
            result.error ||
            'โหลดไม่ได้'
          }
        </div>`;

      return;
    }


    renderHistory(
      result.history || []
    );

  } catch (error) {

    console.error(
      'loadHistory failed:',
      error
    );

    body.innerHTML =
      '<div class="loading">❌ โหลดข้อมูลไม่ได้ กรุณาลองใหม่ครับ</div>';
  }
}


// ============================================================
//  RENDER HISTORY
// ============================================================

function renderHistory(
  history
) {

  const body =
    document.getElementById(
      'history-body'
    );


  if (!body)
    return;


  if (!history.length) {

    body.innerHTML =
      '<div class="loading">ยังไม่มีประวัติการเปิดกาชาปองครับ</div>';

    return;
  }


  body.innerHTML =
    history.map(
      historyItem => {

        const items =
          Array.isArray(
            historyItem.items
          )
            ? historyItem.items
            : [];


        const total =
          items.reduce(
            (
              sum,
              item
            ) =>
              sum +
              (
                item.opened
                  ? Number(
                      item.amount
                    )
                  : 0
              ),
            0
          );


        const hasOpened =
          items.some(
            item =>
              item.opened
          );


        const itemsHtml =
          items.map(
            item => {

              const meta =
                getTierMeta(
                  item.tier
                );


              const amountHtml =
                item.opened

                  ? `<span class="history-item-amount">
                      ฿${Number(
                        item.amount
                      ).toLocaleString()}
                    </span>`

                  : `<span class="history-item-amount not-opened">
                      ไม่ได้เปิด
                    </span>`;


              return `
                <div class="history-item">

                  <span
                    class="history-item-tier"
                    style="--tier-color:${meta.color}"
                  >
                    <span
                      class="history-item-dot"
                    ></span>

                    ${meta.name}
                  </span>

                  ${amountHtml}

                </div>
              `;
            }
          ).join('');


        const statusHtml =
          hasOpened

            ? `<span
                class="history-status ${
                  historyItem.applied
                    ? 'applied'
                    : 'pending'
                }"
              >
                ${
                  historyItem.applied
                    ? 'ตัดบิลแล้ว'
                    : 'รอตัดบิล'
                }
              </span>`

            : '';


        const totalHtml =
          hasOpened

            ? `
              <div class="history-total">

                <span
                  class="history-total-label"
                >
                  รวม
                </span>

                <span
                  class="history-total-amount"
                >
                  ฿${total.toLocaleString()}
                </span>

              </div>
            `

            : '';


        return `
          <div class="history-month">

            <div
              class="history-month-head"
            >

              <span
                class="history-month-label"
              >
                ${formatMonthLabel(
                  historyItem.month
                )}
              </span>

              ${statusHtml}

            </div>

            <div
              class="history-items"
            >
              ${itemsHtml}
            </div>

            ${totalHtml}

          </div>
        `;
      }
    ).join('');
}


// ============================================================
//  RESYNC
// ============================================================

async function reloadLootBoxData() {

  busy = true;

  updateIdleHints();


  try {

    if (
      bootMode === 'userId'
    ) {

      await loadLootBoxByUserId(
        bootParam
      );

    } else if (
      bootMode === 'room'
    ) {

      await loadLootBoxForRoom(
        bootParam
      );

    } else if (
      bootMode === 'token'
    ) {

      await loadLootBoxByToken(
        bootParam
      );

    } else {

      showError(
        '❌ ไม่พบข้อมูลห้อง',
        true
      );
    }

  } catch (error) {

    console.error(
      'reloadLootBoxData failed:',
      error
    );

    busy = false;

    showError(
      '❌ ซิงค์ข้อมูลไม่สำเร็จ',
      true
    );
  }
}


// ============================================================
//  EVENTS
// ============================================================

if (closeBtn) {

  closeBtn.addEventListener(
    'click',
    () => {

      overlay.classList.remove(
        'show'
      );

      if (
        prizeCard.classList.contains(
          'error-state'
        )
      ) {

        prizeCard.classList.remove(
          'error-state'
        );

        busy = false;

        reloadLootBoxData();
      }
    }
  );
}


if (crank) {

  crank.addEventListener(
    'click',
    playOpen
  );


  crank.addEventListener(
    'keydown',
    event => {

      if (
        event.key === 'Enter' ||
        event.key === ' '
      ) {

        event.preventDefault();

        playOpen();
      }
    }
  );
}


if (retryBtn) {

  retryBtn.addEventListener(
    'click',
    () => {

      retryBtn.classList.add(
        'loading'
      );

      instruction.textContent =
        'กำลังลองเชื่อมต่อใหม่...';


      reloadLootBoxData()
        .finally(() => {

          retryBtn.classList.remove(
            'loading'
          );

        });
    }
  );
}


// ============================================================
//  INIT
// ============================================================

async function init() {

  try {

    const params =
      new URLSearchParams(
        window.location.search
      );


    const room =
      params.get('room');

    const token =
      params.get('token');

    const view =
      params.get('view');


    crank.style.pointerEvents =
      'none';


    // ======================================================
    //  ROOM / TOKEN MODE
    //  ยังโหลดได้โดยไม่ต้องรอ LIFF
    // ======================================================

    if (room) {

      bootMode =
        'room';

      bootParam =
        room;


      // พยายาม init LIFF ก่อน
      // เพื่อส่ง user id ให้ backend ตรวจสิทธิ์
      const liffResult =
        await initLiff();


      if (
        liffResult ===
        'redirecting'
      ) {

        return;
      }


      await loadLootBoxForRoom(
        room
      );


    } else if (token) {

      bootMode =
        'token';

      bootParam =
        token;


      const liffResult =
        await initLiff();


      if (
        liffResult ===
        'redirecting'
      ) {

        return;
      }


      await loadLootBoxByToken(
        token
      );


    } else {

      // ====================================================
      //  NORMAL LIFF MODE
      // ====================================================

      const liffResult =
        await initLiff();


      if (
        liffResult ===
        'redirecting'
      ) {

        return;
      }


      if (
        liffReady &&
        liff.isLoggedIn() &&
        liffProfile?.userId
      ) {

        bootMode =
          'userId';

        bootParam =
          liffProfile.userId;


        await loadLootBoxByUserId(
          liffProfile.userId
        );

      } else {

        showError(
          '❌ ไม่พบข้อมูล LINE กรุณาเปิดผ่าน LINE',
          true
        );
      }
    }


    if (
      view === 'history' &&
      currentRoomNo
    ) {

      openHistoryOverlay();
    }


  } catch (error) {

    console.error(
      'APP INIT ERROR:',
      error
    );

    busy = false;

    showError(
      '❌ ไม่สามารถเริ่มระบบได้ กรุณาลองใหม่',
      true
    );

  } finally {

    document
      .getElementById(
        'boot-mask'
      )
      ?.remove();
  }
}


init();
