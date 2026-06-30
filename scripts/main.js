// scripts/main.js - Main JavaScript file

// ============================================
// Load navigation and footer from includes folder
// ============================================
async function loadIncludes() {
    try {
        // Load navigation
        const navResponse = await fetch('includes/header.html');
        if (navResponse.ok) {
            const navHtml = await navResponse.text();
            document.getElementById('navigation').innerHTML = navHtml;
            
            // Highlight current page in navigation
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            document.querySelectorAll('.nav-link').forEach(function(link) {
                const href = link.getAttribute('href');
                if (href === currentPage) {
                    link.classList.add('active');
                }
            });
        }
        
        // Load footer
        const footerResponse = await fetch('includes/footer.html');
        if (footerResponse.ok) {
            const footerHtml = await footerResponse.text();
            document.getElementById('footer').innerHTML = footerHtml;
            
            // Set version from config
            const versionEl = document.getElementById('footerVersion');
            if (versionEl && typeof CONFIG !== 'undefined') {
                versionEl.textContent = CONFIG.version || '1.0.0';
            }
        }
        
        // Update navigation with config values
        if (typeof CONFIG !== 'undefined') {
            const navGuild = document.getElementById('navGuildName');
            if (navGuild) {
                navGuild.textContent = CONFIG.guild_name || 'Your Guild';
            }
            const navRealm = document.getElementById('navRealmName');
            if (navRealm) {
                navRealm.textContent = (CONFIG.realm || 'Realm').toUpperCase();
            }
            
            // Set input values
            const guildInput = document.getElementById('guildInput');
            if (guildInput) {
                guildInput.value = CONFIG.guild_name || '';
            }
            const realmInput = document.getElementById('realmInput');
            if (realmInput) {
                realmInput.value = CONFIG.realm || '';
            }
            const regionSelect = document.getElementById('regionSelect');
            if (regionSelect && CONFIG.region) {
                regionSelect.value = CONFIG.region;
            }
        }
        
        // Auto-fetch if guild name is set
        setTimeout(function() {
            const guildInput = document.getElementById('guildInput');
            if (guildInput && guildInput.value && guildInput.value !== 'YourGuildName' && guildInput.value !== '') {
                if (typeof fetchScorecard === 'function') {
                    fetchScorecard();
                }
            }
        }, 500);
        
        // Update footer time
        updateFooterTime();
        
    } catch (error) {
        console.warn('Could not load includes:', error);
        // Fallback: show something if includes fail
        document.getElementById('navigation').innerHTML = '<nav class="main-nav"><div class="nav-brand"><span class="sport-icon">🏈</span><span class="brand-text">GUILD SCORECARD</span></div></nav>';
    }
}

// Update footer with timestamp
function updateFooterTime() {
    const now = new Date();
    const timeStr = now.toLocaleString();
    const footerEl = document.getElementById('footerUpdate');
    if (footerEl) {
        footerEl.textContent = timeStr;
    }
}

// Enter key support for inputs
document.addEventListener('DOMContentLoaded', function() {
    // Load navigation and footer
    loadIncludes();
    
    // Enter key support
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const target = e.target;
            if (target.tagName === 'INPUT' && target.closest('.controls')) {
                if (typeof fetchScorecard === 'function') {
                    fetchScorecard();
                }
            }
        }
    });
});

// Expose updateFooterTime globally
window.updateFooterTime = updateFooterTime;