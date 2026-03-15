// =====================================================
// TOX EXPRESS DELIVERY SERVICES - Main Script
// =====================================================

// ==========================================
// DATA PERSISTENCE & FORM STATE MANAGEMENT
// ==========================================

const FormDataManager = {
    storageKey: 'tox_express_form_data',
    trackingKey: 'tox_express_tracking_history',

    saveFormData: function(formData) {
        try {
            const existing = this.getFormData();
            const merged = { ...existing, ...formData };
            localStorage.setItem(this.storageKey, JSON.stringify(merged));
            return true;
        } catch (e) { return false; }
    },

    getFormData: function() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (e) { return {}; }
    },

    clearFormData: function() {
        try { localStorage.removeItem(this.storageKey); return true; }
        catch (e) { return false; }
    },

    saveTrackingHistory: function(trackingNumber) {
        try {
            const history = this.getTrackingHistory();
            if (!history.includes(trackingNumber)) {
                history.unshift(trackingNumber);
                if (history.length > 10) history.pop();
                localStorage.setItem(this.trackingKey, JSON.stringify(history));
            }
            return true;
        } catch (e) { return false; }
    },

    getTrackingHistory: function() {
        try {
            const history = localStorage.getItem(this.trackingKey);
            return history ? JSON.parse(history) : [];
        } catch (e) { return []; }
    },

    clearTrackingHistory: function() {
        try { localStorage.removeItem(this.trackingKey); return true; }
        catch (e) { return false; }
    }
};


// ==========================================
// SPLASH SCREEN CONTROLLER
// ==========================================

function initSplashScreen() {
    const splash = document.getElementById('toxSplash');
    if (!splash) return;
    
    // Prevent body scroll during splash
    document.body.style.overflow = 'hidden';
    
    setTimeout(function() {
        splash.classList.add('hidden');
        document.body.style.overflow = '';
        // Remove from DOM after transition
        setTimeout(function() {
            splash.remove();
        }, 800);
    }, 3000);
}


// ==========================================
// NAVIGATION
// ==========================================

function toggleMobileMenu() {
    const menu = document.getElementById('navMenu');
    if (menu) menu.classList.toggle('active');
}

function initNavbar() {
    const navbar = document.getElementById('mainNav');
    if (!navbar) return;
    
    var scrollTicking = false;
    window.addEventListener('scroll', function() {
        if (!scrollTicking) {
            scrollTicking = true;
            requestAnimationFrame(function() {
                if (window.scrollY > 80) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                scrollTicking = false;
            });
        }
    }, { passive: true });

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(function(link) {
        link.addEventListener('click', function() {
            var menu = document.getElementById('navMenu');
            if (menu) menu.classList.remove('active');
        });
    });
}


// ==========================================
// HERO STAT COUNTER ANIMATION
// ==========================================

function animateCounters() {
    var counters = document.querySelectorAll('.stat-number[data-target]');
    counters.forEach(function(counter) {
        var target = parseInt(counter.getAttribute('data-target'));
        var duration = 2500;
        var startTime = null;

        function easeOutExpo(t) {
            return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        }

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var easedProgress = easeOutExpo(progress);
            var current = Math.floor(easedProgress * target);
            counter.textContent = current.toLocaleString();
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                counter.textContent = target.toLocaleString();
                startLivePulse(counter, target);
            }
        }
        requestAnimationFrame(step);
    });
}

function startLivePulse(counter, baseTarget) {
    var label = counter.nextElementSibling ? counter.nextElementSibling.textContent.trim() : '';
    if (label === 'Daily Shipments') {
        var current = baseTarget;
        function gentleTick() {
            current += 1;
            counter.textContent = current.toLocaleString();
            var nextDelay = 6000 + Math.floor(Math.random() * 9000);
            setTimeout(gentleTick, nextDelay);
        }
        setTimeout(gentleTick, 8000);
    } else if (label === 'Countries') {
        setInterval(function() {
            var tick = Math.floor(Math.random() * 3);
            counter.textContent = (baseTarget + tick).toLocaleString();
        }, 8000);
    } else if (label === '% On-Time') {
        var values = [98.7, 99.1, 98.9, 99.3, 99.0, 98.8, 99.2];
        var idx = 0;
        setInterval(function() {
            counter.textContent = values[idx % values.length].toFixed(1);
            idx++;
        }, 5000);
    }
}


// ==========================================
// TESTIMONIALS SLIDER
// ==========================================

var testimonialIndex = 0;
var testimonialInterval;

function currentTestimonial(index) {
    testimonialIndex = index;
    showTestimonial();
}

function showTestimonial() {
    var cards = document.querySelectorAll('.testimonial-card');
    var dots = document.querySelectorAll('.dot');
    
    cards.forEach(function(card, i) {
        card.classList.remove('active');
        if (dots[i]) dots[i].classList.remove('active');
    });
    
    if (cards[testimonialIndex]) {
        cards[testimonialIndex].classList.add('active');
    }
    if (dots[testimonialIndex]) {
        dots[testimonialIndex].classList.add('active');
    }
}

function autoRotateTestimonials() {
    testimonialInterval = setInterval(function() {
        testimonialIndex = (testimonialIndex + 1) % document.querySelectorAll('.testimonial-card').length;
        showTestimonial();
    }, 5000);
}


// ==========================================
// SHIPPING COST CALCULATOR
// ==========================================

var distanceMatrix = {
    newyork: { london: 5571, shanghai: 11862, dubai: 11014, singapore: 15345, tokyo: 10838, sydney: 16014, mumbai: 12555, rotterdam: 5862, hamburg: 6189, lagos: 8305, saopaulo: 7687 },
    london: { newyork: 5571, shanghai: 9205, dubai: 5478, singapore: 10862, tokyo: 9555, sydney: 16983, mumbai: 7192, rotterdam: 358, hamburg: 736, lagos: 5020, saopaulo: 9474 },
    shanghai: { newyork: 11862, london: 9205, dubai: 7405, singapore: 3830, tokyo: 1768, sydney: 7892, mumbai: 4618, rotterdam: 19552, hamburg: 19200, lagos: 12925, saopaulo: 18695 },
    dubai: { newyork: 11014, london: 5478, shanghai: 7405, singapore: 5849, tokyo: 7828, sydney: 12042, mumbai: 1933, rotterdam: 5837, hamburg: 6116, lagos: 6270, saopaulo: 13045 },
    singapore: { newyork: 15345, london: 10862, shanghai: 3830, dubai: 5849, tokyo: 5314, sydney: 6290, mumbai: 3926, rotterdam: 15364, hamburg: 15100, lagos: 10912, saopaulo: 16700 },
    tokyo: { newyork: 10838, london: 9555, shanghai: 1768, dubai: 7828, singapore: 5314, sydney: 7828, mumbai: 6737, rotterdam: 9430, hamburg: 9090, lagos: 13900, saopaulo: 18552 },
    sydney: { newyork: 16014, london: 16983, shanghai: 7892, dubai: 12042, singapore: 6290, tokyo: 7828, mumbai: 10381, rotterdam: 16693, hamburg: 16481, lagos: 16565, saopaulo: 13595 },
    mumbai: { newyork: 12555, london: 7192, shanghai: 4618, dubai: 1933, singapore: 3926, tokyo: 6737, sydney: 10381, rotterdam: 7548, hamburg: 7640, lagos: 7568, saopaulo: 14343 },
    lagos: { newyork: 8305, london: 5020, shanghai: 12925, dubai: 6270, singapore: 10912, tokyo: 13900, sydney: 16565, mumbai: 7568, rotterdam: 5260, hamburg: 5490, saopaulo: 4785 },
    saopaulo: { newyork: 7687, london: 9474, shanghai: 18695, dubai: 13045, singapore: 16700, tokyo: 18552, sydney: 13595, mumbai: 14343, rotterdam: 9816, hamburg: 10070, lagos: 4785 },
    rotterdam: { newyork: 5862, london: 358, shanghai: 19552, dubai: 5837, singapore: 15364, tokyo: 9430, sydney: 16693, mumbai: 7548, hamburg: 472, lagos: 5260, saopaulo: 9816 },
    hamburg: { newyork: 6189, london: 736, shanghai: 19200, dubai: 6116, singapore: 15100, tokyo: 9090, sydney: 16481, mumbai: 7640, rotterdam: 472, lagos: 5490, saopaulo: 10070 }
};

var cityLabels = {
    newyork: 'New York', london: 'London', shanghai: 'Shanghai', dubai: 'Dubai',
    singapore: 'Singapore', tokyo: 'Tokyo', sydney: 'Sydney', mumbai: 'Mumbai',
    lagos: 'Lagos', saopaulo: 'São Paulo', rotterdam: 'Rotterdam', hamburg: 'Hamburg'
};

function calculateShipping() {
    var origin = document.getElementById('calcOrigin').value;
    var dest = document.getElementById('calcDestination').value;
    var weight = parseFloat(document.getElementById('calcWeight').value);
    var method = document.getElementById('calcMethod').value;
    var pkgType = document.getElementById('calcType').value;
    var length = parseFloat(document.getElementById('calcLength').value) || 0;
    var width = parseFloat(document.getElementById('calcWidth').value) || 0;
    var height = parseFloat(document.getElementById('calcHeight').value) || 0;

    var insurance = document.getElementById('calcInsurance').checked;
    var signature = document.getElementById('calcSignature').checked;
    var tracking = document.getElementById('calcTracking').checked;

    // Validation
    if (!origin || !dest) { showAlert('Please select both origin and destination', 'error'); return; }
    if (origin === dest) { showAlert('Origin and destination cannot be the same', 'error'); return; }
    if (!weight || weight <= 0) { showAlert('Please enter a valid weight', 'error'); return; }

    // Get distance
    var dist = (distanceMatrix[origin] && distanceMatrix[origin][dest]) || 8000;

    // Base rate per kg based on method
    var rates = {
        economy: 1.20,
        standard: 2.50,
        express: 5.80,
        overnight: 12.50,
        ocean: 0.45
    };

    var etaDays = {
        economy: '7-14 days',
        standard: '5-7 days',
        express: '2-3 days',
        overnight: 'Next Business Day',
        ocean: '21-45 days'
    };

    // Calculate volumetric weight if dimensions provided
    var volumetricWeight = (length * width * height) / 5000;
    var chargeableWeight = Math.max(weight, volumetricWeight);

    // Base cost
    var baseCost = chargeableWeight * rates[method];

    // Distance factor
    baseCost *= (1 + (dist / 20000));

    // Package type multipliers
    var typeMultipliers = { parcel: 1.0, document: 0.8, fragile: 1.35, hazmat: 1.8, pallet: 1.5 };
    baseCost *= (typeMultipliers[pkgType] || 1.0);

    // Minimum charge
    baseCost = Math.max(baseCost, 15);

    // Extras
    var extrasCost = 0;
    if (insurance) extrasCost += 15;
    if (signature) extrasCost += 5;
    if (tracking) extrasCost += 10;

    var total = baseCost + extrasCost;

    // Display result
    document.getElementById('resultRoute').textContent = (cityLabels[origin] || origin) + ' → ' + (cityLabels[dest] || dest);
    document.getElementById('resultMethod').textContent = method.charAt(0).toUpperCase() + method.slice(1);
    document.getElementById('resultWeight').textContent = chargeableWeight.toFixed(1) + ' kg' + (volumetricWeight > weight ? ' (volumetric)' : '');
    document.getElementById('resultETA').textContent = etaDays[method];
    document.getElementById('resultBase').textContent = '$' + baseCost.toFixed(2);
    document.getElementById('resultExtras').textContent = extrasCost > 0 ? '$' + extrasCost.toFixed(2) : 'None';
    document.getElementById('resultTotal').textContent = '$' + total.toFixed(2);

    document.getElementById('calcResult').style.display = 'block';
    document.getElementById('calcResult').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function bookShipment() {
    showAlert('Booking submitted! Our team will contact you within 1 hour to confirm.', 'success');
}


// ==========================================
// SATELLITE/STREET MAP TRACKING
// ==========================================

var trackingMap = null;
var currentMapLayer = null;
var routePolyline = null;
var shipmentMarkers = [];

var tileLayers = {
    street: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri &mdash; Earthstar Geographics',
        maxZoom: 18
    },
    terrain: {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenTopoMap contributors',
        maxZoom: 17
    }
};

function initTrackingMap() {
    var mapEl = document.getElementById('trackingMap');
    if (!mapEl || trackingMap) return;

    trackingMap = L.map('trackingMap', {
        center: [25, 30],
        zoom: 3,
        zoomControl: true,
        scrollWheelZoom: true
    });

    setMapView('street');
    addDemoShipmentRoutes();
}

function setMapView(type) {
    if (!trackingMap) return;
    
    // Update active button
    document.querySelectorAll('.map-ctrl').forEach(function(btn) { btn.classList.remove('active'); });
    var activeBtn = document.querySelector('.map-ctrl[onclick="setMapView(\'' + type + '\')"]');
    if (activeBtn) activeBtn.classList.add('active');

    // Remove current layer
    if (currentMapLayer) trackingMap.removeLayer(currentMapLayer);

    var layerConfig = tileLayers[type] || tileLayers.street;
    currentMapLayer = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: layerConfig.maxZoom
    });
    currentMapLayer.addTo(trackingMap);
}

function addDemoShipmentRoutes() {
    if (!trackingMap) return;

    // Shipment route data
    var routes = [
        {
            id: 'TOX-2026-001',
            origin: { lat: 31.23, lng: 121.47, name: 'Shanghai' },
            destination: { lat: 51.92, lng: 4.48, name: 'Rotterdam' },
            current: { lat: 30.0, lng: 32.5, name: 'Suez Canal Area' },
            status: 'In Transit',
            color: '#E63946'
        },
        {
            id: 'TOX-2026-002',
            origin: { lat: 33.94, lng: -118.41, name: 'Los Angeles' },
            destination: { lat: 1.35, lng: 103.82, name: 'Singapore' },
            current: { lat: 21.3, lng: -157.8, name: 'Pacific Ocean (Hawaii)' },
            status: 'In Transit',
            color: '#1D3557'
        },
        {
            id: 'TOX-2026-003',
            origin: { lat: 50.04, lng: 8.56, name: 'Frankfurt' },
            destination: { lat: 35.68, lng: 139.69, name: 'Tokyo' },
            current: { lat: 42.0, lng: 75.0, name: 'Central Asia Airspace' },
            status: 'In Flight',
            color: '#E8C84A'
        }
    ];

    routes.forEach(function(route) {
        // Origin marker (green)
        L.circleMarker([route.origin.lat, route.origin.lng], {
            radius: 8, fillColor: '#28a745', color: '#1a7a31', weight: 2, fillOpacity: 0.9
        }).addTo(trackingMap).bindPopup(
            '<strong>Origin:</strong> ' + route.origin.name + '<br>' +
            '<strong>Shipment:</strong> ' + route.id
        );

        // Destination marker (gold)
        L.circleMarker([route.destination.lat, route.destination.lng], {
            radius: 8, fillColor: '#E8C84A', color: '#c79100', weight: 2, fillOpacity: 0.9
        }).addTo(trackingMap).bindPopup(
            '<strong>Destination:</strong> ' + route.destination.name + '<br>' +
            '<strong>Shipment:</strong> ' + route.id
        );

        // Current position marker (red, pulsing)
        var currentMarker = L.circleMarker([route.current.lat, route.current.lng], {
            radius: 10, fillColor: route.color, color: '#fff', weight: 3, fillOpacity: 1
        }).addTo(trackingMap).bindPopup(
            '<strong>Shipment:</strong> ' + route.id + '<br>' +
            '<strong>Status:</strong> ' + route.status + '<br>' +
            '<strong>Location:</strong> ' + route.current.name
        );

        // Route line
        var routePoints = [
            [route.origin.lat, route.origin.lng],
            [route.current.lat, route.current.lng],
            [route.destination.lat, route.destination.lng]
        ];

        L.polyline(routePoints, {
            color: route.color, weight: 2, opacity: 0.6, dashArray: '8, 8'
        }).addTo(trackingMap);

        // Traveled portion (solid)
        L.polyline([
            [route.origin.lat, route.origin.lng],
            [route.current.lat, route.current.lng]
        ], {
            color: route.color, weight: 3, opacity: 0.9
        }).addTo(trackingMap);
    });
}

function focusShipmentOnMap(shipmentId) {
    var cargo = cargoDatabase.find(function(c) { return c.id === shipmentId; });
    if (!cargo || !trackingMap) return;

    var coords = cityCoords[cargo.origin.toLowerCase().replace(/\s+/g, '')];
    if (coords) {
        trackingMap.setView([coords.lat, coords.lng], 5, { animate: true });
    }
}


// ==========================================
// CARGO DATABASE
// ==========================================

var cityCoords = {
    shanghai: { lat: 31.23, lng: 121.47 },
    rotterdam: { lat: 51.92, lng: 4.48 },
    losangeles: { lat: 33.94, lng: -118.41 },
    singapore: { lat: 1.35, lng: 103.82 },
    dubai: { lat: 25.28, lng: 55.30 },
    miami: { lat: 25.76, lng: -80.19 },
    newyork: { lat: 40.71, lng: -74.01 },
    frankfurt: { lat: 50.04, lng: 8.56 },
    tokyo: { lat: 35.68, lng: 139.69 }
};

var cargoDatabase = (function() {
    try {
        var stored = localStorage.getItem('toxActiveShipments');
        if (stored) return JSON.parse(stored);
    } catch(e) {}
    return [
    {
        id: 'TOX-2026-001234',
        origin: 'Shanghai',
        destination: 'Rotterdam',
        status: 'In Transit',
        type: 'Ocean Freight',
        weight: '2,400 kg',
        containers: '2x 40HC',
        eta: '2026-02-28',
        departure: '2026-02-01',
        current_location: 'Suez Canal Area',
        progress: 65,
        timeline: [
            { time: '02:15 Feb 1', location: 'Port of Shanghai', status: 'Departed', completed: true },
            { time: '14:30 Feb 15', location: 'Suez Canal', status: 'Passed through', completed: true },
            { time: '12:00 Feb 28', location: 'Port of Rotterdam', status: 'Expected Arrival', completed: false }
        ]
    },
    {
        id: 'TOX-2026-005678',
        origin: 'Los Angeles',
        destination: 'Singapore',
        status: 'Processing',
        type: 'Air Cargo',
        weight: '500 kg',
        containers: '1x Pallet',
        eta: '2026-02-25',
        departure: '2026-02-22',
        current_location: 'LAX Terminal',
        progress: 15,
        timeline: [
            { time: '08:00 Feb 22', location: 'LAX Cargo Terminal', status: 'Received', completed: true },
            { time: '14:00 Feb 22', location: 'Customs Clearance', status: 'In Process', completed: false },
            { time: '18:00 Feb 25', location: 'Singapore Changi', status: 'Expected', completed: false }
        ]
    },
    {
        id: 'TOX-2026-009012',
        origin: 'Dubai',
        destination: 'Miami',
        status: 'Delivered',
        type: 'Ground Transportation',
        weight: '350 kg',
        containers: '1x Box',
        eta: '2026-02-20',
        departure: '2026-02-18',
        current_location: 'Miami Distribution Center',
        progress: 100,
        timeline: [
            { time: '09:30 Feb 18', location: 'Dubai Warehouse', status: 'Departed', completed: true },
            { time: '16:45 Feb 19', location: 'Dubai Port', status: 'Loaded', completed: true },
            { time: '14:30 Feb 20', location: 'Miami DC', status: 'Delivered', completed: true }
        ]
    },
    {
        id: 'TOX-2026-003456',
        origin: 'Rotterdam',
        destination: 'New York',
        status: 'Loading',
        type: 'Ocean Freight',
        weight: '18,900 kg',
        containers: '5x 40HC',
        eta: '2026-03-05',
        departure: '2026-02-26',
        current_location: 'Port of Rotterdam',
        progress: 30,
        timeline: [
            { time: '06:00 Feb 26', location: 'Port of Rotterdam', status: 'Loading Started', completed: true },
            { time: '18:00 Feb 26', location: 'Port of Rotterdam', status: 'Loading in Progress', completed: false },
            { time: '08:00 Mar 5', location: 'Port of New York', status: 'Expected', completed: false }
        ]
    },
    {
        id: 'TOX-2026-007890',
        origin: 'Frankfurt',
        destination: 'Tokyo',
        status: 'In Flight',
        type: 'Air Cargo',
        weight: '1,200 kg',
        containers: '3x Pallets',
        eta: '2026-02-24',
        departure: '2026-02-23',
        current_location: 'Central Asia Airspace',
        progress: 72,
        timeline: [
            { time: '14:20 Feb 23', location: 'Frankfurt Airport', status: 'Departed', completed: true },
            { time: '09:45 Feb 24', location: 'Central Asia', status: 'In Flight', completed: false },
            { time: '18:30 Feb 24', location: 'Tokyo Narita', status: 'Expected', completed: false }
        ]
    }
];
})();


// ==========================================
// CARGO TRACKING FUNCTIONS
// ==========================================

function renderCargoCards() {
    var cargoGrid = document.querySelector('.cargo-grid');
    if (!cargoGrid) return;
    cargoGrid.innerHTML = '';

    cargoDatabase.forEach(function(cargo) {
        var statusClass = cargo.status === 'Delivered' ? 'status-delivered' :
                          cargo.status === 'In Transit' || cargo.status === 'In Flight' ? 'status-transit' :
                          'status-pending';

        var card = document.createElement('div');
        card.className = 'cargo-card';
        card.setAttribute('role', 'listitem');
        card.setAttribute('tabindex', '0');

        card.innerHTML =
            '<div class="cargo-header">' +
                '<span class="cargo-id">' + cargo.id + '</span>' +
                '<span class="cargo-status ' + statusClass + '">' + cargo.status + '</span>' +
            '</div>' +
            '<div class="cargo-route">' +
                '<i class="fas fa-route"></i> ' + cargo.origin + ' → ' + cargo.destination + '<br>' +
                '<small>' + cargo.type + ' | ' + cargo.weight + '</small>' +
            '</div>' +
            '<div class="cargo-eta">' +
                '<span>ETA: <strong>' + cargo.eta + '</strong></span>' +
                '<span>Progress: <strong>' + cargo.progress + '%</strong></span>' +
            '</div>';

        card.addEventListener('click', function() { openCargoModal(cargo.id); });
        card.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCargoModal(cargo.id); }
        });

        cargoGrid.appendChild(card);
    });
}

function openCargoModal(cargoId) {
    var cargo = cargoDatabase.find(function(c) { return c.id === cargoId; });
    if (!cargo) { showAlert('Shipment not found', 'error'); return; }

    var modalBody = document.getElementById('modalBody');
    var timelineHTML = cargo.timeline.map(function(item) {
        return '<div class="timeline-item">' +
            '<div class="timeline-dot ' + (item.completed ? 'active' : '') + '">' +
                (item.completed ? '<i class="fas fa-check"></i>' : '') +
            '</div>' +
            '<div class="timeline-content">' +
                '<h4>' + item.status + '</h4>' +
                '<p>' + item.location + ' — ' + item.time + '</p>' +
            '</div>' +
        '</div>';
    }).join('');

    modalBody.innerHTML =
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">' +
            '<div><small style="color:#6c757d">Tracking ID</small><br><strong>' + cargo.id + '</strong></div>' +
            '<div><small style="color:#6c757d">Status</small><br><strong>' + cargo.status + '</strong></div>' +
            '<div><small style="color:#6c757d">Type</small><br><strong>' + cargo.type + '</strong></div>' +
            '<div><small style="color:#6c757d">Weight</small><br><strong>' + cargo.weight + '</strong></div>' +
            '<div><small style="color:#6c757d">Origin</small><br><strong>' + cargo.origin + '</strong></div>' +
            '<div><small style="color:#6c757d">Destination</small><br><strong>' + cargo.destination + '</strong></div>' +
            '<div><small style="color:#6c757d">Departure</small><br><strong>' + cargo.departure + '</strong></div>' +
            '<div><small style="color:#6c757d">ETA</small><br><strong>' + cargo.eta + '</strong></div>' +
            '<div style="grid-column:span 2"><small style="color:#6c757d">Current Location</small><br><strong>' + cargo.current_location + '</strong></div>' +
        '</div>' +
        '<h4 style="margin-bottom:16px;color:#1D3557;">Shipment Timeline</h4>' +
        '<div class="timeline-container">' + timelineHTML + '</div>';

    document.getElementById('cargoModal').classList.add('active');
    document.getElementById('cargoModal').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeCargoModal() {
    var modal = document.getElementById('cargoModal');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
}

function downloadShipmentPDF() {
    showAlert('PDF generation is being prepared. Please try again shortly.', 'info');
}

function handleTrackingSearch(event) {
    event.preventDefault();
    var input = document.getElementById('trackingNumber');
    var trackingNumber = input.value.trim().toUpperCase();
    var errorDiv = document.getElementById('searchError');

    if (!trackingNumber) {
        showError(errorDiv, 'Please enter a tracking number');
        return;
    }

    if (!/^TOX-\d{4}-\d{3,6}$/.test(trackingNumber)) {
        showError(errorDiv, 'Invalid format. Use: TOX-YYYY-XXXXXX');
        return;
    }

    var cargo = cargoDatabase.find(function(c) { return c.id === trackingNumber; });
    if (cargo) {
        errorDiv.textContent = '';
        FormDataManager.saveTrackingHistory(trackingNumber);
        showTrackingHistory();
        openCargoModal(trackingNumber);
    } else {
        showError(errorDiv, 'Shipment ' + trackingNumber + ' not found. Try: TOX-2026-001234');
    }
}


// ==========================================
// FORM HANDLING
// ==========================================

function autoFillForms() {
    var savedData = FormDataManager.getFormData();
    if (savedData.name) { var f = document.getElementById('contactName'); if (f) f.value = savedData.name; }
    if (savedData.email) { var f = document.getElementById('contactEmail'); if (f) f.value = savedData.email; }
    if (savedData.company) { var f = document.getElementById('contactCompany'); if (f) f.value = savedData.company; }
    if (savedData.service) { var f = document.getElementById('serviceType'); if (f) f.value = savedData.service; }
}

function showTrackingHistory() {
    var history = FormDataManager.getTrackingHistory();
    var recentSearches = document.getElementById('recentSearches');
    var recentList = document.getElementById('recentSearchesList');
    if (!recentSearches || !recentList) return;

    if (history.length === 0) { recentSearches.style.display = 'none'; return; }

    recentList.innerHTML = history.map(function(num) {
        return '<button type="button" class="btn-secondary" style="font-size:0.85rem;padding:6px 14px;" onclick="quickSearch(\'' + num + '\')">' + num + '</button>';
    }).join('');
    recentSearches.style.display = 'block';
}

function quickSearch(trackingNumber) {
    document.getElementById('trackingNumber').value = trackingNumber;
    handleTrackingSearch(new Event('submit'));
}

function clearSavedData() {
    if (confirm('Clear all saved form data?')) {
        FormDataManager.clearFormData();
        var contactForm = document.querySelector('.contact-form');
        if (contactForm) contactForm.reset();
        showAlert('Saved data cleared', 'success');
    }
}

function clearTrackingHistory() {
    if (confirm('Clear your search history?')) {
        FormDataManager.clearTrackingHistory();
        var el = document.getElementById('recentSearches');
        if (el) el.style.display = 'none';
        showAlert('Search history cleared', 'success');
    }
}

function validateForm(form) {
    var formData = new FormData(form);
    var errors = [];
    if (!formData.get('name') || formData.get('name').trim().length < 2) errors.push('Name must be at least 2 characters');
    var email = formData.get('email');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email');
    if (!formData.get('company') || formData.get('company').trim().length < 2) errors.push('Company name required');
    if (!formData.get('service')) errors.push('Please select a service type');
    if (!formData.get('message') || formData.get('message').trim().length < 10) errors.push('Message must be at least 10 characters');
    return errors;
}

function handleContactForm(event) {
    event.preventDefault();
    var form = event.target;
    var errorDiv = document.getElementById('formError');
    var successDiv = document.getElementById('formSuccess');
    if (errorDiv) errorDiv.innerHTML = '';
    if (successDiv) successDiv.innerHTML = '';

    var errors = validateForm(form);
    if (errors.length > 0) {
        showError(errorDiv, errors.join('. '));
        return;
    }

    var formData = {
        name: form.querySelector('[name="name"]').value,
        email: form.querySelector('[name="email"]').value,
        company: form.querySelector('[name="company"]').value,
        service: form.querySelector('[name="service"]').value
    };
    FormDataManager.saveFormData(formData);

    var submitBtn = form.querySelector('button[type="submit"]');
    var originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    setTimeout(function() {
        if (successDiv) {
            successDiv.textContent = 'Thank you! Your message has been sent. Our team will contact you within 24 hours.';
            successDiv.style.display = 'block';
        }
        form.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;

        setTimeout(function() {
            if (successDiv) successDiv.style.display = 'none';
        }, 6000);
    }, 1500);
}


// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function showError(element, message) {
    if (!element) return;
    element.textContent = message;
    element.style.display = 'block';
}

function showAlert(message, type) {
    var alertDiv = document.createElement('div');
    alertDiv.style.cssText = 'position:fixed;top:24px;right:24px;z-index:99999;padding:16px 24px;border-radius:12px;font-weight:600;font-size:0.95rem;box-shadow:0 8px 30px rgba(0,0,0,0.2);animation:fadeInUp 0.3s ease-out;max-width:400px;';
    
    if (type === 'error') {
        alertDiv.style.background = '#E63946';
        alertDiv.style.color = 'white';
    } else if (type === 'success') {
        alertDiv.style.background = '#28a745';
        alertDiv.style.color = 'white';
    } else {
        alertDiv.style.background = '#1D3557';
        alertDiv.style.color = 'white';
    }
    
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    setTimeout(function() { alertDiv.remove(); }, 4000);
}


// ==========================================
// TIDIO & CHAT
// ==========================================

function initializeTidio() {
    if (typeof tidioChatApi !== 'undefined') {
        tidioChatApi.on('ready', function() {
            tidioChatApi.setCustomData({
                company: 'TOX Express Delivery Services',
                support_team: 'Available 24/7'
            });
        });
    }
}

function toggleChat() {
    var chatWindow = document.getElementById('chatWindow');
    if (chatWindow) {
        chatWindow.classList.toggle('active');
    }
}

function sendChatMessage() {
    var input = document.getElementById('chatInput');
    var messagesDiv = document.getElementById('chatMessages');
    if (!input || !messagesDiv) return;
    var text = input.value.trim();
    if (!text) return;
    // User message
    var userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.innerHTML = '<p>' + text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>';
    messagesDiv.appendChild(userMsg);
    input.value = '';
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    // Bot auto-reply
    setTimeout(function() {
        var replies = [
            'Thank you for reaching out! A support agent will be with you shortly.',
            'We appreciate your message. For urgent inquiries, please call +1-800-TOX-SHIP.',
            'Thanks for contacting TOX Express! Our team typically responds within minutes.',
            'Got it! You can also email us at info@toxexpress.org for detailed assistance.',
            'Thank you! Would you like to track a shipment? Use the tracking section above.'
        ];
        var botMsg = document.createElement('div');
        botMsg.className = 'chat-message bot';
        botMsg.innerHTML = '<p>' + replies[Math.floor(Math.random() * replies.length)] + '</p>';
        messagesDiv.appendChild(botMsg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 1000);
}


// ==========================================
// SCROLL ANIMATIONS
// ==========================================

function initScrollAnimations() {
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.service-card, .wh-feature, .cert-card, .partner-card, .about-img-card, .trust-item, .video-card, .network-region, .step-card, .faq-item, .net-stat').forEach(function(el) {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}


// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. Splash screen
    initSplashScreen();

    // 2. Navigation
    initNavbar();

    // 3. Auto-fill forms
    autoFillForms();
    showTrackingHistory();

    // 4. Render cargo cards
    if (document.querySelector('.cargo-grid')) {
        renderCargoCards();
    }

    // 5. Initialize tracking map
    initTrackingMap();

    // 6. Testimonial auto-rotation
    autoRotateTestimonials();

    // 7. Counter animation (trigger when hero is visible)
    var heroObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                animateCounters();
                heroObserver.disconnect();
            }
        });
    }, { threshold: 0.3 });
    
    var heroSection = document.querySelector('.hero');
    if (heroSection) heroObserver.observe(heroSection);

    // 8. Scroll animations
    initScrollAnimations();

    // 9. Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // 10. Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCargoModal();
        }
    });

    // 11. Click outside modal to close
    var modalEl = document.getElementById('cargoModal');
    if (modalEl) {
        modalEl.addEventListener('click', function(e) {
            if (e.target.id === 'cargoModal') closeCargoModal();
        });
    }

    // 12. Tidio / fallback chat
    initializeTidio();
    setTimeout(function() {
        if (typeof tidioChatApi === 'undefined') {
            var chatWidget = document.getElementById('chatWidget');
            if (chatWidget) chatWidget.style.display = 'block';
        }
    }, 3500);

    // 13. Form auto-save on change (debounced)
    var contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        var formSaveTimer = null;
        contactForm.addEventListener('change', function() {
            clearTimeout(formSaveTimer);
            formSaveTimer = setTimeout(function() {
                FormDataManager.saveFormData({
                    name: contactForm.querySelector('[name="name"]')?.value || '',
                    email: contactForm.querySelector('[name="email"]')?.value || '',
                    company: contactForm.querySelector('[name="company"]')?.value || '',
                    service: contactForm.querySelector('[name="service"]')?.value || ''
                });
            }, 500);
        });
    }

    // 14. Apply saved theme on load
    applyStoredTheme();

    // 15. (Merged into initScrollAnimations)

    // 16. Close language dropdown when clicking outside
    document.addEventListener('click', function(e) {
        var dd = document.getElementById('langDropdown');
        var sel = document.getElementById('langSelector');
        if (dd && sel && !sel.contains(e.target)) {
            dd.classList.remove('active');
        }
    });

    // 17. Live Activity Feed
    initLiveActivityFeed();
});


// ==========================================
// LIVE ACTIVITY FEED ENGINE
// ==========================================

function initLiveActivityFeed() {
    var feed = document.getElementById('activityFeed');
    if (!feed) return;

    var trackingNum = 4821;
    var maxItems = 7;

    var events = [
        { action: 'delivered in', dot: 'dot-green' },
        { action: 'cleared customs in', dot: 'dot-blue' },
        { action: 'picked up from', dot: 'dot-green' },
        { action: 'arrived at', dot: 'dot-blue' },
        { action: 'departed', dot: 'dot-orange' },
        { action: 'in transit to', dot: 'dot-blue' },
        { action: 'loaded onto vessel at', dot: 'dot-orange' },
        { action: 'reached sorting hub in', dot: 'dot-blue' },
        { action: 'out for delivery in', dot: 'dot-green' },
        { action: 'scanned at facility in', dot: 'dot-blue' }
    ];

    var locations = [
        'Rotterdam, NL', 'Dubai, UAE', 'Shanghai Port', 'São Paulo, BR',
        'Narita Airport, JP', 'London, UK', 'Hamburg, DE', 'Singapore, SG',
        'Los Angeles, US', 'Busan, KR', 'Antwerp, BE', 'Mumbai, IN',
        'Hong Kong, HK', 'Sydney, AU', 'Cape Town, ZA', 'Toronto, CA',
        'Jeddah, SA', 'Istanbul, TR', 'Bangkok, TH', 'Miami, US',
        'Felixstowe, UK', 'Genoa, IT', 'Piraeus, GR', 'Barcelona, ES',
        'Vancouver, CA', 'Yokohama, JP', 'Colombo, LK', 'Durban, ZA',
        'Melbourne, AU', 'Karachi, PK', 'Lima, PE', 'Panama City, PA',
        'Oslo, NO', 'Stockholm, SE', 'Helsinki, FI', 'Warsaw, PL',
        'Lisbon, PT', 'Dublin, IE', 'Marseille, FR', 'Mombasa, KE'
    ];

    var usedCombos = new Set();

    function getUniqueEvent() {
        var combo;
        var evt, loc;
        var attempts = 0;
        do {
            evt = events[Math.floor(Math.random() * events.length)];
            loc = locations[Math.floor(Math.random() * locations.length)];
            combo = evt.action + '|' + loc;
            attempts++;
            if (attempts > 80) { usedCombos.clear(); }
        } while (usedCombos.has(combo));
        usedCombos.add(combo);
        if (usedCombos.size > 300) {
            var arr = Array.from(usedCombos);
            usedCombos = new Set(arr.slice(arr.length - 100));
        }
        return { evt: evt, loc: loc };
    }

    function createItem(secondsAgo) {
        trackingNum++;
        var padded = String(trackingNum).padStart(6, '0');
        var pick = getUniqueEvent();
        var timeText = secondsAgo < 60 ? 'just now' :
                       secondsAgo < 120 ? '1 min ago' :
                       Math.floor(secondsAgo / 60) + ' min ago';

        var item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML =
            '<div class="activity-dot ' + pick.evt.dot + '"></div>' +
            '<div class="activity-content">' +
                '<p><strong>TOX-2026-' + padded + '</strong> ' + pick.evt.action + ' <strong>' + pick.loc + '</strong></p>' +
                '<span class="activity-time">' + timeText + '</span>' +
            '</div>';
        return item;
    }

    // Seed initial items
    var seedTimes = [120, 300, 480, 720, 960, 1200, 1500];
    for (var i = 0; i < seedTimes.length; i++) {
        feed.appendChild(createItem(seedTimes[i]));
    }

    // Pause feed when tab is hidden to save CPU
    var feedPaused = false;
    var feedTimer = null;
    document.addEventListener('visibilitychange', function() {
        feedPaused = document.hidden;
        if (!feedPaused && !feedTimer) scheduleFeed();
    });

    // Add new entry every 4-9 seconds
    function addNewEntry() {
        feedTimer = null;
        if (feedPaused) return;

        var newItem = createItem(0);
        newItem.style.cssText = 'opacity:0;transform:translateX(-20px);transition:opacity 0.5s ease,transform 0.5s ease;will-change:opacity,transform;';
        feed.insertBefore(newItem, feed.firstChild);

        // Animate in
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                newItem.style.opacity = '1';
                newItem.style.transform = 'translateX(0)';
                // Clean will-change after animation
                setTimeout(function() { newItem.style.willChange = 'auto'; }, 600);
            });
        });

        // Remove oldest if over max
        while (feed.children.length > maxItems) {
            feed.removeChild(feed.lastChild);
        }

        // Age existing timestamps
        var items = feed.querySelectorAll('.activity-time');
        for (var j = 0; j < items.length; j++) {
            var txt = items[j].textContent;
            if (txt === 'just now') { items[j].textContent = '1 min ago'; }
            else {
                var m = txt.match(/(\d+)\s*min/);
                if (m) { items[j].textContent = (parseInt(m[1]) + 1) + ' min ago'; }
            }
        }

        scheduleFeed();
    }

    function scheduleFeed() {
        if (feedTimer) return;
        var next = 4000 + Math.floor(Math.random() * 5000);
        feedTimer = setTimeout(addNewEntry, next);
    }

    // Start after first delay
    scheduleFeed();
}


// ==========================================
// DARK / LIGHT MODE TOGGLE
// ==========================================

function toggleTheme() {
    var html = document.documentElement;
    var icon = document.getElementById('themeIcon');
    if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
        if (icon) { icon.className = 'fas fa-moon'; }
        localStorage.setItem('toxTheme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        if (icon) { icon.className = 'fas fa-sun'; }
        localStorage.setItem('toxTheme', 'dark');
    }
}

function applyStoredTheme() {
    var saved = localStorage.getItem('toxTheme');
    var icon = document.getElementById('themeIcon');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (icon) icon.className = 'fas fa-sun';
    }
}


// ==========================================
// LANGUAGE SELECTOR (Google Translate)
// ==========================================

function toggleLangMenu() {
    var dd = document.getElementById('langDropdown');
    if (dd) dd.classList.toggle('active');
}

function switchLang(langCode, label) {
    // Update button label
    var el = document.getElementById('currentLang');
    if (el) el.textContent = label;

    // Close dropdown
    var dd = document.getElementById('langDropdown');
    if (dd) dd.classList.remove('active');

    // Trigger Google Translate
    triggerGoogleTranslate(langCode);
}

function triggerGoogleTranslate(lang) {
    // Set the Google Translate cookie
    var domain = location.hostname;
    if (lang === 'en') {
        // Reset to original
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + domain;
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        // Use the API to reset without reloading
        var frame = document.querySelector('.goog-te-combo');
        if (frame) {
            frame.value = 'en';
            frame.dispatchEvent(new Event('change'));
        }
        return;
    }
    document.cookie = 'googtrans=/en/' + lang + '; path=/; domain=' + domain;
    document.cookie = 'googtrans=/en/' + lang + '; path=/';

    // Use the translate combo API (no page reload)
    var frame = document.querySelector('.goog-te-combo');
    if (frame) {
        frame.value = lang;
        frame.dispatchEvent(new Event('change'));
    }
}

// Callback for Google Translate script
function googleTranslateInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'en',
        autoDisplay: false,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
}

// Hide Google Translate top bar after it loads
(function hideGoogleTranslateBar() {
    var style = document.createElement('style');
    style.textContent = '.goog-te-banner-frame, .skiptranslate { display: none !important; } body { top: 0 !important; }';
    document.head.appendChild(style);
})();
