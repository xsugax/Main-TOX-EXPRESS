document.addEventListener('DOMContentLoaded', function() {
    // Update KPIs with mock data
    document.getElementById('activeShipments').textContent = '2,847';
    document.getElementById('deliveryVehicles').textContent = '1,203';
    document.getElementById('portsServed').textContent = '156';
    document.getElementById('packagesDelivered').textContent = '89,450';

    // Shipment Status Chart
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['In Transit', 'Delivered', 'Processing', 'Out for Delivery'],
            datasets: [{
                data: [45, 30, 15, 10],
                backgroundColor: ['#003366', '#00a3cc', '#666', '#ccc'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });

    // Monthly Deliveries Chart
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    new Chart(monthlyCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Deliveries',
                data: [8500, 9200, 8800, 9500, 10200, 9800],
                borderColor: '#003366',
                backgroundColor: 'rgba(0, 51, 102, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
});