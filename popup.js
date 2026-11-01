(async function () {
  const instructions = document.getElementById('instructions');
  const button = document.getElementById('lang');
  const draw = () => { document.documentElement.lang = XFH.lang === 'zh' ? 'zh' : 'en'; instructions.textContent = XFH.t('instructions') + ' ' + XFH.t('popup'); };
  chrome.storage.local.get({ xfhLanguage: 'zh' }, data => { XFH.lang = data.xfhLanguage === 'en' ? 'en' : 'zh'; draw(); });
  button.addEventListener('click', async () => { await XFH.setLang(XFH.lang === 'zh' ? 'en' : 'zh'); draw(); });
})();
