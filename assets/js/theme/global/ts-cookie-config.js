import TSCookie from '../common/ts-cookie';

export default class TSCookieConfig {
    constructor() {
        // TST-443/TST-473
        // Delete old TS cookies
        TSCookie.deleteOldTSCookies();
    }
}
