// ==========================================
// UTILITIES MODULE
// ==========================================

// Number formatting utility
export function formatNumber(num) {
    if (!num && num !== 0) return 'N/A';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toLocaleString();
}

// Delay utility for async operations
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Simple hash function for password protection
export function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
}

// Clean search query for Spotify API
export function cleanSearchQuery(query) {
    return query
        .replace(/[()[\]{}]/g, '') // Remove brackets and parentheses
        .replace(/\bfeat\.?\b/gi, '') // Remove "feat" or "feat."
        .replace(/\bft\.?\b/gi, '') // Remove "ft" or "ft."
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
}

// Calculate movement indicator for charts
export function calculateMovement(currentRank, lastWeekRank) {
    if (!lastWeekRank || lastWeekRank === 0) return 'new';
    if (currentRank < lastWeekRank) return 'up';
    if (currentRank > lastWeekRank) return 'down';
    return 'same';
}

// Get change indicator HTML for chart items
export function getChangeIndicator(movement, lastWeek, currentRank) {
    switch (movement) {
        case 'new':
            return '<span class="change-indicator new">NEW</span>';
        case 'up':
            const upChange = lastWeek - currentRank;
            return `<span class="change-indicator up">+${upChange}</span>`;
        case 'down':
            const downChange = currentRank - lastWeek;
            return `<span class="change-indicator down">-${downChange}</span>`;
        case 'same':
            return '<span class="change-indicator same">—</span>';
        default:
            return '<span class="change-indicator same">—</span>';
    }
}

// Map label names to standard format
export function mapLabelName(originalLabel) {
    const labelMappings = {
        'PROV': 'Provident',
        'Provident': 'Provident',
        'CCMG': 'CCMG',
        '10KP': 'CCMG',
        'ADA': 'ADA',
        'ORCHARD': 'THE ORCHARD',
        'THE ORCHARD': 'THE ORCHARD',
        'INDI': 'Independent',
        'TRBL': 'Tribl',
        'COL': 'Columbia',
        'DEF': 'Def Jam',
        '12CM': 'CCMG'
    };
    return labelMappings[originalLabel] || originalLabel || 'Independent';
}

// Extract week number from date string
export function extractWeekNumber(weekString) {
    if (typeof weekString === 'string' && weekString.includes('/')) {
        const parts = weekString.split('/');
        const month = parseInt(parts[0]);
        const day = parseInt(parts[1]);
        
        // Calculate approximate week number (simplified approach)
        const weekNumber = Math.ceil((month * 4) + (day / 7));
        return weekNumber;
    }
    return 'Current';
}

// DOM utility functions
export const DOM = {
    createElement(tag, className, innerHTML) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    },

    ensureElement(id, defaultParent = document.body) {
        let element = document.getElementById(id);
        if (!element) {
            element = document.createElement('div');
            element.id = id;
            defaultParent.appendChild(element);
        }
        return element;
    },

    show(element) {
        if (element) element.style.display = 'block';
    },

    hide(element) {
        if (element) element.style.display = 'none';
    },

    toggleClass(element, className, condition) {
        if (element) {
            if (condition) {
                element.classList.add(className);
            } else {
                element.classList.remove(className);
            }
        }
    }
};

// Date utilities
export const DateUtils = {
    getCurrentWeek() {
        const now = new Date();
        return `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}/${now.getFullYear()}`;
    },

    isMonday() {
        return new Date().getDay() === 1;
    },

    getDaysSince(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        return (now - then) / (1000 * 60 * 60 * 24);
    }
};