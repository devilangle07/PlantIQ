document.addEventListener('DOMContentLoaded', () => {
    const achievements = {
        '7-days-well-watered': {
            unlocked: localStorage.getItem('7-days-well-watered') === 'true',
            date: localStorage.getItem('7-days-well-watered-date')
        },
        'first-leaf-grown': {
            unlocked: localStorage.getItem('first-leaf-grown') === 'true',
            date: localStorage.getItem('first-leaf-grown-date')
        },
        '1-month-healthy': {
            unlocked: localStorage.getItem('1-month-healthy') === 'true',
            date: localStorage.getItem('1-month-healthy-date')
        }
    };

    function updateAchievementsList() {
        const listItems = document.querySelectorAll('.achievement-list li');
        listItems.forEach(item => {
            const text = item.querySelector('.text').textContent.trim();
            let key;
            if (text === '7 Days Well Watered') key = '7-days-well-watered';
            if (text === 'First Leaf Grown') key = 'first-leaf-grown';
            if (text === '1 Month Healthy Plant') key = '1-month-healthy';

            if (key && achievements[key].unlocked) {
                item.classList.add('unlocked');
                item.querySelector('.icon').textContent = '✅';
                item.querySelector('.date').textContent = `Achieved on: ${new Date(achievements[key].date).toLocaleDateString()}`;
            }
        });
    }

    // This is a placeholder for the logic that would unlock achievements.
    // In a real application, this would be triggered by events from your IoT data.
    function checkAchievements() {
        const plantStartDate = new Date(localStorage.getItem('plantStartDate'));
        const now = new Date();
        const ageInDays = Math.floor((now - plantStartDate) / (1000 * 60 * 60 * 24));

        // Example: Unlock "7 Days Well Watered"
        if (ageInDays >= 7 && !achievements['7-days-well-watered'].unlocked) {
            achievements['7-days-well-watered'].unlocked = true;
            achievements['7-days-well-watered'].date = now.toISOString();
            localStorage.setItem('7-days-well-watered', 'true');
            localStorage.setItem('7-days-well-watered-date', achievements['7-days-well-watered'].date);
        }

        // Example: Unlock "1 Month Healthy Plant"
        if (ageInDays >= 30 && !achievements['1-month-healthy'].unlocked) {
            achievements['1-month-healthy'].unlocked = true;
            achievements['1-month-healthy'].date = now.toISOString();
            localStorage.setItem('1-month-healthy', 'true');
            localStorage.setItem('1-month-healthy-date', achievements['1-month-healthy'].date);
        }
        
        updateAchievementsList();
    }

    checkAchievements();
});