package com.swiss9.fourkeeper;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.net.Uri;
import android.util.TypedValue;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;

@CapacitorPlugin(name = "EmbeddedWebView")
public class EmbeddedWebViewPlugin extends Plugin {

    private WebView webView;
    private boolean webDarkMode = false;

    private void ensureWebView() {
        if (webView != null) return;

        webView = new WebView(getContext());
        webView.setBackgroundColor(Color.parseColor("#09090b"));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setAllowFileAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        ApplicationInfo appInfo = getContext().getApplicationInfo();
        WebView.setWebContentsDebuggingEnabled((appInfo.flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0);
        applyWebDarkMode();

        webView.setWebViewClient(new WebViewClient() {
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
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                JSObject data = new JSObject();
                data.put("url", url);
                notifyListeners("pageStarted", data);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                JSObject data = new JSObject();
                data.put("url", url);
                data.put("canGoBack", view.canGoBack());
                data.put("canGoForward", view.canGoForward());
                data.put("title", view.getTitle());
                notifyListeners("pageLoaded", data);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (!request.isForMainFrame()) return;
                String failedUrl = request.getUrl().toString();
                String message = String.valueOf(error.getDescription());
                JSObject data = new JSObject();
                data.put("url", failedUrl);
                data.put("code", error.getErrorCode());
                data.put("message", message);
                notifyListeners("pageError", data);
                view.loadDataWithBaseURL(null, errorPage(message, failedUrl), "text/html", "utf-8", null);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                JSObject data = new JSObject();
                data.put("progress", newProgress);
                notifyListeners("loadProgress", data);
            }

            @Override
            public void onReceivedTitle(WebView view, String title) {
                JSObject data = new JSObject();
                data.put("title", title);
                notifyListeners("titleChanged", data);
            }
        });

        webView.setVisibility(View.GONE);

        FrameLayout root = getActivity().findViewById(android.R.id.content);
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(0, 0);
        root.addView(webView, params);
    }

    private int dp(int value) {
        return (int) TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            value,
            getContext().getResources().getDisplayMetrics()
        );
    }

    private void applyWebDarkMode() {
        if (webView == null) return;
        try {
            if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
                WebSettingsCompat.setAlgorithmicDarkeningAllowed(webView.getSettings(), webDarkMode);
            }
        } catch (Exception ignored) {
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
            + "</style></head><body>"
            + "<h1>Can't open this page</h1>"
            + "<p>" + escapeHtml(message) + "</p>"
            + "<p>" + escapeHtml(url) + "</p>"
            + "</body></html>";
    }

    @PluginMethod
    public void mount(PluginCall call) {
        int x = call.getInt("x", 0);
        int y = call.getInt("y", 0);
        int width = call.getInt("width", 0);
        int height = call.getInt("height", 0);

        getActivity().runOnUiThread(() -> {
            ensureWebView();
            FrameLayout.LayoutParams params = (FrameLayout.LayoutParams) webView.getLayoutParams();
            params.leftMargin = dp(x);
            params.topMargin = dp(y);
            params.width = dp(width);
            params.height = dp(height);
            webView.setLayoutParams(params);
            webView.bringToFront();
        });

        call.resolve();
    }

    @PluginMethod
    public void loadUrl(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) {
            call.reject("A URL is required.");
            return;
        }

        getActivity().runOnUiThread(() -> {
            ensureWebView();
            webView.setVisibility(View.VISIBLE);
            webView.bringToFront();
            webView.loadUrl(url);
        });

        call.resolve();
    }

    @PluginMethod
    public void goBack(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (webView != null && webView.canGoBack()) webView.goBack();
        });
        call.resolve();
    }

    @PluginMethod
    public void goForward(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (webView != null && webView.canGoForward()) webView.goForward();
        });
        call.resolve();
    }

    @PluginMethod
    public void reload(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (webView != null) webView.reload();
        });
        call.resolve();
    }

    @PluginMethod
    public void setVisible(PluginCall call) {
        boolean visible = call.getBoolean("visible", true);
        getActivity().runOnUiThread(() -> {
            if (webView != null) {
                webView.setVisibility(visible ? View.VISIBLE : View.GONE);
                if (visible) webView.bringToFront();
            }
        });
        call.resolve();
    }

    @PluginMethod
    public void setWebDarkMode(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", false);
        webDarkMode = enabled;
        getActivity().runOnUiThread(this::applyWebDarkMode);
        call.resolve();
    }

    @PluginMethod
    public void getNavigationState(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            JSObject result = new JSObject();
            result.put("canGoBack", webView != null && webView.canGoBack());
            result.put("canGoForward", webView != null && webView.canGoForward());
            call.resolve(result);
        });
    }

    @Override
    protected void handleOnPause() {
        if (webView != null) webView.onPause();
        super.handleOnPause();
    }

    @Override
    protected void handleOnResume() {
        if (webView != null) webView.onResume();
        super.handleOnResume();
    }

    @Override
    protected void handleOnDestroy() {
        if (webView != null) {
            FrameLayout root = getActivity().findViewById(android.R.id.content);
            if (root != null) root.removeView(webView);
            webView.destroy();
            webView = null;
        }
        super.handleOnDestroy();
    }
}
