// scorecard.js - Complete with item level colors, raid progression, and clickable cards
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
    if (ilvl >= 290) return '#00ff88'; // Legendary
    if (ilvl >= 280) return '#ffd700'; // Epic
    if (ilvl >= 270) return '#ff8c00'; // Rare
    if (ilvl >= 260) return '#66ccff'; // Uncommon
    return '#aaaaaa'; // Common
}

// ============================================
// FETCH GUILD DATA (Roster + Progression)
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
        // ============================================
        // FETCH ROSTER FROM RAIDER.IO
        // ============================================
        const rosterUrl = `https://guild-api.mikeyvandamme.workers.dev/?guild=${encodeURIComponent(guildInput)}&realm=${realm}&region=${region}`;
        console.log('📡 Fetching roster:', rosterUrl);
        
        const rosterResponse = await fetch(rosterUrl);
        if (!rosterResponse.ok) throw new Error(`Roster error: ${rosterResponse.status}`);
        const rosterData = await rosterResponse.json();
        
        if (!rosterData.success) throw new Error(rosterData.error || 'Roster fetch failed');
        if (!rosterData.members || rosterData.members.length === 0) {
            throw new Error('No members found');
        }
        
        // ============================================
        // FETCH RAID PROGRESSION (optional)
        // ============================================
        let progressionData = null;
        try {
            const progUrl = `https://guild-api.mikeyvandamme.workers.dev/progression?guild=${encodeURIComponent(guildInput)}&realm=${realm}&region=${region}`;
            console.log('📡 Fetching progression:', progUrl);
            
            const progResponse = await fetch(progUrl);
            if (progResponse.ok) {
                const progResult = await progResponse.json();
                if (progResult.success) {
                    progressionData = progResult.progression;
                    console.log('✅ Progression data loaded');
                }
            }
        } catch (e) {
            console.warn('⚠️ Progression not available:', e.message);
        }
        
        // ============================================
        // UPDATE UI
        // ============================================
        // Navigation
        document.getElementById('navGuildName').textContent = rosterData.guild || guildInput;
        document.getElementById('navRealmName').textContent = (rosterData.realm || realm).toUpperCase();
        
        // Stats
        document.getElementById('memberCount').textContent = `👥 ${rosterData.members.length} Members`;
        document.getElementById('lastUpdated').textContent = `🔄 ${rosterData.updated || new Date().toLocaleString()}`;
        
        // Average iLvl
        const ilvls = rosterData.members.map(m => m.item_level).filter(v => v > 0);
        if (ilvls.length > 0) {
            const avg = (ilvls.reduce((a, b) => a + b, 0) / ilvls.length).toFixed(1);
            document.getElementById('avgIlvl').textContent = `📊 Avg iLvl: ${avg}`;
        }
        
        // ============================================
        // RENDER SCORECARD WITH ALL FEATURES
        // ============================================
        renderScorecards(rosterData.members, progressionData);
        
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
// RENDER SCORECARD CARDS (With Progression)
// ============================================
function renderScorecards(members, progressionData) {
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
    
    // ============================================
    // PROGRESSION BANNER (if available)
    // ============================================
    if (progressionData) {
        const banner = document.createElement('div');
        banner.className = 'progression-banner';
        banner.innerHTML = buildProgressionHTML(progressionData);
        grid.appendChild(banner);
    }
    
    // ============================================
    // MEMBER CARDS
    // ============================================
    members.forEach((member, index) => {
        const card = document.createElement('div');
        card.className = 'player-card clickable';
        if (index === 0) card.classList.add('top-1');
        else if (index === 1) card.classList.add('top-2');
        else if (index === 2) card.classList.add('top-3');
        
        // Rank name
        const rankName = RANK_NAMES[member.rank] || `Rank ${member.rank}`;
        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
        
        // Item level with color
        const ilvlDisplay = member.item_level > 0 ? member.item_level : 'N/A';
        const ilvlColor = member.item_level > 0 ? getItemLevelColor(member.item_level) : '#666';
        
        const classColor = CLASS_COLORS[member.class] || '#FFFFFF';
        
        card.innerHTML = `
            <div class="rank-badge">${rankEmoji}</div>
            <div class="class-indicator" style="background: ${classColor};"></div>
            <div class="card-header">
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
                    <div class="stat-value ilvl" style="color: ${ilvlColor};">
                        ${ilvlDisplay}
                    </div>
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
        
        // ============================================
        // CLICK EVENT - Show character details
        // ============================================
        card.addEventListener('click', function() {
            showCharacterDetails(member);
        });
        
        grid.appendChild(card);
    });
}

// ============================================
// BUILD PROGRESSION HTML
// ============================================
function buildProgressionHTML(progression) {
    if (!progression) return '';
    
    let html = '<div class="progression-header">🏆 RAID PROGRESSION</div><div class="progression-content">';
    
    // Find the latest expansion
    const expansions = progression.expansions || [];
    if (expansions.length === 0) {
        return '<div class="progression-content">No progression data available</div>';
    }
    
    // Show the most recent expansion first
    const latestExpansion = expansions[expansions.length - 1];
    html += `<div class="progression-expansion">${latestExpansion.expansion}</div>`;
    
    const raids = latestExpansion.raids || [];
    raids.forEach(raid => {
        const bossCount = raid.bosses?.length || 0;
        const kills = raid.bosses?.filter(b => b.kills > 0).length || 0;
        const difficulty = raid.difficulty || 'Normal';
        
        html += `
            <div class="progression-raid">
                <span class="progression-raid-name">${raid.name}</span>
                <span class="progression-raid-diff">${difficulty}</span>
                <span class="progression-raid-progress">${kills}/${bossCount}</span>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// ============================================
// SHOW CHARACTER DETAILS (Modal)
// ============================================
function showCharacterDetails(member) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.character-modal');
    if (existingModal) existingModal.remove();
    
    const ilvlColor = member.item_level > 0 ? getItemLevelColor(member.item_level) : '#666';
    const rankName = RANK_NAMES[member.rank] || `Rank ${member.rank}`;
    const classColor = CLASS_COLORS[member.class] || '#FFFFFF';
    
    const modal = document.createElement('div');
    modal.className = 'character-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="this.closest('.character-modal').remove()">✕</button>
            <div class="modal-header">
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
                    <span class="modal-stat-value" style="color: ${ilvlColor};">${member.item_level > 0 ? member.item_level : 'N/A'}</span>
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

console.log('✅ scorecard.js loaded (full features)');