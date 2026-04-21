/* ── partner hub shared runtime ──────────────────────── */

const ICONS = {
  dashboard:    '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  crm:          '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="16" cy="6" r="2.5"/><path d="M14 20c0-2.8 2.2-5 5-5"/></svg>',
  investimentos:'<svg viewBox="0 0 24 24"><path d="M4 20V10"/><path d="M10 20V6"/><path d="M16 20v-8"/><path d="M22 20V4"/><path d="M3 20h19"/></svg>',
  servicos:     '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/></svg>',
  agenda:       '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/></svg>',
  conteudo:     '<svg viewBox="0 0 24 24"><path d="M12 5v15"/><path d="M4 5c3 0 6 0.8 8 2v13c-2-1.2-5-2-8-2V5z"/><path d="M20 5c-3 0-6 0.8-8 2v13c2-1.2 5-2 8-2V5z"/></svg>',
  chat:         '<svg viewBox="0 0 24 24"><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/></svg>',
  bluemont:     '<svg viewBox="0 0 24 24"><path d="M12 2L3 7l9 5 9-5-9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/></svg>',
  configuracoes:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  bell:         '<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
};

const NAV = [
  { id: 'dashboard',     label: 'Dashboard',     href: 'index.html' },
  { id: 'crm',           label: 'CRM',           href: 'crm.html' },
  { id: 'investimentos', label: 'Investimentos', href: 'investimentos.html' },
  { id: 'servicos',      label: 'Serviços',      href: 'servicos.html' },
  { id: 'agenda',        label: 'Agenda',        href: 'agenda.html' },
  { id: 'conteudo',      label: 'Conteúdo',      href: 'conteudo.html' },
  { id: 'chat',          label: 'Chat',          href: 'chat.html' },
  { id: 'bluemont',      label: 'Bluemont',      href: 'bluemont.html' },
  { id: 'configuracoes', label: 'Configurações', href: 'configuracoes.html' },
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
  renderHeaderBell();
}

/* ── header bell (notificações) ─────────────────────── */
function renderHeaderBell() {
  let el = document.getElementById('header-bell');
  if (!el) {
    el = document.createElement('div');
    el.id = 'header-bell';
    el.className = 'header-bell';
    document.body.appendChild(el);
  }
  const notifs = buildNotifications();
  const unread = notifs.filter(n => !n.read).length;
  el.innerHTML = `
    <button class="bell-btn" aria-label="notificações" onclick="toggleBellPanel()">
      ${ICONS.bell}
      ${unread ? `<span class="bell-badge">${unread}</span>` : ''}
    </button>
    <div class="bell-panel" id="bell-panel" hidden>
      <div class="bell-panel-head">notificações</div>
      ${notifs.length === 0 ? '<div class="bell-empty">sem alertas no momento</div>' :
        notifs.map(n => `<div class="bell-item ${n.read ? 'read' : ''}"><div class="bell-dot ${n.tone||''}"></div><div><div class="bell-text">${n.text}</div><div class="bell-sub">${n.sub||''}</div></div></div>`).join('')
      }
    </div>`;
}
function toggleBellPanel() {
  const p = document.getElementById('bell-panel');
  if (!p) return;
  p.hidden = !p.hidden;
  if (!p.hidden) {
    // marca como lido (estado de sessão)
    const seen = JSON.parse(sessionStorage.getItem('bluemont.bell.seen') || '[]');
    buildNotifications().forEach(n => { if (!seen.includes(n.id)) seen.push(n.id); });
    sessionStorage.setItem('bluemont.bell.seen', JSON.stringify(seen));
    setTimeout(renderHeaderBell, 50);
  }
}
function buildNotifications() {
  const seen = JSON.parse(sessionStorage.getItem('bluemont.bell.seen') || '[]');
  const list = buildInsights().map((ins, i) => ({
    id: 'ins-' + i + '-' + ins.text.slice(0, 20),
    text: ins.text,
    sub: ins.sub,
    tone: ins.tone,
    read: false,
  }));
  // comunicados fictícios (institucionais)
  list.push({ id: 'com-morning', text: 'Morning call disponível — 14 abr 2026', sub: 'comunicado', tone: 'info', read: false });
  list.push({ id: 'com-meta-ret', text: 'Meta coletiva de retenção atingida (97%)', sub: 'metas', tone: 'up', read: false });
  return list.map(n => ({ ...n, read: seen.includes(n.id) }));
}

/* ── insights engine (varre CRM do assessor) ────────── */
function buildInsights() {
  const clientes = loadJSON(STORE.clientes, []);
  const out = [];
  const now = Date.now();
  const DAY = 86400000;
  for (const c of clientes) {
    const cdi = Number(c.cdi ?? c.perfCdi ?? c.performance);
    if (!isNaN(cdi)) {
      if (cdi < 0) out.push({ text: `${c.nome || 'cliente'} está com ${cdi}% CDI — situação crítica`, sub: 'performance', tone: 'down' });
      else if (cdi < 80) out.push({ text: `${c.nome || 'cliente'} está com ${cdi}% CDI há ${c.cdiDias || 45} dias — considere follow-up`, sub: 'performance', tone: 'warn' });
    }
    if (c.planoPendente || c.planoPendenteDias) {
      out.push({ text: `${c.nome || 'cliente'} tem plano pendente há ${c.planoPendenteDias || 18} dias`, sub: 'plano', tone: 'warn' });
    }
    const ult = c.ultimoContato ? new Date(c.ultimoContato).getTime() : null;
    if (ult && (now - ult) > 30 * DAY) {
      out.push({ text: `${c.nome || 'cliente'} sem contato há ${Math.floor((now-ult)/DAY)} dias`, sub: 'relacionamento', tone: 'warn' });
    }
  }
  // se não tem CRM ainda, usa mock insights
  if (out.length === 0) {
    out.push({ text: 'Felipe Martins está com 72% CDI há 45 dias — considere follow-up', sub: 'performance', tone: 'warn' });
    out.push({ text: 'Ana Carolina Ribeiro tem plano pendente há 18 dias', sub: 'plano', tone: 'warn' });
    out.push({ text: 'Marcos Rezende está com -42% CDI — situação crítica', sub: 'performance', tone: 'down' });
    out.push({ text: '2 clientes sem contato há mais de 30 dias', sub: 'relacionamento', tone: 'warn' });
  }
  return out.slice(0, 6);
}

/* ── formatters ─────────────────────────────────────── */
const fmtBRL = (n) => 'R$ ' + Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
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
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}
function saveJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

/* ── mock data (dashboard pessoal) ──────────────────── */
const MESES = ['abr','mai','jun','jul','ago','set','out','nov','dez','jan','fev','mar'];
const CUSTODIA_12M = [42_100_000, 43_400_000, 44_900_000, 44_200_000, 46_800_000, 48_300_000, 49_100_000, 51_700_000, 53_200_000, 52_800_000, 55_400_000, 57_900_000];
const RECEITA_12M  = [88_000, 91_500, 95_000, 92_000, 99_400, 104_200, 106_800, 112_400, 118_000, 115_300, 121_800, 127_500];
const MOCK = {
  custodia12m: CUSTODIA_12M, receita12m: RECEITA_12M, meses: MESES,
  custodiaAtual: CUSTODIA_12M.at(-1), custodiaAnterior: CUSTODIA_12M.at(-2),
  receitaAno: RECEITA_12M.reduce((a,b)=>a+b,0), receita30d: RECEITA_12M.at(-1),
  clientesAtivos: 47,
};

/* ── line chart (inline svg) ────────────────────────── */
function drawLineChart(svgEl, values, labels) {
  const w = svgEl.clientWidth || 600, h = svgEl.clientHeight || 220;
  const padL = 48, padR = 12, padT = 14, padB = 28;
  const min = Math.min(...values) * 0.95, max = Math.max(...values) * 1.02;
  const xStep = (w - padL - padR) / (values.length - 1);
  const y = v => padT + (h - padT - padB) * (1 - (v - min) / (max - min));
  const x = i => padL + i * xStep;
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `M ${x(0)},${h - padB} L ${pts.split(' ').join(' L ')} L ${x(values.length - 1)},${h - padB} Z`;
  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const gy = padT + ((h - padT - padB) * i) / 4;
    const gv = max - ((max - min) * i) / 4;
    grid += `<line x1="${padL}" y1="${gy}" x2="${w - padR}" y2="${gy}" stroke="var(--border)" stroke-dasharray="2 3"/>`;
    grid += `<text class="chart-axis-label" x="${padL - 6}" y="${gy + 3}" text-anchor="end">${(gv/1_000_000).toFixed(1)}M</text>`;
  }
  let xlabels = '';
  labels.forEach((m, i) => {
    if (i % 2 === 0 || i === labels.length - 1) {
      xlabels += `<text class="chart-axis-label" x="${x(i)}" y="${h - 10}" text-anchor="middle">${m}</text>`;
    }
  });
  svgEl.innerHTML = `
    <defs><linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
    ${grid}
    <path d="${area}" fill="url(#grad)"/>
    <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${values.map((v,i) => `<circle cx="${x(i)}" cy="${y(v)}" r="2.5" fill="var(--accent)"/>`).join('')}
    ${xlabels}`;
}

/* ── dashboard init ─────────────────────────────────── */
function initDashboard() {
  const captacao = MOCK.custodiaAtual - MOCK.custodiaAnterior;
  const captacaoPct = (captacao / MOCK.custodiaAnterior) * 100;
  const clientes = loadJSON(STORE.clientes, []);
  const clientesAtivos = clientes.length || MOCK.clientesAtivos;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('kpi-custodia', fmtBRLk(MOCK.custodiaAtual));
  set('kpi-custodia-sub', 'sua custódia pessoal');
  set('kpi-captacao', fmtBRLk(captacao));
  const badge = document.getElementById('kpi-captacao-badge');
  if (badge) { badge.textContent = fmtPct(captacaoPct); badge.className = 'badge ' + (captacao >= 0 ? 'up' : 'down'); }
  set('kpi-captacao-sub', 'no mês corrente');
  set('kpi-clientes', String(clientesAtivos));
  set('kpi-clientes-sub', 'clientes na sua carteira');
  set('kpi-receita', fmtBRLk(MOCK.receita30d));
  set('kpi-receita-sub', 'receita do mês');

  const svg = document.getElementById('chart-custodia');
  if (svg) {
    drawLineChart(svg, MOCK.custodia12m, MOCK.meses);
    window.addEventListener('resize', () => drawLineChart(svg, MOCK.custodia12m, MOCK.meses));
  }

  // Seu dia hoje — insights
  const mount = document.getElementById('insights-list');
  if (mount) {
    const ins = buildInsights();
    mount.innerHTML = ins.length === 0
      ? '<li class="insight-empty">nenhum alerta no momento.</li>'
      : ins.map(i => `<li class="insight-item ${i.tone||''}"><span class="insight-dot"></span><div><div>${i.text}</div><div class="insight-sub">${i.sub||''}</div></div></li>`).join('');
  }
}
