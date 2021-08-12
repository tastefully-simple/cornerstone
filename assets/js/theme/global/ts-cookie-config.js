import TSCookie from '../common/ts-cookie';

class TSCookieConfig {
    constructor(themeSettings) {
        // var themeSettings.ts_debug_mode
        // type: Boolean
        this.TS_DEBUG_MODE = themeSettings.ts_debug_mode;

        // var themeSettings.zoy_dev_mode
        // type: Boolean
        this.ZOY_DEV_MODE = themeSettings.zoy_dev_mode;

        // var themeSettings.ts_affiliation_timer
        // type: Integer (minutes)
        this.IN_N_MINUTES = themeSettings.ts_affiliation_timer * 60 * 1000;

        // TST-443/TST-473
        // This fix only applies for the 3 TST environments.
        // Local dev env is not affected by this issue.
        if (!this.ZOY_DEV_MODE) {
            TSCookie.deleteOldTSCookies();
        }

        // TST-473 Remove TS Affiliation cookies
        // after the set expiration time
        this.cookieSessionChecker();
    }

    cookieSessionChecker() {
        const initSessionExpiration = new Date(new Date().getTime() + this.IN_N_MINUTES);

        if (this.isDateValid(initSessionExpiration)) {
            const expirationCookie = TSCookie.getAffiliationExpiration();

            // Check first if affiliationExpiration cookie exists
            // If it does not, set a new expiration date and save it
            // as a cookie
            // Else set the existing expiration from cookie
            let expiration;
            if (!expirationCookie) {
                expiration = initSessionExpiration;
                TSCookie.setAffiliationExpiration(expiration);
            } else {
                expiration = new Date(expirationCookie);
            }

            if (this.isDateValid(expiration)) {
                setTimeout(
                    () => this.deleteAffiliationCookies(),
                    this.getCookieSessionExpiration(expiration),
                );
            } else {
                TSCookie.deleteAffiliationExpiration();
            }
        }
    }

    deleteAffiliationCookies() {
        // Delete TS Affiliation cookies
        TSCookie.deleteConsultant();
        TSCookie.deleteParty();

        // Reset cookie session checker
        TSCookie.deleteAffiliationExpiration();

        // Reinitialize with new expire time
        const initSessionExpiration = new Date(new Date().getTime() + this.IN_N_MINUTES);

        if (this.isDateValid(initSessionExpiration)) {
            TSCookie.setAffiliationExpiration(initSessionExpiration);

            window.location.reload();

            setTimeout(
                () => this.deleteAffiliationCookies(),
                this.getCookieSessionExpiration(initSessionExpiration),
            );
        }
    }

    getCookieSessionExpiration(expiration) {
        if (this.TS_DEBUG_MODE) {
            console.warn('Affiliation cookies will expire on', expiration);
        }

        // Convert to ms
        return expiration - Date.now();
    }

    isDateValid(date) {
        return date.toString() !== 'Invalid Date';
    }
}

export default function (themeSettings) {
    $(document).ready(() => {
        const tsCookieConfig = new TSCookieConfig(themeSettings);

        return tsCookieConfig;
    });
}
