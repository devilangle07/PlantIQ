document.addEventListener('DOMContentLoaded', () => {
    const photoUpload = document.getElementById('photo-upload');
    const journalGallery = document.getElementById('journal-gallery');

    let journalPhotos = JSON.parse(localStorage.getItem('journalPhotos')) || [];

    function renderJournal() {
        journalGallery.innerHTML = '';
        journalPhotos.forEach(photo => {
            const imgContainer = document.createElement('div');
            imgContainer.classList.add('journal-entry');

            const img = document.createElement('img');
            img.src = photo.src;

            const tag = document.createElement('p');
            tag.textContent = `Stage: ${photo.stage} - ${new Date(photo.date).toLocaleDateString()}`;

            imgContainer.appendChild(img);
            imgContainer.appendChild(tag);
            journalGallery.appendChild(imgContainer);
        });
    }

    function getGrowthStage() {
        const plantType = localStorage.getItem('plantType') || 'tree';
        const plantStartDate = localStorage.getItem('plantStartDate');
        const age = Math.floor((new Date() - new Date(plantStartDate)) / (1000 * 60 * 60 * 24));
        const growthScore = age * 2;
        const stages = {
            tree: ['Seed', 'Sprout', 'Sapling', 'Small Tree', 'Mature Tree'],
            shrub: ['Seed', 'Sprout', 'Small Shrub', 'Mature Shrub'],
            flower: ['Seed', 'Sprout', 'Budding', 'Flowering'],
            herb: ['Seed', 'Sprout', 'Leafy', 'Harvest-ready']
        };
        const stageIndex = Math.min(Math.floor(growthScore / 10), stages[plantType].length - 1);
        return stages[plantType][stageIndex];
    }

    photoUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const newPhoto = {
                    src: e.target.result,
                    stage: getGrowthStage(),
                    date: new Date().toISOString()
                };
                journalPhotos.push(newPhoto);
                localStorage.setItem('journalPhotos', JSON.stringify(journalPhotos));
                renderJournal();
            }
            reader.readAsDataURL(file);
        }
    });

    renderJournal();
});