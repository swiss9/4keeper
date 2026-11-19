(function () {
  var OVERLAY_ID = '4k-reader-overlay';
  var STYLE_ID = '4k-reader-style';

  function t(node) {
    if (!node) return '';
    var value = node.innerText || node.textContent || '';
    return String(value).replace(/\s+/g, ' ').trim();
  }

  function visible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    try {
      var style = window.getComputedStyle(el);
      if (!style || style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      var rect = el.getBoundingClientRect();
      return rect.width > 0 || rect.height > 0;
    } catch (error) {
      return false;
    }
  }

  function scoreCandidate(el) {
    if (!el || !visible(el)) return 0;
    var paragraphs = el.querySelectorAll('p');
    var textLength = 0;
    var i;
    for (i = 0; i < paragraphs.length; i++) textLength += t(paragraphs[i]).length;
    if (textLength < 200) return 0;
    var linkLength = 0;
    var links = el.querySelectorAll('a');
    for (i = 0; i < links.length; i++) linkLength += t(links[i]).length;
    return textLength - linkLength * 0.6;
  }

  function bestCandidate() {
    var selectors = [
      'article',
      'main',
      '[role="main"]',
      '.post-content',
      '.post-body',
      '.entry-content',
      '.article-body',
      '.article-content',
      '.story-body',
      '.content-body',
      '#article',
      '#content'
    ];
    var best = null;
    var bestScore = 0;
    var i;
    var j;
    for (i = 0; i < selectors.length; i++) {
      var nodes;
      try {
        nodes = document.querySelectorAll(selectors[i]);
      } catch (error) {
        continue;
      }
      for (j = 0; j < nodes.length; j++) {
        var score = scoreCandidate(nodes[j]);
        if (score > bestScore) {
          bestScore = score;
          best = nodes[j];
        }
      }
    }
    if (best) return best;

    var all = document.body ? document.body.querySelectorAll('div,section') : [];
    for (i = 0; i < all.length; i++) {
      var el = all[i];
      if (!visible(el)) continue;
      var direct = 0;
      for (j = 0; j < el.children.length; j++) {
        var child = el.children[j];
        if (child.tagName === 'P') direct += t(child).length;
      }
      if (direct < 120) continue;
      var score = scoreCandidate(el) + direct;
      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    }
    return best;
  }

  function sanitize(source) {
    var clone = source.cloneNode(true);
    var removals = clone.querySelectorAll(
      'script,style,noscript,iframe,form,input,button,select,textarea,svg,canvas,video,audio,' +
      'nav,aside,footer,header,[role="navigation"],[role="complementary"],[role="banner"],' +
      '[aria-hidden="true"],[class*="share"],[class*="social"],[class*="comment"],[class*="related"],' +
      '[class*="promo"],[class*="advert"],[class*="sponsor"],[class*="cookie"],[class*="newsletter"],' +
      '[class*="subscribe"],[class*="paywall"],[id*="comment"],[id*="sidebar"],[class*="sidebar"]'
    );
    for (var i = removals.length - 1; i >= 0; i--) {
      var node = removals[i];
      if (node.parentNode) node.parentNode.removeChild(node);
    }

    var all = clone.querySelectorAll('*');
    for (var j = 0; j < all.length; j++) {
      var el = all[j];
      var tag = el.tagName;
      var keep = {};
      if (tag === 'A') {
        var href = el.getAttribute('href');
        if (href) keep.href = href;
      } else if (tag === 'IMG') {
        var src = el.getAttribute('src') || el.getAttribute('data-src') || el.getAttribute('data-original');
        if (src) keep.src = src;
        var alt = el.getAttribute('alt');
        if (alt) keep.alt = alt;
      }
      while (el.attributes.length) el.removeAttribute(el.attributes[0].name);
      for (var key in keep) {
        if (Object.prototype.hasOwnProperty.call(keep, key)) el.setAttribute(key, keep[key]);
      }
    }

    var blocks = clone.querySelectorAll('p,div,section,span,figure');
    for (var k = blocks.length - 1; k >= 0; k--) {
      var block = blocks[k];
      if (block.querySelector('img,picture,figure,video')) continue;
      if (t(block).length === 0) {
        if (block.parentNode) block.parentNode.removeChild(block);
      }
    }
    return clone;
  }

  function isDarkPage() {
    try {
      var bg = '';
      if (document.body) bg = window.getComputedStyle(document.body).backgroundColor;
      if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
        bg = window.getComputedStyle(document.documentElement).backgroundColor;
      }
      var match = bg && bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        var luminance = (Number(match[1]) * 299 + Number(match[2]) * 587 + Number(match[3]) * 114) / 1000;
        return luminance < 128;
      }
    } catch (error) {
      /* ignore */
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function ensureStyle(dark) {
    var style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }
    var bg = dark ? '#101012' : '#fbfbfa';
    var card = dark ? '#17171a' : '#ffffff';
    var text = dark ? '#e6e6ea' : '#1b1b1f';
    var muted = dark ? '#9a9aa5' : '#66666f';
    var border = dark ? '#2a2a31' : '#e2e2e6';
    style.textContent =
      '#' + OVERLAY_ID + '{position:fixed;inset:0;z-index:2147483646;overflow-y:auto;' +
      '-webkit-overflow-scrolling:touch;background:' + bg + ';color:' + text + ';}' +
      '#' + OVERLAY_ID + ' .r-wrap{max-width:720px;margin:0 auto;padding:20px 20px 96px;' +
      'font-family:' + (dark ? 'Georgia, "Times New Roman", serif' : 'Georgia, "Times New Roman", serif') + ';}' +
      '#' + OVERLAY_ID + ' .r-bar{display:flex;align-items:center;justify-content:space-between;' +
      'gap:12px;max-width:720px;margin:0 auto;padding:14px 20px 0;font-family:system-ui,sans-serif;}' +
      '#' + OVERLAY_ID + ' .r-mark{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:' + muted + ';}' +
      '#' + OVERLAY_ID + ' .r-close{border:1px solid ' + border + ';background:' + card + ';color:' + text + ';' +
      'border-radius:999px;width:38px;height:38px;font-size:20px;line-height:1;display:grid;place-items:center;}' +
      '#' + OVERLAY_ID + ' .r-card{background:' + card + ';border:1px solid ' + border + ';border-radius:18px;' +
      'padding:24px 20px 30px;margin-top:12px;}' +
      '#' + OVERLAY_ID + ' h1{font-size:28px;line-height:1.24;margin:0 0 10px;letter-spacing:-.01em;}' +
      '#' + OVERLAY_ID + ' .r-byline{font-family:system-ui,sans-serif;font-size:12px;color:' + muted + ';margin:0 0 22px;}' +
      '#' + OVERLAY_ID + ' .r-content{font-size:18px;line-height:1.72;word-wrap:break-word;}' +
      '#' + OVERLAY_ID + ' .r-content p{margin:0 0 1.1em;}' +
      '#' + OVERLAY_ID + ' .r-content h2,#' + OVERLAY_ID + ' .r-content h3,#' + OVERLAY_ID + ' .r-content h4{' +
      'font-family:system-ui,sans-serif;line-height:1.3;margin:1.4em 0 .5em;}' +
      '#' + OVERLAY_ID + ' .r-content a{color:inherit;text-decoration:underline;text-underline-offset:2px;}' +
      '#' + OVERLAY_ID + ' .r-content img,#' + OVERLAY_ID + ' .r-content figure,#' + OVERLAY_ID + ' .r-content picture{' +
      'max-width:100%;height:auto;border-radius:12px;}' +
      '#' + OVERLAY_ID + ' .r-content figure{margin:1.3em 0;}' +
      '#' + OVERLAY_ID + ' .r-content figcaption{font-family:system-ui,sans-serif;font-size:12px;color:' + muted + ';margin-top:6px;}' +
      '#' + OVERLAY_ID + ' .r-content blockquote{margin:1.3em 0;padding-left:16px;border-left:3px solid ' + border + ';color:' + muted + ';}' +
      '#' + OVERLAY_ID + ' .r-content pre,#' + OVERLAY_ID + ' .r-content code{' +
      'font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;}' +
      '#' + OVERLAY_ID + ' .r-content pre{overflow-x:auto;padding:14px;background:' + bg + ';border:1px solid ' + border + ';border-radius:10px;}' +
      '#' + OVERLAY_ID + ' .r-content ul,#' + OVERLAY_ID + ' .r-content ol{padding-left:1.3em;margin:0 0 1.1em;}' +
      '#' + OVERLAY_ID + ' .r-content li{margin:.35em 0;}' +
      '#' + OVERLAY_ID + ' .r-content table{width:100%;border-collapse:collapse;font-size:14px;}' +
      '#' + OVERLAY_ID + ' .r-content td,#' + OVERLAY_ID + ' .r-content th{border:1px solid ' + border + ';padding:8px;}';
  }

  function disable() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    var style = document.getElementById(STYLE_ID);
    if (style && style.parentNode) style.parentNode.removeChild(style);
    try {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    } catch (error) {
      /* ignore */
    }
    return true;
  }

  function enable() {
    if (document.getElementById(OVERLAY_ID)) return true;
    var candidate = bestCandidate();
    if (!candidate) return false;
    var content;
    try {
      content = sanitize(candidate);
    } catch (error) {
      return false;
    }
    var textLength = t(content).length;
    if (textLength < 240) return false;

    var dark = isDarkPage();
    ensureStyle(dark);
    var bg = dark ? '#101012' : '#fbfbfa';
    var cardColor = dark ? '#17171a' : '#ffffff';
    var textColor = dark ? '#e6e6ea' : '#1b1b1f';
    var mutedColor = dark ? '#9a9aa5' : '#66666f';
    var borderColor = dark ? '#2a2a31' : '#e2e2e6';

    var heading = document.querySelector('h1');
    var title = t(heading) || document.title || 'Reading mode';
    var byline = '';
    var bylineNode = document.querySelector('[rel="author"], .byline, .author, [class*="byline"], [class*="author"]');
    if (bylineNode) byline = t(bylineNode);

    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Reading mode');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483646;overflow-y:auto;' +
      '-webkit-overflow-scrolling:touch;background:' + bg + ';color:' + textColor + ';';

    var bar = document.createElement('div');
    bar.className = 'r-bar';
    bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;' +
      'max-width:720px;margin:0 auto;padding:14px 20px 0;font-family:system-ui,sans-serif;';
    var mark = document.createElement('span');
    mark.className = 'r-mark';
    mark.textContent = 'Reading mode';
    mark.style.cssText = 'font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:' + mutedColor + ';';
    var close = document.createElement('button');
    close.className = 'r-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Exit reading mode');
    close.textContent = '\u00d7';
    close.style.cssText = 'border:1px solid ' + borderColor + ';background:' + cardColor + ';color:' + textColor + ';' +
      'border-radius:999px;width:38px;height:38px;font-size:20px;line-height:1;display:grid;place-items:center;cursor:pointer;';
    close.addEventListener('click', function (event) {
      event.preventDefault();
      disable();
    });
    bar.appendChild(mark);
    bar.appendChild(close);

    var wrap = document.createElement('div');
    wrap.className = 'r-wrap';
    wrap.style.cssText = 'max-width:720px;margin:0 auto;padding:20px 20px 96px;' +
      'font-family:Georgia,"Times New Roman",serif;';
    var card = document.createElement('div');
    card.className = 'r-card';
    card.style.cssText = 'background:' + cardColor + ';border:1px solid ' + borderColor + ';border-radius:18px;' +
      'padding:24px 20px 30px;margin-top:12px;';
    var h1 = document.createElement('h1');
    h1.textContent = title;
    h1.style.cssText = 'font-size:28px;line-height:1.24;margin:0 0 10px;letter-spacing:-.01em;color:' + textColor + ';';
    card.appendChild(h1);
    if (byline) {
      var bylineEl = document.createElement('div');
      bylineEl.className = 'r-byline';
      bylineEl.textContent = byline;
      bylineEl.style.cssText = 'font-family:system-ui,sans-serif;font-size:12px;color:' + mutedColor + ';margin:0 0 22px;';
      card.appendChild(bylineEl);
    }
    var body = document.createElement('div');
    body.className = 'r-content';
    body.style.cssText = 'font-size:18px;line-height:1.72;word-wrap:break-word;color:' + textColor + ';';
    body.appendChild(content);
    card.appendChild(body);
    wrap.appendChild(card);
    overlay.appendChild(bar);
    overlay.appendChild(wrap);
    (document.body || document.documentElement).appendChild(overlay);

    try {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } catch (error) {
      /* ignore */
    }
    overlay.scrollTop = 0;
    return true;
  }

  window.__4kReader = {
    enable: enable,
    disable: disable,
    active: function () {
      return !!document.getElementById(OVERLAY_ID);
    }
  };
})();
