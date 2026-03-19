/**
 * TOX Express Chat Widget + Smartsupp Integration
 * Loaded on every page - custom branded button opens Smartsupp live chat
 */
(function() {
    'use strict';
    if (document.getElementById('tox-live-chat-widget')) return;

    // ── Load Smartsupp with key ──
    var _smartsupp = window._smartsupp = window._smartsupp || {};
    _smartsupp.key = 'fd00ea32309b389eee975f053f5ec02d1b8ce7e7';
    _smartsupp.cookieDomain = location.hostname;
    window.smartsupp || (function(d) {
        var s, c, o = window.smartsupp = function() { o._.push(arguments); }; o._ = [];
        s = d.getElementsByTagName('script')[0]; c = d.createElement('script');
        c.type = 'text/javascript'; c.charset = 'utf-8'; c.async = true;
        c.src = 'https://www.smartsuppchat.com/loader.js?';
        s.parentNode.insertBefore(c, s);
    })(document);

    // Hide default Smartsupp button via API once it loads, keep chat window functional
    smartsupp('widget:hide');

    // ── CSS: custom button + hide only the Smartsupp default launcher button ──
    var css = document.createElement('style');
    css.textContent = [
        '#tox-chat-btn{width:64px!important;height:64px!important;border-radius:50%!important;background:linear-gradient(135deg,#1D3557,#457B9D)!important;box-shadow:0 4px 20px rgba(29,53,87,.5)!important;border:none!important;cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;position:relative!important;transition:transform .3s,box-shadow .3s!important;animation:toxPulse 2s infinite!important;padding:0!important;margin:0!important;}',
        '#tox-chat-btn:hover{transform:scale(1.12)!important;box-shadow:0 6px 28px rgba(29,53,87,.6)!important;}',
        '#tox-chat-btn svg{width:30px!important;height:30px!important;fill:#E8C84A!important;display:block!important;}',
        '@keyframes toxPulse{0%{box-shadow:0 4px 20px rgba(29,53,87,.5),0 0 0 0 rgba(29,53,87,.4)}70%{box-shadow:0 4px 20px rgba(29,53,87,.5),0 0 0 14px rgba(29,53,87,0)}100%{box-shadow:0 4px 20px rgba(29,53,87,.5),0 0 0 0 rgba(29,53,87,0)}}',
        '#tox-chat-btn .tox-tip{position:absolute!important;right:74px!important;top:50%!important;transform:translateY(-50%)!important;background:#1D3557!important;color:#E8C84A!important;padding:8px 16px!important;border-radius:8px!important;font-size:13px!important;font-weight:600!important;white-space:nowrap!important;opacity:0!important;pointer-events:none!important;transition:opacity .3s!important;font-family:Inter,sans-serif!important;}',
        '#tox-chat-btn:hover .tox-tip{opacity:1!important;}'
    ].join('');
    document.head.appendChild(css);

    // ── Build the custom button ──
    var w = document.createElement('div');
    w.id = 'tox-live-chat-widget';
    w.setAttribute('style', 'position:fixed!important;bottom:24px!important;right:24px!important;z-index:2147483647!important;display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;');
    w.innerHTML = '<button id="tox-chat-btn" title="Chat with us!" aria-label="Open live chat">' +
        '<span class="tox-tip">Chat with us!</span>' +
        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>' +
        '</button>';

    // ── Inject into body ──
    function inject() {
        if (!document.body) { setTimeout(inject, 50); return; }
        document.body.appendChild(w);

        document.getElementById('tox-chat-btn').addEventListener('click', function() {
            if (window.smartsupp) {
                try {
                    smartsupp('chat:open');
                    return;
                } catch (e) { console.warn('[TOX] Smartsupp open failed', e); }
            }
            // Fallback: direct Smartsupp page if not loaded yet
            window.open('https://www.smartsupp.com/chat/' + _smartsupp.key, '_blank', 'noopener,noreferrer');
        });

        // Re-hide default Smartsupp button periodically (it can re-appear after load)
        var hideAttempts = 0;
        var hideInterval = setInterval(function() {
            if (window.smartsupp) {
                try { smartsupp('widget:hide'); } catch(e) {}
            }
            hideAttempts++;
            if (hideAttempts > 20) clearInterval(hideInterval);
        }, 500);
    }
    inject();
})();
