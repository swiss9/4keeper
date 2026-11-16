package com.swiss9.fourkeeper;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.util.Base64;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.core.content.FileProvider;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "EmbeddedWebView")
public class EmbeddedWebViewPlugin extends Plugin {

    private static final String PREFS_NAME = "4keeper_webview";
    private static final String APP_DATA_PREFS = "4keeper_appdata";
    private static final String DESKTOP_USER_AGENT =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
    private static final String[] TRACKER_HOSTS = new String[] {
        "doubleclick.net",
        "googlesyndication.com",
        "googleadservices.com",
        "google-analytics.com",
        "googletagmanager.com",
        "googletagservices.com",
        "adservice.google.com",
        "amazon-adsystem.com",
        "facebook.net",
        "connect.facebook.net",
        "scorecardresearch.com",
        "quantserve.com",
        "criteo.com",
        "criteo.net",
        "taboola.com",
        "outbrain.com",
        "adsrvr.org",
        "adnxs.com",
        "rubiconproject.com",
        "pubmatic.com",
        "openx.net",
        "hotjar.com",
        "mixpanel.com",
        "segment.io",
        "segment.com",
        "branch.io"
    };

    private static class Tab {
        final int id;
        final WebView view;
        String url = "";
        String title = "";

        Tab(int id, WebView view) {
            this.id = id;
            this.view = view;
        }
    }

    private final Map<Integer, Tab> tabs = new LinkedHashMap<>();
    private int activeTabId = -1;
    private int nextTabId = 1;

    private int boundsX = 0;
    private int boundsY = 0;
    private int boundsWidth = 0;
    private int boundsHeight = 0;
    private boolean boundsApplied = false;
    private boolean browserVisible = true;

    private boolean webDarkMode = false;
    private boolean javaScriptEnabled = true;
    private boolean popupsEnabled = true;
    private boolean safeBrowsingEnabled = true;
    private boolean trackingProtectionEnabled = false;
    private boolean desktopMode = false;
    private boolean pinchZoomEnabled = true;
    private boolean zoomControlsVisible = false;
    private boolean downloadNotifications = true;
    private int textZoom = 100;
    private String cookiesMode = "all";

    private SharedPreferences prefs;

    @Override
    public void load() {
        prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        webDarkMode = prefs.getBoolean("webDarkMode", false);
        javaScriptEnabled = prefs.getBoolean("javaScriptEnabled", true);
        popupsEnabled = prefs.getBoolean("popupsEnabled", true);
        safeBrowsingEnabled = prefs.getBoolean("safeBrowsingEnabled", true);
        trackingProtectionEnabled = prefs.getBoolean("trackingProtectionEnabled", false);
        desktopMode = prefs.getBoolean("desktopMode", false);
        pinchZoomEnabled = prefs.getBoolean("pinchZoomEnabled", true);
        zoomControlsVisible = prefs.getBoolean("zoomControlsVisible", false);
        downloadNotifications = prefs.getBoolean("downloadNotifications", true);
        textZoom = prefs.getInt("textZoom", 100);
        cookiesMode = prefs.getString("cookiesMode", "all");
    }

    private SharedPreferences appData() {
        return getContext().getSharedPreferences(APP_DATA_PREFS, Context.MODE_PRIVATE);
    }

    private int dp(int value) {
        return (int) TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            value,
            getContext().getResources().getDisplayMetrics()
        );
    }

    private FrameLayout rootView() {
        return getActivity().findViewById(android.R.id.content);
    }

    private void persistSettings() {
        if (prefs == null) return;
        prefs.edit()
            .putBoolean("webDarkMode", webDarkMode)
            .putBoolean("javaScriptEnabled", javaScriptEnabled)
            .putBoolean("popupsEnabled", popupsEnabled)
            .putBoolean("safeBrowsingEnabled", safeBrowsingEnabled)
            .putBoolean("trackingProtectionEnabled", trackingProtectionEnabled)
            .putBoolean("desktopMode", desktopMode)
            .putBoolean("pinchZoomEnabled", pinchZoomEnabled)
            .putBoolean("zoomControlsVisible", zoomControlsVisible)
            .putBoolean("downloadNotifications", downloadNotifications)
            .putInt("textZoom", textZoom)
            .putString("cookiesMode", cookiesMode)
            .apply();
    }

    private Tab getActiveTab() {
        return tabs.get(activeTabId);
    }

    private FrameLayout.LayoutParams boundsParams() {
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(dp(boundsWidth), dp(boundsHeight));
        params.leftMargin = dp(boundsX);
        params.topMargin = dp(boundsY);
        return params;
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void applySettingsTo(WebView view) {
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(javaScriptEnabled);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(pinchZoomEnabled);
        settings.setSupportZoom(pinchZoomEnabled);
        settings.setDisplayZoomControls(zoomControlsVisible);
        settings.setTextZoom(textZoom);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(popupsEnabled);
        settings.setSupportMultipleWindows(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        if (desktopMode) {
            settings.setUserAgentString(DESKTOP_USER_AGENT);
        } else {
            settings.setUserAgentString(null);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                settings.setSafeBrowsingEnabled(safeBrowsingEnabled);
            } catch (Exception ignored) {
            }
        }

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(!"none".equals(cookiesMode));
        cookies.setAcceptThirdPartyCookies(view, "all".equals(cookiesMode));

        applyDarkMode(view);
    }

    private void applyDarkMode(WebView view) {
        try {
            if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
                WebSettingsCompat.setAlgorithmicDarkeningAllowed(view.getSettings(), webDarkMode);
            }
        } catch (Exception ignored) {
        }
    }

    private void applyActiveVisibility() {
        for (Tab tab : tabs.values()) {
            int desired = (tab.id == activeTabId && browserVisible) ? View.VISIBLE : View.INVISIBLE;
            if (tab.view.getVisibility() != desired) {
                tab.view.setVisibility(desired);
            }
        }
    }

    private void activateTab(Tab tab) {
        if (tab == null) return;
        activeTabId = tab.id;
        applyActiveVisibility();
    }

    private Tab createTabInternal(String url) {
        int id = nextTabId++;
        WebView view = new WebView(getContext());
        view.setBackgroundColor(Color.parseColor("#09090b"));
        applySettingsTo(view);
        view.setWebViewClient(new TabClient(id));
        view.setWebChromeClient(new TabChromeClient(id));
        view.setDownloadListener((downloadUrl, userAgent, contentDisposition, mimeType, contentLength) ->
            enqueueDownload(downloadUrl, userAgent, contentDisposition, mimeType)
        );
        view.setVisibility(View.INVISIBLE);

        Tab tab = new Tab(id, view);
        tabs.put(id, tab);

        FrameLayout root = rootView();
        if (root != null) {
            root.addView(view, boundsParams());
        }

        if (url != null && !url.trim().isEmpty()) {
            tab.url = url;
            view.loadUrl(url);
        }
        return tab;
    }

    private void destroyTab(Tab tab) {
        if (tab == null) return;
        ViewGroup parent = (ViewGroup) tab.view.getParent();
        if (parent != null) {
            parent.removeView(tab.view);
        }
        tab.view.stopLoading();
        tab.view.setWebViewClient(new WebViewClient());
        tab.view.destroy();
    }

    private void removeTabInternal(int id, boolean selectNeighbour) {
        List<Integer> order = new ArrayList<>(tabs.keySet());
        int index = order.indexOf(id);
        Tab tab = tabs.remove(id);
        destroyTab(tab);
        if (id == activeTabId) {
            activeTabId = -1;
            if (selectNeighbour && !tabs.isEmpty()) {
                List<Tab> remaining = new ArrayList<>(tabs.values());
                int nextIndex = Math.max(0, Math.min(index, remaining.size() - 1));
                activateTab(remaining.get(nextIndex));
            } else {
                applyActiveVisibility();
            }
        } else {
            applyActiveVisibility();
        }
    }

    private JSObject tabState(Tab tab) {
        JSObject object = new JSObject();
        if (tab == null) {
            object.put("id", -1);
            object.put("url", "");
            object.put("title", "");
            object.put("canGoBack", false);
            object.put("canGoForward", false);
            return object;
        }
        object.put("id", tab.id);
        object.put("url", tab.url == null ? "" : tab.url);
        object.put("title", tab.title == null ? "" : tab.title);
        object.put("canGoBack", tab.view.canGoBack());
        object.put("canGoForward", tab.view.canGoForward());
        return object;
    }

    private JSObject allTabsState() {
        JSArray array = new JSArray();
        for (Tab tab : tabs.values()) {
            array.put(tabState(tab));
        }
        JSObject result = new JSObject();
        result.put("tabs", array);
        result.put("activeTabId", activeTabId);
        return result;
    }

    private static boolean isTracker(String host) {
        if (host == null) return false;
        String lower = host.toLowerCase();
        for (String tracker : TRACKER_HOSTS) {
            if (lower.equals(tracker) || lower.endsWith("." + tracker)) return true;
        }
        return false;
    }

    private String encodeFavicon(Bitmap bitmap) {
        if (bitmap == null || bitmap.getWidth() <= 0 || bitmap.getHeight() <= 0) return null;
        try {
            Bitmap scaled = Bitmap.createScaledBitmap(bitmap, 32, 32, true);
            ByteArrayOutputStream stream = new ByteArrayOutputStream();
            scaled.compress(Bitmap.CompressFormat.PNG, 85, stream);
            if (scaled != bitmap) scaled.recycle();
            return "data:image/png;base64," + Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP);
        } catch (Exception error) {
            return null;
        }
    }

    private class TabClient extends WebViewClient {
        private final int tabId;

        TabClient(int tabId) {
            this.tabId = tabId;
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            String scheme = uri.getScheme();
            if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)) {
                return false;
            }
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            } catch (Exception ignored) {
            }
            return true;
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            Tab tab = tabs.get(tabId);
            if (tab != null && url != null) tab.url = url;
            JSObject data = new JSObject();
            data.put("tabId", tabId);
            data.put("url", url == null ? "" : url);
            notifyListeners("pageStarted", data);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            Tab tab = tabs.get(tabId);
            if (tab != null) {
                if (url != null && !"about:blank".equals(url)) tab.url = url;
                tab.title = view.getTitle() == null ? tab.title : view.getTitle();
            }
            JSObject data = tabState(tab);
            data.put("tabId", tabId);
            data.put("canGoBack", view.canGoBack());
            data.put("canGoForward", view.canGoForward());
            data.put("title", view.getTitle() == null ? "" : view.getTitle());
            String icon = encodeFavicon(view.getFavicon());
            if (icon != null) {
                data.put("favicon", icon);
            }
            notifyListeners("pageLoaded", data);
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (!request.isForMainFrame()) return;
            String failedUrl = request.getUrl().toString();
            String message = String.valueOf(error.getDescription());
            JSObject data = new JSObject();
            data.put("tabId", tabId);
            data.put("url", failedUrl);
            data.put("code", error.getErrorCode());
            data.put("message", message);
            notifyListeners("pageError", data);
            view.loadDataWithBaseURL(null, errorPage(message, failedUrl), "text/html", "utf-8", null);
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            if (trackingProtectionEnabled && !request.isForMainFrame()) {
                String host = request.getUrl().getHost();
                if (isTracker(host)) {
                    return new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
                }
            }
            return null;
        }

        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            if (tabs.containsKey(tabId)) {
                removeTabInternal(tabId, true);
            }
            JSObject data = new JSObject();
            data.put("tabId", tabId);
            notifyListeners("tabCrashed", data);
            return true;
        }
    }

    private class TabChromeClient extends WebChromeClient {
        private final int tabId;

        TabChromeClient(int tabId) {
            this.tabId = tabId;
        }

        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            JSObject data = new JSObject();
            data.put("tabId", tabId);
            data.put("progress", newProgress);
            notifyListeners("loadProgress", data);
        }

        @Override
        public void onReceivedTitle(WebView view, String title) {
            Tab tab = tabs.get(tabId);
            if (tab != null && title != null) tab.title = title;
            JSObject data = new JSObject();
            data.put("tabId", tabId);
            data.put("title", title == null ? "" : title);
            notifyListeners("titleChanged", data);
        }

        @Override
        public void onReceivedIcon(WebView view, Bitmap icon) {
            String encoded = encodeFavicon(icon);
            if (encoded == null) return;
            JSObject data = new JSObject();
            data.put("tabId", tabId);
            data.put("favicon", encoded);
            data.put("url", view.getUrl() == null ? "" : view.getUrl());
            notifyListeners("faviconChanged", data);
        }
    }

    private static String escapeHtml(String text) {
        if (text == null) return "";
        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;");
    }

    private static String errorPage(String message, String url) {
        return "<!DOCTYPE html><html><head>"
            + "<meta name='viewport' content='width=device-width,initial-scale=1'>"
            + "<style>"
            + "html,body{margin:0;height:100%;background:#09090b;color:#a1a1aa;font-family:system-ui,sans-serif;}"
            + "body{display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;padding:32px;text-align:center;}"
            + "h1{margin:0 0 10px;font-size:18px;font-weight:600;color:#ffffff;}"
            + "p{margin:3px 0;font-size:13px;word-break:break-word;}"
            + "a{display:inline-block;margin-top:18px;border:1px solid #3f3f46;padding:10px 16px;color:#fafafa;text-decoration:none;font-size:13px;}"
            + "</style></head><body>"
            + "<h1>Can't open this page</h1>"
            + "<p>" + escapeHtml(message) + "</p>"
            + "<p>" + escapeHtml(url) + "</p>"
            + "<a href=\"" + escapeHtml(url) + "\">Try again</a>"
            + "</body></html>";
    }

    @PluginMethod
    public void mount(PluginCall call) {
        int x = call.getInt("x", 0);
        int y = call.getInt("y", 0);
        int width = call.getInt("width", 0);
        int height = call.getInt("height", 0);

        getActivity().runOnUiThread(() -> {
            boolean unchanged = boundsApplied
                && boundsX == x
                && boundsY == y
                && boundsWidth == width
                && boundsHeight == height;
            boundsX = x;
            boundsY = y;
            boundsWidth = width;
            boundsHeight = height;
            if (unchanged) {
                call.resolve();
                return;
            }
            boundsApplied = true;
            for (Tab tab : tabs.values()) {
                tab.view.setLayoutParams(boundsParams());
            }
        });
        call.resolve();
    }

    @PluginMethod
    public void createTab(PluginCall call) {
        String url = call.getString("url", "");
        boolean activate = call.getData().optBoolean("activate", true);

        getActivity().runOnUiThread(() -> {
            Tab tab = createTabInternal(url == null ? "" : url.trim());
            if (activate || activeTabId == -1) {
                activateTab(tab);
            }
            JSObject result = tabState(tab);
            result.put("activeTabId", activeTabId);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void switchTab(PluginCall call) {
        Integer id = call.getInt("id");
        if (id == null) {
            call.reject("A tab id is required.");
            return;
        }
        getActivity().runOnUiThread(() -> {
            Tab tab = tabs.get(id);
            if (tab == null) {
                call.reject("Unknown tab.");
                return;
            }
            activateTab(tab);
            JSObject result = tabState(tab);
            result.put("activeTabId", activeTabId);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void closeTab(PluginCall call) {
        Integer id = call.getInt("id");
        if (id == null) {
            call.reject("A tab id is required.");
            return;
        }
        getActivity().runOnUiThread(() -> {
            if (!tabs.containsKey(id)) {
                call.reject("Unknown tab.");
                return;
            }
            removeTabInternal(id, true);
            JSObject result = allTabsState();
            result.put("active", tabState(getActiveTab()));
            call.resolve(result);
        });
    }

    @PluginMethod
    public void closeAllTabs(PluginCall call) {
        String url = call.getString("url", "");
        getActivity().runOnUiThread(() -> {
            for (Integer id : new ArrayList<>(tabs.keySet())) {
                destroyTab(tabs.remove(id));
            }
            activeTabId = -1;
            Tab fresh = null;
            if (url != null && !url.trim().isEmpty()) {
                fresh = createTabInternal(url.trim());
                activateTab(fresh);
            }
            JSObject result = allTabsState();
            result.put("active", tabState(fresh));
            call.resolve(result);
        });
    }

    @PluginMethod
    public void getTabs(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            JSObject result = allTabsState();
            result.put("active", tabState(getActiveTab()));
            call.resolve(result);
        });
    }

    @PluginMethod
    public void loadUrl(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) {
            call.reject("A URL is required.");
            return;
        }
        getActivity().runOnUiThread(() -> {
            Tab tab = getActiveTab();
            if (tab == null) {
                tab = createTabInternal(url);
                activateTab(tab);
            } else {
                tab.url = url;
                tab.view.loadUrl(url);
            }
            JSObject result = tabState(tab);
            result.put("activeTabId", activeTabId);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void goBack(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            Tab tab = getActiveTab();
            if (tab != null && tab.view.canGoBack()) tab.view.goBack();
        });
        call.resolve();
    }

    @PluginMethod
    public void goForward(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            Tab tab = getActiveTab();
            if (tab != null && tab.view.canGoForward()) tab.view.goForward();
        });
        call.resolve();
    }

    @PluginMethod
    public void reload(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            Tab tab = getActiveTab();
            if (tab != null) tab.view.reload();
        });
        call.resolve();
    }

    @PluginMethod
    public void stopLoading(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            Tab tab = getActiveTab();
            if (tab != null) tab.view.stopLoading();
        });
        call.resolve();
    }

    @PluginMethod
    public void setVisibility(PluginCall call) {
        boolean visible = call.getBoolean("visible", true);
        browserVisible = visible;
        getActivity().runOnUiThread(this::applyActiveVisibility);
        call.resolve();
    }

    @PluginMethod
    public void setVisible(PluginCall call) {
        boolean visible = call.getBoolean("visible", true);
        browserVisible = visible;
        getActivity().runOnUiThread(this::applyActiveVisibility);
        call.resolve();
    }

    @PluginMethod
    public void setWebViewVisibility(PluginCall call) {
        boolean visible = call.getBoolean("visible", true);
        browserVisible = visible;
        getActivity().runOnUiThread(this::applyActiveVisibility);
        call.resolve();
    }

    @PluginMethod
    public void captureScreenshot(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            Tab tab = getActiveTab();
            if (tab == null) {
                call.reject("WebView is not available.");
                return;
            }
            try {
                int width = tab.view.getWidth();
                int height = tab.view.getHeight();
                if (width <= 0) width = dp(boundsWidth);
                if (height <= 0) height = dp(boundsHeight);
                if (width <= 0 || height <= 0) {
                    call.reject("WebView has no size.");
                    return;
                }

                Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(bitmap);
                bitmap.eraseColor(Color.parseColor("#09090b"));
                tab.view.draw(canvas);

                ByteArrayOutputStream stream = new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream);
                bitmap.recycle();

                String encoded = Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP);
                JSObject result = new JSObject();
                result.put("data", encoded);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Failed to capture screenshot: " + error.getMessage());
            }
        });
    }

    @PluginMethod
    public void applySettings(PluginCall call) {
        JSObject data = call.getData();
        if (data.has("javaScriptEnabled")) javaScriptEnabled = data.optBoolean("javaScriptEnabled", true);
        if (data.has("cookiesMode")) cookiesMode = data.optString("cookiesMode", "all");
        if (data.has("popups")) popupsEnabled = data.optBoolean("popups", true);
        if (data.has("textZoom")) textZoom = clamp(data.optInt("textZoom", 100), 50, 200);
        if (data.has("desktopMode")) desktopMode = data.optBoolean("desktopMode", false);
        if (data.has("safeBrowsing")) safeBrowsingEnabled = data.optBoolean("safeBrowsing", true);
        if (data.has("darkMode")) webDarkMode = data.optBoolean("darkMode", false);
        if (data.has("trackingProtection")) trackingProtectionEnabled = data.optBoolean("trackingProtection", false);
        if (data.has("zoomControls")) zoomControlsVisible = data.optBoolean("zoomControls", false);
        if (data.has("pinchZoom")) pinchZoomEnabled = data.optBoolean("pinchZoom", true);
        if (data.has("downloadNotifications")) downloadNotifications = data.optBoolean("downloadNotifications", true);

        persistSettings();
        getActivity().runOnUiThread(() -> {
            for (Tab tab : tabs.values()) {
                applySettingsTo(tab.view);
            }
        });
        call.resolve();
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    @PluginMethod
    public void setWebDarkMode(PluginCall call) {
        webDarkMode = call.getBoolean("enabled", false);
        persistSettings();
        getActivity().runOnUiThread(() -> {
            for (Tab tab : tabs.values()) {
                applyDarkMode(tab.view);
            }
        });
        call.resolve();
    }

    @PluginMethod
    public void setDarkMode(PluginCall call) {
        webDarkMode = call.getBoolean("enabled", false);
        persistSettings();
        getActivity().runOnUiThread(() -> {
            for (Tab tab : tabs.values()) {
                applyDarkMode(tab.view);
            }
        });
        call.resolve();
    }

    @PluginMethod
    public void getNavigationState(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            Tab tab = getActiveTab();
            JSObject result = new JSObject();
            result.put("canGoBack", tab != null && tab.view.canGoBack());
            result.put("canGoForward", tab != null && tab.view.canGoForward());
            result.put("url", tab == null ? "" : (tab.url == null ? "" : tab.url));
            call.resolve(result);
        });
    }

    @PluginMethod
    public void clearBrowsingData(PluginCall call) {
        boolean cookies = call.getBoolean("cookies", true);
        boolean cache = call.getBoolean("cache", true);
        boolean clearHistory = call.getBoolean("history", true);
        boolean downloads = call.getBoolean("downloads", false);
        if (cookies) clearCookiesAndStorage();
        getActivity().runOnUiThread(() -> {
            for (Tab tab : tabs.values()) {
                if (cache) tab.view.clearCache(true);
                if (clearHistory) tab.view.clearHistory();
            }
            if (downloads) appData().edit().remove("downloads").apply();
            call.resolve();
        });
    }

    @PluginMethod
    public void clearCookies(PluginCall call) {
        clearCookiesAndStorage();
        call.resolve();
    }

    private void clearCookiesAndStorage() {
        try {
            CookieManager cookies = CookieManager.getInstance();
            cookies.removeAllCookies(null);
            cookies.flush();
            WebStorage.getInstance().deleteAllData();
        } catch (Exception ignored) {
        }
    }

    @PluginMethod
    public void clearCache(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            for (Tab tab : tabs.values()) {
                tab.view.clearCache(true);
            }
        });
        call.resolve();
    }

    @PluginMethod
    public void storageGetAll(PluginCall call) {
        JSObject result = new JSObject();
        try {
            for (Map.Entry<String, ?> entry : appData().getAll().entrySet()) {
                Object value = entry.getValue();
                if (value instanceof String) {
                    result.put(entry.getKey(), (String) value);
                }
            }
        } catch (Exception ignored) {
        }
        call.resolve(result);
    }

    @PluginMethod
    public void storageSet(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (key == null || value == null) {
            call.reject("key and value are required.");
            return;
        }
        appData().edit().putString(key, value).apply();
        call.resolve();
    }

    @PluginMethod
    public void storageRemove(PluginCall call) {
        String key = call.getString("key");
        if (key == null) {
            call.reject("key is required.");
            return;
        }
        appData().edit().remove(key).apply();
        call.resolve();
    }

    @PluginMethod
    public void getAppInfo(PluginCall call) {
        JSObject result = new JSObject();
        Context context = getContext();
        result.put("packageName", context.getPackageName());
        result.put("androidVersion", Build.VERSION.RELEASE);
        result.put("androidSdk", Build.VERSION.SDK_INT);
        result.put("deviceModel", (Build.MANUFACTURER == null ? "" : Build.MANUFACTURER) + " " + (Build.MODEL == null ? "" : Build.MODEL));
        try {
            PackageManager manager = context.getPackageManager();
            PackageInfo info = manager.getPackageInfo(context.getPackageName(), 0);
            result.put("versionName", info.versionName == null ? "" : info.versionName);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                result.put("versionCode", info.getLongVersionCode());
            } else {
                result.put("versionCode", info.versionCode);
            }
        } catch (Exception ignored) {
            result.put("versionName", "");
            result.put("versionCode", 0);
        }
        try {
            ApplicationInfo appInfo = context.getApplicationInfo();
            result.put("debug", (appInfo.flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0);
        } catch (Exception ignored) {
            result.put("debug", false);
        }
        String webViewVersion = "";
        try {
            PackageInfo webViewInfo = WebViewCompat.getCurrentWebViewPackage(context);
            if (webViewInfo != null && webViewInfo.versionName != null) {
                webViewVersion = webViewInfo.versionName;
            }
        } catch (Exception ignored) {
        }
        result.put("webViewVersion", webViewVersion);
        call.resolve(result);
    }

    private JSONArray readDownloadRecords() {
        try {
            String raw = appData().getString("downloads", "[]");
            return new JSONArray(raw == null ? "[]" : raw);
        } catch (Exception error) {
            return new JSONArray();
        }
    }

    private void writeDownloadRecords(JSONArray records) {
        while (records.length() > 100) {
            records.remove(0);
        }
        appData().edit().putString("downloads", records.toString()).apply();
    }

    private void enqueueDownload(String url, String userAgent, String contentDisposition, String mimeType) {
        try {
            DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            if (manager == null) {
                toast("Downloads are not available on this device.");
                return;
            }
            String filename = android.webkit.URLUtil.guessFileName(url, contentDisposition, mimeType);
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setMimeType(mimeType);
            if (userAgent != null && !userAgent.isEmpty()) {
                request.addRequestHeader("User-Agent", userAgent);
            }
            String cookie = CookieManager.getInstance().getCookie(url);
            if (cookie != null && !cookie.isEmpty()) {
                request.addRequestHeader("Cookie", cookie);
            }
            request.setTitle(filename);
            request.setDescription("4Keeper download");
            request.setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, filename);
            request.setNotificationVisibility(
                downloadNotifications
                    ? DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                    : DownloadManager.Request.VISIBILITY_HIDDEN
            );
            long id = manager.enqueue(request);

            JSONArray records = readDownloadRecords();
            JSONObject record = new JSONObject();
            record.put("id", id);
            record.put("filename", filename);
            record.put("url", url);
            record.put("mime", mimeType == null ? "" : mimeType);
            record.put("timestamp", System.currentTimeMillis());
            records.put(record);
            writeDownloadRecords(records);

            JSObject data = new JSObject();
            data.put("id", id);
            data.put("filename", filename);
            data.put("url", url);
            notifyListeners("downloadStarted", data);
        } catch (Exception error) {
            toast("Could not start download.");
        }
    }

    private void toast(String message) {
        getActivity().runOnUiThread(() -> Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show());
    }

    private static String downloadStatus(int status) {
        switch (status) {
            case DownloadManager.STATUS_PENDING:
                return "pending";
            case DownloadManager.STATUS_RUNNING:
                return "running";
            case DownloadManager.STATUS_PAUSED:
                return "paused";
            case DownloadManager.STATUS_SUCCESSFUL:
                return "successful";
            case DownloadManager.STATUS_FAILED:
                return "failed";
            default:
                return "unknown";
        }
    }

    @PluginMethod
    public void getDownloads(PluginCall call) {
        JSArray items = new JSArray();
        DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        JSONArray records = readDownloadRecords();
        for (int i = records.length() - 1; i >= 0; i--) {
            try {
                JSONObject record = records.getJSONObject(i);
                long id = record.optLong("id", -1);
                if (id < 0) continue;
                JSObject item = new JSObject();
                item.put("id", id);
                item.put("filename", record.optString("filename", "Download"));
                item.put("url", record.optString("url", ""));
                item.put("mime", record.optString("mime", ""));
                item.put("timestamp", record.optLong("timestamp", 0));
                item.put("status", "unknown");
                item.put("bytes", 0);
                item.put("totalBytes", 0);

                if (manager != null) {
                    Cursor cursor = null;
                    try {
                        cursor = manager.query(new DownloadManager.Query().setFilterById(id));
                        if (cursor != null && cursor.moveToFirst()) {
                            int statusIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                            int bytesIndex = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR);
                            int totalIndex = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES);
                            if (statusIndex >= 0) item.put("status", downloadStatus(cursor.getInt(statusIndex)));
                            if (bytesIndex >= 0) item.put("bytes", cursor.getLong(bytesIndex));
                            if (totalIndex >= 0) item.put("totalBytes", cursor.getLong(totalIndex));
                        }
                    } catch (Exception ignored) {
                    } finally {
                        if (cursor != null) cursor.close();
                    }
                }
                items.put(item);
            } catch (Exception ignored) {
            }
        }
        JSObject result = new JSObject();
        result.put("items", items);
        call.resolve(result);
    }

    @PluginMethod
    public void openDownload(PluginCall call) {
        Long id = call.getLong("id");
        if (id == null) {
            call.reject("A download id is required.");
            return;
        }
        try {
            DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            if (manager == null) {
                call.reject("Downloads are not available.");
                return;
            }
            Cursor cursor = manager.query(new DownloadManager.Query().setFilterById(id));
            if (cursor == null) {
                call.reject("Unknown download.");
                return;
            }
            try {
                if (!cursor.moveToFirst()) {
                    call.reject("Unknown download.");
                    return;
                }
                int statusIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                int uriIndex = cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI);
                int mimeIndex = cursor.getColumnIndex(DownloadManager.COLUMN_MEDIA_TYPE);
                int status = statusIndex >= 0 ? cursor.getInt(statusIndex) : -1;
                if (status != DownloadManager.STATUS_SUCCESSFUL) {
                    call.reject("This download is not finished yet.");
                    return;
                }
                String localUri = uriIndex >= 0 ? cursor.getString(uriIndex) : null;
                String mime = mimeIndex >= 0 ? cursor.getString(mimeIndex) : null;
                if (localUri == null || localUri.isEmpty()) {
                    call.reject("The downloaded file could not be found.");
                    return;
                }
                Uri uri = Uri.parse(localUri);
                if ("file".equalsIgnoreCase(uri.getScheme())) {
                    File file = new File(uri.getPath());
                    uri = FileProvider.getUriForFile(
                        getContext(),
                        getContext().getPackageName() + ".fileprovider",
                        file
                    );
                }
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(uri, mime == null || mime.isEmpty() ? "*/*" : mime);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                getContext().startActivity(intent);
                call.resolve();
            } finally {
                cursor.close();
            }
        } catch (Exception error) {
            call.reject("Could not open the download: " + error.getMessage());
        }
    }

    @PluginMethod
    public void removeDownload(PluginCall call) {
        Long id = call.getLong("id");
        if (id == null) {
            call.reject("A download id is required.");
            return;
        }
        try {
            DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            if (manager != null) manager.remove(id);
        } catch (Exception ignored) {
        }
        JSONArray records = readDownloadRecords();
        JSONArray kept = new JSONArray();
        for (int i = 0; i < records.length(); i++) {
            JSONObject record = records.optJSONObject(i);
            if (record == null) continue;
            if (record.optLong("id", -1) != id) kept.put(record);
        }
        writeDownloadRecords(kept);
        call.resolve();
    }

    @Override
    protected void handleOnPause() {
        for (Tab tab : tabs.values()) tab.view.onPause();
        super.handleOnPause();
    }

    @Override
    protected void handleOnResume() {
        for (Tab tab : tabs.values()) tab.view.onResume();
        super.handleOnResume();
    }

    @Override
    protected void handleOnDestroy() {
        for (Integer id : new ArrayList<>(tabs.keySet())) {
            destroyTab(tabs.remove(id));
        }
        activeTabId = -1;
        super.handleOnDestroy();
    }
}
