/* ── Bluemont · agregações puras ────────────────────── */

const NET_CLASSES = [
  { key: 'Net_Renda_Fixa',          label: 'Renda Fixa' },
  { key: 'Net_Fundos_Imobiliários', label: 'FIIs' },
  { key: 'Net_Renda_Variável',      label: 'Renda Variável' },
  { key: 'Net_Fundos',              label: 'Fundos' },
  { key: 'Net_Financeiro',          label: 'Financeiro' },
  { key: 'Net_Previdência',         label: 'Previdência' },
  { key: 'Net_Outros',              label: 'Outros' },
];

const RECEITA_FONTES = [
  { key: 'Receita_Bovespa',                    label: 'Bovespa' },
  { key: 'Receita_Futuros',                    label: 'Futuros' },
  { key: 'Receita_RF_Bancários',               label: 'RF Bancários' },
  { key: 'Receita_RF_Privados',                label: 'RF Privados' },
  { key: 'Receita_RF_Públicos',                label: 'RF Públicos' },
  { key: 'Receita_Aluguel',                    label: 'Aluguel' },
  { key: 'Receita_Complemento_Pacote_Corretagem', label: 'Pacote' },
];

function sum(arr, fn = x => x) {
  let s = 0;
  for (const x of arr) s += fn(x) || 0;
  return s;
}

function byDate(rows) {
  const m = new Map();
  for (const r of rows) {
    const t = r.Data_Posição?.getTime();
    if (!t) continue;
    if (!m.has(t)) m.set(t, []);
    m.get(t).push(r);
  }
  return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([t, rows]) => ({ date: new Date(t), rows }));
}

// filtra rows segundo filtros globais
function applyFilters(rows, f) {
  return rows.filter(r => {
    if (f.assessores && f.assessores.length && !f.assessores.includes(r.Assessor)) return false;
    if (f.segmentos  && f.segmentos.length  && !f.segmentos.includes(r.Segmento))  return false;
    return true;
  });
}

// timeseries: [{date, aum, receita, captLiq, clientes, roa}]
function timeseries(positivador, f) {
  const filtered = applyFilters(positivador, f);
  return byDate(filtered).map(({ date, rows }) => {
    const aum = sum(rows, r => r.Net_Em_M1);
    const receita = sum(rows, r => r.Receita_no_Mês);
    const captLiq = sum(rows, r => r.Captação_Líquida_em_M1);
    const clientes = rows.length;
    const roa = aum > 0 ? (receita / aum) * 12 : 0;
    return { date, aum, receita, captLiq, clientes, roa, rows };
  });
}

// mix de AUM por classe no snapshot mais recente
function mixAtual(ts) {
  if (ts.length === 0) return [];
  const last = ts[ts.length - 1];
  return NET_CLASSES.map(c => ({
    label: c.label,
    key: c.key,
    value: sum(last.rows, r => r[c.key]),
  })).filter(x => x.value > 0);
}

// stacked mix por snapshot: [{date, [classLabel]: value}]
function mixTemporal(ts) {
  return ts.map(snap => {
    const item = { date: snap.date };
    for (const c of NET_CLASSES) item[c.label] = sum(snap.rows, r => r[c.key]);
    return item;
  });
}

// mix de receita por fonte (snapshot mais recente)
function receitaMix(ts) {
  if (ts.length === 0) return [];
  const last = ts[ts.length - 1];
  return RECEITA_FONTES.map(f => ({
    label: f.label,
    value: sum(last.rows, r => r[f.key]),
  })).filter(x => x.value > 0);
}

// concentração: top N + lorenz
function concentracao(ts, topN = 10) {
  if (ts.length === 0) return { top: [], lorenz: [], hhi: 0, aum: 0 };
  const last = ts[ts.length - 1];
  const sorted = [...last.rows].sort((a, b) => b.Net_Em_M1 - a.Net_Em_M1);
  const aum = sum(sorted, r => r.Net_Em_M1);
  const top = sorted.slice(0, topN).map((r, i) => ({
    pos: i + 1,
    cod: r.Cód_do_Cliente,
    net: r.Net_Em_M1,
    pct: aum > 0 ? (r.Net_Em_M1 / aum) * 100 : 0,
    segmento: r.Segmento,
  }));
  // lorenz: cumulative share vs cumulative pop (ordenado asc)
  const asc = [...sorted].reverse();
  const lorenz = [[0, 0]];
  let cum = 0;
  asc.forEach((r, i) => {
    cum += r.Net_Em_M1;
    lorenz.push([(i + 1) / asc.length, aum > 0 ? cum / aum : 0]);
  });
  // HHI (usando share^2 * 10000)
  const hhi = aum > 0 ? sum(sorted, r => Math.pow(r.Net_Em_M1 / aum, 2)) * 10000 : 0;
  return { top, lorenz, hhi, aum, n: sorted.length };
}

// por segmento: [{segmento, clientes, aum}]
function porSegmento(ts) {
  if (ts.length === 0) return [];
  const last = ts[ts.length - 1];
  const m = new Map();
  for (const r of last.rows) {
    const k = r.Segmento || '—';
    if (!m.has(k)) m.set(k, { segmento: k, clientes: 0, aum: 0 });
    const e = m.get(k);
    e.clientes += 1;
    e.aum += r.Net_Em_M1;
  }
  return [...m.values()].sort((a, b) => b.aum - a.aum);
}

// histograma etário
function distribuicaoEtaria(ts) {
  if (ts.length === 0) return [];
  const last = ts[ts.length - 1];
  const buckets = [
    { label: '<25',  min: 0,  max: 25 },
    { label: '25-34', min: 25, max: 35 },
    { label: '35-44', min: 35, max: 45 },
    { label: '45-54', min: 45, max: 55 },
    { label: '55-64', min: 55, max: 65 },
    { label: '65+',   min: 65, max: 200 },
  ].map(b => ({ ...b, clientes: 0, aum: 0 }));
  const hoje = last.date || new Date();
  for (const r of last.rows) {
    if (!r.Data_de_Nascimento) continue;
    const idade = (hoje - r.Data_de_Nascimento) / (365.25 * 24 * 3600 * 1000);
    const b = buckets.find(b => idade >= b.min && idade < b.max);
    if (b) { b.clientes += 1; b.aum += r.Net_Em_M1; }
  }
  return buckets;
}

// top profissões por contagem
function topProfissoes(ts, n = 10) {
  if (ts.length === 0) return [];
  const last = ts[ts.length - 1];
  const m = new Map();
  for (const r of last.rows) {
    const k = (r.Profissão || '—').trim() || '—';
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([profissao, clientes]) => ({ profissao, clientes }));
}

// churn no mês mais recente
function churn(ts) {
  if (ts.length === 0) return { evadidos: 0, aumPerdido: 0, netMedio: 0, perfil: {} };
  const last = ts[ts.length - 1];
  const evad = last.rows.filter(r => r.evadiu_flag);
  const aumPerdido = sum(evad, r => r.Net_em_M_1); // usava o net do mês anterior
  const retidos = last.rows.filter(r => !r.evadiu_flag);
  return {
    evadidos: evad.length,
    aumPerdido,
    netMedioEvadido: evad.length > 0 ? aumPerdido / evad.length : 0,
    netMedioRetido: retidos.length > 0 ? sum(retidos, r => r.Net_Em_M1) / retidos.length : 0,
  };
}

// cross-sell: contagem de produtos por cliente
function crossSell(ts) {
  if (ts.length === 0) return { dist: [], monoprodutoAlto: [] };
  const last = ts[ts.length - 1];
  const counts = [0, 0, 0, 0]; // 0, 1, 2, 3 produtos
  const mono = [];
  for (const r of last.rows) {
    const n = (r.operou_bolsa ? 1 : 0) + (r.operou_fundo ? 1 : 0) + (r.operou_rf ? 1 : 0);
    counts[n]++;
    if (n === 1 && r.Net_Em_M1 > 500_000) {
      mono.push({
        cod: r.Cód_do_Cliente,
        net: r.Net_Em_M1,
        segmento: r.Segmento,
        produto: r.operou_bolsa ? 'bolsa' : r.operou_fundo ? 'fundo' : 'rf',
      });
    }
  }
  return {
    dist: counts.map((c, i) => ({ produtos: i, clientes: c })),
    monoprodutoAlto: mono.sort((a, b) => b.net - a.net).slice(0, 15),
  };
}

/* ── agregações da Diversificação ──────────────────── */

function topEmissores(div, n = 20) {
  const m = new Map();
  for (const r of div) {
    const k = (r.Emissor || '—').trim() || '—';
    m.set(k, (m.get(k) || 0) + r.Net_Em_M);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([emissor, aum]) => ({ emissor, aum }));
}

function topFundos(div, n = 20) {
  const m = new Map();
  for (const r of div) {
    if (!r.CNPJ_Fundo || !String(r.CNPJ_Fundo).trim()) continue;
    const k = r.CNPJ_Fundo;
    if (!m.has(k)) m.set(k, { cnpj: k, ativo: r.Ativo, aum: 0 });
    m.get(k).aum += r.Net_Em_M;
  }
  return [...m.values()].sort((a, b) => b.aum - a.aum).slice(0, n);
}

function porFatorRisco(div) {
  const m = new Map();
  for (const r of div) {
    const k = (r.NOM_FATOR_RISCO || '—').trim() || '—';
    m.set(k, (m.get(k) || 0) + r.Net_Em_M);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
}

function escadaVencimentos(div) {
  const now = new Date();
  const buckets = [
    { label: '<1 ano',   maxYears: 1 },
    { label: '1–3 anos', maxYears: 3 },
    { label: '3–5 anos', maxYears: 5 },
    { label: '5+ anos',  maxYears: 100 },
    { label: 'perpétuo', maxYears: Infinity },
  ].map(b => ({ ...b, aum: 0, linhas: 0 }));

  for (const r of div) {
    if (!r.Data_de_Vencimento) {
      buckets[4].aum += r.Net_Em_M;
      buckets[4].linhas += 1;
      continue;
    }
    const years = (r.Data_de_Vencimento - now) / (365.25 * 24 * 3600 * 1000);
    let b;
    if (years < 1)      b = buckets[0];
    else if (years < 3) b = buckets[1];
    else if (years < 5) b = buckets[2];
    else                b = buckets[3];
    b.aum += r.Net_Em_M;
    b.linhas += 1;
  }
  return buckets;
}

// unique values helper (for filter dropdowns)
function uniqueVals(rows, key) {
  const s = new Set();
  for (const r of rows) if (r[key]) s.add(r[key]);
  return [...s].sort();
}
