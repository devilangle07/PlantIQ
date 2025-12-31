
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, runTransaction, setDoc, addDoc, collection, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyDNMfodEExwe3eYW9CO890sD-hnaUiac9A",
    authDomain: "plantiq-03764124-c572a.firebaseapp.com",
    projectId: "plantiq-03764124-c572a",
    storageBucket: "plantiq-03764124-c572a.firebasestorage.app",
    messagingSenderId: "478715716038",
    appId: "1:478715716038:web:86d6923715c51a80b112c7"
};

// --- API Keys ---
const WEATHER_API_KEY = "2a25270839a2f071f114217151302b88";

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Global State ---
let unsubscribePlantListeners = () => {};

// --- UI Elements ---
const plantContainer = document.getElementById('plant-container');
const simulatePlantBtn = document.getElementById('simulate-data-btn');
const waterButton = document.getElementById('water-button');
const lightButton = document.getElementById('light-button');
const simulateDataButton = document.getElementById('simulate-data-button');
const tempLogEl = document.getElementById('temp-log');
const moistureLogEl = document.getElementById('moisture-log');
const phLogEl = document.getElementById('ph-log');
const temperatureEl = document.getElementById('temperature');
const weatherDescriptionEl = document.getElementById('weather-description');
const weatherLogListEl = document.getElementById('weather-log-list');

// --- Chart.js Setup ---
const ctx = document.getElementById('data-chart').getContext('2d');
const dataChart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [
            { label: 'Temperature (°C)', data: [], borderColor: '#FF6384', fill: false, tension: 0.4 },
            { label: 'Moisture (%)', data: [], borderColor: '#36A2EB', fill: false, tension: 0.4 },
            { label: 'pH Level', data: [], borderColor: '#FFCE56', fill: false, tension: 0.4 },
        ]
    },
    options: { scales: { x: { type: 'time', time: { unit: 'second', displayFormats: { second: 'h:mm:ss a' } }, title: { display: true, text: 'Time' } } }, animation: { duration: 0 }, hover: { animationDuration: 0 }, responsiveAnimationDuration: 0 }
});

// ===============================================================================================
//   MAIN APP LOGIC
// ===============================================================================================
signInAnonymously(auth)
    .then((result) => {
        const userId = result.user.uid;
        initializeApp(userId);
    })
    .catch((error) => {
        console.error("Anonymous sign-in failed:", error);
        document.body.innerHTML = "<h1>Authentication Failed</h1><p>Could not connect to the service. Please try again later.</p>";
    });

function initializeApp(userId) {
    const gardenId = "garden1";
    const plantId = "plant1";
    let lightState = false;

    const plantDocRef = doc(db, "users", userId, "gardens", gardenId, "plants", plantId);

    // Correctly handle the two separate simulate buttons
    simulatePlantBtn.addEventListener('click', () => {
        setDoc(doc(db, "users", userId, "gardens", gardenId), { totalPoints: 0 });
        setDoc(plantDocRef, { growthLevel: 0, isWatered: false });
    });

    simulateDataButton.addEventListener('click', () => {
        const goodData = {
            temperature: { value: 22 + (Math.random() * 2 - 1), status: "optimal" },
            moisture: { value: 65 + (Math.random() * 10 - 5), status: "optimal" },
            ph: { value: 6.5 + (Math.random() * 0.2 - 0.1), status: "optimal" },
            timestamp: new Date()
        };
        setDoc(doc(db, "iot-data", "latest"), goodData);
    });

    // This listener safely controls the mounting/unmounting of the plant component
    onSnapshot(plantDocRef, (plantDoc) => {
        if (plantDoc.exists()) {
            mountPlantComponent(plantContainer, userId, gardenId, plantId);
            simulatePlantBtn.style.display = 'none';
        } else {
            unmountPlantComponent(plantContainer);
            simulatePlantBtn.style.display = 'block';
        }
    });

    // --- Other Event Listeners ---
    waterButton.addEventListener('click', () => updateDoc(doc(db, "commands", "latest"), { water: true, timestamp: new Date() }));
    lightButton.addEventListener('click', () => {
        lightState = !lightState;
        updateDoc(doc(db, "commands", "latest"), { light: lightState, timestamp: new Date() });
        lightButton.style.boxShadow = lightState ? "inset 6px 6px 10px #a3b1c6, inset -6px -6px 10px #ffffff" : "";
    });

    setupFirestoreListeners();

    navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(51.5072, -0.1276)
    );
}

// ===============================================================================================
//   FIRESTORE LISTENERS
// ===============================================================================================
function setupFirestoreListeners() {
    onSnapshot(doc(db, "iot-data", "latest"), (doc) => {
        const data = doc.data();
        if (!data) return;
        tempLogEl.innerHTML = `<lord-icon src="https://cdn.lordicon.com/whtfgdfv.json" trigger="loop" colors="primary:#6c63ff"></lord-icon> <strong>TEMP:</strong> ${data.temperature?.value?.toFixed(1) || '--'}°C`;
        moistureLogEl.innerHTML = `<lord-icon src="https://cdn.lordicon.com/uqpazftn.json" trigger="loop" colors="primary:#6c63ff"></lord-icon> <strong>MOIST:</strong> ${data.moisture?.value?.toFixed(1) || '--'}%`;
        phLogEl.innerHTML = `<lord-icon src="https://cdn.lordicon.com/vasbqwms.json" trigger="loop" colors="primary:#6c63ff"></lord-icon> <strong>pH:</strong> ${data.ph?.value?.toFixed(1) || '--'}`;
        updateChart(data);
    });

    const q = query(collection(db, "weather-logs"), orderBy("timestamp", "desc"), limit(5));
    onSnapshot(q, (querySnapshot) => {
        if (querySnapshot.empty) {
            weatherLogListEl.innerHTML = "<li>No weather data logged yet.</li>";
            return;
        }
        weatherLogListEl.innerHTML = "";
        querySnapshot.forEach((doc) => {
            const log = doc.data();
            const listItem = document.createElement("li");
            listItem.textContent = `${log.timestamp.toDate().toLocaleTimeString()}: ${log.temp.toFixed(1)}°C, ${log.description}`;
            weatherLogListEl.appendChild(listItem);
        });
    });
}

// ===============================================================================================
//   PLANT COMPONENT - STABLE VERSION
// ===============================================================================================
function mountPlantComponent(container, userId, gardenId, plantId) {
    if (container.innerHTML.includes('plant-wrapper')) {
        return; // Component already mounted, do nothing.
    }

    const growthStages = [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABGklEQVRIS+2WwQ3CMAxE95sNxAZlE2ADG4gNlA3sEGaQjZQN7JAuUaxkKkUNFIgl6ZdTn/4V7s/F5ufhcyS5/yYnT8hYpp4xZ33tB2BOSMmaSJZ3o9YV1xO21pLcB3A2Wj/jBE4A2C/E+Jk7QGgAZyZ8psAtg2T5JAHYlQ8pC5p2x+SkHpiBuYgHsSgKiqK4rqPNAIPwLpX0Qisw3Rcg2L/k+SUEs5IdQfMr9rYAMz0ZpwtQd29Zc01gO8m2A8DAHYx2I/r2gPAGD8Bf2p3p+f6e3L/fQAUgnETVv9VdUGx9+f7qy8m2B5A2J//31/kCeC+wP+A6wOWZEmS15KkfkA2oGqBmoA3/gng3wP9+gxwZZ35jCr4F8Cf2R0A7XwA99QYAWQG+hYAAAAASUVORK5CYII=",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABjklEQVRIS+2VwY3CMAyG8yYMA2ADG4gNwgZJA2UDOwQbhA2UDewgmEDZxJAhCUlE895JyZ/8Kdv/5bfjxYX/sRnH0YyXhDwhJGuS0s9rW1udr3W2t/YPgGxUFDWcJOlf+f44B2B0AOC1xPfZi30AGgIcjv9LgB2DtC8+lmkHoBWIv2gEBuYhLsQT6Mfd8xP90LhGg9gA7A3s/b2ZpAQQzkhVAPgL19wAMzCb83YEHdi2bgmAsQzW/QDweYKN8z1zADZLsD0fAAD2MWyP12sAcA8uAE89mZzfn/0PMAFEwS/+reQ3gPYZJtt/zD96AIgH4f+i5xcAnwT+D/j+/k+S2gGWZEmS1AvkGahqiBrwBt8B/KvA3wP67TPgiq7yG1XwL4B/a3eG9fMA3FvjCJDfE4wGAAAAAElFTkSuQmCC",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACxElEQVR4Xu2WwZKCMAyG8zZMA2kDGzCNkA3sEG4QNtI3sEGYQNtI3sAMgmayYSQk+kOEZD5kKv+l/C9fsCH6vzhxHD8iPhBfgHwgrgjhAVhPCh/ApL9XFf28eFAhfAASYPlBFwQMAo+B85Gegb8y/nMA8ADoB+ZJOgE+kAmYCcgETABk+gBMAKb3gAlAw+N/A4wAjcAD4P/lO/ABeAN0gP6AJwLpARsAO/ABqgBGAH94AxTAk/oBnAUMHkAbAI8S/gD5QG0APw/Ev+b+twB6AGoAPaB9AI8B6QF4B/wP2D6gH3A7wJIkSRqBNCA1QVQDYoM3AX9q8C+A3j4DXFHnPzPFPwX8q90Z1u0DcG+NI0B+TjAaAAAAAElFTkSuQmCC",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAC+ElEQVR4Xu2ZwY7CMAyG82YMYQPYQGwgHMIGcoaygR1kDWUD2UFWUDbSRaYyKkUqEU+c7Mmf8lO2/+V3+cGG4Y9Dnudfs4D9gBWAJYAOgFUAqgBGAEsAPwDDAXwBfACyADwAXAEoAZwBHAEcARwBXAGgAngA8ABwAdABcACAAbABsAFwB3gB3AGeAbwCPAG8AlgC2AGYAPwCzADYAMACeABuAdwAngBvAG8AqwCrAGoAVgBUAKwAqAFFABvBvgIYA+9wANxTYD7DxPwV8q90R1rUDcG+NIUB+TTAYAAAAAElFTkSuQmCC",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAADKElEQVR4Xu2dwZKCMAyGsyZMA2EDmEAYQd7ADvEGtY28gT3CDlI3sEPaRsYyKWUqYxIn4ZEP8uXlJyfdX5Y07Cj++OR5/hXyDsgDkAdQByAOCEcAcADwgHgAXCGOAOkGvARwAxAHIB6ARwDxACwAyga8BHAXIA+IB8ADIA+IBsAyQG8BfAQwD2gAWFMA8wDGAcYAywBWAKAAYAFQBVADYAawBfDWgF8Avb4DXPHv/sxU/Cvgv9odsW4fAPeucQTI7wmGAgAAAABJRU5ErkJggg==",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAADWUlEQVR4Xu2cwY7CMAyG82YMA2kD2EAYJA1lA9lB2UDWUDaQN5A1jC3sIFPZqEQpIuKJD8l/yU/J/pdv2RA4/HF4nv8G+APyAeQAVAGUAMwAkgBKAAYAagBGAFcArQCSADgAeABIAPAAkAOAAMABwAHAAkAFAAKAAVAAUAAwARgAmACMAEYAIwARgAHAAYANgA2ADYAJgAmACYA9gD2APQAZgAzAGMAMwAyADIA8gDzA3AAzAHOAsgBZgKWANQAvgDWAJQCXAG4A3AC4ArgCuAIwAVAFeALAHeBfAU0B9rkBbihwH2Djfwry13ZErNsH4N4aR4D8mmAwAAAAAElFTkSuQmCC"
    ];

    container.innerHTML = `
        <div class="plant-wrapper">
            <div class="plant-info"><h3>Your Smart Garden Plant</h3><p id="points-display">Points: 0</p><button id="water-plant-btn">Water Plant</button></div>
            <div class="plant-visual">
                <svg id="plant-svg" width="300" height="400" viewBox="0 0 300 400">
                    <image id="plant-image" href="${growthStages[0]}" x="50" y="150" width="200" height="200"/>
                    <circle class="droplet" cx="130" cy="50" r="5" fill="#00BFFF" opacity="0" /><circle class="droplet" cx="150" cy="30" r="5" fill="#00BFFF" opacity="0" /><circle class="droplet" cx="170" cy="70" r="5" fill="#00BFFF" opacity="0" />
                </svg>
            </div>
        </div>`;

    const style = document.createElement('style');
    style.textContent = `
        .plant-wrapper { display: flex; flex-direction: column; align-items: center; font-family: Arial, sans-serif; background: linear-gradient(to bottom, #87CEEB, #98FB98); padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); max-width: 400px; margin: auto; }
        .plant-info { text-align: center; margin-bottom: 20px; } #points-display { font-size: 18px; font-weight: bold; color: #2E8B57; }
        #water-plant-btn { padding: 10px 20px; background: #00BFFF; color: white; border: none; border-radius: 5px; cursor: pointer; transition: background 0.3s; } #water-plant-btn:hover { background: #009ACD; }
        #plant-image { transition: opacity 0.5s ease-in-out; } .droplet.animate { animation: fall 1.5s ease-in-out forwards; }
        @keyframes fall { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(250px); opacity: 0; } }
        #plant-svg.dancing { animation: dance 0.5s ease-in-out 3 alternate; }
        @keyframes dance { 0% { transform: translateX(-5px) rotate(-2deg); } 100% { transform: translateX(5px) rotate(2deg); } }
    `;
    document.head.appendChild(style);

    document.getElementById('water-plant-btn').addEventListener('click', () => {
        const droplets = document.querySelectorAll('.droplet');
        droplets.forEach(d => d.classList.add('animate'));
        setTimeout(() => {
            runTransaction(db, async (transaction) => {
                const gardenRef = doc(db, 'users', userId, 'gardens', gardenId);
                const plantRef = doc(db, 'users', userId, 'gardens', gardenId, 'plants', plantId);
                const gardenDoc = await transaction.get(gardenRef);
                const plantDoc = await transaction.get(plantRef);
                if (!gardenDoc.exists() || !plantDoc.exists()) { throw "Documents do not exist!"; }
                const newPoints = (gardenDoc.data().totalPoints || 0) + 10;
                const newGrowth = (plantDoc.data().growthLevel || 0) + 10;
                transaction.update(gardenRef, { totalPoints: newPoints });
                transaction.update(plantRef, { growthLevel: newGrowth });
                document.getElementById('plant-svg').classList.add('dancing');
            }).catch(error => console.error('Error watering plant:', error));
            setTimeout(() => {
                droplets.forEach(d => d.classList.remove('animate'));
                document.getElementById('plant-svg')?.classList.remove('dancing');
            }, 1500);
        }, 1500);
    });

    const plantRef = doc(db, 'users', userId, 'gardens', gardenId, 'plants', plantId);
    const gardenRef = doc(db, 'users', userId, 'gardens', gardenId);

    const unsubPlant = onSnapshot(plantRef, (plantDoc) => {
        const data = plantDoc.data();
        if (!data) return;
        const stageIndex = Math.min(Math.floor((data.growthLevel || 0) / 20), growthStages.length - 1);
        const plantImage = document.getElementById('plant-image');
        if (plantImage && plantImage.getAttribute('href') !== growthStages[stageIndex]) {
            plantImage.style.opacity = 0;
            setTimeout(() => {
                plantImage.setAttribute('href', growthStages[stageIndex]);
                plantImage.style.opacity = 1;
            }, 500);
        }
    });

    const unsubGarden = onSnapshot(gardenRef, (gardenDoc) => {
        const pointsDisplay = document.getElementById('points-display');
        if (pointsDisplay) {
            pointsDisplay.textContent = `Points: ${gardenDoc.data()?.totalPoints || 0}`;
        }
    });

    unsubscribePlantListeners = () => {
        unsubPlant();
        unsubGarden();
    };
}

function unmountPlantComponent(container) {
    unsubscribePlantListeners();
    unsubscribePlantListeners = () => {};
    container.innerHTML = "";
}

// ===============================================================================================
//   UTILITY FUNCTIONS
// ===============================================================================================
async function fetchWeather(lat, lon) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`);
        if (!response.ok) throw new Error("Weather API request failed");
        const data = await response.json();
        updateWeatherUI(data);
        logWeatherData(data);
    } catch (error) {
        console.error("Error fetching weather:", error);
        temperatureEl.textContent = "N/A";
        weatherDescriptionEl.textContent = "Could not fetch weather";
    }
}

function updateWeatherUI(data) {
    temperatureEl.textContent = `${Math.round(data.main.temp)}°C`;
    weatherDescriptionEl.textContent = data.weather[0].description;
}

async function logWeatherData(data) {
    try {
        await addDoc(collection(db, "weather-logs"), {
            timestamp: new Date(),
            temp: data.main.temp,
            description: data.weather[0].description
        });
    } catch (e) {
        console.error("Error adding weather log: ", e);
    }
}

function updateChart(data) {
    const now = new Date();
    if (dataChart.data.labels.length > 30) {
        dataChart.data.labels.shift();
        dataChart.data.datasets.forEach(dataset => dataset.data.shift());
    }
    dataChart.data.labels.push(now);
    dataChart.data.datasets[0].data.push(data.temperature?.value || null);
    dataChart.data.datasets[1].data.push(data.moisture?.value || null);
    dataChart.data.datasets[2].data.push(data.ph?.value || null);
    dataChart.update('none');
}
