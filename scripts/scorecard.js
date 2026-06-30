// scripts/scorecard.js - Scorecard fetching and rendering

// Class colors
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

// Proxy URL for bypassing CORS
const CORS_PROXY = 'https://corsproxy.io/?';

// ============================================
// STEP 1: Get an access token from Blizzard
// ============================================
async function getBlizzardToken() {
    if (typeof BLIZZARD_CLIENT_ID === 'undefined' || BLIZZARD_CLIENT_ID === 'your_client_id_here') {
        throw new Error('Please set your Blizzard Client ID in config.js');
    }
    if (typeof BLIZZARD_CLIENT_SECRET === 'undefined' || BLIZZARD_CLIENT_SECRET === 'your_client_secret_here') {
        throw new Error('Please set your Blizzard Client Secret in config.js');
    }
    
    const targetUrl = 'https://oauth.battle.net/token';
    const credentials = btoa(BLIZZARD_CLIENT_ID + ':' + BLIZZARD_CLIENT_SECRET);
    
    try {
        const response = await fetch(CORS_PROXY + encodeURIComponent(targetUrl), {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + credentials,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });
        
        if (!response.ok) {
            throw new Error('Failed to get Blizzard access token. Status: ' + response.status);
        }
        
        const data = await response.json();
        return data.access_token;
    } catch (error) {
        throw new Error('Authentication failed: ' + error.message);
    }
}

// ============================================
// STEP 2: Fetch guild data from Blizzard API
// ============================================
async function fetchGuildData(guild, realm, region) {
    const token = await getBlizzardToken();
    const baseUrl = 'https://' + region + '.api.blizzard.com';
    
    // First, get the guild roster through proxy
    const rosterUrl = baseUrl + '/data/wow/guild/' + realm + '/' + guild + '/roster';
    const rosterResponse = await fetch(CORS_PROXY + encodeURIComponent(rosterUrl), {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Battlenet-Namespace': 'dynamic-' + region
        }
    });
    
    if (!rosterResponse.ok) {
        if (rosterResponse.status === 404) {
            throw new Error('Guild not found. Check guild name and realm spelling.');
        }
        throw new Error('Failed to fetch roster. Error: ' + rosterResponse.status);
    }
    
    const rosterData = await rosterResponse.json();
    const members = rosterData.members || [];
    
    if (members.length === 0) {
        throw new Error('Guild has no members or is private.');
    }
    
    // Get details for each member (limit to 20 for performance)
    const scorecard = [];
    const memberLimit = Math.min(members.length, 20);
    
    for (let i = 0; i < memberLimit; i++) {
        const member = members[i];
        const charName = member.character.name;
        const charUrl = baseUrl + '/profile/wow/character/' + realm + '/' + charName.toLowerCase();
        
        try {
            const charResponse = await fetch(CORS_PROXY + encodeURIComponent(charUrl), {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Battlenet-Namespace': 'profile-' + region
                }
            });
            
            if (charResponse.ok) {
                const charData = await charResponse.json();
                const className = charData.character_class?.name || 'Unknown';
                
                scorecard.push({
                    name: charName,
                    level: charData.level || 0,
                    class: className,
                    class_color: CLASS_COLORS[className] || '#FFFFFF',
                    race: charData.race?.name || 'Unknown',
                    item_level: charData.equipped_item_level || 0,
                    achievement_points: charData.achievement_points || 0,
                    rank: member.rank || 0
                });
            }
        } catch (e) {
            console.warn('Could not fetch ' + charName + ':', e);
        }
    }
    
    // Sort by item level (highest first)
    scorecard.sort(function(a, b) {
        return (b.item_level || 0) - (a.item_level || 0);
    });
    
    return {
        success: true,
        guild: guild,
        realm: realm,
        members: scorecard,
        total: scorecard.length,
        updated: new Date().toLocaleString()
    };
}

// ============================================
// STEP 3: Display the scorecard
// ============================================
async function fetchScorecard() {
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
        const data = await fetchGuildData(guild, realm, region);
        
        // Update navigation
        const navGuild = document.getElementById('navGuildName');
        if (navGuild) navGuild.textContent = data.guild;
        const navRealm = document.getElementById('navRealmName');
        if (navRealm) navRealm.textContent = data.realm.toUpperCase();
        
        // Update stats
        document.getElementById('memberCount').textContent = '👥 ' + data.total + ' Members';
        document.getElementById('lastUpdated').textContent = '🔄 ' + data.updated;
        if (typeof updateFooterTime === 'function') updateFooterTime();
        
        // Calculate average iLvl
        const ilvls = data.members.map(function(m) { return m.item_level; }).filter(function(v) { return v > 0; });
        if (ilvls.length > 0) {
            var sum = 0;
            for (var i = 0; i < ilvls.length; i++) sum += ilvls[i];
            var avg = (sum / ilvls.length).toFixed(1);
            document.getElementById('avgIlvl').textContent = '📊 Avg iLvl: ' + avg;
        }
        
        // Render cards
        renderScorecards(data.members);
        
    } catch (error) {
        showError(error.message);
    } finally {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('fetchBtn').disabled = false;
        document.getElementById('fetchBtn').textContent = '▶ LOAD ROSTER';
    }
}

function renderScorecards(members) {
    const grid = document.getElementById('scorecardGrid');
    grid.innerHTML = '';
    
    if (!members || members.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#8892b0;padding:40px;">No members found. Check guild name and realm.</p>';
        return;
    }
    
    for (var i = 0; i < members.length; i++) {
        var member = members[i];
        var index = i;
        
        var card = document.createElement('div');
        card.className = 'player-card';
        
        if (index === 0) card.classList.add('top-1');
        else if (index === 1) card.classList.add('top-2');
        else if (index === 2) card.classList.add('top-3');
        
        var rankEmoji = '' + (index + 1);
        if (index === 0) rankEmoji = '🥇';
        else if (index === 1) rankEmoji = '🥈';
        else if (index === 2) rankEmoji = '🥉';
        
        var ilvlDisplay = member.item_level > 0 ? member.item_level : 'N/A';
        
        card.innerHTML = 
            '<div class="rank-badge">' + rankEmoji + '</div>' +
            '<div class="class-indicator" style="background: ' + member.class_color + ';"></div>' +
            '<div class="card-header">' +
                '<div>' +
                    '<div class="player-name">' + member.name + '</div>' +
                    '<div class="player-class">' + member.class + ' • ' + member.race + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="player-stats">' +
                '<div class="stat-item">' +
                    '<div class="stat-label">Level</div>' +
                    '<div class="stat-value">' + member.level + '</div>' +
                '</div>' +
                '<div class="stat-item">' +
                    '<div class="stat-label">Item Level</div>' +
                    '<div class="stat-value ilvl">' + ilvlDisplay + '</div>' +
                '</div>' +
                '<div class="stat-item">' +
                    '<div class="stat-label">Achievements</div>' +
                    '<div class="stat-value">' + member.achievement_points.toLocaleString() + '</div>' +
                '</div>' +
            '</div>';
        
        grid.appendChild(card);
    }
}

function showError(message) {
    var errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = '❌ ' + message;
    errorDiv.classList.remove('hidden');
}

window.fetchScorecard = fetchScorecard;