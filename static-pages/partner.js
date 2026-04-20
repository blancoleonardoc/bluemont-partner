/* ── partner hub shared runtime ──────────────────────── */

const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  crm: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="16" cy="6" r="2.5"/><path d="M14 20c0-2.8 2.2-5 5-5"/></svg>',
  investimentos: '<svg viewBox="0 0 24 24"><path d="M4 20V10"/><path d="M10 20V6"/><path d="M16 20v-8"/><path d="M22 20V4"/><path d="M3 20h19"/></svg>',
  servicos: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/></svg>',
  conteudo: '<svg viewBox="0 0 24 24"><path d="M12 5v15"/><path d="M4 5c3 0 6 0.8 8 2v13c-2-1.2-5-2-8-2V5z"/><path d="M20 5c-3 0-6 0.8-8 2v13c2-1.2 5-2 8-2V5z"/></svg>',
  chat: '<svg viewBox="0 0 24 24"><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/></svg>',
  bluemont: '<svg viewBox="0 0 24 24"><rect x="4" y="10" width="5" height="10"/><rect x="10" y="4" width="5" height="16"/><rect x="16" y="13" width="4" height="7"/><path d="M3 20h18"/></svg>',
};

const NAV = [
  { id: 'dashboard',     label: 'Dashboard',      href: 'index.html' },
  { id: 'crm',           label: 'CRM',            href: 'crm.html' },
  { id: 'investimentos', label: 'Investimentos',  href: 'investimentos.html' },
  { id: 'servicos',      label: 'Serviços',       href: 'servicos.html' },
  { id: 'conteudo',      label: 'Conteúdo',       href: 'conteudo.html' },
  { id: 'chat',          label: 'Chat',           href: 'chat.html' },
  { id: 'bluemont',      label: 'Bluemont',       href: 'bluemont.html' },
];

function renderSidebar(activeId) {
  const links = NAV.map(n => `
    <a href="${n.href}" class="${n.id === activeId ? 'active' : ''}">
      ${ICONS[n.id]}
      <span>${n.label}</span>
    </a>
  `).join('');

  return `
    <aside class="sidebar">
      <div class="brand">bluemont<small>· partner</small></div>
      <nav>${links}</nav>
      <div class="foot">v1.0 — bluemont partner</div>
    </aside>
  `;
}

function initSidebar(activeId) {
  const mount = document.getElementById('sidebar-mount');
  if (mount) mount.outerHTML = renderSidebar(activeId);
}

/* ── formatters ─────────────────────────────────────── */
const fmtBRL = (n) => 'R$ ' + n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
const fmtBRLk = (n) => {
  if (n >= 1_000_000) return 'R$ ' + (n / 1_000_000).toFixed(1).replace('.', ',') + 'M';
  if (n >= 1_000)     return 'R$ ' + (n / 1_000).toFixed(0) + 'k';
  return fmtBRL(n);
};
const fmtPct = (n) => (n >= 0 ? '+' : '') + n.toFixed(1).replace('.', ',') + '%';

/* ── storage ────────────────────────────────────────── */
const STORE = {
  clientes: 'bluemont.partner.clientes',
  oportunidades: 'bluemont.partner.oportunidades',
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch { return fallback; }
}
function saveJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

/* ── mock data ──────────────────────────────────────── */
const MESES = ['abr','mai','jun','jul','ago','set','out','nov','dez','jan','fev','mar'];
// 12 meses de custódia (em BRL) — tendência crescente, realista
const CUSTODIA_12M = [42_100_000, 43_400_000, 44_900_000, 44_200_000, 46_800_000, 48_300_000, 49_100_000, 51_700_000, 53_200_000, 52_800_000, 55_400_000, 57_900_000];
const RECEITA_12M  = [88_000, 91_500, 95_000, 92_000, 99_400, 104_200, 106_800, 112_400, 118_000, 115_300, 121_800, 127_500]; // receita mensal
const MOCK = {
  custodia12m: CUSTODIA_12M,
  receita12m: RECEITA_12M,
  meses: MESES,
  custodiaAtual: CUSTODIA_12M[CUSTODIA_12M.length - 1],
  custodiaAnterior: CUSTODIA_12M[CUSTODIA_12M.length - 2],
  receitaAno: RECEITA_12M.reduce((a,b)=>a+b, 0),
  receita30d: RECEITA_12M[RECEITA_12M.length - 1],
  // oportunidades baseline (somadas às do localStorage)
  oppsBaseTotal: 47,
  opps30dBase: 12,
};

/* ── line chart (inline svg) ────────────────────────── */
function drawLineChart(svgEl, values, labels) {
  const w = svgEl.clientWidth || 600;
  const h = svgEl.clientHeight || 220;
  const padL = 48, padR = 12, padT = 14, padB = 28;
  const min = Math.min(...values) * 0.95;
  const max = Math.max(...values) * 1.02;
  const xStep = (w - padL - padR) / (values.length - 1);
  const y = v => padT + (h - padT - padB) * (1 - (v - min) / (max - min));
  const x = i => padL + i * xStep;

  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `M ${x(0)},${h - padB} L ${pts.split(' ').join(' L ')} L ${x(values.length - 1)},${h - padB} Z`;

  // gridlines (4)
  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const gy = padT + ((h - padT - padB) * i) / 4;
    const gv = max - ((max - min) * i) / 4;
    grid += `<line x1="${padL}" y1="${gy}" x2="${w - padR}" y2="${gy}" stroke="var(--border)" stroke-dasharray="2 3"/>`;
    grid += `<text class="chart-axis-label" x="${padL - 6}" y="${gy + 3}" text-anchor="end">${(gv/1_000_000).toFixed(1)}M</text>`;
  }
  // x labels
  let xlabels = '';
  labels.forEach((m, i) => {
    if (i % 2 === 0 || i === labels.length - 1) {
      xlabels += `<text class="chart-axis-label" x="${x(i)}" y="${h - 10}" text-anchor="middle">${m}</text>`;
    }
  });

  svgEl.innerHTML = `
    <defs>
      <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grid}
    <path d="${area}" fill="url(#grad)"/>
    <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${values.map((v,i) => `<circle cx="${x(i)}" cy="${y(v)}" r="2.5" fill="var(--accent)"/>`).join('')}
    ${xlabels}
  `;
}

/* ── dashboard init ─────────────────────────────────── */
function initDashboard() {
  const opps = loadJSON(STORE.oportunidades, []);
  const now = Date.now();
  const THIRTY = 30 * 24 * 60 * 60 * 1000;
  const opps30d = opps.filter(o => now - new Date(o.data).getTime() <= THIRTY).length;
  const oppsTotal = opps.length + MOCK.oppsBaseTotal;
  const opps30dTotal = opps30d + MOCK.opps30dBase;

  // receita extra gerada pelas oportunidades (estimativa 3% do valor)
  const receitaOppsAll = opps.reduce((s, o) => s + (Number(o.valor) || 0) * 0.03, 0);
  const receitaAno = MOCK.receitaAno + receitaOppsAll;
  const receita30d = MOCK.receita30d + opps
    .filter(o => now - new Date(o.data).getTime() <= THIRTY)
    .reduce((s, o) => s + (Number(o.valor) || 0) * 0.03, 0);

  const captacao = MOCK.custodiaAtual - MOCK.custodiaAnterior;
  const captacaoPct = (captacao / MOCK.custodiaAnterior) * 100;

  document.getElementById('kpi-custodia').textContent = fmtBRLk(MOCK.custodiaAtual);
  document.getElementById('kpi-custodia-sub').textContent = 'total sob custódia';

  document.getElementById('kpi-captacao').textContent = fmtBRLk(captacao);
  const badge = document.getElementById('kpi-captacao-badge');
  badge.textContent = fmtPct(captacaoPct);
  badge.className = 'badge ' + (captacao >= 0 ? 'up' : 'down');
  document.getElementById('kpi-captacao-sub').textContent = 'diferença vs. fechamento anterior';

  document.getElementById('kpi-opps-total').textContent = oppsTotal;
  document.getElementById('kpi-opps-30d').textContent = opps30dTotal + ' nos últimos 30 dias';

  document.getElementById('kpi-receita-total').textContent = fmtBRLk(receitaAno);
  document.getElementById('kpi-receita-30d').textContent = fmtBRLk(receita30d) + ' nos últimos 30 dias';

  const svg = document.getElementById('chart-custodia');
  if (svg) {
    drawLineChart(svg, MOCK.custodia12m, MOCK.meses);
    window.addEventListener('resize', () => drawLineChart(svg, MOCK.custodia12m, MOCK.meses));
  }
}
