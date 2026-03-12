/**
 * AWARNESS ACADEMY - Application Configuration
 * Centralized configuration for the frontend
 */

const CONFIG = {
    // Feature Flags
    ENABLE_NOTIFICATIONS: true,
    ENABLE_CHATBOT: true,

    // Other Constants
    APP_NAME: 'Awareness Academy',

    // API URLs - will be set based on environment below
    API_BASE_URL: '',
    CLIENT_URL: '',

    // Runtime-configurable URLs
    JITSI_BASE_URL: '',
    DEFAULT_COURSE_THUMBNAIL_URL: ''
};

// Runtime overrides (inject via window.__APP_CONFIG__ from server/env)
const runtimeConfig = (typeof window !== 'undefined' && window.__APP_CONFIG__) ? window.__APP_CONFIG__ : {};

CONFIG.CLIENT_URL = runtimeConfig.CLIENT_URL || window.location.origin;
CONFIG.API_BASE_URL = runtimeConfig.API_BASE_URL || `${CONFIG.CLIENT_URL}/api`;
CONFIG.JITSI_BASE_URL = runtimeConfig.JITSI_BASE_URL || 'https://meet.jit.si';
CONFIG.DEFAULT_COURSE_THUMBNAIL_URL = runtimeConfig.DEFAULT_COURSE_THUMBNAIL_URL || `${CONFIG.CLIENT_URL}/assets/images/home_meditation.jpg`;
