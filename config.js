// config.js - Site-wide configuration
// ============================================
// UPDATE THESE WITH YOUR GUILD INFORMATION
// ============================================


const CONFIG = {
    guild_name: 'Bonjour there',  // ← CHANGE THIS to your guild name
    realm: 'outland',           // ← CHANGE THIS to your realm (e.g., "Stormrage")
    region: 'eu',                 // us, eu, kr, tw, cn
    site_name: 'Guild Scorecard',
    version: '1.0.0'
};

// ============================================
// IMPORTANT: Get your Blizzard API credentials
// from: https://developers.battle.net
// ============================================
const BLIZZARD_CLIENT_ID = '225bf87dd49b4ff09ea39e933eac5dfd';        // ← CHANGE THIS
const BLIZZARD_CLIENT_SECRET = 's0syDCgvOYiU73VeY1iKiYUrqbD0Jrje'; // ← CHANGE THIS



// TEST: Add this alert to confirm config.js loads
alert('config.js loaded! Client ID: ' + BLIZZARD_CLIENT_ID);