// config.js - Site-wide configuration
// ============================================
// UPDATE THESE WITH YOUR GUILD INFORMATION
// ============================================


const CONFIG = {
    guild_name: 'Bonjour There',  // ← Use the actual guild name with space
    realm: 'outland',
    region: 'eu',
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