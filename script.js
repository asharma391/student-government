let currentPage = 0;
const pages = document.querySelectorAll('.page');
const voteForm = document.getElementById('voteForm');
const thankYouPage = document.querySelector('.thank-you-page'); 
let headBoyChoice = null;
let headGirlChoice = null;
let selectedHeadPrefects = new Set();
let tempSelectedHeadPrefects = new Set(); 
let lastConfirmedHeadPrefects = new Set();

const houseColors = {
    "Orchard": "orange",
    "Wright": "purple",
    "Rigby": "yellow",
    "Hodgetts": "white",
    "Burns": "red",
    "Scott": "green",
    "Ketchum": "navy",
    "Brent": "grey",
    "Bickle": "black",
    "Bethune": "blue"
};

async function loadStudentData() {
    // Load house information from CSV
    const houseData = await fetch('data.csv')
        .then(response => response.text())
        .then(csv => {
            const lines = csv.trim().split('\n');
            const headers = lines[0].split(',');
            return lines.slice(1).reduce((acc, line) => {
                const [name, house] = line.split(',');
                acc[name.trim()] = house.trim();
                return acc;
            }, {});
        });

    // Create student profiles directly from the CSV data
    return Object.entries(houseData).map(([name, house]) => ({
        name: name,
        house: house,
        imageUrl: `Prefect Ballot/Copy of ${name.replace("'", "_")}.JPG`
    }));
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function loadStudentProfiles(containerId, profiles, maxSelection) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    // Group students by house
    const groupedProfiles = profiles.reduce((acc, profile) => {
        if (!acc[profile.house]) {
            acc[profile.house] = [];
        }
        acc[profile.house].push(profile);
        return acc;
    }, {});
    
    // Get houses in random order
    const randomHouseOrder = shuffleArray(Object.keys(groupedProfiles));
    
    // Create student elements grouped by randomly ordered houses
    randomHouseOrder.forEach(house => {
        groupedProfiles[house].forEach(profile => {
            const studentDiv = document.createElement('div');
            studentDiv.classList.add('student');
            studentDiv.dataset.id = profile.name;
            studentDiv.dataset.name = profile.name;
            studentDiv.dataset.house = profile.house;
            
            // Use lastConfirmedHeadPrefects for disabling on prefects page
            if (containerId === 'prefectsContainer' && lastConfirmedHeadPrefects.has(profile.name)) {
                studentDiv.classList.add('disabled');
            } else {
                studentDiv.onclick = () => selectStudent(studentDiv, maxSelection, containerId);
            }

            // If this is the head prefects page and the student was previously selected
            if (containerId === 'headPrefectsContainer' && tempSelectedHeadPrefects.has(profile.name)) {
                studentDiv.classList.add('selected');
                studentDiv.style.transform = 'scale(1.1)';
            }

            const img = document.createElement('img');
            img.src = profile.imageUrl;
            img.alt = profile.name;

            const name = document.createElement('div');
            name.classList.add('student-name');
            name.textContent = profile.name;

            studentDiv.appendChild(img);
            studentDiv.appendChild(name);
            container.appendChild(studentDiv);

            img.style.boxShadow = `0 0 8px 3px ${houseColors[profile.house]}`;
            img.style.transition = 'box-shadow 0.2s ease-in-out';
        });
    });
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) - amt,
        G = (num >> 8 & 0x00FF) - amt,
        B = (num & 0x0000FF) - amt;
    return `rgb(${R < 255 ? R < 1 ? 0 : R : 255},${G < 255 ? G < 1 ? 0 : G : 255},${B < 255 ? B < 1 ? 0 : B : 255})`;
}

function selectStudent(studentDiv, maxSelection, containerId) {
    if (studentDiv.classList.contains('disabled')) return;
    
    const selected = studentDiv.classList.contains('selected');
    const container = studentDiv.parentElement;
    const selectedCount = container.querySelectorAll('.student.selected').length;

    if (selected) {
        studentDiv.classList.remove('selected');
        studentDiv.style.transform = '';
        if (containerId === 'headPrefectsContainer') {
            tempSelectedHeadPrefects.delete(studentDiv.dataset.name);
        }
    } else {
        // Allow replacing an existing selection when at max
        if (selectedCount >= maxSelection) {
            const firstSelected = container.querySelector('.student.selected');
            if (firstSelected) {
                firstSelected.classList.remove('selected');
                firstSelected.style.transform = '';
                if (containerId === 'headPrefectsContainer') {
                    tempSelectedHeadPrefects.delete(firstSelected.dataset.name);
                }
            }
        }
        studentDiv.classList.add('selected');
        studentDiv.style.transform = 'scale(1.1)';
        if (containerId === 'headPrefectsContainer') {
            tempSelectedHeadPrefects.add(studentDiv.dataset.name);
        }
    }
    
    toggleNextButton();
}

function showPage(index) {
    pages.forEach((page, i) => {
        page.classList.toggle('active', i === index);
    });

    loadStudentData().then(data => {
        switch(index) {
            case 1:
                loadStudentProfiles('headPrefectsContainer', data, 3);
                break;
            case 2:
                loadStudentProfiles('prefectsContainer', data, 6);
                break;
        }
    });

    updateNavigationButtons();
}

function nextPage() {
    const currentContainer = pages[currentPage].querySelector('.student-container');
    const selectedCount = currentContainer ? currentContainer.querySelectorAll('.student.selected').length : 0;
    const requiredSelection = currentPage === 1 ? 3 : (currentPage === 2 ? 6 : 0);

    if (currentPage === 0 || selectedCount === requiredSelection) {
        // If moving from head prefects page to prefects page
        if (currentPage === 1) {
            lastConfirmedHeadPrefects = new Set(tempSelectedHeadPrefects); // Store the confirmed selections
            selectedHeadPrefects = new Set(tempSelectedHeadPrefects); // Update current selections
        }
        currentPage++;
        showPage(currentPage);
    } else {
        alert('Please make the required selections before proceeding.');
    }
}

function prevPage() {
    if (currentPage > 0) {
        // If going back to head prefects page
        if (currentPage === 2) {
            tempSelectedHeadPrefects = new Set(lastConfirmedHeadPrefects); // Use the last confirmed selections
            selectedHeadPrefects = new Set(lastConfirmedHeadPrefects); // Keep the same disabled states
        }
        currentPage--;
        showPage(currentPage);
    }
}

function toggleSubmitButton() {
    const submitButton = document.querySelector('.submit-button');
    
    if (currentPage === pages.length - 2) { 
        const lastPageContainer = document.getElementById('prefectContainer2');
        const selectedCount = lastPageContainer ? lastPageContainer.querySelectorAll('.student.selected').length : 0;
        
        submitButton.style.display = selectedCount === 3 ? 'inline-block' : 'none';
    } else {
        submitButton.style.display = 'none';
    }
}

voteForm.onsubmit = async (event) => {
    event.preventDefault();
    
    if (!userEmail) {
        alert('Please sign in first');
        return;
    }

    const votes = {};
    document.querySelectorAll('.student-container').forEach(container => {
        const selectedStudents = Array.from(container.querySelectorAll('.student.selected')).map(student => student.dataset.name);
        votes[container.id] = selectedStudents;
    });

    // Add email to votes object
    votes.userEmail = userEmail;

    try {
        // Check again if user has already voted
        const hasVoted = await checkPreviousVote(userEmail);
        if (hasVoted) {
            alert('You have already submitted your votes.');
            return;
        }

        await sendToGoogleSheets(votes);
        currentPage = document.querySelectorAll('.page').length - 1;
        showPage(currentPage);
        document.querySelector('.button-container').remove();
    } catch (error) {
        console.error('Error submitting votes:', error);
        alert('Error submitting votes. Please try again.');
    }
};

function sendToGoogleSheets(votes) {
    console.log('Sending to Google Sheets:', votes);
}

window.onload = () => {
    showPage(0);
};

function createStudentElement(student) {
    const container = document.createElement('div');
    container.className = 'student-card';
    
    const img = document.createElement('img');
    img.src = student.imageUrl; 
    img.alt = student.name;
    
    const name = document.createElement('p');
    name.textContent = student.name;
    
    container.appendChild(img);
    container.appendChild(name);
    
    container.addEventListener('click', function() {
        const parentContainer = this.parentElement;
        const siblings = parentContainer.getElementsByClassName('student-card');
        Array.from(siblings).forEach(sibling => {
            sibling.classList.remove('selected');
        });
        
        this.classList.add('selected');
        
        const pageId = parentContainer.id;
        selections[pageId] = student.name;
    });
    
    return container;
}

document.getElementById('voteForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const votes = {};
    document.querySelectorAll('.student-container').forEach(container => {
        const selectedStudents = Array.from(container.querySelectorAll('.student.selected')).map(student => student.dataset.name);
        votes[container.id] = selectedStudents;
    });
    
    sendToGoogleSheets(votes);
    
    currentPage = document.querySelectorAll('.page').length - 1;
    showPage(currentPage);
    
    document.querySelector('.button-container').remove();
});

function updateNavigationButtons() {
    const nextButton = document.querySelector('.nav-button:nth-child(2)');
    const submitButton = document.querySelector('.submit-button');
    const buttonContainer = document.querySelector('.button-container');
    const prevButton = document.querySelector('.nav-button:nth-child(1)');
    
    submitButton.style.display = 'none';
    
    if (currentPage === pages.length - 2) {
        nextButton.style.display = 'none';
        submitButton.style.display = 'inline-block';
        prevButton.style.display = 'inline-block';
    } else if (currentPage === pages.length - 1) {
        buttonContainer.remove();
    } else if (currentPage === 0) {
        prevButton.style.display = 'none';
        nextButton.style.display = 'inline-block';
        submitButton.style.display = 'none';
    } else {
        prevButton.style.display = 'inline-block';
        nextButton.style.display = 'inline-block';
        submitButton.style.display = 'none';
    }
}

function toggleNextButton() {
    const nextButton = document.querySelector('.nav-button:nth-child(2)');
    const submitButton = document.querySelector('.submit-button');
    
    if (currentPage === 2) { // Prefects page
        const selectedCount = document.getElementById('prefectsContainer').querySelectorAll('.student.selected').length;
        submitButton.style.display = selectedCount === 6 ? 'inline-block' : 'none';
        nextButton.style.display = 'none';
    } else if (currentPage === 1) { // Head Prefects page
        const selectedCount = document.getElementById('headPrefectsContainer').querySelectorAll('.student.selected').length;
        nextButton.style.display = selectedCount === 3 ? 'inline-block' : 'none';
    }
}

function processStudentName(filename) {
    return filename
        .replace('Copy of ', '')
        .replace('.JPG', '')
        .replace('..', '')
        .trim();
}

const houses = ["Orchard", "Wright", "Rigby", "Hodgetts", "Burns", "Scott", "Ketchum", "Brent", "Bickle", "Bethune"];
const students = [
    "Roberts Tani", "Schmidlin S", "Skeoch T", "Stephens R", "Torrible S", "Vojnov K", "Vojnov S", "Wells J", 
    "Wells S", "Whitehead A", "Murray M", "O'Connell L", "O'Grady A", "Petrolito A", "Petrolito J", "Pontieri V",
    "Poynton K", "Quick O", "Rauh-Wasmund S", "Redmond L", "Flintoff D", "Fournier H", "Fox M", "Gardiner S",
    "Gordon A", "Hamilton S", "Hamm J", "Mandryk T", "McFadden C", "Murray S", "Eustace C", "Findlay T",
    "Fisher D", "Fisher J", "Clark T", "Clutton T", "Collins A", "Conley B", "Connelly K", "Cortes D",
    "Crawford E", "Dalliday S", "Elson G", "Elson L", "Ambrose K", "Anderson J", "Armstrong V", "Bathurst T",
    "Black B", "Brooks K", "Burns C"
].map(name => ({
    name: name,
    house: houses[Math.floor(Math.random() * houses.length)],
    role: Math.random() < 0.5 ? 'M' : 'F',
    imageUrl: `Prefect Ballot/Copy of ${name.replace("'", "_")}.JPG`
}));
