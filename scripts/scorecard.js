// scorecard.js - With character portraits
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
// RANK NAMES MAPPING
// ============================================
const RANK_NAMES = {
    0: '👑 Guild Master',
    1: '⚔️ Officer',
    2: '🛡️ Veteran',
    3: '🗡️ Raider',
    4: '🪙 Member',
    5: '🔰 Trial'
};

// ============================================
// ITEM LEVEL COLORS
// ============================================
function getItemLevelColor(ilvl) {
    if (ilvl >= 600) return '#00ff88';
    if (ilvl >= 550) return '#ffd700';
    if (ilvl >= 500) return '#ff8c00';
    if (ilvl >= 450) return '#66ccff';
    return '#aaaaaa';
}

// ============================================
// GENERATE CHARACTER PORTRAIT URL
// ============================================
function getCharacterPortrait(thumbnail, region) {
    if (!thumbnail) return null;
    // thumbnail format: "realmSlug/folder/avatar-id-avatar.jpg"
    // Example: "outland/5/123456789-avatar.jpg"
    // Remove the "-avatar.jpg" part to get the base path, then add -inset.jpg for a better portrait
    const basePath = thumbnail.replace('-avatar.jpg', '');
    return `https://render.worldofwarcraft.com/${region}/character/${basePath}-inset.jpg`;
}

// ============================================
// FETCH GUILD DATA
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
        // Fetch from your worker
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
        
        // Update UI
        renderGuildData(data.members, data, region);
        
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

// ============================================
// RENDER GUILD DATA
// ============================================
function renderGuildData(members, data, region) {
    // Sort by rank (0 is highest)
    members.sort((a, b) => a.rank - b.rank);
    
    // Update navigation
    const navGuild = document.getElementById('navGuildName');
    if (navGuild) navGuild.textContent = data.guild || document.getElementById('guildInput').value.trim();
    
    const navRealm = document.getElementById('navRealmName');
    if (navRealm) navRealm.textContent = (data.realm || document.getElementById('realmInput').value.trim()).toUpperCase();
    
    // Update stats
    const memberCount = document.getElementById('memberCount');
    if (memberCount) memberCount.textContent = `👥 ${members.length} Members`;
    
    const lastUpdated = document.getElementById('lastUpdated');
    if (lastUpdated) lastUpdated.textContent = `🔄 ${data.updated || new Date().toLocaleString()}`;
    
    // Calculate average iLvl (if available)
    const ilvls = members.map(m => m.item_level).filter(v => v > 0);
    if (ilvls.length > 0) {
        const avg = (ilvls.reduce((a, b) => a + b, 0) / ilvls.length).toFixed(1);
        const avgEl = document.getElementById('avgIlvl');
        if (avgEl) avgEl.textContent = `📊 Avg iLvl: ${avg}`;
    }
    
    // Render cards
    renderScorecards(members, region);
}

// ============================================
// RENDER SCORECARD CARDS (with portraits)
// ============================================
function renderScorecards(members, region = 'eu') {
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
        card.className = 'player-card clickable';
        if (index === 0) card.classList.add('top-1');
        else if (index === 1) card.classList.add('top-2');
        else if (index === 2) card.classList.add('top-3');
        
        // Rank name
        const rankName = RANK_NAMES[member.rank] || `Rank ${member.rank}`;
        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
        
        // Item level
        const ilvlDisplay = member.item_level > 0 ? member.item_level : '—';
        const ilvlColor = member.item_level > 0 ? getItemLevelColor(member.item_level) : '#666';
        
        // Class color
        const classColor = CLASS_COLORS[member.class] || '#FFFFFF';
        
        // ============================================
        // GENERATE PORTRAIT URL
        // ============================================
        const portraitUrl = getCharacterPortrait(member.thumbnail, region);
        
        card.innerHTML = `
            <div class="rank-badge">${rankEmoji}</div>
            <div class="class-indicator" style="background: ${classColor};"></div>
            <div class="card-header">
                ${portraitUrl ? `<img class="character-portrait" src="${portraitUrl}" alt="${member.name}" loading="lazy">` : ''}
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
                    <div class="stat-label">Item Level</div>
                    <div class="stat-value ilvl" style="color: ${ilvlColor};">${ilvlDisplay}</div>
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
        
        // Click event for character details
        card.addEventListener('click', function() {
            showCharacterDetails(member, region);
        });
        
        grid.appendChild(card);
    });
}

// ============================================
// SHOW CHARACTER DETAILS (with portrait)
// ============================================
function showCharacterDetails(member, region = 'eu') {
    // Remove existing modal if any
    const existingModal = document.querySelector('.character-modal');
    if (existingModal) existingModal.remove();
    
    const ilvlColor = member.item_level > 0 ? getItemLevelColor(member.item_level) : '#666';
    const rankName = RANK_NAMES[member.rank] || `Rank ${member.rank}`;
    const classColor = CLASS_COLORS[member.class] || '#FFFFFF';
    const portraitUrl = getCharacterPortrait(member.thumbnail, region);
    
    const modal = document.createElement('div');
    modal.className = 'character-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="this.closest('.character-modal').remove()">✕</button>
            <div class="modal-header">
                ${portraitUrl ? `<img class="modal-portrait" src="${portraitUrl}" alt="${member.name}">` : ''}
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
                    <span class="modal-stat-label">Item Level</span>
                    <span class="modal-stat-value" style="color: ${ilvlColor};">${member.item_level > 0 ? member.item_level : '—'}</span>
                </div>
                <div class="modal-stat">
                    <span class="modal-stat-label">Achievement Points</span>
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

// ============================================
// SHOW ERROR
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
// MAKE FUNCTION GLOBAL
// ============================================
window.fetchScorecard = fetchScorecard;

console.log('✅ scorecard.js loaded (with portraits)');