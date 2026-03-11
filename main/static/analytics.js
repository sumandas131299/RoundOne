// static/js/analytics.js
let clickMap = [];
let startTime = Date.now();
let maxScroll = 0;

// 1. Capture Technical: Page Load Speed
window.addEventListener('load', () => {
    const timing = performance.getEntriesByType("navigation")[0];
    const loadTime = timing.loadEventEnd - timing.startTime;
    window.pageLoadSpeed = loadTime; 
});

// 2. Capture Behavior: Scroll Depth
window.addEventListener('scroll', () => {
    let scrolled = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
    if (scrolled > maxScroll) maxScroll = scrolled;
});

// 3. Capture Behavior: Click Maps & Custom Events
document.addEventListener('click', (e) => {
    const clickEntry = { x: e.pageX, y: e.pageY, tag: e.target.tagName, time: Date.now() };
    
    // Custom Event: If it's a specific button like "Sign Up"
    if (e.target.innerText === "Sign Up") clickEntry.is_conversion = true;
    
    clickMap.push(clickEntry);
});

// 4. Unified Send (On Exit/Visibility Change)
// static/js/analytics.js
function dispatchMetrics() {
    // Only send if we have a user_id and some activity
    console.log(window.FLASK_USER_ID);

    const payload = {
        user_id: window.FLASK_USER_ID,
        load_speed: window.pageLoadSpeed || 0,
        scroll_depth: maxScroll,
        clicks: clickMap,
        path: window.location.pathname,
        duration: Math.round((Date.now() - startTime) / 1000),
        screen_width: window.innerWidth,    // Essential for Heatmap accuracy
        screen_height: window.innerHeight   // Essential for Heatmap accuracy
    };
    
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon('/api/analytics/collect', blob);
}
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') dispatchMetrics();
});