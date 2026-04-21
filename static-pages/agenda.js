async function initAgenda() {
  const today = document.getElementById('agenda-today');
  const week = document.getElementById('agenda-week');
  const fu = document.getElementById('agenda-followups');

  try {
    const res = await fetch('/api/calendar/events');
    if (!res.ok) throw new Error('http ' + res.status);
    const { events = [] } = await res.json();
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const todays = events.filter(e => new Date(e.start) <= endOfToday);
    const later = events.filter(e => new Date(e.start) > endOfToday);
    today.innerHTML = todays.length === 0
      ? '<li class="insight-empty">nenhum evento hoje.</li>'
      : todays.map(renderEvent).join('');
    week.innerHTML = later.length === 0
      ? '<li class="insight-empty">nada nos próximos 7 dias.</li>'
      : later.map(renderEvent).join('');
  } catch (e) {
    today.innerHTML = `<li class="insight-empty">não foi possível carregar o calendar (${e.message}). verifique se você aceitou o scope de calendar ao fazer login.</li>`;
    week.innerHTML = '';
  }

  // Follow-ups: vêm dos insights do CRM
  const ins = (typeof buildInsights === 'function') ? buildInsights() : [];
  fu.innerHTML = ins.length === 0
    ? '<li class="insight-empty">nenhum follow-up sugerido.</li>'
    : ins.map(i => {
        const title = encodeURIComponent('follow-up — ' + i.text);
        const url = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${title}`;
        return `<li class="agenda-item"><div class="agenda-time">—</div><div class="agenda-body"><div>${i.text}</div><div class="insight-sub">${i.sub||''}</div></div><a class="agenda-action" target="_blank" href="${url}">+ calendar</a></li>`;
      }).join('');
}

function renderEvent(e) {
  const start = new Date(e.start);
  const hh = start.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dd = start.toLocaleString('pt-BR', { day: '2-digit', month: 'short' });
  return `<li class="agenda-item">
    <div class="agenda-time"><strong>${hh}</strong><div class="insight-sub">${dd}</div></div>
    <div class="agenda-body">
      <div>${e.title || '(sem título)'}</div>
      <div class="insight-sub">${e.location || ''}</div>
    </div>
    ${e.htmlLink ? `<a class="agenda-action" target="_blank" href="${e.htmlLink}">abrir</a>` : ''}
  </li>`;
}
