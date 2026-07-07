// scorecard.js - Calls your worker
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

async function fetchScorecard() {
    console.log('🏈 fetchScorecard called!');
    
    const guildInput = document.getElementById('guildInput').value.trim();
    const realm = document.getElementById('realmInput').value.trim();
    const region = document.getElementById('regionSelect').value;
    
    if (!guildInput || !realm) {
        showError('Please enter both guild name and realm');
        return;
    }
    
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
        const apiUrl = `https://guild-api.mikeyvandamme.workers.dev/?guild=${encodeURIComponent(guildInput)}&realm=${realm}&region=${region}`;
        console.log('📡 Fetching from worker:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Worker error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Worker response:', data);
        
        if (!data.success) {
            throw new Error(data.error || 'Worker returned error');
        }
        
        if (!data.members || data.members.length === 0) {
            throw new Error('No members found');
        }
        
        renderGuildData(data.members, data);
        
    } catch (error) {
        console.error('❌ Error:', error);
        showError(error.message || 'Failed to fetch guild data');
    } finally {
        if (loading) loading.classList.add('hidden');
        if (fetchBtn) {
            fetchBtn.disabled = false;
            fetchBtn.textContent = '▶ LOAD ROSTER';
        }
    }
}

function renderGuildData(members, data) {
    members.sort((a, b) => (b.item_level || 0) - (a.item_level || 0));
    
    const navGuild = document.getElementById('navGuildName');
    if (navGuild) navGuild.textContent = data.guild || document.getElementById('guildInput').value.trim();
    
    const navRealm = document.getElementById('navRealmName');
    if (navRealm) navRealm.textContent = (data.realm || document.getElementById('realmInput').value.trim()).toUpperCase();
    
    const memberCount = document.getElementById('memberCount');
    if (memberCount) memberCount.textContent = `👥 ${members.length} Members`;
    
    const lastUpdated = document.getElementById('lastUpdated');
    if (lastUpdated) lastUpdated.textContent = `🔄 ${data.updated || new Date().toLocaleString()}`;
    
    const ilvls = members.map(m => m.item_level).filter(v => v > 0);
    if (ilvls.length > 0) {
        const avg = (ilvls.reduce((a, b) => a + b, 0) / ilvls.length).toFixed(1);
        const avgEl = document.getElementById('avgIlvl');
        if (avgEl) avgEl.textContent = `📊 Avg iLvl: ${avg}`;
    }
    
    renderScorecards(members);
}

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
        const classColor = CLASS_COLORS[member.class] || '#FFFFFF';
        
        card.innerHTML = `
            <div class="rank-badge">${rankEmoji}</div>
            <div class="class-indicator" style="background: ${classColor};"></div>
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

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = '❌ ' + message;
        errorDiv.classList.remove('hidden');
    } else {
        console.error('❌ Error:', message);
    }
}

window.fetchScorecard = fetchScorecard;
console.log('✅ scorecard.js loaded (hybrid version)');