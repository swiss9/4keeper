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

function searchLanguageLabel() {
  const value = String(settings.searchLanguage || '');
  const found = SEARCH_LANGUAGES.find((item) => item.value === value);
  return found ? found.label : 'Any language';
}

const DEFAULT_SETTINGS = {
  theme: 'system',
  density: 'comfortable',
  searchEngine: 'duckduckgo',
  searchLanguage: 'en',
  homePage: '',
  startup: 'restore',
  suggestions: true,
  suggestBookmarks: true,
  suggestHistory: true,
  showFullUrl: false,
  webDarkMode: false,
  trackingProtection: true,
  /* Privacy shields are opt-out: every fresh install starts protected. */
  adBlock: true,
  /* Dynamic filter lists: the three DNS lists ship on, AdAway is opt-in. */
  adblockStevenBlack: true,
  adblockPeterLowe: true,
  adblockAdGuard: true,
  adblockAdAway: false,
  adblockCustomLists: [],
  fingerprintBlock: true,
  doNotTrack: true,
  /* Sends WebView traffic through OkHttp with the selected DoH resolver. */
  dnsOverHttps: false,
  dohProvider: 'cloudflare',
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
  parallelDownloads: true,
  speedLimit: 0,
  maxParallelDownloads: 3,
  /* Downloader power settings */
  connectionsPerFile: 4,
  wifiOnly: false,
  autoRetry: true,
  clipboardMonitoring: true
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
  pause: '<rect x="7" y="5" width="4" height="14" rx="1.2"/><rect x="13" y="5" width="4" height="14" rx="1.2"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2.2"/>',
  play: '<path d="M8 5.5v13l11-6.5Z"/>',
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
  upload: '<path d="M12 21V9m-5 5 5-5 5 5"/><path d="M5 3h14"/>',
  video: '<rect x="3" y="6" width="12" height="12" rx="2.5"/><path d="m15 10.5 6-3.5v10l-6-3.5Z"/>',
  audio: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  torrent: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4h-4"/><path d="M12 8v8m-3-3 3 3 3-3"/>',
  inbox: '<path d="M4 13h4l1.5 3h5L16 13h4"/><path d="M5 5h14l2 8v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4Z"/>',
  more: '<circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/>',
  share: '<path d="M12 15V3"/><path d="m8 7 4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>'
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
let storageReady = false;
let isDashboardMode = true;
let booting = true;
let dashboardActive = true;
let dashboardStatusFilter = 'shortcuts';
let shortcutsEditing = false;
let editingShortcutIndex = -1;
let dashboardCategory = 'all';
let dashboardQuery = '';
let dashboardSearchOpen = false;
let dashboardBusy = false;
let dashboardRefreshToken = 0;
let dashboardSort = 'date';
let dashboardSortMenuOpen = false;
let tabSwipeBlockClick = false;
let dashboardSpeeds = {};
let clipboardPromptUrl = '';
let clipboardLastPrompt = '';
let clipboardLastPromptAt = 0;
let clipboardCheckBusy = false;
let pendingDownloadPrompt = null;
let contextMenuTarget = null;
let tabMedia = {};
let tabDownloadIndex = {};
let mediaToastAt = 0;
let mediaToastTabId = -1;
let currentSettingsSection = null;
let settingsView = 'app';
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
let tabLongPress = null;

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
  newTabPage: $('newTabPage'),
  newTabForm: $('newTabForm'),
  newTabInput: $('newTabInput'),
  newTabQuickAccess: $('newTabQuickAccess'),
  dashboardQuickAccess: $('dashboardQuickAccess'),
  quickAddSheet: $('quickAddSheet'),
  quickAddBackdrop: $('quickAddBackdrop'),
  quickAddForm: $('quickAddForm'),
  quickAddName: $('quickAddName'),
  quickAddUrl: $('quickAddUrl'),
  quickAddClose: $('quickAddClose'),
  quickAddTitle: $('quickAddTitle'),
  quickAddDelete: $('quickAddDelete'),
  shortcutsView: $('shortcutsView'),
  shortcutsEditBtn: $('shortcutsEditBtn'),
  dashboardSection: $('dashboardSection'),
  dashboardForm: $('dashboardForm'),
  dashboardInput: $('dashboardInput'),
  dashboardStorage: $('dashboardStorage'),
  dashboardMenuBtn: $('dashboardMenuBtn'),
  dashboardSearchBtn: $('dashboardSearchBtn'),
  dashboardSearch: $('dashboardSearch'),
  dashboardSearchInput: $('dashboardSearchInput'),
  dashboardSearchClear: $('dashboardSearchClear'),
  sideDrawer: $('sideDrawer'),
  sideDrawerBackdrop: $('sideDrawerBackdrop'),
  sideDrawerClose: $('sideDrawerClose'),
  drawerDownloadsBtn: $('drawerDownloadsBtn'),
  drawerHistoryBtn: $('drawerHistoryBtn'),
  drawerBookmarksBtn: $('drawerBookmarksBtn'),
  dashboardFilters: $('dashboardFilters'),
  dashboardSortBtn: $('dashboardSortBtn'),
  dashboardSortMenu: $('dashboardSortMenu'),
  dashboardCategories: $('dashboardCategories'),
  dashboardQueue: $('dashboardQueue'),
  dashboardStorageBar: $('dashboardStorageBar'),
  dashboardStorageFill: $('dashboardStorageFill'),
  clipboardPrompt: $('clipboardPrompt'),
  clipboardPromptUrl: $('clipboardPromptUrl'),
  clipboardPromptAccept: $('clipboardPromptAccept'),
  clipboardPromptClose: $('clipboardPromptClose'),
  downloadFab: $('downloadFab'),
  downloadSheet: $('downloadSheet'),
  downloadSheetBackdrop: $('downloadSheetBackdrop'),
  downloadSheetClose: $('downloadSheetClose'),
  downloadPasteBtn: $('downloadPasteBtn'),
  downloadPrompt: $('downloadPrompt'),
  downloadPromptBackdrop: $('downloadPromptBackdrop'),
  downloadPromptName: $('downloadPromptName'),
  downloadPromptSize: $('downloadPromptSize'),
  downloadPromptDomain: $('downloadPromptDomain'),
  downloadPromptCancel: $('downloadPromptCancel'),
  downloadPromptConfirm: $('downloadPromptConfirm'),
  dlMenuSheet: $('dlMenuSheet'),
  dlMenuBackdrop: $('dlMenuBackdrop'),
  dlMenuIcon: $('dlMenuIcon'),
  dlMenuName: $('dlMenuName'),
  dlMenuMeta: $('dlMenuMeta'),
  dlMenuList: $('dlMenuList'),
  contextMenu: $('contextMenu'),
  navDashboardBtn: $('navDashboardBtn'),
  navBrowserBtn: $('navBrowserBtn'),
  navSettingsBtn: $('navSettingsBtn'),
  backBtn: $('backBtn'),
  forwardBtn: $('forwardBtn'),
  homeBtn: $('navDashboardBtn'),
  browserSideMenu: $('browser-side-menu'),
  browserBottomNav: $('browser-bottom-nav'),
  tabsBtn: $('tabsBtn'),
  tabsBadge: $('tabsBadge'),
  downloadsBtn: $('navBrowserBtn'),
  downloadsMediaDot: $('downloadsMediaDot'),
  tabDownloadsBtn: $('tabDownloadsBtn'),
  tabDownloadsMediaDot: $('tabDownloadsMediaDot'),
  menuBtn: $('menuBtn'),
  browserMenuBtn: $('browserMenuBtn'),
  tabSheet: $('tabSheet'),
  tabSheetBackdrop: $('tabSheetBackdrop'),
  tabSheetTitle: $('tabSheetTitle'),
  tabsList: $('tabsList'),
  tabsEmpty: $('tabsEmpty'),
  tabsEmptyNewTabBtn: $('tabsEmptyNewTabBtn'),
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

/* A tab that never loaded anything reports '' or about:blank depending on the
 * WebView build. Both mean "no page" and get the in-app new tab page. */
function isBlankUrl(url) {
  return !url || url === 'about:blank';
}

function isProbablyUrl(value) {
  const str = value.trim();
  if (!str || /\s/.test(str)) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(str)) return true;
  if (/^localhost(:\d+)?([/?#]|$)/i.test(str)) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?([/?#]|$)/.test(str)) return true;
  return /^[^\s/?#]+\.[^\s/?#]{2,}([/?#].*)?$/i.test(str);
}

const DOWNLOAD_FILE_PATTERN = /\.(?:7z|aac|apk|avi|bin|bz2|docx?|epub|exe|flac|flv|gif|gz|img|iso|jpe?g|m4a|m4v|mkv|mov|mp3|mp4|mpeg|mpg|msi|ogg|opus|pdf|png|ppt|rar|rpm|tar|tgz|torrent|ts|txt|wav|webm|webp|wma|wmv|xlsx?|xz|zip)$/i;

/* A URL that points straight at a file belongs to the download manager.
 * Everything else is a page and opens in the browser. */
function looksLikeDirectDownload(url) {
  try {
    const parsed = new URL(url);
    if (DOWNLOAD_FILE_PATTERN.test(parsed.pathname)) return true;
    return /(?:^|[?&])(?:download|dl|attachment)(?:=|&|$)/i.test(parsed.search);
  } catch (error) {
    return false;
  }
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
  if (language) url += '&hl=' + encodeURIComponent(language);
  return url;
}

const GOOGLE_HOME_HOST = /^google(\.[a-z]{2,4}){1,2}$/i;

/* Google serves a country-specific homepage based on the IP. `/ncr` keeps it
 * neutral, and hl applies the saved search language on every load. */
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
  const params = [];
  if (language) params.push('hl=' + encodeURIComponent(language));
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
    .map((tab) => ({
      url: String(tab.url),
      title: typeof tab.title === 'string' ? tab.title : '',
      pinned: tab.pinned === true
    }))
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

    if (!Array.isArray(history)) history = [];
    if (!Array.isArray(bookmarks)) bookmarks = [];
    if (!Array.isArray(bookmarkFolders)) bookmarkFolders = [];
    if (!tabMeta || typeof tabMeta !== 'object' || Array.isArray(tabMeta)) tabMeta = {};
    if (!favicons || typeof favicons !== 'object' || Array.isArray(favicons)) favicons = {};
    if (!session || !Array.isArray(session.tabs)) session = { tabs: [], activeIndex: 0 };

    bookmarkFolders = bookmarkFolders
      .filter((folder) => folder && folder.id && folder.name)
      .map((folder) => ({ id: String(folder.id), name: String(folder.name), createdAt: Number(folder.createdAt) || Date.now() }));
    tabMeta = normalizeTabMeta(tabMeta);

    migrateLegacy(native);

    this.save('settings');
    this.save('history');
    this.save('bookmarks');
    this.save('favicons');
    this.save('session');
    this.save('folders');
    this.save('tabMeta');
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
  /* Back always works in the browser: with no history left it opens the
   * dashboard, so the button is never a dead end. */
  if (dom.backBtn) dom.backBtn.disabled = false;
  if (dom.forwardBtn) dom.forwardBtn.disabled = !navCanForward;
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
  if (dom.tabSheetTitle) dom.tabSheetTitle.textContent = 'Tabs (' + count + ')';
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
  const blank = isBlankUrl(currentUrl);
  dom.startScreen.classList.toggle('is-hidden', !blank || overlays.size > 0);
  if (dom.newTabPage) {
    dom.newTabPage.classList.toggle('is-hidden', !blank || overlays.size > 0 || dashboardActive);
  }
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
  const preferred = visible ? plugin.showWebView : plugin.hideWebView;
  const fallback = plugin.setVisibility || plugin.setWebViewVisibility || plugin.setVisible;
  const method = typeof preferred === 'function' ? preferred : fallback;
  if (typeof method !== 'function') return;
  try {
    Promise.resolve(method.call(plugin, { visible })).catch(() => {});
  } catch (error) {
    /* ignore */
  }
}

let mediaSnifferState = null;

function setMediaSnifferActive(active) {
  const plugin = getPlugin();
  if (!plugin || typeof plugin.setSnifferEnabled !== 'function') return;
  if (mediaSnifferState === active) return;
  mediaSnifferState = active;
  try {
    Promise.resolve(plugin.setSnifferEnabled({ enabled: active })).catch(() => {
      mediaSnifferState = null;
    });
  } catch (error) {
    mediaSnifferState = null;
  }
}

/* Bridge token for app-side calls. Page scripts never see it: the sniffer's
 * copy is baked in by the native injection, not fetched from here. */
function getBridgeToken() {
  return callPlugin('getBridgeToken')
    .then((result) => (result && result.token) || '')
    .catch(() => '');
}

/* Dashboard mode always hides the native WebView; browser mode brings it back
 * only when the active tab actually holds a page. */
function hideNativeWebView() {
  browserShowToken++;
  nativeVisibleState = false;
  setNativeVisible(false);
}

/* Hard show/hide for a shell surface. An empty value falls back to the mode CSS
 * so flex/grid layout is preserved for visible nodes. */
function setNodeVisible(node, visible) {
  if (!node) return;
  node.style.display = visible ? '' : 'none';
  if (visible) node.removeAttribute('aria-hidden');
}

let browserShowToken = 0;

function showNativeWebView() {
  nativeVisibleState = true;
  const token = ++browserShowToken;
  /* Apply fresh bounds before the page view is shown. Showing a page view that
   * still carries stale (taller) metrics is what used to let it cover the shell's
   * bottom navigation and swallow Home taps. */
  mountBrowser().finally(() => {
    if (token !== browserShowToken) return;
    if (nativeVisibleState !== true || dashboardActive) return;
    if (!lastBoundsKey) {
      /* mountBrowser clears the bounds key when the native mount was rejected.
       * Showing the page anyway would put it back at stale metrics, so hand the
       * decision back to syncNativeVisibility and let it retry on the next tick. */
      nativeVisibleState = false;
      syncNativeVisibility();
      return;
    }
    setNativeVisible(true);
  });
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
  const showPage = hasPage && !dashboardActive;
  const pageBehind = overlay && showPage;

  document.body.classList.toggle('overlay-open', overlay);
  document.body.classList.toggle('dashboard-open', dashboardActive);

  if (nativeVisibleState !== showPage) {
    nativeVisibleState = showPage;
    setNativeVisible(showPage);
  }
  applyPageBehind(pageBehind);

  if (dom.dashboardSection) {
    dom.dashboardSection.classList.toggle('is-hidden', !dashboardActive);
    dom.dashboardSection.setAttribute('aria-hidden', dashboardActive ? 'false' : 'true');
  }
  if (dom.downloadFab) dom.downloadFab.classList.toggle('is-off', !dashboardActive);
  /* The new tab page replaces the legacy start screen for a blank tab. */
  const showNewTab = !dashboardActive && !hasPage && !overlay;
  if (dom.newTabPage) dom.newTabPage.classList.toggle('is-hidden', !showNewTab);
  dom.startScreen.classList.toggle('is-hidden', dashboardActive || hasPage || overlay || showNewTab);

  if (!overlay && !dashboardActive) {
    window.setTimeout(() => {
      if (overlays.size === 0 && !dashboardActive) mountBrowser();
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
  if (keep !== 'tabs' && keep !== 'choiceTabs') closeTabSheet();
  if (keep !== 'menu') closeMenu();
  if (keep !== 'siteInfo') closeSiteInfo();
  if (keep !== 'choice' && keep !== 'choiceTabs') closeChoice();
  if (keep !== 'downloadSheet') closeDownloadSheet();
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
  if (dom.downloadSheet) attachSheetDrag(dom.downloadSheet, closeDownloadSheet);
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
  setBottomNavActive('tabs');
  if (dom.tabsBtn) dom.tabsBtn.setAttribute('aria-expanded', 'true');

  const refreshSheet = () => {
    scheduleTabsRender();
  };
  if (!tabsReady) {
    Promise.resolve(bootPromise).then(refreshSheet).catch(() => {});
    return;
  }
  if (!tabs.length) ensureTabExists().then(refreshSheet).catch(() => {});
}

function closeTabSheet() {
  if (dom.tabsBtn) dom.tabsBtn.setAttribute('aria-expanded', 'false');
  if (!overlays.has('tabs')) return;
  closeSheet('tabs', dom.tabSheet, dom.tabSheetBackdrop);
  /* Hand the active indicator back to the mode the user is actually in. */
  setBottomNavActive(isDashboardMode ? 'dashboard' : 'browser');
}

function openMenu() {
  overlays.add('menu');
  hideSuggestions();
  dom.menuSheet.classList.add('open');
  dom.menuSheet.setAttribute('aria-hidden', 'false');
  dom.menuBackdrop.classList.add('open');
  if (dom.menuBtn) dom.menuBtn.setAttribute('aria-expanded', 'true');
  if (dom.browserMenuBtn) dom.browserMenuBtn.setAttribute('aria-expanded', 'true');
  if (dom.dashboardMenuBtn) dom.dashboardMenuBtn.setAttribute('aria-expanded', 'true');
  closeOtherSheets('menu');
  updateMenuCounts();
  updateMenuBookmark();
  updateMenuModes();
  refreshReadingState();
  syncNativeVisibility();
}

async function toggleDesktopSite() {
  const next = !settings.desktopMode;
  settings = Object.assign({}, settings, { desktopMode: next });
  Store.save('settings');
  readingModeOn = false;
  updateMenuModes();
  closeMenu();
  try {
    await callPlugin('setDesktopMode', { enabled: next });
  } catch (error) {
    pushNativeSettings(true);
  }
  /* A User-Agent change only applies to a fresh document, so reload after the
   * native viewport settings are in place. The shell chrome lives in its own
   * WebView and keeps its size; only the page WebView is reloaded. */
  try {
    await callPlugin('reload');
  } catch (error) {
    /* the user can still refresh manually */
  }
  await mountBrowser(true);
  updateMenuModes();
  toast(next ? 'Desktop site on' : 'Desktop site off');
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
  if (dom.menuBtn) dom.menuBtn.setAttribute('aria-expanded', 'false');
  if (dom.browserMenuBtn) dom.browserMenuBtn.setAttribute('aria-expanded', 'false');
  if (dom.dashboardMenuBtn) dom.dashboardMenuBtn.setAttribute('aria-expanded', 'false');
  closeSheet('menu', dom.menuSheet, dom.menuBackdrop);
}

/* ---------------------------------------------------------- Side drawer */

function openSideDrawer() {
  if (!dom.sideDrawer) return;
  overlays.add('drawer');
  hideSuggestions();
  dom.sideDrawer.classList.add('open');
  dom.sideDrawer.setAttribute('aria-hidden', 'false');
  if (dom.sideDrawerBackdrop) dom.sideDrawerBackdrop.classList.add('open');
  if (dom.dashboardMenuBtn) dom.dashboardMenuBtn.setAttribute('aria-expanded', 'true');
  syncNativeVisibility();
}

function closeSideDrawer() {
  if (!dom.sideDrawer) return;
  overlays.delete('drawer');
  dom.sideDrawer.classList.remove('open');
  dom.sideDrawer.setAttribute('aria-hidden', 'true');
  if (dom.sideDrawerBackdrop) dom.sideDrawerBackdrop.classList.remove('open');
  if (dom.dashboardMenuBtn) dom.dashboardMenuBtn.setAttribute('aria-expanded', 'false');
  syncNativeVisibility();
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

function openChoice(title, options, current, onSelect, opts) {
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
  closeOtherSheets(opts && opts.keepTabs ? 'choiceTabs' : 'choice');
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
    isAdBlockEnabled: !!settings.adBlock,
    isFingerprintBlockEnabled: !!settings.fingerprintBlock,
    doNotTrack: !!settings.doNotTrack,
    dnsOverHttps: !!settings.dnsOverHttps,
    dohProvider: settings.dohProvider || 'cloudflare',
    speedLimit: Number(settings.speedLimit) || 0,
    connectionsPerFile: Number(settings.connectionsPerFile) || 1,
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
  'adBlock',
  'fingerprintBlock',
  'doNotTrack',
  'dnsOverHttps',
  'dohProvider',
  'speedLimit',
  'connectionsPerFile',
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
  /* The numeric ceiling drives the native parallel-download switch: more than
   * one concurrent file means parallelism is on. */
  if (patch.maxParallelDownloads !== undefined) {
    patch = Object.assign({}, patch, { parallelDownloads: Number(patch.maxParallelDownloads) > 1 });
  }
  settings = Object.assign({}, settings, patch);
  Store.save('settings');
  applyTheme();
  applyDensity();
  if (NATIVE_SETTING_KEYS.some((key) => patch[key] !== undefined)) {
    pushNativeSettings(!!opts.reload);
  }
  if (opts.rerender) rerenderSettings();
  if (opts.toastMessage) toast(opts.toastMessage);
  if (patch.clipboardMonitoring !== undefined && !settings.clipboardMonitoring) hideClipboardPrompt();
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

function browserChromeBottom() {
  const nav = dom.browserBottomNav;
  if (!nav) return 0;
  const rect = nav.getBoundingClientRect();
  if (!rect.height) return 0;
  return Math.max(0, Math.round(window.innerHeight - rect.top));
}

async function mountBrowser(force) {
  const plugin = getPlugin();
  if (!plugin || typeof plugin.mount !== 'function') return;
  const rect = dom.browserContainer.getBoundingClientRect();
  const bounds = {
    x: Math.round(rect.left),
    y: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    /* Hard clamp for the native layer: never let the page WebView reach into
     * the strip reserved for the shell's bottom navigation. */
    reserveBottom: browserChromeBottom()
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
    saved.push({ url: tab.url, title: tab.title || '', pinned: getTabMeta(tab.id).pinned === true });
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

/* Tab groups were removed; drop their groupId links from saved tab metadata. */
function normalizeTabMeta(meta) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return {};
  const cleaned = {};
  Object.keys(meta).forEach((id) => {
    const entry = meta[id];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
    const next = { ...entry };
    delete next.groupId;
    if (next.pinned !== true) delete next.pinned;
    if (Object.keys(next).length) cleaned[id] = next;
  });
  return cleaned;
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
  /* Any live detection is newer than a snapshot that may still be resolving. */
  tabMediaRequest++;
  return true;
}

function dropTabMedia(tabId) {
  if (tabMedia[tabId] === undefined) return;
  delete tabMedia[tabId];
}

let tabMediaRequest = 0;

async function refreshTabMedia() {
  const plugin = getPlugin();
  if (!plugin || typeof plugin.getTabMedia !== 'function') return;
  const request = ++tabMediaRequest;
  try {
    const result = await plugin.getTabMedia();
    /* A live mediaDetected event may have landed while this snapshot was in
     * flight; a later request or newer event wins over this stale list. */
    if (request !== tabMediaRequest) return;
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
  scheduleTabsRender();
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
    dom.downloadsBtn.setAttribute('aria-label', hasMedia ? 'Browser, media available' : 'Browser');
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
  const badges = tabDownloadBadgesMarkup(tab.id);
  const mediaHint = mediaHintForTab(tab.id);
  const title = tab.title || 'New tab';
  const host = hostOf(tab.url) || (isActive ? 'Start page' : 'Empty tab');
  const monogram = (host.replace(/^www\./i, '')[0] || '?').toUpperCase();
  const favicon = tab.url && isHttpUrl(tab.url) ? faviconMarkup(tab.url) : '';
  const icon = favicon || `<span class="favicon">${escapeHtml(monogram)}</span>`;
  const pinnedBtn = `<button class="tab-pin-btn${isPinned ? ' is-pinned' : ''}" type="button" data-tab-pin="${tab.id}" aria-pressed="${isPinned}" aria-label="${isPinned ? 'Unpin tab' : 'Pin tab'}"><svg class="icon icon-sm" viewBox="0 0 24 24">${ICONS.pin}</svg></button>`;
  const classes = 'tab-card tab-row' + (isActive ? ' is-active' : '') + (isPinned ? ' is-pinned' : '');
  const closeLabel = `Close tab: ${escapeHtml(title)}`;

  return `
    <div class="${classes}" role="button" tabindex="0" data-tab-id="${tab.id}" aria-label="${escapeHtml(title + mediaHint)}" aria-pressed="${isActive}">
      <span class="tab-favicon">${icon}</span>
      <div class="tab-meta">
        <div class="tab-title">${escapeHtml(title)}</div>
        <div class="tab-host">${escapeHtml(host)}${isActive ? ' · Active' : ''}</div>
      </div>
      ${badges}
      ${pinnedBtn}
      <button class="tab-row-action tab-close" type="button" data-close-tab="${tab.id}" aria-label="${closeLabel}">
        ${svgIcon('close', 'icon icon-sm')}
      </button>
    </div>`;
}



/* ---------------------------------------------------------------- Tab pins */

function toggleTabPin(id) {
  const meta = getTabMeta(id);
  setTabMeta(id, { pinned: !meta.pinned });
  renderTabs();
  saveSession();
}

/* Page events (title, favicon, load, media) arrive once per tab. Rebuilding the
 * whole grid for each of them is what made a 20-tab sheet stutter, so collapse
 * bursts into one paint per frame while the sheet is open. */
let tabsRenderFrame = 0;
let tabsMarkupCache = '';

function scheduleTabsRender() {
  if (!overlays.has('tabs') || tabsRenderFrame) return;
  tabsRenderFrame = window.requestAnimationFrame(() => {
    tabsRenderFrame = 0;
    if (overlays.has('tabs')) renderTabs();
  });
}

function renderTabs() {
  if (!dom.tabsList) return;
  updateTabBadge();
  updateDownloadsIndicator();

  const hasTabs = tabs.length > 0;
  dom.tabsEmpty.classList.toggle('hidden', hasTabs);

  const metaById = {};
  tabs.forEach((tab) => { metaById[tab.id] = getTabMeta(tab.id); });

  const pinned = tabs.filter((tab) => metaById[tab.id].pinned === true);
  const others = tabs.filter((tab) => metaById[tab.id].pinned !== true);

  const allTabs = [...pinned, ...others];

  let html = '';
  try {
    html += '<div class="tab-grid">' + allTabs.map(tabCardMarkup).join('') + '</div>';
  } catch (error) {
    /* One malformed card must never blank the whole tab manager. */
    console.warn('[4keeper] Tab render fell back to a flat list:', error);
    html = '';
    try {
      if (allTabs.length) {
        html += '<div class="tab-grid">' + allTabs.map(tabCardMarkup).join('') + '</div>';
      }
    } catch (inner) {
      html = '';
    }
  }
  /* Repainting identical markup throws away focus and long-press state and
   * forces a full style/layout pass on every page-title or media event, which
   * is what made a 20-tab sheet stutter. */
  if (html === tabsMarkupCache) return;
  tabsMarkupCache = html;
  dom.tabsList.innerHTML = html;
}

/* Every tab is a live native WebView with its own document, so an unbounded tab
 * count is the fastest way to an out-of-memory kill on a mid-range phone. */
const MAX_TABS = 30;

async function createTabWithUrl(url, activate) {
  if (Array.isArray(tabs) && tabs.length >= MAX_TABS) {
    toast('Tab limit reached (' + MAX_TABS + '). Close a tab first.');
    return;
  }
  await mountBrowser();
  if (activate !== false) leaveDashboard();
  /* No URL means the in-app new tab page, not the search engine home. */
  const target = url ? buildHomeUrl(url) : '';
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

  leaveDashboard();
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
  if (!tabs.length) return;
  let moved = false;
  try {
    /* The native layer owns the real history, including the entry that an
     * error page (ERR_CONNECTION_REFUSED and friends) replaced. */
    const result = await callPlugin('goBack');
    moved = !result || result.moved !== false;
  } catch (error) {
    moved = false;
  }
  if (!moved) {
    /* Nothing left to go back to: Back means Home, never a dead end. */
    showDashboard();
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

/* ------------------------------------------------------------- Dashboard */

const DASHBOARD_CATEGORY_ICONS = {
  videos: 'video',
  music: 'audio',
  docs: 'file',
  torrents: 'torrent',
  others: 'folder'
};

const DASHBOARD_CATEGORY_LABELS = {
  videos: 'Video',
  music: 'Audio',
  docs: 'Document',
  torrents: 'Torrent',
  others: 'File'
};

const DASHBOARD_STATUS_RANK = { downloading: 0, error: 1, finished: 2, other: 3 };

function downloadCategory(item) {
  const mime = String((item && item.mime) || '').toLowerCase();
  const name = String((item && item.filename) || '').toLowerCase();
  const url = String((item && item.url) || '').toLowerCase();
  if (mime.indexOf('bittorrent') !== -1 || /\.torrent($|\?)/.test(name) || /\.torrent($|\?)/.test(url)) {
    return 'torrents';
  }
  if (mime.indexOf('video/') === 0 || /\.(mp4|mkv|webm|avi|mov|m4v|3gp|flv|ts)$/.test(name)) return 'videos';
  if (mime.indexOf('audio/') === 0 || /\.(mp3|m4a|aac|flac|wav|ogg|opus)$/.test(name)) return 'music';
  if (
    /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats|text\/)/.test(mime) ||
    /\.(pdf|docx?|xlsx?|pptx?|txt|csv|epub|odt|rtf)$/.test(name)
  ) {
    return 'docs';
  }
  return 'others';
}

function isPaused(item) {
  return String((item && item.status) || '').toLowerCase() === 'paused';
}

function downloadStatusGroup(item) {
  const status = String((item && item.status) || '').toLowerCase();
  if (status === 'successful' || status === 'completed') return 'finished';
  if (status === 'failed' || status === 'unknown') return 'error';
  if (status === 'running' || status === 'pending' || status === 'paused') return 'downloading';
  return 'other';
}

function dashboardPercent(item) {
  const bytes = Number(item && item.bytes) || 0;
  const total = Number(item && item.totalBytes) || 0;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((bytes / total) * 100)));
}

function dashboardSpeedFor(item) {
  const entry = dashboardSpeeds[Number(item && item.id)];
  return entry && Number(entry.speed) > 0 ? Number(entry.speed) : 0;
}

function formatSpeed(value) {
  const speed = Number(value) || 0;
  if (speed <= 0) return '';
  return formatBytes(Math.round(speed)) + '/s';
}

/* Poll-to-poll throughput for running downloads. Android's download manager
 * does not expose a rate, so the dashboard derives one from byte deltas. */
function updateDashboardSpeeds() {
  const now = Date.now();
  const next = {};
  downloadsCache.forEach((item) => {
    const id = Number(item && item.id);
    if (!Number.isFinite(id)) return;
    const bytes = Number(item.bytes) || 0;
    const previous = dashboardSpeeds[id];
    const running = downloadStatusGroup(item) === 'downloading';
    let speed = 0;
    if (previous && running && now > previous.at) {
      const delta = bytes - previous.bytes;
      if (delta > 0) speed = delta / ((now - previous.at) / 1000);
      else if (now - previous.at < 8000) speed = previous.speed || 0;
    }
    next[id] = { bytes, at: now, speed };
  });
  dashboardSpeeds = next;
}

function dashboardMetaText(item, group) {
  const bytes = Number(item.bytes) || 0;
  const total = Number(item.totalBytes) || 0;
  if (group === 'downloading') {
    if (isPaused(item)) {
      const parts = ['Paused'];
      if (total > 0) parts.push(formatBytes(bytes) + ' of ' + formatBytes(total));
      else if (bytes > 0) parts.push(formatBytes(bytes) + ' downloaded');
      return parts.join(' · ');
    }
    /* Live row: speed first, then the full file size (the bar next to it owns
     * the percentage), so the row answers "how fast" and "how big" at a glance. */
    const speed = formatSpeed(dashboardSpeedFor(item));
    const parts = [];
    parts.push(speed || 'Downloading…');
    if (total > 0) parts.push(formatBytes(total));
    else {
      /* No Content-Length: never show a fake size or a 0% bar. */
      parts.push('-- MB');
      if (bytes > 0) parts.push(formatBytes(bytes) + ' downloaded');
    }
    return parts.join(' · ');
  }
  if (group === 'finished') {
    /* Only a finished record can own a file the user deleted; an active one is
     * merely still writing it. */
    if (item.exists === false) return 'File removed';
    const size = total > 0 ? total : bytes;
    return size > 0 ? formatBytes(size) : 'Downloaded';
  }
  return downloadStatus(item);
}

function dashboardTypeLabel(item, category) {
  const name = String((item && item.filename) || '');
  const ext = name.indexOf('.') === -1 ? '' : name.split('.').pop();
  if (ext && ext.length <= 5 && /^[a-z0-9]+$/i.test(ext)) return ext.toUpperCase();
  const mime = String((item && item.mime) || '');
  if (mime) {
    const tail = mime.split('/').pop();
    if (tail && tail !== '*' && tail.indexOf('.') === -1) return tail.toUpperCase();
  }
  return DASHBOARD_CATEGORY_LABELS[category] || 'File';
}

function dashboardCounts() {
  const counts = { all: downloadsCache.length, downloading: 0, finished: 0, error: 0 };
  downloadsCache.forEach((item) => {
    const group = downloadStatusGroup(item);
    if (group === 'downloading' || group === 'finished' || group === 'error') counts[group] += 1;
  });
  return counts;
}

function dashboardDownloadItems() {
  if (dashboardStatusFilter === 'shortcuts') return [];
  const query = dashboardQuery.trim().toLowerCase();
  const items = downloadsCache.filter((item) => {
    if (dashboardStatusFilter !== 'all' && downloadStatusGroup(item) !== dashboardStatusFilter) return false;
    if (dashboardCategory !== 'all' && downloadCategory(item) !== dashboardCategory) return false;
    if (query) {
      const haystack = (String(item.filename || '') + ' ' + String(item.url || '')).toLowerCase();
      if (haystack.indexOf(query) === -1) return false;
    }
    return true;
  });
  return items.sort((a, b) => {
    if (dashboardSort === 'size') {
      const sizeA = Number(a.totalBytes) || Number(a.bytes) || 0;
      const sizeB = Number(b.totalBytes) || Number(b.bytes) || 0;
      if (sizeB !== sizeA) return sizeB - sizeA;
      return (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0);
    }
    const rank = (DASHBOARD_STATUS_RANK[downloadStatusGroup(a)] || 0) - (DASHBOARD_STATUS_RANK[downloadStatusGroup(b)] || 0);
    if (rank) return rank;
    return (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0);
  });
}

/* Sort / options ------------------------------------------------------- */

function setDashboardSort(value) {
  dashboardSort = value === 'size' ? 'size' : 'date';
  syncDashboardSortMenu();
  renderDashboardQueue();
}

function syncDashboardSortMenu() {
  if (!dom.dashboardSortMenu) return;
  dom.dashboardSortMenu.querySelectorAll('[data-dl-sort]').forEach((button) => {
    const active = button.getAttribute('data-dl-sort') === dashboardSort;
    button.classList.toggle('is-selected', active);
    button.setAttribute('aria-checked', active ? 'true' : 'false');
  });
}

function setDashboardSortMenu(open) {
  dashboardSortMenuOpen = !!open;
  if (dom.dashboardSortBtn) {
    dom.dashboardSortBtn.setAttribute('aria-expanded', dashboardSortMenuOpen ? 'true' : 'false');
  }
  if (!dom.dashboardSortMenu) return;
  dom.dashboardSortMenu.hidden = !dashboardSortMenuOpen;
  if (dashboardSortMenuOpen) syncDashboardSortMenu();
}

async function clearCompletedDownloads() {
  setDashboardSortMenu(false);
  const finished = downloadsCache.filter((item) => downloadStatusGroup(item) === 'finished');
  if (!finished.length) {
    toast('No completed downloads to clear');
    return;
  }
  openDialog({
    title: 'Clear completed downloads?',
    message:
      finished.length === 1
        ? '1 finished download will be removed from the list and its file deleted.'
        : finished.length + ' finished downloads will be removed from the list and their files deleted.',
    confirmLabel: 'Clear',
    destructive: true,
    onConfirm: async () => {
      for (const item of finished) {
        try {
          await callPlugin('removeDownload', { id: item.id });
        } catch (error) {
          /* keep clearing the rest */
        }
      }
      await refreshDashboardDownloads();
      toast('Completed downloads cleared');
    }
  });
}

function dashboardRowMarkup(item) {
  const group = downloadStatusGroup(item);
  const category = downloadCategory(item);
  const percent = dashboardPercent(item);
  const missing = item.exists === false;
  const canOpen = group === 'finished' && !missing;
  const dotClass = group === 'downloading' ? 'is-running' : group === 'finished' ? 'is-done' : group === 'error' ? 'is-error' : '';
  const meta = dashboardMetaText(item, group);
  const host = hostOf(item.url) || 'Direct link';
  const typeLabel = dashboardTypeLabel(item, category);
  const showProgress = group !== 'finished' && Number(item.totalBytes) > 0;
  const running = group === 'downloading';
  const paused = isPaused(item);
  const id = escapeHtml(item.id);
  return `
    <div class="dl-row" id="dl-row-${id}" data-download-id="${id}" data-dl-group="${group}" data-dl-paused="${paused ? '1' : '0'}">
      <span class="dl-row-icon" aria-hidden="true">${svgIcon(DASHBOARD_CATEGORY_ICONS[category] || 'file', 'icon icon-sm')}</span>
      <div class="dl-row-main">
        <div class="dl-row-name" title="${escapeHtml(item.filename || 'Download')}">${escapeHtml(item.filename || 'Download')}</div>
        <div class="dl-row-sub">
          <span class="dl-row-host" title="${escapeHtml(item.url || '')}">${escapeHtml(host)}</span>
          <span class="dl-row-dot" aria-hidden="true">·</span>
          <span class="dl-row-type">${escapeHtml(typeLabel)}</span>
        </div>
        <div class="dl-row-meta">
          <span class="dl-status-dot ${dotClass}" aria-hidden="true"></span>
          <span data-dl-meta>${escapeHtml(meta)}</span>
        </div>
        ${
          showProgress
            ? `<div class="dl-progress-row">
                 <div class="dl-progress" data-dl-progress role="progressbar" aria-label="Download progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div>
                 <span class="dl-progress-pct" data-dl-pct>${percent}%</span>
               </div>`
            : ''
        }
      </div>
      <div class="dl-row-actions">
        ${
          running
            ? paused
              ? `<button class="dl-row-btn" type="button" data-dashboard-resume="${id}" aria-label="Resume download">${svgIcon('play', 'icon icon-xs')}</button>`
              : `<button class="dl-row-btn" type="button" data-dashboard-pause="${id}" aria-label="Pause download">${svgIcon('pause', 'icon icon-xs')}</button>`
            : `<button class="dl-row-btn" type="button" data-dashboard-open="${id}" aria-label="Open download"${canOpen ? '' : ' disabled'}>${svgIcon('external', 'icon icon-xs')}</button>`
        }
        <button class="dl-row-btn" type="button" data-dashboard-menu="${id}" aria-label="More actions" aria-haspopup="dialog">${svgIcon('more', 'icon icon-xs')}</button>
      </div>
    </div>`;
}

function dashboardEmptyMarkup() {
  const filtering = dashboardStatusFilter !== 'all' || dashboardCategory !== 'all' || dashboardQuery.trim() !== '';
  if (filtering && downloadsCache.length) {
    return `
      <div class="dl-empty">
        <div class="dl-empty-body">
          <span class="dl-empty-icon" aria-hidden="true">${svgIcon('search', 'icon')}</span>
          <div class="dl-empty-title">No matching downloads</div>
          <div class="dl-empty-text">Nothing matches this tab, category or search.</div>
          <button class="dl-empty-reset" type="button" data-dashboard-reset>Clear filters</button>
        </div>
      </div>`;
  }
  return `
    <div class="dl-empty">
      <div class="dl-empty-body">
        <span class="dl-empty-icon" aria-hidden="true">${svgIcon('inbox', 'icon')}</span>
        <div class="dl-empty-title">No active downloads</div>
        <div class="dl-empty-text">Tap + to paste a link and start downloading.</div>
      </div>
    </div>`;
}

function freeSpaceLabel(freeBytes) {
  const value = Number(freeBytes) || 0;
  if (value <= 0) return '';
  const gb = value / 1073741824;
  if (gb >= 100) return Math.round(gb) + ' GB Free';
  if (gb >= 1) return gb.toFixed(1).replace(/\.0$/, '') + ' GB Free';
  const mb = value / 1048576;
  if (mb >= 1) return Math.round(mb) + ' MB Free';
  return Math.round(value / 1024) + ' KB Free';
}

function updateDashboardStorage() {
  const used = Number(downloadsUsage.usedBytes) || 0;
  const total = Number(downloadsUsage.totalBytes) || 0;
  const count = downloadsCache.length;
  const percent = total > 0 ? Math.max(0, Math.min(100, (used / total) * 100)) : 0;
  const free = total > 0 ? Math.max(0, total - used) : 0;
  if (dom.dashboardStorage) {
    /* The header shows the short free-space figure; the full breakdown stays in
     * the tooltip so the value is still available on long-press/desktop. */
    if (!storageReady) {
      dom.dashboardStorage.textContent = 'Checking storage…';
      dom.dashboardStorage.removeAttribute('title');
    } else {
      const short = total > 0 ? freeSpaceLabel(free) : '';
      const detail = total > 0
        ? formatBytes(free) + ' free of ' + formatBytes(total) + ' (' + formatBytes(used) + ' used)'
        : (count ? count + (count === 1 ? ' download' : ' downloads') : 'Universal Media Downloader');
      dom.dashboardStorage.textContent = short || detail;
      dom.dashboardStorage.setAttribute('title', detail);
    }
  }
  if (dom.dashboardStorageBar) {
    dom.dashboardStorageBar.setAttribute('aria-valuenow', String(Math.round(percent)));
    dom.dashboardStorageBar.setAttribute('aria-label', total > 0 ? formatBytes(used) + ' of ' + formatBytes(total) + ' used' : 'Device storage used');
    dom.dashboardStorageBar.classList.toggle('is-high', percent >= 90);
  }
  if (dom.dashboardStorageFill) dom.dashboardStorageFill.style.width = percent.toFixed(1) + '%';
}

/* Filter tabs in the order the bar shows them, left to right. */
const DASHBOARD_FILTER_ORDER = ['shortcuts', 'all', 'downloading', 'finished', 'error'];

function cycleDashboardFilter(step) {
  const index = DASHBOARD_FILTER_ORDER.indexOf(dashboardStatusFilter);
  const next = (index < 0 ? 0 : index) + step;
  if (next < 0 || next >= DASHBOARD_FILTER_ORDER.length) return;
  dashboardStatusFilter = DASHBOARD_FILTER_ORDER[next];
  renderDashboardQueue();
}

function syncDashboardFilters() {
  if (dom.dashboardFilters) {
    dom.dashboardFilters.querySelectorAll('[data-dl-status]').forEach((button) => {
      const active = button.getAttribute('data-dl-status') === dashboardStatusFilter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    /* Five tabs do not fit on a narrow phone, so the bar scrolls: keep the
     * selected tab in view instead of leaving it off the edge. */
    const activeTab = dom.dashboardFilters.querySelector('.dl-filter.is-active');
    if (activeTab) activeTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  if (dom.dashboardCategories) {
    dom.dashboardCategories.querySelectorAll('[data-dl-category]').forEach((button) => {
      const active = button.getAttribute('data-dl-category') === dashboardCategory;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
}

function syncDashboardView() {
  const shortcuts = dashboardStatusFilter === 'shortcuts';
  if (dom.shortcutsView) dom.shortcutsView.classList.toggle('hidden', !shortcuts);
  if (dom.dashboardCategories) dom.dashboardCategories.classList.toggle('hidden', shortcuts);
  if (dom.dashboardQueue) dom.dashboardQueue.classList.toggle('hidden', shortcuts);
  if (dom.dashboardSortBtn) dom.dashboardSortBtn.classList.toggle('hidden', shortcuts);
  if (!shortcuts && shortcutsEditing) setShortcutsEditing(false);
  /* The sort menu belongs to the download list; leaving it open over the
   * Shortcuts tab looks like it belongs to the grid. */
  if (shortcuts) setDashboardSortMenu(false);
}

function renderDashboardQueue() {
  if (!dom.dashboardQueue) return;
  syncDashboardView();
  const counts = dashboardCounts();
  if (dom.dashboardFilters) {
    dom.dashboardFilters.querySelectorAll('[data-dl-count]').forEach((node) => {
      const key = node.getAttribute('data-dl-count');
      node.textContent = String(counts[key] || 0);
    });
  }
  syncDashboardFilters();
  const items = dashboardDownloadItems();
  dom.dashboardQueue.classList.toggle('is-empty', items.length === 0);
  dom.dashboardQueue.innerHTML = items.length ? items.map(dashboardRowMarkup).join('') : dashboardEmptyMarkup();
  updateDashboardStorage();
}

async function refreshDashboardDownloads() {
  const token = ++dashboardRefreshToken;
  await fetchDownloads();
  if (token !== dashboardRefreshToken || !dashboardActive) return;
  renderDashboardQueue();
}

function updateDashboardProgress(data) {
  if (!dashboardActive || !dom.dashboardQueue) return;
  const id = Number(data && data.id);
  const item = downloadsCache.find((entry) => Number(entry.id) === id);
  if (!item) return;
  const row = document.getElementById('dl-row-' + id);
  if (!row) return;
  const group = downloadStatusGroup(item);
  /* A pause or resume swaps the row's action button, so redraw the row instead
   * of patching its text. */
  if (row.getAttribute('data-dl-group') !== group || row.getAttribute('data-dl-paused') !== (isPaused(item) ? '1' : '0')) {
    renderDashboardQueue();
    return;
  }
  const meta = row.querySelector('[data-dl-meta]');
  if (meta) {
    updateDashboardSpeeds();
    meta.textContent = dashboardMetaText(item, group);
  }
  const bar = row.querySelector('[data-dl-progress]');
  if (!bar) {
    /* The first progress event can land after the row was drawn without a bar
     * (the size was still unknown). Redraw this row only, so the other running
     * downloads keep their bars and scroll position. */
    if (Number(item.totalBytes) > 0) row.outerHTML = dashboardRowMarkup(item);
    return;
  }
  const percent = dashboardPercent(item);
  bar.setAttribute('aria-valuenow', String(percent));
  const fill = bar.firstElementChild;
  if (fill) fill.style.width = percent + '%';
  const pct = row.querySelector('[data-dl-pct]');
  if (pct) pct.textContent = percent + '%';
}

function setDashboardSearch(open) {
  dashboardSearchOpen = !!open;
  if (dom.dashboardSearch) dom.dashboardSearch.classList.toggle('hidden', !dashboardSearchOpen);
  if (dom.dashboardSearchBtn) dom.dashboardSearchBtn.setAttribute('aria-expanded', dashboardSearchOpen ? 'true' : 'false');
  if (dashboardSearchOpen) {
    window.setTimeout(() => {
      if (dom.dashboardSearchInput) dom.dashboardSearchInput.focus();
    }, 40);
    return;
  }
  if (dom.dashboardSearchInput) {
    dom.dashboardSearchInput.value = '';
    dom.dashboardSearchInput.blur();
  }
  if (dashboardQuery) {
    dashboardQuery = '';
    renderDashboardQueue();
  }
}

function openBrowserFromDashboard() {
  const tab = activeTab();
  setAppMode('browser');
  if (tab && isHttpUrl(tab.url)) {
    syncActiveTabUi();
    syncNav();
    return;
  }
  if (tab && !isBlankUrl(tab.url)) {
    navigate(getHomePage());
    return;
  }
  /* A blank tab already is the browser's new tab page. */
  syncNativeVisibility();
}

function openDownloadSheet() {
  closeTabSheet();
  closeMenu();
  closeSiteInfo();
  hideSuggestions();
  overlays.add('downloadSheet');
  if (dom.downloadSheet) {
    dom.downloadSheet.classList.add('open');
    dom.downloadSheet.setAttribute('aria-hidden', 'false');
  }
  if (dom.downloadSheetBackdrop) dom.downloadSheetBackdrop.classList.add('open');
  if (dom.downloadFab) dom.downloadFab.setAttribute('aria-expanded', 'true');
  if (dom.dashboardInput) {
    dom.dashboardInput.value = '';
    window.setTimeout(() => {
      if (overlays.has('downloadSheet')) dom.dashboardInput.focus();
    }, 180);
  }
  syncNativeVisibility();
}

function closeDownloadSheet() {
  const wasOpen = overlays.has('downloadSheet');
  overlays.delete('downloadSheet');
  if (dom.downloadSheet) {
    dom.downloadSheet.classList.remove('open');
    dom.downloadSheet.setAttribute('aria-hidden', 'true');
  }
  if (dom.downloadSheetBackdrop) dom.downloadSheetBackdrop.classList.remove('open');
  if (dom.downloadFab) dom.downloadFab.setAttribute('aria-expanded', 'false');
  if (dom.dashboardInput) dom.dashboardInput.blur();
  if (wasOpen) syncNativeVisibility();
}

/* ------------------------------------------------- Download confirmation */

/* Native guesses the filename, but a bare URL with no path segment needs a
 * fallback so the sheet never shows an empty name. */
function filenameFromUrl(url) {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split('/').filter(Boolean).pop();
    if (!last) return 'download';
    const decoded = decodeURIComponent(last);
    return decoded || 'download';
  } catch (error) {
    return 'download';
  }
}

/* Raised by native for a tapped link (shouldOverrideUrlLoading) or a page that
 * starts a download (DownloadListener). Nothing is downloaded until the user
 * confirms here, and the size comes from a native HEAD probe. */
function existingDownload(url) {
  const target = String(url || '');
  if (!target) return null;
  return downloadsCache.find((item) => item && String(item.url || '') === target) || null;
}

/* Asking again about a URL that is already queued or paused only starts a
 * second transfer of the same file. Point at the manager instead. */
function alreadyDownloading(url) {
  if (!existingDownload(url)) return false;
  toast('Download already in progress');
  if (!dashboardActive) showDashboard();
  return true;
}

function showDownloadPrompt(data) {
  const url = String((data && data.url) || '');
  if (!isHttpUrl(url)) return;
  if (alreadyDownloading(url)) return;
  const filename = String((data && data.filename) || '') || filenameFromUrl(url);
  const size = Number(data && data.size) || 0;
  const mime = String((data && data.mime) || '');
  pendingDownloadPrompt = {
    url,
    filename,
    mime,
    userAgent: String((data && data.userAgent) || ''),
    tabId: Number.isFinite(Number(data && data.tabId)) ? Number(data.tabId) : activeTabId
  };
  if (dom.downloadPromptName) dom.downloadPromptName.textContent = filename;
  if (dom.downloadPromptSize) dom.downloadPromptSize.textContent = size > 0 ? formatBytes(size) : 'Size unknown';
  if (dom.downloadPromptDomain) dom.downloadPromptDomain.textContent = hostOf(url) || 'Direct link';
  closeContextMenu();
  overlays.add('downloadPrompt');
  if (dom.downloadPrompt) {
    dom.downloadPrompt.classList.add('open');
    dom.downloadPrompt.setAttribute('aria-hidden', 'false');
  }
  if (dom.downloadPromptBackdrop) dom.downloadPromptBackdrop.classList.add('open');
  if (dom.downloadPromptConfirm) dom.downloadPromptConfirm.disabled = false;
  syncNativeVisibility();
}

function closeDownloadPrompt() {
  const wasOpen = overlays.has('downloadPrompt');
  overlays.delete('downloadPrompt');
  pendingDownloadPrompt = null;
  if (dom.downloadPrompt) {
    dom.downloadPrompt.classList.remove('open');
    dom.downloadPrompt.setAttribute('aria-hidden', 'true');
  }
  if (dom.downloadPromptBackdrop) dom.downloadPromptBackdrop.classList.remove('open');
  if (wasOpen) syncNativeVisibility();
}

async function confirmDownloadPrompt() {
  const pending = pendingDownloadPrompt;
  if (!pending) return;
  if (dom.downloadPromptConfirm) dom.downloadPromptConfirm.disabled = true;
  closeDownloadPrompt();
  try {
    await callPlugin('startDownload', {
      url: pending.url,
      filename: pending.filename,
      mime: pending.mime,
      userAgent: pending.userAgent,
      tabId: pending.tabId
    });
    toast('Download started');
    if (dashboardActive) refreshDashboardDownloads();
    else fetchDownloads();
  } catch (error) {
    toast('Could not start the download');
  }
}

/* ------------------------------------------------------ Long-press menu */

/* A link that is already being fetched must not claim "Link copied": the row
 * is the active download, not a new one. */
function isActiveDownload(url) {
  const target = String(url || '');
  return downloadsCache.some((item) => String(item.url || '') === target && downloadStatusGroup(item) === 'downloading');
}

async function copyTextToClipboard(text, message) {
  const value = String(text || '');
  if (!value) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    toast(message === 'Link copied' && isActiveDownload(value) ? 'Already downloading' : (message || 'Copied'));
  } catch (error) {
    toast('Could not copy');
  }
}

async function downloadFromContextMenu(url) {
  try {
    await callPlugin('startDownload', {
      url,
      filename: filenameFromUrl(url),
      tabId: activeTabId
    });
    toast('Download started');
    if (dashboardActive) refreshDashboardDownloads();
  } catch (error) {
    toast('Could not start the download');
  }
}

/* Builds the menu from what the page reported, so a text link never shows
 * image actions and vice versa. */
function showContextMenu(data) {
  const linkUrl = String((data && data.linkUrl) || '');
  const imageUrl = String((data && data.imageUrl) || '');
  const videoUrl = String((data && data.videoUrl) || '');
  const label = String((data && data.text) || '').trim();
  if (!linkUrl && !imageUrl && !videoUrl) return;

  const items = [];
  const add = (action, icon, text) => items.push({ action, icon, text });
  if (linkUrl && isHttpUrl(linkUrl)) {
    add('open-link', 'newtab', 'Open in new tab');
    add('copy-link', 'link', 'Copy link');
    add('download-link', 'download', 'Download link');
  }
  if (imageUrl && isHttpUrl(imageUrl)) {
    if (items.length) items.push({ sep: true });
    add('open-image', 'external', 'Open image in new tab');
    add('copy-image', 'link', 'Copy image address');
    add('download-image', 'download', 'Download image');
  }
  if (videoUrl && isHttpUrl(videoUrl) && !imageUrl) {
    if (items.length) items.push({ sep: true });
    add('download-video', 'download', 'Download video');
  }
  if (!items.length) return;

  const menu = dom.contextMenu;
  if (!menu) return;
  contextMenuTarget = {
    linkUrl,
    imageUrl,
    videoUrl,
    tabId: Number.isFinite(Number(data && data.tabId)) ? Number(data.tabId) : activeTabId
  };

  const heading = label || hostOf(linkUrl) || hostOf(imageUrl) || hostOf(videoUrl);
  menu.innerHTML =
    (heading ? '<div class="ctx-title">' + escapeHtml(heading) + '</div>' : '') +
    items
      .map((item) =>
        item.sep
          ? '<div class="ctx-sep" role="separator"></div>'
          : '<button class="ctx-item" type="button" role="menuitem" data-ctx-action="' +
            item.action +
            '">' +
            svgIcon(item.icon, 'icon') +
            '<span>' +
            escapeHtml(item.text) +
            '</span></button>'
      )
      .join('');

  overlays.add('contextMenu');
  syncNativeVisibility();

  /* Position at the long-press point and clamp inside the viewport. Page and
   * app coordinates share the same full-screen viewport on Android. */
  menu.hidden = false;
  menu.style.visibility = 'hidden';
  menu.style.left = '0px';
  menu.style.top = '0px';
  const rect = menu.getBoundingClientRect();
  const margin = 8;
  const tapX = Number(data && data.x) || 0;
  const tapY = Number(data && data.y) || 0;
  let left = tapX > 0 ? tapX + 6 : (window.innerWidth - rect.width) / 2;
  let top = tapY > 0 ? tapY + 6 : window.innerHeight - rect.height - 96;
  left = Math.max(margin, Math.min(left, window.innerWidth - rect.width - margin));
  top = Math.max(margin, Math.min(top, window.innerHeight - rect.height - margin));
  menu.style.left = Math.round(left) + 'px';
  menu.style.top = Math.round(top) + 'px';
  menu.style.visibility = '';
}

function closeContextMenu() {
  const wasOpen = overlays.has('contextMenu');
  overlays.delete('contextMenu');
  contextMenuTarget = null;
  if (dom.contextMenu) {
    dom.contextMenu.hidden = true;
    dom.contextMenu.innerHTML = '';
  }
  if (wasOpen) syncNativeVisibility();
}

async function handleContextMenuAction(action) {
  const target = contextMenuTarget;
  if (!target) return;
  closeContextMenu();
  if (action === 'open-link') {
    createTabWithUrl(target.linkUrl, true);
  } else if (action === 'copy-link') {
    copyTextToClipboard(target.linkUrl, 'Link copied');
  } else if (action === 'download-link') {
    downloadFromContextMenu(target.linkUrl);
  } else if (action === 'open-image') {
    createTabWithUrl(target.imageUrl, true);
  } else if (action === 'copy-image') {
    copyTextToClipboard(target.imageUrl, 'Image address copied');
  } else if (action === 'download-image') {
    downloadFromContextMenu(target.imageUrl);
  } else if (action === 'download-video') {
    downloadFromContextMenu(target.videoUrl);
  }
}

async function pasteIntoDownloadInput() {
  if (!dom.dashboardInput) return;
  try {
    const text = await navigator.clipboard.readText();
    const value = String(text || '').trim();
    if (!value) {
      toast('Clipboard is empty');
      return;
    }
    dom.dashboardInput.value = value;
    dom.dashboardInput.focus();
  } catch (error) {
    toast('Paste with the keyboard instead');
  }
}

/* ------------------------------------------------------- Clipboard links */

const CLIPBOARD_PROMPT_GAP = 45000;

async function readClipboardText() {
  /* Native read first: the WebView clipboard API needs a focused document and
   * can silently reject right after the app comes back to the foreground. */
  const plugin = getPlugin();
  if (plugin && typeof plugin.readClipboard === 'function') {
    try {
      const result = await plugin.readClipboard();
      const text = result && typeof result.text === 'string' ? result.text : '';
      if (text) return text;
    } catch (error) {
      /* fall through to the web API */
    }
  }
  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    return '';
  }
}

function normalizeClipboardUrl(value) {
  const text = String(value || '').trim();
  if (!text || /\s/.test(text)) return '';
  if (isHttpUrl(text)) return text;
  if (/^magnet:/i.test(text)) return '';
  if (isProbablyUrl(text) && !/^[a-z][a-z0-9+.-]*:/i.test(text)) return 'https://' + text;
  return '';
}

function hideClipboardPrompt() {
  if (!dom.clipboardPrompt) return;
  dom.clipboardPrompt.classList.remove('show');
  dom.clipboardPrompt.setAttribute('aria-hidden', 'true');
  clipboardPromptUrl = '';
}

function showClipboardPrompt(url) {
  if (!dom.clipboardPrompt || !url) return;
  if (alreadyDownloading(url)) return;
  clipboardPromptUrl = url;
  if (dom.clipboardPromptUrl) dom.clipboardPromptUrl.textContent = url;
  dom.clipboardPrompt.classList.add('show');
  dom.clipboardPrompt.setAttribute('aria-hidden', 'false');
}

function acceptClipboardPrompt() {
  const url = clipboardPromptUrl;
  hideClipboardPrompt();
  if (!url) return;
  openDownloadSheet();
  if (!dom.dashboardInput) return;
  dom.dashboardInput.value = url;
  window.setTimeout(() => {
    if (!dom.dashboardInput) return;
    dom.dashboardInput.focus();
    try {
      const end = dom.dashboardInput.value.length;
      dom.dashboardInput.setSelectionRange(end, end);
    } catch (error) {
      /* ignore */
    }
  }, 200);
}

async function checkClipboardForLink() {
  if (settings.clipboardMonitoring === false) return;
  if (clipboardCheckBusy || booting) return;
  if (!isDashboardMode || !dashboardActive) return;
  if (overlays.size > 0) return;
  if (clipboardPromptUrl) return;
  clipboardCheckBusy = true;
  try {
    const raw = await readClipboardText();
    const url = normalizeClipboardUrl(raw);
    if (!url) return;
    if (!isDashboardMode || !dashboardActive || overlays.size > 0) return;
    const now = Date.now();
    if (url === clipboardLastPrompt && now - clipboardLastPromptAt < CLIPBOARD_PROMPT_GAP) return;
    clipboardLastPrompt = url;
    clipboardLastPromptAt = now;
    showClipboardPrompt(url);
  } finally {
    clipboardCheckBusy = false;
  }
}

/* ---------------------------------------------------------- Quick access */

const QUICK_ACCESS_DEFAULT = [
  { label: 'Google', url: 'https://www.google.com' },
  { label: 'YouTube', url: 'https://www.youtube.com' },
  { label: 'Instagram', url: 'https://www.instagram.com' }
];

function shortcutFavicon(url) {
  return 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(hostOf(url)) + '&sz=128';
}

/* The stored list is authoritative once the user edited it. Older builds wrote
 * only the custom tiles, so seed the built-in ones once on top of them. */
function migrateShortcuts() {
  if (!Array.isArray(settings.quickAccess) || settings.shortcutsMigrated) return;
  const urls = settings.quickAccess.map((item) => (item && item.url) || '');
  settings.quickAccess = QUICK_ACCESS_DEFAULT.filter((item) => urls.indexOf(item.url) === -1)
    .map((item) => ({ label: item.label, url: item.url }))
    .concat(settings.quickAccess);
  settings.shortcutsMigrated = true;
  Store.save('settings');
}

function shortcutItems() {
  const list = Array.isArray(settings.quickAccess) ? settings.quickAccess : QUICK_ACCESS_DEFAULT;
  return list.filter((item) => item && typeof item.url === 'string' && item.url);
}

/* Editing a built-in shortcut has to freeze the whole list first, otherwise the
 * default would reappear after it was renamed or deleted. */
function editableShortcuts() {
  settings.quickAccess = shortcutItems().map((item) => ({
    label: String(item.label || hostOf(item.url)),
    url: item.url
  }));
  return settings.quickAccess;
}

function renderQuickAccess() {
  const tiles = shortcutItems()
    .map((item, index) => {
      const label = String(item.label || hostOf(item.url));
      return `
      <button class="qa-tile${shortcutsEditing ? ' is-editing' : ''}" type="button" data-qa-url="${escapeHtml(item.url)}" data-qa-index="${index}">
        <span class="qa-icon">
          <span class="qa-letter">${escapeHtml(label.charAt(0).toUpperCase())}</span>
          <img class="qa-fav" src="${escapeHtml(shortcutFavicon(item.url))}" alt="" loading="lazy" />
          ${shortcutsEditing ? '<span class="qa-remove" aria-hidden="true">−</span>' : ''}
        </span>
        <span class="qa-label">${escapeHtml(label)}</span>
      </button>`;
    })
    .join('');
  const html =
    tiles +
    `
      <button class="qa-tile" type="button" data-qa-add>
        <span class="qa-icon qa-icon--add">${svgIcon('plus', 'qa-glyph')}</span>
        <span class="qa-label">Add</span>
      </button>`;
  [dom.dashboardQuickAccess, dom.newTabQuickAccess].forEach((node) => {
    if (!node) return;
    node.innerHTML = html;
    /* No favicon (offline, unknown host) falls back to the letter. */
    node.querySelectorAll('img.qa-fav').forEach((img) => {
      img.addEventListener('error', () => img.remove());
    });
  });
}

function setShortcutsEditing(on) {
  shortcutsEditing = !!on;
  if (dom.shortcutsView) dom.shortcutsView.classList.toggle('is-editing', shortcutsEditing);
  if (dom.shortcutsEditBtn) {
    dom.shortcutsEditBtn.classList.toggle('is-active', shortcutsEditing);
    dom.shortcutsEditBtn.setAttribute('aria-pressed', shortcutsEditing ? 'true' : 'false');
    const label = dom.shortcutsEditBtn.querySelector('span');
    if (label) label.textContent = shortcutsEditing ? 'Done' : 'Edit';
  }
  renderQuickAccess();
}

function openQuickAdd() {
  openShortcutEditor(-1);
}

function openShortcutEditor(index) {
  editingShortcutIndex = typeof index === 'number' ? index : -1;
  const item = editingShortcutIndex >= 0 ? shortcutItems()[editingShortcutIndex] : null;
  closeTabSheet();
  closeMenu();
  closeSiteInfo();
  hideSuggestions();
  if (dom.quickAddTitle) dom.quickAddTitle.textContent = item ? 'Edit shortcut' : 'Add shortcut';
  if (dom.quickAddName) dom.quickAddName.value = item ? String(item.label || '') : '';
  if (dom.quickAddUrl) dom.quickAddUrl.value = item ? item.url : '';
  if (dom.quickAddDelete) dom.quickAddDelete.classList.toggle('hidden', !item);
  const submitLabel = dom.quickAddForm && dom.quickAddForm.querySelector('[type="submit"] span');
  if (submitLabel) submitLabel.textContent = item ? 'Save shortcut' : 'Add shortcut';
  openSheet('quickAdd', dom.quickAddSheet, dom.quickAddBackdrop);
  window.setTimeout(() => {
    if (overlays.has('quickAdd') && dom.quickAddUrl) dom.quickAddUrl.focus();
  }, 180);
}

function closeQuickAdd() {
  editingShortcutIndex = -1;
  if (overlays.has('quickAdd')) closeSheet('quickAdd', dom.quickAddSheet, dom.quickAddBackdrop);
}

function submitQuickAdd() {
  const raw = dom.quickAddUrl ? dom.quickAddUrl.value.trim() : '';
  if (!raw) {
    toast('Enter a website address');
    return;
  }
  const url = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw.replace(/^\/+/, '');
  const label = (dom.quickAddName && dom.quickAddName.value.trim()) || hostOf(url);
  const list = editableShortcuts();
  const index = editingShortcutIndex >= 0 && editingShortcutIndex < list.length ? editingShortcutIndex : -1;
  if (index >= 0) list[index] = { label: label, url: url };
  else list.push({ label: label, url: url });
  settings.quickAccess = list;
  Store.save('settings');
  renderQuickAccess();
  closeQuickAdd();
  toast(index >= 0 ? 'Shortcut updated' : 'Shortcut added');
}

function deleteShortcut() {
  const list = editableShortcuts();
  const index = editingShortcutIndex;
  if (index < 0 || index >= list.length) return;
  list.splice(index, 1);
  settings.quickAccess = list;
  Store.save('settings');
  renderQuickAccess();
  closeQuickAdd();
  toast('Shortcut deleted');
}

/* ------------------------------------------------------------ App modes */

/* 4Keeper has two strictly separated modes.
 *  - dashboard: the download manager. No address bar, no native WebView, no
 *    bottom navigation and no browser side menu.
 *  - browser: the address bar, the native WebView, the bottom navigation and
 *    the browser side menu. */
function setBottomNavActive(target) {
  const buttons = {
    dashboard: dom.navDashboardBtn,
    browser: dom.navBrowserBtn,
    tabs: dom.tabsBtn,
    settings: dom.navSettingsBtn
  };
  Object.keys(buttons).forEach((key) => {
    const button = buttons[key];
    if (!button) return;
    const active = key === target;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function syncBottomNav(dashboard) {
  setBottomNavActive(dashboard ? 'dashboard' : 'browser');
}

function setAppMode(mode) {
  const next = mode === 'browser' ? 'browser' : 'dashboard';
  isDashboardMode = next === 'dashboard';
  dashboardActive = isDashboardMode;
  const dashboard = isDashboardMode;

  document.body.classList.toggle('mode-dashboard', dashboard);
  document.body.classList.toggle('mode-browser', !dashboard);
  document.body.setAttribute('data-app-mode', next);

  /* Strict DOM separation. Every browser-only surface is display:none on the
   * dashboard, and the dashboard itself is display:none while browsing, so the
   * two modes can never paint or receive taps at the same time. */
  setNodeVisible(dom.toolbar, !dashboard);
  /* The bottom navigation belongs to the whole app now: the dashboard is the
   * home screen, so the same four destinations stay reachable in both modes. */
  setNodeVisible(dom.browserBottomNav, true);
  setNodeVisible(dom.browserSideMenu, !dashboard);
  setNodeVisible(dom.dashboardSection, dashboard);
  syncBottomNav(dashboard);
  if (!dashboard) hideClipboardPrompt();

  /* display:none, so the toolbar cannot be tapped through or leave a strip. */
  if (dom.toolbar) dom.toolbar.classList.toggle('hidden', dashboard);
  if (dom.backBtn) dom.backBtn.classList.toggle('hidden', dashboard);
  if (dom.forwardBtn) dom.forwardBtn.classList.toggle('hidden', dashboard);

  if (dom.dashboardSection) {
    dom.dashboardSection.classList.toggle('is-hidden', !dashboard);
    dom.dashboardSection.setAttribute('aria-hidden', dashboard ? 'false' : 'true');
  }
  if (dom.downloadFab) dom.downloadFab.classList.toggle('is-off', !dashboard);

  if (dashboard) {
    /* Drop the native page view first, before any dashboard pixel is painted. */
    hideNativeWebView();
    if (overlays.has('menu')) closeMenu();
    if (overlays.has('siteInfo')) closeSiteInfo();
    renderDashboardQueue();
  } else {
    const tab = activeTab();
    if (tab && isHttpUrl(tab.url)) showNativeWebView();
  }

  /* The sniffer is native-side work: switch it off while the dashboard owns the
   * screen so hidden tabs stop scanning, and pull a fresh snapshot when the
   * browser comes back. */
  setMediaSnifferActive(!dashboard);
  /* Always re-pull the native snapshot. Entering the dashboard switches the
   * sniffer off, so anything detected in the last moments before the switch
   * would otherwise never reach the list until the user browsed again. */
  refreshTabMedia();

  syncNativeVisibility();
  return isDashboardMode;
}

function showDashboard() {
  setAppMode('dashboard');
  closeTabSheet();
  closeMenu();
  closeSiteInfo();
  closeDownloadSheet();
  hideSuggestions();
  syncNativeVisibility();
  /* Paint the dashboard skeleton first; the native storage probe and the list
   * read are IO and must not hold up the first frame. */
  window.setTimeout(refreshDashboardDownloads, 0);
}

function leaveDashboard() {
  /* The boot sequence restores tabs, which must not flip the launch mode. */
  if (booting) return;
  if (!isDashboardMode) return;
  setAppMode('browser');
}

async function submitDashboardUrl() {
  const input = dom.dashboardInput;
  const raw = input ? input.value.trim() : '';
  if (!raw) {
    if (input) input.focus();
    return;
  }
  if (input) input.blur();
  if (/^magnet:/i.test(raw)) {
    toast('Torrent links are not supported yet');
    return;
  }
  let url = '';
  if (isHttpUrl(raw)) url = raw;
  else if (isProbablyUrl(raw) && !/^[a-z][a-z0-9+.-]*:/i.test(raw)) url = 'https://' + raw;
  if (!url) {
    closeDownloadSheet();
    if (input) input.value = '';
    setAppMode('browser');
    navigate(raw);
    return;
  }
  /* A page address typed into the FAB leaves the dashboard and browses it.
   * Only direct file links stay here as downloads. */
  if (!looksLikeDirectDownload(url)) {
    closeDownloadSheet();
    if (input) input.value = '';
    setAppMode('browser');
    navigate(url);
    return;
  }
  if (dashboardBusy) return;
  if (alreadyDownloading(url)) {
    closeDownloadSheet();
    if (input) input.value = '';
    return;
  }
  if (settings.wifiOnly && onMobileData()) {
    toast('Wi-Fi only is on — connect to Wi-Fi to download');
    return;
  }
  dashboardBusy = true;
  const button = dom.dashboardForm ? dom.dashboardForm.querySelector('.dl-download-btn') : null;
  if (button) button.disabled = true;
  try {
    await startDownloadWithRetry(url);
    closeDownloadSheet();
    if (input) input.value = '';
    if (!dashboardActive) showDashboard();
    dashboardStatusFilter = 'all';
    dashboardCategory = 'all';
    syncDashboardFilters();
    toast('Download started');
    window.setTimeout(refreshDashboardDownloads, 600);
  } catch (error) {
    toast('Could not start this download');
  } finally {
    dashboardBusy = false;
    if (button) button.disabled = false;
  }
}

/* Best-effort network check for the "Wi-Fi only" preference. The WebView only
 * exposes navigator.connection on some Android versions, so an unknown network
 * never blocks a download the user asked for. */
function onMobileData() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return !!(conn && conn.type === 'cellular');
}

/* Auto-retry: one extra attempt when the native downloader refuses the URL. */
async function startDownloadWithRetry(url) {
  try {
    return await callPlugin('downloadMedia', { url });
  } catch (error) {
    if (!settings.autoRetry) throw error;
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    return callPlugin('downloadMedia', { url });
  }
}

async function goHome() {
  /* Hide the native page view first so it can never sit on top of the dashboard
   * or keep receiving taps meant for the bottom navigation. */
  hideNativeWebView();
  showDashboard();
}

async function newTab(url) {
  await createTabWithUrl(url || '', true);
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
  leaveDashboard();
  closeTabSheet();
  closeMenu();
  await refreshTabs();
  syncActiveTabUi();
  syncNav();
  /* The active tab changed: its media list decides the sniffer badges. */
  refreshTabMedia();
  setLoading(false);
  saveSession();
}

/* Bottom-nav swipe: step through the open WebView tabs, wrapping at the ends. */
async function cycleWebTab(step) {
  if (!tabs.length) return;
  const index = tabs.findIndex((tab) => tab.id === activeTabId);
  const target = tabs[((index < 0 ? 0 : index) + step + tabs.length) % tabs.length];
  if (!target || target.id === activeTabId) {
    toast('Tab ' + (index + 1) + ' of ' + tabs.length);
    return;
  }
  await switchTab(target.id);
  const now = tabs.findIndex((tab) => tab.id === activeTabId);
  toast('Tab ' + (now + 1) + ' of ' + tabs.length);
}

async function closeTab(id) {
  try {
    await callPlugin('closeTab', { id });
  } catch (error) {
    toast('Could not close the tab');
    return;
  }
  dropTabMedia(id);
  if (tabDownloadIndex[id]) {
    delete tabDownloadIndex[id];
    updateDownloadsIndicator();
  }
  // Cleanup pin state
  const meta = getTabMeta(id);
  delete meta.pinned;
  if (Object.keys(meta).length === 0) delete tabMeta[id];
  /* Persist both branches: an emptied entry must disappear from storage too. */
  Store.save('tabMeta');
  await refreshTabs();
  if (!tabs.length) {
    /* Replacing the last tab must not drag the user out of the dashboard, which
     * is what createTabWithUrl() does whenever it activates a tab. */
    const keepDashboard = isDashboardMode;
    await createTabWithUrl(getHomePage(), true);
    if (keepDashboard) setAppMode('dashboard');
  }
  syncActiveTabUi();
  syncNav();
  saveSession();
}

function pinnedCount() {
  return tabs.filter((tab) => getTabMeta(tab.id).pinned === true).length;
}

/* Native tab ids restart from 1 on every launch, so stale pin flags saved in
 * tabMeta must be cleared before the session restore rewrites them. */
function clearPinnedMeta() {
  let changed = false;
  Object.keys(tabMeta).forEach((key) => {
    const entry = tabMeta[key];
    if (!entry || typeof entry !== 'object') return;
    if (entry.pinned === undefined) return;
    delete entry.pinned;
    changed = true;
    if (Object.keys(entry).length === 0) delete tabMeta[key];
  });
  if (changed) Store.save('tabMeta');
}

async function closeAllTabs() {
  const pinned = tabs.filter((tab) => getTabMeta(tab.id).pinned === true);
  const closingCount = tabs.length - pinned.length;
  if (!pinned.length) {
    // No pinned tabs: use native closeAllTabs
    try {
      await callPlugin('closeAllTabs', { url: getHomePage() });
    } catch (error) {
      toast('Could not close tabs');
      return;
    }
    tabMedia = {};
  } else {
    // Close all unpinned tabs while preserving pinned ones
    for (const tab of tabs) {
      if (getTabMeta(tab.id).pinned !== true) {
        try { await callPlugin('closeTab', { id: tab.id }); } catch {}
        dropTabMedia(tab.id);
        delete tabDownloadIndex[tab.id];
        delete tabMeta[tab.id];
      }
    }
    Store.save('tabMeta');
    await refreshTabs();
  }
  syncActiveTabUi();
  syncNav();
  saveSession();
  if (pinned.length) {
    toast(closingCount
      ? 'Closed ' + closingCount + (closingCount === 1 ? ' tab' : ' tabs') + ' · pinned tabs kept'
      : 'All tabs are pinned');
  }
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
  if (status === 'successful' || status === 'completed') {
    return download.exists === false ? 'File removed' : 'Downloaded';
  }
  if (status === 'running' || status === 'pending' || status === 'paused') {
    const total = Number(download.totalBytes) || 0;
    const done = Number(download.bytes) || 0;
    const active = status === 'paused' ? 'Paused' : 'Downloading';
    if (total > 0) return active + ' · ' + formatBytes(done) + ' of ' + formatBytes(total);
    return active;
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
    const incoming = Array.isArray(result && result.items) ? result.items : [];
    /* A poll can land between two progress events. Keeping the higher byte
     * count means a running row never falls back to an empty progress bar. */
    downloadsCache = incoming.map((item) => {
      const live = downloadsCache.find((entry) => Number(entry.id) === Number(item.id));
      if (!live || downloadStatusGroup(item) !== 'downloading') return item;
      return Object.assign({}, item, {
        bytes: Math.max(Number(item.bytes) || 0, Number(live.bytes) || 0),
        totalBytes: Number(item.totalBytes) || Number(live.totalBytes) || 0
      });
    });
    downloadsUsage = {
      usedBytes: Number(result && result.usedBytes) || 0,
      totalBytes: Number(result && result.totalBytes) || 0
    };
  } catch (error) {
    downloadsCache = [];
    downloadsUsage = { usedBytes: 0, totalBytes: 0 };
  }
  storageReady = true;
  updateDashboardSpeeds();
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

/* The engine keeps every chunk's byte offset, so a pause stops the workers and
 * a resume asks the server for the rest of each range. The partial file stays. */
async function pauseDashboardDownload(id) {
  try {
    await callPlugin('pauseDownload', { id });
    toast('Download paused');
  } catch (error) {
    toast('Could not pause this download');
  }
  await refreshDashboardDownloads();
}

async function resumeDashboardDownload(id) {
  try {
    await callPlugin('resumeDownload', { id });
    toast('Download resumed');
  } catch (error) {
    toast('Could not resume this download');
  }
  await refreshDashboardDownloads();
}

/* ------------------------------------------- Per-download actions (⋮) */

let downloadMenuId = -1;

function downloadMenuItems(item, group) {
  const canOpen = group === 'finished' && item.exists !== false;
  return [
    { action: 'open', label: 'Open', icon: 'external', disabled: !canOpen },
    { action: 'share', label: 'Share', icon: 'share', disabled: !canOpen },
    { action: 'folder', label: 'Open folder', icon: 'folder' },
    { action: 'redownload', label: 'Redownload', icon: 'history' },
    { action: 'copy', label: 'Copy download link', icon: 'link' },
    { action: 'properties', label: 'Properties', icon: 'info' },
    { action: 'remove', label: 'Remove', icon: 'trash', danger: true }
  ];
}

function openDownloadMenu(id) {
  const item = downloadsCache.find((entry) => Number(entry.id) === Number(id));
  if (!item) return;
  const group = downloadStatusGroup(item);
  const category = downloadCategory(item);
  downloadMenuId = Number(item.id);
  if (dom.dlMenuIcon) dom.dlMenuIcon.innerHTML = svgIcon(DASHBOARD_CATEGORY_ICONS[category] || 'file', 'icon icon-sm');
  if (dom.dlMenuName) dom.dlMenuName.textContent = item.filename || 'Download';
  if (dom.dlMenuMeta) {
    const total = Number(item.totalBytes) || 0;
    dom.dlMenuMeta.textContent = [
      hostOf(item.url) || 'Direct link',
      dashboardTypeLabel(item, category),
      total > 0 ? formatBytes(total) : ''
    ]
      .filter(Boolean)
      .join(' · ');
  }
  if (dom.dlMenuList) {
    dom.dlMenuList.innerHTML = downloadMenuItems(item, group)
      .map(
        (entry) => `
        <button class="dl-menu-item${entry.danger ? ' is-danger' : ''}" type="button" role="menuitem" data-dl-menu-action="${entry.action}"${entry.disabled ? ' disabled' : ''}>
          ${svgIcon(entry.icon, 'icon icon-sm')}
          <span>${escapeHtml(entry.label)}</span>
        </button>`
      )
      .join('');
  }
  overlays.add('downloadMenu');
  if (dom.dlMenuSheet) {
    dom.dlMenuSheet.classList.add('open');
    dom.dlMenuSheet.setAttribute('aria-hidden', 'false');
  }
  if (dom.dlMenuBackdrop) dom.dlMenuBackdrop.classList.add('open');
  syncNativeVisibility();
}

function closeDownloadMenu() {
  const wasOpen = overlays.has('downloadMenu');
  overlays.delete('downloadMenu');
  downloadMenuId = -1;
  if (dom.dlMenuSheet) {
    dom.dlMenuSheet.classList.remove('open');
    dom.dlMenuSheet.setAttribute('aria-hidden', 'true');
  }
  if (dom.dlMenuBackdrop) dom.dlMenuBackdrop.classList.remove('open');
  if (wasOpen) syncNativeVisibility();
}

async function handleDownloadMenuAction(action) {
  const id = downloadMenuId;
  const item = downloadsCache.find((entry) => Number(entry.id) === id);
  closeDownloadMenu();
  if (!item) return;

  if (action === 'open') {
    openDownloadFile(id);
    return;
  }
  if (action === 'share') {
    try {
      await callPlugin('shareDownload', { id });
    } catch (error) {
      toast('No app can share this file');
    }
    return;
  }
  if (action === 'folder') {
    try {
      const result = await callPlugin('openDownloadFolder');
      if (result && result.opened === false && result.path) toast('Folder: ' + result.path);
    } catch (error) {
      toast('Could not open the download folder');
    }
    return;
  }
  if (action === 'redownload') {
    try {
      await callPlugin('redownload', { id });
      toast('Download restarted');
    } catch (error) {
      toast('Could not restart this download');
    }
    await refreshDashboardDownloads();
    return;
  }
  if (action === 'copy') {
    copyTextToClipboard(item.url, 'Download link copied');
    return;
  }
  if (action === 'properties') {
    const saved = Number(item.timestamp) || 0;
    const rows = [
      ['Status', downloadStatus(item)],
      ['Size', Number(item.totalBytes) > 0 ? formatBytes(Number(item.totalBytes)) : 'Unknown'],
      ['Downloaded', formatBytes(Number(item.bytes) || 0)],
      ['Host', hostOf(item.url) || 'Direct link'],
      ['Saved', saved > 0 ? new Date(saved).toLocaleString() : 'Unknown'],
      ['Link', String(item.url || 'Unknown')]
    ];
    openDialog({
      title: item.filename || 'Download',
      confirmLabel: 'Close',
      singleAction: true,
      body: rows
        .map(
          ([label, value]) => `
          <div class="site-info-row">
            <span class="site-info-label">${escapeHtml(label)}</span>
            <span class="site-info-value">${escapeHtml(value)}</span>
          </div>`
        )
        .join('')
    });
    return;
  }
  if (action === 'remove') {
    const active = downloadStatusGroup(item) === 'downloading';
    openDialog({
      title: 'Remove this download?',
      message: active ? 'The transfer stops and the partial file is deleted.' : 'The file is deleted from storage.',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        await removeDownloadFile(id);
        await refreshDashboardDownloads();
      }
    });
  }
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
    ['Ad blocking', settings.adBlock ? 'On for all sites' : 'Off'],
    ['Fingerprint protection', settings.fingerprintBlock ? 'On' : 'Off'],
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

function speedLimitLabel() {
  const kb = Number(settings.speedLimit) || 0;
  if (!kb) return 'Unlimited';
  return kb >= 1024 ? (kb / 1024) + ' MB/s' : kb + ' KB/s';
}

function downloadFolderLabel() {
  return settings.downloadLocation ? (settings.downloadLocationLabel || 'Custom folder') : 'App folder';
}

function maxParallelLabel() {
  return String(Number(settings.maxParallelDownloads) || 1);
}

function connectionsLabel() {
  const value = Number(settings.connectionsPerFile) || 1;
  return value + (value === 1 ? ' connection' : ' connections');
}

const DOH_PROVIDERS = [
  { value: 'cloudflare', label: 'Cloudflare', desc: '1.1.1.1 — fastest' },
  { value: 'google', label: 'Google', desc: '8.8.8.8' },
  { value: 'quad9', label: 'Quad9', desc: '9.9.9.9 — blocks malware domains' },
  { value: 'adguard', label: 'AdGuard', desc: '94.140.14.14 — blocks ads and trackers' }
];

function dohProviderLabel() {
  const found = DOH_PROVIDERS.find((item) => item.value === settings.dohProvider);
  return found ? found.label : 'Cloudflare';
}

/* Two separate settings trees:
 *  - 'app'     → Downloader settings (folder, speed, parallel downloads, theme)
 *  - 'browser' → Browser settings (search engine, desktop mode, JavaScript, data)
 * The About page is a section that sits on top of whichever tree is active. */
function renderSettingsRoot() {
  currentSettingsSection = null;
  const browser = settingsView === 'browser';
  dom.settingsTitle.textContent = browser ? 'Browser settings' : 'Downloader settings';
  dom.settingsRoot.classList.remove('hidden');
  dom.settingsPage.hidden = true;
  dom.settingsPage.classList.add('hidden');
  dom.settingsPage.innerHTML = '';

  dom.settingsRoot.innerHTML = browser
    ? settingSection('Browsing', `
        ${settingRowButton('search', 'Search engine', 'Used when you type a query', engineLabel(), 'engine')}
        ${settingRowToggle('desktopMode', 'Desktop mode', 'Request desktop versions of pages')}
        ${settingRowToggle('javaScript', 'JavaScript', 'Required by most modern sites')}
      `) +
      settingSection('Data', `
        ${settingRowAction('trash', 'Clear history', 'Remove history, cookies and cached data', 'clearData', true)}
      `) +
      settingSection('More', `
        ${settingNavRow('search', 'Search options', 'Suggestions, language and homepage', 'search')}
        ${settingNavRow('shield', 'Privacy and security', 'Tracking, cookies and safe browsing', 'privacy')}
        ${settingNavRow('sliders', 'Site settings', 'Pop-ups, zoom and text size', 'site', (Number(settings.textZoom) || 100) + '%')}
        ${settingNavRow('palette', 'Address bar', 'Density and full URL display', 'appearance')}
      `) +
      `<div class="setting-note">Browser settings apply to the WebView. Downloads and the app theme live in Downloader settings.</div>`
    : settingSection('Downloads', `
        ${settingRowButton('download', 'Download folder', 'Where saved files are kept', downloadFolderLabel(), 'downloadFolder')}
        ${settingRowButton('sliders', 'Speed limit', 'Cap download bandwidth', speedLimitLabel(), 'speedLimit')}
        ${settingRowButton('download', 'Max parallel downloads', 'Files downloading at once', maxParallelLabel(), 'maxParallel')}
        ${settingRowButton('sliders', 'Connections per file', 'More connections can download faster', connectionsLabel(), 'connectionsPerFile')}
      `) +
      settingSection('Network and reliability', `
        ${settingRowToggle('wifiOnly', 'Wi-Fi only', 'Pause downloads while on mobile data')}
        ${settingRowToggle('autoRetry', 'Auto-retry failed downloads', 'Try again when a transfer drops')}
      `) +
      settingSection('Notifications', `
        ${settingRowToggle('downloadNotifications', 'Show download notifications', 'Progress and finished alerts')}
        ${settingRowToggle('clipboardMonitoring', 'Clipboard monitoring', 'Offer copied links when you return to the app')}
      `) +
      settingSection('Appearance', `
        ${settingRowButton('palette', 'App theme', 'System, light, dark or AMOLED', themeLabel(), 'theme')}
      `) +
      `<div class="setting-note">Downloader settings control how 4Keeper saves files. Browser settings live in the side menu.</div>`;
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
    settingSection('Homepage', `
      ${settingRowButton('link', 'Homepage', 'Opened by the Home button', settings.homePage || getEngine().home, 'homePage')}
      ${settingRowButton('text', 'On startup', 'What opens when the app starts', startupLabel(), 'startup')}
    `);
}

const ADBLOCK_LISTS = {
  adblockStevenBlack: 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts',
  adblockPeterLowe: 'https://pgl.yoyo.org/adservers/serverlist.php?hostformat=hosts&showintro=0&mimetype=plaintext',
  adblockAdGuard: 'https://raw.githubusercontent.com/AdguardTeam/cname-trackers/master/data/combined_disguised_ads_justdomains.txt',
  adblockAdAway: 'https://adaway.org/hosts.txt'
};

function adblockListUrls() {
  const urls = [];
  Object.keys(ADBLOCK_LISTS).forEach((key) => {
    if (settings[key]) urls.push(ADBLOCK_LISTS[key]);
  });
  (settings.adblockCustomLists || []).forEach((url) => {
    if (url && urls.indexOf(url) === -1) urls.push(url);
  });
  return urls;
}

function adblockCustomRows() {
  return (settings.adblockCustomLists || []).map((url) => `
    <div class="setting-row">
      <span class="setting-text">
        <span class="setting-label">${escapeHtml(url)}</span>
        <span class="setting-desc">Custom list</span>
      </span>
      <button class="dl-row-btn" type="button" data-adblock-remove="${escapeHtml(url)}" aria-label="Remove filter list">${svgIcon('close', 'icon icon-xs')}</button>
    </div>`).join('');
}

async function updateAdBlockFilters(button) {
  const urls = adblockListUrls();
  if (!urls.length) {
    toast('Enable a filter list first');
    return;
  }
  const label = button ? button.querySelector('.setting-label') : null;
  if (button) {
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
  }
  if (label) label.textContent = 'Updating filters…';
  try {
    const result = await callPlugin('updateAdBlockLists', { urls });
    const failed = (result && result.failed) || [];
    const hosts = (result && result.hosts) || 0;
    if (!failed.length) {
      toast('Filters updated · ' + hosts.toLocaleString() + ' hosts');
    } else if (failed.length === urls.length) {
      toast('Could not download the filter lists');
    } else {
      toast('Updated, but ' + failed.length + (failed.length === 1 ? ' list' : ' lists') + ' failed to download');
    }
  } catch (error) {
    toast('Could not update filters');
  } finally {
    if (button && button.isConnected) {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
    if (label) label.textContent = 'Update Filters';
  }
}

function settingsPagePrivacy() {
  return settingSection('Protection', `
      ${settingRowToggle('adBlock', 'Ad & Tracker Blocking', 'Block ad networks and hide ad containers')}
      ${settingRowToggle('fingerprintBlock', 'Fingerprint Protection', 'Spoof device details and canvas output')}
      ${settingRowToggle('trackingProtection', 'Tracking protection', 'Block known tracking hosts')}
      ${settingRowToggle('doNotTrack', 'Do Not Track', 'Send DNT and Global Privacy Control headers')}
      ${settingRowToggle('dnsOverHttps', 'DNS over HTTPS', 'Encrypt DNS lookups instead of using the system resolver')}
      ${settingRowButton('shield', 'DNS provider', 'Resolver used while DoH is on', dohProviderLabel(), 'dnsProvider')}
      ${settingRowToggle('safeBrowsing', 'Safe Browsing', 'Warn about dangerous sites')}
    `) +
    settingSection('AdBlock Filter Lists', `
      ${settingRowToggle('adblockStevenBlack', 'StevenBlack Unified', 'Ads, trackers and malware hosts')}
      ${settingRowToggle('adblockPeterLowe', "Peter Lowe's List", 'Curated ad and tracking servers')}
      ${settingRowToggle('adblockAdGuard', 'AdGuard DNS Filter', 'Disguised ads and CNAME trackers')}
      ${settingRowToggle('adblockAdAway', 'AdAway', 'Community-maintained host list')}
      ${adblockCustomRows()}
      <div class="setting-row">
        <input class="text-input" id="adblockCustomUrl" type="url" inputmode="url" autocomplete="off" placeholder="https://example.com/hosts.txt" aria-label="Custom filter list URL">
        <button class="btn btn-primary" type="button" data-action="adblockAdd">Add</button>
      </div>
      ${settingRowAction('shield', 'Update Filters', 'Download the enabled lists now', 'adblockUpdate')}
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
  return settingSection('Library', `
      ${settingRowAction('history', 'History', 'Pages you have visited', 'openHistory')}
      ${settingRowAction('bookmark', 'Bookmarks', 'Pages you saved', 'openBookmarks')}
    `) +
    settingSection('Browsing data', `
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
    data: 'Data',
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

function openSettingsScreen(section, view) {
  if (view === 'app' || view === 'browser') settingsView = view;
  /* Settings is a full-screen destination. Leaving a sheet (tabs, download,
   * menu) open underneath put two overlays on the back stack and let the
   * bottom-nav indicator and the visible surface disagree. */
  closeOtherSheets(null);
  closeSideDrawer();
  if (section) showSettingsSection(section);
  else renderSettingsRoot();
  openScreen('settings', dom.settingsScreen);
  setBottomNavActive('settings');
}

function closeSettingsScreen() {
  if (currentSettingsSection) {
    renderSettingsRoot();
    return;
  }
  closeScreen('settings', dom.settingsScreen);
  setBottomNavActive(isDashboardMode ? 'dashboard' : 'browser');
}

function handleSettingsAction(action) {
  switch (action) {
    case 'adblockUpdate':
      updateAdBlockFilters(dom.settingsPage.querySelector('[data-action="adblockUpdate"]'));
      break;
    case 'adblockAdd': {
      const input = document.getElementById('adblockCustomUrl');
      const value = input ? input.value.trim() : '';
      if (!/^https?:\/\//i.test(value)) {
        toast('Enter a list URL starting with http');
        break;
      }
      const lists = (settings.adblockCustomLists || []).slice();
      if (lists.indexOf(value) === -1) lists.push(value);
      updateSetting({ adblockCustomLists: lists }, { rerender: true, toastMessage: 'List added' });
      break;
    }
    case 'theme':
      openChoice('Theme', [
        { value: 'system', label: 'System', desc: 'Follow the device setting' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'amoled', label: 'AMOLED', desc: 'True black for OLED screens' }
      ], settings.theme, (value) => updateSetting({ theme: value }, { rerender: true, toastMessage: 'Theme updated' }));
      break;
    case 'speedLimit':
      openChoice('Speed limit', [
        { value: '0', label: 'Unlimited', desc: 'Use the full connection speed' },
        { value: '512', label: '512 KB/s' },
        { value: '1024', label: '1 MB/s' },
        { value: '2048', label: '2 MB/s' },
        { value: '5120', label: '5 MB/s' },
        { value: '10240', label: '10 MB/s' }
      ], String(Number(settings.speedLimit) || 0), (value) => updateSetting({ speedLimit: Number(value) || 0 }, { rerender: true, toastMessage: 'Speed limit updated' }));
      break;
    case 'maxParallel':
      openChoice('Max parallel downloads', [1, 2, 3, 4, 5].map((count) => ({
        value: String(count),
        label: count + (count === 1 ? ' download' : ' downloads'),
        desc: count === 3 ? 'Recommended' : ''
      })), maxParallelLabel(), (value) => updateSetting({ maxParallelDownloads: Number(value) || 1 }, { rerender: true, toastMessage: 'Parallel downloads updated' }));
      break;
    case 'connectionsPerFile':
      openChoice('Connections per file', [
        { value: '1', label: '1 connection', desc: 'Gentlest on the network' },
        { value: '4', label: '4 connections', desc: 'Balanced' },
        { value: '8', label: '8 connections', desc: 'Faster on large files' },
        { value: '16', label: '16 connections', desc: 'Fastest, heaviest on the server' }
      ], String(Number(settings.connectionsPerFile) || 1), (value) => updateSetting({ connectionsPerFile: Number(value) || 1 }, { rerender: true, toastMessage: 'Connections per file updated' }));
      break;
    case 'density':
      openChoice('Density', [
        { value: 'comfortable', label: 'Comfortable', desc: 'More breathing room' },
        { value: 'compact', label: 'Compact', desc: 'More rows on screen' }
      ], settings.density, (value) => updateSetting({ density: value }, { rerender: true }));
      break;
    case 'dnsProvider':
      openChoice('DNS provider', DOH_PROVIDERS, settings.dohProvider || 'cloudflare', (value) => updateSetting({ dohProvider: value }, { rerender: true, toastMessage: 'DNS provider updated' }));
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
    case 'openHistory':
      openHistory();
      break;
    case 'openBookmarks':
      openBookmarks();
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

  if (dom.backBtn) dom.backBtn.addEventListener('click', goBack);
  if (dom.forwardBtn) dom.forwardBtn.addEventListener('click', goForward);
  /* Strict, id-based Dashboard listener. It always drops the native page view
   * before the dashboard is shown, so the user can never be trapped in browser
   * mode. The dashboard is the app's home screen. */
  if (dom.navDashboardBtn) {
    dom.navDashboardBtn.addEventListener('click', (event) => {
      event.preventDefault();
      goHome();
    });
  }

  if (dom.dashboardForm) {
    dom.dashboardForm.addEventListener('submit', (event) => {
      event.preventDefault();
      submitDashboardUrl();
    });
  }
  if (dom.dashboardInput) {
    dom.dashboardInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitDashboardUrl();
      } else if (event.key === 'Escape') {
        closeDownloadSheet();
      }
    });
  }
  if (dom.dashboardMenuBtn) {
    /* The dashboard hamburger opens the side drawer, which links to the
     * Downloader settings, the Browser settings and About. */
    dom.dashboardMenuBtn.addEventListener('click', () => {
      if (overlays.has('drawer')) closeSideDrawer();
      else openSideDrawer();
    });
  }
  if (dom.browserMenuBtn) {
    /* Browser-mode overflow: the same menu the address bar offers, so New tab,
     * Bookmarks, History, Downloads, Desktop site and reading mode are one tap
     * away. The toolbar is hidden in dashboard mode, so this stays browser-only. */
    dom.browserMenuBtn.addEventListener('click', () => {
      if (overlays.has('menu')) closeMenu();
      else openMenu();
    });
  }
  if (dom.dashboardSearchBtn) {
    dom.dashboardSearchBtn.addEventListener('click', () => setDashboardSearch(!dashboardSearchOpen));
  }
  if (dom.dashboardSearchInput) {
    dom.dashboardSearchInput.addEventListener('input', () => {
      dashboardQuery = dom.dashboardSearchInput.value;
      renderDashboardQueue();
    });
    dom.dashboardSearchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setDashboardSearch(false);
    });
  }
  if (dom.dashboardSearchClear) {
    dom.dashboardSearchClear.addEventListener('click', () => {
      if (dom.dashboardSearchInput) dom.dashboardSearchInput.value = '';
      dashboardQuery = '';
      renderDashboardQueue();
      if (dom.dashboardSearchInput) dom.dashboardSearchInput.focus();
    });
  }
  if (dom.dashboardFilters) {
    dom.dashboardFilters.addEventListener('click', (event) => {
      const button = event.target.closest('[data-dl-status]');
      if (!button) return;
      dashboardStatusFilter = button.getAttribute('data-dl-status') || 'all';
      renderDashboardQueue();
    });
  }
  if (dom.dashboardSection) {
    /* Swipe the dashboard body sideways to step through the status tabs. Only a
     * mostly horizontal drag counts, so vertical scrolling is untouched. */
    let swipeX = null;
    let swipeY = 0;
    dom.dashboardSection.addEventListener(
      'touchstart',
      (event) => {
        if (event.touches.length !== 1) {
          swipeX = null;
          return;
        }
        swipeX = event.touches[0].clientX;
        swipeY = event.touches[0].clientY;
      },
      { passive: true }
    );
    dom.dashboardSection.addEventListener(
      'touchend',
      (event) => {
        if (swipeX === null) return;
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - swipeX;
        const deltaY = touch.clientY - swipeY;
        swipeX = null;
        if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
        /* The filter bar and the shortcut grid scroll sideways themselves. */
        if (event.target.closest('.dl-filters, .quick-access, .category-chips')) return;
        cycleDashboardFilter(deltaX > 0 ? -1 : 1);
      },
      { passive: true }
    );
  }
  if (dom.dashboardCategories) {
    dom.dashboardCategories.addEventListener('click', (event) => {
      const button = event.target.closest('[data-dl-category]');
      if (!button) return;
      const value = button.getAttribute('data-dl-category') || 'others';
      dashboardCategory = dashboardCategory === value ? 'all' : value;
      renderDashboardQueue();
    });
  }
  if (dom.dashboardQueue) {
    dom.dashboardQueue.addEventListener('click', (event) => {
      const openButton = event.target.closest('[data-dashboard-open]');
      if (openButton) {
        openDownloadFile(Number(openButton.getAttribute('data-dashboard-open')));
        return;
      }
      const pauseButton = event.target.closest('[data-dashboard-pause]');
      if (pauseButton) {
        pauseDashboardDownload(Number(pauseButton.getAttribute('data-dashboard-pause')));
        return;
      }
      const resumeButton = event.target.closest('[data-dashboard-resume]');
      if (resumeButton) {
        resumeDashboardDownload(Number(resumeButton.getAttribute('data-dashboard-resume')));
        return;
      }
      const menuButton = event.target.closest('[data-dashboard-menu]');
      if (menuButton) {
        openDownloadMenu(Number(menuButton.getAttribute('data-dashboard-menu')));
        return;
      }
      const resetButton = event.target.closest('[data-dashboard-reset]');
      if (resetButton) {
        dashboardStatusFilter = 'all';
        dashboardCategory = 'all';
        dashboardQuery = '';
        if (dom.dashboardSearchInput) dom.dashboardSearchInput.value = '';
        renderDashboardQueue();
      }
    });
  }
  if (dom.dashboardSortBtn) {
    dom.dashboardSortBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      setDashboardSortMenu(!dashboardSortMenuOpen);
    });
  }
  if (dom.dashboardSortMenu) {
    dom.dashboardSortMenu.addEventListener('click', (event) => {
      const sortButton = event.target.closest('[data-dl-sort]');
      if (sortButton) {
        setDashboardSort(sortButton.getAttribute('data-dl-sort'));
        setDashboardSortMenu(false);
        return;
      }
      if (event.target.closest('[data-dl-clear-completed]')) clearCompletedDownloads();
    });
  }
  document.addEventListener('pointerdown', (event) => {
    if (!dashboardSortMenuOpen) return;
    const target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    if (target.closest('#dashboardSortMenu') || target.closest('#dashboardSortBtn')) return;
    setDashboardSortMenu(false);
  }, true);
  if (dom.clipboardPromptAccept) dom.clipboardPromptAccept.addEventListener('click', acceptClipboardPrompt);
  if (dom.clipboardPromptClose) dom.clipboardPromptClose.addEventListener('click', hideClipboardPrompt);
  if (dom.downloadFab) dom.downloadFab.addEventListener('click', openDownloadSheet);
  if (dom.newTabForm) {
    dom.newTabForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = dom.newTabInput ? dom.newTabInput.value.trim() : '';
      if (!value) return;
      dom.newTabInput.blur();
      dom.newTabInput.value = '';
      navigate(value);
    });
  }
  if (dom.quickAddClose) dom.quickAddClose.addEventListener('click', closeQuickAdd);
  if (dom.quickAddDelete) dom.quickAddDelete.addEventListener('click', deleteShortcut);
  if (dom.shortcutsEditBtn) dom.shortcutsEditBtn.addEventListener('click', () => setShortcutsEditing(!shortcutsEditing));
  if (dom.quickAddBackdrop) dom.quickAddBackdrop.addEventListener('click', closeQuickAdd);
  if (dom.quickAddForm) {
    dom.quickAddForm.addEventListener('submit', (event) => {
      event.preventDefault();
      submitQuickAdd();
    });
  }
  /* One delegated handler serves both Quick Access grids, which are rebuilt
   * whenever a shortcut is added. While the Shortcuts tab is in edit mode a tap
   * opens the editor instead of navigating. */
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    if (target.closest('[data-qa-add]')) {
      openQuickAdd();
      return;
    }
    const tile = target.closest('[data-qa-url]');
    if (!tile) return;
    if (shortcutsEditing && tile.closest('#dashboardQuickAccess')) {
      openShortcutEditor(Number(tile.getAttribute('data-qa-index')));
      return;
    }
    navigate(tile.getAttribute('data-qa-url'));
  });
  if (dom.downloadSheetClose) dom.downloadSheetClose.addEventListener('click', closeDownloadSheet);
  if (dom.downloadSheetBackdrop) dom.downloadSheetBackdrop.addEventListener('click', closeDownloadSheet);
  if (dom.downloadPromptCancel) dom.downloadPromptCancel.addEventListener('click', closeDownloadPrompt);
  if (dom.downloadPromptConfirm) dom.downloadPromptConfirm.addEventListener('click', confirmDownloadPrompt);
  if (dom.downloadPromptBackdrop) dom.downloadPromptBackdrop.addEventListener('click', closeDownloadPrompt);
  if (dom.dlMenuBackdrop) dom.dlMenuBackdrop.addEventListener('click', closeDownloadMenu);
  if (dom.dlMenuList) {
    dom.dlMenuList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-dl-menu-action]');
      if (!button || button.disabled) return;
      handleDownloadMenuAction(button.getAttribute('data-dl-menu-action'));
    });
  }
  if (dom.contextMenu) {
    dom.contextMenu.addEventListener('click', (event) => {
      const button = event.target.closest('[data-ctx-action]');
      if (!button) return;
      handleContextMenuAction(button.getAttribute('data-ctx-action'));
    });
  }
  /* The backdrop covers the screen, but it is a separate element that can be
   * scrolled out from under the keyboard on some devices and it is not rendered
   * for every sheet. A capture-phase guard on the document guarantees that any
   * tap outside the sheet dismisses it. */
  document.addEventListener('pointerdown', (event) => {
    if (!overlays.has('downloadSheet')) return;
    const target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    if (dom.downloadSheet && dom.downloadSheet.contains(target)) return;
    if (dom.downloadFab && dom.downloadFab.contains(target)) return;
    closeDownloadSheet();
  }, true);
  /* Tapping anywhere outside the long-press menu dismisses it, exactly like a
   * system context menu. Taps on the menu itself must survive this guard. */
  document.addEventListener('pointerdown', (event) => {
    if (!overlays.has('contextMenu')) return;
    if (dom.contextMenu && dom.contextMenu.contains(event.target)) return;
    closeContextMenu();
  }, true);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (overlays.has('contextMenu')) closeContextMenu();
    else if (overlays.has('downloadPrompt')) closeDownloadPrompt();
    else if (overlays.has('quickAdd')) closeQuickAdd();
  });
  if (dom.downloadPasteBtn) dom.downloadPasteBtn.addEventListener('click', pasteIntoDownloadInput);

  if (dom.navBrowserBtn) {
    dom.navBrowserBtn.addEventListener('click', openBrowserFromDashboard);
  }
  if (dom.navSettingsBtn) {
    /* Bottom navigation gear is the Downloader settings entry point. */
    dom.navSettingsBtn.addEventListener('click', () => openSettingsScreen(null, 'app'));
  }

  if (dom.sideDrawer) {
    dom.sideDrawer.addEventListener('click', (event) => {
      const navBtn = event.target.closest('[data-drawer-nav]');
      if (navBtn) {
        const target = navBtn.getAttribute('data-drawer-nav');
        if (target === 'appSettings') openSettingsScreen(null, 'app');
        else if (target === 'browserSettings') openSettingsScreen(null, 'browser');
        else if (target === 'about') openSettingsScreen('about');
        return;
      }
      if (event.target.closest('#drawerDownloadsBtn')) {
        closeSideDrawer();
        openDownloads();
      } else if (event.target.closest('#drawerHistoryBtn')) {
        closeSideDrawer();
        openHistory();
      } else if (event.target.closest('#drawerBookmarksBtn')) {
        closeSideDrawer();
        openBookmarks();
      }
    });
  }
  if (dom.sideDrawerClose) dom.sideDrawerClose.addEventListener('click', closeSideDrawer);
  if (dom.sideDrawerBackdrop) dom.sideDrawerBackdrop.addEventListener('click', closeSideDrawer);
  if (dom.tabsBtn) {
    let tabSwipeX = null;
    let tabSwipeY = 0;
    dom.tabsBtn.addEventListener(
      'touchstart',
      (event) => {
        tabSwipeBlockClick = false;
        if (event.touches.length !== 1) {
          tabSwipeX = null;
          return;
        }
        tabSwipeX = event.touches[0].clientX;
        tabSwipeY = event.touches[0].clientY;
      },
      { passive: true }
    );
    dom.tabsBtn.addEventListener(
      'touchmove',
      (event) => {
        if (tabSwipeX === null) return;
        if (Math.abs(event.touches[0].clientX - tabSwipeX) > 10) tabSwipeBlockClick = true;
      },
      { passive: true }
    );
    dom.tabsBtn.addEventListener(
      'touchend',
      (event) => {
        if (tabSwipeX === null) return;
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - tabSwipeX;
        const deltaY = touch.clientY - tabSwipeY;
        tabSwipeX = null;
        if (Math.abs(deltaX) < 30 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
        cycleWebTab(deltaX > 0 ? -1 : 1);
      },
      { passive: true }
    );
    dom.tabsBtn.addEventListener('click', () => {
      /* A swipe must not also open the Tab Manager. */
      if (tabSwipeBlockClick) {
        tabSwipeBlockClick = false;
        return;
      }
      if (overlays.has('tabs')) closeTabSheet();
      else openTabSheet();
    });
  }  dom.siteInfoBtn.addEventListener('click', openSiteInfo);

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
  dom.closeAllTabsBtn.addEventListener('click', () => {
    if (!tabs.length) return;
    openDialog({
      title: 'Close all tabs?',
      message: pinnedCount()
        ? 'All open tabs will be closed. Pinned tabs will stay open.'
        : 'All open tabs will be closed and a new tab will open.',
      confirmLabel: 'Close all',
      destructive: true,
      onConfirm: () => closeAllTabs()
    });
  });
  dom.tabsList.addEventListener('click', (event) => {
    const pinButton = event.target.closest('[data-tab-pin]');
    if (pinButton) {
      event.stopPropagation();
      const id = Number(pinButton.getAttribute('data-tab-pin'));
      toggleTabPin(id);
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
      switchTab(Number(card.getAttribute('data-tab-id')));
    }
  });
  dom.tabsList.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (event.target.closest('[data-tab-pin]') || event.target.closest('[data-close-tab]')) return;
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
        toggleTabPin(id);
      } else if (value === 'close') {
        closeTab(id);
      } else if (value === 'closeOthers') {
        tabs.filter((tab) => tab.id !== id).forEach((tab) => closeTab(tab.id));
      } else if (value === 'duplicate') {
        const tab = tabs.find((t) => t.id === id);
        if (tab) newTab(tab.url);
      }
    }, { keepTabs: true });
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
  dom.menuSettingsBtn.addEventListener('click', () => openSettingsScreen(null, 'browser'));

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
    openSettingsScreen(null, 'app');
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

  /* The settings root and its sub-pages now share one handler: the root pages
   * hold toggles and actions directly (they are no longer only navigation). */
  const onSettingsClick = (event) => {
    const toggle = event.target.closest('[data-toggle]');
    if (toggle) {
      const key = toggle.getAttribute('data-toggle');
      if (!key || !(key in DEFAULT_SETTINGS)) return;
      const patch = {};
      patch[key] = !settings[key];
      const reload = [
        'javaScript',
        'popups',
        'textZoom',
        'desktopMode',
        'webDarkMode',
        'pinchZoom',
        'zoomControls',
        'adBlock',
        'fingerprintBlock'
      ].includes(key);
      updateSetting(patch, { reload, rerender: true });
      return;
    }
    const remove = event.target.closest('[data-adblock-remove]');
    if (remove) {
      const url = remove.getAttribute('data-adblock-remove');
      updateSetting({
        adblockCustomLists: (settings.adblockCustomLists || []).filter((entry) => entry !== url)
      }, { rerender: true, toastMessage: 'List removed' });
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
    if (!key || key === 'root') renderSettingsRoot();
    else showSettingsSection(key);
  };
  dom.settingsRoot.addEventListener('click', onSettingsClick);
  dom.settingsPage.addEventListener('click', onSettingsClick);

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
    else if (overlays.has('drawer')) closeSideDrawer();
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
      if (overlays.size === 0 && !dashboardActive) mountBrowser();
    }, 90);
  };
  const handleResize = () => scheduleBoundsSync();
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', handleResize);

  if (typeof ResizeObserver !== 'undefined') {
    const boundsObserver = new ResizeObserver(() => {
      /* Never mount the native page view while the dashboard owns the screen:
       * a mount here would apply dashboard-sized (taller) bounds. */
      if (overlays.size === 0 && !dashboardActive) mountBrowser();
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
      scheduleTabsRender();
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
      scheduleTabsRender();
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
    scheduleTabsRender();
    scheduleSessionSave();
    if (overlays.has('siteInfo')) renderSiteInfo();
  });

  listen('downloadsRestored', () => {
    /* Native repaired stale records and restored paused rows in the background;
     * the list has to be read again once that write finished. */
    storageReady = false;
    if (dashboardActive) refreshDashboardDownloads();
    else fetchDownloads();
  });

  listen('showDownloadPrompt', (data) => {
    if (!data || !data.url) return;
    showDownloadPrompt(data);
  });

  /* A page asked for a popup window. Native blocks the window itself and asks
   * here instead, so no tab opens without the user's word. */
  listen('newTabRequested', (data) => {
    const url = String((data && data.url) || '');
    if (!isHttpUrl(url) || overlays.has('dialog')) return;
    openDialog({
      title: 'Open link in new tab?',
      message: hostOf(url) || url,
      confirmLabel: 'Open',
      cancelLabel: 'Cancel',
      onConfirm: () => createTabWithUrl(url, true)
    });
  });

  listen('contextMenuRequest', (data) => {
    if (!data) return;
    showContextMenu(data);
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
    scheduleTabsRender();
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
    scheduleTabsRender();
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
    refreshTabs()
      .then(() => {
        if (!tabs.length) return createTabWithUrl(getHomePage(), true);
        return null;
      })
      .catch(() => {});
  });

  listen('mediaDetected', (data) => {
    if (!data) return;
    const tabId = Number(data.tabId);
    if (!Number.isFinite(tabId) || tabId < 0) return;
    if (!noteTabMedia(tabId, data.url, data.kind)) return;
    updateDownloadsIndicator();
    scheduleTabsRender();
    if (!dashboardActive && !overlays.size && nativeVisibleState) {
      announceTabMedia(tabId);
    }
  });

  listen('mediaCleared', (data) => {
    if (!data) return;
    const tabId = Number(data.tabId);
    if (!Number.isFinite(tabId)) return;
    dropTabMedia(tabId);
    updateDownloadsIndicator();
    scheduleTabsRender();
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
    if (dashboardActive) {
      renderDashboardQueue();
      window.setTimeout(refreshDashboardDownloads, 900);
    }
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
    if (dashboardActive) updateDashboardProgress(data);
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
    if (dashboardActive) refreshDashboardDownloads();
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
  if (overlays.has('contextMenu')) {
    closeContextMenu();
    return true;
  }
  if (overlays.has('downloadMenu')) {
    closeDownloadMenu();
    return true;
  }
  if (overlays.has('downloadPrompt')) {
    closeDownloadPrompt();
    return true;
  }
  if (overlays.has('downloadSheet')) {
    closeDownloadSheet();
    return true;
  }
  if (overlays.has('quickAdd')) {
    closeQuickAdd();
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
  if (overlays.has('drawer')) {
    /* The side drawer is a full-height panel on top of the dashboard: Back must
     * close it instead of minimising the app underneath it. */
    closeSideDrawer();
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
  /* The dashboard has no page behind it, so Back must not steer the hidden
   * WebView; the caller minimises the app instead. */
  if (isDashboardMode) return false;
  goBack();
  return true;
}

async function minimizeApp() {
  try {
    if (App && typeof App.minimizeApp === 'function') {
      await App.minimizeApp();
      return;
    }
  } catch (error) {
    /* fall back to a normal exit below */
  }
  await exitApp();
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
  clearPinnedMeta();
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
        .map((tab) => ({ url: buildHomeUrl(tab.url), title: tab.title || '', pinned: tab.pinned === true }))
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
    list.forEach((nativeTab, i) => {
      if (nativeTab && saved[i] && saved[i].pinned) setTabMeta(nativeTab.id, { pinned: true });
    });
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
  migrateShortcuts();
  renderQuickAccess();

  await mountBrowser(true);
  nativeVisibleState = false;
  setNativeVisible(false);
  await pushNativeSettings(false);
  /* Android 13+ asks once; the answer only gates notifications. */
  callPlugin('requestNotificationPermission').catch(() => {});
  loadAppInfo();

  try {
    await restoreSession();
  } catch (error) {
    toast('Could not restore your tabs');
  }

  await refreshTabs().catch(() => {});
  if (!tabs.length) await ensureTabExists();
  tabsReady = true;
  booting = false;
  showDashboard();
  renderTabs();
  syncActiveTabUi();
  const tab = activeTab();
  setNav(!!(tab && tab.canGoBack), !!(tab && tab.canGoForward));
  syncNav();
  setLoading(false);
  updateTabBadge();
  refreshTabMedia();

  if (App && typeof App.addListener === 'function') {
    App.addListener('backButton', () => {
      /* Back must never hard-kill the task. Overlays close first, a page walks
       * its history and falls back to the dashboard, and only the dashboard
       * sends the app to the background. */
      if (handleBack()) return;
      minimizeApp();
    });
    App.addListener('appStateChange', (state) => {
      if (!state || state.isActive === false) {
        saveSession();
        hideClipboardPrompt();
        return;
      }
      lastBoundsKey = '';
      uiOverlayState = null;
      nativeVisibleState = null;
      pageBehindState = false;
      syncNativeVisibility();
      window.setTimeout(() => {
        /* Never mount the page view with dashboard-sized metrics. */
        if (overlays.size === 0 && !dashboardActive) mountBrowser(true);
        else refreshTabMedia();
      }, 160);
      /* Give Android a moment to finish the resume transition before touching
       * the clipboard, otherwise the read can be denied as background access. */
      window.setTimeout(checkClipboardForLink, 450);
    });
  }

  document.addEventListener('resume', () => {
    window.setTimeout(checkClipboardForLink, 300);
  });

  window.addEventListener('pagehide', saveSession);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      lastBoundsKey = '';
      uiOverlayState = null;
      nativeVisibleState = null;
      pageBehindState = false;
      syncNativeVisibility();
      window.setTimeout(() => {
        if (overlays.size === 0 && !dashboardActive) mountBrowser();
      }, 160);
      window.setTimeout(checkClipboardForLink, 300);
    }
  });
}

bootPromise = boot();
