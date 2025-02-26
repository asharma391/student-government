const fs = require('fs');
const path = require('path');

const houses = ["Orchard", "Wright", "Rigby", "Hodgetts", "Burns", "Scott", "Ketchum", "Brent", "Bickle", "Bethune"];
const prefectBallotPath = path.join(__dirname, 'Prefect Ballot');
const files = fs.readdirSync(prefectBallotPath);

const students = files
    .filter(file => file.endsWith('.JPG'))
    .map(file => {
        const name = file
            .replace('Copy of ', '')
            .replace('.JPG', '')
            .replace('..', '')
            .trim();

        return {
            name,
            house: houses[Math.floor(Math.random() * houses.length)],
            role: Math.random() < 0.5 ? 'M' : 'F',
            imageUrl: `Prefect Ballot/${file}`
        };
    });

fs.writeFileSync(
    'students.json',
    JSON.stringify({ students }, null, 2)
); 