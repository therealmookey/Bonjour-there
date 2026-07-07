// ============================================
// VERSION - CHANGE THIS TO SEE UPDATES
// ============================================
const APP_VERSION = 'v2.8 - PAGES DEPLOY';

// ============================================
// VISUAL TEST - RED BACKGROUND
// ============================================
document.body.style.backgroundColor = '#ff4444'; // Bright red!
console.log('🔴 RED BACKGROUND - NEW CODE IS RUNNING!');

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

console.log(`🏈 Guild Scorecard ${APP_VERSION} loaded!`);

// ============================================
// GET CLASS ICON (FALLBACK)
// ============================================
function getClassIcon(className) {
    const icons = {
        'Warrior': 'https://wow.zamimg.com/images/wow/icons/large/class_warrior.jpg',
        'Paladin': 'https://wow.zamimg.com/images/wow/icons/large/class_paladin.jpg',
        'Hunter': 'https://wow.zamimg.com/images/wow/icons/large/class_hunter.jpg',
        'Rogue': 'https://wow.zamimg.com/images/wow/icons/large/class_rogue.jpg',
        'Priest': 'https://wow.zamimg.com/images/wow/icons/large/class_priest.jpg',
        'Death Knight': 'https://wow.zamimg.com/images/wow/icons/large/class_deathknight.jpg',
        'Shaman': 'https://wow.zamimg.com/images/wow/icons/large/class_shaman.jpg',
        'Mage': 'https://wow.zamimg.com/images/wow/icons/large/class_mage.jpg',
        'Warlock': 'https://wow.zamimg.com/images/wow/icons/large/class_warlock.jpg',
        'Monk': 'https://wow.zamimg.com/images/wow/icons/large/class_monk.jpg',
        'Druid': 'https://wow.zamimg.com/images/wow/icons/large/class_druid.jpg',
        'Demon Hunter': 'https://wow.zamimg.com/images/wow/icons/large/class_demonhunter.jpg',
        'Evoker': 'https://wow.zamimg.com/images/wow/icons/large/class_evoker.jpg'
    };
    return icons[className] || 'https://wow.zamimg.com/images/wow/icons/large/class_default.jpg';
}

// ============================================
// FETCH GUILD DATA
// ============================================
async function fetchScorecard() {
    console.log(`🏈 fetchScorecard called (${APP_VERSION})`);
    
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
        const apiUrl = `https://bonjourthere2.mikeyvandamme.workers.dev/?guild=${encodeURIComponent(guildInput)}&realm=${realm}&region=${region}`;
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

// ============================================
// RENDER GUILD DATA
// ============================================
function renderGuildData(members, data) {
    members.sort((a, b) => a.rank - b.rank);
    
    document.getElementById('navGuildName').textContent = data.guild || document.getElementById('guildInput').value.trim();
    document.getElementById('navRealmName').textContent = (data.realm || document.getElementById('realmInput').value.trim()).toUpperCase();
    document.getElementById('memberCount').textContent = `👥 ${members.length} Members`;
    document.getElementById('lastUpdated').textContent = `🔄 ${data.updated || new Date().toLocaleString()}`;
    
    // ============================================
    // VERSION BANNER
    // ============================================
    const existingBanner = document.getElementById('versionBanner');
    if (existingBanner) existingBanner.remove();
    
    const versionDisplay = document.createElement('div');
    versionDisplay.id = 'versionBanner';
    versionDisplay.style.cssText = `
        text-align: center;
        color: #ffd700;
        font-size: 0.9rem;
        padding: 8px;
        margin: 10px 0 15px 0;
        border: 2px solid #ffd700;
        border-radius: 8px;
        background: #1a1a2e;
        font-weight: bold;
        letter-spacing: 1px;
    `;
    versionDisplay.textContent = `🏈 Guild Scorecard ${APP_VERSION} ✅`;
    
    const controls = document.querySelector('.controls');
    if (controls) {
        controls.parentNode.insertBefore(versionDisplay, controls.nextSibling);
    }
    
    renderScorecards(members);
}

// ============================================
// RENDER SCORECARD CARDS
// ============================================
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
        
        // Use portrait URL from worker if available, otherwise fallback to class icon
        const portraitUrl = member.portrait || null;
        const classIconUrl = getClassIcon(member.class);
        const imageUrl = portraitUrl || classIconUrl;
        
        card.innerHTML = `
            <div class="rank-badge">${rankEmoji}</div>
            <div class="class-indicator" style="background: ${classColor};"></div>
            <div class="card-header">
                <img class="character-image" 
                     src="${imageUrl}" 
                     alt="${member.name}" 
                     loading="lazy"
                     onerror="this.style.display='none'">
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
        
        // Click to open armory
        card.addEventListener('click', function() {
            const armoryUrl = member.armory_url || null;
            if (armoryUrl) {
                window.open(armoryUrl, '_blank');
            } else {
                const name = member.name || 'Unknown';
                const realm = member.realm || 'outland';
                const region = 'eu';
                const cleanName = name.toLowerCase().replace(/ /g, '-');
                const cleanRealm = realm.toLowerCase().replace(/ /g, '-');
                window.open(`https://worldofwarcraft.blizzard.com/${region}/character/${cleanRealm}/${cleanName}/`, '_blank');
            }
        });
        
        grid.appendChild(card);
    });
}

// ============================================
// SHOW ERROR
// ============================================
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = '❌ ' + message;
        errorDiv.classList.remove('hidden');
    }
}

// ============================================
// MAKE FUNCTION GLOBAL
// ============================================
window.fetchScorecard = fetchScorecard;

console.log(`✅ scorecard.js loaded (${APP_VERSION})`);
