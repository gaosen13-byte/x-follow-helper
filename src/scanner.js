(function (root) {
  const XFH = root.XFH = root.XFH || {};
  function getPageMode(pathname) {
    const parts = String(pathname || '').split('/').filter(Boolean);
    if (parts.length !== 2) return null;
    if (parts[1] === 'following') return 'following';
    if (parts[1] === 'followers' || parts[1] === 'verified_followers') return 'followers';
    return null;
  }
  function parseUserCell(cell) {
    if (!cell || !cell.querySelector) return null;
    let userCell = cell;
    if (cell.matches && !cell.matches('[data-testid="UserCell"]')) {
      userCell = cell.querySelector('[data-testid="UserCell"]') || cell;
    }
    const links = userCell.querySelectorAll('a[href^="/"]');
    let handle = '';
    for (const link of links) {
      const path = (link.getAttribute('href') || '').split('?')[0].split('/').filter(Boolean);
      if (path.length === 1 && !['home', 'explore', 'search', 'notifications', 'messages'].includes(path[0])) { handle = path[0].replace(/^@/, ''); break; }
    }
    if (!handle) return null;
    const text = userCell.textContent || '';
    const followsYou = !!userCell.querySelector('[data-testid="userFollowIndicator"]') || /Follows you|关注了你/i.test(text);
    const buttons = [...userCell.querySelectorAll('button')];
    const iFollow = buttons.some(button => /-unfollow$/.test(button.getAttribute('data-testid') || '') || /^(Following|正在关注)$/i.test((button.textContent || '').trim()));
    const nameNode = userCell.querySelector('[data-testid="User-Name"]');
    let name = nameNode ? (nameNode.textContent || '').trim() : '';
    if (!name) name = (links[0].textContent || '').trim() || handle;
    return { handle, name, followsYou, iFollow };
  }
  function collectVisible(rootNode) {
    if (!rootNode || !rootNode.querySelectorAll) return [];
    const cells = [...rootNode.querySelectorAll('[data-testid="UserCell"], [data-testid="cellInnerDiv"]')];
    const found = new Map();
    for (const cell of cells) { const user = parseUserCell(cell); if (user) found.set(user.handle.toLowerCase(), user); }
    return [...found.values()];
  }
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function scanList({ root: rootNode = document, scrollEl = window, onProgress = () => {}, maxIdleRounds = 4, delayMs = 800, shouldStop = () => false } = {}) {
    const users = new Map(); let idle = 0;
    while (idle < maxIdleRounds && !shouldStop()) {
      const before = users.size;
      for (const user of collectVisible(rootNode)) users.set(user.handle.toLowerCase(), user);
      onProgress(users.size);
      idle = users.size > before ? 0 : idle + 1;
      if (idle >= maxIdleRounds || shouldStop()) break;
      if (scrollEl === window || scrollEl === root) {
        scrollEl.scrollBy(0, Math.max(300, Math.floor((scrollEl.innerHeight || 800) * 0.8)));
      } else {
        scrollEl.scrollTop += Math.max(300, Math.floor((scrollEl.clientHeight || 800) * 0.8));
      }
      await wait(delayMs);
    }
    for (const user of collectVisible(rootNode)) users.set(user.handle.toLowerCase(), user);
    onProgress(users.size);
    return [...users.values()];
  }
  function filterCandidates(users, mode, whitelist = [], owner = '') {
    const allowed = new Set(whitelist.map(name => String(name).replace(/^@/, '').toLowerCase()));
    const own = String(owner).replace(/^@/, '').toLowerCase();
    return users.filter(user => user.handle.toLowerCase() !== own && !allowed.has(user.handle.toLowerCase()) && (mode === 'following' ? !user.followsYou : mode === 'followers' ? !user.iFollow : false));
  }
  function toCSV(users) {
    const escape = value => `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;
    const rows = [['handle', 'name', 'profile_url', 'follows_you', 'i_follow'], ...users.map(user => [user.handle, user.name, `https://x.com/${user.handle}`, user.followsYou, user.iFollow])];
    return '\ufeff' + rows.map(row => row.map(escape).join(',')).join('\r\n');
  }
  Object.assign(XFH, { getPageMode, parseUserCell, collectVisible, scanList, filterCandidates, toCSV });
  if (typeof module !== 'undefined' && module.exports) module.exports = XFH;
})(typeof window !== 'undefined' ? window : globalThis);
