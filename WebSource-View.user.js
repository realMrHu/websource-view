// ==UserScript==
// @name         WebSource Viewer
// @namespace    https://github.com/realMrHu/websource-view/
// @version      3.2.0
// @description  网页源码查看器和下载器
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMTAuNSIgY3k9IjEwLjUiIHI9IjciIHN0cm9rZT0iIzdjM2FlZCIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxsaW5lIHgxPSIxNS41IiB5MT0iMTUuNSIgeDI9IjIxIiB5Mj0iMjEiIHN0cm9rZT0iIzdjM2FlZCIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==
// @author       you
// @match        *://*/*
// @run-at       document-end
// @exclude      *://*.bing.com/*
// @exclude      *://*.yandex.com/*
// @exclude      *://*.yandex.ru/*
// @exclude      *://*.google.com/search*
// @exclude      *://*.google.com.hk/search*
// @exclude      *://*.baidu.com/s?*
// @exclude      *://*.sogou.com/web*
// @exclude      *://*.duckduckgo.com/*
// @exclude      *://*.startpage.com/*
// @exclude      *://search.yahoo.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    var SIZE = 52;
    var LONG_PRESS = 400;
    var THRESH = 6;

    var btn, toast;
    var ts = { x: 0, y: 0, t: 0 };
    var orig = { r: 20, b: 20 };
    var drag = false;
    var timer = null;

    var ICON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="7"/><line x1="15.5" y1="15.5" x2="21" y2="21"/></svg>';

    /* ── 样式 ── */
    var styleEl = document.createElement('style');
    styleEl.textContent = [
        '.sv-btn{',
        'position:fixed;z-index:2147483647;',
        'width:' + SIZE + 'px;height:' + SIZE + 'px;border-radius:50%;',
        'background:rgba(255,255,255,.45);',
        'backdrop-filter:blur(24px) saturate(200%);',
        '-webkit-backdrop-filter:blur(24px) saturate(200%);',
        'border:1.5px solid rgba(255,255,255,.5);',
        'box-shadow:0 0 0 .5px rgba(255,255,255,.35) inset,0 0 0 3px rgba(255,255,255,.08),0 0 24px rgba(255,255,255,.05);',
        'cursor:pointer;user-select:none;-webkit-user-select:none;',
        'display:flex;align-items:center;justify-content:center;',
        'transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s;',
        'touch-action:none;color:#3a3a3a;',
        '}',
        '.sv-btn:active{transform:scale(.88);box-shadow:0 0 0 1px rgba(255,255,255,.5) inset,0 0 0 6px rgba(255,255,255,.06),0 0 20px rgba(255,255,255,.08);}',
        '.sv-toast{',
        'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);z-index:2147483647;',
        'background:rgba(0,0,0,.75);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);',
        'color:#fff;padding:8px 20px;border-radius:18px;font-size:13px;',
        'font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;',
        'opacity:0;transition:opacity .3s;pointer-events:none;',
        '}',
        '.sv-toast.show{opacity:1;}',
    ].join('\n');
    document.head.appendChild(styleEl);

    /* ── DOM ── */
    btn = document.createElement('div');
    btn.className = 'sv-btn';
    btn.innerHTML = ICON;
    btn.style.right = orig.r + 'px';
    btn.style.bottom = orig.b + 'px';

    toast = document.createElement('div');
    toast.className = 'sv-toast';

    document.body.appendChild(btn);
    document.body.appendChild(toast);

    /* ── 触摸 ── */
    btn.addEventListener('touchstart', function (e) {
        var t = e.touches[0];
        ts.x = t.clientX; ts.y = t.clientY; ts.t = Date.now();
        drag = false;
        orig.r = parseInt(btn.style.right) || 20;
        orig.b = parseInt(btn.style.bottom) || 20;
        clearTimeout(timer);
        timer = setTimeout(function () { drag = true; }, LONG_PRESS);
    }, { passive: false });

    btn.addEventListener('touchmove', function (e) {
        if (!drag) {
            if (Math.abs(e.touches[0].clientX - ts.x) > THRESH || Math.abs(e.touches[0].clientY - ts.y) > THRESH) {
                clearTimeout(timer);
            }
            return;
        }
        e.preventDefault();
        var t = e.touches[0];
        var nr = orig.r + (ts.x - t.clientX);
        var nb = orig.b + (ts.y - t.clientY);
        nr = Math.max(8, Math.min(nr, window.innerWidth - SIZE - 8));
        nb = Math.max(8, Math.min(nb, window.innerHeight - SIZE - 8));
        btn.style.right = nr + 'px';
        btn.style.bottom = nb + 'px';
    }, { passive: false });

    btn.addEventListener('touchend', function (e) {
        clearTimeout(timer);
        if (drag) {
            orig.r = parseInt(btn.style.right) || 20;
            orig.b = parseInt(btn.style.bottom) || 20;
            drag = false;
            return;
        }
        var ex = (e.changedTouches[0] || ts).clientX;
        var ey = (e.changedTouches[0] || ts).clientY;
        if (Date.now() - ts.t < LONG_PRESS && Math.abs(ex - ts.x) < THRESH && Math.abs(ey - ts.y) < THRESH) {
            e.preventDefault();
            openViewer();
        }
    });

    /* ── 鼠标 ── */
    btn.addEventListener('mousedown', function (e) {
        e.preventDefault();
        ts.x = e.clientX; ts.y = e.clientY; ts.t = Date.now();
        drag = false;
        orig.r = parseInt(btn.style.right) || 20;
        orig.b = parseInt(btn.style.bottom) || 20;
        clearTimeout(timer);
        timer = setTimeout(function () { drag = true; }, LONG_PRESS);
    });

    document.addEventListener('mousemove', function (e) {
        if (!drag) return;
        var nr = orig.r + (ts.x - e.clientX);
        var nb = orig.b + (ts.y - e.clientY);
        nr = Math.max(8, Math.min(nr, window.innerWidth - SIZE - 8));
        nb = Math.max(8, Math.min(nb, window.innerHeight - SIZE - 8));
        btn.style.right = nr + 'px';
        btn.style.bottom = nb + 'px';
    });

    document.addEventListener('mouseup', function (e) {
        clearTimeout(timer);
        if (drag) {
            orig.r = parseInt(btn.style.right) || 20;
            orig.b = parseInt(btn.style.bottom) || 20;
            drag = false;
            return;
        }
        if (Date.now() - ts.t < LONG_PRESS && Math.abs(e.clientX - ts.x) < THRESH && Math.abs(e.clientY - ts.y) < THRESH) {
            openViewer();
        }
    });

    /* ── 去除脚本源码 ── */
    function cleanSrc() {
        var clone = document.documentElement.cloneNode(true);
        var junk = clone.querySelectorAll('.sv-btn,.sv-toast');
        for (var i = 0; i < junk.length; i++) {
            if (junk[i].parentNode) junk[i].parentNode.removeChild(junk[i]);
        }
        var styles = clone.querySelectorAll('style');
        for (var j = 0; j < styles.length; j++) {
            if (styles[j].textContent.indexOf('.sv-btn') !== -1 && styles[j].parentNode) {
                styles[j].parentNode.removeChild(styles[j]);
            }
        }
        var html = clone.outerHTML;
        if (!/^<!DOCTYPE/i.test(html)) html = '<!DOCTYPE html>\n' + html;
        return html;
    }

    /* ══════════════════════════════════════
       语法高亮
       ══════════════════════════════════════ */

    function esc(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function highlight(raw) {
        var html = esc(raw);

        // 提取 script / style 块，用占位符保护
        var scripts = [];
        var styles  = [];

        html = html.replace(/(&lt;script\b[\s\S]*?&lt;\/script&gt;)/gi, function (m) {
            scripts.push(m); return '\x00S' + (scripts.length - 1) + '\x00';
        });
        html = html.replace(/(&lt;style\b[\s\S]*?&lt;\/style&gt;)/gi, function (m) {
            styles.push(m); return '\x00C' + (styles.length - 1) + '\x00';
        });

        // HTML 结构
        html = html.replace(/&lt;!--[\s\S]*?--&gt;/g, '<span class="h cm">$&</span>');
        html = html.replace(/&lt;!\w+[\s\S]*?&gt;/g, '<span class="h dt">$&</span>');
        html = html.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="h tg">$2</span>');
        html = html.replace(/(\s)([-:\w]+)(\s*=\s*)/g, '$1<span class="h at">$2</span>$3');
        html = html.replace(/(&quot;)([^&]*?)(&quot;)/g, '$1<span class="h st">$2</span>$3');
        html = html.replace(/&amp;(#[xX]?\d+|\w+);/g, '<span class="h en">$&</span>');

        // script 块
        for (var i = 0; i < scripts.length; i++) {
            html = html.replace('\x00S' + i + '\x00', hlScript(scripts[i]));
        }
        // style 块
        for (var j = 0; j < styles.length; j++) {
            html = html.replace('\x00C' + j + '\x00', hlStyle(styles[j]));
        }

        return html;
    }

    function hlScript(code) {
        var m = code.match(/^(&lt;script\b[\s\S]*?&gt;)([\s\S]*?)(&lt;\/script&gt;)$/i);
        if (!m) return code;
        var ot = m[1], body = m[2], ct = m[3];

        // 注释
        body = body.replace(/(\/\/[^\n]*)/g, '<span class="h cm">$1</span>');
        body = body.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="h cm">$1</span>');
        // 字符串
        body = body.replace(/(`(?:[^`\\]|\\.)*`)/g, '<span class="h st">$1</span>');
        body = body.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="h st">$1</span>');
        body = body.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="h st">$1</span>');
        // 关键字
        body = body.replace(/\b(break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|of|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|from|as|async|await|static|get|set)\b/g, '<span class="h kw">$1</span>');
        // 布尔 / null
        body = body.replace(/\b(true|false|null|undefined|NaN|Infinity)\b/g, '<span class="h kw">$1</span>');
        // 数字
        body = body.replace(/\b(\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g, '<span class="h nb">$1</span>');
        // 内置对象
        body = body.replace(/\b(console|document|window|Math|JSON|Array|Object|String|Number|Boolean|Promise|Set|Map|WeakMap|WeakSet|Symbol|RegExp|Error|Date|parseInt|parseFloat|isNaN|isFinite|eval|encodeURIComponent|decodeURIComponent|setTimeout|setInterval|clearTimeout|clearInterval|fetch|Proxy|Reflect|Intl|BigInt)\b/g, '<span class="h bi">$1</span>');
        // 方法调用
        body = body.replace(/(\.\w+)(\s*\()/g, '<span class="h mt">$1</span>$2');

        // script 标签本身的属性
        ot = ot.replace(/(&lt;\/?)(script)/gi, '$1<span class="h tg">$2</span>');
        ot = ot.replace(/(\s)([-:\w]+)(\s*=\s*)/g, '$1<span class="h at">$2</span>$3');
        ot = ot.replace(/(&quot;)([^&]*?)(&quot;)/g, '$1<span class="h st">$2</span>$3');
        ct = ct.replace(/(&lt;\/?)(script)/gi, '$1<span class="h tg">$2</span>');

        return ot + body + ct;
    }

    function hlStyle(code) {
        var m = code.match(/^(&lt;style\b[\s\S]*?&gt;)([\s\S]*?)(&lt;\/style&gt;)$/i);
        if (!m) return code;
        var ot = m[1], body = m[2], ct = m[3];

        // 注释
        body = body.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="h cm">$1</span>');
        // 属性名：只在 { 或 ; 后面匹配，避免误伤 URL 中的冒号
        body = body.replace(/([{;]\s*)([-a-zA-Z]+)(\s*:)/g, '$1<span class="h cp">$2</span>$3');
        // 选择器
        body = body.replace(/([.#])([a-zA-Z_-][\w-]*)/g, '<span class="h cs">$1$2</span>');
        body = body.replace(/(::?[\w-]+)/g, '<span class="h cs">$1</span>');
        body = body.replace(/(@[\w-]+)/g, '<span class="h kw">$1</span>');
        // 数值 + 单位
        body = body.replace(/\b(\d+\.?\d*)(px|em|rem|%|vh|vw|vmin|vmax|ms|s|deg|grad|rad|turn|fr|dpi|dpcm|dppx|ch|ex|mm|cm|in|pt|pc)?\b/g, '<span class="h nb">$1$2</span>');
        // 颜色
        body = body.replace(/#[0-9a-fA-F]{3,8}\b/g, '<span class="h nb">$&</span>');
        // CSS 关键字
        body = body.replace(/\b(none|auto|inherit|initial|unset|revert|block|inline|inline-block|flex|inline-flex|grid|inline-grid|table|table-cell|flow-root|contents|relative|absolute|fixed|sticky|static|center|left|right|top|bottom|hidden|visible|scroll|bold|normal|italic|oblique|transparent|solid|dashed|dotted|double|groove|ridge|inset|outset|no-repeat|repeat|repeat-x|repeat-y|space|round|cover|contain|fill|border-box|content-box|padding-box|margin-box|text|nowrap|pre|pre-wrap|pre-line|break-word|ellipsis|clip|pointer|not-allowed|move|grab|grabbing|zoom-in|zoom-out|all|both|uppercase|lowercase|capitalize|underline|overline|line-through|justify|start|end|flex-start|flex-end|space-between|space-around|space-evenly|stretch|baseline)\b/g, '<span class="h kw">$1</span>');

        // 标签本身的属性
        ot = ot.replace(/(&lt;\/?)(style)/gi, '$1<span class="h tg">$2</span>');
        ot = ot.replace(/(\s)([-:\w]+)(\s*=\s*)/g, '$1<span class="h at">$2</span>$3');
        ot = ot.replace(/(&quot;)([^&]*?)(&quot;)/g, '$1<span class="h st">$2</span>$3');
        ct = ct.replace(/(&lt;\/?)(style)/gi, '$1<span class="h tg">$2</span>');

        return ot + body + ct;
    }

    /* ── 弹窗 ── */
    function openViewer() {
        var raw = cleanSrc();
        var title = (document.title || '').replace(/"/g, '&quot;');
        var size = raw.length < 1024 ? raw.length + ' B' :
                   raw.length < 1048576 ? (raw.length / 1024).toFixed(1) + ' KB' :
                   (raw.length / 1048576).toFixed(1) + ' MB';

        var highlighted = highlight(raw);

        // 把原始源码以 base64 传给弹窗，下载用
        var b64 = btoa(unescape(encodeURIComponent(raw)));

        var html = '' +
            '<!DOCTYPE html>\n<html>\n<head>\n' +
            '<meta charset="utf-8">\n' +
            '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
            '<title>' + title + ' - 源码</title>\n' +
            '<style>\n' +
            '*{margin:0;padding:0;box-sizing:border-box}\n' +
            'body{background:#1e1e1e;color:#d4d4d4;font-family:ui-monospace,SFMono-Regular,monospace}\n' +
            '.bar{position:sticky;top:0;z-index:10;display:flex;align-items:center;padding:8px 14px;' +
            'background:rgba(30,30,30,.85);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);' +
            'border-bottom:1px solid rgba(255,255,255,.08)}\n' +
            '.bar .info{font-size:12px;color:#777;margin-right:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60%}\n' +
            '.bar .btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:8px;' +
            'border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#ccc;font-size:12px;' +
            'cursor:pointer;white-space:nowrap}\n' +
            '.bar .btn:active{background:rgba(255,255,255,.12)}\n' +
            '.bar .btn svg{width:14px;height:14px}\n' +
            '.code{padding:16px;font-size:13px;line-height:1.8;white-space:pre-wrap;word-break:break-all;tab-size:2}\n' +
            // 语法高亮色表
            '.h.tg{color:#569cd6}\n.h.at{color:#9cdcfe}\n.h.st{color:#ce9178}\n' +
            '.h.cm{color:#6a9955;font-style:italic}\n.h.dt{color:#569cd6}\n' +
            '.h.kw{color:#c586c0}\n.h.nb{color:#b5cea8}\n.h.bi{color:#4ec9b0}\n' +
            '.h.mt{color:#dcdcaa}\n.h.en{color:#b5cea8}\n.h.cp{color:#9cdcfe}\n' +
            '.h.cs{color:#d7ba7d}\n' +
            '</style>\n</head>\n<body>\n' +
            '<div class="bar">\n' +
            '<span class="info">' + title + ' · ' + size + '</span>\n' +
            '<span class="btn" id="dl" onclick="doDownload()">' +
            '<svg viewBox="0 0 24 24" style="width:14px;height:14px" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>' +
            '</svg>下载</span>\n' +
            '</div>\n' +
            '<pre class="code">' + highlighted + '</pre>\n' +
            '<script>\n' +
            'var _b64 = "' + b64 + '";\n' +
            'var _title = "' + title + '";\n' +
            'function doDownload() {\n' +
            '  try {\n' +
            '    var raw = decodeURIComponent(escape(atob(_b64)));\n' +
            '    var blob = new Blob([raw], {type: "text/html;charset=utf-8"});\n' +
            '    var url = URL.createObjectURL(blob);\n' +
            '    var a = document.createElement("a");\n' +
            '    a.href = url;\n' +
            '    a.download = (_title || "source") + ".html";\n' +
            '    a.click();\n' +
            '    URL.revokeObjectURL(url);\n' +
            '    var el = document.getElementById("dl");\n' +
            '    el.textContent = "\\u2705 \\u5df2\\u4e0b\\u8f7d";\n' +
            '    setTimeout(function(){\n' +
            '      el.innerHTML = ' +
            '\'<svg viewBox="0 0 24 24" style="width:14px;height:14px" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>' +
            '</svg>\\u4e0b\\u8f7d\'' +
            '; }, 1500);\n' +
            '  } catch(e) { alert("\\u4e0b\\u8f7d\\u5931\\u8d25"); }\n' +
            '}\n' +
            '<' + '/script>\n' +
            '</body>\n</html>';

        var w = window.open('', '_blank', 'width=900,height=700');
        if (!w) {
            toast.textContent = '弹窗被拦截，请允许弹窗';
            toast.classList.add('show');
            clearTimeout(toast._t);
            toast._t = setTimeout(function () { toast.classList.remove('show'); }, 2000);
            return;
        }
        w.document.write(html);
        w.document.close();
    }

})();
