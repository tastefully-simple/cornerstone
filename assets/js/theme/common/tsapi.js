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

    searchConsultantsByZip(zip, radius, page, size) {
        let uri = '/search/shop/zip/' 
            + zip  + '/' 
            + radius + '/' 
            + page + '/'
            + size;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: {'Accept': 'application/json'}
        });
    }

    searchConsultantsByName(name, state, page, size) {
        let uri = '/search/shop/name/' 
            + name  + '/' 
            + state + '/' 
            + page + '/'
            + size;

        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: {'Accept': 'application/json'}
        });
    }

    getConsultant(id) {
        let uri = '/search/shop/cid/' + id;
        return fetch(this.fullUrl(uri), {
            method: 'GET',
            headers: {'Accept': 'application/json'}
        });
    }
}
