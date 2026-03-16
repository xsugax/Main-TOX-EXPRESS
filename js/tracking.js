// ==================== TOX EXPRESS — LIVE SHIPMENT TRACKING ====================

// Visitor tracking for tracking page
(function() {
    fetch('/api/visitor/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'tracking.html', action: 'page_visit' })
    }).catch(function(){});
})();

function escTrack(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

async function trackShipment() {
    var input = document.getElementById('trackingNumber');
    var trackingNumber = input.value.trim().toUpperCase();
    var resultDiv = document.getElementById('trackingResult');
    var detailsDiv = document.getElementById('shipmentDetails');

    if (!trackingNumber) {
        input.focus();
        detailsDiv.innerHTML = '<div class="track-error"><i class="fas fa-exclamation-circle"></i> Please enter a tracking number.</div>';
        resultDiv.style.display = 'block';
        return;
    }

    // Show loading state
    detailsDiv.innerHTML = '<div class="track-loading"><i class="fas fa-spinner fa-spin"></i> Looking up shipment <strong>' + escTrack(trackingNumber) + '</strong>...</div>';
    resultDiv.style.display = 'block';

    // Notify admin of tracking search (fire-and-forget)
    fetch('/api/visitor/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 'tracking.html', action: 'tracking_search', trackingId: trackingNumber })
    }).catch(function(){});

    try {
        // Try server API first
        var res = await fetch('/api/track/' + encodeURIComponent(trackingNumber));
        if (!res.ok) throw new Error('Server error');
        var data = await res.json();

        if (data.error) {
            detailsDiv.innerHTML = renderNotFound(trackingNumber);
            return;
        }

        detailsDiv.innerHTML = renderShipmentResult(data);
    } catch (err) {
        // Server unavailable — fall back to static shipments.json
        try {
            var fallbackRes = await fetch('data/shipments.json');
            var shipments = await fallbackRes.json();
            var found = null;
            for (var i = 0; i < shipments.length; i++) {
                if (shipments[i].id === trackingNumber) { found = shipments[i]; break; }
            }
            if (found) {
                detailsDiv.innerHTML = renderShipmentResult(found);
            } else {
                detailsDiv.innerHTML = renderNotFound(trackingNumber);
            }
        } catch (fallbackErr) {
            detailsDiv.innerHTML = '<div class="track-error"><i class="fas fa-wifi"></i> Unable to load tracking data. Please try again later.</div>';
        }
    }
}

// Allow pressing Enter to search + auto-track from URL parameter
document.addEventListener('DOMContentLoaded', function() {
    var input = document.getElementById('trackingNumber');
    if (input) {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); trackShipment(); }
        });

        // Auto-fill and track if ?id= parameter is present
        var params = new URLSearchParams(window.location.search);
        var urlId = params.get('id');
        if (urlId) {
            input.value = urlId.trim().toUpperCase();
            trackShipment();
        }
    }
});

function renderNotFound(id) {
    return '<div class="track-not-found">' +
        '<div class="track-not-found-icon"><i class="fas fa-search"></i></div>' +
        '<h3>Shipment Not Found</h3>' +
        '<p>No shipment matching <strong>' + escTrack(id) + '</strong> was found in our system.</p>' +
        '<div class="track-tips">' +
        '<p><strong>Tips:</strong></p>' +
        '<ul>' +
        '<li>Check the tracking number for typos</li>' +
        '<li>Tracking numbers start with <code>TOX-</code></li>' +
        '<li>New shipments may take a few minutes to appear</li>' +
        '<li>Contact support at <a href="mailto:thetoxexpressdeliveryservices@gmail.com">thetoxexpressdeliveryservices@gmail.com</a></li>' +
        '</ul></div></div>';
}

function renderShipmentResult(s) {
    var statusColors = {
        'Processing': '#f59e0b', 'Loading': '#f59e0b', 'In Transit': '#3b82f6',
        'In Flight': '#3b82f6', 'Customs Clearance': '#8b5cf6', 'Out for Delivery': '#0ea5e9',
        'Delivered': '#22c55e', 'On Hold': '#ef4444', 'Delayed': '#ef4444', 'Cancelled': '#6b7280'
    };
    var statusIcons = {
        'Processing': 'fa-cog', 'Loading': 'fa-truck-loading', 'In Transit': 'fa-ship',
        'In Flight': 'fa-plane', 'Customs Clearance': 'fa-passport', 'Out for Delivery': 'fa-truck',
        'Delivered': 'fa-check-circle', 'On Hold': 'fa-pause-circle', 'Delayed': 'fa-exclamation-triangle', 'Cancelled': 'fa-times-circle'
    };

    var color = statusColors[s.status] || '#3b82f6';
    var icon = statusIcons[s.status] || 'fa-box';
    var progress = s.progress || 0;

    var html = '<div class="track-card">';

    // === Status Header ===
    html += '<div class="track-status-header" style="background:linear-gradient(135deg,' + color + '22,' + color + '08);border-left:4px solid ' + color + ';">' +
        '<div class="track-status-icon" style="color:' + color + ';"><i class="fas ' + icon + '"></i></div>' +
        '<div class="track-status-info">' +
        '<div class="track-status-label" style="color:' + color + ';">' + escTrack(s.status) + '</div>' +
        '<div class="track-id">' + escTrack(s.id) + '</div>' +
        '</div></div>';

    // === Progress Bar ===
    html += '<div class="track-progress-wrap">' +
        '<div class="track-progress-bar"><div class="track-progress-fill" style="width:' + progress + '%;background:' + color + ';"></div></div>' +
        '<div class="track-progress-pct">' + progress + '% Complete</div></div>';

    // === Route ===
    html += '<div class="track-route">' +
        '<div class="track-route-point"><div class="track-route-dot origin"></div><div class="track-route-label">Origin</div><div class="track-route-city">' + escTrack(s.origin) + '</div></div>' +
        '<div class="track-route-line"><i class="fas fa-plane"></i></div>' +
        '<div class="track-route-point"><div class="track-route-dot dest"></div><div class="track-route-label">Destination</div><div class="track-route-city">' + escTrack(s.destination) + '</div></div>' +
        '</div>';

    // === Delivery Address ===
    if (s.deliveryAddress) {
        html += '<div class="track-delivery-address" style="background:rgba(29,53,87,0.04);border-radius:10px;padding:14px 18px;margin-bottom:18px;border-left:3px solid #1D3557;">' +
            '<div style="font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;"><i class="fas fa-map-marker-alt" style="color:#E63946;"></i> Delivery Address</div>' +
            '<div style="font-size:14px;color:#1D3557;font-weight:500;">' + escTrack(s.deliveryAddress) + '</div></div>';
    }

    // === Details Grid ===
    html += '<div class="track-details-grid">';
    if (s.type) html += '<div class="track-detail"><div class="track-detail-label">Service Type</div><div class="track-detail-value">' + escTrack(s.type) + '</div></div>';
    if (s.eta) html += '<div class="track-detail"><div class="track-detail-label">Estimated Arrival</div><div class="track-detail-value">' + escTrack(s.eta) + '</div></div>';
    if (s.priority && s.priority !== 'Standard') html += '<div class="track-detail"><div class="track-detail-label">Priority</div><div class="track-detail-value">' + escTrack(s.priority) + '</div></div>';
    if (s.weight) html += '<div class="track-detail"><div class="track-detail-label">Weight</div><div class="track-detail-value">' + escTrack(String(s.weight)) + ' kg</div></div>';
    if (s.pieces && s.pieces > 1) html += '<div class="track-detail"><div class="track-detail-label">Pieces</div><div class="track-detail-value">' + s.pieces + '</div></div>';
    if (s.packaging) html += '<div class="track-detail"><div class="track-detail-label">Packaging</div><div class="track-detail-value">' + escTrack(s.packaging) + '</div></div>';
    if (s.current_location) html += '<div class="track-detail"><div class="track-detail-label">Current Location</div><div class="track-detail-value"><i class="fas fa-map-marker-alt" style="color:#E63946;"></i> ' + escTrack(s.current_location) + '</div></div>';
    if (s.pickupDate) html += '<div class="track-detail"><div class="track-detail-label">Pickup Date</div><div class="track-detail-value">' + escTrack(s.pickupDate) + '</div></div>';
    html += '</div>';

    // === Timeline ===
    if (s.timeline && s.timeline.length > 0) {
        html += '<div class="track-timeline"><h4><i class="fas fa-history"></i> Shipment Timeline</h4>';
        s.timeline.forEach(function(t) {
            var completed = t.completed !== false;
            html += '<div class="track-timeline-item ' + (completed ? 'completed' : 'pending') + '">' +
                '<div class="track-timeline-dot" style="background:' + (completed ? color : '#cbd5e1') + ';"></div>' +
                '<div class="track-timeline-content">' +
                '<div class="track-timeline-time">' + escTrack(t.time || t.date || '') + '</div>' +
                '<div class="track-timeline-event">' + escTrack(t.status || t.event || '') + '</div>' +
                '<div class="track-timeline-location"><i class="fas fa-map-pin"></i> ' + escTrack(t.location || '') + '</div>' +
                '</div></div>';
        });
        html += '</div>';
    }

    // === Description ===
    if (s.description) {
        html += '<div class="track-description"><i class="fas fa-info-circle"></i> ' + escTrack(s.description) + '</div>';
    }

    html += '</div>';
    return html;
}