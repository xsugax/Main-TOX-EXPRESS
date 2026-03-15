const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Middleware
app.use(express.static(__dirname));
app.use(express.json({ limit: '1mb' }));

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
function logAudit(action, details, adminId = 'system') {
    const auditLog = JSON.parse(fs.readFileSync(auditLogFile, 'utf8'));
    auditLog.push({
        timestamp: new Date().toISOString(),
        action,
        details,
        adminId
    });
    fs.writeFileSync(auditLogFile, JSON.stringify(auditLog, null, 2));
}

// Track visitor
function trackVisitor(req) {
    const visitors = JSON.parse(fs.readFileSync(visitorsFile, 'utf8'));
    visitors.push({
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('user-agent'),
        path: req.path
    });
    fs.writeFileSync(visitorsFile, JSON.stringify(visitors, null, 2));
}

// Middleware to track all visits
app.use((req, res, next) => {
    if (!req.path.startsWith('/api/admin') && req.path !== '/admin.html' && !req.path.includes('.json')) {
        trackVisitor(req);
    }
    next();
});

// ==================== PUBLIC API ====================

// Get shipment tracking info
app.get('/api/track/:shipmentId', (req, res) => {
    const shipments = JSON.parse(fs.readFileSync(shipmentsFile, 'utf8'));
    const shipment = shipments.find(s => s.id === req.params.shipmentId);
    res.json(shipment || { error: 'Shipment not found' });
});

// ==================== ADMIN API ====================

// Admin authentication (simple token-based)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ToxAdmin2026';

function verifyAdminToken(req, res, next) {
    const token = req.headers['x-admin-token'];
    if (token === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

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
    const shipments = JSON.parse(fs.readFileSync(shipmentsFile, 'utf8'));
    const shipment = shipments.find(s => s.id === req.params.id);
    
    if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const oldStatus = shipment.status;
    shipment.status = status;
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
    const { reason } = req.body;
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
        reason: reason || 'No reason provided'
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
    const { id, origin, destination, type, weight, eta, status, description } = req.body;
    if (!origin || !destination || !eta) {
        return res.status(400).json({ error: 'Origin, destination and ETA are required' });
    }
    const shipments = JSON.parse(fs.readFileSync(shipmentsFile, 'utf8'));
    const newShipment = {
        id: id || 'TOX-2026-' + String(Math.floor(Math.random() * 900000) + 100000),
        origin, destination, type: type || 'Ocean Freight',
        weight: weight || 0, status: status || 'Processing',
        progress: status === 'In Transit' ? 10 : 0,
        eta, description: description || '',
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
    ║                                                                ║
    ╚════════════════════════════════════════════════════════════════╝
    `);
});
