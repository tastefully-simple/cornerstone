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
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({'email': email})
        });
    }

    searchConsultants(name, state, page) {
        let uri = '/search/shop/name/' 
            + name  + '/' 
            + state + '/' 
            + page;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: {'Accept': 'application/json'}
        });
    }
}
