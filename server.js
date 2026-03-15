require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== EMAIL TRANSPORTER ====================
let emailTransporter = null;
let emailReady = false;

if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    var smtpConfig;
    if (process.env.EMAIL_HOST) {
        // Custom SMTP provider (Brevo, Mailgun, SendGrid, etc.)
        smtpConfig = {
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: { rejectUnauthorized: true }
        };
    } else {
        // Default: Gmail
        smtpConfig = {
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: { rejectUnauthorized: true }
        };
    }
    emailTransporter = nodemailer.createTransport(smtpConfig);
    emailTransporter.verify(function(err) {
        if (err) {
            console.log('  ⚠️  Email transporter verification failed:', err.message);
            emailReady = false;
        } else {
            console.log('  ✅ Email transporter ready — emails will be sent via SMTP');
            emailReady = true;
        }
    });
} else {
    console.log('  ⚠️  EMAIL_USER / EMAIL_PASSWORD not set — email sending disabled');
}

// ==================== SECURITY: Rate Limiting ====================
const rateLimitMap = new Map();
const loginAttempts = new Map();

function rateLimit(windowMs, maxReqs) {
    return function(req, res, next) {
        var ip = req.ip || req.connection.remoteAddress;
        var now = Date.now();
        var key = ip + ':' + req.path;
        var entry = rateLimitMap.get(key);
        if (!entry || now - entry.start > windowMs) {
            rateLimitMap.set(key, { start: now, count: 1 });
            return next();
        }
        entry.count++;
        if (entry.count > maxReqs) {
            return res.status(429).json({ error: 'Too many requests. Please try again later.' });
        }
        next();
    };
}

// Clean up rate limit map every 5 min
setInterval(function() {
    var now = Date.now();
    rateLimitMap.forEach(function(val, key) {
        if (now - val.start > 300000) rateLimitMap.delete(key);
    });
    loginAttempts.forEach(function(val, key) {
        if (now - val.first > 900000) loginAttempts.delete(key);
    });
}, 300000);

// ==================== SECURITY: Headers ====================
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://translate.google.com https://translate.googleapis.com https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://translate.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: https://images.pexels.com https://*.tile.openstreetmap.org https://server.arcgisonline.com https://*.tile.opentopomap.org https://translate.google.com https://www.google.com https://translate.googleapis.com; " +
        "media-src 'self' https://videos.pexels.com; " +
        "connect-src 'self' https://translate.googleapis.com; " +
        "frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';"
    );
    next();
});

// Middleware
app.use(express.static(__dirname, {
    dotfiles: 'deny',
    index: ['index.html']
}));
app.use(express.json({ limit: '1mb' }));

// Clean URL routes
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Block access to sensitive files
app.use((req, res, next) => {
    var blocked = ['.env', '.git', '.gitignore', 'package-lock.json', 'node_modules'];
    var reqPath = req.path.toLowerCase();
    for (var i = 0; i < blocked.length; i++) {
        if (reqPath.includes(blocked[i])) {
            return res.status(403).json({ error: 'Forbidden' });
        }
    }
    // Prevent path traversal
    if (reqPath.includes('..')) {
        return res.status(400).json({ error: 'Invalid path' });
    }
    next();
});

// ==================== SECURITY: Input Sanitizer ====================
function sanitize(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>"'&]/g, function(c) {
        return { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' }[c];
    }).substring(0, 2000);
}

function sanitizeObj(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    var clean = {};
    Object.keys(obj).forEach(function(key) {
        var safeKey = sanitize(key);
        clean[safeKey] = typeof obj[key] === 'string' ? sanitize(obj[key]) : obj[key];
    });
    return clean;
}

// Data file paths
const dataDir = path.join(__dirname, 'data');
const visitorsFile = path.join(dataDir, 'visitors.json');
const shipmentsFile = path.join(dataDir, 'shipments.json');
const auditLogFile = path.join(dataDir, 'audit-log.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Initialize data files
function initializeDataFiles() {
    if (!fs.existsSync(visitorsFile)) {
        fs.writeFileSync(visitorsFile, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(auditLogFile)) {
        fs.writeFileSync(auditLogFile, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(shipmentsFile)) {
        const defaultShipments = [
            { id: 'TOX-2026-001234', origin: 'Shanghai', destination: 'Rotterdam', type: 'Ocean Freight', status: 'In Transit', progress: 65, eta: '2026-03-10' },
            { id: 'TOX-2026-005678', origin: 'LA', destination: 'Singapore', type: 'Air Cargo', status: 'Processing', progress: 15, eta: '2026-02-28' },
            { id: 'TOX-2026-009012', origin: 'Dubai', destination: 'Miami', type: 'Ground Transport', status: 'Delivered', progress: 100, eta: '2026-02-22' },
            { id: 'TOX-2026-003456', origin: 'Rotterdam', destination: 'New York', type: 'Ocean Freight', status: 'Loading', progress: 30, eta: '2026-03-15' },
            { id: 'TOX-2026-007890', origin: 'Frankfurt', destination: 'Tokyo', type: 'Air Cargo', status: 'In Flight', progress: 72, eta: '2026-02-25' }
        ];
        fs.writeFileSync(shipmentsFile, JSON.stringify(defaultShipments, null, 2));
    }
}

// Logging function
function logAudit(action, details, adminId) {
    try {
        const auditLog = JSON.parse(fs.readFileSync(auditLogFile, 'utf8'));
        // Limit log size to prevent disk exhaustion
        if (auditLog.length > 10000) auditLog.splice(0, auditLog.length - 5000);
        auditLog.push({
            timestamp: new Date().toISOString(),
            action: sanitize(String(action)),
            details: sanitizeObj(details),
            adminId: sanitize(String(adminId || 'system'))
        });
        fs.writeFileSync(auditLogFile, JSON.stringify(auditLog, null, 2));
    } catch(e) { console.error('Audit log error:', e.message); }
}

// Track visitor
function trackVisitor(req) {
    try {
        const visitors = JSON.parse(fs.readFileSync(visitorsFile, 'utf8'));
        // Limit visitor log size
        if (visitors.length > 50000) visitors.splice(0, visitors.length - 25000);
        visitors.push({
            timestamp: new Date().toISOString(),
            ip: req.ip,
            userAgent: sanitize(String(req.get('user-agent') || '').substring(0, 500)),
            path: sanitize(req.path.substring(0, 200))
        });
        fs.writeFileSync(visitorsFile, JSON.stringify(visitors, null, 2));
    } catch(e) { console.error('Visitor tracking error:', e.message); }
}

// Middleware to track all visits
app.use((req, res, next) => {
    if (!req.path.startsWith('/api/admin') && req.path !== '/admin.html' && !req.path.includes('.json')) {
        trackVisitor(req);
    }
    next();
});

// ==================== PUBLIC API ====================

// Get shipment tracking info (rate limited)
app.get('/api/track/:shipmentId', rateLimit(60000, 20), (req, res) => {
    // Accept both old format (TOX-2026-123456) and new format (TOX-SEA-SHRO-260315-849271-K7)
    if (!/^TOX-[A-Z0-9-]{5,40}$/.test(req.params.shipmentId)) {
        return res.status(400).json({ error: 'Invalid tracking number format' });
    }
    const shipments = JSON.parse(fs.readFileSync(shipmentsFile, 'utf8'));
    const shipment = shipments.find(s => s.id === req.params.shipmentId);
    if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found', trackingId: req.params.shipmentId });
    }
    // Return only public-safe fields (not client personal data)
    res.json({
        id: shipment.id,
        origin: shipment.origin,
        destination: shipment.destination,
        deliveryAddress: shipment.deliveryAddress || '',
        status: shipment.status,
        type: shipment.type,
        eta: shipment.eta,
        progress: shipment.progress || 0,
        description: shipment.description || '',
        priority: shipment.priority || 'Standard',
        weight: shipment.weight || null,
        pieces: shipment.pieces || 1,
        packaging: shipment.packaging || '',
        pickupDate: shipment.pickupDate || '',
        createdAt: shipment.createdAt || '',
        timeline: shipment.timeline || [],
        current_location: shipment.current_location || ''
    });
});

// ==================== ADMIN API ====================

// Admin authentication with brute force protection
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ToxAdmin2026';

function verifyAdminToken(req, res, next) {
    const token = req.headers['x-admin-token'];
    if (!token) {
        return res.status(401).json({ error: 'No credentials provided' });
    }
    // Constant-time comparison to prevent timing attacks
    var tokenBuf = Buffer.from(String(token));
    var passBuf = Buffer.from(ADMIN_PASSWORD);
    if (tokenBuf.length !== passBuf.length || !crypto.timingSafeEqual(tokenBuf, passBuf)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// Apply rate limiting to admin routes
app.use('/api/admin', rateLimit(60000, 30));

// Get visitor analytics
app.get('/api/admin/visitors', verifyAdminToken, (req, res) => {
    const visitors = JSON.parse(fs.readFileSync(visitorsFile, 'utf8'));
    const today = new Date().toDateString();
    const todayVisitors = visitors.filter(v => new Date(v.timestamp).toDateString() === today);
    
    res.json({
        totalVisitors: visitors.length,
        todayVisitors: todayVisitors.length,
        weekVisitors: visitors.filter(v => {
            const date = new Date(v.timestamp);
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return date >= oneWeekAgo;
        }).length,
        recentVisitors: visitors.slice(-20)
    });
});

// Get all shipments
app.get('/api/admin/shipments', verifyAdminToken, (req, res) => {
    const shipments = JSON.parse(fs.readFileSync(shipmentsFile, 'utf8'));
    res.json(shipments);
});

// Update shipment status
app.post('/api/admin/shipments/:id/status', verifyAdminToken, (req, res) => {
    const { status } = req.body;
    if (!status || typeof status !== 'string' || status.length > 50) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    const safeStatus = sanitize(status);
    const shipments = JSON.parse(fs.readFileSync(shipmentsFile, 'utf8'));
    const shipment = shipments.find(s => s.id === req.params.shipmentId || s.id === req.params.id);
    
    if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const oldStatus = shipment.status;
    shipment.status = safeStatus;
    fs.writeFileSync(shipmentsFile, JSON.stringify(shipments, null, 2));
    
    logAudit('UPDATE_SHIPMENT_STATUS', {
        shipmentId: req.params.id,
        oldStatus,
        newStatus: status
    }, req.headers['x-admin-id'] || 'admin');
    
    res.json({ success: true, message: `Shipment ${req.params.id} updated to ${status}` });
});

// Cancel shipment
app.post('/api/admin/shipments/:id/cancel', verifyAdminToken, (req, res) => {
    const reason = sanitize(req.body.reason || 'No reason provided');
    const shipments = JSON.parse(fs.readFileSync(shipmentsFile, 'utf8'));
    const shipment = shipments.find(s => s.id === req.params.id);
    
    if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
    }
    
    shipment.status = 'Cancelled';
    shipment.progress = 0;
    fs.writeFileSync(shipmentsFile, JSON.stringify(shipments, null, 2));
    
    logAudit('CANCEL_SHIPMENT', {
        shipmentId: req.params.id,
        reason: reason
    }, req.headers['x-admin-id'] || 'admin');
    
    res.json({ success: true, message: `Shipment ${req.params.id} cancelled` });
});

// Update delivery details
app.post('/api/admin/shipments/:id/delivery', verifyAdminToken, (req, res) => {
    const { progress, eta } = req.body;
    const shipments = JSON.parse(fs.readFileSync(shipmentsFile, 'utf8'));
    const shipment = shipments.find(s => s.id === req.params.id);
    
    if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
    }
    
    if (progress !== undefined) shipment.progress = progress;
    if (eta) shipment.eta = eta;
    fs.writeFileSync(shipmentsFile, JSON.stringify(shipments, null, 2));
    
    logAudit('UPDATE_DELIVERY', {
        shipmentId: req.params.id,
        progress,
        eta
    }, req.headers['x-admin-id'] || 'admin');
    
    res.json({ success: true, message: `Shipment delivery updated` });
});

// Create new shipment
app.post('/api/admin/shipments', verifyAdminToken, (req, res) => {
    const body = sanitizeObj(req.body);
    const { origin, destination, type, weight, eta, status, description } = body;
    if (!origin || !destination || !eta) {
        return res.status(400).json({ error: 'Origin, destination and ETA are required' });
    }
    // Validate ID format if provided
    var id = body.id;
    if (id && !/^TOX-\d{4}-\d{3,6}$/.test(id)) {
        return res.status(400).json({ error: 'Invalid shipment ID format' });
    }
    const shipments = JSON.parse(fs.readFileSync(shipmentsFile, 'utf8'));
    const newShipment = {
        id: id || 'TOX-2026-' + String(Math.floor(Math.random() * 900000) + 100000),
        origin: sanitize(origin), destination: sanitize(destination), type: sanitize(type || 'Ocean Freight'),
        weight: typeof weight === 'number' ? weight : 0, status: sanitize(status || 'Processing'),
        progress: status === 'In Transit' ? 10 : 0,
        eta: sanitize(eta), description: sanitize(description || ''),
        createdAt: new Date().toISOString()
    };
    shipments.push(newShipment);
    fs.writeFileSync(shipmentsFile, JSON.stringify(shipments, null, 2));
    logAudit('CREATE_SHIPMENT', { shipmentId: newShipment.id, origin, destination, type: newShipment.type }, req.headers['x-admin-id'] || 'admin');
    res.json({ success: true, shipment: newShipment });
});

// Get audit logs (regulatory compliance)
app.get('/api/admin/audit-logs', verifyAdminToken, (req, res) => {
    const auditLog = JSON.parse(fs.readFileSync(auditLogFile, 'utf8'));
    res.json(auditLog.slice(-100)); // Last 100 actions
});

// Get dashboard stats
app.get('/api/admin/stats', verifyAdminToken, (req, res) => {
    const visitors = JSON.parse(fs.readFileSync(visitorsFile, 'utf8'));
    const shipments = JSON.parse(fs.readFileSync(shipmentsFile, 'utf8'));
    const auditLog = JSON.parse(fs.readFileSync(auditLogFile, 'utf8'));
    
    const inTransit = shipments.filter(s => s.status === 'In Transit' || s.status === 'In Flight' || s.status === 'Loading').length;
    const delivered = shipments.filter(s => s.status === 'Delivered').length;
    const cancelled = shipments.filter(s => s.status === 'Cancelled').length;
    
    res.json({
        totalVisitors: visitors.length,
        todayVisitors: visitors.filter(v => new Date(v.timestamp).toDateString() === new Date().toDateString()).length,
        totalShipments: shipments.length,
        inTransit,
        delivered,
        cancelled,
        auditActionsToday: auditLog.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length
    });
});

// ==================== EMAIL ENDPOINTS ====================
app.get('/api/admin/email-status', verifyAdminToken, (req, res) => {
    res.json({ connected: emailReady });
});

app.post('/api/admin/send-email', verifyAdminToken, rateLimit(60000, 20), (req, res) => {
    if (!emailReady || !emailTransporter) {
        return res.status(503).json({ success: false, error: 'Email server not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env' });
    }

    var to = req.body.to;
    var subject = req.body.subject;
    var html = req.body.html;
    var clientName = req.body.clientName;
    var shipmentId = req.body.shipmentId;

    if (!to || !subject || !html) {
        return res.status(400).json({ success: false, error: 'Missing required fields: to, subject, html' });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return res.status(400).json({ success: false, error: 'Invalid email address' });
    }

    // Strip any script tags from HTML for safety
    var safeHtml = html.replace(/<script[\s\S]*?<\/script>/gi, '');

    // Generate plain text version for anti-spam compliance
    var plainText = 'Dear ' + (clientName || 'Valued Client') + ',\n\n' +
        safeHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&bull;/g, '•').replace(/&copy;/g, '©').substring(0, 4000) +
        '\n\n---\nTOX Express Delivery Services\n500 TOX Tower, Marina Boulevard, Singapore 018989\nthetoxexpressdeliveryservices@gmail.com | +1-800-TOX-SHIP\nhttps://toxexpress.org';

    var mailOptions = {
        from: '"TOX Express" <' + process.env.EMAIL_USER + '>',
        to: to,
        subject: subject,
        html: safeHtml,
        text: plainText,
        replyTo: process.env.EMAIL_USER,
        headers: {
            'X-Mailer': 'TOX Express Logistics',
            'Organization': 'TOX Express Delivery Services',
            'List-Unsubscribe': '<mailto:' + process.env.EMAIL_USER + '?subject=Unsubscribe>',
            'Precedence': 'bulk'
        }
    };

    emailTransporter.sendMail(mailOptions, function(err, info) {
        if (err) {
            console.error('Email send error:', err.message);
            return res.status(500).json({ success: false, error: 'Failed to send: ' + err.message });
        }

        // Audit log the email send
        try {
            var auditLog = JSON.parse(fs.readFileSync(auditLogFile, 'utf8'));
            auditLog.push({
                action: 'email_sent',
                details: 'Email sent to ' + to + ' — Subject: ' + subject + (shipmentId ? ' [' + shipmentId + ']' : ''),
                timestamp: new Date().toISOString(),
                ip: req.ip || req.connection.remoteAddress
            });
            fs.writeFileSync(auditLogFile, JSON.stringify(auditLog, null, 2));
        } catch(e) { /* audit log write failed — non-critical */ }

        res.json({ success: true, messageId: info.messageId });
    });
});

// Initialize and start server
initializeDataFiles();

app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════════════════════════╗
    ║                                                                ║
    ║     🚢 TOX Express Delivery Services - Server Running              ║
    ║                                                                ║
    ║  🌐 Main Website:  http://localhost:${PORT}                       ║
    ║  📊 Admin Panel:   http://localhost:${PORT}/admin.html          ║
    ║  🌍 Domain:        https://toxexpress.org                     ║
    ║                                                                ║
    ║  Features:                                                    ║
    ║  ✓ Visitor Tracking & Analytics                             ║
    ║  ✓ Shipment Management (Status, Cancel, Delivery)           ║
    ║  ✓ Regulatory Audit Logs                                    ║
    ║  ✓ Admin Dashboard with Real-time Stats                     ║
    ║  ✓ Professional Email System (Nodemailer SMTP)              ║
    ║                                                                ║
    ╚════════════════════════════════════════════════════════════════╝
    `);
});
