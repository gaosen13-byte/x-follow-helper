(function () {
  const strings = {
    zh: {
      title: 'X 关注助手', following: '不回关我的人', followers: '我没回关的粉丝', scan: '开始扫描', scanning: '扫描中…', stopScan: '停止扫描', selectAll: '全选', selectNone: '全不选', whitelist: '加入白名单', whitelistTitle: '白名单', remove: '移除', export: '导出 CSV', cap: '单次操作上限', unfollow: '取消关注所选', follow: '回关所选', confirmTitle: '确认操作', confirmText: n => `即将操作 ${n} 个账号，操作间隔为随机 3–8 秒。频繁关注/取消关注可能触发 X 限制。确定继续吗？`, confirm: '确认', cancel: '取消', pause: '暂停', resume: '继续', stop: '停止', language: '中 / EN', done: '完成', noResults: '没有符合条件的账号。', scanCount: n => `已扫描 ${n} 个账号`, paused: '已暂停', stopped: '已停止', idle: '就绪', popup: '打开 X 的 following 或 followers 页面后使用。', instructions: '打开 x.com/<你的用户名>/following 或 /followers。', close: '收起', expand: '展开', error: '操作失败', invalid: '未找到账号或按钮', toast: 'X 显示了限制或错误提示，已停止。', result: n => `已找到 ${n} 个账号`
    },
    en: {
      title: 'X Follow Helper', following: 'People who don’t follow you back', followers: 'Followers you don’t follow back', scan: 'Scan list', scanning: 'Scanning…', stopScan: 'Stop scan', selectAll: 'Select all', selectNone: 'Select none', whitelist: 'Whitelist', whitelistTitle: 'Whitelist', remove: 'Remove', export: 'Export CSV', cap: 'Per-run limit', unfollow: 'Unfollow selected', follow: 'Follow selected', confirmTitle: 'Confirm action', confirmText: n => `This will act on ${n} accounts with a random 3–8 second delay. Frequent follow/unfollow actions may trigger X limits. Continue?`, confirm: 'Confirm', cancel: 'Cancel', pause: 'Pause', resume: 'Resume', stop: 'Stop', language: '中 / EN', done: 'Done', noResults: 'No matching accounts.', scanCount: n => `Scanned ${n} accounts`, paused: 'Paused', stopped: 'Stopped', idle: 'Ready', popup: 'Open an X following or followers page to use the helper.', instructions: 'Open x.com/<your-handle>/following or /followers.', close: 'Collapse', expand: 'Expand', error: 'Action failed', invalid: 'Account or button not found', toast: 'X displayed a limit or error notice. The run stopped.', result: n => `Found ${n} accounts`
    }
  };
  window.XFH = window.XFH || {};
  window.XFH.strings = strings;
  window.XFH.lang = 'zh';
  window.XFH.t = key => (strings[window.XFH.lang] || strings.zh)[key];
  window.XFH.setLang = async lang => {
    window.XFH.lang = lang === 'en' ? 'en' : 'zh';
    if (globalThis.chrome && chrome.storage && chrome.storage.local) await chrome.storage.local.set({ xfhLanguage: window.XFH.lang });
  };
  // Resolve the saved language before the panel renders.
  window.XFH.ready = new Promise(resolve => {
    if (globalThis.chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ xfhLanguage: 'zh' }, value => { window.XFH.lang = value.xfhLanguage === 'en' ? 'en' : 'zh'; resolve(); });
    } else resolve();
  });
})();
