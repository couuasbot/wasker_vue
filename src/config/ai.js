/**
 * AI Assistant Configuration
 */

// Read environment variables
const COZE_CN_BOT_ID = import.meta.env.VITE_COZE_CN_BOT_ID;
const COZE_GLOBAL_BOT_ID = import.meta.env.VITE_COZE_GLOBAL_BOT_ID;
const COZE_CN_TOKEN = import.meta.env.VITE_COZE_CN_TOKEN;
const COZE_GLOBAL_TOKEN = import.meta.env.VITE_COZE_GLOBAL_TOKEN;

/**
 * Detects the user's timezone to decide which bot to load.
 * @returns {'CN' | 'GLOBAL'}
 */
export function detectRegion() {
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // List of timezones to serve the CN bot to
        const cnTimeZones = [
            'Asia/Shanghai',
            'Asia/Urumqi',
            'Asia/Harbin',
            'Asia/Chongqing',
            'Asia/Kashgar'
        ];

        if (cnTimeZones.includes(timeZone)) {
            return 'CN';
        }
        return 'GLOBAL';
    } catch (e) {
        console.warn('Timezone detection failed, defaulting to GLOBAL:', e);
        return 'GLOBAL';
    }
}

/**
 * Get the Bot ID based on the region.
 * @param {'CN' | 'GLOBAL'} region 
 * @returns {string}
 */
export function getBotId(region) {
    if (region === 'CN') {
        return COZE_CN_BOT_ID;
    }
    return COZE_GLOBAL_BOT_ID;
}

/**
 * Get the Access Token based on the region.
 * @param {'CN' | 'GLOBAL'} region 
 * @returns {string}
 */
export function getToken(region) {
    if (region === 'CN') {
        return COZE_CN_TOKEN;
    }
    return COZE_GLOBAL_TOKEN;
}

export const CONFIG = {
    COZE_CN_BOT_ID,
    COZE_GLOBAL_BOT_ID
};
