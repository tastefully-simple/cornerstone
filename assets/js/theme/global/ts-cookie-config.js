import TSCookie from '../common/ts-cookie';

// Currently set to 15 minutes.
// @TODO: Change this to 24 hours once QA passes
const IN_N_MINUTES = 15 * 60 * 1000;

class TSCookieConfig {
    constructor() {
        // TST-443/TST-473
        // Delete old TS cookies
        TSCookie.deleteOldTSCookies();

        // TST-473 Remove TS Affiliation cookies
        // after the set expiration time
        this.cookieSessionChecker();
    }

    cookieSessionChecker() {
        const initSessionExpiration = new Date(new Date().getTime() + IN_N_MINUTES);

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
        const initSessionExpireTime = new Date(new Date().getTime() + IN_N_MINUTES);
        TSCookie.setAffiliationExpiration(initSessionExpireTime);

        window.location.reload();

        setTimeout(
            () => this.deleteAffiliationCookies(),
            this.getCookieSessionExpiration(),
        );
    }

    getCookieSessionExpiration() {
        const expiration = new Date(TSCookie.getAffiliationExpiration());

        // @TODO: delete when QA passes
        console.warn('Affiliation cookies will expire on', expiration);

        // Convert to ms
        return expiration - Date.now();
    }
}

export default function () {
    $(document).ready(() => {
        const tsCookieConfig = new TSCookieConfig();

        return tsCookieConfig;
    });
}
