(function () {
  const XFH = window.XFH;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const toastPresent = () => !!document.querySelector('[data-testid="toast"]');
  const handleFrom = cell => XFH.parseUserCell(cell)?.handle.toLowerCase();
  async function findCellByHandle(handle) {
    const target = handle.replace(/^@/, '').toLowerCase();
    const find = () => [...document.querySelectorAll('[data-testid="UserCell"], [data-testid="cellInnerDiv"]')].find(cell => handleFrom(cell) === target);
    let cell = find(); if (cell) return cell;
    window.scrollTo(0, 0);
    for (let i = 0; i < 40; i++) { if (toastPresent()) return null; window.scrollBy(0, Math.max(400, window.innerHeight * 0.8)); await sleep(250); cell = find(); if (cell) return cell; }
    return null;
  }
  async function waitFor(selector, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) { const el = document.querySelector(selector); if (el) return el; await sleep(100); }
    return null;
  }
  async function unfollowOne(handle) {
    try {
      const cell = await findCellByHandle(handle); if (!cell) return { ok: false, reason: XFH.t('invalid') };
      const button = [...cell.querySelectorAll('button')].find(b => /-unfollow$/.test(b.getAttribute('data-testid') || ''));
      if (!button) return { ok: false, reason: XFH.t('invalid') };
      button.click();
      const confirm = await waitFor('[data-testid="confirmationSheetConfirm"]');
      if (!confirm) return { ok: false, reason: XFH.t('invalid') };
      confirm.click();
      const start = Date.now();
      while (Date.now() - start < 6000) {
        if (toastPresent()) return { ok: false, reason: XFH.t('toast'), stop: true };
        if ([...cell.querySelectorAll('button')].some(b => /-follow$/.test(b.getAttribute('data-testid') || ''))) return { ok: true };
        await sleep(150);
      }
      return { ok: false, reason: XFH.t('invalid') };
    } catch (error) { return { ok: false, reason: error.message || XFH.t('error') }; }
  }
  async function followOne(handle) {
    try {
      const cell = await findCellByHandle(handle); if (!cell) return { ok: false, reason: XFH.t('invalid') };
      const button = [...cell.querySelectorAll('button')].find(b => /-follow$/.test(b.getAttribute('data-testid') || ''));
      if (!button) return { ok: false, reason: XFH.t('invalid') };
      button.click();
      const start = Date.now();
      while (Date.now() - start < 6000) {
        if (toastPresent()) return { ok: false, reason: XFH.t('toast'), stop: true };
        if ([...cell.querySelectorAll('button')].some(b => /-unfollow$/.test(b.getAttribute('data-testid') || ''))) return { ok: true };
        await sleep(150);
      }
      return { ok: false, reason: XFH.t('invalid') };
    } catch (error) { return { ok: false, reason: error.message || XFH.t('error') }; }
  }
  async function runQueue(handles, fn, { cap = 15, minDelay = 3000, maxDelay = 8000, onProgress = () => {}, isPaused = () => false, isStopped = () => false } = {}) {
    const queue = handles.slice(0, Math.min(50, Math.max(1, Number(cap) || 15))); const results = [];
    for (let i = 0; i < queue.length && !isStopped(); i++) {
      while (isPaused() && !isStopped()) await sleep(200);
      if (isStopped()) break;
      if (toastPresent()) { results.push({ handle: queue[i], ok: false, reason: XFH.t('toast') }); break; }
      const result = await fn(queue[i]); results.push({ handle: queue[i], ...result }); onProgress(results.length, queue.length, results[results.length - 1]);
      if (result.stop) break;
      if (i < queue.length - 1) await sleep(minDelay + Math.random() * (maxDelay - minDelay));
    }
    return results;
  }
  Object.assign(XFH, { findCellByHandle, unfollowOne, followOne, runQueue });
})();
