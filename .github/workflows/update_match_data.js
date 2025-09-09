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
        
        const response = await axios.get(`https://www.thebluealliance.com/api/v3/event/${eventKey}/matches`, options);
        const matches = response.data;
        
        console.log(`Raw matches fetched: ${matches.length}`);
        
        // Filter and process qualification matches
        const qualificationMatches = matches.filter(match => match.comp_level === 'qm');
        console.log(`Qualification matches found: ${qualificationMatches.length}`);
        
        const processedMatches = {};
        
        qualificationMatches.forEach(match => {
            try {
                // Validate match structure
                if (!match.match_number || !match.alliances) {
                    console.warn(`Skipping match with invalid structure:`, match.key || 'unknown');
                    return;
                }
                
                const teams = [];
                
                // Process red alliance
                if (match.alliances.red && Array.isArray(match.alliances.red.team_keys)) {
                    match.alliances.red.team_keys.forEach(teamKey => {
                        if (teamKey && typeof teamKey === 'string') {
                            teams.push({
                                key: teamKey,
                                number: teamKey.replace('frc', ''),
                                alliance: 'red'
                            });
                        }
                    });
                }
                
                // Process blue alliance
                if (match.alliances.blue && Array.isArray(match.alliances.blue.team_keys)) {
                    match.alliances.blue.team_keys.forEach(teamKey => {
                        if (teamKey && typeof teamKey === 'string') {
                            teams.push({
                                key: teamKey,
                                number: teamKey.replace('frc', ''),
                                alliance: 'blue'
                            });
                        }
                    });
                }
                
                if (teams.length > 0) {
                    processedMatches[match.match_number] = teams;
                    console.log(`Match ${match.match_number}: ${teams.length} teams`);
                } else {
                    console.warn(`Match ${match.match_number} has no valid teams`);
                }
                
            } catch (error) {
                console.error(`Error processing match ${match.match_number}:`, error.message);
            }
        });
        
        console.log(`Successfully processed ${Object.keys(processedMatches).length} matches`);
        return processedMatches;
        
    } catch (error) {
        console.error(`Error fetching match data for ${eventKey}:`, error.message);
        
        // Log more details for debugging
        if (error.response) {
            console.error(`HTTP Status: ${error.response.status}`);
            console.error(`Response data:`, error.response.data);
        }
        
        return {};
    }
}

async function updateMatchDataFile() {
    try {
        const allMatchData = {};
        
        // Fetch new data for the specified event
        const newMatchData = await fetchMatchData(EVENT_KEY);
        allMatchData[EVENT_KEY] = newMatchData;
        
        // Write updated data to file
        const jsContent = `// Auto-generated match data from The Blue Alliance API
// Last updated: ${new Date().toISOString()}
// Event: ${EVENT_KEY}
window.MATCH_DATA = ${JSON.stringify(allMatchData, null, 2)};`;
        
        fs.writeFileSync('match-data.js', jsContent);
        
        const matchCount = Object.keys(newMatchData).length;
        console.log(`Successfully updated match data for ${EVENT_KEY}`);
        console.log(`Total matches: ${matchCount}`);
        
        // Log a sample of the data for verification
        if (matchCount > 0) {
            const firstMatch = Object.keys(newMatchData)[0];
            console.log(`Sample - Match ${firstMatch}:`, newMatchData[firstMatch]);
        }
        
        return matchCount > 0;
        
    } catch (error) {
        console.error('Error updating match data:', error);
        return false;
    }
}

// Run the update
updateMatchDataFile().then(success => {
    if (!success) {
        console.error('Failed to update match data');
        process.exit(1);
    } else {
        console.log('Match data update completed successfully');
    }
});
