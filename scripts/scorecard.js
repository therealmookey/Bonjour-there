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
// FETCH GUILD DATA FROM RAIDER.IO
// ============================================
async function fetchScorecard() {
    console.log('🏈 fetchScorecard called!');
    
    // Get the raw guild name from input (with spaces, proper case)
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
        // Use Raider.io API with the EXACT guild name (with spaces, proper case)
        // Example: "Bonjour There" not "bonjour-there"
        const apiUrl = `https://raider.io/api/v1/guilds/profile?region=${region}&realm=${realm}&name=${encodeURIComponent(guildInput)}`;
        console.log('📡 Fetching from Raider.io:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Guild "${guildInput}" not found on "${realm}" (${region}). Try the full guild name with proper capitalization.`);
            }
            throw new Error(`Raider.io error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Raider.io data received');
        
        if (!data.members || data.members.length === 0) {
            throw new Error('No members found. Guild might be empty or private.');
        }
        
        // Process members
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
        
        // Sort by item level (highest first)
        members.sort((a, b) => (b.item_level || 0) - (a.item_level || 0));
        
        // Update UI
        document.getElementById('navGuildName').textContent = data.name || guildInput;
        document.getElementById('navRealmName').textContent = (data.realm || realm).toUpperCase();
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
// RENDER SCORECARD CARDS
// ============================================
function renderScorecards(members) {
    const grid = document.getElementById('scorecardGrid');
    grid.innerHTML = '';
    
    if (!members || members.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#8892b0;padding:40px;">No members found.</p>';
        return;
    }
    
    members.forEach((member, index) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        if (index === 0) card.classList.add('top-1');
        else if (index === 1) card.classList.add('top-2');
        else if (index === 2) card.classList.add('top-3');
        
        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
        const ilvlDisplay = member.item_level > 0 ? member.item_level : 'N/A';
        
        card.innerHTML = `
            <div class="rank-badge">${rankEmoji}</div>
            <div class="class-indicator" style="background: ${member.class_color};"></div>
            <div class="card-header">
                <div>
                    <div class="player-name">${member.name}</div>
                    <div class="player-class">${member.class} • ${member.race}</div>
                </div>
            </div>
            <div class="player-stats">
                <div class="stat-item">
                    <div class="stat-label">Level</div>
                    <div class="stat-value">${member.level}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Item Level</div>
                    <div class="stat-value ilvl">${ilvlDisplay}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Achievements</div>
                    <div class="stat-value">${member.achievement_points.toLocaleString()}</div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = '❌ ' + message;
    errorDiv.classList.remove('hidden');
}

// Make function global
window.fetchScorecard = fetchScorecard;
console.log('✅ scorecard.js loaded (Raider.io version)');