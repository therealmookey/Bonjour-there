// scorecard.js - Raider.io version
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

const RANK_NAMES = {
    0: '👑 Guild Master',
    1: '⚔️ Officer',
    2: '🛡️ Veteran',
    3: '🗡️ Raider',
    4: '🪙 Member',
    5: '🔰 Trial'
};

function getCharacterAvatar(className) {
    const classIcons = {
        'Warrior': '⚔️',
        'Paladin': '🛡️',
        'Hunter': '🏹',
        'Rogue': '🗡️',
        'Priest': '✨',
        'Death Knight': '💀',
        'Shaman': '🌊',
        'Mage': '🔮',
        'Warlock': '👿',
        'Monk': '🍺',
        'Druid': '🐻',
        'Demon Hunter': '😈',
        'Evoker': '🐉'
    };
    return classIcons[className] || '👤';
}

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
        if (!response.ok) throw new Error(`Worker error: ${response.status}`);
        
        const data = await response.json();
        console.log('📊 Worker response:', data);
        
        if (!data.success) throw new Error(data.error || 'Worker returned error');
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
    members.sort((a, b) => a.rank - b.rank);
    
    document.getElementById('navGuildName').textContent = data.guild || document.getElementById('guildInput').value.trim();
    document.getElementById('navRealmName').textContent = (data.realm || document.getElementById('realmInput').value.trim()).toUpperCase();
    document.getElementById('memberCount').textContent = `👥 ${members.length} Members`;
    document.getElementById('lastUpdated').textContent = `🔄 ${data.updated || new Date().toLocaleString()}`;
    
    renderScorecards(members);
}

function renderScorecards(members) {
    const grid = document.getElementById('scorecardGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (!members || members.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#8892b0;padding:40px;">No members found.</p>';
        return;
    }
    
    members.forEach((member, index) => {
        const card = document.createElement('div');
        card.className = 'player-card clickable';
        if (index === 0) card.classList.add('top-1');
        else if (index === 1) card.classList.add('top-2');
        else if (index === 2) card.classList.add('top-3');
        
        const rankName = RANK_NAMES[member.rank] || `Rank ${member.rank}`;
        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
        const classColor = CLASS_COLORS[member.class] || '#FFFFFF';
        const classAvatar = getCharacterAvatar(member.class);
        
        card.innerHTML = `
            <div class="rank-badge">${rankEmoji}</div>
            <div class="class-indicator" style="background: ${classColor};"></div>
            <div class="card-header">
                <div class="class-avatar">${classAvatar}</div>
                <div>
                    <div class="player-name">${member.name || 'Unknown'}</div>
                    <div class="player-class">${member.class || 'Unknown'} • ${member.race || 'Unknown'}</div>
                    <div class="player-rank">${rankName}</div>
                </div>
            </div>
            <div class="player-stats">
                <div class="stat-item">
                    <div class="stat-label">Level</div>
                    <div class="stat-value">${member.level || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Achievements</div>
                    <div class="stat-value">${(member.achievement_points || 0).toLocaleString()}</div>
                </div>
            </div>
            <div class="card-footer">
                <span class="click-hint">👆 Click for details</span>
            </div>
        `;
        
        card.addEventListener('click', function() {
            showCharacterDetails(member);
        });
        
        grid.appendChild(card);
    });
}

function showCharacterDetails(member) {
    const existingModal = document.querySelector('.character-modal');
    if (existingModal) existingModal.remove();
    
    const rankName = RANK_NAMES[member.rank] || `Rank ${member.rank}`;
    const classColor = CLASS_COLORS[member.class] || '#FFFFFF';
    const classAvatar = getCharacterAvatar(member.class);
    
    const modal = document.createElement('div');
    modal.className = 'character-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="this.closest('.character-modal').remove()">✕</button>
            <div class="modal-header">
                <div class="modal-portrait">${classAvatar}</div>
                <div class="modal-class-indicator" style="background: ${classColor};"></div>
                <div>
                    <h2>${member.name}</h2>
                    <p class="modal-subtitle">${member.class} • ${member.race}</p>
                    <p class="modal-rank">${rankName}</p>
                </div>
            </div>
            <div class="modal-stats">
                <div class="modal-stat">
                    <span class="modal-stat-label">Level</span>
                    <span class="modal-stat-value">${member.level || 0}</span>
                </div>
                <div class="modal-stat">
                    <span class="modal-stat-label">Achievements</span>
                    <span class="modal-stat-value">${(member.achievement_points || 0).toLocaleString()}</span>
                </div>
            </div>
            <div class="modal-actions">
                <button onclick="this.closest('.character-modal').remove()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = '❌ ' + message;
        errorDiv.classList.remove('hidden');
    }
}

window.fetchScorecard = fetchScorecard;
console.log('✅ scorecard.js loaded (Raider.io version)');