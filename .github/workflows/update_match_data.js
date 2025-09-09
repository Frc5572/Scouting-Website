
const fs = require('fs');
const axios = require('axios');

const TBA_API_KEY = process.env.TBA_API_KEY;
const EVENT_KEY = process.env.EVENT_KEY;

if (!TBA_API_KEY) {
    console.error('TBA_API_KEY environment variable is required');
    process.exit(1);
}
if (!EVENT_KEY) {
    console.error('EVENT_KEY environment variable is required');
    process.exit(1);
}

async function fetchMatchData(eventKey) {
    try {
        console.log(`Fetching matches for event: ${eventKey}`);
        const options = {
            headers: {
                'X-TBA-Auth-Key': TBA_API_KEY,
                'User-Agent': 'FRC5572-ScoutingApp/1.0'
            }
        };
        const response = await axios.get(`https://www.thebluealliance.com/api/v3/event/${eventKey}/matches`, options)
        const matches = response.data
        return matches.filter(x => x.comp_level === 'qm').reduce((x, match) => {
            x[match.match_number] = [].concat(match?.alliances?.red?.team_keys.map(teamKey => {
                return {
                    key: teamKey,
                    number: teamKey.replace('frc', ''),
                    alliance: 'red'
                }
            })).concat(match?.alliances?.blue?.team_keys.map(teamKey => {
                return {
                    key: teamKey,
                    number: teamKey.replace('frc', ''),
                    alliance: 'blue'
                }
            }))
            return x;
        }, {});

    } catch (error) {
        console.error(`Error fetching match data for ${eventKey}:`, error.message);
        return {};
    }
}

async function updateMatchDataFile() {
    try {
        const allMatchData = {}
        // Fetch new data for the specified event
        const newMatchData = await fetchMatchData(EVENT_KEY);
        allMatchData[EVENT_KEY] = newMatchData;


        // Write updated data to file
        const jsContent = `// Auto-generated match data from The Blue Alliance API
// Last updated: ${new Date().toISOString()}
window.MATCH_DATA = ${JSON.stringify(allMatchData, null, 2)};`;

        fs.writeFileSync('match-data.js', jsContent);
        console.log(`Successfully updated match data for ${EVENT_KEY}`);
        console.log(`Total matches: ${Object.keys(newMatchData).length}`);

        return Object.keys(newMatchData).length > 0;
    } catch (error) {
        console.error('Error updating match data:', error);
        return false;
    }
}

// Run the update
updateMatchDataFile().then(success => {
    if (!success) {
        process.exit(1);
    }
});