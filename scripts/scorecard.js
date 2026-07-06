// ============================================
// FETCH GUILD DATA WITH ITEM LEVELS
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
        // STEP 1: Get guild roster from Raider.io
        const rosterUrl = `https://raider.io/api/v1/guilds/profile?region=${region}&realm=${realm}&name=${encodeURIComponent(guildInput)}&fields=members`;
        console.log('📡 Fetching roster from Raider.io:', rosterUrl);
        
        const rosterResponse = await fetch(rosterUrl);
        if (!rosterResponse.ok) {
            throw new Error(`Raider.io error: ${rosterResponse.status}`);
        }
        
        const rosterData = await rosterResponse.json();
        console.log('📊 Roster found:', rosterData.members?.length || 0, 'members');
        
        if (!rosterData.members || rosterData.members.length === 0) {
            throw new Error('No members found. The guild might be private.');
        }
        
        // STEP 2: Get token from your worker for Blizzard API
        console.log('🔑 Getting Blizzard API token...');
        const tokenResponse = await fetch('https://guild-api.mikeyvandamme.workers.dev/token');
        if (!tokenResponse.ok) {
            throw new Error('Failed to get Blizzard API token');
        }
        const tokenData = await tokenResponse.json();
        const token = tokenData.token;
        console.log('✅ Token obtained');
        
        // STEP 3: Fetch item levels for each character
        const membersWithILvl = [];
        const memberList = rosterData.members.slice(0, 20); // Limit to 20 for speed
        
        console.log('📡 Fetching item levels for', memberList.length, 'members...');
        
        for (let i = 0; i < memberList.length; i++) {
            const member = memberList[i];
            const charName = member.character.name;
            const charRealm = member.character.realm?.slug || realm;
            
            try {
                // Call Blizzard API for character data
                const charUrl = `https://${region}.api.blizzard.com/profile/wow/character/${charRealm}/${charName.toLowerCase()}?namespace=profile-${region}`;
                const charResponse = await fetch(charUrl, {
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Battlenet-Namespace': `profile-${region}`
                    }
                });
                
                let itemLevel = 0;
                let achievementPoints = member.character.achievement_points || 0;
                
                if (charResponse.ok) {
                    const charData = await charResponse.json();
                    // Item level is in equipped_item_level
                    itemLevel = charData.equipped_item_level || 0;
                    
                    // Get achievement points if available
                    if (charData.achievement_points) {
                        achievementPoints = charData.achievement_points;
                    }
                    
                    console.log(`✅ ${charName}: iLvl ${itemLevel}`);
                } else {
                    console.log(`⚠️ Could not fetch ${charName}: ${charResponse.status}`);
                }
                
                membersWithILvl.push({
                    name: charName,
                    level: member.character.level || 0,
                    class: member.character.class || 'Unknown',
                    class_color: CLASS_COLORS[member.character.class] || '#FFFFFF',
                    race: member.character.race || 'Unknown',
                    item_level: itemLevel,
                    achievement_points: achievementPoints,
                    rank: member.rank || 0
                });
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.warn(`⚠️ Error fetching ${charName}:`, error.message);
                // Add member without iLvl
                membersWithILvl.push({
                    name: charName,
                    level: member.character.level || 0,
                    class: member.character.class || 'Unknown',
                    class_color: CLASS_COLORS[member.character.class] || '#FFFFFF',
                    race: member.character.race || 'Unknown',
                    item_level: 0,
                    achievement_points: member.character.achievement_points || 0,
                    rank: member.rank || 0
                });
            }
        }
        
        // Render the data
        renderGuildData(membersWithILvl, rosterData);
        console.log('✅ Done!', membersWithILvl.length, 'members loaded with iLvl');
        
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