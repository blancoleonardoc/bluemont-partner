/* ── Bluemont · orquestrador ────────────────────────── */

const STATE = {
  positivador: [],     // all rows, merged
  positivadorFiles: [],// {filename, dataPosicao, rows}
  diversificacao: [],
  diversificacaoFile: null,
  filters: { assessores: [], segmentos: [] },
  pos: { page: 1, perPage: 50, filter: '' },
  charts: {},          // ECharts instances (for resize/dispose)
};

const TOKENS = {
  bg:     '#050d1a',
  surf:   '#0a1628',
  border: '#142035',
  text:   '#e8e8e8',
  muted:  '#7a90a8',
  accent: '#00d4e8',
  up:     '#3dd68c',
  down:   '#f06b6b',
  warn:   '#f0a64b',
};

// paleta de classes (7 cores, temática)
const PAL = ['#00d4e8', '#3dd68c', '#f0a64b', '#a88bd4', '#d4a070', '#7a90a8', '#c9a96e'];

/* ── init ─────────────────────────────────────────── */

function initBluemont() {
  document.getElementById('file-positivador').addEventListener('change', onPositivadorUpload);
  document.getElementById('file-diversificacao').addEventListener('change', onDiversificacaoUpload);
  document.getElementById('btn-clear-filters').addEventListener('click', clearFilters);
  document.getElementById('f-assessor').addEventListener('change', onFilterChange);
  document.getElementById('f-segmento').addEventListener('change', onFilterChange);
  window.addEventListener('resize', debounce(resizeAllCharts, 150));
}

/* ── upload handlers ─────────────────────────────── */

async function onPositivadorUpload(e) {
  const files = [...e.target.files];
  for (const f of files) {
    try {
      const res = await parseCSVFile(f);
      if (res.type !== 'positivador') throw new Error('não é Positivador (schema inesperado)');
      if (res.rows.length === 0) { addChip(f.name, '(vazio, ignorado)', true); continue; }
      // dedupe por dataPosição — último vence
      STATE.positivadorFiles = STATE.positivadorFiles.filter(p => p.dataPosicao?.getTime() !== res.dataPosicao?.getTime());
      STATE.positivadorFiles.push(res);
      addChip(fmtDateBR(res.dataPosicao), `${res.rows.length} clientes`);
    } catch (err) {
      addChip(f.name, err.message, true);
    }
  }
  STATE.positivador = mergePositivadores(STATE.positivadorFiles);
  updateStatus();
  renderAll();
}

async function onDiversificacaoUpload(e) {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const res = await parseCSVFile(f);
    if (res.type !== 'diversificacao') throw new Error('não é Diversificação (schema inesperado)');
    STATE.diversificacao = res.rows;
    STATE.diversificacaoFile = res;
    addChip(`Diversificação ${fmtDateBR(res.dataPosicao)}`, `${res.rows.length.toLocaleString('pt-BR')} posições`);
  } catch (err) {
    addChip(f.name, err.message, true);
  }
  updateStatus();
  renderAll();
}

function addChip(label, sub, isError = false) {
  const wrap = document.getElementById('upload-chips');
  const chip = document.createElement('span');
  chip.className = 'chip' + (isError ? ' error' : '');
  chip.innerHTML = `<strong>${label}</strong>${sub ? ' · ' + sub : ''}`;
  wrap.appendChild(chip);
  if (isError) setTimeout(() => chip.remove(), 6000);
}

function updateStatus() {
  const s = document.getElementById('up-status');
  const nP = STATE.positivadorFiles.length;
  const nD = STATE.diversificacao.length;
  const parts = [];
  if (nP) parts.push(`${nP} positivador${nP > 1 ? 'es' : ''}`);
  if (nD) parts.push(`${nD.toLocaleString('pt-BR')} posições`);
  s.textContent = parts.length ? parts.join(' · ') : 'nenhum arquivo carregado';
}

/* ── filtros ───────────────────────────────────── */

function populateFilters() {
  const assessores = uniqueVals(STATE.positivador, 'Assessor');
  const segmentos  = uniqueVals(STATE.positivador, 'Segmento');
  const selA = document.getElementById('f-assessor');
  const selS = document.getElementById('f-segmento');
  selA.innerHTML = '<option value="">todos assessores</option>' + assessores.map(a => `<option>${a}</option>`).join('');
  selS.innerHTML = '<option value="">todos segmentos</option>' + segmentos.map(s => `<option>${s}</option>`).join('');
}

function onFilterChange() {
  const selA = document.getElementById('f-assessor').value;
  const selS = document.getElementById('f-segmento').value;
  STATE.filters.assessores = selA ? [selA] : [];
  STATE.filters.segmentos  = selS ? [selS] : [];
  renderAll();
}

function clearFilters() {
  document.getElementById('f-assessor').value = '';
  document.getElementById('f-segmento').value = '';
  STATE.filters = { assessores: [], segmentos: [] };
  renderAll();
}

/* ── render orchestration ──────────────────────── */

function renderAll() {
  const content = document.getElementById('content');
  const filterBar = document.getElementById('filter-bar');
  disposeCharts();

  if (STATE.positivador.length === 0) {
    filterBar.style.display = 'none';
    content.innerHTML = `<div class="empty-state">carregue pelo menos um Positivador para começar.<br><small>os dados ficam apenas em memória — nada é enviado ou persistido.</small></div>`;
    return;
  }

  filterBar.style.display = '';
  populateFilters();
  // preserva seleções
  document.getElementById('f-assessor').value = STATE.filters.assessores[0] || '';
  document.getElementById('f-segmento').value = STATE.filters.segmentos[0] || '';

  const ts = timeseries(STATE.positivador, STATE.filters);
  const totalRows = ts.reduce((s, snap) => s + snap.rows.length, 0);
  document.getElementById('filter-count').textContent = `${totalRows.toLocaleString('pt-BR')} linhas · ${ts.length} snapshot${ts.length > 1 ? 's' : ''}`;

  content.innerHTML = '';
  content.appendChild(document.getElementById('tpl-section-1').content.cloneNode(true));
  content.appendChild(document.getElementById('tpl-section-2').content.cloneNode(true));
  content.appendChild(document.getElementById('tpl-section-3').content.cloneNode(true));
  if (STATE.diversificacao.length > 0) {
    content.appendChild(document.getElementById('tpl-section-4').content.cloneNode(true));
  }

  renderSection1(ts);
  renderSection2(ts);
  renderSection3(ts);
  if (STATE.diversificacao.length > 0) renderSection4();
}

/* ── Seção 1 · Visão geral ─────────────────────── */

function renderSection1(ts) {
  const last = ts[ts.length - 1];
  const prev = ts.length > 1 ? ts[ts.length - 2] : null;

  const setKPI = (id, val, fmt) => document.getElementById(id).textContent = fmt(val);
  const setDelta = (id, cur, prev, isPct = false) => {
    const el = document.getElementById(id);
    if (!prev) { el.textContent = 'base'; el.style.color = 'var(--muted)'; return; }
    const delta = cur - prev;
    const pct = prev !== 0 ? (delta / Math.abs(prev)) * 100 : 0;
    const sign = delta >= 0 ? '+' : '';
    el.innerHTML = `<span class="badge ${delta >= 0 ? 'up' : 'down'}">${sign}${pct.toFixed(1).replace('.', ',')}%</span> vs mês anterior`;
  };

  setKPI('kpi-aum', last.aum, fmtBRLk);
  setKPI('kpi-clientes', last.clientes, v => v.toLocaleString('pt-BR'));
  setKPI('kpi-receita', last.receita, fmtBRLk);
  setKPI('kpi-capt', last.captLiq, fmtBRLk);
  setKPI('kpi-roa', last.roa * 100, v => v.toFixed(2).replace('.', ',') + '% a.a.');

  setDelta('kpi-aum-delta', last.aum, prev?.aum);
  setDelta('kpi-clientes-delta', last.clientes, prev?.clientes);
  setDelta('kpi-receita-delta', last.receita, prev?.receita);
  setDelta('kpi-capt-delta', last.captLiq, prev?.captLiq);

  // AUM evolution
  mkLine('chart-aum-evol', {
    xAxis: ts.map(s => fmtDateShort(s.date)),
    series: [{ name: 'AUM', data: ts.map(s => s.aum), color: TOKENS.accent }],
    yFormatter: v => fmtBRLk(v),
  });

  // Receita + Captação (eixos separados)
  mkLine('chart-rec-capt', {
    xAxis: ts.map(s => fmtDateShort(s.date)),
    series: [
      { name: 'Receita', data: ts.map(s => s.receita), color: TOKENS.up, yAxisIndex: 0 },
      { name: 'Captação Líq.', data: ts.map(s => s.captLiq), color: TOKENS.warn, yAxisIndex: 1 },
    ],
    dualAxis: true,
    yFormatter: v => fmtBRLk(v),
  });
}

/* ── Seção 2 · Mix ─────────────────────────────── */

function renderSection2(ts) {
  const mix = mixAtual(ts);
  mkDonut('chart-mix-atual', mix.map((m, i) => ({ name: m.label, value: m.value, color: PAL[i % PAL.length] })));

  const rec = receitaMix(ts);
  mkDonut('chart-rec-mix', rec.map((r, i) => ({ name: r.label, value: r.value, color: PAL[i % PAL.length] })));

  const temp = mixTemporal(ts);
  const classes = NET_CLASSES.map(c => c.label);
  mkStackedBar('chart-mix-temporal', {
    xAxis: temp.map(t => fmtDateShort(t.date)),
    series: classes.map((c, i) => ({
      name: c,
      data: temp.map(t => t[c] || 0),
      color: PAL[i % PAL.length],
    })),
    yFormatter: v => fmtBRLk(v),
  });
}

/* ── Seção 3 · Clientes ────────────────────────── */

function renderSection3(ts) {
  const c = concentracao(ts);
  document.getElementById('conc-sub').textContent = `${c.n.toLocaleString('pt-BR')} clientes · HHI = ${c.hhi.toFixed(0)}`;
  document.getElementById('lorenz-sub').textContent = `HHI = ${c.hhi.toFixed(0)} · ${c.top.slice(0,10).reduce((s,t)=>s+t.pct,0).toFixed(1).replace('.',',')}% no top 10`;

  document.getElementById('conc-table').innerHTML = `
    <table class="dense">
      <thead><tr><th>#</th><th>cod</th><th>segmento</th><th class="num">net</th><th class="num">% AUM</th></tr></thead>
      <tbody>${c.top.map(t => `
        <tr><td>${t.pos}</td><td>${t.cod}</td><td style="color:var(--muted)">${t.segmento || '—'}</td><td class="num">${fmtBRLk(t.net)}</td><td class="num">${t.pct.toFixed(2).replace('.', ',')}%</td></tr>
      `).join('')}</tbody>
    </table>
  `;

  mkLorenz('chart-lorenz', c.lorenz);

  const seg = porSegmento(ts);
  mkGroupedBar('chart-segmento', {
    xAxis: seg.map(s => s.segmento),
    series: [
      { name: 'Clientes', data: seg.map(s => s.clientes), color: TOKENS.muted, yAxisIndex: 0 },
      { name: 'AUM',      data: seg.map(s => s.aum),      color: TOKENS.accent, yAxisIndex: 1 },
    ],
    dualAxis: true,
    yFormatters: [v => v.toLocaleString('pt-BR'), v => fmtBRLk(v)],
  });

  const idade = distribuicaoEtaria(ts);
  mkGroupedBar('chart-idade', {
    xAxis: idade.map(b => b.label),
    series: [
      { name: 'Clientes', data: idade.map(b => b.clientes), color: TOKENS.muted, yAxisIndex: 0 },
      { name: 'AUM',      data: idade.map(b => b.aum),      color: TOKENS.accent, yAxisIndex: 1 },
    ],
    dualAxis: true,
    yFormatters: [v => v.toLocaleString('pt-BR'), v => fmtBRLk(v)],
  });

  const prof = topProfissoes(ts);
  document.getElementById('prof-table').innerHTML = `
    <table class="dense">
      <thead><tr><th>#</th><th>profissão</th><th class="num">clientes</th></tr></thead>
      <tbody>${prof.map((p, i) => `
        <tr><td>${i + 1}</td><td>${p.profissao}</td><td class="num">${p.clientes}</td></tr>
      `).join('')}</tbody>
    </table>
  `;

  const ch = churn(ts);
  document.getElementById('churn-box').innerHTML = `
    <table class="dense">
      <tbody>
        <tr><td style="color:var(--muted)">clientes evadidos</td><td class="num"><strong>${ch.evadidos}</strong></td></tr>
        <tr><td style="color:var(--muted)">AUM perdido</td><td class="num" style="color:var(--down)"><strong>${fmtBRLk(ch.aumPerdido)}</strong></td></tr>
        <tr><td style="color:var(--muted)">net médio · evadido</td><td class="num">${fmtBRLk(ch.netMedioEvadido)}</td></tr>
        <tr><td style="color:var(--muted)">net médio · retido</td><td class="num">${fmtBRLk(ch.netMedioRetido)}</td></tr>
      </tbody>
    </table>
  `;

  const cs = crossSell(ts);
  mkBar('chart-crosssell', {
    xAxis: cs.dist.map(d => `${d.produtos} produto${d.produtos === 1 ? '' : 's'}`),
    series: [{ name: 'clientes', data: cs.dist.map(d => d.clientes), color: TOKENS.accent }],
  });

  document.getElementById('mono-table').innerHTML = cs.monoprodutoAlto.length === 0 ? `
    <p style="color:var(--muted);padding:1rem 0;font-size:0.78rem">nenhum cliente monoproduto com AUM &gt; R$ 500k.</p>
  ` : `
    <table class="dense">
      <thead><tr><th>cod</th><th>segmento</th><th>produto</th><th class="num">net</th></tr></thead>
      <tbody>${cs.monoprodutoAlto.map(m => `
        <tr><td>${m.cod}</td><td style="color:var(--muted)">${m.segmento || '—'}</td><td>${m.produto}</td><td class="num">${fmtBRLk(m.net)}</td></tr>
      `).join('')}</tbody>
    </table>
  `;
}

/* ── Seção 4 · Diversificação ──────────────────── */

function renderSection4() {
  // aplica os mesmos filtros de assessor aos dados de Diversificação (quando possível)
  const div = STATE.diversificacao.filter(r => {
    if (STATE.filters.assessores.length && !STATE.filters.assessores.includes(r.Assessor)) return false;
    return true;
  });

  const emis = topEmissores(div);
  document.getElementById('emissores-table').innerHTML = `
    <table class="dense">
      <thead><tr><th>#</th><th>emissor</th><th class="num">AUM</th></tr></thead>
      <tbody>${emis.map((e, i) => `
        <tr><td>${i + 1}</td><td>${e.emissor}</td><td class="num">${fmtBRLk(e.aum)}</td></tr>
      `).join('')}</tbody>
    </table>
  `;

  const fundos = topFundos(div);
  document.getElementById('fundos-table').innerHTML = `
    <table class="dense">
      <thead><tr><th>#</th><th>CNPJ</th><th>ativo</th><th class="num">AUM</th></tr></thead>
      <tbody>${fundos.map((f, i) => `
        <tr><td>${i + 1}</td><td style="font-size:0.72rem">${f.cnpj}</td><td style="font-size:0.75rem">${f.ativo || '—'}</td><td class="num">${fmtBRLk(f.aum)}</td></tr>
      `).join('')}</tbody>
    </table>
  `;

  const fator = porFatorRisco(div);
  mkDonut('chart-fator', fator.map((f, i) => ({ name: f.label, value: f.value, color: PAL[i % PAL.length] })));

  const esc = escadaVencimentos(div);
  mkBar('chart-escada', {
    xAxis: esc.map(b => b.label),
    series: [{ name: 'AUM', data: esc.map(b => b.aum), color: TOKENS.accent }],
    yFormatter: v => fmtBRLk(v),
  });

  // tabela de posições
  STATE.pos.data = div;
  STATE.pos.filtered = div;
  STATE.pos.page = 1;
  document.getElementById('pos-sub').textContent = `${div.length.toLocaleString('pt-BR')} posições no snapshot ${fmtDateBR(STATE.diversificacaoFile?.dataPosicao)}`;
  document.getElementById('pos-search').value = '';
  document.getElementById('pos-search').addEventListener('input', onPosSearch);
  document.getElementById('pos-prev').addEventListener('click', () => { if (STATE.pos.page > 1) { STATE.pos.page--; renderPosPage(); } });
  document.getElementById('pos-next').addEventListener('click', () => {
    const maxP = Math.ceil(STATE.pos.filtered.length / STATE.pos.perPage);
    if (STATE.pos.page < maxP) { STATE.pos.page++; renderPosPage(); }
  });
  renderPosPage();
}

function onPosSearch(e) {
  const q = e.target.value.toLowerCase().trim();
  STATE.pos.filter = q;
  STATE.pos.filtered = !q ? STATE.pos.data : STATE.pos.data.filter(r => {
    return (r.Cód_do_Cliente && String(r.Cód_do_Cliente).toLowerCase().includes(q))
      || (r.Emissor && r.Emissor.toLowerCase().includes(q))
      || (r.Ativo && r.Ativo.toLowerCase().includes(q))
      || (r.Produto && r.Produto.toLowerCase().includes(q))
      || (r.Sub_Produto && r.Sub_Produto.toLowerCase().includes(q));
  });
  STATE.pos.page = 1;
  renderPosPage();
}

function renderPosPage() {
  const { filtered, page, perPage } = STATE.pos;
  const start = (page - 1) * perPage;
  const pageRows = filtered.slice(start, start + perPage);
  const maxP = Math.max(1, Math.ceil(filtered.length / perPage));

  document.getElementById('pos-tbody').innerHTML = pageRows.map(r => `
    <tr>
      <td>${r.Cód_do_Cliente || '—'}</td>
      <td><strong>${r.Produto || '—'}</strong><br><span style="color:var(--muted);font-size:0.7rem">${r.Sub_Produto || ''}</span></td>
      <td>${r.Ativo || '—'}</td>
      <td>${r.Emissor || '—'}</td>
      <td style="color:var(--muted);font-size:0.72rem">${fmtDateBR(r.Data_de_Vencimento)}</td>
      <td class="num">${(r.Quantidade || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
      <td class="num"><strong>${fmtBRLk(r.Net_Em_M)}</strong></td>
    </tr>
  `).join('');

  document.getElementById('pos-pageinfo').textContent = `página ${page} de ${maxP} · ${filtered.length.toLocaleString('pt-BR')} linhas`;
  document.getElementById('pos-prev').disabled = page <= 1;
  document.getElementById('pos-next').disabled = page >= maxP;
}

/* ── ECharts helpers (theme consistente) ─────────── */

const baseTheme = {
  textStyle: { fontFamily: "'Rockwell', 'Rockwell Nova', 'Rockwell MT', serif", color: TOKENS.muted },
  grid: { left: 48, right: 16, top: 30, bottom: 28, containLabel: true },
  tooltip: {
    backgroundColor: TOKENS.surf,
    borderColor: TOKENS.border,
    borderWidth: 1,
    textStyle: { color: TOKENS.text, fontSize: 11 },
    extraCssText: 'box-shadow:none;border-radius:4px;',
  },
  axisLine: { lineStyle: { color: TOKENS.border } },
  splitLine: { lineStyle: { color: TOKENS.border, type: 'dashed' } },
};

function makeChart(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  if (STATE.charts[id]) STATE.charts[id].dispose();
  const chart = echarts.init(el, null, { renderer: 'svg' });
  STATE.charts[id] = chart;
  return chart;
}

function disposeCharts() {
  Object.values(STATE.charts).forEach(c => c.dispose());
  STATE.charts = {};
}

function resizeAllCharts() {
  Object.values(STATE.charts).forEach(c => c.resize());
}

function mkLine(id, { xAxis, series, dualAxis, yFormatter }) {
  const chart = makeChart(id);
  if (!chart) return;
  const opt = {
    ...baseTheme,
    tooltip: { ...baseTheme.tooltip, trigger: 'axis', valueFormatter: yFormatter },
    legend: { textStyle: { color: TOKENS.muted, fontSize: 10 }, top: 0, right: 0 },
    xAxis: { type: 'category', data: xAxis, axisLine: baseTheme.axisLine, axisLabel: { color: TOKENS.muted, fontSize: 10 }, boundaryGap: false },
    yAxis: dualAxis ? [
      { type: 'value', position: 'left',  axisLabel: { color: TOKENS.muted, fontSize: 10, formatter: yFormatter }, splitLine: baseTheme.splitLine },
      { type: 'value', position: 'right', axisLabel: { color: TOKENS.muted, fontSize: 10, formatter: yFormatter }, splitLine: { show: false } },
    ] : { type: 'value', axisLabel: { color: TOKENS.muted, fontSize: 10, formatter: yFormatter }, splitLine: baseTheme.splitLine },
    series: series.map(s => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      yAxisIndex: s.yAxisIndex || 0,
      lineStyle: { color: s.color, width: 2 },
      itemStyle: { color: s.color },
      areaStyle: series.length === 1 ? { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: s.color + '40' }, { offset: 1, color: s.color + '00' },
      ]) } : null,
    })),
  };
  chart.setOption(opt);
}

function mkDonut(id, data) {
  const chart = makeChart(id);
  if (!chart) return;
  const total = data.reduce((s, d) => s + d.value, 0);
  chart.setOption({
    ...baseTheme,
    tooltip: { ...baseTheme.tooltip, trigger: 'item', formatter: p => `${p.name}<br><b>${fmtBRLk(p.value)}</b> (${p.percent}%)` },
    legend: { orient: 'vertical', right: 10, top: 'middle', textStyle: { color: TOKENS.muted, fontSize: 10 }, itemWidth: 10, itemHeight: 10 },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: true,
      label: { show: false },
      labelLine: { show: false },
      data: data.map(d => ({ ...d, itemStyle: { color: d.color, borderColor: TOKENS.surf, borderWidth: 2 } })),
    }],
  });
}

function mkStackedBar(id, { xAxis, series, yFormatter }) {
  const chart = makeChart(id);
  if (!chart) return;
  chart.setOption({
    ...baseTheme,
    tooltip: { ...baseTheme.tooltip, trigger: 'axis', valueFormatter: yFormatter, axisPointer: { type: 'shadow' } },
    legend: { textStyle: { color: TOKENS.muted, fontSize: 10 }, top: 0, type: 'scroll' },
    xAxis: { type: 'category', data: xAxis, axisLine: baseTheme.axisLine, axisLabel: { color: TOKENS.muted, fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { color: TOKENS.muted, fontSize: 10, formatter: yFormatter }, splitLine: baseTheme.splitLine },
    series: series.map(s => ({ name: s.name, type: 'bar', stack: 'total', data: s.data, itemStyle: { color: s.color } })),
  });
}

function mkBar(id, { xAxis, series, yFormatter }) {
  const chart = makeChart(id);
  if (!chart) return;
  chart.setOption({
    ...baseTheme,
    tooltip: { ...baseTheme.tooltip, trigger: 'axis', valueFormatter: yFormatter, axisPointer: { type: 'shadow' } },
    xAxis: { type: 'category', data: xAxis, axisLine: baseTheme.axisLine, axisLabel: { color: TOKENS.muted, fontSize: 10, rotate: xAxis.length > 6 ? 25 : 0 } },
    yAxis: { type: 'value', axisLabel: { color: TOKENS.muted, fontSize: 10, formatter: yFormatter }, splitLine: baseTheme.splitLine },
    series: series.map(s => ({ name: s.name, type: 'bar', data: s.data, itemStyle: { color: s.color, borderRadius: [3, 3, 0, 0] } })),
  });
}

function mkGroupedBar(id, { xAxis, series, dualAxis, yFormatters }) {
  const chart = makeChart(id);
  if (!chart) return;
  chart.setOption({
    ...baseTheme,
    tooltip: { ...baseTheme.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { textStyle: { color: TOKENS.muted, fontSize: 10 }, top: 0, right: 0 },
    xAxis: { type: 'category', data: xAxis, axisLine: baseTheme.axisLine, axisLabel: { color: TOKENS.muted, fontSize: 10, rotate: xAxis.length > 5 ? 25 : 0 } },
    yAxis: dualAxis ? [
      { type: 'value', position: 'left',  axisLabel: { color: TOKENS.muted, fontSize: 10, formatter: yFormatters?.[0] }, splitLine: baseTheme.splitLine },
      { type: 'value', position: 'right', axisLabel: { color: TOKENS.muted, fontSize: 10, formatter: yFormatters?.[1] }, splitLine: { show: false } },
    ] : { type: 'value', axisLabel: { color: TOKENS.muted, fontSize: 10 }, splitLine: baseTheme.splitLine },
    series: series.map(s => ({
      name: s.name,
      type: 'bar',
      data: s.data,
      yAxisIndex: s.yAxisIndex || 0,
      itemStyle: { color: s.color, borderRadius: [3, 3, 0, 0] },
    })),
  });
}

function mkLorenz(id, points) {
  const chart = makeChart(id);
  if (!chart) return;
  chart.setOption({
    ...baseTheme,
    tooltip: { ...baseTheme.tooltip, trigger: 'axis', formatter: ps => {
      const p = ps[0];
      return `${(p.value[0] * 100).toFixed(1)}% clientes<br><b>${(p.value[1] * 100).toFixed(1)}% AUM</b>`;
    }},
    xAxis: { type: 'value', min: 0, max: 1, axisLabel: { color: TOKENS.muted, fontSize: 10, formatter: v => (v * 100).toFixed(0) + '%' }, splitLine: baseTheme.splitLine, name: 'clientes', nameLocation: 'middle', nameGap: 22, nameTextStyle: { color: TOKENS.muted, fontSize: 10 } },
    yAxis: { type: 'value', min: 0, max: 1, axisLabel: { color: TOKENS.muted, fontSize: 10, formatter: v => (v * 100).toFixed(0) + '%' }, splitLine: baseTheme.splitLine, name: 'AUM', nameTextStyle: { color: TOKENS.muted, fontSize: 10 } },
    series: [
      { type: 'line', data: [[0, 0], [1, 1]], showSymbol: false, lineStyle: { color: TOKENS.muted, type: 'dashed', width: 1 }, tooltip: { show: false } },
      { type: 'line', data: points, showSymbol: false, smooth: false, lineStyle: { color: TOKENS.accent, width: 2 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: TOKENS.accent + '30' }, { offset: 1, color: TOKENS.accent + '00' },
        ]) },
      },
    ],
  });
}

/* ── util ─────────────────────────────────────── */

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
