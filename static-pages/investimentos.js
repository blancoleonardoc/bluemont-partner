/* ── Carteira recomendada (alloc.xlsx) ──────────────── */

const CARTEIRA = [
  // Debt — 75%
  { bucket: 'Debt',   classe: 'Pós',      peso: 50,  tese: 'caixa remunerado à Selic, baixo risco de marcação.' },
  { bucket: 'Debt',   classe: 'Pré',      peso: 10,  tese: 'trava de prêmio nominal em janela tática.' },
  { bucket: 'Debt',   classe: 'Inflação', peso: 15,  tese: 'hedge de inflação com juro real atraente.' },
  // Equity — 20%
  { bucket: 'Equity', classe: 'BR',       peso: 5,   tese: 'Ibovespa + seleção ativa.' },
  { bucket: 'Equity', classe: 'US',       peso: 10,  tese: 'diversificação internacional, dólar como hedge.' },
  { bucket: 'Equity', classe: 'FII',      peso: 5,   tese: 'yield real e exposição a tijolo/papel.' },
  // Alter. — 5%
  { bucket: 'Alter.', classe: 'Gold',     peso: 2.5, tese: 'reserva de valor em cenário de estresse.' },
  { bucket: 'Alter.', classe: 'Crypto',   peso: 2.5, tese: 'exposição assimétrica, tamanho calibrado.' },
];

const BUCKET_COLORS = {
  'Debt':   '#00d4e8',
  'Equity': '#3dd68c',
  'Alter.': '#c9a96e',
};

// cada linha herda a cor do bucket, com variação sutil para distinguir
const CLASS_COLORS = {
  'Pós':      '#00d4e8',
  'Pré':      '#4fc3d1',
  'Inflação': '#7aa8b4',
  'BR':       '#3dd68c',
  'US':       '#5fb37a',
  'FII':      '#8bc49a',
  'Gold':     '#e0b870',
  'Crypto':   '#a8895a',
};

function renderCarteira() {
  const tbody = document.getElementById('carteira-tbody');
  const buckets = ['Debt', 'Equity', 'Alter.'];
  let html = '';
  buckets.forEach(b => {
    const linhas = CARTEIRA.filter(l => l.bucket === b);
    const total = linhas.reduce((s, l) => s + l.peso, 0);
    html += `
      <tr style="background:rgba(0,0,0,0.18)">
        <td colspan="3" style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:${BUCKET_COLORS[b]};font-weight:700">
          <span class="dot" style="background:${BUCKET_COLORS[b]}"></span> ${b}
        </td>
        <td style="text-align:right;font-weight:700;color:${BUCKET_COLORS[b]}">${total}%</td>
      </tr>
    `;
    html += linhas.map(l => `
      <tr>
        <td style="padding-left:2rem;color:var(--muted)">↳</td>
        <td><strong>${l.classe}</strong></td>
        <td>${l.peso}%</td>
        <td style="color:var(--muted)">${l.tese}</td>
      </tr>
    `).join('');
  });
  tbody.innerHTML = html;
}

function renderDonut() {
  const svg = document.getElementById('donut');
  const cx = 100, cy = 100, r = 70, stroke = 22;
  const total = CARTEIRA.reduce((s, l) => s + l.peso, 0);
  const C = 2 * Math.PI * r;
  let offset = 0;
  const arcs = CARTEIRA.map(l => {
    const frac = l.peso / total;
    const len = C * frac;
    const el = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${CLASS_COLORS[l.classe]}" stroke-width="${stroke}"
      stroke-dasharray="${len} ${C - len}"
      stroke-dashoffset="${-offset}"
      transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += len;
    return el;
  }).join('');

  svg.innerHTML = `
    ${arcs}
    <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="var(--text)" font-size="11" font-family="var(--font-sans)" letter-spacing="0.08em" style="text-transform:uppercase">carteira</text>
    <text x="${cx}" y="${cy + 14}" text-anchor="middle" fill="var(--accent)" font-size="14" font-weight="700" font-family="var(--font-sans)">recomendada</text>
  `;

  const legend = document.getElementById('donut-legend');
  legend.innerHTML = CARTEIRA.map(l => `
    <div><span class="dot" style="background:${CLASS_COLORS[l.classe]}"></span>${l.classe} <span style="color:var(--muted);float:right">${l.peso}%</span></div>
  `).join('');
}

function initInvestimentos() {
  renderCarteira();
  renderDonut();
}
