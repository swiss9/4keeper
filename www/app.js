'use strict';

const $ = (id) => document.getElementById(id);
const CapacitorRuntime = window.Capacitor || {};
const App = CapacitorRuntime.Plugins && CapacitorRuntime.Plugins.App;

/* ------------------------------------------------------------------ Data */

const ENGINES = {
  duckduckgo: {
    label: 'DuckDuckGo',
    search: 'https://duckduckgo.com/?q=',
    home: 'https://duckduckgo.com',
    suggest: (q) => `https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`
  },
  google: {
    label: 'Google',
    search: 'https://www.google.com/search?q=',
    home: 'https://www.google.com',
    suggest: (q) => `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`
  },
  brave: {
    label: 'Brave Search',
    search: 'https://search.brave.com/search?q=',
    home: 'https://search.brave.com',
    suggest: (q) => `https://search.brave.com/api/suggest?q=${encodeURIComponent(q)}`
  },
  bing: {
    label: 'Bing',
    search: 'https://www.bing.com/search?q=',
    home: 'https://www.bing.com',
    suggest: (q) => `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(q)}`
  }
};

const DEFAULT_SETTINGS = {
  theme: 'system',
  density: 'comfortable',
  searchEngine: 'duckduckgo',
  homePage: '',
  startup: 'restore',
  suggestions: true,
  showFullUrl: false,
  webDarkMode: false,
  trackingProtection: false,
  safeBrowsing: true,
  cookies: 'all',
  javaScript: true,
  popups: true,
  textZoom: 100,
  desktopMode: false,
  pinchZoom: true,
  zoomControls: false,
  downloadNotifications: true
};

const ICONS = {
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21M12 3c-2.5 2.6-3.8 5.7-3.8 9s1.3 6.4 3.8 9"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  warning: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  check: '<path d="m5 13 4 4L19 7"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  bookmark: '<path d="M6 3h12v18l-6-4.5L6 21Z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5"/><path d="M5 21h14"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
  shield: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6Z"/>',
  palette: '<path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 0-4H13a2 2 0 0 1 0-4h4a3 3 0 0 0 3-3 7 7 0 0 0-8-7Z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="9.5" cy="6.5" r="1"/><circle cx="14" cy="6.5" r="1"/>',
  text: '<path d="M4 6h16M4 12h10M4 18h7"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
  newtab: '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"/>'
};

const svgIcon = (name, cls = 'icon') => `<svg class="${cls}" viewBox="0 0 24 24">${ICONS[name] || ''}</svg>`;

/* ----------------------------------------------------------------- State */

let settings = { ...DEFAULT_SETTINGS };
let history = [];
let bookmarks = [];
let favicons = {};
let session = { tabs: [], activeIndex: 0 };
let tabs = [];
let activeTabId = -1;
let currentUrl = '';
let currentTitle = '';
let loading = false;
let appInfo = null;
let downloadsCache = [];
let currentSettingsSection = null;
let navCanBack = false;
let navCanForward = false;
let listenersAttached = false;
let lastBoundsKey = '';
let suggestionTimer = null;
let suggestionRequest = 0;
let suggestionItems = [];
let toastTimer = null;
let loadingTimer = null;
let dialogState = null;
let dialogBusy = false;
let sessionTimer = null;

const overlays = new Set();

/* ------------------------------------------------------------------- DOM */

const dom = {
  toolbar: $('toolbar'),
  siteInfoBtn: $('siteInfoBtn'),
  securityIcon: $('securityIcon'),
  urlInput: $('urlInput'),
  clearUrlBtn: $('clearUrlBtn'),
  reloadBtn: $('reloadBtn'),
  reloadIcon: $('reloadIcon'),
  stopIcon: $('stopIcon'),
  progressBar: $('progressBar'),
  suggestions: $('suggestions'),
  suggestionsList: $('suggestionsList'),
  browserContainer: $('browserContainer'),
  webviewSnapshot: $('webviewSnapshot'),
  startScreen: $('startScreen'),
  backBtn: $('backBtn'),
  forwardBtn: $('forwardBtn'),
  homeBtn: $('homeBtn'),
  tabsBtn: $('tabsBtn'),
  tabsBadge: $('tabsBadge'),
  menuBtn: $('menuBtn'),
  tabSheet: $('tabSheet'),
  tabSheetBackdrop: $('tabSheetBackdrop'),
  tabSheetCount: $('tabSheetCount'),
  tabsList: $('tabsList'),
  tabsEmpty: $('tabsEmpty'),
  newTabBtn: $('newTabBtn'),
  closeAllTabsBtn: $('closeAllTabsBtn'),
  closeTabSheetBtn: $('closeTabSheetBtn'),
  menuSheet: $('menuSheet'),
  menuBackdrop: $('menuBackdrop'),
  closeMenuBtn: $('closeMenuBtn'),
  menuNewTabBtn: $('menuNewTabBtn'),
  menuBookmarkBtn: $('menuBookmarkBtn'),
  menuBookmarkLabel: $('menuBookmarkLabel'),
  menuBookmarksBtn: $('menuBookmarksBtn'),
  menuBookmarksCount: $('menuBookmarksCount'),
  menuHistoryBtn: $('menuHistoryBtn'),
  menuHistoryCount: $('menuHistoryCount'),
  menuDownloadsBtn: $('menuDownloadsBtn'),
  menuSettingsBtn: $('menuSettingsBtn'),
  siteInfoSheet: $('siteInfoSheet'),
  siteInfoBackdrop: $('siteInfoBackdrop'),
  siteInfoCloseBtn: $('siteInfoCloseBtn'),
  siteInfoContent: $('siteInfoContent'),
  historyScreen: $('historyScreen'),
  historyBackBtn: $('historyBackBtn'),
  historySearch: $('historySearch'),
  historyList: $('historyList'),
  historyCount: $('historyCount'),
  clearHistoryBtn: $('clearHistoryBtn'),
  bookmarksScreen: $('bookmarksScreen'),
  bookmarksBackBtn: $('bookmarksBackBtn'),
  bookmarksSearch: $('bookmarksSearch'),
  bookmarksList: $('bookmarksList'),
  bookmarksCount: $('bookmarksCount'),
  downloadsScreen: $('downloadsScreen'),
  downloadsBackBtn: $('downloadsBackBtn'),
  downloadsRefreshBtn: $('downloadsRefreshBtn'),
  downloadsList: $('downloadsList'),
  settingsScreen: $('settingsScreen'),
  settingsBackBtn: $('settingsBackBtn'),
  settingsTitle: $('settingsTitle'),
  settingsRoot: $('settingsRoot'),
  settingsPage: $('settingsPage'),
  dialog: $('dialog'),
  dialogBackdrop: $('dialogBackdrop'),
  dialogTitle: $('dialogTitle'),
  dialogMessage: $('dialogMessage'),
  dialogBody: $('dialogBody'),
  dialogCancel: $('dialogCancel'),
  dialogConfirm: $('dialogConfirm'),
  choiceSheet: $('choiceSheet'),
  choiceBackdrop: $('choiceBackdrop'),
  choiceTitle: $('choiceTitle'),
  choiceList: $('choiceList'),
  choiceClose: $('choiceClose'),
  toast: $('toast')
};

/* --------------------------------------------------------------- Utility */

function getPlugin() {
  const plugins = window.Capacitor && window.Capacitor.Plugins;
  return (plugins && plugins.EmbeddedWebView) || null;
}

function callPlugin(method, args) {
  const plugin = getPlugin();
  if (!plugin || typeof plugin[method] !== 'function') {
    return Promise.reject(new Error('EmbeddedWebView is unavailable'));
  }
  try {
    return Promise.resolve(plugin[method](args || {}));
  } catch (error) {
    return Promise.reject(error);
  }
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function hostOf(url) {
  if (!url) return '';
  try {
    return new URL(url).host.replace(/^www\./i, '');
  } catch (error) {
    return String(url).replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
  }
}

function isHttpUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

function isProbablyUrl(value) {
  const str = value.trim();
  if (!str || /\s/.test(str)) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(str)) return true;
  if (/^localhost(:\d+)?([/?#]|$)/i.test(str)) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?([/?#]|$)/.test(str)) return true;
  return /^[^\s/?#]+\.[^\s/?#]{2,}([/?#].*)?$/i.test(str);
}

function normalizeUrl(raw) {
  const str = String(raw || '').trim();
  if (!str) return null;
  if (/^https?:\/\//i.test(str)) return str;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(str)) {
    return getEngine().search + encodeURIComponent(str);
  }
  const hostPort = /^[^:\/?#]+:\d+([\/?#]|$)/.test(str);
  if (/^[a-z][a-z0-9+.-]*:/i.test(str) && !hostPort) {
    return getEngine().search + encodeURIComponent(str);
  }
  if (isProbablyUrl(str)) {
    if (/^localhost(:\d+)?([\/?#]|$)/i.test(str) || /^\d{1,3}(\.\d{1,3}){3}(:\d+)?([\/?#]|$)/.test(str)) {
      return 'http://' + str;
    }
    return 'https://' + str.replace(/^\/+/, '');
  }
  return getEngine().search + encodeURIComponent(str);
}

function getEngine() {
  return ENGINES[settings.searchEngine] || ENGINES.duckduckgo;
}

function getHomePage() {
  const custom = String(settings.homePage || '').trim();
  if (custom) {
    if (/^https?:\/\//i.test(custom)) return custom;
    const hostPort = /^[^:\/?#]+:\d+([\/?#]|$)/.test(custom);
    if (isProbablyUrl(custom) && (!/^[a-z][a-z0-9+.-]*:/i.test(custom) || hostPort)) {
      if (/^localhost(:\d+)?([\/?#]|$)/i.test(custom) || /^\d{1,3}(\.\d{1,3}){3}(:\d+)?([\/?#]|$)/.test(custom)) {
        return 'http://' + custom;
      }
      return 'https://' + custom.replace(/^\/+/, '');
    }
  }
  return getEngine().home;
}

function displayUrl(url) {
  if (!url) return '';
  if (settings.showFullUrl) return url;
  try {
    const parsed = new URL(url);
    const engine = Object.values(ENGINES).find((item) => parsed.href.indexOf(item.search) === 0);
    if (engine) {
      const query = parsed.searchParams.get('q');
      if (query) return query;
    }
    const host = parsed.host.replace(/^www\./i, '');
    const path = parsed.pathname === '/' ? '' : parsed.pathname;
    return host + path + parsed.search + parsed.hash;
  } catch (error) {
    return String(url).replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  }
}

function formatTime(timestamp) {
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    return '';
  }
}

function dayKey(timestamp) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(timestamp) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (timestamp >= startToday) return 'Today';
  if (timestamp >= startToday - 86400000) return 'Yesterday';
  return new Date(timestamp).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value <= 0) return '';
  if (value < 1024) return value + ' B';
  if (value < 1048576) return (value / 1024).toFixed(1) + ' KB';
  if (value < 1073741824) return (value / 1048576).toFixed(1) + ' MB';
  return (value / 1073741824).toFixed(2) + ' GB';
}

function faviconMarkup(url) {
  const host = hostOf(url);
  const data = host ? favicons[host] : null;
  if (data) {
    return `<span class="favicon"><img src="${escapeHtml(data)}" alt=""></span>`;
  }
  const letter = (host.replace(/^www\./i, '')[0] || '?').toUpperCase();
  return `<span class="favicon">${escapeHtml(letter)}</span>`;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function iconNode(name, className = 'icon') {
  const wrapper = document.createElement('span');
  wrapper.innerHTML = svgIcon(name, className);
  return wrapper.firstElementChild;
}

/* ----------------------------------------------------------------- Store */

const Store = {
  async hydrate() {
    const plugin = getPlugin();
    let native = {};
    if (plugin && typeof plugin.storageGetAll === 'function') {
      try {
        native = (await plugin.storageGetAll({})) || {};
      } catch (error) {
        native = {};
      }
    }

    const read = (key, fallback) => {
      if (native && typeof native[key] === 'string') {
        try {
          return JSON.parse(native[key]);
        } catch (error) {
          /* fall through to local cache */
        }
      }
      try {
        const raw = localStorage.getItem('4k.' + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (error) {
        return fallback;
      }
    };

    settings = Object.assign({}, DEFAULT_SETTINGS, read('settings', {}));
    history = read('history', []);
    bookmarks = read('bookmarks', []);
    favicons = read('favicons', {});
    session = read('session', { tabs: [], activeIndex: 0 });

    if (!Array.isArray(history)) history = [];
    if (!Array.isArray(bookmarks)) bookmarks = [];
    if (!favicons || typeof favicons !== 'object' || Array.isArray(favicons)) favicons = {};
    if (!session || !Array.isArray(session.tabs)) session = { tabs: [], activeIndex: 0 };

    migrateLegacy(native);

    this.save('settings');
    this.save('history');
    this.save('bookmarks');
    this.save('favicons');
    this.save('session');
  },

  save(key) {
    let value;
    if (key === 'settings') value = settings;
    else if (key === 'history') value = history;
    else if (key === 'bookmarks') value = bookmarks;
    else if (key === 'favicons') value = favicons;
    else if (key === 'session') value = session;
    else return;

    let json;
    try {
      json = JSON.stringify(value);
    } catch (error) {
      return;
    }

    try {
      localStorage.setItem('4k.' + key, json);
    } catch (error) {
      /* localStorage can be unavailable; native storage is authoritative. */
    }

    const plugin = getPlugin();
    if (plugin && typeof plugin.storageSet === 'function') {
      try {
        plugin.storageSet({ key, value: json }).catch(() => {});
      } catch (error) {
        /* ignore */
      }
    }
  }
};

function migrateLegacy(native) {
  if (native && Object.keys(native).length) return;

  const legacyTheme = localStorage.getItem('theme');
  if (legacyTheme === 'light' || legacyTheme === 'dark' || legacyTheme === 'amoled') {
    settings.theme = legacyTheme;
  }
  const legacyEngine = localStorage.getItem('searchEngine');
  if (legacyEngine && ENGINES[legacyEngine]) settings.searchEngine = legacyEngine;
  const legacyHome = localStorage.getItem('homePage');
  if (legacyHome) settings.homePage = legacyHome;
  if (localStorage.getItem('webDarkMode') === 'on') settings.webDarkMode = true;
  if (localStorage.getItem('searchSuggestions') === 'off') settings.suggestions = false;

  try {
    const legacyHistory = JSON.parse(localStorage.getItem('browserHistory') || '[]');
    if (Array.isArray(legacyHistory) && legacyHistory.length) {
      history = legacyHistory
        .filter((item) => item && isHttpUrl(item.url))
        .map((item, index) => ({
          id: Number.isFinite(item.id) ? item.id : Date.now() + index,
          url: item.url,
          title: item.title || '',
          timestamp: Number.isFinite(item.timestamp) ? item.timestamp : Date.now()
        }));
    }
  } catch (error) {
    /* ignore */
  }

  try {
    const legacyTabs = JSON.parse(localStorage.getItem('openTabs') || '[]');
    if (Array.isArray(legacyTabs) && legacyTabs.length) {
      const restored = legacyTabs
        .filter((tab) => tab && isHttpUrl(tab.url))
        .map((tab) => ({ url: tab.url, title: tab.title || '' }));
      if (restored.length) session = { tabs: restored, activeIndex: 0 };
    }
  } catch (error) {
    /* ignore */
  }
}

/* --------------------------------------------------------------- Display */

function resolveTheme() {
  if (settings.theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return settings.theme;
}

function applyTheme() {
  const theme = resolveTheme();
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#09090b');
  }
}

function applyDensity() {
  document.documentElement.setAttribute('data-density', settings.density === 'compact' ? 'compact' : 'comfortable');
}

function themeLabel() {
  return ({ system: 'System', light: 'Light', dark: 'Dark', amoled: 'AMOLED' })[settings.theme] || 'System';
}

function densityLabel() {
  return settings.density === 'compact' ? 'Compact' : 'Comfortable';
}

function cookiesLabel() {
  return ({
    all: 'Allow all',
    thirdparty: 'Block third-party',
    none: 'Block all'
  })[settings.cookies] || 'Allow all';
}

function startupLabel() {
  return settings.startup === 'home' ? 'Open homepage' : 'Restore last session';
}

function engineLabel() {
  return getEngine().label;
}

function setSecurityIcon(url) {
  let name = 'globe';
  if (/^https:/i.test(url)) name = 'lock';
  else if (/^http:/i.test(url)) name = 'warning';
  dom.securityIcon.innerHTML = svgIcon(name);
  dom.siteInfoBtn.setAttribute(
    'aria-label',
    name === 'lock' ? 'Connection is secure' : name === 'warning' ? 'Not secure' : 'Site information'
  );
}

function setNav(canBack, canForward) {
  navCanBack = !!canBack;
  navCanForward = !!canForward;
  dom.backBtn.disabled = !navCanBack;
  dom.forwardBtn.disabled = !navCanForward;
}

function setLoading(isLoading) {
  const next = !!isLoading;
  const was = loading;
  loading = next;
  window.clearTimeout(loadingTimer);

  if (next) {
    if (!was) {
      dom.progressBar.style.width = '6%';
      dom.progressBar.style.opacity = '0.9';
    }
    loadingTimer = window.setTimeout(() => {
      if (loading) setLoading(false);
    }, 12000);
  } else if (was) {
    dom.progressBar.style.width = '100%';
    window.setTimeout(() => {
      if (!loading) dom.progressBar.style.width = '0';
    }, 240);
  }

  dom.reloadIcon.classList.toggle('hidden', next);
  dom.stopIcon.classList.toggle('hidden', !next);
  dom.reloadBtn.setAttribute('aria-label', next ? 'Stop loading' : 'Reload page');
}

function toast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => dom.toast.classList.remove('show'), 2200);
}

function activeTab() {
  return tabs.find((tab) => tab.id === activeTabId) || null;
}

function updateTabBadge() {
  const count = tabs.length;
  dom.tabsBadge.textContent = String(count);
  dom.tabsBadge.classList.toggle('hidden', count === 0);
  dom.tabSheetCount.textContent = String(count);
}

function updateMenuCounts() {
  dom.menuHistoryCount.textContent = history.length ? String(history.length) : '';
  dom.menuBookmarksCount.textContent = bookmarks.length ? String(bookmarks.length) : '';
}

function updateMenuBookmark() {
  const saved = isHttpUrl(currentUrl) && bookmarks.some((item) => item.url === currentUrl);
  dom.menuBookmarkLabel.textContent = saved ? 'Remove bookmark' : 'Bookmark this page';
}

function syncActiveTabUi() {
  const tab = activeTab();
  currentUrl = tab && tab.url ? tab.url : '';
  currentTitle = tab && tab.title ? tab.title : '';
  document.title = currentTitle ? currentTitle + ' · 4Keeper' : '4Keeper';
  if (document.activeElement !== dom.urlInput) {
    dom.urlInput.value = currentUrl ? displayUrl(currentUrl) : '';
  }
  dom.clearUrlBtn.classList.toggle('hidden', !dom.urlInput.value);
  setSecurityIcon(currentUrl);
  dom.startScreen.classList.toggle('is-hidden', !!currentUrl || overlays.size > 0);
  updateMenuBookmark();
  if (overlays.has('siteInfo')) renderSiteInfo();
}

function updateTabMeta(tabId, patch) {
  const tab = tabs.find((item) => item.id === tabId);
  if (!tab || !patch) return;
  if (typeof patch.url === 'string' && patch.url) tab.url = patch.url;
  if (typeof patch.title === 'string') tab.title = patch.title;
  if (typeof patch.canGoBack === 'boolean') tab.canGoBack = patch.canGoBack;
  if (typeof patch.canGoForward === 'boolean') tab.canGoForward = patch.canGoForward;
}

/* ---------------------------------------------------------- Native layer */

function setNativeVisible(visible) {
  const plugin = getPlugin();
  if (!plugin) return;
  const method = plugin.setVisibility || plugin.setWebViewVisibility || plugin.setVisible;
  if (typeof method !== 'function') return;
  try {
    Promise.resolve(method.call(plugin, { visible })).catch(() => {});
  } catch (error) {
    /* ignore */
  }
}

let snapshotPromise = null;
let snapshotVisible = false;
let snapshotToken = 0;

function showSnapshot() {
  if (snapshotVisible) return Promise.resolve();
  if (snapshotPromise) return snapshotPromise;
  const plugin = getPlugin();
  const tab = activeTab();
  if (!plugin || !tab || !isHttpUrl(tab.url) || typeof plugin.captureScreenshot !== 'function') {
    return Promise.resolve();
  }
  const token = snapshotToken;
  snapshotPromise = Promise.resolve(plugin.captureScreenshot({}))
    .then((result) => {
      if (token !== snapshotToken || overlays.size === 0) return;
      const data = result && result.data;
      if (!data) return;
      dom.webviewSnapshot.src = data.indexOf('data:') === 0 ? data : 'data:image/png;base64,' + data;
      dom.webviewSnapshot.classList.remove('hidden');
      snapshotVisible = true;
    })
    .catch(() => {})
    .finally(() => {
      snapshotPromise = null;
    });
  return snapshotPromise;
}

function hideSnapshot() {
  snapshotToken++;
  snapshotPromise = null;
  snapshotVisible = false;
  dom.webviewSnapshot.classList.add('hidden');
  dom.webviewSnapshot.removeAttribute('src');
}

function syncNativeVisibility() {
  const overlay = overlays.size > 0;
  document.body.classList.toggle('overlay-open', overlay);
  const tab = activeTab();
  const hasPage = !!(tab && isHttpUrl(tab.url));

  if (overlay) {
    if (hasPage) {
      showSnapshot().then(() => {
        if (overlays.size > 0) setNativeVisible(false);
      });
    } else {
      setNativeVisible(false);
    }
  } else {
    hideSnapshot();
    setNativeVisible(hasPage);
    window.setTimeout(() => {
      if (overlays.size === 0) mountBrowser();
    }, 80);
  }

  dom.startScreen.classList.toggle('is-hidden', hasPage || overlay);
}

/* -------------------------------------------------------------- Shells */

function openSheet(name, sheet, backdrop) {
  overlays.add(name);
  sheet.classList.add('open');
  sheet.setAttribute('aria-hidden', 'false');
  backdrop.classList.add('open');
  syncNativeVisibility();
}

function closeSheet(name, sheet, backdrop) {
  overlays.delete(name);
  sheet.classList.remove('open');
  sheet.setAttribute('aria-hidden', 'true');
  backdrop.classList.remove('open');
  syncNativeVisibility();
}

function openScreen(name, screen) {
  overlays.add(name);
  hideSuggestions();
  screen.classList.add('open');
  screen.setAttribute('aria-hidden', 'false');
  syncNativeVisibility();
}

function closeScreen(name, screen) {
  overlays.delete(name);
  screen.classList.remove('open');
  screen.setAttribute('aria-hidden', 'true');
  syncNativeVisibility();
}

function closeOtherSheets(keep) {
  if (keep !== 'tabs') closeTabSheet();
  if (keep !== 'menu') closeMenu();
  if (keep !== 'siteInfo') closeSiteInfo();
  if (keep !== 'choice') closeChoice();
}

function openTabSheet() {
  overlays.add('tabs');
  hideSuggestions();
  dom.tabSheet.classList.add('open');
  dom.tabSheet.setAttribute('aria-hidden', 'false');
  dom.tabSheetBackdrop.classList.add('open');
  closeOtherSheets('tabs');
  renderTabs();
  syncNativeVisibility();
}

function closeTabSheet() {
  closeSheet('tabs', dom.tabSheet, dom.tabSheetBackdrop);
}

function openMenu() {
  overlays.add('menu');
  hideSuggestions();
  dom.menuSheet.classList.add('open');
  dom.menuSheet.setAttribute('aria-hidden', 'false');
  dom.menuBackdrop.classList.add('open');
  dom.menuBtn.setAttribute('aria-expanded', 'true');
  closeOtherSheets('menu');
  updateMenuCounts();
  updateMenuBookmark();
  syncNativeVisibility();
}

function closeMenu() {
  dom.menuBtn.setAttribute('aria-expanded', 'false');
  closeSheet('menu', dom.menuSheet, dom.menuBackdrop);
}

function openSiteInfo() {
  overlays.add('siteInfo');
  hideSuggestions();
  dom.siteInfoSheet.classList.add('open');
  dom.siteInfoSheet.setAttribute('aria-hidden', 'false');
  dom.siteInfoBackdrop.classList.add('open');
  closeOtherSheets('siteInfo');
  renderSiteInfo();
  syncNativeVisibility();
}

function closeSiteInfo() {
  closeSheet('siteInfo', dom.siteInfoSheet, dom.siteInfoBackdrop);
}

/* -------------------------------------------------------------- Choices */

function openChoice(title, options, current, onSelect) {
  overlays.add('choice');
  hideSuggestions();
  dom.choiceTitle.textContent = title;
  dom.choiceList.innerHTML = '';

  options.forEach((option) => {
    const selected = option.value === current;
    const button = el('button', 'choice-option' + (selected ? ' is-selected' : ''));
    button.type = 'button';
    const text = el('span', 'choice-text');
    text.appendChild(el('span', '', option.label));
    if (option.desc) text.appendChild(el('span', 'choice-desc', option.desc));
    const check = el('span', 'choice-check');
    check.innerHTML = svgIcon('check', 'icon icon-sm');
    button.append(text, check);
    button.addEventListener('click', () => {
      closeChoice();
      onSelect(option.value);
    });
    dom.choiceList.appendChild(button);
  });

  dom.choiceSheet.classList.add('open');
  dom.choiceSheet.setAttribute('aria-hidden', 'false');
  dom.choiceBackdrop.classList.add('open');
  closeOtherSheets('choice');
  syncNativeVisibility();
}

function closeChoice() {
  closeSheet('choice', dom.choiceSheet, dom.choiceBackdrop);
}

/* --------------------------------------------------------------- Dialog */

function openDialog(options) {
  overlays.add('dialog');
  hideSuggestions();
  dialogState = options;
  dialogBusy = false;
  dom.dialogTitle.textContent = options.title || '';
  dom.dialogMessage.textContent = options.message || '';
  dom.dialogMessage.classList.toggle('hidden', !options.message);
  dom.dialogBody.innerHTML = '';
  if (typeof options.body === 'function') options.body(dom.dialogBody);
  else if (typeof options.body === 'string') dom.dialogBody.innerHTML = options.body;

  dom.dialogCancel.classList.toggle('hidden', options.singleAction === true);
  dom.dialogCancel.textContent = options.cancelLabel || 'Cancel';
  dom.dialogConfirm.textContent = options.confirmLabel || 'OK';
  dom.dialogConfirm.className = 'btn ' + (options.destructive ? 'btn-danger' : 'btn-primary');
  dom.dialogConfirm.disabled = false;

  dom.dialog.classList.add('open');
  dom.dialog.setAttribute('aria-hidden', 'false');
  dom.dialogBackdrop.classList.add('open');
  syncNativeVisibility();
}

function closeDialog() {
  if (dialogBusy) return;
  overlays.delete('dialog');
  dom.dialog.classList.remove('open');
  dom.dialog.setAttribute('aria-hidden', 'true');
  dom.dialogBackdrop.classList.remove('open');
  dialogState = null;
  syncNativeVisibility();
}

async function confirmDialog() {
  if (dialogBusy || !dialogState) return;
  const state = dialogState;
  if (typeof state.onConfirm !== 'function') {
    closeDialog();
    return;
  }
  dialogBusy = true;
  dom.dialogConfirm.disabled = true;
  try {
    const result = await state.onConfirm();
    if (result !== false) {
      dialogBusy = false;
      closeDialog();
    } else {
      dom.dialogConfirm.disabled = false;
    }
  } catch (error) {
    toast(error && error.message ? error.message : 'Something went wrong');
    dom.dialogConfirm.disabled = false;
  } finally {
    dialogBusy = false;
  }
}

/* ------------------------------------------------------------ Native sync */

function pushNativeSettings(reload) {
  const plugin = getPlugin();
  if (!plugin || typeof plugin.applySettings !== 'function') return Promise.resolve();
  const payload = {
    javaScriptEnabled: !!settings.javaScript,
    cookiesMode: settings.cookies,
    popups: !!settings.popups,
    textZoom: Number(settings.textZoom) || 100,
    desktopMode: !!settings.desktopMode,
    safeBrowsing: !!settings.safeBrowsing,
    darkMode: !!settings.webDarkMode,
    trackingProtection: !!settings.trackingProtection,
    zoomControls: !!settings.zoomControls,
    pinchZoom: !!settings.pinchZoom,
    downloadNotifications: !!settings.downloadNotifications
  };
  return Promise.resolve(plugin.applySettings(payload))
    .then(() => {
      if (reload) return plugin.reload();
      return null;
    })
    .catch(() => {});
}

const NATIVE_SETTING_KEYS = [
  'javaScript',
  'cookies',
  'popups',
  'textZoom',
  'desktopMode',
  'safeBrowsing',
  'webDarkMode',
  'trackingProtection',
  'zoomControls',
  'pinchZoom',
  'downloadNotifications'
];

function updateSetting(patch, options) {
  const opts = options || {};
  settings = Object.assign({}, settings, patch);
  Store.save('settings');
  applyTheme();
  applyDensity();
  if (NATIVE_SETTING_KEYS.some((key) => patch[key] !== undefined)) {
    pushNativeSettings(!!opts.reload);
  }
  if (opts.rerender) rerenderSettings();
  if (opts.toastMessage) toast(opts.toastMessage);
  if (patch.showFullUrl !== undefined) syncActiveTabUi();
  if (patch.suggestions !== undefined && !settings.suggestions) hideSuggestions();
}

/* ------------------------------------------------------------------ Tabs */

async function mountBrowser(force) {
  const plugin = getPlugin();
  if (!plugin || typeof plugin.mount !== 'function') return;
  const rect = dom.browserContainer.getBoundingClientRect();
  const bounds = {
    x: Math.round(rect.left),
    y: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
  const key = JSON.stringify(bounds);
  if (!force && key === lastBoundsKey) return;
  lastBoundsKey = key;
  try {
    await plugin.mount(bounds);
  } catch (error) {
    lastBoundsKey = '';
  }
}

async function refreshTabs() {
  const plugin = getPlugin();
  if (!plugin) return;
  try {
    const result = await plugin.getTabs();
    tabs = Array.isArray(result && result.tabs) ? result.tabs : [];
    activeTabId = result && typeof result.activeTabId === 'number' ? result.activeTabId : -1;
  } catch (error) {
    tabs = [];
    activeTabId = -1;
  }
  syncActiveTabUi();
  updateTabBadge();
  renderTabs();
  syncNativeVisibility();
  scheduleSessionSave();
}

function scheduleSessionSave() {
  window.clearTimeout(sessionTimer);
  sessionTimer = window.setTimeout(saveSession, 350);
}

function saveSession() {
  const saved = [];
  let activeIndex = 0;
  tabs.forEach((tab) => {
    if (!isHttpUrl(tab.url)) return;
    if (tab.id === activeTabId) activeIndex = saved.length;
    saved.push({ url: tab.url, title: tab.title || '' });
  });
  session = { tabs: saved, activeIndex };
  Store.save('session');
}

async function syncNav() {
  const plugin = getPlugin();
  if (!plugin) {
    setNav(false, false);
    return;
  }
  try {
    const state = await plugin.getNavigationState();
    setNav(!!(state && state.canGoBack), !!(state && state.canGoForward));
  } catch (error) {
    setNav(false, false);
  }
}

function renderTabs() {
  updateTabBadge();
  dom.tabsEmpty.classList.toggle('hidden', tabs.length > 0);

  dom.tabsList.innerHTML = tabs
    .map((tab) => {
      const isActive = tab.id === activeTabId;
      const title = tab.title || 'New tab';
      const url = displayUrl(tab.url) || 'No page loaded';
      return `
        <div class="tab-card${isActive ? ' is-active' : ''}" role="button" tabindex="0" data-tab-id="${tab.id}" aria-label="${escapeHtml(title)}">
          <div class="tab-card-head">
            ${faviconMarkup(tab.url)}
            <span class="tab-card-title">${escapeHtml(title)}</span>
            <button class="tab-card-close" type="button" data-close-tab="${tab.id}" aria-label="Close tab">
              ${svgIcon('close', 'icon icon-xs')}
            </button>
          </div>
          <div class="tab-card-url">${escapeHtml(url)}</div>
          <div class="tab-card-foot">
            ${isActive
              ? '<span class="tab-active-dot"></span><span>Active</span>'
              : `<span>${escapeHtml(hostOf(tab.url) || 'Tab')}</span>`}
          </div>
        </div>`;
    })
    .join('');
}

async function createTabWithUrl(url, activate) {
  await mountBrowser();
  const target = url || getHomePage();
  const shouldActivate = activate !== false;
  try {
    if (shouldActivate) await callPlugin('createTab', { url: target, activate: true });
    else await callPlugin('createTab', { url: target, activate: false });
  } catch (error) {
    toast('Could not open a tab');
    return;
  }
  await refreshTabs();
  if (shouldActivate) {
    setLoading(true);
    dom.startScreen.classList.add('is-hidden');
    syncActiveTabUi();
    syncNav();
    const tab = activeTab();
    if (tab && isHttpUrl(tab.url)) addHistoryEntry(tab.url, tab.title);
  }
}

async function navigate(raw) {
  const url = normalizeUrl(raw);
  if (!url) return;

  hideSuggestions();
  closeTabSheet();
  closeMenu();
  closeSiteInfo();

  await mountBrowser();
  const tab = activeTab();
  dom.startScreen.classList.add('is-hidden');
  setLoading(true);

  try {
    if (!tab) {
      await callPlugin('createTab', { url, activate: true });
    } else {
      await callPlugin('loadUrl', { url });
    }
  } catch (error) {
    setLoading(false);
    toast('Could not open this address');
    return;
  }

  if (document.activeElement === dom.urlInput) dom.urlInput.blur();
  currentUrl = url;
  setSecurityIcon(url);
  await refreshTabs();
  syncActiveTabUi();
  syncNav();
  saveSession();
}

async function goBack() {
  if (!tabs.length || !navCanBack) return;
  try {
    await callPlugin('goBack');
  } catch (error) {
    return;
  }
  setLoading(true);
  window.setTimeout(syncNav, 250);
}

async function goForward() {
  if (!tabs.length || !navCanForward) return;
  try {
    await callPlugin('goForward');
  } catch (error) {
    return;
  }
  setLoading(true);
  window.setTimeout(syncNav, 250);
}

async function goHome() {
  await navigate(getHomePage());
}

async function newTab(url) {
  await createTabWithUrl(url || getHomePage(), true);
  closeTabSheet();
  closeMenu();
}

async function switchTab(id) {
  try {
    await callPlugin('switchTab', { id });
  } catch (error) {
    toast('Could not switch tabs');
    return;
  }
  closeTabSheet();
  closeMenu();
  await refreshTabs();
  syncActiveTabUi();
  syncNav();
  setLoading(false);
  saveSession();
}

async function closeTab(id) {
  try {
    await callPlugin('closeTab', { id });
  } catch (error) {
    toast('Could not close the tab');
    return;
  }
  await refreshTabs();
  if (!tabs.length) {
    await createTabWithUrl(getHomePage(), true);
  }
  syncActiveTabUi();
  syncNav();
  saveSession();
}

async function closeAllTabs() {
  try {
    await callPlugin('closeAllTabs', { url: getHomePage() });
  } catch (error) {
    toast('Could not close tabs');
    return;
  }
  await refreshTabs();
  syncActiveTabUi();
  syncNav();
  saveSession();
}

/* ------------------------------------------------------------ Suggestions */

function hideSuggestions() {
  window.clearTimeout(suggestionTimer);
  suggestionTimer = null;
  suggestionRequest++;
  if (overlays.has('suggestions')) {
    overlays.delete('suggestions');
  }
  dom.suggestions.classList.add('hidden');
  dom.suggestionsList.innerHTML = '';
  suggestionItems = [];
  syncNativeVisibility();
}

function parseSuggestions(data, engine) {
  if (engine === 'brave') {
    if (data && Array.isArray(data.q)) return data.q.filter((item) => typeof item === 'string');
    if (data && Array.isArray(data.results)) return data.results.map((item) => item.query || item.q).filter(Boolean);
    return [];
  }
  if (Array.isArray(data) && Array.isArray(data[1])) return data[1].filter((item) => typeof item === 'string');
  if (Array.isArray(data)) {
    return data.map((item) => (typeof item === 'string' ? item : item && (item.phrase || item.query))).filter(Boolean);
  }
  return [];
}

function localSuggestions(query) {
  const q = query.toLowerCase();
  const results = [];
  const seen = new Set();
  const add = (url, title, hint) => {
    if (!isHttpUrl(url) || seen.has(url)) return;
    const haystack = ((title || '') + ' ' + url).toLowerCase();
    if (!haystack.includes(q)) return;
    seen.add(url);
    results.push({ url, text: title || displayUrl(url), hint });
  };
  bookmarks.forEach((item) => add(item.url, item.title, 'Bookmark'));
  history.forEach((item) => add(item.url, item.title, 'History'));
  return results.slice(0, 5);
}

function showSuggestionItems(items) {
  suggestionItems = items;
  if (!items.length) {
    dom.suggestionsList.innerHTML = '';
    dom.suggestions.classList.add('hidden');
    if (overlays.has('suggestions')) {
      overlays.delete('suggestions');
      syncNativeVisibility();
    }
    return;
  }
  dom.suggestionsList.innerHTML = items
    .map((item, index) => `
      <button class="suggestion" type="button" role="option" data-index="${index}">
        ${svgIcon(item.url ? 'link' : 'search', 'icon icon-sm')}
        <span class="suggestion-text">${escapeHtml(item.text)}</span>
        ${item.hint ? `<span class="suggestion-hint">${escapeHtml(item.hint)}</span>` : ''}
      </button>`)
    .join('');
  dom.suggestions.classList.remove('hidden');
  if (!overlays.has('suggestions')) {
    overlays.add('suggestions');
    syncNativeVisibility();
  }
}

async function fetchSuggestions(query) {
  const engine = getEngine();
  const local = localSuggestions(query);
  showSuggestionItems(local);
  if (!engine.suggest) return;

  const requestId = ++suggestionRequest;
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = window.setTimeout(() => controller && controller.abort(), 3000);
    const response = await fetch(engine.suggest(query), controller ? { signal: controller.signal } : undefined);
    window.clearTimeout(timeout);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    if (requestId !== suggestionRequest) return;

    const merged = local.slice();
    const seen = new Set(merged.map((item) => item.text.toLowerCase()));
    parseSuggestions(data, settings.searchEngine).forEach((text) => {
      const key = String(text).toLowerCase();
      if (!text || seen.has(key)) return;
      seen.add(key);
      merged.push({ text: String(text), hint: '' });
    });
    showSuggestionItems(merged.slice(0, 8));
  } catch (error) {
    if (requestId === suggestionRequest && !suggestionItems.length) hideSuggestions();
  }
}

function scheduleSuggestions() {
  window.clearTimeout(suggestionTimer);
  suggestionRequest++;
  const query = dom.urlInput.value.trim();
  dom.clearUrlBtn.classList.toggle('hidden', !query);
  if (!settings.suggestions || !query || isProbablyUrl(query)) {
    hideSuggestions();
    return;
  }
  suggestionTimer = window.setTimeout(() => fetchSuggestions(query), 240);
}

/* --------------------------------------------------------------- History */

function addHistoryEntry(url, title) {
  if (!isHttpUrl(url)) return;
  const now = Date.now();
  const recent = history[0];
  if (recent && recent.url === url && now - recent.timestamp < 60000) {
    recent.timestamp = now;
    if (title) recent.title = title;
  } else {
    history.unshift({
      id: now + Math.floor(Math.random() * 1000),
      url,
      title: title || hostOf(url),
      timestamp: now
    });
  }
  if (history.length > 500) history.length = 500;
  Store.save('history');
  updateMenuCounts();
}

function removeHistoryEntry(id) {
  history = history.filter((item) => item.id !== id);
  Store.save('history');
  renderHistory();
  updateMenuCounts();
}

function clearHistory() {
  openDialog({
    title: 'Clear browsing history?',
    message: 'Your saved history on this device will be removed. Bookmarks and settings stay.',
    confirmLabel: 'Clear history',
    destructive: true,
    onConfirm: () => {
      history = [];
      Store.save('history');
      renderHistory();
      updateMenuCounts();
      toast('History cleared');
    }
  });
}

function renderHistory() {
  const query = (dom.historySearch.value || '').trim().toLowerCase();
  const items = history.filter((item) => {
    if (!query) return true;
    return (item.title || '').toLowerCase().includes(query) || (item.url || '').toLowerCase().includes(query);
  });

  dom.historyCount.textContent = history.length
    ? `${history.length} ${history.length === 1 ? 'entry' : 'entries'}`
    : '';
  dom.clearHistoryBtn.classList.toggle('hidden', history.length === 0);

  if (!items.length) {
    dom.historyList.innerHTML = `
      <div class="empty">
        ${svgIcon('history', 'empty-icon')}
        <div class="empty-title">${query ? 'No matching history' : 'No history yet'}</div>
        <div class="empty-text">${query ? 'Try a different search.' : 'Pages you visit will appear here.'}</div>
      </div>`;
    return;
  }

  let html = '';
  let lastDay = null;
  items.forEach((item) => {
    const key = dayKey(item.timestamp);
    if (key !== lastDay) {
      lastDay = key;
      html += `<div class="list-section-title">${escapeHtml(dayLabel(item.timestamp))}</div>`;
    }
    html += `
      <div class="list-item" data-history-open="${item.id}">
        ${faviconMarkup(item.url)}
        <div class="list-text">
          <div class="list-title">${escapeHtml(item.title || hostOf(item.url))}</div>
          <div class="list-subtitle">${escapeHtml(displayUrl(item.url))}</div>
        </div>
        <div class="list-meta">
          <span class="list-time">${escapeHtml(formatTime(item.timestamp))}</span>
          <button class="icon-btn icon-btn-sm" type="button" data-history-delete="${item.id}" aria-label="Delete entry">
            ${svgIcon('close', 'icon icon-xs')}
          </button>
        </div>
      </div>`;
  });
  dom.historyList.innerHTML = html;
}

function openHistory() {
  dom.historySearch.value = '';
  renderHistory();
  openScreen('history', dom.historyScreen);
  closeMenu();
}

function closeHistory() {
  closeScreen('history', dom.historyScreen);
}

/* ------------------------------------------------------------- Bookmarks */

function isBookmarked(url) {
  return isHttpUrl(url) && bookmarks.some((item) => item.url === url);
}

function toggleBookmark() {
  if (!isHttpUrl(currentUrl)) {
    toast('Open a page to bookmark it');
    return;
  }
  if (isBookmarked(currentUrl)) {
    bookmarks = bookmarks.filter((item) => item.url !== currentUrl);
    Store.save('bookmarks');
    toast('Bookmark removed');
  } else {
    bookmarks.unshift({
      id: Date.now(),
      url: currentUrl,
      title: currentTitle || hostOf(currentUrl),
      timestamp: Date.now()
    });
    Store.save('bookmarks');
    toast('Bookmark added');
  }
  updateMenuCounts();
  updateMenuBookmark();
  if (overlays.has('bookmarks')) renderBookmarks();
}

function removeBookmark(id) {
  bookmarks = bookmarks.filter((item) => item.id !== id);
  Store.save('bookmarks');
  renderBookmarks();
  updateMenuCounts();
  updateMenuBookmark();
}

function renderBookmarks() {
  const query = (dom.bookmarksSearch.value || '').trim().toLowerCase();
  const items = bookmarks.filter((item) => {
    if (!query) return true;
    return (item.title || '').toLowerCase().includes(query) || (item.url || '').toLowerCase().includes(query);
  });

  dom.bookmarksCount.textContent = bookmarks.length
    ? `${bookmarks.length} ${bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}`
    : '';

  if (!items.length) {
    dom.bookmarksList.innerHTML = `
      <div class="empty">
        ${svgIcon('bookmark', 'empty-icon')}
        <div class="empty-title">${query ? 'No matching bookmarks' : 'No bookmarks yet'}</div>
        <div class="empty-text">${query ? 'Try a different search.' : 'Use the menu to bookmark the page you are on.'}</div>
      </div>`;
    return;
  }

  dom.bookmarksList.innerHTML = items
    .map((item) => `
      <div class="list-item" data-bookmark-open="${item.id}">
        ${faviconMarkup(item.url)}
        <div class="list-text">
          <div class="list-title">${escapeHtml(item.title || hostOf(item.url))}</div>
          <div class="list-subtitle">${escapeHtml(displayUrl(item.url))}</div>
        </div>
        <button class="icon-btn icon-btn-sm" type="button" data-bookmark-delete="${item.id}" aria-label="Remove bookmark">
          ${svgIcon('close', 'icon icon-xs')}
        </button>
      </div>`)
    .join('');
}

function openBookmarks() {
  dom.bookmarksSearch.value = '';
  renderBookmarks();
  openScreen('bookmarks', dom.bookmarksScreen);
  closeMenu();
}

function closeBookmarks() {
  closeScreen('bookmarks', dom.bookmarksScreen);
}

/* ------------------------------------------------------------- Downloads */

function downloadStatus(download) {
  const status = String(download.status || '').toLowerCase();
  if (download.exists === false) return 'File removed';
  if (status === 'successful' || status === 'completed') return 'Downloaded';
  if (status === 'running' || status === 'pending' || status === 'paused') {
    const total = Number(download.totalBytes) || 0;
    const done = Number(download.bytes) || 0;
    if (total > 0) return formatBytes(done) + ' of ' + formatBytes(total);
    return 'Downloading';
  }
  if (status === 'failed') return 'Failed';
  return 'Saved';
}

function renderDownloads() {
  if (!downloadsCache.length) {
    dom.downloadsList.innerHTML = `
      <div class="empty">
        ${svgIcon('download', 'empty-icon')}
        <div class="empty-title">No downloads</div>
        <div class="empty-text">Files you download are saved in this app's Downloads folder.</div>
      </div>`;
    return;
  }

  dom.downloadsList.innerHTML = downloadsCache
    .map((item) => {
      const status = String(item.status || '').toLowerCase();
      const failed = status === 'failed' || status === 'unknown';
      const missing = item.exists === false;
      return `
        <div class="list-item download-item">
          <span class="favicon">${svgIcon('download', 'icon icon-sm')}</span>
          <div class="list-text">
            <div class="list-title">${escapeHtml(item.filename || 'Download')}</div>
            <div class="list-subtitle">${escapeHtml(downloadStatus(item))}${item.mime ? ' · ' + escapeHtml(String(item.mime).split('/').pop()) : ''}</div>
          </div>
          <div class="list-actions">
            <button class="icon-btn icon-btn-sm" type="button" data-download-open="${escapeHtml(item.id)}" aria-label="Open download"${failed || missing ? ' disabled' : ''}>
              ${svgIcon('external', 'icon icon-xs')}
            </button>
            <button class="icon-btn icon-btn-sm" type="button" data-download-remove="${escapeHtml(item.id)}" aria-label="Remove download">
              ${svgIcon('trash', 'icon icon-xs')}
            </button>
          </div>
        </div>`;
    })
    .join('');
}

async function loadDownloads() {
  try {
    const result = await callPlugin('getDownloads');
    downloadsCache = Array.isArray(result && result.items) ? result.items : [];
  } catch (error) {
    downloadsCache = [];
  }
  renderDownloads();
}

function openDownloads() {
  openScreen('downloads', dom.downloadsScreen);
  closeMenu();
  loadDownloads();
}

function closeDownloads() {
  closeScreen('downloads', dom.downloadsScreen);
}

async function openDownloadFile(id) {
  try {
    await callPlugin('openDownload', { id });
  } catch (error) {
    toast('Could not open this file');
  }
}

async function removeDownloadFile(id) {
  try {
    await callPlugin('removeDownload', { id });
  } catch (error) {
    toast('Could not remove this download');
    return;
  }
  loadDownloads();
}

/* ------------------------------------------------------------- Site info */

function renderSiteInfo() {
  const url = currentUrl;
  if (!url) {
    dom.siteInfoContent.innerHTML = `
      <div class="empty">
        ${svgIcon('globe', 'empty-icon')}
        <div class="empty-title">No page open</div>
        <div class="empty-text">Open a page to see connection details.</div>
      </div>`;
    return;
  }

  let parsed = null;
  try {
    parsed = new URL(url);
  } catch (error) {
    parsed = null;
  }

  const secure = /^https:/i.test(url);
  const rows = [
    ['Address', displayUrl(url)],
    ['Host', parsed ? parsed.host : hostOf(url)],
    ['Connection', secure ? 'Encrypted (HTTPS)' : 'Not secure (HTTP)'],
    ['Cookies', cookiesLabel()],
    ['JavaScript', settings.javaScript ? 'Allowed' : 'Blocked'],
    ['Pop-ups', settings.popups ? 'Allowed' : 'Blocked'],
    ['Tracking protection', settings.trackingProtection ? 'On for all sites' : 'Off'],
    ['Web dark mode', settings.webDarkMode ? 'On' : 'Off'],
    ['Desktop site', settings.desktopMode ? 'On' : 'Off'],
    ['Text zoom', (Number(settings.textZoom) || 100) + '%']
  ];

  dom.siteInfoContent.innerHTML = `
    <div class="site-info-host">
      <span class="site-info-badge ${secure ? 'is-secure' : 'is-insecure'}">
        ${svgIcon(secure ? 'lock' : 'warning', 'icon icon-sm')}
      </span>
      <div>
        <div class="site-info-title">${escapeHtml(parsed ? parsed.host : hostOf(url))}</div>
        <div class="site-info-sub">${secure ? 'Connection is secure' : 'Connection is not secure'}</div>
      </div>
    </div>
    <div class="setting-group">
      ${rows
        .map(
          ([label, value]) => `
        <div class="site-info-row">
          <span class="site-info-label">${escapeHtml(label)}</span>
          <span class="site-info-value">${escapeHtml(value)}</span>
        </div>`
        )
        .join('')}
    </div>
    <div class="setting-note">Site settings are applied globally in this version of 4Keeper.</div>`;
}

/* --------------------------------------------------------------- Settings */

function settingsHero(icon, title, description) {
  return `
    <div class="settings-hero">
      <span class="settings-hero-icon">${svgIcon(icon)}</span>
      <div>
        <div class="settings-hero-title">${escapeHtml(title)}</div>
        <div class="settings-hero-text">${escapeHtml(description)}</div>
      </div>
    </div>`;
}

function settingRowButton(icon, label, description, value, action) {
  return `
    <button class="setting-row" type="button" data-action="${escapeHtml(action)}">
      <span class="setting-icon">${svgIcon(icon)}</span>
      <span class="setting-text">
        <span class="setting-label">${escapeHtml(label)}</span>
        ${description ? `<span class="setting-desc">${escapeHtml(description)}</span>` : ''}
      </span>
      <span class="setting-value">${escapeHtml(value || '')}</span>
      ${svgIcon('chevron', 'icon icon-sm setting-chevron')}
    </button>`;
}

function settingRowToggle(key, label, description) {
  const on = !!settings[key];
  return `
    <div class="setting-row">
      <span class="setting-text">
        <span class="setting-label">${escapeHtml(label)}</span>
        ${description ? `<span class="setting-desc">${escapeHtml(description)}</span>` : ''}
      </span>
      <button class="switch${on ? ' is-on' : ''}" type="button" role="switch" aria-checked="${on}" data-toggle="${escapeHtml(key)}" aria-label="${escapeHtml(label)}">
        <span class="switch-thumb"></span>
      </button>
    </div>`;
}

function settingRowAction(icon, label, description, action, danger) {
  return `
    <button class="setting-row${danger ? ' is-danger' : ''}" type="button" data-action="${escapeHtml(action)}">
      <span class="setting-icon">${svgIcon(icon)}</span>
      <span class="setting-text">
        <span class="setting-label">${escapeHtml(label)}</span>
        ${description ? `<span class="setting-desc">${escapeHtml(description)}</span>` : ''}
      </span>
      ${svgIcon('chevron', 'icon icon-sm setting-chevron')}
    </button>`;
}

function settingNavRow(icon, label, description, section) {
  return `
    <button class="setting-row" type="button" data-section="${escapeHtml(section)}">
      <span class="setting-icon">${svgIcon(icon)}</span>
      <span class="setting-text">
        <span class="setting-label">${escapeHtml(label)}</span>
        ${description ? `<span class="setting-desc">${escapeHtml(description)}</span>` : ''}
      </span>
      ${svgIcon('chevron', 'icon icon-sm setting-chevron')}
    </button>`;
}

function renderSettingsRoot() {
  currentSettingsSection = null;
  dom.settingsTitle.textContent = 'Settings';
  dom.settingsRoot.classList.remove('hidden');
  dom.settingsPage.hidden = true;
  dom.settingsPage.classList.add('hidden');
  dom.settingsPage.innerHTML = '';

  dom.settingsRoot.innerHTML = `
    <div class="setting-group">${settingNavRow('palette', 'Appearance', 'Theme, density and address style', 'appearance')}</div>
    <div class="setting-group">${settingNavRow('search', 'Search', 'Search engine, homepage and suggestions', 'search')}</div>
    <div class="setting-group">${settingNavRow('shield', 'Privacy and security', 'Tracking protection, cookies and safe browsing', 'privacy')}</div>
    <div class="setting-group">${settingNavRow('sliders', 'Site settings', 'JavaScript, pop-ups, zoom and desktop mode', 'site')}</div>
    <div class="setting-group">${settingNavRow('download', 'Downloads', 'Download notifications', 'downloads')}</div>
    <div class="setting-group">${settingNavRow('trash', 'Delete browsing data', 'Clear history, cookies and cache', 'data')}</div>
    <div class="setting-group">${settingNavRow('info', 'About 4Keeper', 'Version, engine and licenses', 'about')}</div>`;
}

function pageNav(title, description, section) {
  return `
    <div class="settings-nav">
      <button class="settings-back" type="button" data-section="root">
        ${svgIcon('chevron', 'icon icon-sm settings-back-icon')}
        <span>Settings</span>
      </button>
      <div class="settings-nav-title">${escapeHtml(title)}</div>
      <div class="settings-nav-desc">${escapeHtml(description)}</div>
      <span class="visually-hidden">${escapeHtml(section || '')}</span>
    </div>`;
}

function settingsPageAppearance() {
  return pageNav('Appearance', 'How 4Keeper looks on this device.', 'appearance') +
    settingsHero('palette', 'Make it yours', 'Choose a theme and density that fit your screen.') +
    `<div class="setting-group">
      ${settingRowButton('palette', 'Theme', 'System follows your device', themeLabel(), 'theme')}
      ${settingRowButton('sliders', 'Density', 'Spacing of controls and lists', densityLabel(), 'density')}
      ${settingRowToggle('showFullUrl', 'Show full address', 'Show https:// and the complete path')}
    </div>`;
}

function settingsPageSearch() {
  return pageNav('Search', 'Defaults for the address bar and new tabs.', 'search') +
    settingsHero('search', 'Search and homepage', 'Pick the engine used for typed queries.') +
    `<div class="setting-group">
      ${settingRowButton('search', 'Search engine', 'Used when you type a query', engineLabel(), 'engine')}
      ${settingRowButton('link', 'Homepage', 'Opened by the Home button', settings.homePage || getEngine().home, 'homePage')}
      ${settingRowButton('text', 'On startup', 'What opens when the app starts', startupLabel(), 'startup')}
      ${settingRowToggle('suggestions', 'Search suggestions', 'Fetch suggestions as you type')}
    </div>`;
}

function settingsPagePrivacy() {
  return pageNav('Privacy and security', 'Protect what you browse.', 'privacy') +
    settingsHero('shield', 'Private by default', '4Keeper applies these settings to every tab.') +
    `<div class="setting-group">
      ${settingRowToggle('trackingProtection', 'Tracking protection', 'Block known tracking hosts')}
      ${settingRowToggle('safeBrowsing', 'Safe Browsing', 'Warn about dangerous sites')}
      ${settingRowButton('shield', 'Cookies', 'How sites may store cookies', cookiesLabel(), 'cookies')}
    </div>
    <div class="setting-note">4Keeper does not ask for camera, microphone or location access. Permissions are handled by Android and the sites you choose to use.</div>`;
}

function settingsPageSite() {
  return pageNav('Site settings', 'Control page behavior across tabs.', 'site') +
    settingsHero('sliders', 'Page behavior', 'Changing these settings reloads open tabs.') +
    `<div class="setting-group">
      ${settingRowToggle('javaScript', 'JavaScript', 'Required by most modern sites')}
      ${settingRowToggle('popups', 'Pop-ups', 'Allow sites to open new windows')}
      ${settingRowToggle('webDarkMode', 'Web dark mode', 'Ask sites to use a dark theme')}
      ${settingRowButton('text', 'Text zoom', 'Scale text inside pages', (Number(settings.textZoom) || 100) + '%', 'textZoom')}
      ${settingRowToggle('desktopMode', 'Desktop site', 'Request desktop versions of pages')}
    </div>
    <div class="setting-group">
      ${settingRowToggle('pinchZoom', 'Pinch to zoom', 'Allow two-finger zoom on pages')}
      ${settingRowToggle('zoomControls', 'On-screen zoom buttons', 'Show zoom controls when pinch zoom is on')}
    </div>`;
}

function settingsPageDownloads() {
  return pageNav('Downloads', 'Files saved by 4Keeper.', 'downloads') +
    settingsHero('download', 'Downloads folder', 'Files are stored privately inside the app.') +
    `<div class="setting-group">
      ${settingRowToggle('downloadNotifications', 'Download notifications', 'Show progress and completion notices')}
      ${settingRowAction('download', 'View downloads', 'Open the downloads list', 'openDownloads')}
    </div>
    <div class="setting-note">Android does not allow 4Keeper to become the system default browser, so downloads use the app's own folder.</div>`;
}

function settingsPageData() {
  return pageNav('Delete browsing data', 'Clear what this app has stored.', 'data') +
    settingsHero('trash', 'Browsing data', 'Choose what to remove from this device.') +
    `<div class="setting-group">
      ${settingRowAction('trash', 'Clear browsing data', 'History, cookies, cache and site data', 'clearData', true)}
    </div>
    <div class="setting-note">Settings, bookmarks and downloads are not removed by clearing browsing data.</div>`;
}

function settingsPageAbout() {
  const version = appInfo && appInfo.versionName ? appInfo.versionName : '—';
  const webview = appInfo && appInfo.webViewVersion ? appInfo.webViewVersion : '—';
  const android = appInfo && appInfo.androidVersion ? appInfo.androidVersion : '—';
  const device = appInfo && appInfo.deviceModel ? appInfo.deviceModel : '—';
  return pageNav('About 4Keeper', 'A fast, private Android browser.', 'about') +
    `<div class="about-card">
      <div class="about-logo">${svgIcon('globe')}</div>
      <div class="about-name">4Keeper</div>
      <div class="about-version">Version ${escapeHtml(version)}</div>
    </div>
    <div class="setting-group">
      <div class="setting-row static"><span class="setting-text"><span class="setting-label">Android</span></span><span class="setting-value">${escapeHtml(android)}</span></div>
      <div class="setting-row static"><span class="setting-text"><span class="setting-label">WebView</span></span><span class="setting-value">${escapeHtml(webview)}</span></div>
      <div class="setting-row static"><span class="setting-text"><span class="setting-label">Device</span></span><span class="setting-value">${escapeHtml(device)}</span></div>
    </div>
    <div class="setting-group">
      ${settingRowAction('info', 'Open source licenses', 'Capacitor, AndroidX and icons', 'licenses')}
      ${settingRowAction('trash', 'Reset all settings', 'Restore every default', 'reset', true)}
    </div>
    <div class="setting-note">4Keeper is built with Capacitor and Android WebView. Pages are rendered by Android's system WebView.</div>`;
}

function showSettingsSection(section) {
  currentSettingsSection = section;
  dom.settingsRoot.classList.add('hidden');
  dom.settingsPage.hidden = false;
  dom.settingsPage.classList.remove('hidden');
  const builders = {
    appearance: settingsPageAppearance,
    search: settingsPageSearch,
    privacy: settingsPagePrivacy,
    site: settingsPageSite,
    downloads: settingsPageDownloads,
    data: settingsPageData,
    about: settingsPageAbout
  };
  const build = builders[section];
  if (!build) {
    renderSettingsRoot();
    return;
  }
  dom.settingsPage.innerHTML = build();
  dom.settingsTitle.textContent = ({
    appearance: 'Appearance',
    search: 'Search',
    privacy: 'Privacy and security',
    site: 'Site settings',
    downloads: 'Downloads',
    data: 'Delete browsing data',
    about: 'About 4Keeper'
  })[section] || 'Settings';
  dom.settingsPage.scrollTop = 0;
}

function rerenderSettings() {
  const scroll = dom.settingsPage.scrollTop;
  if (currentSettingsSection) showSettingsSection(currentSettingsSection);
  else renderSettingsRoot();
  dom.settingsPage.scrollTop = scroll;
}

function openSettingsScreen(section) {
  if (section) showSettingsSection(section);
  else renderSettingsRoot();
  openScreen('settings', dom.settingsScreen);
  closeMenu();
}

function closeSettingsScreen() {
  if (currentSettingsSection) {
    renderSettingsRoot();
    return;
  }
  closeScreen('settings', dom.settingsScreen);
}

function handleSettingsAction(action) {
  switch (action) {
    case 'theme':
      openChoice('Theme', [
        { value: 'system', label: 'System', desc: 'Follow the device setting' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'amoled', label: 'AMOLED', desc: 'True black for OLED screens' }
      ], settings.theme, (value) => updateSetting({ theme: value }, { rerender: true, toastMessage: 'Theme updated' }));
      break;
    case 'density':
      openChoice('Density', [
        { value: 'comfortable', label: 'Comfortable', desc: 'More breathing room' },
        { value: 'compact', label: 'Compact', desc: 'More rows on screen' }
      ], settings.density, (value) => updateSetting({ density: value }, { rerender: true }));
      break;
    case 'engine':
      openChoice('Search engine', Object.entries(ENGINES).map(([value, item]) => ({
        value,
        label: item.label,
        desc: item.home
      })), settings.searchEngine, (value) => updateSetting({ searchEngine: value }, { rerender: true, toastMessage: 'Search engine updated' }));
      break;
    case 'homePage':
      openDialog({
        title: 'Homepage',
        message: 'Leave blank to use the search engine homepage.',
        confirmLabel: 'Save',
        body: (body) => {
          const input = el('input', 'text-input');
          input.type = 'url';
          input.inputMode = 'url';
          input.placeholder = getEngine().home;
          input.value = settings.homePage || '';
          input.id = 'homePageInput';
          body.appendChild(input);
        },
        onConfirm: () => {
          const input = $('homePageInput');
          const value = input ? input.value.trim() : '';
          if (value) {
            const hostPort = /^[^:\/?#]+:\d+([\/?#]|$)/.test(value);
            const valid = /^https?:\/\//i.test(value) ||
              (isProbablyUrl(value) && (!/^[a-z][a-z0-9+.-]*:/i.test(value) || hostPort));
            if (!valid) {
              toast('Enter a valid web address');
              return false;
            }
          }
          updateSetting({ homePage: value }, { rerender: true, toastMessage: 'Homepage saved' });
        }
      });
      break;
    case 'startup':
      openChoice('On startup', [
        { value: 'restore', label: 'Restore last session', desc: 'Reopen recent tabs' },
        { value: 'home', label: 'Open homepage', desc: 'Start fresh every time' }
      ], settings.startup, (value) => updateSetting({ startup: value }, { rerender: true }));
      break;
    case 'cookies':
      openChoice('Cookies', [
        { value: 'all', label: 'Allow all', desc: 'Sites work as expected' },
        { value: 'thirdparty', label: 'Block third-party', desc: 'Some logins may break' },
        { value: 'none', label: 'Block all', desc: 'Most sites will not stay signed in' }
      ], settings.cookies, (value) => updateSetting({ cookies: value }, { reload: true, rerender: true }));
      break;
    case 'textZoom':
      openChoice('Text zoom', [
        { value: '85', label: '85%' },
        { value: '100', label: '100%', desc: 'Default' },
        { value: '115', label: '115%' },
        { value: '130', label: '130%' },
        { value: '150', label: '150%' }
      ], String(settings.textZoom || 100), (value) => updateSetting({ textZoom: Number(value) }, { reload: true, rerender: true }));
      break;
    case 'clearData':
      openClearData();
      break;
    case 'openDownloads':
      openDownloads();
      break;
    case 'licenses':
      openLicenses();
      break;
    case 'reset':
      openDialog({
        title: 'Reset all settings?',
        message: 'Every preference returns to its default. Tabs, history, bookmarks and downloads stay.',
        confirmLabel: 'Reset settings',
        destructive: true,
        onConfirm: () => {
          settings = { ...DEFAULT_SETTINGS };
          Store.save('settings');
          applyTheme();
          applyDensity();
          pushNativeSettings(true);
          rerenderSettings();
          syncActiveTabUi();
          toast('Settings reset');
        }
      });
      break;
    default:
      break;
  }
}

function openClearData() {
  openDialog({
    title: 'Clear browsing data',
    message: 'Select what to remove. Bookmarks, settings and downloaded files stay.',
    confirmLabel: 'Clear data',
    destructive: true,
    body: (body) => {
      const options = [
        ['history', 'Browsing history', true],
        ['cookies', 'Cookies and site data', true],
        ['cache', 'Cached pages and files', true],
        ['downloads', 'Downloads list', false]
      ];
      const wrap = el('div', 'dialog-options');
      options.forEach(([key, label, checked]) => {
        const row = el('label', 'dialog-check');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = 'clear-' + key;
        input.checked = checked;
        row.append(input, el('span', '', label));
        wrap.appendChild(row);
      });
      body.appendChild(wrap);
    },
    onConfirm: async () => {
      const checked = (key) => {
        const input = $('clear-' + key);
        return !!(input && input.checked);
      };
      const flags = {
        history: checked('history'),
        cookies: checked('cookies'),
        cache: checked('cache'),
        downloads: checked('downloads')
      };
      try {
        await callPlugin('clearBrowsingData', flags);
      } catch (error) {
        toast('Could not clear browsing data');
        return false;
      }
      if (flags.history) history = [];
      Store.save('history');
      Store.save('settings');
      Store.save('bookmarks');
      Store.save('favicons');
      updateMenuCounts();
      renderHistory();
      if (flags.downloads) loadDownloads();
      syncNav();
      toast('Browsing data cleared');
    }
  });
}

function openLicenses() {
  openDialog({
    title: 'Open source licenses',
    singleAction: true,
    confirmLabel: 'Close',
    body: (body) => {
      body.innerHTML = `
        <div class="license-text">
          <p><strong>Capacitor</strong><br>MIT License · Copyright (c) Ionic</p>
          <p><strong>AndroidX / Android WebKit</strong><br>Apache License 2.0 · Copyright The Android Open Source Project</p>
          <p><strong>Lucide icons</strong><br>ISC License · Copyright (c) Lucide Contributors</p>
          <p>4Keeper is an independent browser shell. Web pages are rendered by the Android System WebView and remain the property of their respective owners.</p>
        </div>`;
    }
  });
}

async function loadAppInfo() {
  try {
    appInfo = await callPlugin('getAppInfo');
  } catch (error) {
    appInfo = null;
  }
  if (currentSettingsSection === 'about') showSettingsSection('about');
}

/* --------------------------------------------------------------- Listeners */

function on(id, event, handler, options) {
  const node = $(id);
  if (node) node.addEventListener(event, handler, options);
}

function attachUiListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  dom.urlInput.addEventListener('focus', () => {
    window.setTimeout(() => {
      if (document.activeElement === dom.urlInput) dom.urlInput.select();
    }, 0);
    scheduleSuggestions();
  });
  dom.urlInput.addEventListener('input', scheduleSuggestions);
  dom.urlInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const value = dom.urlInput.value.trim();
      if (value) navigate(value);
    } else if (event.key === 'Escape') {
      hideSuggestions();
      dom.urlInput.blur();
    }
  });
  dom.urlInput.addEventListener('blur', () => {
    window.setTimeout(() => {
      if (document.activeElement !== dom.urlInput) hideSuggestions();
    }, 160);
  });

  dom.clearUrlBtn.addEventListener('click', () => {
    dom.urlInput.value = '';
    dom.clearUrlBtn.classList.add('hidden');
    hideSuggestions();
    dom.urlInput.focus();
  });

  dom.reloadBtn.addEventListener('click', () => {
    if (loading) {
      callPlugin('stopLoading').catch(() => {});
      setLoading(false);
    } else {
      setLoading(true);
      callPlugin('reload').catch(() => setLoading(false));
    }
  });

  dom.backBtn.addEventListener('click', goBack);
  dom.forwardBtn.addEventListener('click', goForward);
  dom.homeBtn.addEventListener('click', goHome);
  dom.tabsBtn.addEventListener('click', () => {
    if (overlays.has('tabs')) closeTabSheet();
    else openTabSheet();
  });
  dom.menuBtn.addEventListener('click', () => {
    if (overlays.has('menu')) closeMenu();
    else openMenu();
  });
  dom.siteInfoBtn.addEventListener('click', openSiteInfo);

  dom.suggestionsList.addEventListener('pointerdown', (event) => event.preventDefault());
  dom.suggestionsList.addEventListener('click', (event) => {
    const button = event.target.closest('.suggestion');
    if (!button) return;
    const item = suggestionItems[Number(button.getAttribute('data-index'))];
    if (!item) return;
    navigate(item.url || item.text);
  });

  dom.closeTabSheetBtn.addEventListener('click', closeTabSheet);
  dom.tabSheetBackdrop.addEventListener('click', closeTabSheet);
  dom.newTabBtn.addEventListener('click', () => newTab());
  dom.closeAllTabsBtn.addEventListener('click', () => {
    if (!tabs.length) return;
    openDialog({
      title: 'Close all tabs?',
      message: 'All open tabs will be closed and a new tab will open.',
      confirmLabel: 'Close all',
      destructive: true,
      onConfirm: () => {
        closeAllTabs();
      }
    });
  });
  dom.tabsList.addEventListener('click', (event) => {
    const closeButton = event.target.closest('[data-close-tab]');
    if (closeButton) {
      event.stopPropagation();
      closeTab(Number(closeButton.getAttribute('data-close-tab')));
      return;
    }
    const card = event.target.closest('[data-tab-id]');
    if (card) switchTab(Number(card.getAttribute('data-tab-id')));
  });
  dom.tabsList.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('[data-tab-id]');
    if (!card) return;
    event.preventDefault();
    switchTab(Number(card.getAttribute('data-tab-id')));
  });

  dom.closeMenuBtn.addEventListener('click', closeMenu);
  dom.menuBackdrop.addEventListener('click', closeMenu);
  dom.menuNewTabBtn.addEventListener('click', () => newTab());
  dom.menuBookmarkBtn.addEventListener('click', () => {
    toggleBookmark();
    closeMenu();
  });
  dom.menuBookmarksBtn.addEventListener('click', openBookmarks);
  dom.menuHistoryBtn.addEventListener('click', openHistory);
  dom.menuDownloadsBtn.addEventListener('click', openDownloads);
  dom.menuSettingsBtn.addEventListener('click', () => openSettingsScreen());

  dom.siteInfoCloseBtn.addEventListener('click', closeSiteInfo);
  dom.siteInfoBackdrop.addEventListener('click', closeSiteInfo);

  dom.historyBackBtn.addEventListener('click', closeHistory);
  dom.historySearch.addEventListener('input', renderHistory);
  dom.clearHistoryBtn.addEventListener('click', clearHistory);
  dom.historyList.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('[data-history-delete]');
    if (deleteButton) {
      event.stopPropagation();
      removeHistoryEntry(Number(deleteButton.getAttribute('data-history-delete')));
      return;
    }
    const row = event.target.closest('[data-history-open]');
    if (!row) return;
    const item = history.find((entry) => entry.id === Number(row.getAttribute('data-history-open')));
    if (item) {
      closeHistory();
      navigate(item.url);
    }
  });

  dom.bookmarksBackBtn.addEventListener('click', closeBookmarks);
  dom.bookmarksSearch.addEventListener('input', renderBookmarks);
  dom.bookmarksList.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('[data-bookmark-delete]');
    if (deleteButton) {
      event.stopPropagation();
      removeBookmark(Number(deleteButton.getAttribute('data-bookmark-delete')));
      return;
    }
    const row = event.target.closest('[data-bookmark-open]');
    if (!row) return;
    const item = bookmarks.find((entry) => entry.id === Number(row.getAttribute('data-bookmark-open')));
    if (item) {
      closeBookmarks();
      navigate(item.url);
    }
  });

  dom.downloadsBackBtn.addEventListener('click', closeDownloads);
  dom.downloadsRefreshBtn.addEventListener('click', loadDownloads);
  dom.downloadsList.addEventListener('click', (event) => {
    const openButton = event.target.closest('[data-download-open]');
    if (openButton) {
      openDownloadFile(Number(openButton.getAttribute('data-download-open')));
      return;
    }
    const removeButton = event.target.closest('[data-download-remove]');
    if (removeButton) removeDownloadFile(Number(removeButton.getAttribute('data-download-remove')));
  });

  dom.settingsBackBtn.addEventListener('click', closeSettingsScreen);

  dom.settingsRoot.addEventListener('click', (event) => {
    const target = event.target.closest('[data-section]');
    if (!target) return;
    const section = target.getAttribute('data-section');
    if (section) showSettingsSection(section);
  });

  dom.settingsPage.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-toggle]');
    if (toggle) {
      const key = toggle.getAttribute('data-toggle');
      if (!key || !(key in DEFAULT_SETTINGS)) return;
      const patch = {};
      patch[key] = !settings[key];
      const reload = ['javaScript', 'popups', 'textZoom', 'desktopMode', 'webDarkMode', 'pinchZoom', 'zoomControls'].includes(key);
      updateSetting(patch, { reload, rerender: true });
      return;
    }
    const action = event.target.closest('[data-action]');
    if (action) {
      handleSettingsAction(action.getAttribute('data-action'));
      return;
    }
    const section = event.target.closest('[data-section]');
    if (!section) return;
    const key = section.getAttribute('data-section');
    if (key === 'root' || !key) renderSettingsRoot();
    else showSettingsSection(key);
  });

  dom.dialogBackdrop.addEventListener('click', closeDialog);
  dom.dialogCancel.addEventListener('click', closeDialog);
  dom.dialogConfirm.addEventListener('click', confirmDialog);

  dom.choiceBackdrop.addEventListener('click', closeChoice);
  dom.choiceClose.addEventListener('click', closeChoice);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (overlays.size === 0) return;
    event.preventDefault();
    if (overlays.has('dialog')) closeDialog();
    else if (overlays.has('choice')) closeChoice();
    else if (overlays.has('tabs')) closeTabSheet();
    else if (overlays.has('menu')) closeMenu();
    else if (overlays.has('siteInfo')) closeSiteInfo();
    else if (overlays.has('suggestions')) hideSuggestions();
    else if (overlays.has('settings')) closeSettingsScreen();
    else if (overlays.has('history')) closeHistory();
    else if (overlays.has('bookmarks')) closeBookmarks();
    else if (overlays.has('downloads')) closeDownloads();
  });

  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (settings.theme === 'system') applyTheme();
    setSecurityIcon(currentUrl);
  });

  let resizeTimer = null;
  const handleResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      lastBoundsKey = '';
      if (overlays.size === 0) mountBrowser();
    }, 160);
  };
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', handleResize);
}

function attachNativeListeners() {
  const plugin = getPlugin();
  if (!plugin || typeof plugin.addListener !== 'function') return;

  const listen = (event, handler) => {
    try {
      plugin.addListener(event, handler);
    } catch (error) {
      /* ignore */
    }
  };

  const isActive = (data) => data && data.tabId === activeTabId;

  listen('pageStarted', (data) => {
    if (!data || typeof data.tabId !== 'number') return;
    updateTabMeta(data.tabId, { url: data.url });
    if (!isActive(data)) {
      if (overlays.has('tabs')) renderTabs();
      return;
    }
    currentUrl = data.url || currentUrl;
    setSecurityIcon(currentUrl);
    if (document.activeElement !== dom.urlInput && currentUrl) {
      dom.urlInput.value = displayUrl(currentUrl);
      dom.clearUrlBtn.classList.toggle('hidden', !dom.urlInput.value);
    }
    dom.startScreen.classList.add('is-hidden');
    setLoading(true);
    scheduleSessionSave();
  });

  listen('pageLoaded', (data) => {
    if (!data || typeof data.tabId !== 'number') return;
    updateTabMeta(data.tabId, {
      url: data.url,
      title: data.title,
      canGoBack: data.canGoBack,
      canGoForward: data.canGoForward
    });
    if (!isActive(data)) {
      if (overlays.has('tabs')) renderTabs();
      scheduleSessionSave();
      return;
    }
    currentUrl = data.url || currentUrl;
    currentTitle = data.title || '';
    updateTabMeta(data.tabId, { url: currentUrl, title: currentTitle });
    if (document.activeElement !== dom.urlInput) {
      dom.urlInput.value = currentUrl ? displayUrl(currentUrl) : '';
    }
    document.title = currentTitle ? currentTitle + ' · 4Keeper' : '4Keeper';
    setSecurityIcon(currentUrl);
    setLoading(false);
    setNav(!!data.canGoBack, !!data.canGoForward);
    addHistoryEntry(currentUrl, currentTitle);
    updateMenuBookmark();
    updateTabBadge();
    if (overlays.has('tabs')) renderTabs();
    scheduleSessionSave();
    if (overlays.has('siteInfo')) renderSiteInfo();
  });

  listen('loadProgress', (data) => {
    if (!isActive(data) || !data) return;
    const progress = Math.max(0, Math.min(100, Number(data.progress) || 0));
    if (progress < 100) dom.progressBar.style.width = progress + '%';
  });

  listen('titleChanged', (data) => {
    if (!data || typeof data.tabId !== 'number') return;
    updateTabMeta(data.tabId, { title: data.title });
    if (isActive(data)) {
      currentTitle = data.title || '';
      document.title = currentTitle ? currentTitle + ' · 4Keeper' : '4Keeper';
      if (overlays.has('siteInfo')) renderSiteInfo();
    }
    if (overlays.has('tabs')) renderTabs();
    scheduleSessionSave();
  });

  listen('faviconChanged', (data) => {
    if (!data || !data.url || !data.favicon) return;
    const host = hostOf(data.url);
    if (!host) return;
    favicons[host] = data.favicon;
    const hosts = Object.keys(favicons);
    if (hosts.length > 200) {
      hosts.slice(0, hosts.length - 200).forEach((key) => delete favicons[key]);
    }
    Store.save('favicons');
    if (overlays.has('tabs')) renderTabs();
    if (overlays.has('history')) renderHistory();
    if (overlays.has('bookmarks')) renderBookmarks();
  });

  listen('pageError', (data) => {
    if (!data) return;
    if (isActive(data)) {
      setLoading(false);
      if (data.message) toast(String(data.message));
      if (data.url) {
        currentUrl = data.url;
        setSecurityIcon(currentUrl);
      }
    }
    scheduleSessionSave();
  });

  listen('tabCrashed', () => {
    toast('A tab stopped responding and was closed');
    refreshTabs().then(() => {
      if (!tabs.length) createTabWithUrl(getHomePage(), true);
    });
  });

  listen('downloadStarted', (data) => {
    if (data && data.filename) toast('Downloading ' + data.filename);
    if (overlays.has('downloads')) loadDownloads();
  });
}

/* ------------------------------------------------------------------- Back */

function handleBack() {
  if (overlays.has('dialog')) {
    closeDialog();
    return true;
  }
  if (overlays.has('choice')) {
    closeChoice();
    return true;
  }
  if (overlays.has('settings')) {
    closeSettingsScreen();
    return true;
  }
  if (overlays.has('history')) {
    closeHistory();
    return true;
  }
  if (overlays.has('bookmarks')) {
    closeBookmarks();
    return true;
  }
  if (overlays.has('downloads')) {
    closeDownloads();
    return true;
  }
  if (overlays.has('tabs')) {
    closeTabSheet();
    return true;
  }
  if (overlays.has('menu')) {
    closeMenu();
    return true;
  }
  if (overlays.has('siteInfo')) {
    closeSiteInfo();
    return true;
  }
  if (overlays.has('suggestions')) {
    hideSuggestions();
    return true;
  }
  if (navCanBack) {
    goBack();
    return true;
  }
  return false;
}

async function exitApp() {
  try {
    if (App && typeof App.exitApp === 'function') await App.exitApp();
    else if (App && typeof App.minimizeApp === 'function') await App.minimizeApp();
  } catch (error) {
    /* ignore */
  }
}

/* ------------------------------------------------------------------- Boot */

async function restoreSession() {
  const saved = Array.isArray(session.tabs) ? session.tabs.filter((tab) => isHttpUrl(tab.url)).slice(0, 8) : [];
  if (settings.startup === 'home' || !saved.length) {
    await createTabWithUrl(getHomePage(), true);
    return;
  }

  for (const tab of saved) {
    try {
      await callPlugin('createTab', { url: tab.url, activate: false });
    } catch (error) {
      /* skip broken entries */
    }
  }

  try {
    const result = await callPlugin('getTabs');
    const list = Array.isArray(result && result.tabs) ? result.tabs : [];
    const index = Math.min(Math.max(Number(session.activeIndex) || 0, 0), Math.max(list.length - 1, 0));
    if (list[index]) await callPlugin('switchTab', { id: list[index].id });
  } catch (error) {
    /* ignore */
  }

  await refreshTabs();
  if (!tabs.length) await createTabWithUrl(getHomePage(), true);
}

async function boot() {
  for (let attempt = 0; attempt < 20 && !getPlugin(); attempt++) {
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  applyTheme();
  applyDensity();
  attachUiListeners();
  attachNativeListeners();

  await Store.hydrate();
  applyTheme();
  applyDensity();
  updateMenuCounts();

  await mountBrowser(true);
  await pushNativeSettings(false);
  loadAppInfo();

  try {
    await restoreSession();
  } catch (error) {
    toast('Could not restore your tabs');
  }

  await refreshTabs().catch(() => {});
  syncActiveTabUi();
  const tab = activeTab();
  setNav(!!(tab && tab.canGoBack), !!(tab && tab.canGoForward));
  syncNav();
  setLoading(false);
  updateTabBadge();

  if (App && typeof App.addListener === 'function') {
    App.addListener('backButton', () => {
      if (!handleBack()) exitApp();
    });
    App.addListener('appStateChange', (state) => {
      if (!state || state.isActive === false) {
        saveSession();
        return;
      }
      lastBoundsKey = '';
      window.setTimeout(() => {
        if (overlays.size === 0) mountBrowser(true);
      }, 160);
    });
  }

  window.addEventListener('pagehide', saveSession);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      lastBoundsKey = '';
      window.setTimeout(() => {
        if (overlays.size === 0) mountBrowser();
      }, 160);
    }
  });
}

boot();
