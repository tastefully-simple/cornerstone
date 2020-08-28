export default class TSApi {
    constructor() {
        this.baseUrl = window.theme_settings.ts_tsapi_base_url;
    }

    fullUrl(uri) {
        return this.baseUrl + uri;
    }

    welcomeCheck(email) {
        return fetch(this.fullUrl('/users/welcome/check'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
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


    /*
     * Find a Party
     */
    searchPartyByState(state, name, page, size) {
        const uri = `/search/party/${state}/${page}/${size}?name=${name}`;

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

    /*
     * Account Profile Page
     */

    // Communication Preferences
    getCommunicationPreferences(email, cid) {
        const uri = `/users/preferencecenter?email=${email}&customerId=${cid}`;

        return fetch(this.fullUrl(uri))
            .then(response => response.json());
    }
}
