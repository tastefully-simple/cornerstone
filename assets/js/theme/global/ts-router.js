import querystring from 'querystring';
import TSCookie from '../common/ts-cookie';

export default class TSRouter {
    constructor(settings) {
        this.settings = settings;

        // Function returns true to stop routing chain
        this.checkUrlForBuyNow()
            || this.checkUrlForPartyId()
            || this.checkUrlForConsultantId()
            || this.checkUrlForConsultantWebSlug()
            || this.checkUrlForTest()
        ;
    }


    /**
     * This function is responsible for grabbing the URL parameters before the BigCommerce cart
     * redirect happens. We are then able to use the Tastefully Simple SCID to display the associated
     * affiliate name from Social Bug on the screen.
     */
    checkUrlForBuyNow() {
        const params = this.getQuery();
        if (params.affiliate_action && params.affiliate_action === 'add') {
            $(() => {
                const docHeight = $(document).height();
                $('body').append("<div id='overlay' class='body-overlay'></div>");
                $('#overlay').height(docHeight);
            });

            fetch(`/cart.php?action=add&sku=${params.sku}&source=buy_button`)
                .then(() => window.location = this.apiUrl(params.SCID));

            return true;
        }

        return false;
    }


    // Check for party id
    checkUrlForPartyId(apiBase) {
        const szUrl = window.location.pathname;
        if (szUrl.match(/[Pp]\/\d+/g)) {
            const filterString = szUrl.substring(4);
            const iPid = parseInt(filterString, 10);
            if (iPid > 0) {
                const currentCookie = new TSCookie();

                this.getPartyDetails(iPid, apiBase)
                    .then(res => res.json())
                    .then(data => {
                        currentCookie.SetAffiliateId(data.AfId);
                        currentCookie.SetConsultantId(data.ConsultantId);
                        currentCookie.SetConsultantName(data.Consultant);
                        currentCookie.SetPartyId(iPid);
                        currentCookie.SetPartyHost(`${data.HostFirstName} ${data.HostLastName}`);
                        currentCookie.SetPartyDate(`${data.Date}`);
                        currentCookie.SetPartyTime(`${data.Time}`);
                        window.location = '/party-details';
                    })
                    .catch(err => {
                        console.warn('getPartyDetails', err);
                        //window.location = '/';
                    });

                return true;
            }
        }

        return false;
    }

    // SCID
    checkUrlForConsultantId() {
        return false;
    //    const szUrl = window.location.pathname;
    //    if (szUrl.match(/[Pp]\/\d+/g)) {
    //        const filterString = szUrl.substring(4);
    //        const iPid = parseInt(filterString, 10);
    //        if (iPid > 0) {
    //            const currentCookie = new TSCookie();

    //            getPartyDetails(iPid)
    //                .then(res => res.json())
    //                .then(data => {
    //                    currentCookie.SetAffiliateId(data.AfId);
    //                    currentCookie.SetConsultantId(data.ConsultantId);
    //                    currentCookie.SetConsultantName(data.Consultant);
    //                    window.location = '/web';
    //                })
    //                .catch(err => {
    //                    console.warn('getPartyDetails', err);
    //                    //window.location = '/';
    //                });
    //        }
    //    }
    }

    // Consultant Web Slug
    checkUrlForConsultantWebSlug() {
        return false;
        // const szUrl = window.location.pathname;
        //    if (szUrl.match(/[Pp]\/\d+/g)) {
        //        const filterString = szUrl.substring(4);
        //        const iPid = parseInt(filterString, 10);
        //        if (iPid > 0) {
        //            const currentCookie = new TSCookie();

        //            getPartyDetails(iPid)
        //                .then(res => res.json())
        //                .then(data => {
        //                    currentCookie.SetAffiliateId(data.AfId);
        //                    currentCookie.SetConsultantId(data.ConsultantId);
        //                    currentCookie.SetConsultantName(data.Consultant);
        //                    window.location = '/web';
        //                })
        //                .catch(err => {
        //                    console.warn('getPartyDetails', err);
        //                    //window.location = '/';
        //                });
        //        }
        //    }
    }

    checkUrlForTest() {
        const params = this.getQuery();
        if (params.tstroutetest && params.tstroutetest == "1") {
            window.location = 'https://www.google.com/';
            return true;
        }

        // Check cookie
        TSCookie.SetTest('thisisacookie');

        return false;
    }


    getPartyDetails(partyId) {
        const uri = `/party/detail?pid=${partyId}`;
        return fetch(this.apiUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    sendPartyOrder(orderId, partyId) {
        const uri = `/webhook/party/order/${orderId}/${partyId}`;
        return fetch(getFullUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    apiUrl(uri) {
        return this.settings.ts_tsapi_base_url + uri;
    }

    getQuery() {
        return querystring.parse(window.location.search.substr(1));
    }
}
