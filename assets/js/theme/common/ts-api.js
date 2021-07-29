export default class TSApi {
    constructor() {
        this.baseUrl = window.theme_settings.ts_tsapi_base_url;
        this.hostPartyBaseUrl = window.theme_settings.ts_tsapi_host_party_base_url;
    }

    fullUrl(uri) {
        return this.baseUrl + uri;
    }

    fullPartyUrl(uri) {
        return this.hostPartyBaseUrl + uri;
    }

    welcomeCheck(email) {
        return fetch(this.fullUrl('/users/welcome/check'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
    }

    /*
     * Check Customer last login
     */
    lastLoginCheck(email) {
        return fetch(this.fullUrl('/users/welcome/lastLogin'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
    }

    /*
     * Cart - Affiliation check
     * var affiliations {}
     * - CartID
     * - Email
     * - ConsultantID
     * - PartyID
     */
    affiliationCheck(affiliations) {
        return fetch(this.fullUrl('/cart/affiliationcheck'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(affiliations),
        });
    }

    /*
     * Find a Consultant
     */
    searchConsultantsByZip(zip, radius, page, size) {
        const uri = `/search/shop/zip/${zip}/${radius}/${page}/${size}`;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    searchConsultantsByName(name, state, page, size) {
        const uri = `/search/shop/name/${name}/${state}/${page}/${size}`;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    getConsultant(id) {
        const uri = `/search/shop/cid/${id}`;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    getPartiesByConsultant(cid, page, size) {
        const uri = `/search/party-list/${cid}/${page}/${size}`;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }


    /*
     * Find a Party
     */
    searchPartyByState(state, name, page, size, sid) {
        const uri = `/search/party/${state}/${page}/${size}?name=${name}&sid=${sid}`;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    /*
     * Consultant Detail Page
     */

    // Consultant - About Me
    getConsultantInfo(cid) {
        const uri = `/consultant/info?cid=${cid}`;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    // Consultant - My Story
    getConsultantStory(cid) {
        const uri = `/consultant/mystory?cid=${cid}`;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    // Consultant - My Parties
    getConsultantParties(cid) {
        const uri = `/consultant/parties?cid=${cid}`;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    // Get Consultant by username
    getConsultantByUsername(username) {
        const uri = `/sb/web/${username}`;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    /*
     * Party Details
     */
    getPartyDetails(pid) {
        const uri = `/party/detail?pid=${pid}`;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    /*
     * Account Profile Page
     */

    // Communication Preferences
    getCommunicationPreferences(email, cid) {
        const uri = `/users/preferencecenter?email=${email}&customerId=${cid}`;

        return fetch(this.fullUrl(uri))
            .then(response => response.json());
    }

    /*
     * Join Process
     */

    checkJoinSignup(cartId, email) {
        const uri = `/join/check/?cartid=${cartId}&email=${email}`;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    joinLogin(payload) {
        return $.ajax({
            type: 'POST',
            accepts: 'json',
            url: this.fullUrl('/join/login'),
            data: payload,
        });
    }

    createJoinSession(payload) {
        return $.ajax({
            type: 'POST',
            accepts: 'json',
            url: this.fullUrl('/join/join-session'),
            data: payload,
        });
    }

    updateJoinSession(payload, email) {
        const uri = `/join/join-session?email=${email}`;

        return $.ajax({
            type: 'PATCH',
            accepts: 'json',
            url: this.fullUrl(uri),
            data: payload,
        });
    }

    // Get Sponsor
    getSponsor(params) {
        const uri = `/search/join/${params}`;

        return $.ajax({
            type: 'GET',
            accepts: 'json',
            url: this.fullUrl(uri),
        });
    }

    // Get TS Join Terms and Conditions
    getJoinTermsAndConditions() {
        return $.ajax({
            type: 'GET',
            accepts: 'json',
            url: this.fullUrl('/join/tc'),
        });
    }

    getPartyGuests(pid) {
        const uri = `/planner/guests/%${pid}`;

        return $.ajax({
            type: 'GET',
            accepts: 'json',
            url: this.fullPartyUrl(uri),
        });
    }

    getPartyRewards(pid) {
        const uri = `/planner/rewards/${pid}`;

        
        return $.ajax({
            type: 'GET',
            accepts: 'json',
            url: this.fullPartyUrl(uri),
        });
    }

    getPartyInfo(pid) {
        const uri = `/party/planner?pid=${pid}`;

        return $.ajax({
            type: 'GET',
            accepts: 'json',
            url: this.fullUrl(uri),
        });
    }
}
