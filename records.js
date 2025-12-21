// Generate labels for the last 30 days
const last30DaysLabels = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toLocaleDateString();
}).reverse();

// Dummy data for the last 30 days. In a real application, you would fetch this from your database.
const last30DaysData = {
    labels: last30DaysLabels,
    temperature: Array.from({ length: 30 }, () => Math.random() * (28 - 20) + 20),
    ph: Array.from({ length: 30 }, () => Math.random() * (6.8 - 6.0) + 6.0),
    water: Array.from({ length: 30 }, () => Math.random() * 500)
};

// --- Chart.js Setup for Records Page ---
const tempCtx = document.getElementById('temp-chart-records').getContext('2d');
const phCtx = document.getElementById('ph-chart-records').getContext('2d');
const waterCtx = document.getElementById('water-chart-records').getContext('2d');

new Chart(tempCtx, {
    type: 'line',
    data: {
        labels: last30DaysData.labels,
        datasets: [{
            label: 'Temperature',
            data: last30DaysData.temperature,
            borderColor: '#c97c5d',
            fill: false
        }]
    }
});

new Chart(phCtx, {
    type: 'line',
    data: {
        labels: last30DaysData.labels,
        datasets: [{
            label: 'pH Level',
            data: last30DaysData.ph,
            borderColor: '#5f6f52',
            fill: false
        }]
    }
});

new Chart(waterCtx, {
    type: 'bar', // A bar chart is better for daily totals
    data: {
        labels: last30DaysData.labels,
        datasets: [{
            label: 'Water Received (mL)',
            data: last30DaysData.water,
            backgroundColor: '#608b9e'
        }]
    }
});

document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});