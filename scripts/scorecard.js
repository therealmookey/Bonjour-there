// scorecard.js - Complete fixed version for Raider.io
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
// HELPER: Convert class ID to name
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
// RENDER SCORECARD CARDS
// ============================================
function renderScorecards(members) {
    const grid = document.getElementById('scorecardGrid');
    if (!grid) {
        console.error('❌ scorecardGrid element not found!');
        return;
    }
    
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
            <div class="class-indicator" style="background: ${member.class_color || '#FFFFFF'};"></div>
            <div class="card-header">
                <div>
                    <div class="player-name">${member.name || 'Unknown'}</div>
                    <div class="player-class">${member.class || 'Unknown'} • ${member.race || 'Unknown'}</div>
                </div>
            </div>
            <div class="player-stats">
                <div class="stat-item">
                    <div class="stat-label">Level</div>
                    <div class="stat-value">${member.level || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Item Level</div>
                    <div class="stat-value ilvl">${ilvlDisplay}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Achievements</div>
                    <div class="stat-value">${(member.achievement_points || 0).toLocaleString()}</div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ============================================
// SHOW ERROR MESSAGE
// ============================================
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = '❌ ' + message;
        errorDiv.classList.remove('hidden');
    } else {
        console.error('❌ Error:', message);
    }
}

// ============================================
// RENDER GUILD DATA
// ============================================
function renderGuildData(members, data) {
    // Sort by item level (highest first)
    members.sort((a, b) => (b.item_level || 0) - (a.item_level || 0));
    
    // Update navigation
    const navGuild = document.getElementById('navGuildName');
    if (navGuild) {
        navGuild.textContent = data.name || document.getElementById('guildInput').value.trim();
    }
    
    const navRealm = document.getElementById('navRealmName');
    if (navRealm) {
        navRealm.textContent = (data.realm || document.getElementById('realmInput').value.trim()).toUpperCase();
    }
    
    // Update stats
    const memberCount = document.getElementById('memberCount');
    if (memberCount) {
        memberCount.textContent = `👥 ${members.length} Members`;
    }
    
    const lastUpdated = document.getElementById('lastUpdated');
    if (lastUpdated) {
        lastUpdated.textContent = `🔄 ${new Date().toLocaleString()}`;
    }
    
    // Calculate average iLvl
    const ilvls = members.map(m => m.item_level).filter(v => v > 0);
    if (ilvls.length > 0) {
        const avg = (ilvls.reduce((a, b) => a + b, 0) / ilvls.length).toFixed(1);
        const avgEl = document.getElementById('avgIlvl');
        if (avgEl) {
            avgEl.textContent = `📊 Avg iLvl: ${avg}`;
        }
    }
    
    // Render cards
    renderScorecards(members);
}

// ============================================
// FETCH GUILD DATA FROM RAIDER.IO
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
    const loading = document.getElementById('loading');
    const grid = document.getElementById('scorecardGrid');
    const errorDiv = document.getElementById('errorMessage');
    const fetchBtn = document.getElementById('fetchBtn');
    
    if (loading) loading.classList.remove('hidden');
    if (grid) grid.innerHTML = '';
    if (errorDiv) errorDiv.classList.add('hidden');
    if (fetchBtn) {
        fetchBtn.disabled = true;
        fetchBtn.textContent = '⏳ LOADING...';
    }
    
    try {
        // Use Raider.io API with fields parameter
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
        console.log('📊 Members found:', data.members?.length || 0);
        
        if (!data.members || data.members.length === 0) {
            throw new Error('No members found. The guild might be private.');
        }
        
        // Process members from Raider.io
        const members = data.members.map(member => {
            const charData = member.character || member;
            
            let className = charData.class || charData.class_name || 'Unknown';
            if (typeof className === 'number') {
                className = getClassName(className);
            }
            
            const race = charData.race || charData.race_name || 'Unknown';
            
            let itemLevel = 0;
            if (charData.items) {
                itemLevel = charData.items.averageItemLevel || charData.items.item_level || 0;
            } else if (charData.ilvl) {
                itemLevel = charData.ilvl;
            } else if (charData.item_level) {
                itemLevel = charData.item_level;
            }
            
            let achievementPoints = 0;
            if (charData.achievementPoints) {
                achievementPoints = charData.achievementPoints;
            } else if (charData.achievement_points) {
                achievementPoints = charData.achievement_points;
            }
            
            return {
                name: charData.name || 'Unknown',
                level: charData.level || 0,
                class: className,
                class_color: CLASS_COLORS[className] || '#FFFFFF',
                race: race,
                item_level: itemLevel,
                achievement_points: achievementPoints,
                rank: member.rank || 0
            };
        });
        
        // Render the data
        renderGuildData(members, data);
        
    } catch (error) {
        console.error('❌ Error:', error);
        showError(error.message || 'Failed to fetch guild data');
    } finally {
        const loading = document.getElementById('loading');
        const fetchBtn = document.getElementById('fetchBtn');
        if (loading) loading.classList.add('hidden');
        if (fetchBtn) {
            fetchBtn.disabled = false;
            fetchBtn.textContent = '▶ LOAD ROSTER';
        }
    }
}

// ============================================
// MAKE FUNCTION GLOBAL FOR ONCLICK
// ============================================
window.fetchScorecard = fetchScorecard;

console.log('✅ scorecard.js loaded (Raider.io version)');