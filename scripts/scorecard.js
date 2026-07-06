// scorecard.js - Using Raider.io API with correct guild name
const CLASS_COLORS = {
    'Warrior': '#C79C6E',
    'Paladin': '#F58CBA',
    'Hunter': '#ABD473',
    'Rogue': '#FFF569',
    'Priest': '#FFFFFF',
    'Death Knight': '#C41F3B',
    'Shaman': '#0070DE',
    'Mage': '#69CCF0',
    'Warlock': '#9482C9',
    'Monk': '#00FF96',
    'Druid': '#FF7D0A',
    'Demon Hunter': '#A330C9',
    'Evoker': '#33937F'
};

// ============================================
// FETCH GUILD DATA FROM RAIDER.IO (with fields)
// ============================================
async function fetchScorecard() {
    console.log('🏈 fetchScorecard called!');
    
    const guildInput = document.getElementById('guildInput').value.trim();
    const realm = document.getElementById('realmInput').value.trim();
    const region = document.getElementById('regionSelect').value;
    
    if (!guildInput || !realm) {
        showError('Please enter both guild name and realm');
        return;
    }
    
    // Show loading
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('scorecardGrid').innerHTML = '';
    document.getElementById('errorMessage').classList.add('hidden');
    document.getElementById('fetchBtn').disabled = true;
    document.getElementById('fetchBtn').textContent = '⏳ LOADING...';
    
    try {
        // Use Raider.io API with fields parameter to get member data
        const apiUrl = `https://raider.io/api/v1/guilds/profile?region=${region}&realm=${realm}&name=${encodeURIComponent(guildInput)}&fields=members`;
        console.log('📡 Fetching from Raider.io:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Guild "${guildInput}" not found on "${realm}" (${region}). Check spelling.`);
            }
            throw new Error(`Raider.io error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Raider.io data received');
        console.log('🔍 Data structure:', Object.keys(data));
        
        // Check if members exist in the response
        if (!data.members || data.members.length === 0) {
            // Try to see if there's any member data in a different format
            if (data.roster && data.roster.length > 0) {
                console.log('📊 Found roster data instead of members');
                // Process roster data if available
                const members = data.roster.map(member => {
                    const charData = member.character || member;
                    const className = charData.class || charData.class_name || 'Unknown';
                    return {
                        name: charData.name || 'Unknown',
                        level: charData.level || 0,
                        class: className,
                        class_color: CLASS_COLORS[className] || '#FFFFFF',
                        race: charData.race || 'Unknown',
                        item_level: charData.items?.averageItemLevel || charData.ilvl || 0,
                        achievement_points: charData.achievementPoints || 0,
                        rank: member.rank || 0
                    };
                });
                
                if (members.length > 0) {
                    renderGuildData(members, data);
                    return;
                }
            }
            
            // If no members found, show a more helpful error
            console.log('📊 Full response:', data);
            throw new Error('No members found. The guild might be private or the API key might be needed.');
        }
        
        // Process members from the 'members' field
        const members = data.members.map(member => {
            const charData = member.character;
            const className = charData.class || 'Unknown';
            return {
                name: charData.name || 'Unknown',
                level: charData.level || 0,
                class: className,
                class_color: CLASS_COLORS[className] || '#FFFFFF',
                race: charData.race || 'Unknown',
                item_level: charData.items?.averageItemLevel || 0,
                achievement_points: charData.achievementPoints || 0,
                rank: member.rank || 0
            };
        });
        
        renderGuildData(members, data);
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Failed to fetch guild data');
    } finally {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('fetchBtn').disabled = false;
        document.getElementById('fetchBtn').textContent = '▶ LOAD ROSTER';
    }
}

// ============================================
// RENDER GUILD DATA
// ============================================
function renderGuildData(members, data) {
    // Sort by item level (highest first)
    members.sort((a, b) => (b.item_level || 0) - (a.item_level || 0));
    
    // Update UI
    document.getElementById('navGuildName').textContent = data.name || document.getElementById('guildInput').value.trim();
    document.getElementById('navRealmName').textContent = (data.realm || document.getElementById('realmInput').value.trim()).toUpperCase();
    document.getElementById('memberCount').textContent = `👥 ${members.length} Members`;
    document.getElementById('lastUpdated').textContent = `🔄 ${new Date().toLocaleString()}`;
    
    // Calculate average iLvl
    const ilvls = members.map(m => m.item_level).filter(v => v > 0);
    if (ilvls.length > 0) {
        const avg = (ilvls.reduce((a, b) => a + b, 0) / ilvls.length).toFixed(1);
        document.getElementById('avgIlvl').textContent = `📊 Avg iLvl: ${avg}`;
    }
    
    // Render cards
    renderScorecards(members);
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = '❌ ' + message;
    errorDiv.classList.remove('hidden');
}

// Make function global
window.fetchScorecard = fetchScorecard;
console.log('✅ scorecard.js loaded (Raider.io version)');