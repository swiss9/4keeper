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

const SEARCH_LANGUAGES = [
  { value: '', label: 'Any language' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'nl', label: 'Dutch' },
  { value: 'sv', label: 'Swedish' },
  { value: 'da', label: 'Danish' },
  { value: 'fi', label: 'Finnish' },
  { value: 'no', label: 'Norwegian' },
  { value: 'pl', label: 'Polish' },
  { value: 'tr', label: 'Turkish' },
  { value: 'ru', label: 'Russian' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'ar', label: 'Arabic' },
  { value: 'he', label: 'Hebrew' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'id', label: 'Indonesian' }
];

const SEARCH_REGIONS = [
  { value: '', label: 'Any region' },
  { value: 'US', label: 'United States (US)' },
  { value: 'GB', label: 'United Kingdom (UK)' },
  { value: 'CA', label: 'Canada (CA)' },
  { value: 'AU', label: 'Australia (AU)' },
  { value: 'NZ', label: 'New Zealand (NZ)' },
  { value: 'IE', label: 'Ireland (IE)' },
  { value: 'DE', label: 'Germany (DE)' },
  { value: 'FR', label: 'France (FR)' },
  { value: 'ES', label: 'Spain (ES)' },
  { value: 'IT', label: 'Italy (IT)' },
  { value: 'NL', label: 'Netherlands (NL)' },
  { value: 'SE', label: 'Sweden (SE)' },
  { value: 'CH', label: 'Switzerland (CH)' },
  { value: 'AT', label: 'Austria (AT)' },
  { value: 'BR', label: 'Brazil (BR)' },
  { value: 'MX', label: 'Mexico (MX)' },
  { value: 'IN', label: 'India (IN)' },
  { value: 'JP', label: 'Japan (JP)' },
  { value: 'KR', label: 'South Korea (KR)' },
  { value: 'SG', label: 'Singapore (SG)' },
  { value: 'ZA', label: 'South Africa (ZA)' },
  { value: 'AE', label: 'United Arab Emirates (AE)' }
];

function searchLanguageLabel() {
  const value = String(settings.searchLanguage || '');
  const found = SEARCH_LANGUAGES.find((item) => item.value === value);
  return found ? found.label : 'Any language';
}

function searchRegionLabel() {
  const value = String(settings.searchRegion || '');
  const found = SEARCH_REGIONS.find((item) => item.value === value);
  return found ? found.label : 'Any region';
}

const DEFAULT_SETTINGS = {
  theme: 'system',
  density: 'comfortable',
  searchEngine: 'duckduckgo',
  searchLanguage: 'en',
  searchRegion: '',
  homePage: '',
  startup: 'restore',
  suggestions: true,
  suggestBookmarks: true,
  suggestHistory: true,
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
  downloadNotifications: true,
  downloadLocation: '',
  downloadLocationLabel: '',
  askDownloadLocation: false,
  autoOpenPdf: false,
  autoOpenDownload: false,
  parallelDownloads: true
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
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  pin: '<path d="M9 3h6l-1 6 4 3v2H6v-2l4-3-1-6Z"/><path d="M12 14v7"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  upload: '<path d="M12 21V9m-5 5 5-5 5 5"/><path d="M5 3h14"/>'
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
let progressDoneTimer = null;
let appInfo = null;
let downloadsCache = [];
let downloadsUsage = { usedBytes: 0, totalBytes: 0 };
let downloadsFilter = 'all';
let tabMedia = {};
let tabDownloadIndex = {};
let mediaToastAt = 0;
let mediaToastTabId = -1;
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
let tabsReady = false;
let bootPromise = null;
let readingModeOn = false;
let bookmarkFolders = [];
let tabMeta = {};
let tabGroups = [];
let tabSelectionMode = false;
const tabSelection = new Set();
let tabGroupFilter = null;
let tabLongPress = null;
let suppressTabClick = false;

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
  downloadsBtn: $('downloadsBtn'),
  downloadsMediaDot: $('downloadsMediaDot'),
  tabDownloadsBtn: $('tabDownloadsBtn'),
  tabDownloadsMediaDot: $('tabDownloadsMediaDot'),
  menuBtn: $('menuBtn'),
  tabSheet: $('tabSheet'),
  tabSheetBackdrop: $('tabSheetBackdrop'),
  tabSheetCount: $('tabSheetCount'),
  tabsList: $('tabsList'),
  tabsEmpty: $('tabsEmpty'),
  tabsEmptyNewTabBtn: $('tabsEmptyNewTabBtn'),
  newTabBtn: $('newTabBtn'),
  tabSelectBtn: $('tabSelectBtn'),
  tabSelectBar: $('tabSelectBar'),
  tabSelectCount: $('tabSelectCount'),
  tabSelectCancel: $('tabSelectCancel'),
  tabGroupBtn: $('tabGroupBtn'),
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
  menuDesktopBtn: $('menuDesktopBtn'),
  menuDesktopMeta: $('menuDesktopMeta'),
  menuReadingBtn: $('menuReadingBtn'),
  menuReadingMeta: $('menuReadingMeta'),
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
  bookmarksNewFolderBtn: $('bookmarksNewFolderBtn'),
  bookmarksMenuBtn: $('bookmarksMenuBtn'),
  bookmarkImportInput: $('bookmarkImportInput'),
  downloadsScreen: $('downloadsScreen'),
  downloadsBackBtn: $('downloadsBackBtn'),
  downloadsSettingsBtn: $('downloadsSettingsBtn'),
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
    return buildSearchUrl(str);
  }
  const hostPort = /^[^:\/?#]+:\d+([\/?#]|$)/.test(str);
  if (/^[a-z][a-z0-9+.-]*:/i.test(str) && !hostPort) {
    return buildSearchUrl(str);
  }
  if (isProbablyUrl(str)) {
    if (/^localhost(:\d+)?([\/?#]|$)/i.test(str) || /^\d{1,3}(\.\d{1,3}){3}(:\d+)?([\/?#]|$)/.test(str)) {
      return 'http://' + str;
    }
    return 'https://' + str.replace(/^\/+/, '');
  }
  return buildSearchUrl(str);
}

function getEngine() {
  return ENGINES[settings.searchEngine] || ENGINES.duckduckgo;
}

function buildSearchUrl(query) {
  let url = getEngine().search + encodeURIComponent(query);
  const language = String(settings.searchLanguage || '').trim();
  const region = String(settings.searchRegion || '').trim();
  if (language) url += '&hl=' + encodeURIComponent(language);
  if (region) url += '&gl=' + encodeURIComponent(region.toUpperCase());
  return url;
}

const GOOGLE_HOME_HOST = /^google(\.[a-z]{2,4}){1,2}$/i;

/* Google serves a country-specific homepage based on the IP. `/ncr` keeps it
 * neutral, and hl/gl apply the saved search language + region on every load. */
function isGoogleHomeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    if (parsed.port) return false;
    const host = parsed.hostname.replace(/^www\./i, '');
    if (!GOOGLE_HOME_HOST.test(host)) return false;
    const path = parsed.pathname.replace(/\/+$/, '');
    if (path && path !== '/ncr' && path !== '/webhp') return false;
    if (parsed.searchParams.get('q')) return false;
    return true;
  } catch (error) {
    return false;
  }
}

function buildHomeUrl(rawUrl) {
  const url = String(rawUrl || '').trim();
  if (!url || !isGoogleHomeUrl(url)) return url;
  const language = String(settings.searchLanguage || '').trim();
  const region = String(settings.searchRegion || '').trim();
  const params = [];
  if (language) params.push('hl=' + encodeURIComponent(language));
  if (region) params.push('gl=' + encodeURIComponent(region.toLowerCase()));
  return 'https://www.google.com/ncr' + (params.length ? '?' + params.join('&') : '');
}

function getHomePage() {
  const custom = String(settings.homePage || '').trim();
  if (custom) {
    if (/^https?:\/\//i.test(custom)) return buildHomeUrl(custom);
    const hostPort = /^[^:\/?#]+:\d+([\/?#]|$)/.test(custom);
    if (isProbablyUrl(custom) && (!/^[a-z][a-z0-9+.-]*:/i.test(custom) || hostPort)) {
      if (/^localhost(:\d+)?([\/?#]|$)/i.test(custom) || /^\d{1,3}(\.\d{1,3}){3}(:\d+)?([\/?#]|$)/.test(custom)) {
        return 'http://' + custom;
      }
      return buildHomeUrl('https://' + custom.replace(/^\/+/, ''));
    }
  }
  return buildHomeUrl(getEngine().home);
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

/* Session payloads are persisted as JSON, so a crash or a partial write can
 * leave anything behind. Everything below fails closed and wipes the broken
 * value instead of leaving the tab manager with an unusable state. */
function wipeStoredSession(reason) {
  session = { tabs: [], activeIndex: 0 };
  try {
    localStorage.removeItem('4k.session');
  } catch (error) {
    /* ignore */
  }
  const plugin = getPlugin();
  if (plugin && typeof plugin.storageSet === 'function') {
    try {
      Promise.resolve(plugin.storageSet({ key: 'session', value: JSON.stringify(session) })).catch(() => {});
    } catch (error) {
      /* ignore */
    }
  }
  if (reason) console.warn('[4keeper] Session reset:', reason);
}

function normalizeSession(raw) {
  const empty = { tabs: [], activeIndex: 0 };
  if (raw == null) return empty;
  if (typeof raw !== 'object' || Array.isArray(raw) || !Array.isArray(raw.tabs)) {
    wipeStoredSession('unexpected session shape');
    return empty;
  }
  const restored = raw.tabs
    .filter((tab) => tab && typeof tab.url === 'string' && isHttpUrl(tab.url))
    .map((tab) => ({ url: String(tab.url), title: typeof tab.title === 'string' ? tab.title : '' }))
    .slice(0, 8);
  if (!restored.length && raw.tabs.length) {
    wipeStoredSession('no usable tab entries');
    return empty;
  }
  let activeIndex = Number(raw.activeIndex);
  if (!Number.isFinite(activeIndex) || activeIndex < 0) activeIndex = 0;
  activeIndex = restored.length ? Math.min(Math.round(activeIndex), restored.length - 1) : 0;
  return { tabs: restored, activeIndex };
}

function parseStoredSession(raw) {
  if (typeof raw !== 'string' || !raw) return { tabs: [], activeIndex: 0 };
  try {
    return normalizeSession(JSON.parse(raw));
  } catch (error) {
    wipeStoredSession('session JSON could not be parsed');
    return { tabs: [], activeIndex: 0 };
  }
}

function readStoredSession(native) {
  if (native && typeof native.session === 'string') return parseStoredSession(native.session);
  let raw = null;
  try {
    raw = localStorage.getItem('4k.session');
  } catch (error) {
    raw = null;
  }
  return parseStoredSession(raw);
}

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
    session = readStoredSession(native);
    bookmarkFolders = read('folders', []);
    tabMeta = read('tabMeta', {});
    tabGroups = read('tabGroups', []);

    if (!Array.isArray(history)) history = [];
    if (!Array.isArray(bookmarks)) bookmarks = [];
    if (!Array.isArray(bookmarkFolders)) bookmarkFolders = [];
    if (!Array.isArray(tabGroups)) tabGroups = [];
    if (!tabMeta || typeof tabMeta !== 'object' || Array.isArray(tabMeta)) tabMeta = {};
    if (!favicons || typeof favicons !== 'object' || Array.isArray(favicons)) favicons = {};
    if (!session || !Array.isArray(session.tabs)) session = { tabs: [], activeIndex: 0 };

    bookmarkFolders = bookmarkFolders
      .filter((folder) => folder && folder.id && folder.name)
      .map((folder) => ({ id: String(folder.id), name: String(folder.name), createdAt: Number(folder.createdAt) || Date.now() }));
    tabGroups = tabGroups
      .filter((group) => group && group.id && group.name)
      .map((group) => ({
        id: String(group.id),
        name: String(group.name),
        createdAt: Number(group.createdAt) || Date.now(),
        tabIds: Array.isArray(group.tabIds)
          ? group.tabIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
          : []
      }))
      .filter((group) => group.tabIds.length > 0);

    migrateLegacy(native);

    this.save('settings');
    this.save('history');
    this.save('bookmarks');
    this.save('favicons');
    this.save('session');
    this.save('folders');
    this.save('tabMeta');
    this.save('tabGroups');
  },

  save(key) {
    let value;
    if (key === 'settings') value = settings;
    else if (key === 'history') value = history;
    else if (key === 'bookmarks') value = bookmarks;
    else if (key === 'favicons') value = favicons;
    else if (key === 'session') value = session;
    else if (key === 'folders') value = bookmarkFolders;
    else if (key === 'tabMeta') value = tabMeta;
    else if (key === 'tabGroups') value = tabGroups;
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

function applyWindowBackground() {
  const plugin = getPlugin();
  if (!plugin || typeof plugin.setWindowBackground !== 'function') return;
  const color = getComputedStyle(document.documentElement).getPropertyValue('--bg-elev').trim();
  if (!color) return;
  try {
    Promise.resolve(plugin.setWindowBackground({ color })).catch(() => {});
  } catch (error) {
  }
}

function applyTheme() {
  const theme = resolveTheme();
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#09090b');
  }
  const plugins = window.Capacitor && window.Capacitor.Plugins;
  const systemBars = plugins && plugins.SystemBars;
  if (systemBars && typeof systemBars.setStyle === 'function') {
    try {
      Promise.resolve(systemBars.setStyle({ style: theme === 'light' ? 'LIGHT' : 'DARK' }))
        .catch(() => {})
        .then(applyWindowBackground);
    } catch (error) {
      applyWindowBackground();
    }
  } else {
    applyWindowBackground();
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
  if (settings.startup === 'home') return 'Open homepage';
  if (settings.startup === 'newtab') return 'Open new tab';
  return 'Restore last session';
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
    window.clearTimeout(progressDoneTimer);
    if (!was) {
      dom.progressBar.style.transition = '';
      dom.progressBar.style.width = '6%';
      dom.progressBar.style.opacity = '0.9';
    }
    loadingTimer = window.setTimeout(() => {
      if (loading) setLoading(false);
    }, 12000);
  } else if (was) {
    dom.progressBar.style.width = '100%';
    window.setTimeout(() => {
      if (loading) return;
      dom.progressBar.style.transition = 'none';
      dom.progressBar.style.width = '0';
      dom.progressBar.style.opacity = '0';
      window.requestAnimationFrame(() => {
        dom.progressBar.style.transition = '';
      });
    }, 280);
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
  if (dom.closeAllTabsBtn) dom.closeAllTabsBtn.disabled = count === 0;
}

function updateMenuCounts() {
  dom.menuHistoryCount.textContent = history.length ? String(history.length) : '';
  dom.menuBookmarksCount.textContent = bookmarks.length ? String(bookmarks.length) : '';
}

function updateMenuBookmark() {
  const saved = isHttpUrl(currentUrl) && bookmarks.some((item) => item.url === currentUrl);
  dom.menuBookmarkLabel.textContent = saved ? 'Remove bookmark' : 'Bookmark this page';
}

function updateMenuModes() {
  const desktopOn = !!settings.desktopMode;
  if (dom.menuDesktopMeta) dom.menuDesktopMeta.textContent = desktopOn ? 'On' : '';
  if (dom.menuDesktopBtn) dom.menuDesktopBtn.setAttribute('aria-checked', String(desktopOn));
  if (dom.menuReadingBtn) dom.menuReadingBtn.setAttribute('aria-checked', String(readingModeOn));
  if (dom.menuReadingMeta) dom.menuReadingMeta.textContent = readingModeOn ? 'On' : '';
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
  updateDownloadsIndicator();
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

function adoptNativeActiveTab(data) {
  if (!data || typeof data.activeTabId !== 'number') return;
  if (data.activeTabId === activeTabId) return;
  activeTabId = data.activeTabId;
  window.setTimeout(() => {
    refreshTabs().catch(() => {});
  }, 0);
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

let uiOverlayState = null;
let nativeVisibleState = null;
let pageBehindState = false;
let pageBehindToken = 0;

function setUiOverlay(active) {
  const plugin = getPlugin();
  if (!plugin || typeof plugin.setUiOverlay !== 'function') return Promise.resolve();
  if (uiOverlayState === active) return Promise.resolve();
  uiOverlayState = active;
  try {
    return Promise.resolve(plugin.setUiOverlay({ active })).catch(() => {
      uiOverlayState = null;
    });
  } catch (error) {
    uiOverlayState = null;
    return Promise.resolve();
  }
}

function applyPageBehind(active) {
  const root = document.documentElement;
  if (active) {
    pageBehindToken++;
    pageBehindState = true;
    document.body.classList.add('page-behind');
    root.classList.add('page-behind');
    setUiOverlay(true);
    return;
  }
  if (!pageBehindState) {
    document.body.classList.remove('page-behind');
    root.classList.remove('page-behind');
    setUiOverlay(false);
    return;
  }
  const token = ++pageBehindToken;
  setUiOverlay(false).finally(() => {
    if (token !== pageBehindToken) return;
    pageBehindState = false;
    document.body.classList.remove('page-behind');
    root.classList.remove('page-behind');
  });
}

function syncNativeVisibility() {
  const overlay = overlays.size > 0;
  const tab = activeTab();
  const hasPage = !!(tab && isHttpUrl(tab.url));
  const pageBehind = overlay && hasPage;

  document.body.classList.toggle('overlay-open', overlay);

  if (nativeVisibleState !== hasPage) {
    nativeVisibleState = hasPage;
    setNativeVisible(hasPage);
  }
  applyPageBehind(pageBehind);

  dom.startScreen.classList.toggle('is-hidden', hasPage || overlay);

  if (!overlay) {
    window.setTimeout(() => {
      if (overlays.size === 0) mountBrowser();
    }, 80);
  }
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

function attachSheetDrag(sheet, closeFn) {
  const handle = sheet.querySelector('.sheet-handle');
  if (!handle) return;
  let startY = null;
  let lastY = 0;
  let lastT = 0;
  let velocity = 0;

  const endDrag = (dismiss) => {
    sheet.classList.remove('is-dragging');
    if (dismiss) {
      sheet.style.transform = '';
      closeFn();
    } else {
      sheet.style.transform = '';
    }
    startY = null;
    velocity = 0;
  };

  handle.addEventListener('pointerdown', (event) => {
    if (startY !== null) return;
    startY = event.clientY;
    lastY = startY;
    lastT = event.timeStamp;
    velocity = 0;
    sheet.classList.add('is-dragging');
    try {
      handle.setPointerCapture(event.pointerId);
    } catch (error) {
      /* ignore */
    }
  });

  handle.addEventListener('pointermove', (event) => {
    if (startY === null) return;
    const dy = event.clientY - startY;
    const dt = Math.max(event.timeStamp - lastT, 1);
    velocity = (event.clientY - lastY) / dt;
    lastY = event.clientY;
    lastT = event.timeStamp;
    sheet.style.transform = 'translateY(' + Math.max(dy, 0) + 'px)';
  });

  const onRelease = () => {
    if (startY === null) return;
    const dy = parseFloat((sheet.style.transform || '').replace('translateY(', '')) || 0;
    endDrag(dy > 110 || velocity > 0.65);
  };

  handle.addEventListener('pointerup', onRelease);
  handle.addEventListener('pointercancel', onRelease);
}

function attachSheetDrags() {
  if (dom.tabSheet) attachSheetDrag(dom.tabSheet, closeTabSheet);
  if (dom.menuSheet) attachSheetDrag(dom.menuSheet, closeMenu);
  if (dom.siteInfoSheet) attachSheetDrag(dom.siteInfoSheet, closeSiteInfo);
  if (dom.choiceSheet) attachSheetDrag(dom.choiceSheet, closeChoice);
}

function openTabSheet() {
  overlays.add('tabs');
  hideSuggestions();
  dom.tabSheet.classList.add('open');
  dom.tabSheet.setAttribute('aria-hidden', 'false');
  dom.tabSheetBackdrop.classList.add('open');
  closeOtherSheets('tabs');
  renderTabs();
  refreshTabMedia();
  syncNativeVisibility();

  const refreshSheet = () => {
    if (overlays.has('tabs')) renderTabs();
  };
  if (!tabsReady) {
    Promise.resolve(bootPromise).then(refreshSheet).catch(() => {});
    return;
  }
  if (!tabs.length) ensureTabExists().then(refreshSheet).catch(() => {});
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
  updateMenuModes();
  refreshReadingState();
  syncNativeVisibility();
}

function toggleDesktopSite() {
  const next = !settings.desktopMode;
  settings = Object.assign({}, settings, { desktopMode: next });
  Store.save('settings');
  readingModeOn = false;
  updateMenuModes();
  callPlugin('setDesktopMode', { enabled: next })
    .catch(() => pushNativeSettings(true))
    .then(() => {
      updateMenuModes();
      toast(next ? 'Desktop site on' : 'Desktop site off');
    });
  closeMenu();
}

function refreshReadingState() {
  if (!isHttpUrl(currentUrl)) {
    if (readingModeOn) {
      readingModeOn = false;
      updateMenuModes();
    }
    return;
  }
  callPlugin('getReadingMode')
    .then((result) => {
      const active = !!(result && result.enabled);
      if (active !== readingModeOn) {
        readingModeOn = active;
        updateMenuModes();
      }
    })
    .catch(() => {});
}

function toggleReadingMode() {
  if (!isHttpUrl(currentUrl)) {
    toast('Open a page to use reading mode');
    closeMenu();
    return;
  }
  const next = !readingModeOn;
  readingModeOn = next;
  updateMenuModes();
  closeMenu();
  callPlugin('toggleReadingMode', { enabled: next })
    .then((result) => {
      const applied = !!(result && result.applied);
      if (next && !applied) {
        readingModeOn = false;
        updateMenuModes();
        toast('Reading mode is not available for this page');
      } else {
        toast(next ? 'Reading mode on' : 'Reading mode off');
      }
    })
    .catch(() => {
      readingModeOn = !next;
      updateMenuModes();
      toast('Could not change reading mode');
    });
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

function mountPickList(container, options, current, onChange) {
  let selected = current;
  const list = el('div', 'pick-list' + (options.length > 5 ? ' scroll' : ''));
  list.setAttribute('role', 'radiogroup');
  const rows = options.map((option) => {
    const row = el('button', 'pick-row' + (option.value === selected ? ' is-selected' : ''));
    row.type = 'button';
    row.setAttribute('role', 'radio');
    row.setAttribute('aria-checked', String(option.value === selected));
    row.dataset.value = String(option.value);
    const radio = el('span', 'pick-radio');
    radio.setAttribute('aria-hidden', 'true');
    const text = el('span', 'pick-text');
    text.appendChild(el('span', 'pick-label', option.label));
    if (option.desc) text.appendChild(el('span', 'pick-desc', option.desc));
    row.append(radio, text);
    row.addEventListener('click', () => {
      selected = option.value;
      rows.forEach((item) => {
        const on = item.dataset.value === String(selected);
        item.classList.toggle('is-selected', on);
        item.setAttribute('aria-checked', String(on));
      });
      if (typeof onChange === 'function') onChange(selected);
    });
    list.appendChild(row);
    return row;
  });
  container.appendChild(list);
  return () => selected;
}

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
    downloadNotifications: !!settings.downloadNotifications,
    downloadLocation: settings.downloadLocation || '',
    askDownloadLocation: !!settings.askDownloadLocation,
    autoOpenPdf: !!settings.autoOpenPdf,
    autoOpenDownload: !!settings.autoOpenDownload,
    parallelDownloads: !!settings.parallelDownloads
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
  'downloadNotifications',
  'downloadLocation',
  'askDownloadLocation',
  'autoOpenPdf',
  'autoOpenDownload',
  'parallelDownloads'
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
  if (
    ['suggestions', 'suggestBookmarks', 'suggestHistory'].some((key) => patch[key] !== undefined) &&
    settings.suggestions &&
    document.activeElement === dom.urlInput &&
    overlays.size === 0
  ) {
    scheduleSuggestions();
  }
}

async function resetBrowsingSession() {
  await closeAllTabs();
  history = [];
  Store.save('history');
  updateMenuCounts();
  try {
    await callPlugin('clearBrowsingData', { history: true, cookies: true, cache: true, downloads: false });
  } catch (error) {
    /* ignore */
  }
  return true;
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

async function ensureTabExists() {
  if (!getPlugin()) return false;
  if (!Array.isArray(tabs)) tabs = [];
  if (tabs.length) return true;
  await refreshTabs().catch(() => {});
  if (tabs.length) return true;
  try {
    await callPlugin('createTab', { url: getHomePage(), activate: true });
  } catch (error) {
    return false;
  }
  await refreshTabs().catch(() => {});
  syncActiveTabUi();
  syncNav();
  return tabs.length > 0;
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
  if (!tabsReady) return;
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

function getTabMeta(id) {
  return tabMeta[id] || {};
}

function setTabMeta(id, patch) {
  tabMeta[id] = Object.assign({}, tabMeta[id], patch);
  Store.save('tabMeta');
}

function getTabGroup(id) {
  return tabGroups.find((group) => group.id === id) || null;
}

function groupTabs(groupId) {
  const ids = Array.from(tabSelection);
  if (ids.length < 2) return;
  const group = { id: groupId, name: getTabGroup(groupId).name, tabIds: ids, createdAt: Date.now() };
  tabGroups = tabGroups.map((g) => (g.id === groupId ? group : g));
  ids.forEach((id) => setTabMeta(id, { groupId }));
  tabSelection.clear();
  tabSelectionMode = false;
  renderTabs();
  toast('Tabs grouped');
}

function ungroupTabs(groupId) {
  const group = getTabGroup(groupId);
  if (!group) return;
  group.tabIds.forEach((id) => setTabMeta(id, { groupId: null }));
  tabGroups = tabGroups.filter((g) => g.id !== groupId);
  renderTabs();
  toast('Group removed');
}

function openTabGroup(groupId) {
  const group = getTabGroup(groupId);
  if (!group) return;
  tabGroupFilter = groupId;
  closeTabSheet();
  closeMenu();
  openTabSheet();
  renderTabs();
}

function closeTabGroupView() {
  tabGroupFilter = null;
  closeTabSheet();
  openTabSheet();
}

/* ------------------------------------------- Media & downloads per tab */

/* The native bridge scans every page for m3u8/mpd/mp4 media and reports which
 * tab it belongs to; downloads report the tab that started them. Both feed the
 * badges in the tab grid so the downloader-first flow is visible at a glance. */

function mediaCountForTab(tabId) {
  const entry = tabMedia[tabId];
  return entry ? Object.keys(entry).length : 0;
}

function noteTabMedia(tabId, url, kind) {
  if (typeof tabId !== 'number' || tabId < 0 || !url) return false;
  const entry = tabMedia[tabId] || (tabMedia[tabId] = {});
  const key = String(url);
  if (entry[key]) return false;
  entry[key] = kind || 'video';
  return true;
}

function dropTabMedia(tabId) {
  if (tabMedia[tabId] === undefined) return;
  delete tabMedia[tabId];
}

async function refreshTabMedia() {
  const plugin = getPlugin();
  if (!plugin || typeof plugin.getTabMedia !== 'function') return;
  try {
    const result = await plugin.getTabMedia();
    const items = Array.isArray(result && result.items) ? result.items : [];
    tabMedia = {};
    items.forEach((item) => noteTabMedia(Number(item && item.tabId), item && item.url, item && item.kind));
  } catch (error) {
    /* Keep whatever the live events already told us. */
  }
  updateDownloadsIndicator();
  if (overlays.has('tabs')) renderTabs();
}

function rebuildTabDownloadIndex() {
  const next = {};
  (downloadsCache || []).forEach((item) => {
    const tabId = Number(item && item.tabId);
    if (!Number.isFinite(tabId) || tabId < 0) return;
    const status = String((item && item.status) || '').toLowerCase();
    if (status !== 'running' && status !== 'pending' && status !== 'paused') return;
    const entry = next[tabId] || (next[tabId] = { active: 0, bytes: 0, total: 0 });
    entry.active += 1;
    entry.bytes += Number(item.bytes) || 0;
    entry.total += Number(item.totalBytes) || 0;
  });
  tabDownloadIndex = next;
  updateDownloadsIndicator();
  if (overlays.has('tabs')) renderTabs();
}

function tabDownloadBadgesMarkup(tabId) {
  const media = mediaCountForTab(tabId);
  const downloads = tabDownloadIndex[tabId];
  const parts = [];
  if (media > 0) {
    parts.push(`<span class="tab-dl-badge is-media" aria-hidden="true">${svgIcon('download', 'icon')}<span>${media}</span></span>`);
  }
  if (downloads && downloads.active > 0) {
    const percent = downloads.total > 0 ? Math.min(99, Math.round((downloads.bytes / downloads.total) * 100)) : 0;
    parts.push(`<span class="tab-dl-badge is-busy" aria-hidden="true">${svgIcon('download', 'icon')}<span>${percent ? percent + '%' : downloads.active}</span></span>`);
  }
  if (!parts.length) return '';
  return `<div class="tab-badges">${parts.join('')}</div>`;
}

function mediaHintForTab(tabId) {
  const media = mediaCountForTab(tabId);
  if (!media) return '';
  return media === 1 ? ' · 1 media file ready to download' : ' · ' + media + ' media files ready to download';
}

function updateDownloadsIndicator() {
  const hasMedia = mediaCountForTab(activeTabId) > 0;
  if (dom.downloadsBtn) {
    dom.downloadsBtn.classList.toggle('has-media', hasMedia);
    dom.downloadsBtn.setAttribute('aria-label', hasMedia ? 'Downloads, media available' : 'Downloads');
  }
  if (dom.downloadsMediaDot) dom.downloadsMediaDot.classList.toggle('hidden', !hasMedia);
  if (dom.tabDownloadsMediaDot) {
    const anyMedia = Object.keys(tabMedia).some((id) => mediaCountForTab(Number(id)) > 0);
    dom.tabDownloadsMediaDot.classList.toggle('hidden', !anyMedia);
  }
}

function announceTabMedia(tabId) {
  if (tabId !== activeTabId || mediaCountForTab(tabId) < 1) return;
  const now = Date.now();
  if (mediaToastTabId === tabId && now - mediaToastAt < 15000) return;
  mediaToastTabId = tabId;
  mediaToastAt = now;
  toast('Media available to download');
}

function tabCardMarkup(tab) {
  const isActive = tab.id === activeTabId;
  const meta = getTabMeta(tab.id);
  const isPinned = meta.pinned === true;
  const isSelected = tabSelectionMode && tabSelection.has(tab.id);
  const inGroup = tabGroupFilter && meta.groupId === tabGroupFilter;
  const isGroupCard = false;

  const title = tab.title || 'New tab';
  const host = hostOf(tab.url) || (isActive ? 'Start page' : 'Empty tab');
  const monogram = (host.replace(/^www\./i, '')[0] || '?').toUpperCase();
  const favicon = host ? favicons[hostOf(tab.url)] : null;
  const preview = favicon
    ? `<span class="tab-monogram"><img src="${escapeHtml(favicon)}" alt=""></span>`
    : `<span class="tab-monogram">${escapeHtml(monogram)}</span>`;
  const miniFavicon = tab.url && isHttpUrl(tab.url) ? faviconMarkup(tab.url) : '';

  const pinButton = `
    <button class="tab-pin${isPinned ? ' is-pinned' : ''}" type="button" data-tab-pin="${tab.id}" aria-label="${isPinned ? 'Unpin tab' : 'Pin tab'}">
      ${svgIcon('pin', 'icon icon-sm')}
    </button>`;

  const checkButton = tabSelectionMode
    ? `<button class="tab-check" type="button" data-tab-check="${tab.id}" aria-label="${isSelected ? 'Deselect tab' : 'Select tab'}"><svg class="icon icon-xs" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></button>`
    : '';

  const classes = 'tab-card' + (isActive ? ' is-active' : '') + (isPinned ? ' is-pinned' : '') + (isSelected ? ' is-selected' : '') + (tabSelectionMode ? ' is-selecting' : '');
  const badges = tabDownloadBadgesMarkup(tab.id);
  const mediaHint = mediaHintForTab(tab.id);

  return `
    <div class="${classes}" role="button" tabindex="0" data-tab-id="${tab.id}" aria-label="${escapeHtml(title + mediaHint)}" aria-pressed="${isActive}"${isGroupCard ? ' data-group-card="true"' : ''}>
      ${pinButton}
      ${checkButton}
      <div class="tab-preview">
        ${preview}
        ${badges}
        <button class="tab-close" type="button" data-close-tab="${tab.id}" aria-label="Close tab: ${escapeHtml(title)}">
          ${svgIcon('close', 'icon icon-xs')}
        </button>
      </div>
      <div class="tab-meta">
        <div class="tab-meta-title">
          ${miniFavicon}
          <span class="tab-title">${escapeHtml(title)}</span>
        </div>
        <div class="tab-host">${escapeHtml(host)}${isActive ? ' · Active' : ''}</div>
      </div>
    </div>`;
}

function toggleTabSelection() {
  tabSelectionMode = !tabSelectionMode;
  if (!tabSelectionMode) {
    tabSelection.clear();
  }
  renderTabs();
}

function groupSelectedTabs() {
  if (tabSelection.size < 2) return;
  openDialog({
    title: 'New tab group',
    message: 'Enter a name for this group of tabs.',
    confirmLabel: 'Create group',
    body: (body) => {
      const label = el('label', 'dialog-field-label', 'Group name');
      label.setAttribute('for', 'groupNameInput');
      const input = el('input', 'text-input');
      input.id = 'groupNameInput';
      input.type = 'text';
      input.maxLength = 40;
      input.placeholder = 'e.g. Work, Research, Shopping';
      input.autocomplete = 'off';
      input.value = 'Tab Group';
      body.append(label, input);
      window.setTimeout(() => { input.focus(); input.select(); }, 60);
    },
    onConfirm: () => {
      const input = $('groupNameInput');
      const name = input ? input.value.trim() : '';
      if (!name) {
        toast('Enter a group name');
        return false;
      }
      const groupId = 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const group = { id: groupId, name, tabIds: Array.from(tabSelection), createdAt: Date.now() };
      tabGroups.push(group);
      Store.save('tabGroups');
      tabSelection.forEach((id) => setTabMeta(id, { groupId }));
      tabSelection.clear();
      tabSelectionMode = false;
      renderTabs();
      toast('Tab group created');
    }
  });
}
function validTabGroups() {
  return (Array.isArray(tabGroups) ? tabGroups : []).filter(
    (group) => group && group.id && group.name && Array.isArray(group.tabIds)
  );
}

function groupCardMarkup(group) {
  const tabIds = Array.isArray(group.tabIds) ? group.tabIds : [];
  const tabCount = tabIds.length;
  const isActiveGroup = tabIds.indexOf(activeTabId) !== -1;
  const previewTabs = tabIds.slice(0, 4);
  const previews = previewTabs.map((id) => {
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return '';
    const host = hostOf(tab.url) || 'Empty';
    const monogram = (host.replace(/^www\./i, '')[0] || '?').toUpperCase();
    const favicon = host ? favicons[hostOf(tab.url)] : null;
    return favicon
      ? `<span class="group-mini-monogram"><img src="${escapeHtml(favicon)}" alt=""></span>`
      : `<span class="group-mini-monogram">${escapeHtml(monogram)}</span>`;
  }).join('');

  return `
    <div class="tab-card group-preview${isActiveGroup ? ' is-active' : ''}" role="button" tabindex="0" data-group-id="${group.id}" aria-label="Open group: ${escapeHtml(group.name)}">
      <div class="group-icon">
        ${svgIcon('layers', 'icon')}
      </div>
      <div class="tab-meta">
        <div class="tab-meta-title">
          <span class="tab-title">${escapeHtml(group.name)}</span>
          <span class="tab-host">${tabCount} ${tabCount === 1 ? 'tab' : 'tabs'}</span>
        </div>
        <div class="tab-host">${previews}</div>
      </div>
      <button class="icon-btn icon-btn-sm" type="button" data-group-close="${group.id}" aria-label="Close group">
        ${svgIcon('close', 'icon icon-xs')}
      </button>
    </div>`;
}

function renderTabs() {
  if (!dom.tabsList) return;
  updateTabBadge();
  updateDownloadsIndicator();
  const hasTabs = tabs.length > 0;
  dom.tabsEmpty.classList.toggle('hidden', hasTabs);
  dom.tabSelectBar.classList.toggle('hidden', !tabSelectionMode);
  dom.tabSelectCount.textContent = tabSelection.size + ' selected';
  dom.tabGroupBtn.disabled = tabSelection.size < 2;
  dom.tabSelectBtn.setAttribute('aria-pressed', String(tabSelectionMode));

  const metaById = {};
  tabs.forEach((tab) => { metaById[tab.id] = getTabMeta(tab.id); });

  if (tabGroupFilter) {
    const group = getTabGroup(tabGroupFilter);
    if (!group) {
      tabGroupFilter = null;
      renderTabs();
      return;
    }
    const groupTabs = tabs.filter((tab) => getTabMeta(tab.id).groupId === tabGroupFilter);
    let html = '<div class="tab-group-view">';
    html += `
      <button class="icon-btn icon-btn-sm" type="button" data-group-back="true" aria-label="Back to all tabs">
        ${svgIcon('chevron', 'icon')}
      </button>
      <span class="tab-section-label">${escapeHtml(group.name)}</span>
      <button class="icon-btn icon-btn-sm" type="button" data-group-ungroup="${group.id}" aria-label="Ungroup tabs">
        ${svgIcon('layers', 'icon')}
      </button>
    </div>`;
    if (groupTabs.length) {
      html += '<div class="tab-grid is-pinned">' + groupTabs.map(tabCardMarkup).join('') + '</div>';
    } else {
      html += '<div class="empty">No tabs in this group</div>';
    }
    dom.tabsList.innerHTML = html;
    return;
  }

  const groups = validTabGroups();
  const pinned = tabs.filter((tab) => metaById[tab.id].pinned === true);
  const grouped = new Set();
  groups.forEach((group) => group.tabIds.forEach((id) => grouped.add(id)));
  const ungrouped = tabs.filter((tab) => !metaById[tab.id].pinned && !grouped.has(tab.id));

  let html = '';
  try {
    /* Groups live in a horizontally scrollable carousel at the top of the
     * sheet; with no groups the whole section stays out of the way. */
    if (groups.length) {
      html += '<div class="tab-section-head"><span class="icon">' + svgIcon('layers', 'icon') + '</span><span class="tab-section-label">Groups</span><span class="tab-section-count">' + groups.length + '</span></div>';
      html += '<div class="tab-group-carousel" aria-label="Tab groups">' + groups.map(groupCardMarkup).join('') + '</div>';
    }
    if (pinned.length) {
      html += '<div class="tab-section-head"><span class="icon">' + svgIcon('pin', 'icon') + '</span><span class="tab-section-label">Pinned</span></div>';
      html += '<div class="tab-grid is-pinned">' + pinned.map(tabCardMarkup).join('') + '</div>';
    }
    if (ungrouped.length) {
      html += '<div class="tab-section-head"><span class="icon">' + svgIcon('newtab', 'icon') + '</span><span class="tab-section-label">Tabs</span><span class="tab-section-count">' + ungrouped.length + '</span></div>';
      html += '<div class="tab-grid">' + ungrouped.map(tabCardMarkup).join('') + '</div>';
    }
  } catch (error) {
    /* One malformed card must never blank the whole tab manager. */
    console.warn('[4keeper] Tab render fell back to a flat list:', error);
    html = '';
    try {
      if (tabs.length) {
        html += '<div class="tab-section-head"><span class="icon">' + svgIcon('newtab', 'icon') + '</span><span class="tab-section-label">Tabs</span></div>';
        html += '<div class="tab-grid">' + tabs.map(tabCardMarkup).join('') + '</div>';
      }
    } catch (inner) {
      html = '';
    }
  }
  dom.tabsList.innerHTML = html;
  dom.tabsEmpty.classList.toggle('hidden', hasTabs);
}

async function createTabWithUrl(url, activate) {
  await mountBrowser();
  const target = buildHomeUrl(url || getHomePage());
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
  const url = buildHomeUrl(normalizeUrl(raw));
  if (!url) return;

  hideSuggestions();
  closeTabSheet();
  closeMenu();
  closeSiteInfo();
  if (readingModeOn) {
    readingModeOn = false;
    updateMenuModes();
  }

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
  tabSelection.delete(id);
  dropTabMedia(id);
  if (tabDownloadIndex[id]) {
    delete tabDownloadIndex[id];
    updateDownloadsIndicator();
  }
  const meta = getTabMeta(id);
  if (meta.groupId) {
    tabGroups = tabGroups.map((group) => {
      if (group.id !== meta.groupId) return group;
      const next = Object.assign({}, group);
      next.tabIds = group.tabIds.filter((tid) => tid !== id);
      return next;
    });
    tabGroups = tabGroups.filter((group) => group.tabIds.length > 0);
    Store.save('tabGroups');
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
  tabMedia = {};
  await refreshTabs();
  syncActiveTabUi();
  syncNav();
  saveSession();
}

/* ------------------------------------------------------------ Suggestions */

function hideSuggestions() {
  const wasOpen = overlays.has('suggestions') || !dom.suggestions.classList.contains('hidden');
  window.clearTimeout(suggestionTimer);
  suggestionTimer = null;
  suggestionRequest++;
  if (overlays.has('suggestions')) {
    overlays.delete('suggestions');
  }
  dom.suggestions.classList.add('hidden');
  dom.suggestionsList.innerHTML = '';
  suggestionItems = [];
  if (wasOpen) syncNativeVisibility();
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
  if (settings.suggestBookmarks !== false) bookmarks.forEach((item) => add(item.url, item.title, 'Bookmark'));
  if (settings.suggestHistory !== false) history.forEach((item) => add(item.url, item.title, 'History'));
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

async function fetchRemoteSuggestions(url) {
  let body = null;
  try {
    const result = await callPlugin('fetchUrl', { url });
    if (result && typeof result.body === 'string' && result.body) body = result.body;
  } catch (error) {
    body = null;
  }
  if (!body) {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeout = window.setTimeout(() => controller && controller.abort(), 2000);
      const response = await fetch(url, controller ? { signal: controller.signal } : undefined);
      window.clearTimeout(timeout);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      body = await response.text();
    } catch (error) {
      return null;
    }
  }
  try {
    return JSON.parse(body);
  } catch (error) {
    return null;
  }
}

async function fetchSuggestions(query) {
  const engine = getEngine();
  const local = localSuggestions(query);
  const urlLike = isProbablyUrl(query);
  const searchItem = { text: query, hint: urlLike ? 'Open' : 'Search' };
  showSuggestionItems(local.concat(searchItem));
  if (!engine.suggest || urlLike) return;

  const requestId = ++suggestionRequest;
  const data = await fetchRemoteSuggestions(engine.suggest(query));
  if (!data || requestId !== suggestionRequest) return;

  const merged = local.slice();
  const seen = new Set(merged.map((item) => item.text.toLowerCase()));
  seen.add(query.toLowerCase());
  parseSuggestions(data, settings.searchEngine).forEach((text) => {
    const key = String(text).toLowerCase();
    if (!text || seen.has(key)) return;
    seen.add(key);
    merged.push({ text: String(text), hint: '' });
  });
  merged.push(searchItem);
  showSuggestionItems(merged.slice(0, 8));
}

function scheduleSuggestions() {
  window.clearTimeout(suggestionTimer);
  suggestionRequest++;
  const query = dom.urlInput.value.trim();
  dom.clearUrlBtn.classList.toggle('hidden', !query);
  if (!settings.suggestions || !query) {
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

const DATA_RANGES = [
  ['15min', 'Last 15 minutes', 15 * 60000],
  ['hour', 'Last hour', 3600000],
  ['day', 'Last 24 hours', 86400000],
  ['week', 'Last 7 days', 7 * 86400000],
  ['month', 'Last 4 weeks', 28 * 86400000],
  ['all', 'All time', Infinity]
];

function clearHistoryData(range) {
  const def = DATA_RANGES.find((item) => item[0] === range) || DATA_RANGES[5];
  if (def[2] === Infinity) {
    history = [];
  } else {
    const cutoff = Date.now() - def[2];
    history = history.filter((item) => item.timestamp < cutoff);
  }
  Store.save('history');
  renderHistory();
  updateMenuCounts();
}

function openClearData() {
  let range = 'all';
  openDialog({
    title: 'Delete browsing data',
    message: 'Choose a time range and what to remove. Bookmarks, settings and downloads stay.',
    confirmLabel: 'Delete data',
    destructive: true,
    body: (body) => {
      const label = el('div', 'dialog-field-label', 'Time range');
      const rangeHost = el('div');
      const readRange = mountPickList(
        rangeHost,
        DATA_RANGES.map(([value, text]) => ({ value, label: text })),
        range,
        (next) => {
          range = next;
        }
      );
      range = readRange();

      const what = el('div', 'dialog-field-label', 'What to delete');
      const wrap = el('div', 'dialog-options');
      [
        ['history', 'Browsing history', true],
        ['cookies', 'Cookies and site data', true],
        ['cache', 'Cached images and files', true]
      ].forEach(([key, text, checked]) => {
        const row = el('label', 'dialog-check');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = 'clear-' + key;
        input.checked = checked;
        row.append(input, el('span', '', text));
        wrap.appendChild(row);
      });

      body.append(label, rangeHost, what, wrap);
    },
    onConfirm: async () => {
      const checked = (key) => {
        const input = $('clear-' + key);
        return !!(input && input.checked);
      };
      const flags = {
        history: checked('history'),
        cookies: checked('cookies'),
        cache: checked('cache')
      };
      if (!flags.history && !flags.cookies && !flags.cache) {
        toast('Nothing selected to delete');
        return false;
      }
      if (flags.history) clearHistoryData(range);
      const nativeHistory = flags.history && range === 'all';
      if (flags.cookies || flags.cache || nativeHistory) {
        try {
          await callPlugin('clearBrowsingData', {
            history: nativeHistory,
            cookies: flags.cookies,
            cache: flags.cache,
            downloads: false
          });
        } catch (error) {
          toast('Could not clear some browsing data');
          return false;
        }
      }
      if (range === 'all') await resetBrowsingSession();
      toast(range === 'all' ? 'All browsing data deleted' : 'Browsing data deleted');
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
  dom.clearHistoryBtn.classList.remove('hidden');

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

function folderById(id) {
  if (!id) return null;
  return bookmarkFolders.find((folder) => folder.id === id) || null;
}

function folderBookmarkCount(folderId) {
  return bookmarks.filter((item) => item.folderId === folderId).length;
}

function createBookmarkFolder(name) {
  const clean = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  if (!clean) return null;
  const existing = bookmarkFolders.find((folder) => folder.name.toLowerCase() === clean.toLowerCase());
  if (existing) return existing;
  const folder = {
    id: 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: clean,
    createdAt: Date.now()
  };
  bookmarkFolders.push(folder);
  Store.save('folders');
  return folder;
}

function promptFolderName(options) {
  const opts = options || {};
  openDialog({
    title: opts.title || 'New folder',
    message: opts.message || 'Bookmarks you move here stay grouped together.',
    confirmLabel: opts.confirmLabel || 'Create',
    body: (body) => {
      const label = el('label', 'dialog-field-label', 'Folder name');
      label.setAttribute('for', 'folderNameInput');
      const input = el('input', 'text-input');
      input.id = 'folderNameInput';
      input.type = 'text';
      input.maxLength = 60;
      input.placeholder = 'e.g. Work, Recipes, Reading';
      input.autocomplete = 'off';
      input.value = opts.value || '';
      body.append(label, input);
      window.setTimeout(() => input.focus(), 60);
    },
    onConfirm: () => {
      const input = $('folderNameInput');
      const name = input ? input.value.trim() : '';
      if (!name) {
        toast('Enter a folder name');
        return false;
      }
      const folder = createBookmarkFolder(name);
      if (!folder) {
        toast('That name cannot be used');
        return false;
      }
      if (typeof opts.onDone === 'function') opts.onDone(folder);
      if (overlays.has('bookmarks')) renderBookmarks();
    }
  });
}

function moveBookmarkToFolder(id, folderId) {
  const item = bookmarks.find((bookmark) => bookmark.id === id);
  if (!item) return;
  const folder = folderId ? folderById(folderId) : null;
  if (folder) item.folderId = folder.id;
  else delete item.folderId;
  Store.save('bookmarks');
  renderBookmarks();
  toast(folder ? 'Moved to ' + folder.name : 'Moved to Unfiled');
}

function openBookmarkFolderPicker(id) {
  const item = bookmarks.find((bookmark) => bookmark.id === id);
  if (!item) return;
  const options = [{ value: '', label: 'No folder', desc: 'Keep this bookmark unfiled' }];
  bookmarkFolders.forEach((folder) => {
    options.push({
      value: folder.id,
      label: folder.name,
      desc: folderBookmarkCount(folder.id) + ' saved'
    });
  });
  options.push({ value: '__new', label: 'New folder…', desc: 'Create a folder and move it there' });
  openChoice('Move bookmark', options, item.folderId || '', (value) => {
    if (value === '__new') {
      promptFolderName({
        title: 'New folder',
        message: 'The bookmark will be moved into this folder.',
        onDone: (folder) => moveBookmarkToFolder(id, folder.id)
      });
      return;
    }
    moveBookmarkToFolder(id, value);
  });
}

function renameBookmarkFolder(folderId) {
  const folder = folderById(folderId);
  if (!folder) return;
  promptFolderName({
    title: 'Rename folder',
    message: 'Choose a new name for this folder.',
    confirmLabel: 'Save',
    value: folder.name,
    onDone: (renamed) => {
      folder.name = renamed.name;
      Store.save('folders');
      renderBookmarks();
      toast('Folder renamed');
    }
  });
}

function deleteBookmarkFolder(folderId) {
  const folder = folderById(folderId);
  if (!folder) return;
  const count = folderBookmarkCount(folderId);
  openDialog({
    title: 'Delete "' + folder.name + '"?',
    message: count
      ? 'The folder is removed and its ' + count + (count === 1 ? ' bookmark moves' : ' bookmarks move') + ' to Unfiled.'
      : 'This empty folder will be removed.',
    confirmLabel: 'Delete folder',
    destructive: true,
    onConfirm: () => {
      bookmarkFolders = bookmarkFolders.filter((item) => item.id !== folderId);
      bookmarks = bookmarks.map((item) => {
        if (item.folderId !== folderId) return item;
        const next = Object.assign({}, item);
        delete next.folderId;
        return next;
      });
      Store.save('folders');
      Store.save('bookmarks');
      renderBookmarks();
      toast('Folder deleted');
    }
  });
}

function bookmarkRowMarkup(item) {
  return `
    <div class="list-item" data-bookmark-open="${item.id}">
      ${faviconMarkup(item.url)}
      <div class="list-text">
        <div class="list-title">${escapeHtml(item.title || hostOf(item.url))}</div>
        <div class="list-subtitle">${escapeHtml(displayUrl(item.url))}</div>
      </div>
      <div class="list-meta">
        <button class="icon-btn icon-btn-sm" type="button" data-bookmark-move="${item.id}" aria-label="Move bookmark to a folder">
          ${svgIcon('folder', 'icon icon-sm')}
        </button>
        <button class="icon-btn icon-btn-sm" type="button" data-bookmark-delete="${item.id}" aria-label="Remove bookmark">
          ${svgIcon('close', 'icon icon-xs')}
        </button>
      </div>
    </div>`;
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

  if (!bookmarks.length) {
    dom.bookmarksList.innerHTML = `
      <div class="empty">
        ${svgIcon('bookmark', 'empty-icon')}
        <div class="empty-title">No bookmarks yet</div>
        <div class="empty-text">Use the menu to bookmark the page you are on, or import an HTML file from another browser.</div>
      </div>`;
    return;
  }

  if (!items.length) {
    dom.bookmarksList.innerHTML = `
      <div class="empty">
        ${svgIcon('search', 'empty-icon')}
        <div class="empty-title">No matching bookmarks</div>
        <div class="empty-text">Try a different search.</div>
      </div>`;
    return;
  }

  if (query) {
    dom.bookmarksList.innerHTML = items.map(bookmarkRowMarkup).join('');
    return;
  }

  const knownFolderIds = new Set(bookmarkFolders.map((folder) => folder.id));
  let html = '';

  bookmarkFolders.forEach((folder) => {
    const list = items.filter((item) => item.folderId === folder.id);
    html += `
      <div class="folder-head">
        ${svgIcon('folder', 'icon')}
        <div class="folder-head-text">
          <span class="folder-head-name">${escapeHtml(folder.name)}</span>
          <span class="folder-head-count">${list.length}</span>
        </div>
        <button class="icon-btn icon-btn-sm" type="button" data-folder-rename="${escapeHtml(folder.id)}" aria-label="Rename folder">
          ${svgIcon('text', 'icon icon-sm')}
        </button>
        <button class="icon-btn icon-btn-sm" type="button" data-folder-delete="${escapeHtml(folder.id)}" aria-label="Delete folder">
          ${svgIcon('trash', 'icon icon-sm')}
        </button>
      </div>`;
    html += list.length
      ? list.map(bookmarkRowMarkup).join('')
      : '<div class="folder-empty">No bookmarks in this folder yet</div>';
  });

  const loose = items.filter((item) => !item.folderId || !knownFolderIds.has(item.folderId));
  if (loose.length) {
    if (bookmarkFolders.length) html += '<div class="list-section-title">Unfiled</div>';
    html += loose.map(bookmarkRowMarkup).join('');
  }

  dom.bookmarksList.innerHTML = html;
}

/* ------------------------------------- Bookmark import / export (HTML) */

function openBookmarksMenu() {
  dom.bookmarksMenuBtn.setAttribute('aria-expanded', 'true');
  openChoice('Bookmarks', [
    { value: 'folder', label: 'New folder', desc: 'Group bookmarks together' },
    { value: 'import', label: 'Import bookmarks (HTML)', desc: 'Chrome, Edge, Firefox or Safari export' },
    { value: 'export', label: 'Export bookmarks (HTML)', desc: 'Save bookmarks.html with every folder' }
  ], '', (value) => {
    dom.bookmarksMenuBtn.setAttribute('aria-expanded', 'false');
    if (value === 'folder') promptFolderName({});
    else if (value === 'import') openBookmarkImport();
    else if (value === 'export') exportBookmarksHtml();
  });
}

function openBookmarkImport() {
  if (!dom.bookmarkImportInput) {
    toast('Import is not available');
    return;
  }
  dom.bookmarkImportInput.value = '';
  dom.bookmarkImportInput.click();
}

function nearestBookmarkFolderName(anchor) {
  let node = anchor.parentElement;
  while (node && node.tagName !== 'DL') node = node.parentElement;
  while (node) {
    const holder = node.parentElement;
    if (holder && holder.tagName === 'DT') {
      const heading = Array.from(holder.children).find((child) => child.tagName === 'H3');
      const name = heading ? (heading.textContent || '').trim() : '';
      if (name) return name;
    }
    let next = node.parentElement;
    while (next && next.tagName !== 'DL') next = next.parentElement;
    node = next;
  }
  return '';
}

function importBookmarkHtml(source) {
  let doc;
  try {
    doc = new DOMParser().parseFromString(String(source || ''), 'text/html');
  } catch (error) {
    toast('That file could not be read');
    return;
  }
  const anchors = Array.from(doc.querySelectorAll('a[href]'));
  if (!anchors.length) {
    toast('No bookmarks found in that file');
    return;
  }

  const known = new Set(bookmarks.map((item) => item.url));
  let added = 0;
  let skipped = 0;
  const now = Date.now();

  anchors.forEach((anchor) => {
    const href = String(anchor.getAttribute('href') || '').trim();
    if (!isHttpUrl(href) || known.has(href)) {
      skipped++;
      return;
    }
    known.add(href);
    const title = (anchor.textContent || '').trim().slice(0, 300) || hostOf(href) || href;
    const addDate = Number(anchor.getAttribute('add_date') || anchor.getAttribute('ADD_DATE')) || 0;
    const timestamp = addDate > 100000000000 ? addDate : addDate > 1000000000 ? addDate * 1000 : now + added;
    const entry = { id: now + added, url: href, title, timestamp };
    const folderName = nearestBookmarkFolderName(anchor);
    if (folderName) {
      const folder = createBookmarkFolder(folderName);
      if (folder) entry.folderId = folder.id;
    }
    bookmarks.unshift(entry);
    added++;
  });

  Store.save('bookmarks');
  Store.save('folders');
  updateMenuCounts();
  if (overlays.has('bookmarks')) renderBookmarks();

  if (!added) {
    toast('No new bookmarks to import');
    return;
  }
  toast('Imported ' + added + (added === 1 ? ' bookmark' : ' bookmarks') + (skipped ? ' · ' + skipped + ' skipped' : ''));
}

function handleBookmarkFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => importBookmarkHtml(reader.result);
  reader.onerror = () => toast('That file could not be read');
  reader.readAsText(file);
}

function buildBookmarksHtml() {
  const lines = [];
  lines.push('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
  lines.push('<!-- This is an automatically generated file. It will be read and overwritten. -->');
  lines.push('<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">');
  lines.push('<TITLE>Bookmarks</TITLE>');
  lines.push('<H1>Bookmarks</H1>');
  lines.push('<DL><p>');

  const escapeAttr = (value) => escapeHtml(value).replace(/`/g, '&#96;');
  const anchorLine = (item, indent) => {
    const addDate = Math.round((Number(item.timestamp) || Date.now()) / 1000);
    return indent + '<DT><A HREF="' + escapeAttr(item.url) + '" ADD_DATE="' + addDate + '">' +
      escapeAttr(item.title || hostOf(item.url) || item.url) + '</A>';
  };

  bookmarkFolders.forEach((folder) => {
    const list = bookmarks.filter((item) => item.folderId === folder.id);
    if (!list.length) return;
    lines.push('    <DT><H3>' + escapeAttr(folder.name) + '</H3>');
    lines.push('    <DL><p>');
    list.forEach((item) => lines.push(anchorLine(item, '        ')));
    lines.push('    </DL><p>');
  });

  const knownFolderIds = new Set(bookmarkFolders.map((folder) => folder.id));
  bookmarks
    .filter((item) => !item.folderId || !knownFolderIds.has(item.folderId))
    .forEach((item) => lines.push(anchorLine(item, '    ')));

  lines.push('</DL><p>');
  return lines.join('\n') + '\n';
}

function exportBookmarksHtml() {
  if (!bookmarks.length) {
    toast('There are no bookmarks to export');
    return;
  }
  const html = buildBookmarksHtml();
  const fileName = 'bookmarks.html';
  let blobUrl = '';
  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    blobUrl = (window.URL || window.webkitURL).createObjectURL(blob);
  } catch (error) {
    blobUrl = '';
  }

  if (!blobUrl) {
    toast('Export is not supported here');
    return;
  }

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  try {
    link.click();
    toast('Exported ' + fileName);
  } catch (error) {
    toast('Could not start the export');
  }
  window.setTimeout(() => {
    try {
      (window.URL || window.webkitURL).revokeObjectURL(blobUrl);
    } catch (error) {
      /* ignore */
    }
    link.remove();
  }, 5000);
}

function openBookmarks() {
  dom.bookmarksSearch.value = '';
  renderBookmarks();
  openScreen('bookmarks', dom.bookmarksScreen);
  closeMenu();
}

function closeBookmarks() {
  dom.bookmarksMenuBtn.setAttribute('aria-expanded', 'false');
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

function isImageDownload(item) {
  const mime = String((item && item.mime) || '').toLowerCase();
  if (mime.indexOf('image/') === 0) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif|avif)$/i.test(String((item && item.filename) || ''));
}

function downloadFilterMatch(item) {
  if (downloadsFilter === 'images') return isImageDownload(item);
  if (downloadsFilter === 'other') return !isImageDownload(item);
  return true;
}

function downloadsToolbarMarkup() {
  const counts = { all: downloadsCache.length, images: 0, other: 0 };
  downloadsCache.forEach((item) => {
    if (isImageDownload(item)) counts.images += 1;
    else counts.other += 1;
  });
  const chip = (value, label, count) => `
    <button class="filter-chip${downloadsFilter === value ? ' is-active' : ''}" type="button" data-download-filter="${value}">
      ${label}${count ? `<span class="filter-count">${count}</span>` : ''}
    </button>`;
  const usage = downloadsUsage.totalBytes
    ? `Using ${formatBytes(downloadsUsage.usedBytes)} of ${formatBytes(downloadsUsage.totalBytes)}`
    : '';
  return `
    <div class="downloads-toolbar">
      ${usage ? `<div class="downloads-storage">${escapeHtml(usage)}</div>` : ''}
      <div class="filter-chips">
        ${chip('all', 'All', counts.all)}
        ${chip('images', 'Images', counts.images)}
        ${chip('other', 'Other', counts.other)}
      </div>
    </div>`;
}

function renderDownloads() {
  const items = downloadsCache.filter(downloadFilterMatch);
  const emptyMarkup = downloadsCache.length
    ? `<div class="empty">
        ${svgIcon('download', 'empty-icon')}
        <div class="empty-title">No matching downloads</div>
        <div class="empty-text">Try another filter.</div>
      </div>`
    : `<div class="empty">
        ${svgIcon('download', 'empty-icon')}
        <div class="empty-title">No downloads</div>
        <div class="empty-text">Files you download are saved to your selected download folder.</div>
      </div>`;

  dom.downloadsList.innerHTML = downloadsToolbarMarkup() + (items.length
    ? items
      .map((item) => {
        const status = String(item.status || '').toLowerCase();
        const failed = status === 'failed' || status === 'unknown';
        const missing = item.exists === false;
        const done = status === 'successful' || status === 'completed';
        return `
        <div class="list-item download-item">
          <span class="favicon">${isImageDownload(item) ? svgIcon('external', 'icon icon-sm') : svgIcon('download', 'icon icon-sm')}</span>
          <div class="list-text">
            <div class="list-title">${escapeHtml(item.filename || 'Download')}</div>
            <div class="list-subtitle" data-download-status="${escapeHtml(item.id)}">${escapeHtml(downloadStatus(item))}${item.mime ? ' · ' + escapeHtml(String(item.mime).split('/').pop()) : ''}</div>
          </div>
          <div class="list-actions">
            <button class="icon-btn icon-btn-sm" type="button" data-download-open="${escapeHtml(item.id)}" aria-label="Open download"${!done || failed || missing ? ' disabled' : ''}>
              ${svgIcon('external', 'icon icon-xs')}
            </button>
            <button class="icon-btn icon-btn-sm" type="button" data-download-remove="${escapeHtml(item.id)}" aria-label="Remove download">
              ${svgIcon('trash', 'icon icon-xs')}
            </button>
          </div>
        </div>`;
      })
      .join('')
    : emptyMarkup);
}

async function fetchDownloads() {
  try {
    const result = await callPlugin('getDownloads');
    downloadsCache = Array.isArray(result && result.items) ? result.items : [];
    downloadsUsage = {
      usedBytes: Number(result && result.usedBytes) || 0,
      totalBytes: Number(result && result.totalBytes) || 0
    };
  } catch (error) {
    downloadsCache = [];
    downloadsUsage = { usedBytes: 0, totalBytes: 0 };
  }
  rebuildTabDownloadIndex();
  return downloadsCache;
}

async function loadDownloads() {
  await fetchDownloads();
  renderDownloads();
}

function updateDownloadProgress(data) {
  if (!data || typeof data.id !== 'number') return;
  const item = downloadsCache.find((entry) => Number(entry.id) === data.id);
  if (!item) return;
  item.bytes = Number(data.bytes) || 0;
  item.totalBytes = Number(data.totalBytes) || 0;
  if (data.status) item.status = data.status;
  const row = dom.downloadsList.querySelector('[data-download-status="' + data.id + '"]');
  if (row) {
    row.textContent = downloadStatus(item) + (item.mime ? ' · ' + String(item.mime).split('/').pop() : '');
  }
}

function openDownloads() {
  closeTabSheet();
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

function settingSection(title, rows) {
  return `
    <div class="section-label">${escapeHtml(title)}</div>
    <div class="setting-group">${rows}</div>`;
}

function settingRowButton(icon, label, description, value, action) {
  return `
    <button class="setting-row" type="button" data-action="${escapeHtml(action)}">
      <span class="setting-text">
        <span class="setting-label">${escapeHtml(label)}</span>
        ${description ? `<span class="setting-desc">${escapeHtml(description)}</span>` : ''}
      </span>
      <span class="setting-value">${escapeHtml(value || '')}</span>
      ${svgIcon('chevron', 'icon icon-sm setting-chevron')}
    </button>`;
}

function settingRowToggle(key, label, description, extraClass) {
  const on = !!settings[key];
  return `
    <div class="setting-row is-toggle${extraClass ? ' ' + extraClass : ''}" data-toggle="${escapeHtml(key)}">
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
      <span class="setting-text">
        <span class="setting-label">${escapeHtml(label)}</span>
        ${description ? `<span class="setting-desc">${escapeHtml(description)}</span>` : ''}
      </span>
      ${svgIcon('chevron', 'icon icon-sm setting-chevron')}
    </button>`;
}

function settingNavRow(icon, label, description, section, value) {
  return `
    <button class="setting-row" type="button" data-section="${escapeHtml(section)}">
      <span class="setting-icon">${svgIcon(icon)}</span>
      <span class="setting-text">
        <span class="setting-label">${escapeHtml(label)}</span>
        ${description ? `<span class="setting-desc">${escapeHtml(description)}</span>` : ''}
      </span>
      <span class="setting-value">${escapeHtml(value || '')}</span>
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
    ${settingSection('General', `
      ${settingNavRow('palette', 'Appearance', 'Theme, density and address style', 'appearance', themeLabel())}
      ${settingNavRow('search', 'Search', 'Search engine, homepage and startup', 'search', engineLabel())}
      ${settingNavRow('shield', 'Privacy and security', 'Tracking, cookies and safe browsing', 'privacy', cookiesLabel())}
    `)}
    ${settingSection('Content', `
      ${settingNavRow('sliders', 'Site settings', 'JavaScript, pop-ups and zoom', 'site', (Number(settings.textZoom) || 100) + '%')}
      ${settingNavRow('download', 'Downloads', 'Notifications and saved files', 'downloads', settings.downloadNotifications ? 'On' : 'Off')}
    `)}
    ${settingSection('Data', `
      ${settingNavRow('trash', 'Delete browsing data', 'Clear history, cookies and cache', 'data')}
      ${settingNavRow('info', 'About 4Keeper', 'Version, engine and licenses', 'about', appInfo && appInfo.versionName ? 'v' + appInfo.versionName : '')}
    `)}`;
}

function settingsPageAppearance() {
  return settingSection('Theme', `
      ${settingRowButton('palette', 'Theme', 'System follows your device', themeLabel(), 'theme')}
      ${settingRowButton('sliders', 'Density', 'Spacing of controls and lists', densityLabel(), 'density')}
    `) +
    settingSection('Address bar', `
      ${settingRowToggle('showFullUrl', 'Show full address', 'Show https:// and the complete path')}
    `);
}

function settingsPageSearch() {
  return settingSection('Search', `
      ${settingRowButton('search', 'Search engine', 'Used when you type a query', engineLabel(), 'engine')}
      ${settingRowToggle('suggestions', 'Search suggestions', 'Fetch suggestions as you type')}
      ${settingRowToggle('suggestBookmarks', 'Show bookmarks in suggestions', 'Compact list below the address bar', 'is-sub')}
      ${settingRowToggle('suggestHistory', 'Show history in suggestions', 'Recently visited pages as you type', 'is-sub')}
    `) +
    settingSection('Search language', `
      ${settingRowButton('globe', 'Search language', 'Preferred language for results', searchLanguageLabel(), 'searchLanguage')}
    `) +
    settingSection('Search region', `
      ${settingRowButton('globe', 'Search region', 'Preferred region for results', searchRegionLabel(), 'searchRegion')}
    `) +
    settingSection('Homepage', `
      ${settingRowButton('link', 'Homepage', 'Opened by the Home button', settings.homePage || getEngine().home, 'homePage')}
      ${settingRowButton('text', 'On startup', 'What opens when the app starts', startupLabel(), 'startup')}
    `);
}

function settingsPagePrivacy() {
  return settingSection('Protection', `
      ${settingRowToggle('trackingProtection', 'Tracking protection', 'Block known tracking hosts')}
      ${settingRowToggle('safeBrowsing', 'Safe Browsing', 'Warn about dangerous sites')}
    `) +
    settingSection('Cookies', `
      ${settingRowButton('shield', 'Cookies', 'How sites may store cookies', cookiesLabel(), 'cookies')}
    `) +
    `<div class="setting-note">4Keeper does not ask for camera, microphone or location access. Permissions are handled by Android and the sites you choose to use.</div>`;
}

function settingsPageSite() {
  return settingSection('Content', `
      ${settingRowToggle('javaScript', 'JavaScript', 'Required by most modern sites')}
      ${settingRowToggle('popups', 'Pop-ups', 'Allow sites to open new windows')}
      ${settingRowToggle('webDarkMode', 'Web dark mode', 'Ask sites to use a dark theme')}
      ${settingRowButton('text', 'Text zoom', 'Scale text inside pages', (Number(settings.textZoom) || 100) + '%', 'textZoom')}
      ${settingRowToggle('desktopMode', 'Desktop site', 'Request desktop versions of pages')}
    `) +
    settingSection('Zoom', `
      ${settingRowToggle('pinchZoom', 'Pinch to zoom', 'Allow two-finger zoom on pages')}
      ${settingRowToggle('zoomControls', 'On-screen zoom buttons', 'Show zoom controls when pinch zoom is on')}
    `) +
    `<div class="setting-note">Content settings apply to every tab and reload open pages when changed.</div>`;
}

function downloadLocationLabel() {
  if (settings.downloadLocation) return settings.downloadLocationLabel || 'Selected folder';
  return 'App downloads folder';
}

function settingsPageDownloads() {
  return settingSection('Location', `
      ${settingRowButton('download', 'Download location', 'Where downloaded files are saved', downloadLocationLabel(), 'downloadFolder')}
      ${settingRowToggle('askDownloadLocation', 'Ask where to save files', 'Choose a folder for every download')}
    `) +
    settingSection('Behavior', `
      ${settingRowToggle('autoOpenPdf', 'Automatically open PDFs', 'Open PDFs as soon as they finish')}
      ${settingRowToggle('autoOpenDownload', 'Automatically open when possible', 'Open completed files with a compatible app')}
      ${settingRowToggle('downloadNotifications', 'Show download progress notifications', 'Show progress and completion notices')}
      ${settingRowToggle('parallelDownloads', 'Parallel downloading', 'Download multiple files at the same time')}
    `) +
    settingSection('Files', `
      ${settingRowAction('download', 'View downloads', 'Open the downloads list', 'openDownloads')}
    `) +
    `<div class="setting-note">Choose any folder for saved files. 4Keeper keeps access to your selection through Android's document picker.</div>`;
}

function settingsPageData() {
  return settingSection('Browsing data', `
      ${settingRowAction('trash', 'Clear browsing data', 'History, cookies, cache and site data', 'clearData', true)}
    `) +
    `<div class="setting-note">Settings, bookmarks and downloads are not removed by clearing browsing data.</div>`;
}

function settingsPageAbout() {
  const version = appInfo && appInfo.versionName ? appInfo.versionName : '—';
  const webview = appInfo && appInfo.webViewVersion ? appInfo.webViewVersion : '—';
  const android = appInfo && appInfo.androidVersion ? appInfo.androidVersion : '—';
  const device = appInfo && appInfo.deviceModel ? appInfo.deviceModel : '—';
  return `
    <div class="about-card">
      <div class="about-logo">${svgIcon('globe')}</div>
      <div class="about-name">4Keeper</div>
      <div class="about-version">Version ${escapeHtml(version)}</div>
    </div>` +
    settingSection('System', `
      <div class="setting-row static"><span class="setting-text"><span class="setting-label">Android</span></span><span class="setting-value">${escapeHtml(android)}</span></div>
      <div class="setting-row static"><span class="setting-text"><span class="setting-label">WebView</span></span><span class="setting-value">${escapeHtml(webview)}</span></div>
      <div class="setting-row static"><span class="setting-text"><span class="setting-label">Device</span></span><span class="setting-value">${escapeHtml(device)}</span></div>
    `) +
    settingSection('More', `
      ${settingRowAction('info', 'Open source licenses', 'Capacitor, AndroidX and icons', 'licenses')}
      ${settingRowAction('trash', 'Reset all settings', 'Restore every default', 'reset', true)}
    `) +
    `<div class="setting-note">4Keeper is built with Capacitor and Android WebView. Pages are rendered by Android's system WebView.</div>`;
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
        { value: 'home', label: 'Open homepage', desc: 'Start on your homepage' },
        { value: 'newtab', label: 'Open new tab', desc: 'Start on a blank tab' }
      ], settings.startup, (value) => updateSetting({ startup: value }, { rerender: true }));
      break;
    case 'searchLanguage':
      openChoice('Search language', SEARCH_LANGUAGES, String(settings.searchLanguage || ''), (value) => updateSetting({ searchLanguage: value }, { rerender: true, toastMessage: 'Search language updated' }));
      break;
    case 'searchRegion':
      openChoice('Search region', SEARCH_REGIONS, String(settings.searchRegion || ''), (value) => updateSetting({ searchRegion: value }, { rerender: true, toastMessage: 'Search region updated' }));
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
    case 'downloadFolder':
      openChoice('Download location', [
        { value: 'app', label: 'App downloads folder', desc: 'Saved inside 4Keeper storage' },
        { value: 'choose', label: 'Choose folder…', desc: settings.downloadLocation ? settings.downloadLocationLabel : 'Use the system folder picker' }
      ], settings.downloadLocation ? 'choose' : 'app', (value) => {
        if (value === 'app') {
          updateSetting({ downloadLocation: '', downloadLocationLabel: '' }, { rerender: true, toastMessage: 'Downloads use the app folder' });
          return;
        }
        callPlugin('chooseDownloadFolder')
          .then((result) => {
            if (!result || !result.uri) {
              toast('No folder selected');
              return;
            }
            updateSetting({
              downloadLocation: result.uri,
              downloadLocationLabel: result.label || 'Selected folder'
            }, { rerender: true, toastMessage: 'Download folder updated' });
          })
          .catch(() => toast('Folder not changed'));
      });
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
  dom.downloadsBtn.addEventListener('click', () => {
    if (overlays.has('downloads')) closeDownloads();
    else openDownloads();
  });
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

  document.addEventListener('pointerdown', (event) => {
    if (!overlays.has('suggestions')) return;
    const target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    if (target.closest('#suggestions') || target.closest('#urlInput') || target.closest('#clearUrlBtn')) return;
    hideSuggestions();
  }, true);

  dom.closeTabSheetBtn.addEventListener('click', closeTabSheet);
  dom.tabSheetBackdrop.addEventListener('click', closeTabSheet);
  dom.tabsEmptyNewTabBtn.addEventListener('click', () => newTab());
  dom.newTabBtn.addEventListener('click', () => newTab());
  dom.tabDownloadsBtn.addEventListener('click', () => {
    closeTabSheet();
    openDownloads();
  });
  dom.tabSelectBtn.addEventListener('click', toggleTabSelection);
  dom.tabSelectCancel.addEventListener('click', toggleTabSelection);
  dom.tabGroupBtn.addEventListener('click', groupSelectedTabs);
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
    const pinButton = event.target.closest('[data-tab-pin]');
    if (pinButton) {
      event.stopPropagation();
      const id = Number(pinButton.getAttribute('data-tab-pin'));
      const meta = getTabMeta(id);
      setTabMeta(id, { pinned: !meta.pinned });
      renderTabs();
      return;
    }
    const checkButton = event.target.closest('[data-tab-check]');
    if (checkButton) {
      event.stopPropagation();
      const id = Number(checkButton.getAttribute('data-tab-check'));
      if (tabSelection.has(id)) tabSelection.delete(id);
      else tabSelection.add(id);
      renderTabs();
      return;
    }
    const groupButton = event.target.closest('[data-group-close]');
    if (groupButton) {
      event.stopPropagation();
      const groupId = groupButton.getAttribute('data-group-close');
      openDialog({
        title: 'Close group?',
        message: 'The group will be removed and its tabs will stay open.',
        confirmLabel: 'Close group',
        destructive: true,
        onConfirm: () => ungroupTabs(groupId)
      });
      return;
    }
    const groupBack = event.target.closest('[data-group-back]');
    if (groupBack) {
      event.stopPropagation();
      closeTabGroupView();
      return;
    }
    const groupUngroup = event.target.closest('[data-group-ungroup]');
    if (groupUngroup) {
      event.stopPropagation();
      const groupId = groupUngroup.getAttribute('data-group-ungroup');
      openDialog({
        title: 'Ungroup tabs?',
        message: 'The group will be removed and its tabs will move to the main tab list.',
        confirmLabel: 'Ungroup',
        destructive: true,
        onConfirm: () => ungroupTabs(groupId)
      });
      return;
    }
    const groupCard = event.target.closest('[data-group-id]');
    if (groupCard) {
      event.stopPropagation();
      openTabGroup(groupCard.getAttribute('data-group-id'));
      return;
    }
    const closeButton = event.target.closest('[data-close-tab]');
    if (closeButton) {
      event.stopPropagation();
      closeTab(Number(closeButton.getAttribute('data-close-tab')));
      return;
    }
    const card = event.target.closest('[data-tab-id]');
    if (card) {
      if (suppressTabClick) {
        suppressTabClick = false;
        return;
      }
      if (tabSelectionMode) return;
      switchTab(Number(card.getAttribute('data-tab-id')));
    }
  });
  dom.tabsList.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('[data-tab-id]');
    if (!card) return;
    event.preventDefault();
    switchTab(Number(card.getAttribute('data-tab-id')));
  });
  dom.tabsList.addEventListener('contextmenu', (event) => {
    const card = event.target.closest('[data-tab-id]');
    if (!card) return;
    event.preventDefault();
    const id = Number(card.getAttribute('data-tab-id'));
    const meta = getTabMeta(id);
    openChoice('Tab', [
      { value: 'pin', label: meta.pinned ? 'Unpin tab' : 'Pin tab', desc: meta.pinned ? 'Move back to regular tabs' : 'Keep at the start of the list' },
      { value: 'close', label: 'Close tab', desc: 'This tab will be closed' },
      { value: 'closeOthers', label: 'Close other tabs', desc: 'Close every tab except this one' },
      { value: 'duplicate', label: 'Duplicate tab', desc: 'Open the same page in a new tab' }
    ], '', (value) => {
      if (value === 'pin') {
        setTabMeta(id, { pinned: !meta.pinned });
        renderTabs();
      } else if (value === 'close') {
        closeTab(id);
      } else if (value === 'closeOthers') {
        tabs.filter((tab) => tab.id !== id).forEach((tab) => closeTab(tab.id));
      } else if (value === 'duplicate') {
        const tab = tabs.find((t) => t.id === id);
        if (tab) newTab(tab.url);
      }
    });
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
  dom.menuDesktopBtn.addEventListener('click', toggleDesktopSite);
  dom.menuReadingBtn.addEventListener('click', toggleReadingMode);
  dom.menuSettingsBtn.addEventListener('click', () => openSettingsScreen());

  dom.siteInfoCloseBtn.addEventListener('click', closeSiteInfo);
  dom.siteInfoBackdrop.addEventListener('click', closeSiteInfo);

  dom.historyBackBtn.addEventListener('click', closeHistory);
  dom.historySearch.addEventListener('input', renderHistory);
  dom.clearHistoryBtn.addEventListener('click', openClearData);
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
  dom.bookmarksNewFolderBtn.addEventListener('click', () => promptFolderName({}));
  dom.bookmarksMenuBtn.addEventListener('click', openBookmarksMenu);
  dom.bookmarkImportInput.addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    handleBookmarkFile(file);
    event.target.value = '';
  });
  dom.bookmarksList.addEventListener('click', (event) => {
    const renameButton = event.target.closest('[data-folder-rename]');
    if (renameButton) {
      event.stopPropagation();
      renameBookmarkFolder(renameButton.getAttribute('data-folder-rename'));
      return;
    }
    const folderDeleteButton = event.target.closest('[data-folder-delete]');
    if (folderDeleteButton) {
      event.stopPropagation();
      deleteBookmarkFolder(folderDeleteButton.getAttribute('data-folder-delete'));
      return;
    }
    const moveButton = event.target.closest('[data-bookmark-move]');
    if (moveButton) {
      event.stopPropagation();
      openBookmarkFolderPicker(Number(moveButton.getAttribute('data-bookmark-move')));
      return;
    }
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
  dom.downloadsSettingsBtn.addEventListener('click', () => {
    closeDownloads();
    openSettingsScreen('downloads');
  });
  dom.downloadsRefreshBtn.addEventListener('click', loadDownloads);
  dom.downloadsList.addEventListener('click', (event) => {
    const filterButton = event.target.closest('[data-download-filter]');
    if (filterButton) {
      downloadsFilter = filterButton.getAttribute('data-download-filter') || 'all';
      renderDownloads();
      return;
    }
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

  let boundsTimer = null;
  const scheduleBoundsSync = () => {
    window.clearTimeout(boundsTimer);
    boundsTimer = window.setTimeout(() => {
      boundsTimer = null;
      if (overlays.size === 0) mountBrowser();
    }, 90);
  };
  const handleResize = () => scheduleBoundsSync();
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', handleResize);

  if (typeof ResizeObserver !== 'undefined') {
    const boundsObserver = new ResizeObserver(() => {
      if (overlays.size === 0) mountBrowser();
    });
    boundsObserver.observe(dom.browserContainer);
  }
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
    adoptNativeActiveTab(data);
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
    if (readingModeOn) {
      readingModeOn = false;
      updateMenuModes();
    }
    scheduleSessionSave();
  });

  listen('pageLoaded', (data) => {
    if (!data || typeof data.tabId !== 'number') return;
    adoptNativeActiveTab(data);
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
    if (!data) return;
    adoptNativeActiveTab(data);
    if (!isActive(data)) return;
    const progress = Math.max(0, Math.min(100, Number(data.progress) || 0));
    if (!loading) return;
    if (progress < 100) {
      dom.progressBar.style.width = progress + '%';
    } else {
      dom.progressBar.style.width = '100%';
      window.clearTimeout(progressDoneTimer);
      progressDoneTimer = window.setTimeout(() => {
        if (loading && isActive(data)) setLoading(false);
      }, 700);
    }
  });

  listen('titleChanged', (data) => {
    if (!data || typeof data.tabId !== 'number') return;
    adoptNativeActiveTab(data);
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
    adoptNativeActiveTab(data);
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

  listen('mediaDetected', (data) => {
    if (!data) return;
    const tabId = Number(data.tabId);
    if (!Number.isFinite(tabId) || tabId < 0) return;
    if (!noteTabMedia(tabId, data.url, data.kind)) return;
    updateDownloadsIndicator();
    if (overlays.has('tabs')) renderTabs();
    announceTabMedia(tabId);
  });

  listen('mediaCleared', (data) => {
    if (!data) return;
    const tabId = Number(data.tabId);
    if (!Number.isFinite(tabId)) return;
    dropTabMedia(tabId);
    updateDownloadsIndicator();
    if (overlays.has('tabs')) renderTabs();
  });

  listen('downloadStarted', (data) => {
    if (data && data.filename) toast('Downloading ' + data.filename);
    if (data && typeof data.id === 'number' && typeof data.tabId === 'number') {
      const known = downloadsCache.some((entry) => Number(entry.id) === data.id);
      if (!known) {
        downloadsCache = downloadsCache.concat([{
          id: data.id,
          filename: data.filename || 'Download',
          url: data.url || '',
          tabId: data.tabId,
          status: 'running',
          bytes: 0,
          totalBytes: 0
        }]);
      }
      rebuildTabDownloadIndex();
    }
    if (overlays.has('downloads')) loadDownloads();
  });

  listen('downloadProgress', (data) => {
    if (!data || typeof data.id !== 'number') return;
    const item = downloadsCache.find((entry) => Number(entry.id) === data.id);
    if (item) {
      item.bytes = Number(data.bytes) || 0;
      item.totalBytes = Number(data.totalBytes) || 0;
      if (data.status) item.status = data.status;
      rebuildTabDownloadIndex();
    }
    if (overlays.has('downloads')) updateDownloadProgress(data);
  });

  listen('downloadFinished', (data) => {
    if (data && typeof data.id === 'number') {
      const item = downloadsCache.find((entry) => Number(entry.id) === data.id);
      if (item) {
        item.status = 'successful';
        if (typeof data.tabId === 'number') item.tabId = data.tabId;
      }
      rebuildTabDownloadIndex();
    }
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
  if (overlays.has('downloads')) {
    closeDownloads();
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
  if (readingModeOn) {
    readingModeOn = false;
    updateMenuModes();
    callPlugin('toggleReadingMode', { enabled: false }).catch(() => {});
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
  if (settings.startup === 'newtab') {
    try {
      await callPlugin('createTab', { url: '', activate: true });
    } catch (error) {
      await createTabWithUrl(getHomePage(), true);
      return;
    }
    await refreshTabs();
    syncActiveTabUi();
    return;
  }

  const saved = Array.isArray(session.tabs)
    ? session.tabs
        .filter((tab) => tab && isHttpUrl(tab.url))
        .map((tab) => ({ url: buildHomeUrl(tab.url), title: tab.title || '' }))
        .slice(0, 8)
    : [];
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
  await ensureTabExists();
}

async function boot() {
  for (let attempt = 0; attempt < 40 && !getPlugin(); attempt++) {
    await new Promise((resolve) => window.setTimeout(resolve, 25));
  }
  applyTheme();
  applyDensity();
  attachUiListeners();
  attachSheetDrags();
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
  if (!tabs.length) await ensureTabExists();
  tabsReady = true;
  renderTabs();
  syncActiveTabUi();
  const tab = activeTab();
  setNav(!!(tab && tab.canGoBack), !!(tab && tab.canGoForward));
  syncNav();
  setLoading(false);
  updateTabBadge();
  refreshTabMedia();
  fetchDownloads();

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
      uiOverlayState = null;
      nativeVisibleState = null;
      pageBehindState = false;
      syncNativeVisibility();
      window.setTimeout(() => {
        if (overlays.size === 0) mountBrowser(true);
      }, 160);
    });
  }

  window.addEventListener('pagehide', saveSession);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      lastBoundsKey = '';
      uiOverlayState = null;
      nativeVisibleState = null;
      pageBehindState = false;
      syncNativeVisibility();
      window.setTimeout(() => {
        if (overlays.size === 0) mountBrowser();
      }, 160);
    }
  });
}

bootPromise = boot();
