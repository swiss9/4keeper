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
const suggestionsDropdown = document.getElementById('suggestionsDropdown');
const suggestionsList = document.getElementById('suggestionsList');
const tabsBtn = document.getElementById('tabsBtn');
const tabsBackdrop = document.getElementById('tabsBackdrop');
const tabsPanel = document.getElementById('tabsPanel');
const tabsCloseBtn = document.getElementById('tabsCloseBtn');
const newTabBtn = document.getElementById('newTabBtn');
const tabsCount = document.getElementById('tabsCount');
const tabTitleEl = document.getElementById('tabTitle');
const tabUrlEl = document.getElementById('tabUrl');

const SEARCH_ENGINES = {
  duckduckgo: 'https://duckduckgo.com/?q=',
  google: 'https://www.google.com/search?q=',
  brave: 'https://search.brave.com/search?q=',
  bing: 'https://www.bing.com/search?q='
};

const SUGGEST_APIS = {
  duckduckgo: (q) => `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`,
  google: (q) => `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`,
  brave: (q) => `https://search.brave.com/api/suggest?q=${encodeURIComponent(q)}`
};

let hasPage = false;
let menuOpen = false;
let settingsOpen = false;
let tabsOpen = false;
let suggestTimer = null;
let suggestRequestId = 0;
let typedQuery = null;
let typedSearchUrl = null;
let lastTitle = '';

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
  if (menuOpen || settingsOpen || tabsOpen) {
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
    const active = btn.dataset.theme === t;
    btn.classList.toggle('bg-line', active);
    btn.classList.toggle('font-semibold', active);
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
  return page || 'https://duckduckgo.com';
}

function getHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem('history') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function addToHistory(url) {
  const history = getHistory();
  if (history[history.length - 1] === url) return;
  history.push(url);
  if (history.length > 200) history.splice(0, history.length - 200);
  localStorage.setItem('history', JSON.stringify(history));
}

function hideSuggestions() {
  clearTimeout(suggestTimer);
  suggestTimer = null;
  suggestRequestId++;
  suggestionsDropdown.classList.add('hidden');
  suggestionsList.innerHTML = '';
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

  urlInput.blur();
  startScreen.classList.add('opacity-0', 'pointer-events-none');
  startLoading();

  localStorage.setItem('lastUrl', url);
  addToHistory(url);

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

function setMenu(open) {
  menuOpen = open;
  menuPanel.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBackdrop.classList.toggle('pointer-events-auto', open);
  if (open) {
    setTabs(false);
    setSettings(false);
  }
  syncWebViewVisibility();
}

menuBtn.addEventListener('click', () => setMenu(!menuOpen));
menuBackdrop.addEventListener('click', () => setMenu(false));

function updateTabsUi() {
  const count = hasPage ? 1 : 0;
  if (tabsCount) tabsCount.textContent = String(count);
  if (tabTitleEl) {
    tabTitleEl.textContent = hasPage ? (lastTitle || 'Current tab') : 'New tab';
  }
  if (tabUrlEl) {
    tabUrlEl.textContent = hasPage ? (urlInput.value || getHomePage()) : getHomePage();
  }
}

function setTabs(open) {
  tabsOpen = open;
  tabsPanel.classList.toggle('tabs-open', open);
  tabsBackdrop.classList.toggle('opacity-0', !open);
  tabsBackdrop.classList.toggle('pointer-events-auto', open);
  if (open) {
    setMenu(false);
    setSettings(false);
    updateTabsUi();
  }
  syncWebViewVisibility();
}

tabsBtn.addEventListener('click', () => setTabs(!tabsOpen));
tabsBackdrop.addEventListener('click', () => setTabs(false));
tabsCloseBtn.addEventListener('click', () => setTabs(false));
newTabBtn.addEventListener('click', () => {
  setTabs(false);
  urlInput.value = '';
  lastTitle = '';
  goHome();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (tabsOpen) setTabs(false);
    else if (settingsOpen) setSettings(false);
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
  }
  syncWebViewVisibility();
}

settingsBtn.addEventListener('click', () => setSettings(true));
settingsBackBtn.addEventListener('click', () => setSettings(false));

searchEngineSelect.value = getSearchEngine();
searchEngineSelect.addEventListener('change', () => {
  localStorage.setItem('searchEngine', searchEngineSelect.value);
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
  localStorage.setItem('homePage', page || 'https://duckduckgo.com');
}
homePageInput.addEventListener('change', persistHomePage);
homePageInput.addEventListener('blur', persistHomePage);

clearDataBtn.addEventListener('click', async () => {
  localStorage.removeItem('lastUrl');
  localStorage.removeItem('history');
  const plugin = getPlugin();
  if (!plugin) return;
  try {
    await plugin.clearBrowsingData();
  } catch (error) {
    console.error('Failed to clear browsing data', error);
  }
});

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
  suggestTimer = setTimeout(() => fetchSuggestions(query), 300);
});
urlInput.addEventListener('blur', () => {
  setTimeout(() => {
    if (!urlInput.matches(':focus')) hideSuggestions();
  }, 150);
});

document.getElementById('refreshBtn').addEventListener('click', async () => {
  if (urlInput.value.trim()) {
    navigate(urlInput.value);
    return;
  }
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
    if (plugin && hasPage && !menuOpen && !settingsOpen && !tabsOpen) {
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
    if (state && state.url && /^https?:\/\//i.test(state.url) && document.activeElement !== urlInput) {
      if (typedSearchUrl && typedQuery && state.url === typedSearchUrl) {
        urlInput.value = typedQuery;
      } else {
        try {
          urlInput.value = new URL(state.url).hostname.replace(/^www\./, '');
        } catch (error) {
          urlInput.value = state.url;
        }
      }
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
