async function initConfig() {
  const status = document.getElementById('save-status');
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('http ' + res.status);
    const { settings = {}, session = {} } = await res.json();
    document.getElementById('f-first').value = settings.first_name ?? (session.name?.split(' ')[0] || '');
    document.getElementById('f-last').value  = settings.last_name  ?? (session.name?.split(' ').slice(1).join(' ') || '');
    document.getElementById('f-email').value = session.email || '';
    document.getElementById('f-pix').value = settings.pix_key || '';
    document.getElementById('f-pix-type').value = settings.pix_key_type || '';
    document.getElementById('f-notif').checked = settings.notifications_enabled !== false;
    const img = document.getElementById('f-photo');
    if (session.image) { img.src = session.image; } else { img.style.display = 'none'; }
  } catch (e) {
    status.textContent = 'erro ao carregar: ' + e.message;
  }

  document.getElementById('btn-save').addEventListener('click', async () => {
    status.textContent = 'salvando…';
    const body = {
      first_name: document.getElementById('f-first').value.trim(),
      last_name:  document.getElementById('f-last').value.trim(),
      pix_key:    document.getElementById('f-pix').value.trim(),
      pix_key_type: document.getElementById('f-pix-type').value,
      notifications_enabled: document.getElementById('f-notif').checked,
    };
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('http ' + res.status);
      status.textContent = 'salvo ✓';
      setTimeout(() => status.textContent = '', 3000);
    } catch (e) {
      status.textContent = 'erro: ' + e.message;
    }
  });
}
