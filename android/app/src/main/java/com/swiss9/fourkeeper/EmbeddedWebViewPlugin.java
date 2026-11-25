package com.swiss9.fourkeeper;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
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
import android.os.StatFs;
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.util.TypedValue;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
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

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.FileProvider;
import androidx.webkit.ScriptHandler;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;

@CapacitorPlugin(name = "EmbeddedWebView")
public class EmbeddedWebViewPlugin extends Plugin {

    private static final String PREFS_NAME = "4keeper_webview";
    private static final String APP_DATA_PREFS = "4keeper_appdata";
    private static final String DESKTOP_USER_AGENT =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

    private static final String TAP_STYLE_JS =
        "(function(){try{document.documentElement.style.touchAction='manipulation';}catch(e){}})();";

    /* Hides ad containers that survive network blocking (in-page slots, GPT
     * wrappers, sponsored boxes) without touching legitimate layout. */
    private static final String AD_HIDE_CSS_JS =
        "(function(){try{"
            + "if(document.getElementById('4k-adhide'))return;"
            + "var css='[id*=\"google_ads\"],[id*=\"div-gpt-ad\"],[id*=\"taboola\"],"
            + "[id*=\"outbrain\"],[class*=\"ad-banner\"],[class*=\"ad-container\"],"
            + "[class*=\"ad-slot\"],[class*=\"ad-wrapper\"],[class*=\"adsbygoogle\"],"
            + "[class*=\"sponsored-ad\"],[data-ad-slot],[data-ad-client],"
            + "iframe[src*=\"doubleclick.net\"],iframe[src*=\"googlesyndication.com\"],"
            + "iframe[src*=\"amazon-adsystem.com\"]"
            + "{display:none!important;height:0!important;min-height:0!important;margin:0!important;"
            + "padding:0!important;border:0!important;overflow:hidden!important;}';"
            + "var s=document.createElement('style');s.id='4k-adhide';s.textContent=css;"
            + "(document.head||document.documentElement).appendChild(s);"
            + "}catch(e){}})();";

    /* Anti-fingerprinting. Runs before page scripts when document-start
     * injection is available, so the getters are in place for the first read.
     * Every override is guarded, so re-injection on later navigations is
     * harmless. */
    private static final String PRIVACY_SCRIPT =
        "(function(){try{"
            + "if(window.__4kPrivacy)return;window.__4kPrivacy=1;"
            + "var define=function(obj,key,value){try{"
            + "Object.defineProperty(obj,key,{get:function(){return value;},configurable:true});"
            + "}catch(e){}};"
            + "var n=window.navigator;"
            + "if(n){"
            + "define(n,'hardwareConcurrency',2);"
            + "define(n,'deviceMemory',2);"
            + "define(n,'platform','Win32');"
            + "}"
            + "var proto=window.HTMLCanvasElement&&HTMLCanvasElement.prototype;"
            + "if(proto&&!proto.__4kNoise){"
            + "var raw=proto.toDataURL;"
            + "proto.toDataURL=function(){"
            + "var args=arguments;"
            + "try{"
            + "var ctx=this.getContext&&this.getContext('2d');"
            + "if(!ctx||!this.width||!this.height)return raw.apply(this,args);"
            + "var w=Math.min(this.width,32),h=Math.min(this.height,32);"
            + "var img=ctx.getImageData(0,0,w,h);"
            + "var backup=new Uint8ClampedArray(img.data);"
            + "for(var i=0;i<img.data.length;i+=4){"
            + "img.data[i]=(img.data[i]+(Math.random()*4|0))&255;"
            + "img.data[i+1]=(img.data[i+1]+(Math.random()*4|0))&255;"
            + "img.data[i+2]=(img.data[i+2]+(Math.random()*4|0))&255;}"
            + "ctx.putImageData(img,0,0);"
            + "try{return raw.apply(this,args);}"
            + "finally{try{var restore=ctx.createImageData(w,h);"
            + "restore.data.set(backup);ctx.putImageData(restore,0,0);}catch(e){}}"
            + "}catch(e){return raw.apply(this,args);}"
            + "};"
            + "proto.__4kNoise=1;}"
            + "}catch(e){}})();";

    private static final String MEDIA_SCAN_JS =
        "(function(){var out=[];var seen={};"
            + "function kind(u){if(!u)return '';if(/\\.m3u8?(\\?|#|$)/i.test(u))return 'hls';"
            + "if(/\\.mpd(\\?|#|$)/i.test(u))return 'dash';"
            + "if(/\\.(mp4|webm|m4v|mkv|mov)(\\?|#|$)/i.test(u))return 'video';"
            + "if(/\\.(mp3|m4a|aac|ogg)(\\?|#|$)/i.test(u))return 'audio';return '';}"
            + "function add(u,k){if(!u)return;try{u=new URL(u,location.href).href}catch(e){return}"
            + "if(!/^https?:/i.test(u))return;if(seen[u])return;seen[u]=1;out.push({url:u,kind:k});}"
            + "var n=document.querySelectorAll('video,audio,source');"
            + "for(var i=0;i<n.length;i++){var el=n[i];var s=el.currentSrc||el.src||el.getAttribute('src');"
            + "var k=kind(s||'');if(k)add(s,k);"
            + "var c=el.querySelectorAll?el.querySelectorAll('source'):[];"
            + "for(var j=0;j<c.length;j++){var cs=c[j].src||c[j].getAttribute('src');var ck=kind(cs||'');if(ck)add(cs,ck);}}"
            + "var a=document.querySelectorAll('a[href]');"
            + "for(var l=0;l<a.length&&out.length<8;l++){var h=a[l].href;var hk=kind(h||'');if(hk)add(h,hk);}"
            + "return out.slice(0,8);})()";

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
        "branch.io",
        "appsflyer.com",
        "adjust.com",
        "amplitude.com",
        "fullstory.com",
        "heapanalytics.com",
        "bugsnag.com",
        "newrelic.com",
        "nr-data.net",
        "clarity.ms",
        "yandex.ru/metrika",
        "mc.yandex.ru",
        "statcounter.com",
        "matomo.cloud",
        "plausible.io",
        "umami.is",
        "bat.bing.com",
        "snap.licdn.com",
        "px.ads.linkedin.com",
        "analytics.tiktok.com",
        "ads-twitter.com",
        "static.ads-twitter.com",
        "analytics.google.com"
    };

    /* Network-level ad blocklist, evaluated for every sub-resource the WebView
     * requests. Entries are domain suffixes: any subdomain of a listed domain
     * is blocked too. The list is walked from the full host upwards and stops at
     * the first match, so the cost per request stays constant no matter how many
     * entries the list carries. */
    private static final HashSet<String> AD_DOMAINS = new HashSet<>(Arrays.asList(
        "2o7.net",
        "33across.com",
        "3lift.com",
        "ad-delivery.net",
        "ad-score.com",
        "ad-stir.com",
        "adap.tv",
        "adblade.com",
        "adcash.com",
        "adcell.de",
        "adcolony.com",
        "addthis.com",
        "adentifi.com",
        "adforest.net",
        "adform.net",
        "adhigh.net",
        "adition.com",
        "adition.net",
        "admixer.net",
        "adnxs.com",
        "adotmob.com",
        "adroll.com",
        "ads-twitter.com",
        "adsafeprotected.com",
        "adscale.de",
        "adsniper.ru",
        "adsrvr.org",
        "adsterra.com",
        "adswizz.com",
        "adtelligent.com",
        "adtriba.io",
        "adtrue.com",
        "adunity.com",
        "adverline.com",
        "advertise.com",
        "advertising.com",
        "advertnative.com",
        "advertserve.com",
        "adyoulike.com",
        "aerserv.com",
        "agkn.com",
        "aidata.io",
        "aimatch.com",
        "algorix.co",
        "amazon-adsystem.com",
        "amobee.com",
        "apester.com",
        "appier.net",
        "applovin.com",
        "appnexus.com",
        "apptornado.com",
        "apsalar.com",
        "avazutracking.net",
        "bidr.io",
        "bidswitch.net",
        "bidtheatre.com",
        "bidvertiser.com",
        "blinkx.com",
        "bluekai.com",
        "bluelithium.com",
        "brand-display.com",
        "brealtime.com",
        "bridgewell.com",
        "brightroll.com",
        "buysellads.com",
        "buzzoola.com",
        "casalemedia.com",
        "cedexis.com",
        "chartbeat.com",
        "chartboost.com",
        "clarium.io",
        "clickagy.com",
        "clickcertain.com",
        "clicktale.net",
        "coadvertise.com",
        "comscore.com",
        "connatix.com",
        "contentabc.com",
        "contextweb.com",
        "convertro.com",
        "criteo.com",
        "criteo.net",
        "crwdcntrl.net",
        "ctnsnet.com",
        "cxense.com",
        "dable.io",
        "de17a.com",
        "deepintent.com",
        "demdex.net",
        "districtm.io",
        "dotomi.com",
        "doubleclick.net",
        "doubleverify.com",
        "emxdgt.com",
        "engagebdr.com",
        "eqads.com",
        "everesttech.net",
        "exelator.com",
        "exoclick.com",
        "eyeota.net",
        "eyereturn.com",
        "fastclick.net",
        "flashtalking.com",
        "freewheel.tv",
        "fwmrm.net",
        "fyber.com",
        "geniee.co.jp",
        "getclicky.com",
        "gmossp-sp.jp",
        "google-analytics.com",
        "googleadservices.com",
        "googlesyndication.com",
        "googletagmanager.com",
        "googletagservices.com",
        "gumgum.com",
        "heyzap.com",
        "hilltopads.net",
        "hotjar.com",
        "im-apps.net",
        "impact-ad.jp",
        "indexexchange.com",
        "inmobi.com",
        "innovid.com",
        "intentiq.com",
        "interclick.com",
        "ipredictive.com",
        "ironsrc.com",
        "jads.co",
        "jivox.com",
        "juicyads.com",
        "justpremium.com",
        "kargo.com",
        "kochava.com",
        "kontera.com",
        "krxd.net",
        "lemmatechnologies.com",
        "liftoff.io",
        "lijit.com",
        "liveintent.com",
        "loopme.me",
        "lotame.com",
        "madvertise.de",
        "mathtag.com",
        "media.net",
        "mediarithmics.com",
        "mediaplex.com",
        "mgid.com",
        "millennialmedia.com",
        "mixpanel.com",
        "mobfox.com",
        "moatads.com",
        "monetag.com",
        "mookie1.com",
        "mopub.com",
        "nativeads.com",
        "nativo.com",
        "netmng.com",
        "nexage.com",
        "nextmillennium.io",
        "nowads.net",
        "nr-data.net",
        "nrich.ai",
        "ntv.io",
        "ogury.com",
        "onetag.com",
        "openx.net",
        "outbrain.com",
        "perfectaudience.com",
        "permutive.com",
        "pixalate.net",
        "playwire.com",
        "plista.com",
        "popads.net",
        "popcash.net",
        "presage.io",
        "propellerads.com",
        "pubmatic.com",
        "pulsepoint.com",
        "quantcast.com",
        "quantserve.com",
        "remerge.io",
        "revcontent.com",
        "revjet.com",
        "richaudience.com",
        "rkdms.com",
        "rlcdn.com",
        "rubiconproject.com",
        "scorecardresearch.com",
        "seedtag.com",
        "semasio.net",
        "serving-sys.com",
        "sharethrough.com",
        "simpli.fi",
        "sizmek.com",
        "smaato.com",
        "smartadserver.com",
        "smartclip.net",
        "smartyads.com",
        "sonobi.com",
        "sovrn.com",
        "sparteo.com",
        "specificclick.net",
        "spotxchange.com",
        "springserve.com",
        "stackadapt.com",
        "startappservice.com",
        "statcounter.com",
        "supersonicads.com",
        "taboola.com",
        "tapad.com",
        "tapjoy.com",
        "teads.tv",
        "telaria.com",
        "tidaltv.com",
        "trafficjunky.com",
        "tribalfusion.com",
        "tremorhub.com",
        "tubemogul.com",
        "turn.com",
        "undertone.com",
        "unityads.unity3d.com",
        "unrulymedia.com",
        "vdopia.com",
        "vidazoo.com",
        "videologygroup.com",
        "vungle.com",
        "yieldlab.net",
        "yieldmanager.com",
        "yieldmo.com",
        "yumenetworks.com",
        "zedo.com",
        "zergnet.com",
        "zorosrv.com",
        "zqtk.net",
        "adcolony.com",
        "admob.com",
        "adwhirl.com",
        "inner-active.com",
        "jumptap.com",
        "kiip.me",
        "leadbolt.net",
        "mobclix.com",
        "tapreason.com",
        "vserv.com",
        "zimedia.co"
    ));

    /* URL-shape rules for ads that live on a first-party domain. They are
     * compiled into ONE pattern, so a request costs a single matcher pass
     * instead of a loop over dozens of regexes. Everything here runs on the
     * WebView's IO thread (never the UI thread) and touches no disk and no
     * SharedPreferences, so a page with hundreds of sub-resources cannot stall
     * the interface. */
    private static final String[] AD_URL_RULES = new String[] {
        "[/.@-]ads?[/._-]",
        "[/._-]ads?\\d*\\.(js|json|xml|html?|php|gif|png|jpe?g|css)",
        "^https?://[^/]*ads?\\.",
        "/adserver",
        "/adservice",
        "/advert",
        "/adframe",
        "/adsense",
        "/adslot",
        "/adunit",
        "/pagead/",
        "/popunder",
        "/pop-up",
        "/interstitial",
        "/banners?/",
        "[/._-]banners?([/._-]|$)",
        "/sponsors?/",
        "/sponsored/",
        "/prebid",
        "/bidder",
        "/vast",
        "/vpaid",
        "/companion",
        "/tracking/(pixel|collect|beacon|impression)",
        "/pixel\\.gif",
        "/beacon\\.gif",
        "/analytics\\.(js|json)",
        "doubleclick\\.net",
        "googlesyndication",
        "googleadservices",
        "google-analytics",
        "googletagmanager",
        "amazon-adsystem",
        "/gampad/",
        "/gpt/",
        "[/.]gpt\\.js"
    };

    private static final Pattern AD_URL_PATTERN = Pattern.compile(
        joinAlternation(AD_URL_RULES),
        Pattern.CASE_INSENSITIVE
    );

    private static String joinAlternation(String[] rules) {
        StringBuilder builder = new StringBuilder();
        for (String rule : rules) {
            if (builder.length() > 0) builder.append('|');
            builder.append("(?:").append(rule).append(')');
        }
        return builder.toString();
    }

    /* Extensions that should be downloaded instead of rendered by the page. */
    private static final String[] DOWNLOAD_EXTENSIONS = new String[] {
        "apk", "zip", "rar", "7z", "tar", "gz", "tgz", "xz", "bz2", "iso",
        "exe", "msi", "dmg", "deb", "rpm", "torrent", "pdf", "epub", "mobi",
        "mp3", "m4a", "flac", "wav", "ogg", "opus",
        "mp4", "m4v", "mkv", "avi", "mov", "wmv", "flv", "webm", "ts",
        "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods"
    };

    /* Long-press bridge for the custom in-app context menu. The script is
     * idempotent, only ever reports the tapped link/image to the native side,
     * and never touches the page itself: the menu is Capacitor UI, so no Android
     * system menu can leak through. */
    private static final String CONTEXT_MENU_JS =
        "(function(){try{"
            + "if(window.__fourKeeperContextMenu)return;window.__fourKeeperContextMenu=1;"
            + "document.addEventListener('contextmenu',function(e){"
            + "var node=e.target,img=null,vid=null,link=null;"
            + "while(node&&node!==document.body){"
            + "if(!img&&node.tagName==='IMG')img=node;"
            + "if(!vid&&node.tagName==='VIDEO')vid=node;"
            + "if(!link&&node.tagName==='A'&&node.href)link=node;"
            + "node=node.parentElement;}"
            + "if(!link&&!img&&!vid)return;"
            + "e.preventDefault();"
            + "var image=img?(img.currentSrc||img.src||''):'';"
            + "var video=vid?(vid.currentSrc||vid.src||''):'';"
            + "var text=((link&&link.textContent)||(img&&img.alt)||'').replace(/\\s+/g,' ').trim().slice(0,160);"
            + "try{window.FourKeeperHost.showContextMenu((link&&link.href)||'',image,video,text,"
            + "Math.round(e.clientX||0),Math.round(e.clientY||0));}catch(err){}"
            + "},true);"
            + "}catch(e){}})();";

    private static class Tab {
        final int id;
        final WebView view;
        String url = "";
        String title = "";
        ScriptHandler privacyHandler;

        Tab(int id, WebView view) {
            this.id = id;
            this.view = view;
        }
    }

    /* Swipe down at the top of a page to reload it, the way a downloader-first
     * browser is expected to behave. The listener only observes touches and
     * always lets the WebView handle them, so normal scrolling is untouched. */
    private class PullToRefreshListener implements View.OnTouchListener {
        private static final int THRESHOLD_DP = 72;

        private final WebView view;
        private float startX = 0f;
        private float startY = 0f;
        private float pullDistance = 0f;
        private boolean tracking = false;
        private boolean armed = false;

        PullToRefreshListener(WebView view) {
            this.view = view;
        }

        @Override
        public boolean onTouch(View target, MotionEvent event) {
            switch (event.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    startX = event.getX();
                    startY = event.getY();
                    pullDistance = 0f;
                    tracking = event.getPointerCount() == 1;
                    armed = tracking && !view.canScrollVertically(-1) && view.getScrollY() <= 0;
                    return false;
                case MotionEvent.ACTION_MOVE:
                    if (!tracking || !armed) return false;
                    if (event.getPointerCount() > 1) {
                        reset();
                        return false;
                    }
                    float dy = event.getY() - startY;
                    float dx = Math.abs(event.getX() - startX);
                    if (dy <= 0 || dx > dy * 1.5f) {
                        pullDistance = 0f;
                        return false;
                    }
                    pullDistance = Math.max(pullDistance, dy);
                    return false;
                case MotionEvent.ACTION_UP:
                    boolean reload = tracking && armed
                        && pullDistance > dp(THRESHOLD_DP)
                        && !view.canScrollVertically(-1);
                    reset();
                    if (reload) {
                        String url = view.getUrl();
                        if (url != null && !url.isEmpty() && !url.startsWith("about:")) {
                            view.reload();
                        }
                    }
                    return false;
                case MotionEvent.ACTION_CANCEL:
                    reset();
                    return false;
                default:
                    return false;
            }
        }

        private void reset() {
            tracking = false;
            armed = false;
            pullDistance = 0f;
        }
    }

    private final Map<Integer, Tab> tabs = new LinkedHashMap<>();
    private int activeTabId = -1;
    private int nextTabId = 1;

    private int boundsX = 0;
    private int boundsY = 0;
    private int boundsWidth = 0;
    private int boundsHeight = 0;
    private int boundsReserveBottom = 0;
    private boolean boundsApplied = false;
    private boolean browserVisible = true;

    private boolean webDarkMode = false;
    private boolean javaScriptEnabled = true;
    private boolean popupsEnabled = true;
    private boolean safeBrowsingEnabled = true;
    /* Read from the WebView's IO thread inside shouldInterceptRequest, so the
     * flags must be volatile or a settings change could stay invisible there. */
    private volatile boolean trackingProtectionEnabled = false;
    private volatile boolean adBlockEnabled = true;
    private boolean fingerprintBlockEnabled = true;
    private boolean desktopMode = false;
    private boolean pinchZoomEnabled = true;
    private boolean zoomControlsVisible = false;
    private boolean downloadNotifications = true;
    private boolean autoOpenPdf = false;
    private boolean autoOpenDownload = false;
    private boolean parallelDownloads = true;
    private int connectionsPerFile = 4;
    private boolean askDownloadLocation = false;
    private String downloadLocation = "";
    private int textZoom = 100;
    private String cookiesMode = "all";

    private boolean uiOverlayActive = false;
    private boolean snifferEnabled = true;
    private String readingHelperScript = null;

    private SharedPreferences prefs;
    private ExecutorService downloadExecutor;
    /* Size probes for the download prompt: a slow server must never delay a
     * page or hold one of the download workers, so they get their own thread. */
    private ExecutorService probeExecutor;
    private final Object serialDownloadLock = new Object();
    private final Object downloadRecordLock = new Object();
    /* Downloads currently served by the multi-threaded engine, so a cancel
     * from the downloads list can stop the worker threads. */
    private final Map<Long, MultiThreadDownloader> activeDownloaders = new ConcurrentHashMap<>();
    /* Downloads the user paused: their workers are stopped but the record and
     * the partial file stay, so the list can offer Resume. */
    private final Set<Long> pausedDownloads = ConcurrentHashMap.newKeySet();
    private ActivityResultLauncher<String> createDocumentLauncher;
    private PendingDownload pendingDownload;
    private BroadcastReceiver downloadReceiver;
    private static final int MAX_MEDIA_ITEMS = 8;
    private static final int MAX_REPORTED_MEDIA = 64;
    private final Map<Integer, LinkedHashMap<String, String>> tabMedia = new HashMap<>();
    /* URLs already reported for a tab. The media map is capped, so without this
     * an evicted URL would be reported again the next time the page requested
     * it; on a media-heavy page that cycled detections and JS repaints forever. */
    private final Map<Integer, LinkedHashSet<String>> reportedMedia = new HashMap<>();

    private static class PendingDownload {
        final String url;
        final String userAgent;
        final String filename;
        final String mime;
        final int tabId;

        PendingDownload(String url, String userAgent, String filename, String mime, int tabId) {
            this.url = url;
            this.userAgent = userAgent;
            this.filename = filename;
            this.mime = mime;
            this.tabId = tabId;
        }
    }

    @Override
    public void load() {
        prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        webDarkMode = prefs.getBoolean("webDarkMode", false);
        javaScriptEnabled = prefs.getBoolean("javaScriptEnabled", true);
        popupsEnabled = prefs.getBoolean("popupsEnabled", true);
        safeBrowsingEnabled = prefs.getBoolean("safeBrowsingEnabled", true);
        trackingProtectionEnabled = prefs.getBoolean("trackingProtectionEnabled", false);
        adBlockEnabled = prefs.getBoolean("adBlockEnabled", true);
        fingerprintBlockEnabled = prefs.getBoolean("fingerprintBlockEnabled", true);
        desktopMode = prefs.getBoolean("desktopMode", false);
        pinchZoomEnabled = prefs.getBoolean("pinchZoomEnabled", true);
        zoomControlsVisible = prefs.getBoolean("zoomControlsVisible", false);
        downloadNotifications = prefs.getBoolean("downloadNotifications", true);
        autoOpenPdf = prefs.getBoolean("autoOpenPdf", false);
        autoOpenDownload = prefs.getBoolean("autoOpenDownload", false);
        parallelDownloads = prefs.getBoolean("parallelDownloads", true);
        connectionsPerFile = MultiThreadDownloader.normalizeConnections(prefs.getInt("connectionsPerFile", 4));
        askDownloadLocation = prefs.getBoolean("askDownloadLocation", false);
        downloadLocation = prefs.getString("downloadLocation", "");
        textZoom = prefs.getInt("textZoom", 100);
        cookiesMode = prefs.getString("cookiesMode", "all");

        downloadExecutor = Executors.newFixedThreadPool(4);
        probeExecutor = Executors.newSingleThreadExecutor();
        registerDownloadWatcher();
        registerCreateDocumentLauncher();
        makeBridgeTransparent();
        markStaleDownloads();
    }

    private void makeBridgeTransparent() {
        try {
            WebView bridgeView = getBridge().getWebView();
            if (bridgeView != null) {
                bridgeView.setBackgroundColor(Color.TRANSPARENT);
            }
        } catch (Exception ignored) {
        }
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
            .putBoolean("adBlockEnabled", adBlockEnabled)
            .putBoolean("fingerprintBlockEnabled", fingerprintBlockEnabled)
            .putBoolean("desktopMode", desktopMode)
            .putBoolean("pinchZoomEnabled", pinchZoomEnabled)
            .putBoolean("zoomControlsVisible", zoomControlsVisible)
            .putBoolean("downloadNotifications", downloadNotifications)
            .putBoolean("autoOpenPdf", autoOpenPdf)
            .putBoolean("autoOpenDownload", autoOpenDownload)
            .putBoolean("parallelDownloads", parallelDownloads)
            .putInt("connectionsPerFile", connectionsPerFile)
            .putBoolean("askDownloadLocation", askDownloadLocation)
            .putString("downloadLocation", downloadLocation)
            .putInt("textZoom", textZoom)
            .putString("cookiesMode", cookiesMode)
            .apply();
    }

    private Tab getActiveTab() {
        return tabs.get(activeTabId);
    }

    private FrameLayout.LayoutParams boundsParams() {
        int width = Math.max(0, dp(boundsWidth));
        int height = Math.max(0, dp(boundsHeight));
        int left = Math.max(0, dp(boundsX));
        int top = Math.max(0, dp(boundsY));
        /* The page WebView must never reach into the strip reserved for the
         * Capacitor shell's bottom navigation. The shell already measures its
         * container above the nav; this clamp stops a stale measurement (for
         * example one taken while the toolbar was hidden) from covering the nav
         * and swallowing Home taps. */
        FrameLayout root = rootView();
        if (root != null) {
            int rootHeight = root.getHeight();
            int rootWidth = root.getWidth();
            int reserved = Math.max(0, dp(boundsReserveBottom));
            if (rootHeight > 0) {
                int available = rootHeight - top - reserved;
                if (available >= 0 && height > available) {
                    height = available;
                }
            }
            if (rootWidth > 0 && left + width > rootWidth) {
                width = Math.max(0, rootWidth - left);
            }
        }
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(width, height);
        params.leftMargin = left;
        params.topMargin = top;
        return params;
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void applySettingsTo(WebView view) {
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(javaScriptEnabled);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        /* Desktop mode must not squeeze the whole page into the viewport:
         * overview mode is what shrinks a wide desktop layout to a tiny,
         * unreadable scale. Keep the wide viewport but let the page render at
         * its natural width and scroll instead. */
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(!desktopMode);
        settings.setBuiltInZoomControls(pinchZoomEnabled);
        settings.setSupportZoom(pinchZoomEnabled);
        settings.setDisplayZoomControls(zoomControlsVisible);
        settings.setTextZoom(textZoom);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(popupsEnabled);
        /* Popups are intercepted in onCreateWindow and offered to the user
         * instead of opening on their own, so the callback must be enabled. */
        settings.setSupportMultipleWindows(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        if (desktopMode) {
            settings.setUserAgentString(DESKTOP_USER_AGENT);
        } else {
            settings.setUserAgentString(null);
        }
        view.setInitialScale(0);
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

    private View capacitorContainer() {
        View root = rootView();
        View current = null;
        try {
            current = getBridge().getWebView();
        } catch (Exception ignored) {
        }
        if (root == null || current == null) return null;
        while (current.getParent() instanceof View) {
            View parent = (View) current.getParent();
            if (parent == root) return current;
            current = parent;
        }
        return current;
    }

    private void bringOverlayToFront() {
        View container = capacitorContainer();
        if (container != null) container.bringToFront();
    }

    private void bringPageToFront() {
        Tab tab = getActiveTab();
        if (tab != null) {
            tab.view.bringToFront();
        } else {
            bringOverlayToFront();
        }
    }

    private void activateTab(Tab tab) {
        if (tab == null) return;
        activeTabId = tab.id;
        applyActiveVisibility();
        if (!uiOverlayActive) {
            tab.view.bringToFront();
        } else {
            bringOverlayToFront();
        }
    }

    /**
     * Page-side bridge for the context menu. Only annotated methods are exposed
     * to page JavaScript and each one just forwards tap metadata to the app UI;
     * nothing here reads files, settings or download records.
     */
    private class PageBridge {
        private final int tabId;

        PageBridge(int tabId) {
            this.tabId = tabId;
        }

        @JavascriptInterface
        public void showContextMenu(String link, String image, String video, String text, int x, int y) {
            final String linkUrl = link == null ? "" : link;
            final String imageUrl = image == null ? "" : image;
            final String videoUrl = video == null ? "" : video;
            final String label = text == null ? "" : text;
            final int tapX = x;
            final int tapY = y;
            Activity activity = getActivity();
            if (activity == null) return;
            activity.runOnUiThread(() -> {
                JSObject data = new JSObject();
                data.put("tabId", tabId);
                data.put("linkUrl", linkUrl);
                data.put("imageUrl", imageUrl);
                data.put("videoUrl", videoUrl);
                data.put("text", label);
                data.put("x", tapX);
                data.put("y", tapY);
                notifyListeners("contextMenuRequest", data);
            });
        }
    }

    private Tab createTabInternal(String url) {
        int id = nextTabId++;
        WebView view = new WebView(getContext());
        view.setBackgroundColor(Color.parseColor("#09090b"));
        view.setFocusable(true);
        view.setFocusableInTouchMode(true);
        view.setOverScrollMode(View.OVER_SCROLL_NEVER);
        applySettingsTo(view);
        view.setWebViewClient(new TabClient(id));
        view.setWebChromeClient(new TabChromeClient(id));
        view.addJavascriptInterface(new PageBridge(id), "FourKeeperHost");
        view.setDownloadListener((downloadUrl, userAgent, contentDisposition, mimeType, contentLength) ->
            promptDownload(downloadUrl, userAgent, contentDisposition, mimeType, contentLength, id)
        );
        view.setOnTouchListener(new PullToRefreshListener(view));
        view.setVisibility(View.INVISIBLE);

        Tab tab = new Tab(id, view);
        tabs.put(id, tab);
        syncPrivacyScript(tab);

        FrameLayout root = rootView();
        if (root != null) {
            root.addView(view, boundsParams());
        }
        if (uiOverlayActive) {
            bringOverlayToFront();
        }

        if (url != null && !url.trim().isEmpty()) {
            tab.url = url;
            view.loadUrl(url);
        }
        return tab;
    }

    private void destroyTab(Tab tab) {
        if (tab == null) return;
        forgetTabMedia(tab.id);
        try {
            tab.view.stopLoading();
        } catch (Exception ignored) {
        }
        try {
            ViewGroup parent = (ViewGroup) tab.view.getParent();
            if (parent != null) {
                parent.removeView(tab.view);
            }
        } catch (Exception ignored) {
        }
        try {
            tab.view.setOnTouchListener(null);
            tab.view.setWebChromeClient(null);
            /* Detach the clients so no late callback can reach a destroyed view. */
            tab.view.setWebViewClient(new WebViewClient());
            if (tab.privacyHandler != null) {
                tab.privacyHandler.remove();
                tab.privacyHandler = null;
            }
        } catch (Exception ignored) {
        }
        try {
            tab.view.destroy();
        } catch (Exception ignored) {
            /* A WebView whose renderer already died can throw here; the tab is
             * removed from the map either way, so the reference is dropped. */
        }
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

    /* Walks the host's parent domains (ads.example.com -> example.com -> com)
     * and stops at the first HashSet hit, so no list is scanned per request. */
    private static boolean isAdHost(String host) {
        if (host == null) return false;
        String lower = host.toLowerCase(Locale.US);
        int start = 0;
        while (start < lower.length()) {
            if (AD_DOMAINS.contains(lower.substring(start))) return true;
            int dot = lower.indexOf('.', start);
            if (dot < 0) break;
            start = dot + 1;
        }
        return false;
    }

    /**
     * Full ad test for one request: the host list first (cheap, exact) and then
     * the combined URL pattern for first-party ad paths such as /ads/,
     * /pagead/ or ad-banner.js. Runs on the WebView IO thread, allocates
     * nothing per rule and never waits on a lock, so it cannot block the UI.
     */
    private static boolean isBlockedRequest(String host, String url) {
        if (isAdHost(host)) return true;
        if (url == null || url.isEmpty()) return false;
        try {
            return AD_URL_PATTERN.matcher(url).find();
        } catch (Exception error) {
            return false;
        }
    }

    /** True when tapping the URL should open the download sheet, not the page. */
    private static boolean isDownloadUrl(String url) {
        if (url == null || url.isEmpty()) return false;
        String lower = url.toLowerCase(Locale.US);
        if (!lower.startsWith("http://") && !lower.startsWith("https://")) return false;
        int cut = lower.indexOf('#');
        if (cut >= 0) lower = lower.substring(0, cut);
        cut = lower.indexOf('?');
        if (cut >= 0) lower = lower.substring(0, cut);
        if (lower.endsWith("/")) return false;
        for (String extension : DOWNLOAD_EXTENSIONS) {
            if (lower.endsWith("." + extension)) return true;
        }
        return false;
    }

    private static WebResourceResponse blockedResponse() {
        return new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
    }

    private void injectPrivacyScript(WebView view) {
        if (view == null || !fingerprintBlockEnabled || !javaScriptEnabled) return;
        try {
            view.evaluateJavascript(PRIVACY_SCRIPT, null);
        } catch (Exception ignored) {
        }
    }

    /* Document-start injection is the only point where the overrides exist
     * before page scripts read them. onPageStarted keeps the evaluateJavascript
     * fallback for WebViews without that feature. */
    private void syncPrivacyScript(Tab tab) {
        if (tab == null) return;
        try {
            if (tab.privacyHandler != null) {
                tab.privacyHandler.remove();
                tab.privacyHandler = null;
            }
        } catch (Exception ignored) {
        }
        if (!fingerprintBlockEnabled || !javaScriptEnabled) return;
        try {
            if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
                tab.privacyHandler = WebViewCompat.addDocumentStartJavaScript(
                    tab.view,
                    PRIVACY_SCRIPT,
                    Collections.singleton("*")
                );
            }
        } catch (Exception ignored) {
        }
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
                /* A main-frame link that points straight at a file is a download,
                 * not a page: ask the user first instead of navigating. */
                if (request.isForMainFrame() && isDownloadUrl(uri.toString())) {
                    promptDownload(
                        uri.toString(),
                        view.getSettings().getUserAgentString(),
                        null,
                        "",
                        0L,
                        tabId
                    );
                    return true;
                }
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
            clearTabMedia(tabId, "navigation");
            Tab tab = tabs.get(tabId);
            if (tab != null && url != null && !"about:blank".equals(url) && !url.startsWith("data:")) {
                tab.url = url;
            }
            injectPrivacyScript(view);
            JSObject data = new JSObject();
            data.put("tabId", tabId);
            data.put("activeTabId", activeTabId);
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
            view.evaluateJavascript(TAP_STYLE_JS, null);
            if (adBlockEnabled) {
                view.evaluateJavascript(AD_HIDE_CSS_JS, null);
            }
            if (javaScriptEnabled) {
                view.evaluateJavascript(CONTEXT_MENU_JS, null);
            }
            if (snifferEnabled) {
                view.evaluateJavascript(MEDIA_SCAN_JS, value -> handleScannedMedia(tabId, value));
            }
            JSObject data = tabState(tab);
            data.put("tabId", tabId);
            data.put("activeTabId", activeTabId);
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
            data.put("activeTabId", activeTabId);
            data.put("url", failedUrl);
            data.put("code", error.getErrorCode());
            data.put("message", message);
            notifyListeners("pageError", data);
            view.loadDataWithBaseURL(null, errorPage(message, failedUrl), "text/html", "utf-8", null);
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            /* Android calls this on a WebView IO thread, never the UI thread,
             * and everything below is CPU-only: no disk I/O, no
             * SharedPreferences and no locks. The flags are volatile, so a
             * settings change is picked up without stalling request handling. */
            final boolean ads = adBlockEnabled;
            final boolean trackers = trackingProtectionEnabled;
            final Uri uri = request.getUrl();
            final String host = uri == null ? null : uri.getHost();
            final String url = uri == null ? null : uri.toString();
            final boolean mainFrame = request.isForMainFrame();

            /* Pop-unders and full-page ad redirects: only the exact domain list
             * may stop a main-frame navigation. URL patterns are applied to
             * sub-resources only, because a normal page can carry /ads/ in its
             * own path. */
            if (ads && mainFrame && isAdHost(host)) {
                return blockedResponse();
            }
            if (!mainFrame) {
                if (ads && isBlockedRequest(host, url)) return blockedResponse();
                if (trackers && isTracker(host)) return blockedResponse();
                detectMediaRequest(tabId, request);
            }
            return null;
        }

        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            Activity activity = getActivity();
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    if (tabs.containsKey(tabId)) {
                        removeTabInternal(tabId, true);
                    }
                });
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

        /**
         * A page asked for a popup (target=_blank or window.open). The window is
         * never created: the shell asks the user first and opens a tab itself.
         */
        @Override
        public boolean onCreateWindow(
            WebView view,
            boolean isDialog,
            boolean isUserGesture,
            android.os.Message resultMsg
        ) {
            String url = "";
            WebView.HitTestResult hit = view.getHitTestResult();
            if (hit != null && hit.getExtra() != null) url = hit.getExtra();
            Uri target = Uri.parse(url);
            String scheme = target.getScheme();
            if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
                /* shortcut: window.open() with no tapped link has no URL until a
                 * WebView is created for it; that popup stays blocked for now. */
                return false;
            }
            JSObject data = new JSObject();
            data.put("url", url);
            data.put("tabId", tabId);
            notifyListeners("newTabRequested", data);
            /* Return false: the WebView must not create the window itself. */
            return false;
        }

        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            JSObject data = new JSObject();
            data.put("tabId", tabId);
            data.put("activeTabId", activeTabId);
            data.put("progress", newProgress);
            notifyListeners("loadProgress", data);
        }

        @Override
        public void onReceivedTitle(WebView view, String title) {
            Tab tab = tabs.get(tabId);
            if (tab != null && title != null) tab.title = title;
            JSObject data = new JSObject();
            data.put("tabId", tabId);
            data.put("activeTabId", activeTabId);
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

    private static String mediaKind(String url) {
        if (url == null || url.isEmpty()) return null;
        String lower = url.toLowerCase();
        int cut = lower.indexOf('#');
        if (cut >= 0) lower = lower.substring(0, cut);
        cut = lower.indexOf('?');
        if (cut >= 0) lower = lower.substring(0, cut);
        if (lower.endsWith(".m3u8") || lower.endsWith(".m3u")) return "hls";
        if (lower.endsWith(".mpd")) return "dash";
        if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".m4v")
            || lower.endsWith(".mkv") || lower.endsWith(".mov")) return "video";
        if (lower.endsWith(".mp3") || lower.endsWith(".m4a") || lower.endsWith(".aac")
            || lower.endsWith(".ogg")) return "audio";
        return null;
    }

    private void detectMediaRequest(int tabId, WebResourceRequest request) {
        try {
            if (!snifferEnabled) return;
            if (request == null || request.getUrl() == null || request.isForMainFrame()) return;
            final String url = request.getUrl().toString();
            final String kind = mediaKind(url);
            if (kind == null) return;
            /* Called on a WebView IO thread for every sub-resource. Skip URLs we
             * already know about before hopping to the UI thread, otherwise a
             * media-heavy page queues thousands of redundant runnables. */
            synchronized (tabMedia) {
                LinkedHashSet<String> seen = reportedMedia.get(tabId);
                if (seen != null && seen.contains(url)) return;
            }
            final int mediaTabId = tabId;
            Activity activity = getActivity();
            if (activity == null) return;
            activity.runOnUiThread(() -> recordTabMedia(mediaTabId, url, kind, "network"));
        } catch (Exception ignored) {
        }
    }

    private void recordTabMedia(int tabId, String url, String kind, String source) {
        if (tabId < 0 || url == null || url.isEmpty()) return;
        /* A JS scan already in flight can land after the sniffer was switched off
         * for the dashboard; drop it instead of reviving the list. */
        if (!snifferEnabled) return;
        Uri uri = Uri.parse(url);
        String scheme = uri.getScheme();
        if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) return;
        String resolved = kind == null || kind.isEmpty() ? mediaKind(url) : kind;
        if (resolved == null) return;
        boolean added = false;
        synchronized (tabMedia) {
            LinkedHashSet<String> seen = reportedMedia.get(tabId);
            if (seen == null) {
                seen = new LinkedHashSet<>();
                reportedMedia.put(tabId, seen);
            }
            /* Report each URL at most once per navigation, even after it has been
             * evicted from the capped list. */
            if (seen.contains(url) || seen.size() >= MAX_REPORTED_MEDIA) return;
            seen.add(url);
            LinkedHashMap<String, String> items = tabMedia.get(tabId);
            if (items == null) {
                items = new LinkedHashMap<>();
                tabMedia.put(tabId, items);
            }
            if (!items.containsKey(url)) {
                items.put(url, resolved);
                while (items.size() > MAX_MEDIA_ITEMS) {
                    String oldest = items.keySet().iterator().next();
                    items.remove(oldest);
                }
                added = true;
            }
        }
        if (!added) return;
        JSObject data = new JSObject();
        data.put("tabId", tabId);
        data.put("activeTabId", activeTabId);
        data.put("url", url);
        data.put("kind", resolved);
        data.put("source", source == null ? "" : source);
        data.put("title", mediaTitleForTab(tabId));
        notifyListeners("mediaDetected", data);
    }

    private void handleScannedMedia(int tabId, String value) {
        if (value == null || value.isEmpty() || "null".equals(value)) return;
        try {
            JSONArray found = new JSONArray(value);
            for (int i = 0; i < found.length(); i++) {
                JSONObject item = found.optJSONObject(i);
                if (item == null) continue;
                recordTabMedia(tabId, item.optString("url", ""), item.optString("kind", ""), "page");
            }
        } catch (Exception ignored) {
        }
    }

    private void clearTabMedia(int tabId, String reason) {
        boolean had;
        synchronized (tabMedia) {
            had = tabMedia.remove(tabId) != null;
            reportedMedia.remove(tabId);
        }
        if (!had) return;
        JSObject data = new JSObject();
        data.put("tabId", tabId);
        data.put("activeTabId", activeTabId);
        data.put("reason", reason == null ? "" : reason);
        notifyListeners("mediaCleared", data);
    }

    private void forgetTabMedia(int tabId) {
        synchronized (tabMedia) {
            tabMedia.remove(tabId);
            reportedMedia.remove(tabId);
        }
    }

    private String mediaTitleForTab(int tabId) {
        Tab tab = tabs.get(tabId);
        return tab == null || tab.title == null ? "" : tab.title;
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
        int reserveBottom = call.getInt("reserveBottom", 0);

        getActivity().runOnUiThread(() -> {
            boolean unchanged = boundsApplied
                && boundsX == x
                && boundsY == y
                && boundsWidth == width
                && boundsHeight == height
                && boundsReserveBottom == reserveBottom;
            boundsX = x;
            boundsY = y;
            boundsWidth = width;
            boundsHeight = height;
            boundsReserveBottom = reserveBottom;
            if (unchanged) {
                call.resolve();
                return;
            }
            boundsApplied = true;
            for (Tab tab : tabs.values()) {
                tab.view.setLayoutParams(boundsParams());
            }
            /* Resolve only after the layout params are applied, so the shell can
             * await mount() and know the page view no longer overlaps the nav. */
            call.resolve();
        });
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
    public void getTabMedia(PluginCall call) {
        JSArray items = new JSArray();
        synchronized (tabMedia) {
            for (Map.Entry<Integer, LinkedHashMap<String, String>> entry : tabMedia.entrySet()) {
                for (Map.Entry<String, String> media : entry.getValue().entrySet()) {
                    JSObject item = new JSObject();
                    item.put("tabId", entry.getKey());
                    item.put("url", media.getKey());
                    item.put("kind", media.getValue());
                    item.put("title", mediaTitleForTab(entry.getKey()));
                    items.put(item);
                }
            }
        }
        JSObject result = new JSObject();
        result.put("items", items);
        result.put("activeTabId", activeTabId);
        call.resolve(result);
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
            boolean moved = tab != null && tab.view.canGoBack();
            if (moved) tab.view.goBack();
            JSObject result = new JSObject();
            result.put("moved", moved);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void goForward(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            Tab tab = getActiveTab();
            boolean moved = tab != null && tab.view.canGoForward();
            if (moved) tab.view.goForward();
            JSObject result = new JSObject();
            result.put("moved", moved);
            call.resolve(result);
        });
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

    /**
     * Queue a direct download for a media URL that the sniffer surfaced on the
     * dashboard. Uses the same pipeline as a WebView DownloadListener so the
     * file lands in the configured download folder and shows up in the list.
     */
    @PluginMethod
    public void downloadMedia(PluginCall call) {
        String url = call.getString("url", "");
        if (url == null || url.trim().isEmpty()) {
            call.reject("A media URL is required.");
            return;
        }
        String mime = call.getString("mime", "");
        String kind = call.getString("kind", "");
        if ((mime == null || mime.isEmpty()) && kind != null) {
            if (kind.equalsIgnoreCase("audio")) mime = "audio/*";
            else if (kind.equalsIgnoreCase("video")) mime = "video/*";
        }
        Integer tabId = call.getInt("tabId");
        int sourceTabId = (tabId != null && tabId >= 0) ? tabId : activeTabId;
        final String targetUrl = url.trim();
        final String targetMime = mime == null ? "" : mime;
        getActivity().runOnUiThread(() -> enqueueDownload(targetUrl, null, null, targetMime, sourceTabId));
        call.resolve();
    }

    /**
     * Starts a download the user confirmed in the download prompt. The filename
     * the prompt showed is passed through as a Content-Disposition header so
     * URLUtil keeps it instead of re-guessing a different name.
     */
    @PluginMethod
    public void startDownload(PluginCall call) {
        String url = call.getString("url", "");
        if (url == null || url.trim().isEmpty()) {
            call.reject("A download URL is required.");
            return;
        }
        String filename = call.getString("filename", "");
        String mime = call.getString("mime", "");
        String userAgent = call.getString("userAgent", "");
        Integer tabId = call.getInt("tabId");
        int sourceTabId = (tabId != null && tabId >= 0) ? tabId : activeTabId;
        String disposition = "attachment";
        if (filename != null && !filename.trim().isEmpty()) {
            disposition = "attachment; filename=\"" + safeFilename(filename) + "\"";
        }
        final String targetUrl = url.trim();
        final String targetDisposition = disposition;
        final String targetMime = mime == null ? "" : mime;
        final String targetAgent = userAgent == null ? "" : userAgent;
        getActivity().runOnUiThread(
            () -> enqueueDownload(targetUrl, targetAgent, targetDisposition, targetMime, sourceTabId)
        );
        call.resolve();
    }

    @PluginMethod
    public void setVisibility(PluginCall call) {
        boolean visible = call.getBoolean("visible", true);
        browserVisible = visible;
        getActivity().runOnUiThread(this::applyActiveVisibility);
        call.resolve();
    }

    /**
     * Enables/disables the media sniffer (detects video/audio on pages). When
     * disabled the sniffer no longer records media for any tab and no
     * {mediaDetected, mediaCleared} events are emitted. Turned off when the
     * user is on the dashboard to save battery.
     */
    @PluginMethod
    public void setSnifferEnabled(PluginCall call) {
        snifferEnabled = call.getBoolean("enabled", true);
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
    public void setUiOverlay(PluginCall call) {
        boolean overlay = call.getBoolean("active", false);
        getActivity().runOnUiThread(() -> {
            makeBridgeTransparent();
            uiOverlayActive = overlay;
            if (overlay) {
                bringOverlayToFront();
            } else {
                bringPageToFront();
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void setWindowBackground(PluginCall call) {
        String value = call.getString("color", "");
        int color;
        try {
            color = Color.parseColor(value);
        } catch (IllegalArgumentException error) {
            call.reject("Invalid color.");
            return;
        }
        getActivity().runOnUiThread(() -> {
            getActivity().getWindow().getDecorView().setBackgroundColor(color);
            call.resolve();
        });
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
        if (data.has("isAdBlockEnabled")) adBlockEnabled = data.optBoolean("isAdBlockEnabled", true);
        if (data.has("isFingerprintBlockEnabled")) fingerprintBlockEnabled = data.optBoolean("isFingerprintBlockEnabled", true);
        if (data.has("zoomControls")) zoomControlsVisible = data.optBoolean("zoomControls", false);
        if (data.has("pinchZoom")) pinchZoomEnabled = data.optBoolean("pinchZoom", true);
        if (data.has("downloadNotifications")) downloadNotifications = data.optBoolean("downloadNotifications", true);
        if (data.has("autoOpenPdf")) autoOpenPdf = data.optBoolean("autoOpenPdf", false);
        if (data.has("autoOpenDownload")) autoOpenDownload = data.optBoolean("autoOpenDownload", false);
        if (data.has("parallelDownloads")) parallelDownloads = data.optBoolean("parallelDownloads", true);
        if (data.has("connectionsPerFile")) connectionsPerFile = MultiThreadDownloader.normalizeConnections(data.optInt("connectionsPerFile", 4));
        if (data.has("askDownloadLocation")) askDownloadLocation = data.optBoolean("askDownloadLocation", false);
        if (data.has("downloadLocation")) downloadLocation = data.optString("downloadLocation", "");

        persistSettings();
        getActivity().runOnUiThread(() -> {
            for (Tab tab : tabs.values()) {
                applySettingsTo(tab.view);
                syncPrivacyScript(tab);
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
    public void setDesktopMode(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", true);
        desktopMode = enabled;
        persistSettings();
        getActivity().runOnUiThread(() -> {
            for (Tab tab : tabs.values()) {
                applySettingsTo(tab.view);
            }
        });
        call.resolve();
    }

    private String readingHelperScript() {
        if (readingHelperScript != null) return readingHelperScript;
        try (InputStream in = getContext().getAssets().open("4k-reading.js")) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
            readingHelperScript = out.toString("UTF-8");
        } catch (Exception error) {
            readingHelperScript = "";
        }
        return readingHelperScript;
    }

    @PluginMethod
    public void toggleReadingMode(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", true);
        getActivity().runOnUiThread(() -> {
            Tab tab = getActiveTab();
            if (tab == null) {
                JSObject result = new JSObject();
                result.put("applied", false);
                call.resolve(result);
                return;
            }
            String helper = readingHelperScript();
            if (helper.isEmpty()) {
                JSObject result = new JSObject();
                result.put("applied", false);
                call.resolve(result);
                return;
            }
            String js = "(function(){try{" + helper + "\nif(!window.__4kReader){return false;}return window.__4kReader."
                + (enabled ? "enable" : "disable") + "();}catch(e){return false;}})();";
            tab.view.evaluateJavascript(js, value -> {
                JSObject result = new JSObject();
                result.put("applied", "true".equals(value));
                call.resolve(result);
            });
        });
    }

    @PluginMethod
    public void getReadingMode(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            Tab tab = getActiveTab();
            if (tab == null) {
                JSObject result = new JSObject();
                result.put("enabled", false);
                call.resolve(result);
                return;
            }
            tab.view.evaluateJavascript(
                "(function(){try{return !!(window.__4kReader&&window.__4kReader.active());}catch(e){return false;}})();",
                value -> {
                    JSObject result = new JSObject();
                    result.put("enabled", "true".equals(value));
                    call.resolve(result);
                }
            );
        });
    }

    @PluginMethod
    public void fetchUrl(PluginCall call) {
        String url = call.getString("url");
        if (url == null || !(url.startsWith("http://") || url.startsWith("https://"))) {
            call.reject("A valid http(s) URL is required.");
            return;
        }
        getBridge().execute(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(url).openConnection();
                connection.setConnectTimeout(3000);
                connection.setReadTimeout(3000);
                connection.setInstanceFollowRedirects(true);
                connection.setRequestProperty("User-Agent", DESKTOP_USER_AGENT);
                connection.setRequestProperty("Accept", "application/json, text/javascript, */*");
                int code = connection.getResponseCode();
                if (code < 200 || code >= 300) {
                    call.reject("HTTP " + code);
                    return;
                }
                InputStream in = connection.getInputStream();
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] buffer = new byte[8192];
                int read;
                while ((read = in.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
                }
                in.close();
                String body = out.toString("UTF-8");
                JSObject result = new JSObject();
                result.put("body", body);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Request failed: " + error.getMessage());
            } finally {
                if (connection != null) connection.disconnect();
            }
        });
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
        synchronized (downloadRecordLock) {
            try {
                String raw = appData().getString("downloads", "[]");
                return new JSONArray(raw == null ? "[]" : raw);
            } catch (Exception error) {
                return new JSONArray();
            }
        }
    }

    private void writeDownloadRecords(JSONArray records) {
        synchronized (downloadRecordLock) {
            while (records.length() > 100) {
                records.remove(0);
            }
            appData().edit().putString("downloads", records.toString()).apply();
        }
    }

    private void addDownloadRecord(JSONObject record) {
        synchronized (downloadRecordLock) {
            JSONArray records = readDownloadRecords();
            records.put(record);
            writeDownloadRecords(records);
        }
    }

    private void markStaleDownloads() {
        synchronized (downloadRecordLock) {
            JSONArray records = readDownloadRecords();
            boolean changed = false;
            for (int i = 0; i < records.length(); i++) {
                JSONObject record = records.optJSONObject(i);
                if (record == null || !record.optBoolean("custom", false)) continue;
                String status = record.optString("status", "");
                if ("running".equals(status) || "pending".equals(status) || "paused".equals(status)) {
                    try {
                        record.put("status", "failed");
                        changed = true;
                    } catch (Exception ignored) {
                    }
                }
            }
            if (changed) writeDownloadRecords(records);
        }
    }

    private JSONObject findDownloadRecord(long id) {
        JSONArray records = readDownloadRecords();
        for (int i = records.length() - 1; i >= 0; i--) {
            JSONObject record = records.optJSONObject(i);
            if (record != null && record.optLong("id", -1) == id) return record;
        }
        return null;
    }

    /** True when the record's file or SAF document still exists. */
    private boolean uriExists(String value) {
        if (value == null || value.isEmpty()) return false;
        try {
            Uri uri = Uri.parse(value);
            if ("file".equalsIgnoreCase(uri.getScheme())) {
                String path = uri.getPath();
                return path != null && new File(path).exists();
            }
            Cursor cursor = getContext()
                .getContentResolver()
                .query(uri, new String[] { OpenableColumns.SIZE }, null, null, null);
            if (cursor == null) return false;
            try {
                return cursor.moveToFirst();
            } finally {
                cursor.close();
            }
        } catch (Exception error) {
            return false;
        }
    }

    private void updateCustomRecord(long id, String status, long bytes, long total) {
        synchronized (downloadRecordLock) {
            JSONArray records = readDownloadRecords();
            for (int i = 0; i < records.length(); i++) {
                JSONObject record = records.optJSONObject(i);
                if (record == null || record.optLong("id", -1) != id) continue;
                try {
                    record.put("status", status);
                    record.put("bytes", bytes);
                    record.put("totalBytes", total);
                } catch (Exception ignored) {
                }
            }
            writeDownloadRecords(records);
        }
    }

    private void registerCreateDocumentLauncher() {
        try {
            createDocumentLauncher = getActivity().registerForActivityResult(
                new ActivityResultContracts.CreateDocument("*/*"),
                uri -> {
                    PendingDownload pending = pendingDownload;
                    pendingDownload = null;
                    if (uri == null || pending == null) return;
                    try {
                        getContext().getContentResolver().takePersistableUriPermission(
                            uri,
                            Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                        );
                    } catch (Exception ignored) {
                    }
                    startCustomDownload(uri, pending.filename, pending.url, pending.userAgent, pending.mime, pending.tabId);
                }
            );
        } catch (Exception ignored) {
            createDocumentLauncher = null;
        }
    }

    private void registerDownloadWatcher() {
        downloadReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent == null) return;
                long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                if (id < 0) return;
                handleManagerDownloadComplete(id);
            }
        };
        try {
            IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
            if (Build.VERSION.SDK_INT >= 33) {
                getContext().registerReceiver(downloadReceiver, filter, Context.RECEIVER_EXPORTED);
            } else {
                getContext().registerReceiver(downloadReceiver, filter);
            }
        } catch (Exception ignored) {
        }
    }

    private void handleManagerDownloadComplete(long id) {
        JSONObject record = findDownloadRecord(id);
        if (record == null) return;
        String filename = record.optString("filename", "Download");
        String mime = record.optString("mime", "");
        boolean isPdf = isPdf(filename, mime);
        if (autoOpenDownload || (autoOpenPdf && isPdf)) {
            openManagerDownload(id);
        }
        if (downloadNotifications) toast("Downloaded " + filename);
        JSObject data = new JSObject();
        data.put("id", id);
        data.put("filename", filename);
        data.put("tabId", record.optInt("tabId", -1));
        notifyListeners("downloadFinished", data);
    }

    private static boolean isPdf(String filename, String mime) {
        String lowerName = filename == null ? "" : filename.toLowerCase();
        String lowerMime = mime == null ? "" : mime.toLowerCase();
        return lowerMime.contains("pdf") || lowerName.endsWith(".pdf");
    }

    private boolean startViewIntent(Uri uri, String mime) {
        try {
            if (uri == null) return false;
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
            return true;
        } catch (Exception error) {
            return false;
        }
    }

    private boolean openManagerDownload(long id) {
        DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        if (manager == null) return false;
        Cursor cursor = null;
        try {
            cursor = manager.query(new DownloadManager.Query().setFilterById(id));
            if (cursor == null || !cursor.moveToFirst()) return false;
            int statusIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
            int uriIndex = cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI);
            int mimeIndex = cursor.getColumnIndex(DownloadManager.COLUMN_MEDIA_TYPE);
            int status = statusIndex >= 0 ? cursor.getInt(statusIndex) : -1;
            if (status != DownloadManager.STATUS_SUCCESSFUL) return false;
            String localUri = uriIndex >= 0 ? cursor.getString(uriIndex) : null;
            if (localUri == null || localUri.isEmpty()) return false;
            String mime = mimeIndex >= 0 ? cursor.getString(mimeIndex) : null;
            return startViewIntent(Uri.parse(localUri), mime);
        } catch (Exception error) {
            return false;
        } finally {
            if (cursor != null) cursor.close();
        }
    }

    private void enqueueDownload(String url, String userAgent, String contentDisposition, String mimeType, int sourceTabId) {
        try {
            String filename = android.webkit.URLUtil.guessFileName(url, contentDisposition, mimeType);
            String mime = mimeType == null ? "" : mimeType;

            if (askDownloadLocation && createDocumentLauncher != null && pendingDownload == null) {
                pendingDownload = new PendingDownload(url, userAgent, filename, mime, sourceTabId);
                try {
                    createDocumentLauncher.launch(filename);
                    return;
                } catch (Exception ignored) {
                    pendingDownload = null;
                }
            }

            if (!downloadLocation.isEmpty()) {
                Uri target = createTreeDocument(Uri.parse(downloadLocation), filename, mime);
                if (target != null) {
                    startCustomDownload(target, filename, url, userAgent, mime, sourceTabId);
                    return;
                }
                toast("Could not save to the selected folder. Using app downloads.");
            }

            startNativeDownload(url, filename, mime, userAgent, sourceTabId);
        } catch (Exception error) {
            toast("Could not start the download.");
        }
    }

    /**
     * Asks the app before a link tap turns into a download. Called from the
     * WebView's UI thread for link taps and from the download listener; the size
     * probe always runs on {@link #probeExecutor}, never on the UI thread.
     */
    private void promptDownload(
        String url,
        String userAgent,
        String contentDisposition,
        String mime,
        long sizeHint,
        int sourceTabId
    ) {
        if (url == null || url.isEmpty()) return;
        String filename = safeFilename(
            android.webkit.URLUtil.guessFileName(url, contentDisposition, mime)
        );
        String resolvedMime = mime == null ? "" : mime;
        if (resolvedMime.isEmpty() || "application/octet-stream".equalsIgnoreCase(resolvedMime)) {
            resolvedMime = mimeForName(filename);
        }
        final String finalName = filename;
        final String finalMime = resolvedMime;
        final String agent = userAgent == null ? "" : userAgent;
        if (sizeHint > 0) {
            emitDownloadPrompt(url, finalName, finalMime, agent, sizeHint, sourceTabId);
            return;
        }
        ExecutorService executor = probeExecutor;
        if (executor == null) {
            emitDownloadPrompt(url, finalName, finalMime, agent, 0L, sourceTabId);
            return;
        }
        try {
            executor.execute(() ->
                emitDownloadPrompt(url, finalName, finalMime, agent, probeSize(url), sourceTabId)
            );
        } catch (Exception error) {
            /* The executor can be shutting down while a page is still live. */
            emitDownloadPrompt(url, finalName, finalMime, agent, 0L, sourceTabId);
        }
    }

    private void emitDownloadPrompt(
        String url,
        String filename,
        String mime,
        String userAgent,
        long size,
        int tabId
    ) {
        Activity activity = getActivity();
        if (activity == null) return;
        activity.runOnUiThread(() -> {
            JSObject data = new JSObject();
            data.put("url", url);
            data.put("filename", filename);
            data.put("mime", mime);
            data.put("userAgent", userAgent);
            data.put("size", size);
            data.put("tabId", tabId);
            notifyListeners("showDownloadPrompt", data);
        });
    }

    /** HEAD probe for the prompt's size line. Short timeouts: a slow server must
     * not delay the sheet, the size is simply shown as unknown. */
    private static long probeSize(String url) {
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setConnectTimeout(6000);
            connection.setReadTimeout(6000);
            connection.setRequestMethod("HEAD");
            connection.setInstanceFollowRedirects(true);
            connection.setRequestProperty("Accept", "*/*");
            int code = connection.getResponseCode();
            if (code >= 200 && code < 400) {
                String header = connection.getHeaderField("Content-Length");
                if (header != null) {
                    try {
                        long length = Long.parseLong(header.trim());
                        if (length > 0) return length;
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        } catch (Exception ignored) {
        } finally {
            if (connection != null) connection.disconnect();
        }
        return 0L;
    }

    /** Keeps a prompt filename harmless: no path separators, quotes or newlines. */
    private static String safeFilename(String name) {
        String value = name == null ? "" : name.trim();
        if (value.isEmpty()) return "download";
        value = value.replace('\\', '_').replace('/', '_').replace('"', '_').replace('=', '_');
        value = value.replace('\n', '_').replace('\r', '_');
        if (value.length() > 120) {
            int dot = value.lastIndexOf('.');
            String ext = dot > 0 && value.length() - dot <= 8 ? value.substring(dot) : "";
            value = value.substring(0, 120 - ext.length()) + ext;
        }
        return value;
    }

    private static String mimeForName(String name) {
        String lower = name == null ? "" : name.toLowerCase(Locale.US);
        int dot = lower.lastIndexOf('.');
        if (dot < 0) return "application/octet-stream";
        switch (lower.substring(dot + 1)) {
            case "apk": return "application/vnd.android.package-archive";
            case "zip": return "application/zip";
            case "rar": return "application/x-rar-compressed";
            case "7z": return "application/x-7z-compressed";
            case "pdf": return "application/pdf";
            case "epub": return "application/epub+zip";
            case "mp3": return "audio/mpeg";
            case "m4a": return "audio/mp4";
            case "mp4": return "video/mp4";
            case "mkv": return "video/x-matroska";
            case "webm": return "video/webm";
            case "jpg":
            case "jpeg": return "image/jpeg";
            case "png": return "image/png";
            case "gif": return "image/gif";
            case "webp": return "image/webp";
            default: return "application/octet-stream";
        }
    }

    /**
     * Routes a download through the native multi-threaded engine instead of
     * Android's DownloadManager, so the "Connections per file" setting (1, 4,
     * 8 or 16 ranged connections) is actually used.
     */
    private void startNativeDownload(String url, String filename, String mime, String userAgent, int sourceTabId) {
        File dir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (dir == null) dir = new File(getContext().getFilesDir(), "Download");
        if (!dir.exists() && !dir.mkdirs()) {
            toast("Could not create the download folder.");
            return;
        }
        File target = uniqueDownloadFile(dir, filename);
        String name = target.getName();
        String resolvedMime = mime == null ? "" : mime;
        long id = System.currentTimeMillis() * 1000L + (long) (Math.random() * 1000);
        final int threads = connectionsPerFile;

        try {
            JSONObject record = new JSONObject();
            record.put("id", id);
            record.put("filename", name);
            record.put("url", url);
            record.put("mime", resolvedMime);
            record.put("timestamp", System.currentTimeMillis());
            record.put("tabId", sourceTabId);
            record.put("custom", true);
            record.put("status", "pending");
            record.put("bytes", 0);
            record.put("totalBytes", 0);
            record.put("connections", threads);
            record.put("uri", Uri.fromFile(target).toString());
            addDownloadRecord(record);
        } catch (Exception error) {
            toast("Could not start the download.");
            return;
        }

        JSObject started = new JSObject();
        started.put("id", id);
        started.put("filename", name);
        started.put("url", url);
        started.put("tabId", sourceTabId);
        notifyListeners("downloadStarted", started);

        String cookie = CookieManager.getInstance().getCookie(url);
        MultiThreadDownloader downloader = new MultiThreadDownloader(
            url,
            target,
            threads,
            userAgent,
            cookie,
            (bytes, total) -> {
                String status = pausedDownloads.contains(id) ? "paused" : "running";
                updateCustomRecord(id, status, bytes, total);
                notifyDownloadProgress(id, bytes, total, status);
            }
        );
        activeDownloaders.put(id, downloader);

        Runnable job = () -> runNativeDownload(id, target, name, resolvedMime, url, sourceTabId, downloader);
        if (downloadExecutor == null) {
            runNativeDownload(id, target, name, resolvedMime, url, sourceTabId, downloader);
            return;
        }
        if (parallelDownloads) {
            downloadExecutor.execute(job);
        } else {
            downloadExecutor.execute(() -> {
                synchronized (serialDownloadLock) {
                    job.run();
                }
            });
        }
    }

    private void runNativeDownload(
        long id,
        File target,
        String filename,
        String mime,
        String url,
        int sourceTabId,
        MultiThreadDownloader downloader
    ) {
        long bytes = 0;
        long total = 0;
        try {
            updateCustomRecord(id, "running", 0, 0);
            downloader.download();
            bytes = downloader.getDownloadedBytes();
            total = downloader.getTotalBytes();
            if (total <= 0) total = bytes;
            updateCustomRecord(id, "successful", bytes, total);
            notifyDownloadProgress(id, bytes, total, "successful");
            if (downloadNotifications) toast("Downloaded " + filename);

            Uri fileUri = Uri.fromFile(target);
            boolean isPdf = isPdf(filename, mime);
            if (autoOpenDownload || (autoOpenPdf && isPdf)) {
                getActivity().runOnUiThread(() -> startViewIntent(fileUri, mime));
            }
            JSObject data = new JSObject();
            data.put("id", id);
            data.put("filename", filename);
            data.put("url", url);
            data.put("tabId", sourceTabId);
            getActivity().runOnUiThread(() -> notifyListeners("downloadFinished", data));
        } catch (Exception error) {
            bytes = downloader.getDownloadedBytes();
            total = downloader.getTotalBytes();
            if (total <= 0) total = 0;
            updateCustomRecord(id, "failed", bytes, total);
            notifyDownloadProgress(id, bytes, total, "failed");
            if (downloader.isCancelled()) {
                toast("Download cancelled: " + filename);
            } else {
                toast("Download failed: " + filename);
            }
        } finally {
            activeDownloaders.remove(id);
            pausedDownloads.remove(id);
        }
    }

    /** Picks a free file name so an existing download is never overwritten. */
    private static File uniqueDownloadFile(File dir, String filename) {
        String name = filename == null || filename.trim().isEmpty() ? "download" : filename.trim();
        name = name.replace('/', '_').replace('\\', '_');
        int dot = name.lastIndexOf('.');
        String base = dot > 0 ? name.substring(0, dot) : name;
        String ext = dot > 0 ? name.substring(dot) : "";
        File candidate = new File(dir, name);
        for (int index = 1; index < 500 && candidate.exists(); index++) {
            candidate = new File(dir, base + " (" + index + ")" + ext);
        }
        return candidate;
    }

    private Uri createTreeDocument(Uri treeUri, String filename, String mime) {
        if (treeUri == null) return null;
        try {
            String docId = DocumentsContract.getTreeDocumentId(treeUri);
            Uri parent = DocumentsContract.buildDocumentUriUsingTree(treeUri, docId);
            String name = filename == null || filename.isEmpty() ? "download" : filename;
            int dot = name.lastIndexOf('.');
            String base = dot > 0 ? name.substring(0, dot) : name;
            String ext = dot > 0 ? name.substring(dot) : "";
            String resolvedMime = mime == null || mime.isEmpty() ? "application/octet-stream" : mime;
            for (int attempt = 0; attempt < 20; attempt++) {
                String candidate = attempt == 0 ? name : base + " (" + attempt + ")" + ext;
                try {
                    Uri created = DocumentsContract.createDocument(
                        getContext().getContentResolver(), parent, resolvedMime, candidate
                    );
                    if (created != null) return created;
                } catch (Exception ignored) {
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private void startCustomDownload(Uri target, String filename, String url, String userAgent, String mime, int sourceTabId) {
        final long id = System.currentTimeMillis() + (long) (Math.random() * 1000);
        JSONObject record = new JSONObject();
        try {
            record.put("id", id);
            record.put("filename", filename);
            record.put("url", url);
            record.put("mime", mime == null ? "" : mime);
            record.put("timestamp", System.currentTimeMillis());
            record.put("status", "pending");
            record.put("bytes", 0);
            record.put("totalBytes", 0);
            record.put("custom", true);
            record.put("uri", target.toString());
            record.put("tabId", sourceTabId);
            addDownloadRecord(record);
        } catch (Exception ignored) {
        }

        JSObject data = new JSObject();
        data.put("id", id);
        data.put("filename", filename);
        data.put("url", url);
        data.put("tabId", sourceTabId);
        notifyListeners("downloadStarted", data);

        downloadExecutor.execute(() -> {
            if (parallelDownloads) {
                runCustomDownload(id, target, filename, url, userAgent, mime, sourceTabId);
            } else {
                synchronized (serialDownloadLock) {
                    runCustomDownload(id, target, filename, url, userAgent, mime, sourceTabId);
                }
            }
        });
    }

    private void runCustomDownload(long id, Uri target, String filename, String url, String userAgent, String mime, int sourceTabId) {
        HttpURLConnection connection = null;
        OutputStream output = null;
        InputStream input = null;
        long bytes = 0;
        long total = -1;
        try {
            updateCustomRecord(id, "running", 0, 0);
            connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(30000);
            connection.setInstanceFollowRedirects(true);
            if (userAgent != null && !userAgent.isEmpty()) {
                connection.setRequestProperty("User-Agent", userAgent);
            }
            String cookie = CookieManager.getInstance().getCookie(url);
            if (cookie != null && !cookie.isEmpty()) {
                connection.setRequestProperty("Cookie", cookie);
            }
            connection.connect();
            int code = connection.getResponseCode();
            if (code < 200 || code >= 300) throw new IOException("HTTP " + code);
            total = connection.getContentLength();
            output = getContext().getContentResolver().openOutputStream(target, "w");
            if (output == null) throw new IOException("Cannot open destination");
            input = connection.getInputStream();
            byte[] buffer = new byte[16384];
            int read;
            long lastUpdate = 0;
            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
                bytes += read;
                long now = System.currentTimeMillis();
                if (now - lastUpdate > 600) {
                    lastUpdate = now;
                    updateCustomRecord(id, "running", bytes, total);
                    notifyDownloadProgress(id, bytes, total, "running");
                }
            }
            output.flush();
            updateCustomRecord(id, "successful", bytes, total);
            notifyDownloadProgress(id, bytes, total, "successful");
            if (downloadNotifications) toast("Downloaded " + filename);
            boolean isPdf = isPdf(filename, mime);
            if (autoOpenDownload || (autoOpenPdf && isPdf)) {
                getActivity().runOnUiThread(() -> startViewIntent(target, mime));
            }
            JSObject data = new JSObject();
            data.put("id", id);
            data.put("filename", filename);
            data.put("tabId", sourceTabId);
            getActivity().runOnUiThread(() -> notifyListeners("downloadFinished", data));
        } catch (Exception error) {
            updateCustomRecord(id, "failed", bytes, total);
            notifyDownloadProgress(id, bytes, total, "failed");
            toast("Download failed: " + filename);
        } finally {
            try {
                if (input != null) input.close();
            } catch (Exception ignored) {
            }
            try {
                if (output != null) output.close();
            } catch (Exception ignored) {
            }
            if (connection != null) connection.disconnect();
        }
    }

    private void notifyDownloadProgress(long id, long bytes, long total, String status) {
        getActivity().runOnUiThread(() -> {
            JSObject data = new JSObject();
            data.put("id", id);
            data.put("bytes", bytes);
            data.put("totalBytes", total);
            data.put("status", status);
            notifyListeners("downloadProgress", data);
        });
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
    public void readClipboard(PluginCall call) {
        String text = "";
        try {
            ClipboardManager manager = (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
            if (manager != null && manager.hasPrimaryClip()) {
                ClipData clip = manager.getPrimaryClip();
                if (clip != null && clip.getItemCount() > 0) {
                    CharSequence value = clip.getItemAt(0).coerceToText(getContext());
                    if (value != null) text = value.toString();
                }
            }
        } catch (Exception ignored) {
        }
        JSObject result = new JSObject();
        result.put("text", text);
        call.resolve(result);
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
                item.put("tabId", record.optInt("tabId", -1));
                item.put("status", "unknown");
                item.put("bytes", 0);
                item.put("totalBytes", 0);
                item.put("custom", record.optBoolean("custom", false));

                if (record.optBoolean("custom", false)) {
                    String status = record.optString("status", "unknown");
                    item.put("status", status);
                    item.put("bytes", record.optLong("bytes", 0));
                    item.put("totalBytes", record.optLong("totalBytes", 0));
                    item.put("uri", record.optString("uri", ""));
                    /* A record that is still transferring owns its file: only a
                     * finished one can point at a file the user deleted. */
                    boolean active = "running".equals(status) || "pending".equals(status) || "paused".equals(status);
                    item.put("exists", active || uriExists(record.optString("uri", "")));
                } else if (manager != null) {
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
        try {
            File dataPath = Environment.getDataDirectory();
            StatFs stat = new StatFs(dataPath.getPath());
            long total = stat.getTotalBytes();
            long available = stat.getAvailableBytes();
            result.put("usedBytes", total - available);
            result.put("totalBytes", total);
        } catch (Exception ignored) {
            result.put("usedBytes", 0);
            result.put("totalBytes", 0);
        }
        call.resolve(result);
    }

    @PluginMethod
    public void chooseDownloadFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION
                | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
        );
        getActivity().runOnUiThread(() -> {
            try {
                startActivityForResult(call, intent, "folderPicked");
            } catch (Exception error) {
                call.reject("Could not open the folder picker");
            }
        });
    }

    @ActivityCallback
    private void folderPicked(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.reject("No folder selected");
            return;
        }
        Uri uri = result.getData().getData();
        try {
            getContext().getContentResolver().takePersistableUriPermission(
                uri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            );
        } catch (Exception ignored) {
        }
        downloadLocation = uri.toString();
        persistSettings();
        JSObject resultObject = new JSObject();
        resultObject.put("uri", downloadLocation);
        resultObject.put("label", folderLabel(uri));
        call.resolve(resultObject);
    }

    private static String folderLabel(Uri uri) {
        try {
            String docId = DocumentsContract.getTreeDocumentId(uri);
            int colon = docId.indexOf(':');
            if (colon >= 0) {
                String volume = docId.substring(0, colon);
                String relative = docId.substring(colon + 1);
                String root = "primary".equals(volume) ? "/storage/emulated/0" : "/storage/" + volume;
                return root + (relative.isEmpty() ? "" : "/" + relative);
            }
        } catch (Exception ignored) {
        }
        return uri.toString();
    }

    @PluginMethod
    public void openDownload(PluginCall call) {
        Long id = call.getLong("id");
        if (id == null) {
            call.reject("A download id is required.");
            return;
        }
        JSONObject record = findDownloadRecord(id);
        if (record != null && record.optBoolean("custom", false)) {
            String uriValue = record.optString("uri", "");
            String mime = record.optString("mime", "");
            if (uriValue.isEmpty()) {
                call.reject("The downloaded file could not be found.");
                return;
            }
            if (!startViewIntent(Uri.parse(uriValue), mime)) {
                call.reject("No app can open this file.");
                return;
            }
            call.resolve();
            return;
        }
        if (!openManagerDownload(id)) {
            call.reject("This download is not finished yet.");
            return;
        }
        call.resolve();
    }

    /** Stops the worker threads but keeps the partial file for later resume. */
    @PluginMethod
    public void pauseDownload(PluginCall call) {
        Long id = call.getLong("id");
        if (id == null) {
            call.reject("A download id is required.");
            return;
        }
        MultiThreadDownloader downloader = activeDownloaders.get(id);
        if (downloader == null) {
            call.reject("This download is not running.");
            return;
        }
        pausedDownloads.add(id);
        downloader.pause();
        long bytes = downloader.getDownloadedBytes();
        long total = downloader.getTotalBytes();
        updateCustomRecord(id, "paused", bytes, total);
        notifyDownloadProgress(id, bytes, total, "paused");
        call.resolve();
    }

    /** Restarts the paused workers from the byte offsets they stopped at. */
    @PluginMethod
    public void resumeDownload(PluginCall call) {
        Long id = call.getLong("id");
        if (id == null) {
            call.reject("A download id is required.");
            return;
        }
        MultiThreadDownloader downloader = activeDownloaders.get(id);
        if (downloader == null) {
            call.reject("This download can no longer be resumed.");
            return;
        }
        pausedDownloads.remove(id);
        downloader.resume();
        long bytes = downloader.getDownloadedBytes();
        long total = downloader.getTotalBytes();
        updateCustomRecord(id, "running", bytes, total);
        notifyDownloadProgress(id, bytes, total, "running");
        call.resolve();
    }

    @PluginMethod
    public void shareDownload(PluginCall call) {
        Long id = call.getLong("id");
        if (id == null) {
            call.reject("A download id is required.");
            return;
        }
        JSONObject record = findDownloadRecord(id);
        if (record == null) {
            call.reject("This download no longer exists.");
            return;
        }
        try {
            Uri uri = Uri.parse(record.optString("uri", ""));
            if ("file".equalsIgnoreCase(uri.getScheme())) {
                uri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    new File(uri.getPath())
                );
            }
            String mime = record.optString("mime", "");
            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType(mime == null || mime.isEmpty() ? "*/*" : mime);
            intent.putExtra(Intent.EXTRA_STREAM, uri);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(Intent.createChooser(intent, "Share file"));
            call.resolve();
        } catch (Exception error) {
            call.reject("No app can share this file.");
        }
    }

    /** Asks the system file browser for the download folder. */
    @PluginMethod
    public void openDownloadFolder(PluginCall call) {
        File dir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (dir == null) dir = new File(getContext().getFilesDir(), "Download");
        boolean opened = false;
        try {
            Uri uri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                dir
            );
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "resource/folder");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            opened = true;
        } catch (Exception error) {
            /* Android 11+ hides Android/data from file managers, so there may
             * be no app to show the folder; the path is returned instead. */
            opened = false;
        }
        JSObject result = new JSObject();
        result.put("opened", opened);
        result.put("path", dir.getAbsolutePath());
        call.resolve(result);
    }

    /** Starts the record's URL again as a fresh download. */
    @PluginMethod
    public void redownload(PluginCall call) {
        Long id = call.getLong("id");
        if (id == null) {
            call.reject("A download id is required.");
            return;
        }
        JSONObject record = findDownloadRecord(id);
        String url = record == null ? "" : record.optString("url", "");
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            call.reject("This download has no link to repeat.");
            return;
        }
        final String target = url;
        final String filename = record.optString("filename", "");
        final String mime = record.optString("mime", "");
        getActivity().runOnUiThread(() -> startNativeDownload(target, filename, mime, "", activeTabId));
        call.resolve();
    }

    @PluginMethod
    public void removeDownload(PluginCall call) {
        Long id = call.getLong("id");
        if (id == null) {
            call.reject("A download id is required.");
            return;
        }
        JSONObject record = findDownloadRecord(id);
        if (record != null && record.optBoolean("custom", false)) {
            MultiThreadDownloader active = activeDownloaders.remove(id);
            if (active != null) active.cancel();
            String uriValue = record.optString("uri", "");
            if (!uriValue.isEmpty()) {
                try {
                    Uri fileTarget = Uri.parse(uriValue);
                    if ("file".equalsIgnoreCase(fileTarget.getScheme())) {
                        String path = fileTarget.getPath();
                        if (path != null) {
                            File file = new File(path);
                            if (file.exists()) file.delete();
                        }
                    } else {
                        getContext().getContentResolver().delete(fileTarget, null, null);
                    }
                } catch (Exception ignored) {
                }
            }
        } else {
            try {
                DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
                if (manager != null) manager.remove(id);
            } catch (Exception ignored) {
            }
        }
        JSONArray records = readDownloadRecords();
        JSONArray kept = new JSONArray();
        for (int i = 0; i < records.length(); i++) {
            JSONObject entry = records.optJSONObject(i);
            if (entry == null) continue;
            if (entry.optLong("id", -1) != id) kept.put(entry);
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
        if (downloadReceiver != null) {
            try {
                getContext().unregisterReceiver(downloadReceiver);
            } catch (Exception ignored) {
            }
            downloadReceiver = null;
        }
        if (downloadExecutor != null) {
            downloadExecutor.shutdownNow();
            downloadExecutor = null;
        }
        if (probeExecutor != null) {
            probeExecutor.shutdownNow();
            probeExecutor = null;
        }
        for (MultiThreadDownloader downloader : activeDownloaders.values()) {
            downloader.cancel();
        }
        activeDownloaders.clear();
        for (Integer id : new ArrayList<>(tabs.keySet())) {
            destroyTab(tabs.remove(id));
        }
        activeTabId = -1;
        super.handleOnDestroy();
    }
}
