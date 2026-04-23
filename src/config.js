/**
 * Configuration module for frontend application.
 * All environment variables are loaded from the root .env file.
 * Vite automatically loads variables prefixed with VITE_ from .env files.
 */

const config = {
  API_URL: import.meta.env.VITE_API_URL || "https://be.meichat-stag.meissasoftlogic.com"
}

export default config

