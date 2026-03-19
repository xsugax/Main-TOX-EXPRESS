/**
 * TOX Express Chat Widget + Smartsupp Live Chat
 * Loads Smartsupp natively, adds branded TOX button that opens the chat
 */
(function() {
    'use strict';
    if (document.getElementById('tox-live-chat-widget')) return;

    // ── 1. Load Smartsupp (standard snippet from Smartsupp dashboard) ──
    var _smartsupp = window._smartsupp = window._smartsupp || {};
    _smartsupp.key = 'fd00ea32309b389eee975f053f5ec02d1b8ce7e7';
    window.smartsupp || (function(d) {
        var s, c, o = window.smartsupp = function() { o._.push(arguments); }; o._ = [];
        s = d.getElementsByTagName('script')[0]; c = d.createElement('script');
        c.type = 'text/javascript'; c.charset = 'utf-8'; c.async = true;
        c.src = 'https://www.smartsuppchat.com/loader.js?';
        s.parentNode.insertBefore(c, s);
    })(document);

    // ── 2. CSS for our branded button ──
    var css = document.createElement('style');
    css.textContent =
        '#tox-chat-btn{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#1D3557,#457B9D);' +
        'box-shadow:0 4px 20px rgba(29,53,87,.5);border:none;cursor:pointer;display:flex;align-items:center;' +
        'justify-content:center;position:relative;transition:transform .3s,box-shadow .3s;animation:toxPulse 2s infinite;padding:0;margin:0;}' +
        '#tox-chat-btn:hover{transform:scale(1.12);box-shadow:0 6px 28px rgba(29,53,87,.6);}' +
        '#tox-chat-btn svg{width:30px;height:30px;fill:#E8C84A;display:block;}' +
        '@keyframes toxPulse{0%{box-shadow:0 4px 20px rgba(29,53,87,.5),0 0 0 0 rgba(29,53,87,.4)}' +
        '70%{box-shadow:0 4px 20px rgba(29,53,87,.5),0 0 0 14px rgba(29,53,87,0)}' +
        '100%{box-shadow:0 4px 20px rgba(29,53,87,.5),0 0 0 0 rgba(29,53,87,0)}}' +
        '#tox-chat-btn .tox-tip{position:absolute;right:74px;top:50%;transform:translateY(-50%);background:#1D3557;' +
        'color:#E8C84A;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;white-space:nowrap;' +
        'opacity:0;pointer-events:none;transition:opacity .3s;font-family:Inter,sans-serif;}' +
        '#tox-chat-btn:hover .tox-tip{opacity:1;}';
    document.head.appendChild(css);

    // ── 3. Branded button element ──
    var w = document.createElement('div');
    w.id = 'tox-live-chat-widget';
    w.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;';
    w.innerHTML = '<button id="tox-chat-btn" title="Chat with us!" aria-label="Open live chat">' +
        '<span class="tox-tip">Chat with us!</span>' +
        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>' +
        '</button>';

    // ── 4. Inject and wire up click ──
    function inject() {
        if (!document.body) { setTimeout(inject, 50); return; }
        document.body.appendChild(w);

        document.getElementById('tox-chat-btn').addEventListener('click', function() {
            // Try every known method to open Smartsupp chat
            try { smartsupp('chat:open'); } catch(e1) {}
            try { smartsupp('chat:show'); } catch(e2) {}

            // Also try to find and click Smartsupp's own button in the DOM
            setTimeout(function() {
                var frames = document.querySelectorAll('iframe');
                for (var i = 0; i < frames.length; i++) {
                    var src = frames[i].src || '';
                    var id = frames[i].id || '';
                    var name = frames[i].name || '';
                    if (src.indexOf('smartsupp') > -1 || id.indexOf('smartsupp') > -1 || name.indexOf('smartsupp') > -1) {
                        // Make sure the Smartsupp iframe is visible
                        frames[i].style.display = 'block';
                        frames[i].style.visibility = 'visible';
                        frames[i].style.opacity = '1';
                        // Try to resize it (chat open state)
                        frames[i].style.minWidth = '370px';
                        frames[i].style.minHeight = '500px';
                    }
                }
                // Also check for Smartsupp widget container  
                var container = document.getElementById('smartsupp-widget-container');
                if (container) {
                    container.style.display = 'block';
                    container.style.visibility = 'visible';
                    container.style.opacity = '1';
                }
            }, 100);
        });
    }
    inject();
})();
