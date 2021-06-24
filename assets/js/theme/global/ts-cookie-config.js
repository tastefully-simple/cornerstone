import TSCookie from '../common/ts-cookie';

class TSCookieConfig {
    constructor(themeSettings) {
        // var themeSettings.ts_log_debugging
        // type: Boolean
        this.TS_DEBUG_MODE = themeSettings.ts_debug_mode;

        // var themeSettings.ts_affiliation_timer
        // type: Integer (minutes)
        this.IN_N_MINUTES = themeSettings.ts_affiliation_timer * 60 * 1000;

        // TST-443/TST-473
        // Delete old TS cookies
        TSCookie.deleteOldTSCookies();

        // TST-473 Remove TS Affiliation cookies
        // after the set expiration time
        this.cookieSessionChecker();
    }

    cookieSessionChecker() {
        const initSessionExpiration = new Date(new Date().getTime() + this.IN_N_MINUTES);

        if (!TSCookie.getAffiliationExpiration()) {
            TSCookie.setAffiliationExpiration(initSessionExpiration);
        }

        setTimeout(
            () => this.deleteAffiliationCookies(),
            this.getCookieSessionExpiration(),
        );
    }

    deleteAffiliationCookies() {
        // Delete TS Affiliation cookies
        TSCookie.deleteConsultant();
        TSCookie.deleteParty();

        // Reset cookie session checker
        TSCookie.deleteAffiliationExpiration();

        // Reinitialize with new expire time
        const initSessionExpireTime = new Date(new Date().getTime() + this.IN_N_MINUTES);
        TSCookie.setAffiliationExpiration(initSessionExpireTime);

        window.location.reload();

        setTimeout(
            () => this.deleteAffiliationCookies(),
            this.getCookieSessionExpiration(),
        );
    }

    getCookieSessionExpiration() {
        const expiration = new Date(TSCookie.getAffiliationExpiration());

        if (this.TS_DEBUG_MODE) {
            console.warn('Affiliation cookies will expire on', expiration);
        }

        // Convert to ms
        return expiration - Date.now();
    }
}

export default function (themeSettings) {
    $(document).ready(() => {
        const tsCookieConfig = new TSCookieConfig(themeSettings);

        return tsCookieConfig;
    });
}
