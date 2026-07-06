// scorecard.js - Using public Blizzard API (no authentication needed)
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
// SIMPLER APPROACH: Use Blizzard's public API
// ============================================
async function fetchScorecard() {
    console.log('🏈 fetchScorecard called!');
    
    const guild = document.getElementById('guildInput').value.trim();
    const realm = document.getElementById('realmInput').value.trim();
    const region = document.getElementById('regionSelect').value;
    
    if (!guild || !realm) {
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
        // Use Blizzard's public profile API (no authentication required)
        const apiUrl = `https://raider.io/api/v1/guilds/profile?region=${region}&realm=${realm}&name=${encodeURIComponent(guild)}`;
        console.log('📡 Fetching from Raider.io:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Data received:', data);
        
        if (!data.members || data.members.length === 0) {
            throw new Error('No members found. Check guild name and realm.');
        }
        
        // Process members
        const members = data.members.map(member => {
            const classId = member.character.class;
            const className = getClassName(classId);
            return {
                name: member.character.name,
                level: member.character.level,
                class: className,
                class_color: CLASS_COLORS[className] || '#FFFFFF',
                race: member.character.race || 'Unknown',
                item_level: member.character.items?.averageItemLevel || 0,
                achievement_points: member.character.achievementPoints || 0,
                rank: member.rank || 0
            };
        });
        
        // Sort by item level
        members.sort((a, b) => (b.item_level || 0) - (a.item_level || 0));
        
        // Update navigation
        document.getElementById('navGuildName').textContent = data.name || guild;
        document.getElementById('navRealmName').textContent = (data.realm || realm).toUpperCase();
        
        // Update stats
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
        // If Raider.io fails, try Blizzard's official data
        console.warn('Raider.io failed, trying Blizzard API...', error);
        try {
            await fetchFromBlizzardAPI(guild, realm, region);
        } catch (secondError) {
            showError(`Failed to fetch guild data: ${secondError.message}`);
        }
    } finally {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('fetchBtn').disabled = false;
        document.getElementById('fetchBtn').textContent = '▶ LOAD ROSTER';
    }
}

// ============================================
// FALLBACK: Try Blizzard's official API
// ============================================
async function fetchFromBlizzardAPI(guild, realm, region) {
    // Use Blizzard's public profile endpoint (some data is public)
    // Note: This may require authentication in some cases
    const apiUrl = `https://${region}.api.blizzard.com/data/wow/guild/${realm}/${guild}/roster?namespace=dynamic-${region}`;
    console.log('📡 Fallback to Blizzard API:', apiUrl);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`Blizzard API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Blizzard data:', data);
    
    // Process data (this will need to be adapted based on actual response)
    // ... (similar processing as above)
}

// ============================================
// Helper: Convert class ID to name
// ============================================
function getClassName(classId) {
    const classes = {
        1: 'Warrior',
        2: 'Paladin',
        3: 'Hunter',
        4: 'Rogue',
        5: 'Priest',
        6: 'Death Knight',
        7: 'Shaman',
        8: 'Mage',
        9: 'Warlock',
        10: 'Monk',
        11: 'Druid',
        12: 'Demon Hunter',
        13: 'Evoker'
    };
    return classes[classId] || 'Unknown';
}

// ============================================
// Render scorecard cards
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
    document.getElementById('errorMessage').textContent = '❌ ' + message;
    document.getElementById('errorMessage').classList.remove('hidden');
}

window.fetchScorecard = fetchScorecard;
console.log('✅ scorecard.js loaded!');