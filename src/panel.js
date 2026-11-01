(function () {
  const XFH = window.XFH;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  XFH.initPanel = function () {
    if (document.getElementById('xfh-host')) return;
    let mode = XFH.getPageMode(location.pathname);
    const host = document.createElement('div'); host.id = 'xfh-host'; document.documentElement.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>
      :host{all:initial;font:14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#17202a}*{box-sizing:border-box} .panel{width:360px;max-height:80vh;background:white;border:1px solid #d8dee5;border-radius:14px;box-shadow:0 8px 32px #18243330;overflow:hidden}.head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#f7f9fa;font-weight:700}.tools{display:flex;gap:6px;align-items:center}.body{padding:12px;overflow:auto;max-height:calc(80vh - 48px)}button{border:1px solid #cbd3da;background:#fff;border-radius:8px;padding:7px 9px;cursor:pointer;color:#17202a}button.primary{background:#1d9bf0;color:white;border-color:#1d9bf0}button.danger{background:#f4212e;color:white;border-color:#f4212e}button:disabled{opacity:.5;cursor:default}.row{padding:9px 0;border-bottom:1px solid #edf0f2;display:flex;gap:8px;align-items:center}.row label{flex:1;min-width:0}.row a{color:#17202a;text-decoration:none;font-weight:600}.sub{color:#667782;font-size:12px}.status{font-size:12px}.controls,.actions{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.meta{display:flex;justify-content:space-between;align-items:center;gap:8px}.whitelist{font-size:12px;max-height:100px;overflow:auto}.hidden{display:none}.compact{width:auto}.compact .body{display:none}input[type=number]{width:58px;padding:6px;border:1px solid #cbd3da;border-radius:7px}</style>
      <div class="panel"><div class="head"><span>${esc(XFH.t('title'))}</span><div class="tools"><button data-act="lang">中/EN</button><button data-act="collapse" title="${esc(XFH.t('close'))}">−</button></div></div><div class="body">
      <div class="meta"><strong data-mode></strong><span class="sub" data-scan-status></span></div>
      <div class="controls"><button class="primary" data-act="scan">${esc(XFH.t('scan'))}</button><button data-act="stop-scan">${esc(XFH.t('stopScan'))}</button></div>
      <div class="controls"><button data-act="all">${esc(XFH.t('selectAll'))}</button><button data-act="none">${esc(XFH.t('selectNone'))}</button><button data-act="export">${esc(XFH.t('export'))}</button><label class="sub">${esc(XFH.t('cap'))} <input data-cap type="number" min="1" max="50" value="15"></label></div>
      <div class="actions"><button class="danger" data-act="run"></button><button class="hidden" data-act="pause"></button><button class="hidden" data-act="stop"></button><span data-progress class="sub"></span></div>
      <div data-list class="sub"></div><hr><strong>${esc(XFH.t('whitelistTitle'))}</strong><div data-whitelist class="whitelist"></div></div></div>`;
    const q = selector => shadow.querySelector(selector); let users = [], whitelist = [], scanStop = false, paused = false, stopped = false, running = false, collapsed = false;
    const saveWL = async () => { await chrome.storage.local.set({ xfhWhitelist: whitelist }); renderWL(); };
    const renderWL = () => { q('[data-whitelist]').innerHTML = whitelist.length ? whitelist.map(h => `<div class="row"><span>@${esc(h)}</span><button data-remove="${esc(h)}">${esc(XFH.t('remove'))}</button></div>`).join('') : '<span class="sub">—</span>'; };
    const renderUsers = () => {
      q('[data-list]').innerHTML = users.length ? users.map(u => `<div class="row" data-handle="${esc(u.handle)}"><input type="checkbox" checked><label><a target="_blank" rel="noreferrer" href="https://x.com/${encodeURIComponent(u.handle)}">${esc(u.name)}</a><div class="sub">@${esc(u.handle)}</div></label><button data-wl="${esc(u.handle)}">${esc(XFH.t('whitelist'))}</button><span class="status"></span></div>`).join('') : `<div class="sub">${esc(XFH.t('noResults'))}</div>`;
    };
    const updateText = () => { q('[data-mode]').textContent = XFH.t(mode); q('[data-act=run]').textContent = XFH.t(mode === 'following' ? 'unfollow' : 'follow'); };
    chrome.storage.local.get({ xfhWhitelist: [] }, data => { whitelist = data.xfhWhitelist || []; renderWL(); }); updateText();
    shadow.addEventListener('click', async event => {
      const button = event.target.closest('button'); if (!button) return;
      const action = button.dataset.act;
      if (button.dataset.wl) { whitelist = [...new Set([...whitelist, button.dataset.wl.replace(/^@/, '')])]; users = users.filter(u => u.handle.toLowerCase() !== button.dataset.wl.toLowerCase()); await saveWL(); renderUsers(); }
      if (button.dataset.remove) { whitelist = whitelist.filter(h => h.toLowerCase() !== button.dataset.remove.toLowerCase()); await saveWL(); }
      if (action === 'lang') { await XFH.setLang(XFH.lang === 'zh' ? 'en' : 'zh'); location.reload(); }
      if (action === 'collapse') { collapsed = !collapsed; q('.panel').classList.toggle('compact', collapsed); button.textContent = collapsed ? '+' : '−'; }
      if (action === 'all' || action === 'none') shadow.querySelectorAll('[data-list] input[type=checkbox]').forEach(el => { el.checked = action === 'all'; });
      if (action === 'stop-scan') scanStop = true;
      if (action === 'scan') {
        scanStop = false; q('[data-act=scan]').disabled = true; q('[data-scan-status]').textContent = XFH.t('scanning');
        const owner = location.pathname.split('/').filter(Boolean)[0] || '';
        const scanned = await XFH.scanList({ root: document, onProgress: n => { q('[data-scan-status]').textContent = XFH.t('scanCount')(n); }, shouldStop: () => scanStop });
        users = XFH.filterCandidates(scanned, mode, whitelist, owner); renderUsers(); q('[data-scan-status]').textContent = XFH.t('result')(users.length); q('[data-act=scan]').disabled = false;
      }
      if (action === 'export') {
        const csv = XFH.toCSV(users); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'x-follow-helper.csv'; a.click(); URL.revokeObjectURL(url);
      }
      if (action === 'run' && !running) {
        const rows = [...shadow.querySelectorAll('[data-list] .row')].filter(row => row.querySelector('input[type=checkbox]')?.checked);
        const selected = rows.map(row => row.dataset.handle); if (!selected.length) return;
        const capInput = q('[data-cap]'); const cap = Math.min(50, Math.max(1, Number(capInput.value) || 15)); capInput.value = cap;
        const message = XFH.t('confirmText')(Math.min(selected.length, cap));
        if (!window.confirm(`${XFH.t('confirmTitle')}\n\n${message}`)) return;
        running = true; paused = false; stopped = false; q('[data-act=pause]').classList.remove('hidden'); q('[data-act=stop]').classList.remove('hidden'); q('[data-act=pause]').textContent = XFH.t('pause');
        const fn = mode === 'following' ? XFH.unfollowOne : XFH.followOne;
        await XFH.runQueue(selected, fn, { cap, isPaused: () => paused, isStopped: () => stopped, onProgress: (done, total, result) => { q('[data-progress]').textContent = `${done} / ${total}`; const row = shadow.querySelector(`[data-handle="${CSS.escape(result.handle)}"]`); if (row) row.querySelector('.status').textContent = result.ok ? '✓' : `✗ ${result.reason || ''}`; if (result.stop) stopped = true; } });
        running = false; q('[data-act=pause]').classList.add('hidden'); q('[data-act=stop]').classList.add('hidden');
      }
      if (action === 'pause') { paused = !paused; button.textContent = XFH.t(paused ? 'resume' : 'pause'); }
      if (action === 'stop') stopped = true;
    });
    if (!mode) host.style.display = 'none';
    const syncRoute = () => {
      const next = XFH.getPageMode(location.pathname);
      if (next !== mode) { mode = next; host.style.display = mode ? '' : 'none'; if (mode) updateText(); }
    };
    setInterval(syncRoute, 1000);
  };
})();
