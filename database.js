
// TODO: Replace with your project's customized Firebase snippet.
const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "PROJECT_ID.firebaseapp.com",
  databaseURL: "https://PROJECT_ID.firebaseio.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();

// Get a reference to the 'iot-data' node
const iotDataRef = database.ref('iot-data');

// Display connection status
const connectionStatus = document.getElementById('connection-status');
const dbConnection = database.ref('.info/connected');
dbConnection.on('value', (snap) => {
  if (snap.val() === true) {
    connectionStatus.innerHTML = 'Connected to the database.';
  } else {
    connectionStatus.innerHTML = 'Connection to the database failed.';
  }
});

// Get the iot-data containers
const iotDataContainer = document.getElementById('iot-data');
const iotDataRecordsContainer = document.getElementById('iot-data-records');

function createSensorCard(sensor) {
    const sensorCard = document.createElement('div');
    sensorCard.classList.add('sensor-card');

    const sensorName = document.createElement('h2');
    sensorName.textContent = sensor.name;
    sensorCard.appendChild(sensorName);

    const sensorValue = document.createElement('p');
    sensorValue.textContent = `${sensor.value} ${sensor.unit}`;
    sensorCard.appendChild(sensorValue);
    
    return sensorCard;
}

// Listen for changes in the 'iot-data' node
iotDataRef.on('value', (snapshot) => {
  // Clear the containers
  iotDataContainer.innerHTML = '';
  iotDataRecordsContainer.innerHTML = '';

  // Get the data
  const data = snapshot.val();

  // Loop through the data and create a card for each sensor
  for (const sensorId in data) {
    const sensor = data[sensorId];
    iotDataContainer.appendChild(createSensorCard(sensor));
    iotDataRecordsContainer.appendChild(createSensorCard(sensor));
  }
});
