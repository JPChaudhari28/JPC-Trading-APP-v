// server/src/services/zerodha.js
import dotenv from "dotenv";
dotenv.config();

let KiteConnect;
try {
  // Dynamically import KiteConnect (to avoid crash if not installed)
  ({ KiteConnect } = await import("kiteconnect"));
} catch (err) {
  console.warn(
    "⚠️ KiteConnect module not installed. Zerodha services disabled."
  );
}

/**
 * Zerodha Service Wrapper
 * - Handles safe KiteConnect usage
 * - Protects app from crashes if module/credentials are missing
 */
export default class ZerodhaService {
  constructor() {
    this.kite = null;

    if (KiteConnect && process.env.KITE_API_KEY) {
      this.kite = new KiteConnect({
        api_key: process.env.KITE_API_KEY,
      });

      // If token exists, set it immediately
      if (process.env.KITE_ACCESS_TOKEN) {
        this.kite.setAccessToken(process.env.KITE_ACCESS_TOKEN);
        console.log("✅ Zerodha initialized with access token");
      } else {
        console.warn("⚠️ No KITE_ACCESS_TOKEN found in environment.");
      }
    } else {
      console.warn(
        "⚠️ Zerodha service disabled: Missing KiteConnect or API key."
      );
    }
  }

  /**
   * Safely call a KiteConnect API
   * @param {Function} fn - async function that receives kite instance
   * @returns {*} API response or null if unavailable
   */
  async call(fn) {
    if (!this.kite) {
      console.error("❌ Zerodha service unavailable (no Kite instance)");
      return null;
    }

    try {
      return await fn(this.kite);
    } catch (err) {
      console.error("❌ Zerodha API call failed:", err.message);
      return null;
    }
  }

  /**
   * Generate Zerodha login URL
   */
  getLoginURL() {
    if (!this.kite) return null;
    return this.kite.getLoginURL();
  }

  /**
   * Exchange request_token for access_token
   */
  async generateSession(requestToken) {
    if (!this.kite) return null;

    try {
      const session = await this.kite.generateSession(
        requestToken,
        process.env.KITE_API_SECRET
      );

      // Store new access_token (for runtime)
      this.kite.setAccessToken(session.access_token);

      console.log("✅ Zerodha session created successfully");
      return session;
    } catch (err) {
      console.error("❌ Failed to generate Zerodha session:", err.message);
      return null;
    }
  }
}

// Export singleton
export const zerodhaService = new ZerodhaService();
