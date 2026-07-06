// scorecard.js - Simplified version that calls your Cloudflare API
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

// Your new API endpoint
const API_URL = 'https://guild-api.mikeyvandamme.workers.dev';

async function fetchScorecard() {
    console.log('🏈 fetchScorecard called!');
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('scorecardGrid').innerHTML = '';
    document.getElementById('errorMessage').classList.add('hidden');
    document.getElementById('fetchBtn').disabled = true;
    document.getElementById('fetchBtn').textContent = '⏳ LOADING...';

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch data');
        }

        // Update navigation
        document.getElementById('navGuildName').textContent = data.guild;
        document.getElementById('navRealmName').textContent = data.realm.toUpperCase();

        // Update stats
        document.getElementById('memberCount').textContent = '👥 ' + data.total + ' Members';
        document.getElementById('lastUpdated').textContent = '🔄 ' + data.updated;

        // Calculate average iLvl
        const ilvls = data.members.map(m => m.item_level).filter(v => v > 0);
        if (ilvls.length > 0) {
            const avg = (ilvls.reduce((a, b) => a + b, 0) / ilvls.length).toFixed(1);
            document.getElementById('avgIlvl').textContent = '📊 Avg iLvl: ' + avg;
        }

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
            <div class="class-indicator" style="background: ${CLASS_COLORS[member.class] || '#FFFFFF'};"></div>
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
console.log('✅ scorecard.js loaded! API URL:', API_URL);