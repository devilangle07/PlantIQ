document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const plantNameEl = document.getElementById('plant-name');
    const plantTypeEl = document.getElementById('plant-type');
    const plantAgeEl = document.getElementById('plant-age');
    const growthStageEl = document.getElementById('growth-stage');
    const growthProgressBar = document.getElementById('growth-progress-bar');

    // --- Data Initialization ---
    let plantName = localStorage.getItem('plantName') || 'My Royal Tree';
    let plantType = localStorage.getItem('plantType') || 'tree'; // Default to tree
    let plantStartDate = localStorage.getItem('plantStartDate');
    if (!plantStartDate) {
        plantStartDate = new Date().toISOString();
        localStorage.setItem('plantStartDate', plantStartDate);
    }

    // --- Growth Stages Mapping ---
    const growthStages = {
        tree: ['Seed', 'Sprout', 'Sapling', 'Small Tree', 'Mature Tree'],
        shrub: ['Seed', 'Sprout', 'Small Shrub', 'Mature Shrub'],
        flower: ['Seed', 'Sprout', 'Budding', 'Flowering'],
        herb: ['Seed', 'Sprout', 'Leafy', 'Harvest-ready']
    };
    
    // --- Core Functions ---
    function calculateAge() {
        const startDate = new Date(plantStartDate);
        const today = new Date();
        const ageInMilliseconds = today - startDate;
        return Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));
    }

    function updateProfile() {
        const age = calculateAge();
        const stages = growthStages[plantType];
        // Dummy growth calculation - in a real app, this would come from your IoT data
        const growthScore = age * 2; // Simple example: 2 points per day
        const stageIndex = Math.min(Math.floor(growthScore / 10), stages.length - 1);

        plantNameEl.value = plantName;
        plantTypeEl.textContent = plantType.charAt(0).toUpperCase() + plantType.slice(1);
        plantAgeEl.textContent = age;
        growthStageEl.textContent = stages[stageIndex];
        
        // Update progress bar
        const progressPercentage = (stageIndex / (stages.length - 1)) * 100;
        growthProgressBar.style.width = `${progressPercentage}%`;
    }

    // --- Event Listeners ---
    plantNameEl.addEventListener('change', () => {
        plantName = plantNameEl.value;
        localStorage.setItem('plantName', plantName);
        console.log(`Plant name updated to: ${plantName}`);
    });

    // Initial Load
    updateProfile();
});