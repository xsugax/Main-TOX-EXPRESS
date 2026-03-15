// Mock shipment data
const mockShipments = {
    'GP123456789': {
        status: 'In Transit',
        location: 'Port of Rotterdam, Netherlands',
        eta: '2026-02-28',
        history: [
            { date: '2026-02-20', event: 'Shipped from origin', location: 'Shanghai, China' },
            { date: '2026-02-22', event: 'Departed port', location: 'Port of Shanghai' },
            { date: '2026-02-25', event: 'Arrived at hub', location: 'Port of Rotterdam' }
        ]
    },
    'GP987654321': {
        status: 'Delivered',
        location: 'New York, USA',
        eta: 'Delivered on 2026-02-20',
        history: [
            { date: '2026-02-15', event: 'Shipped from origin', location: 'London, UK' },
            { date: '2026-02-18', event: 'Out for delivery', location: 'New York, USA' },
            { date: '2026-02-20', event: 'Delivered', location: 'New York, USA' }
        ]
    },
    'GP555666777': {
        status: 'Processing',
        location: 'Warehouse Singapore',
        eta: '2026-03-01',
        history: [
            { date: '2026-02-21', event: 'Received at warehouse', location: 'Singapore' }
        ]
    }
};

function trackShipment() {
    const trackingNumber = document.getElementById('trackingNumber').value.trim();
    const resultDiv = document.getElementById('trackingResult');
    const detailsDiv = document.getElementById('shipmentDetails');

    if (!trackingNumber) {
        alert('Please enter a tracking number.');
        return;
    }

    // Check if shipment exists in mock data
    const shipment = mockShipments[trackingNumber];

    if (shipment) {
        detailsDiv.innerHTML = `
            <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
            <p><strong>Status:</strong> ${shipment.status}</p>
            <p><strong>Current Location:</strong> ${shipment.location}</p>
            <p><strong>Estimated Delivery:</strong> ${shipment.eta}</p>
            <h4>Shipment History</h4>
            <ul>
                ${shipment.history.map(event => `<li>${event.date}: ${event.event} - ${event.location}</li>`).join('')}
            </ul>
        `;
        resultDiv.style.display = 'block';
    } else {
        // Generate random mock data for any tracking number
        const statuses = ['In Transit', 'Delivered', 'Processing', 'Out for Delivery'];
        const locations = ['Port of Rotterdam', 'New York, USA', 'Singapore', 'London, UK', 'Los Angeles, USA'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const randomLocation = locations[Math.floor(Math.random() * locations.length)];
        const eta = randomStatus === 'Delivered' ? 'Delivered' : '2026-02-' + (Math.floor(Math.random() * 28) + 1);

        detailsDiv.innerHTML = `
            <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
            <p><strong>Status:</strong> ${randomStatus}</p>
            <p><strong>Current Location:</strong> ${randomLocation}</p>
            <p><strong>Estimated Delivery:</strong> ${eta}</p>
            <p>Note: This is a demo tracking system. In a real implementation, this would connect to a backend database.</p>
        `;
        resultDiv.style.display = 'block';
    }
}