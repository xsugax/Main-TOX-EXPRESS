document.addEventListener('DOMContentLoaded', function() {
    var statusChart = null;
    var historyChart = null;

    // Color map for status badges & charts
    var statusColors = {
        'In Transit': '#1D3557',
        'In Flight': '#2563eb',
        'Delivered': '#22c55e',
        'Processing': '#E8C84A',
        'Loading': '#f59e0b',
        'Out for Delivery': '#06b6d4',
        'Pending': '#9ca3af',
        'Cancelled': '#ef4444'
    };

    function fmt(n) {
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function loadDashboard() {
        fetch('/api/dashboard/stats')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                // KPIs
                document.getElementById('activeShipments').textContent = fmt(data.active || 0);
                document.getElementById('deliveryVehicles').textContent = fmt(data.inTransit || 0);
                document.getElementById('portsServed').textContent = fmt(data.total || 0);
                document.getElementById('packagesDelivered').textContent = fmt(data.delivered || 0);

                // Status doughnut chart
                var labels = Object.keys(data.statusCounts || {});
                var values = labels.map(function(l) { return data.statusCounts[l]; });
                var colors = labels.map(function(l) { return statusColors[l] || '#6c757d'; });

                var statusCtx = document.getElementById('statusChart').getContext('2d');
                if (statusChart) statusChart.destroy();
                statusChart = new Chart(statusCtx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 13 } } } }
                    }
                });

                // Recent shipments bar chart (progress)
                var recent = (data.recent || []).slice(0, 8);
                var rLabels = recent.map(function(s) { return s.id.replace('TOX-', ''); });
                var rData = recent.map(function(s) { return s.progress || 0; });
                var rColors = recent.map(function(s) { return statusColors[s.status] || '#6c757d'; });

                var monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
                if (historyChart) historyChart.destroy();
                historyChart = new Chart(monthlyCtx, {
                    type: 'bar',
                    data: {
                        labels: rLabels,
                        datasets: [{
                            label: 'Progress %',
                            data: rData,
                            backgroundColor: rColors,
                            borderRadius: 6,
                            maxBarThickness: 40
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: { y: { beginAtZero: true, max: 100, ticks: { callback: function(v) { return v + '%'; } } } },
                        plugins: { legend: { display: false } }
                    }
                });

                // Build recent shipments table
                buildRecentTable(recent);
            })
            .catch(function() {
                document.getElementById('activeShipments').textContent = '—';
                document.getElementById('deliveryVehicles').textContent = '—';
                document.getElementById('portsServed').textContent = '—';
                document.getElementById('packagesDelivered').textContent = '—';
            });
    }

    function buildRecentTable(shipments) {
        var container = document.getElementById('recentShipments');
        if (!container) return;
        if (!shipments.length) {
            container.innerHTML = '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:24px;">No shipments yet.</p>';
            return;
        }
        var html = '<table style="width:100%;border-collapse:collapse;font-size:0.9rem;">' +
            '<thead><tr style="border-bottom:2px solid rgba(255,255,255,0.1);">' +
            '<th style="text-align:left;padding:10px 8px;color:#E8C84A;">Tracking ID</th>' +
            '<th style="text-align:left;padding:10px 8px;color:#E8C84A;">Route</th>' +
            '<th style="text-align:left;padding:10px 8px;color:#E8C84A;">Status</th>' +
            '<th style="text-align:left;padding:10px 8px;color:#E8C84A;">Progress</th>' +
            '<th style="text-align:left;padding:10px 8px;color:#E8C84A;">ETA</th>' +
            '</tr></thead><tbody>';
        shipments.forEach(function(s) {
            var color = statusColors[s.status] || '#6c757d';
            html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.06);">' +
                '<td style="padding:10px 8px;font-family:monospace;font-weight:700;"><a href="tracking.html?id=' + encodeURIComponent(s.id) + '" style="color:#E8C84A;text-decoration:none;">' + s.id + '</a></td>' +
                '<td style="padding:10px 8px;">' + (s.origin || '') + ' → ' + (s.destination || '') + '</td>' +
                '<td style="padding:10px 8px;"><span style="background:' + color + ';color:#fff;padding:3px 10px;border-radius:20px;font-size:0.8rem;font-weight:600;">' + s.status + '</span></td>' +
                '<td style="padding:10px 8px;">' +
                    '<div style="background:rgba(255,255,255,0.1);border-radius:10px;height:8px;width:100px;overflow:hidden;">' +
                    '<div style="background:' + color + ';height:100%;width:' + (s.progress || 0) + '%;border-radius:10px;"></div></div>' +
                    '<span style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-left:6px;">' + (s.progress || 0) + '%</span>' +
                '</td>' +
                '<td style="padding:10px 8px;font-size:0.85rem;">' + (s.eta || '—') + '</td>' +
                '</tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    }

    loadDashboard();
    // Auto-refresh every 30 seconds
    setInterval(loadDashboard, 30000);

    // ===== FLOATING CHAT WIDGET (injected via JS to guarantee visibility) =====
    (function injectChatWidget() {
        // Create widget container
        var w = document.createElement('div');
        w.id = 'tox-live-chat-widget';
        w.setAttribute('style', 'position:fixed!important;bottom:24px!important;right:24px!important;z-index:2147483647!important;display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;');

        // CSS
        var css = document.createElement('style');
        css.textContent = [
            '#tox-chat-btn{width:64px!important;height:64px!important;border-radius:50%!important;background:linear-gradient(135deg,#1D3557,#457B9D)!important;box-shadow:0 4px 20px rgba(29,53,87,.5)!important;border:none!important;cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;position:relative!important;transition:transform .3s,box-shadow .3s!important;animation:toxPulse 2s infinite!important;padding:0!important;margin:0!important;}',
            '#tox-chat-btn:hover{transform:scale(1.12)!important;box-shadow:0 6px 28px rgba(29,53,87,.6)!important;}',
            '#tox-chat-btn svg{width:30px!important;height:30px!important;fill:#E8C84A!important;display:block!important;}',
            '@keyframes toxPulse{0%{box-shadow:0 4px 20px rgba(29,53,87,.5),0 0 0 0 rgba(29,53,87,.4)}70%{box-shadow:0 4px 20px rgba(29,53,87,.5),0 0 0 14px rgba(29,53,87,0)}100%{box-shadow:0 4px 20px rgba(29,53,87,.5),0 0 0 0 rgba(29,53,87,0)}}',
            '#tox-chat-btn .tox-tip{position:absolute!important;right:74px!important;top:50%!important;transform:translateY(-50%)!important;background:#1D3557!important;color:#E8C84A!important;padding:8px 16px!important;border-radius:8px!important;font-size:13px!important;font-weight:600!important;white-space:nowrap!important;opacity:0!important;pointer-events:none!important;transition:opacity .3s!important;font-family:Inter,sans-serif!important;}',
            '#tox-chat-btn:hover .tox-tip{opacity:1!important;}',
            '#tox-chat-panel{display:none;position:absolute!important;bottom:74px!important;right:0!important;width:340px!important;background:#fff!important;border-radius:16px!important;box-shadow:0 10px 40px rgba(0,0,0,.2)!important;overflow:hidden!important;font-family:Inter,sans-serif!important;}',
            '#tox-chat-panel.open{display:block!important;}',
            '#tox-chat-hdr{background:linear-gradient(135deg,#1D3557,#457B9D)!important;color:#fff!important;padding:16px 20px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;}',
            '#tox-chat-hdr h4{margin:0!important;font-size:15px!important;font-weight:700!important;color:#fff!important;}',
            '#tox-chat-hdr span{font-size:12px!important;color:rgba(255,255,255,.8)!important;}',
            '#tox-chat-x{background:none!important;border:none!important;color:#fff!important;font-size:22px!important;cursor:pointer!important;padding:4px!important;line-height:1!important;}',
            '#tox-chat-body{padding:20px!important;text-align:center!important;}',
            '#tox-chat-body p{color:#334155!important;font-size:14px!important;line-height:1.6!important;margin:0 0 16px!important;}',
            '.tox-ca{display:block!important;width:100%!important;padding:12px!important;margin-bottom:10px!important;border:none!important;border-radius:10px!important;font-size:14px!important;font-weight:600!important;cursor:pointer!important;text-decoration:none!important;text-align:center!important;box-sizing:border-box!important;font-family:Inter,sans-serif!important;}',
            '.tox-ca.p{background:#1D3557!important;color:#E8C84A!important;}',
            '.tox-ca.p:hover{background:#274472!important;}',
            '.tox-ca.s{background:#f1f5f9!important;color:#1D3557!important;}',
            '.tox-ca.s:hover{background:#e2e8f0!important;}'
        ].join('');
        document.head.appendChild(css);

        // Button
        w.innerHTML = '<button id="tox-chat-btn" title="Chat with us!" aria-label="Open live chat">' +
            '<span class="tox-tip">Chat with us!</span>' +
            '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>' +
            '</button>' +
            '<div id="tox-chat-panel">' +
            '<div id="tox-chat-hdr"><div><h4>TOX Express Support</h4><span>We typically reply in minutes</span></div><button id="tox-chat-x" aria-label="Close chat">&times;</button></div>' +
            '<div id="tox-chat-body">' +
            '<p>Hi there! \uD83D\uDC4B How can we help you today?</p>' +
            '<a href="mailto:support@toxexpress.org" class="tox-ca p">\u2709\uFE0F Email Support</a>' +
            '<a href="https://wa.me/message" class="tox-ca s" target="_blank" rel="noopener noreferrer">\uD83D\uDCAC WhatsApp</a>' +
            '</div></div>';

        document.body.appendChild(w);

        // Interactions
        var btn = document.getElementById('tox-chat-btn');
        var panel = document.getElementById('tox-chat-panel');
        var xBtn = document.getElementById('tox-chat-x');
        btn.addEventListener('click', function() { panel.classList.toggle('open'); });
        xBtn.addEventListener('click', function(e) { e.stopPropagation(); panel.classList.remove('open'); });
        document.addEventListener('click', function(e) { if (!w.contains(e.target)) panel.classList.remove('open'); });

        console.log('[TOX] Chat widget injected successfully');
    })();
});