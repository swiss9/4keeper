const App = window.Capacitor?.Plugins?.App;

window.onerror = function(msg, url, line, col, error) {
  alert("JS Crash: " + msg + "\nLine: " + line);
  return false;
};

const menuBtn = document.getElementById('menuBtn');
const menuPanel = document.getElementById('menuPanel');
const menuBackdrop = document.getElementById('menuBackdrop');
const refreshIcon = document.getElementById('refreshIcon');
const urlInput = document.getElementById('urlInput');
const browserContainer = document.getElementById('browser-container');
const startScreen = document.getElementById('startScreen');
const loadBar = document.getElementById('loadBar');
const backBtn = document.getElementById('backBtn');
const backNavBtn = document.getElementById('backNavBtn');
const forwardBtn = document.getElementById('forwardBtn');
const settingsBtn = document.getElementById('settingsBtn');
const mainView = document.getElementById('main-view');
const settingsView = document.getElementById('settings-view');
const settingsBackBtn = document.getElementById('settingsBackBtn');
const searchEngineSelect = document.getElementById('searchEngineSelect');
const themeSelector = document.getElementById('themeSelector');
const webDarkModeToggle = document.getElementById('webDarkModeToggle');
const searchSuggestionsToggle = document.getElementById('searchSuggestionsToggle');
const adBlockerToggle = document.getElementById('adBlockerToggle');
const homePageInput = document.getElementById('homePageInput');
const clearDataBtn = document.getElementById('clearDataBtn');
const suggestionsDropdown = document.getElementById('suggestions-dropdown');
const suggestionsList = document.getElementById('suggestionsList');
const historyView = document.getElementById('history-view');
const historyBackBtn = document.getElementById('historyBackBtn');
const historyMenuBtn = document.getElementById('historyMenuBtn');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const clearDataBackdrop = document.getElementById('clearDataBackdrop');
const clearDataModal = document.getElementById('clearDataModal');
const clearDataCancel = document.getElementById('clearDataCancel');
const clearDataDelete = document.getElementById('clearDataDelete');
const clearHistoryCheck = document.getElementById('clearHistoryCheck');
const clearCookiesCheck = document.getElementById('clearCookiesCheck');
const clearCacheCheck = document.getElementById('clearCacheCheck');
const clearDataRange = document.getElementById('clearDataRange');
const tabsBtn = document.getElementById('tabsBtn');
const tabsBackdrop = document.getElementById('tabsBackdrop');
const tabsPanel = document.getElementById('tabsPanel');
const tabsCloseBtn = document.getElementById('tabsCloseBtn');
const newTabBtn = document.getElementById('newTabBtn');
const tabsCount = document.getElementById('tabsCount');
const tabTitleEl = document.getElementById('tabTitle');
const tabUrlEl = document.getElementById('tabUrl');
const tabsList = document.getElementById('tabsList');

const SEARCH_ENGINES = {
  duckduckgo: 'https://duckduckgo.com/?q=',
  google: 'https://www.google.com/search?q=',
  brave: 'https://search.brave.com/search?q=',
  bing: 'https://www.bing.com/search?q='
};

const ENGINE_HOMEPAGES = {
  duckduckgo: 'https://duckduckgo.com',
  google: 'https://www.google.com',
  brave: 'https://search.brave.com',
  bing: 'https://www.bing.com'
};

const SUGGEST_APIS = {
  duckduckgo: (q) => `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`,
  google: (q) => `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`,
  brave: (q) => `https://search.brave.com/api/suggest?q=${encodeURIComponent(q)}`
};

let hasPage = false;
let menuOpen = false;
let settingsOpen = false;
let historyOpen = false;
let tabsOpen = false;
let suggestTimer = null;
let suggestRequestId = 0;
let suggestionsOpen = false;
let typedQuery = null;
let typedSearchUrl = null;
let lastTitle = '';
const bootActiveTab = parseInt(localStorage.getItem('activeTabId') || '', 10);
let activeTabId = Number.isNaN(bootActiveTab) ? null : bootActiveTab;

function getPlugin() {
  return window.Capacitor?.Plugins?.EmbeddedWebView || null;
}

function setNativeWebViewVisible(visible) {
  const plugin = getPlugin();
  if (!plugin) return;
  const setter = plugin.setVisibility || plugin.setWebViewVisibility || plugin.setVisible;
  if (setter) Promise.resolve(setter.call(plugin, { visible })).catch(() => {});
}

function syncWebViewVisibility() {
  if (menuOpen || settingsOpen || tabsOpen || historyOpen || suggestionsOpen) {
    setNativeWebViewVisible(false);
  } else if (hasPage) {
    setNativeWebViewVisible(true);
  }
}

function getBounds() {
  const rect = browserContainer.getBoundingClientRect();
  return {
    x: Math.round(rect.left),
    y: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
}

function setNav(canBack, canForward) {
  backBtn.disabled = !canBack;
  backNavBtn.disabled = !canBack;
  forwardBtn.disabled = !canForward;
}

function startLoading() {
  refreshIcon.classList.add('spin');
  loadBar.style.width = '35%';
}

function stopLoading() {
  refreshIcon.classList.remove('spin');
  loadBar.style.width = '100%';
  setTimeout(() => { loadBar.style.width = '0'; }, 260);
}

function getSearchEngine() {
  const engine = localStorage.getItem('searchEngine');
  return SEARCH_ENGINES[engine] ? engine : 'duckduckgo';
}

function formatUrl(input) {
  let str = input.trim();
  if (!str) return null;

  // If it's a valid URL or contains a dot, prepend https:// if missing
  if (str.includes('.') || str.startsWith('localhost')) {
    if (!str.startsWith('http://') && !str.startsWith('https://')) {
      return 'https://' + str;
    }
    return str;
  }

  // Otherwise, it's a search query using the selected search engine
  return SEARCH_ENGINES[getSearchEngine()] + encodeURIComponent(str);
}

function applyTheme(theme, persist) {
  const t = ['dark', 'light', 'amoled'].includes(theme) ? theme : 'dark';
  document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-amoled');
  document.documentElement.classList.add('theme-' + t);
  if (persist) localStorage.setItem('theme', t);
  themeSelector.querySelectorAll('button[data-theme]').forEach((btn) => {
    btn.classList.toggle('theme-active', btn.dataset.theme === t);
  });
  const styles = getComputedStyle(document.documentElement);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = styles.getPropertyValue('--c-bg').trim();
}

function isWebDarkMode() {
  return localStorage.getItem('webDarkMode') === 'on';
}

function pushWebDarkMode(enabled) {
  const plugin = getPlugin();
  if (!plugin) return;
  const setter = plugin.setDarkMode || plugin.setWebDarkMode;
  if (setter) Promise.resolve(setter.call(plugin, { enabled })).catch(() => {});
}

function setWebDarkMode(enabled, persist) {
  if (persist) localStorage.setItem('webDarkMode', enabled ? 'on' : 'off');
  webDarkModeToggle.checked = enabled;
  pushWebDarkMode(enabled);
}

function isSuggestionsOn() {
  return localStorage.getItem('searchSuggestions') === 'on';
}

function setSearchSuggestions(enabled, persist) {
  if (persist) localStorage.setItem('searchSuggestions', enabled ? 'on' : 'off');
  searchSuggestionsToggle.checked = enabled;
  if (!enabled) hideSuggestions();
}

function isAdBlockerOn() {
  return localStorage.getItem('adBlocker') === 'on';
}

function setAdBlocker(enabled, persist) {
  if (persist) localStorage.setItem('adBlocker', enabled ? 'on' : 'off');
  adBlockerToggle.checked = enabled;
}

function getHomePage() {
  const page = (localStorage.getItem('homePage') || '').trim();
  return page || ENGINE_HOMEPAGES[getSearchEngine()] || 'https://www.google.com';
}

function getBrowserHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem('browserHistory') || '[]');
    return Array.isArray(parsed) ? parsed.filter((h) => h && Number.isFinite(h.id) && typeof h.url === 'string') : [];
  } catch (error) {
    return [];
  }
}

function saveBrowserHistory(list) {
  localStorage.setItem('browserHistory', JSON.stringify(list.slice(-500)));
}

let historyIdSeed = parseInt(localStorage.getItem('historyIdSeed') || '', 10);
if (Number.isNaN(historyIdSeed) || historyIdSeed < Date.now()) historyIdSeed = Date.now();

function nextHistoryId() {
  historyIdSeed++;
  localStorage.setItem('historyIdSeed', String(historyIdSeed));
  return historyIdSeed;
}

function addBrowserHistory(url, title) {
  if (!/^https?:\/\//i.test(url)) return;
  const history = getBrowserHistory();
  const last = history[history.length - 1];
  if (last && last.url === url) {
    last.title = title || last.title;
    last.timestamp = Date.now();
    saveBrowserHistory(history);
    return;
  }
  history.push({ id: nextHistoryId(), url, title: title || '', timestamp: Date.now() });
  saveBrowserHistory(history);
}

function removeBrowserHistoryItem(id) {
  saveBrowserHistory(getBrowserHistory().filter((h) => h.id !== id));
  if (historyOpen) renderHistory();
}

function getOpenTabs() {
  try {
    const parsed = JSON.parse(localStorage.getItem('openTabs') || '[]');
    return Array.isArray(parsed) ? parsed.filter((t) => t && Number.isFinite(t.id)) : [];
  } catch (error) {
    return [];
  }
}

function saveOpenTabs(tabs) {
  localStorage.setItem('openTabs', JSON.stringify(tabs));
}

function getActiveTab() {
  return getOpenTabs().find((t) => t.id === activeTabId) || null;
}

let tabIdSeed = parseInt(localStorage.getItem('tabIdSeed') || '', 10);
if (Number.isNaN(tabIdSeed) || tabIdSeed < Date.now()) tabIdSeed = Date.now();

function nextTabId() {
  tabIdSeed++;
  localStorage.setItem('tabIdSeed', String(tabIdSeed));
  return tabIdSeed;
}

function setActiveTab(id) {
  activeTabId = id;
  localStorage.setItem('activeTabId', String(id));
}

function clearActiveTab() {
  activeTabId = null;
  localStorage.removeItem('activeTabId');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatUrlForDisplay(url) {
  if (!url) return '';
  const stripped = String(url).replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  try {
    const parsed = new URL(url);
    const isSearchEngine = Object.values(SEARCH_ENGINES).some((prefix) => parsed.href.startsWith(prefix));
    const query = parsed.searchParams.get('q');
    if (isSearchEngine && query) return query;
    return parsed.href.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  } catch (error) {
    return stripped;
  }
}

function hideSuggestions() {
  clearTimeout(suggestTimer);
  suggestTimer = null;
  suggestRequestId++;
  suggestionsDropdown.classList.add('hidden');
  suggestionsList.innerHTML = '';
  if (suggestionsOpen) {
    suggestionsOpen = false;
    syncWebViewVisibility();
  }
}

function parseSuggestions(data, engine) {
  if (engine === 'brave') {
    if (data && Array.isArray(data.q)) return data.q.filter((x) => typeof x === 'string');
    if (data && Array.isArray(data.results)) return data.results.map((r) => r.query || r.q).filter(Boolean);
    return [];
  }
  if (Array.isArray(data) && Array.isArray(data[1])) return data[1];
  if (Array.isArray(data)) return data.map((x) => (typeof x === 'string' ? x : x && x.phrase)).filter(Boolean);
  return [];
}

async function fetchSuggestions(query) {
  const engine = getSearchEngine();
  const endpoint = SUGGEST_APIS[engine];
  if (!endpoint) { hideSuggestions(); return; }

  const requestId = ++suggestRequestId;
  try {
    const response = await fetch(endpoint(query));
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    if (requestId !== suggestRequestId) return;
    const items = parseSuggestions(data, engine).slice(0, 8);
    if (!items.length) { hideSuggestions(); return; }

    suggestionsList.innerHTML = '';
    items.forEach((text) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'tap flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left text-[14px] font-normal text-fg hover:bg-line/40 last:border-b-0';
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('width', '15');
      icon.setAttribute('height', '15');
      icon.setAttribute('fill', 'none');
      icon.setAttribute('stroke', 'currentColor');
      icon.setAttribute('stroke-width', '2');
      icon.setAttribute('stroke-linecap', 'round');
      icon.setAttribute('stroke-linejoin', 'round');
      icon.classList.add('shrink-0', 'text-muted');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M12 3v12m-5-5 5 5 5-5M5 21h14');
      icon.appendChild(path);
      const label = document.createElement('span');
      label.className = 'min-w-0 flex-1 truncate';
      label.textContent = text;
      item.appendChild(icon);
      item.appendChild(label);
      item.addEventListener('click', () => {
        hideSuggestions();
        navigate(text);
      });
      suggestionsList.appendChild(item);
    });
    suggestionsDropdown.classList.remove('hidden');
    if (!suggestionsOpen) {
      suggestionsOpen = true;
      syncWebViewVisibility();
    }
  } catch (error) {
    if (requestId === suggestRequestId) hideSuggestions();
  }
}

async function mountWebView() {
  const plugin = getPlugin();
  if (!plugin) return;
  await plugin.mount(getBounds());
}

async function syncNav() {
  const plugin = getPlugin();
  if (!plugin) {
    setNav(false, false);
    return;
  }
  try {
    const state = await plugin.getNavigationState();
    setNav(!!state.canGoBack, !!state.canGoForward);
  } catch (error) {
    setNav(false, false);
  }
}

async function navigate(raw) {
  hideSuggestions();
  const url = formatUrl(raw);
  if (!url) return;

  const tabs = getOpenTabs();
  let tab = tabs.find((t) => t.id === activeTabId);
  if (!tab) {
    tab = { id: nextTabId(), url: '', title: '' };
    tabs.push(tab);
    setActiveTab(tab.id);
  }
  tab.url = url;
  saveOpenTabs(tabs);
  updateTabsUi();

  urlInput.blur();
  startScreen.classList.add('opacity-0', 'pointer-events-none');
  startLoading();

  localStorage.setItem('lastUrl', url);

  const enginePrefix = SEARCH_ENGINES[getSearchEngine()];
  if (url.startsWith(enginePrefix) && url.length > enginePrefix.length) {
    typedQuery = decodeURIComponent(url.slice(enginePrefix.length));
    typedSearchUrl = url;
  } else {
    typedQuery = null;
    typedSearchUrl = null;
  }

  const plugin = getPlugin();
  if (!plugin) {
    stopLoading();
    console.warn('Native WebView is only available inside the Android app.');
    return;
  }

  try {
    await mountWebView();
    pushWebDarkMode(isWebDarkMode());
    await plugin.loadUrl({ url });
    hasPage = true;
    updateTabsUi();
    syncNav();
  } catch (error) {
    console.error('Failed to load URL', error);
    stopLoading();
  }
}

async function goBack() {
  const plugin = getPlugin();
  if (!plugin || !hasPage) return;
  try {
    await plugin.goBack();
    setTimeout(syncNav, 350);
  } catch (error) {
    console.error(error);
  }
}

async function goForward() {
  const plugin = getPlugin();
  if (!plugin || !hasPage) return;
  try {
    await plugin.goForward();
    setTimeout(syncNav, 350);
  } catch (error) {
    console.error(error);
  }
}

async function goHome() {
  await navigate(getHomePage());
}

async function handleHardwareBack({ canGoBack } = {}) {
  if (settingsOpen) {
    setSettings(false);
    return;
  }
  if (historyOpen) {
    setHistory(false);
    return;
  }
  if (tabsOpen) {
    setTabs(false);
    return;
  }
  const plugin = getPlugin();
  let webViewCanGoBack = !!canGoBack;
  if (plugin && hasPage) {
    try {
      const state = await plugin.getNavigationState();
      if (state && typeof state.canGoBack === 'boolean') webViewCanGoBack = state.canGoBack;
    } catch (error) {
      console.error(error);
    }
  }
  if (webViewCanGoBack && plugin) {
    try {
      await plugin.goBack();
      setTimeout(syncNav, 350);
      return;
    } catch (error) {
      console.error(error);
    }
  }
  try {
    await App.exitApp();
  } catch (error) {
    console.error(error);
  }
}

if (App && typeof App.addListener === 'function') {
  App.addListener('backButton', handleHardwareBack);
}

function setMenu(open) {
  menuOpen = open;
  menuPanel.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBackdrop.classList.toggle('pointer-events-auto', open);
  menuBackdrop.classList.toggle('opacity-0', !open);
  mainView.classList.remove('hidden');
  if (open) {
    setTabs(false);
    setSettings(false);
    setHistory(false);
  }
  syncWebViewVisibility();
}

menuBtn.addEventListener('click', () => setMenu(!menuOpen));
menuBackdrop.addEventListener('click', () => setMenu(false));

function updateTabsUi() {
  const tabs = getOpenTabs();
  if (tabsCount) tabsCount.textContent = String(tabs.length);
  const tab = getActiveTab();
  if (tabTitleEl) {
    tabTitleEl.textContent = tab ? (tab.title || (hasPage ? 'Current tab' : 'New tab')) : 'New tab';
  }
  if (tabUrlEl) {
    tabUrlEl.textContent = tab ? (tab.url || getHomePage()) : getHomePage();
  }
}

function renderTabs() {
  if (!tabsList) return;
  const tabs = getOpenTabs();
  tabsList.innerHTML = '';
  if (!tabs.length) {
    const empty = document.createElement('div');
    empty.className = 'border border-line bg-ink px-3 py-4 text-center font-mono text-[11px] uppercase tracking-wider text-muted';
    empty.textContent = '// No open tabs';
    tabsList.appendChild(empty);
    return;
  }
  tabs.forEach((tab) => {
    const active = tab.id === activeTabId;
    const row = document.createElement('div');
    row.className = active
      ? 'tap flex items-center gap-3 border border-line border-l-4 border-l-fg bg-ink px-3 py-3'
      : 'tap flex items-center gap-3 border border-line bg-ink px-3 py-3';
    row.innerHTML = `
      <div class="grid h-9 w-9 shrink-0 place-items-center border border-line bg-bar text-muted">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21M12 3c-2.5 2.6-3.8 5.7-3.8 9s1.3 6.4 3.8 9" />
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <div class="truncate text-[14px] font-medium text-fg">${escapeHtml(tab.title || 'Untitled')}</div>
        <div class="truncate text-[11px] text-muted">${escapeHtml(tab.url || '')}</div>
      </div>
      ${active ? '<span class="h-2 w-2 shrink-0 bg-fg" aria-label="Active tab"></span>' : ''}
      <button class="close-tab tap grid h-8 w-8 shrink-0 place-items-center border border-line text-muted hover:text-red-500" aria-label="Close tab">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    `;
    row.addEventListener('click', (event) => {
      if (event.target.closest('.close-tab')) return;
      switchTab(tab.id);
    });
    row.querySelector('.close-tab').addEventListener('click', (event) => {
      event.stopPropagation();
      closeTab(tab.id);
    });
    tabsList.appendChild(row);
  });
}

async function switchTab(id) {
  const tabs = getOpenTabs();
  const tab = tabs.find((t) => t.id === id);
  if (!tab) return;
  setActiveTab(id);
  setTabs(false);
  lastTitle = tab.title || '';
  urlInput.value = formatUrlForDisplay(tab.url || '');
  await navigate(tab.url || getHomePage());
}

async function closeTab(id) {
  const tabs = getOpenTabs();
  const idx = tabs.findIndex((t) => t.id === id);
  if (idx === -1) return;
  tabs.splice(idx, 1);
  saveOpenTabs(tabs);
  if (id === activeTabId) {
    clearActiveTab();
    lastTitle = '';
    if (tabs.length) {
      await switchTab(tabs[Math.min(idx, tabs.length - 1)].id);
    } else {
      await newTab();
    }
  } else {
    updateTabsUi();
    renderTabs();
  }
}

async function newTab() {
  setTabs(false);
  clearActiveTab();
  lastTitle = '';
  urlInput.value = '';
  await navigate(getHomePage());
}

function setTabs(open) {
  tabsOpen = open;
  tabsPanel.classList.toggle('tabs-open', open);
  tabsBackdrop.classList.toggle('opacity-0', !open);
  tabsBackdrop.classList.toggle('pointer-events-auto', open);
  if (open) {
    setMenu(false);
    setSettings(false);
    setHistory(false);
    renderTabs();
    updateTabsUi();
  }
  syncWebViewVisibility();
}

tabsBtn.addEventListener('click', () => setTabs(!tabsOpen));
tabsBackdrop.addEventListener('click', () => setTabs(false));
tabsCloseBtn.addEventListener('click', () => setTabs(false));
newTabBtn.addEventListener('click', () => newTab());

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (tabsOpen) setTabs(false);
    else if (settingsOpen) setSettings(false);
    else if (historyOpen) setHistory(false);
    else setMenu(false);
  }
});

function setSettings(open) {
  settingsOpen = open;
  mainView.classList.toggle('hidden', open);
  settingsView.classList.toggle('settings-open', open);
  if (open) {
    setMenu(false);
    setTabs(false);
    setHistory(false);
  }
  syncWebViewVisibility();
}

settingsBtn.addEventListener('click', () => setSettings(true));
settingsBackBtn.addEventListener('click', () => setSettings(false));

function historyDayKey(timestamp) {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function historyDayLabel(timestamp) {
  const now = new Date();
  const d = new Date(timestamp);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (timestamp >= startToday) return 'Today';
  if (timestamp >= startToday - 86400000) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function renderHistory() {
  if (!historyList) return;
  const history = getBrowserHistory().slice().reverse();
  historyList.innerHTML = '';

  if (!history.length) {
    const empty = document.createElement('div');
    empty.className = 'border border-line bg-bar/40 px-3 py-6 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted';
    empty.textContent = '// No history yet';
    historyList.appendChild(empty);
    return;
  }

  let currentKey = null;
  let currentLabel = null;

  history.forEach((item) => {
    const key = historyDayKey(item.timestamp);
    if (key !== currentKey) {
      currentKey = key;
      currentLabel = historyDayLabel(item.timestamp);
      const header = document.createElement('div');
      header.className = 'border-b border-line bg-bar/70 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted';
      header.textContent = currentLabel;
      historyList.appendChild(header);
    }

    const row = document.createElement('div');
    row.className = 'tap flex items-center gap-3 border-b border-line px-4 py-3 hover:bg-line/40 last:border-b-0';
    row.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 self-center text-muted">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21M12 3c-2.5 2.6-3.8 5.7-3.8 9s1.3 6.4 3.8 9" />
      </svg>
      <div class="min-w-0 flex-1">
        <div class="truncate text-[14px] font-medium text-fg">${escapeHtml(item.title || item.url)}</div>
        <div class="truncate text-[11px] text-muted">${escapeHtml(item.url)}</div>
      </div>
      <span class="shrink-0 font-mono text-[10px] uppercase text-muted">${escapeHtml(new Date(item.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }))}</span>
      <button class="delete-history tap grid h-8 w-8 shrink-0 place-items-center border border-line text-muted hover:border-red-600 hover:text-red-600" aria-label="Delete entry">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    `;
    row.addEventListener('click', (event) => {
      if (event.target.closest('.delete-history')) return;
      setHistory(false);
      navigate(item.url);
    });
    row.querySelector('.delete-history').addEventListener('click', (event) => {
      event.stopPropagation();
      removeBrowserHistoryItem(item.id);
    });
    historyList.appendChild(row);
  });
}

function setHistory(open) {
  historyOpen = open;
  historyView.classList.toggle('history-open', open);
  if (open) {
    setMenu(false);
    setTabs(false);
    setSettings(false);
    renderHistory();
  }
  syncWebViewVisibility();
}

historyMenuBtn.addEventListener('click', () => setHistory(true));
historyBackBtn.addEventListener('click', () => setHistory(false));
clearHistoryBtn.addEventListener('click', () => setClearDataModal(true));

function setClearDataModal(open) {
  clearDataModal.classList.toggle('modal-open', open);
  clearDataBackdrop.classList.toggle('opacity-0', !open);
  clearDataBackdrop.classList.toggle('pointer-events-auto', open);
}

function clearDataSinceMs(range) {
  const now = Date.now();
  if (range === '15m') return now - 15 * 60 * 1000;
  if (range === '1h') return now - 60 * 60 * 1000;
  if (range === '24h') return now - 24 * 60 * 60 * 1000;
  return 0;
}

clearDataCancel.addEventListener('click', () => setClearDataModal(false));
clearDataBackdrop.addEventListener('click', () => setClearDataModal(false));

clearDataDelete.addEventListener('click', async () => {
  const since = clearDataSinceMs(clearDataRange.value);
  const wantsHistory = clearHistoryCheck.checked;
  const wantsCookies = clearCookiesCheck.checked;
  const wantsCache = clearCacheCheck.checked;

  if (wantsHistory) {
    if (since === 0) {
      localStorage.removeItem('browserHistory');
      localStorage.removeItem('history');
    } else {
      saveBrowserHistory(getBrowserHistory().filter((h) => h.timestamp < since));
    }
  }

  const plugin = getPlugin();
  if ((wantsCookies || wantsCache) && plugin) {
    try {
      if (wantsCookies && typeof plugin.clearCookies === 'function') {
        await plugin.clearCookies();
      }
      if (wantsCache && typeof plugin.clearCache === 'function') {
        await plugin.clearCache();
      }
      if (typeof plugin.clearCookies !== 'function' && typeof plugin.clearCache !== 'function') {
        await plugin.clearBrowsingData();
      }
    } catch (error) {
      console.error('Failed to clear browsing data', error);
    }
  }

  setClearDataModal(false);
  if (historyOpen) renderHistory();
});

searchEngineSelect.value = getSearchEngine();
searchEngineSelect.addEventListener('change', () => {
  const engine = searchEngineSelect.value;
  localStorage.setItem('searchEngine', engine);
  const home = ENGINE_HOMEPAGES[engine] || 'https://www.google.com';
  localStorage.setItem('homePage', home);
  homePageInput.value = home;
});

applyTheme(localStorage.getItem('theme') || 'dark', false);
themeSelector.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-theme]');
  if (btn) applyTheme(btn.dataset.theme, true);
});

webDarkModeToggle.checked = isWebDarkMode();
webDarkModeToggle.addEventListener('change', () => {
  setWebDarkMode(webDarkModeToggle.checked, true);
});

searchSuggestionsToggle.checked = isSuggestionsOn();
searchSuggestionsToggle.addEventListener('change', () => {
  setSearchSuggestions(searchSuggestionsToggle.checked, true);
});

adBlockerToggle.checked = isAdBlockerOn();
adBlockerToggle.addEventListener('change', () => {
  setAdBlocker(adBlockerToggle.checked, true);
});

homePageInput.value = getHomePage();
function persistHomePage() {
  const page = homePageInput.value.trim();
  localStorage.setItem('homePage', page || ENGINE_HOMEPAGES[getSearchEngine()] || 'https://www.google.com');
}
homePageInput.addEventListener('change', persistHomePage);
homePageInput.addEventListener('blur', persistHomePage);

clearDataBtn.addEventListener('click', () => setClearDataModal(true));

document.querySelectorAll('#menuPanel button').forEach((item) => {
  item.addEventListener('click', () => setMenu(false));
});

urlInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    navigate(urlInput.value);
  }
});
urlInput.addEventListener('focus', () => {
  requestAnimationFrame(() => {
    urlInput.select();
    urlInput.setSelectionRange(0, urlInput.value.length);
  });
});
urlInput.addEventListener('input', () => {
  const query = urlInput.value.trim();
  clearTimeout(suggestTimer);
  if (!isSuggestionsOn() || !query || query.includes('.') || query.startsWith('localhost')) {
    hideSuggestions();
    return;
  }
  if (!suggestionsOpen) {
    suggestionsOpen = true;
    syncWebViewVisibility();
  }
  suggestTimer = setTimeout(() => fetchSuggestions(query), 300);
});
urlInput.addEventListener('blur', () => {
  setTimeout(() => {
    if (!urlInput.matches(':focus')) hideSuggestions();
  }, 150);
});

document.getElementById('refreshBtn').addEventListener('click', async () => {
  const plugin = getPlugin();
  if (plugin && hasPage) {
    startLoading();
    try {
      await plugin.reload();
    } catch (error) {
      console.error(error);
      stopLoading();
    }
  }
});

backBtn.addEventListener('click', goBack);
backNavBtn.addEventListener('click', goBack);
forwardBtn.addEventListener('click', goForward);
document.getElementById('homeBtn').addEventListener('click', goHome);

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const plugin = getPlugin();
    if (plugin && hasPage && !menuOpen && !settingsOpen && !tabsOpen && !historyOpen) {
      plugin.mount(getBounds()).catch(() => {});
    }
  }, 180);
});

let listenersAttached = false;

function attachPluginListeners() {
  const plugin = getPlugin();
  if (!plugin) return false;
  if (listenersAttached) return true;
  listenersAttached = true;

  plugin.addListener('pageLoaded', (state) => {
    stopLoading();
    hasPage = true;
    if (state && state.title) lastTitle = state.title;
    if (state && state.url && /^https?:\/\//i.test(state.url)) {
      addBrowserHistory(state.url, state.title);
    }
    const tabs = getOpenTabs();
    const tab = tabs.find((t) => t.id === activeTabId);
    if (tab) {
      if (state && state.title) tab.title = state.title;
      if (state && state.url && /^https?:\/\//i.test(state.url)) tab.url = state.url;
      saveOpenTabs(tabs);
    }
    if (state && state.url && /^https?:\/\//i.test(state.url) && document.activeElement !== urlInput) {
      urlInput.value = formatUrlForDisplay(state.url);
    }
    startScreen.classList.add('opacity-0', 'pointer-events-none');
    setNav(!!state?.canGoBack, !!state?.canGoForward);
    updateTabsUi();
    syncWebViewVisibility();
  });

  plugin.addListener('pageStarted', () => startLoading());

  plugin.addListener('loadProgress', (state) => {
    if (!state || typeof state.progress !== 'number') return;
    loadBar.style.width = `${Math.min(100, Math.max(5, state.progress))}%`;
  });

  plugin.addListener('titleChanged', (state) => {
    if (state && state.title) {
      lastTitle = state.title;
      document.title = state.title;
      const tabs = getOpenTabs();
      const tab = tabs.find((t) => t.id === activeTabId);
      if (tab) {
        tab.title = state.title;
        saveOpenTabs(tabs);
      }
      updateTabsUi();
    }
  });

  plugin.addListener('pageError', (state) => {
    stopLoading();
    console.error('Page error', state);
  });

  return true;
}

attachPluginListeners();
syncNav();
updateTabsUi();

let bootRestored = false;
function bootRestoreSession() {
  if (bootRestored || hasPage) return;
  bootRestored = true;
  const lastUrl = localStorage.getItem('lastUrl');
  if (lastUrl) navigate(lastUrl);
}

let bootAttempts = 0;
function boot() {
  const ready = attachPluginListeners();
  if (ready) {
    bootRestoreSession();
    return;
  }
  if (bootAttempts++ < 25) setTimeout(boot, 120);
}

window.addEventListener('DOMContentLoaded', boot);
boot();
