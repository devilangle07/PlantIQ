const firebaseConfig = {
    apiKey: "API_KEY",
    authDomain: "PROJECT_ID.firebaseapp.com",
    databaseURL: "https://PROJECT_ID.firebaseio.com",
    projectId: "PROJECT_ID",
    storageBucket: "PROJECT_ID.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID",
  };

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const iotDataRef = database.ref('iot-data');

// --- Plant Growth Images ---
const plantGrowthStages = {
    tree: [
        "https://i.imgur.com/8z83Y7c.png",
        "https://i.imgur.com/0I04Tz6.png",
        "https://i.imgur.com/2oV3o7c.png",
        "https://i.imgur.com/2OKL7Jg.png",
        "https://i.imgur.com/Z5gJ1p0.png"
    ],
    shrub: [
        "https://i.imgur.com/8z83Y7c.png",
        "https://i.imgur.com/0I04Tz6.png",
        "https://i.imgur.com/v8Na3y9.png",
        "https://i.imgur.com/Uo2wS4c.png",
    ]
};

// --- Core App State ---
let growthScore = 0;
let currentPlantType = 'tree';
let currentData = { temp: null, moisture: null, ph: null };

// --- UI Elements ---
const growthScoreEl = document.getElementById('growth-score');
const plantImageEl = document.getElementById('plant-image');
const tempLogEl = document.getElementById('temp-log');
const moistureLogEl = document.getElementById('moisture-log');
const phLogEl = document.getElementById('ph-log');
const alertEl = document.getElementById('smart-alerts');
const plantTypeSelector = document.getElementById('plant-type-selector');

// --- Chart.js Setup ---
const ctx = document.getElementById('data-chart').getContext('2d');
const dataChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            { label: 'Temperature', data: [], borderColor: '#c97c5d', fill: false }
        ]
    },
    options: {
        scales: {
            y: { beginAtZero: false, ticks: { color: '#5d4037' }, grid: { color: '#d2b48c' } },
            x: { ticks: { color: '#5d4037' }, grid: { color: '#d2b48c' } }
        },
        plugins: { legend: { labels: { color: '#5d4037' } } }
    }
});

// --- Event Listeners ---
plantTypeSelector.addEventListener('change', (e) => {
    currentPlantType = e.target.value;
    growthScore = 0;
    updatePlantVisual();
});

// --- Main Data Processing Loop ---
iotDataRef.on('value', (snapshot) => {
    const data = snapshot.val();
    processData(data);
    updateChart();
    runAI();
});

function processData(data) {
    currentData.temp = data.temperature?.value || currentData.temp;
    currentData.moisture = data.moisture?.value || currentData.moisture;
    currentData.ph = data.ph?.value || currentData.ph;

    tempLogEl.textContent = `TEMP: ${currentData.temp}°C`;
    moistureLogEl.textContent = `MOIST: ${currentData.moisture}%`;
    phLogEl.textContent = `pH: ${currentData.ph}`;
}

function updateChart() {
    const now = new Date().toLocaleTimeString();
    dataChart.data.labels.push(now);
    dataChart.data.datasets[0].data.push(currentData.temp);

    if (dataChart.data.labels.length > 20) {
        dataChart.data.labels.shift();
        dataChart.data.datasets[0].data.shift();
    }
    dataChart.update();
}

function runAI() {
    const optimalConditions = {
        temp: { min: 20, max: 28 },
        moisture: { min: 50, max: 70 },
        ph: { min: 6.0, max: 6.8 }
    };

    let alertMessage = 'SYSTEMS NOMINAL';
    let conditionsMet = true;

    if (currentData.temp < optimalConditions.temp.min || currentData.temp > optimalConditions.temp.max) {
        alertMessage = '!! CRITICAL TEMPERATURE ALERT !!';
        conditionsMet = false;
    }
    if (currentData.moisture < optimalConditions.moisture.min || currentData.moisture > optimalConditions.moisture.max) {
        alertMessage = '!! SOIL MOISTURE ALERT !!';
        conditionsMet = false;
    }
    if (currentData.ph < optimalConditions.ph.min || currentData.ph > optimalConditions.ph.max) {
        alertMessage = '!! pH LEVEL ALERT !!';
        conditionsMet = false;
    }

    alertEl.textContent = alertMessage;
    if (conditionsMet) {
        alertEl.classList.remove('alert-active');
        growthScore++;
    } else {
        alertEl.classList.add('alert-active');
    }

    growthScoreEl.textContent = growthScore;
    updatePlantVisual();
}

function updatePlantVisual() {
    const stages = plantGrowthStages[currentPlantType];
    const stageIndex = Math.min(Math.floor(growthScore / 10), stages.length - 1);
    plantImageEl.src = stages[stageIndex];
}

// Initial call to set the scene
updatePlantVisual();