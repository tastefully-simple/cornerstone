import querystring from 'querystring';
import TSCookie from '../common/ts-cookie';

export default class TSRouter {
    constructor(settings) {
        this.settings = settings;

        // Function returns true to stop routing chain
        this.checkUrlForBuyNow()
            || this.checkUrlForPartyId()
            || this.checkUrlForPartyPlannerId()
            || this.checkUrlForMissingPartyId()
            || this.checkUrlForConsultantId()
            || this.checkUrlForConsultantWebSlug()
            || this.checkUrlForTest()
        ;
    }

    //
    // CHECKS
    //

    /**
     * This function is responsible for grabbing the URL parameters before the BigCommerce cart
     * redirect happens. We are then able to use the Tastefully Simple SCID to display the associated
     * affiliate name from Social Bug on the screen.
     */
    checkUrlForBuyNow() {
        const params = this.getQuery();
        if (params.affiliate_action && params.affiliate_action === 'add') {
            this.showLoading();

            fetch(`/cart.php?action=add&sku=${params.sku}&source=buy_button`)
                .then(() => window.location = this.apiUrl(params.SCID));

            return true;
        }

        return false;
    }


    // Check for party id
    checkUrlForPartyId() {
        const szUrl = window.location.pathname;
        if (szUrl.match(/^\/p\/\d+/ig)) {
            const filterString = szUrl.substring(4);
            const iPid = parseInt(filterString, 10);
            if (iPid > 0) {
                this.showLoading();
                this.getPartyDetails(iPid)
                    .then(res => res.json())
                    .then(data => {
                        TSCookie.SetAffiliateId(data.AfId);
                        TSCookie.SetConsultantId(data.ConsultantId);
                        TSCookie.SetConsultantName(data.ConsultantName);
                        TSCookie.SetPartyId(iPid);
                        TSCookie.SetPartyHost(data.HostName);
                        TSCookie.SetPartyDate(data.Date);
                        TSCookie.SetPartyTime(data.Time);
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

    // Check for party id
    checkUrlForPartyPlannerId() {
        const matches = window.location.pathname.match(/^\/party-planner\/(\d+)\//i);
        if (matches && matches[1]) {
            const iPid = parseInt(matches[1], 10);
            if (iPid > 0) {
                this.showLoading();
                this.getPartyDetails(iPid)
                    .then(res => res.json())
                    .then(data => {
                        TSCookie.SetAffiliateId(data.AfId);
                        TSCookie.SetConsultantId(data.ConsultantId);
                        TSCookie.SetConsultantName(data.ConsultantName);
                        TSCookie.SetPartyId(iPid);
                        TSCookie.SetPartyHost(data.HostName);
                        TSCookie.SetPartyDate(data.Date);
                        TSCookie.SetPartyTime(data.Time);
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

    checkUrlForMissingPartyId() {
        const matches = window.location.pathname.match(/^\/party-details/i);
        if (matches && !TSCookie.GetPartyId()) {
            this.showLoading();
            window.location = '/';
            return true;
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
    //                    currentCookie.SetConsultantName(data.ConsultantName);
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
        const szUrl = window.location.pathname;

        if (szUrl.match(/^\/web\/[a-z0-9]+/i)) {
            this.showLoading();
            const cUsername = szUrl.substring(5);

            this.getConsultantByUsername(cUsername)
                .then(res => res.json())
                .then(data => {
                    window.location = '/web';

                    let cname = `${data.FirstName} ${data.LastName}`;
                    TSCookie.SetConsultantName(cname);
                    TSCookie.SetConsultantId(data.ConsultantId);
                    this.deletePartyCookies();
                })
                .catch(err => {
                    console.warn("getConsultantByUsername", err);
                    window.location = '/';
                });

            return true;
        }
        return false;
    }

    checkUrlForTest() {
        /*
        const params = this.getQuery();
        if (params.tstroutetest && params.tstroutetest == "1") {
            window.location = 'https://www.google.com/';
            return true;
        }

        // Check cookie
        TSCookie.SetTest('thisisacookie');
        */
        return false;
    }

    //
    // HELPERS
    //

    getPartyDetails(partyId) {
        const uri = `/party/detail?pid=${partyId}`;
        return fetch(this.apiUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
    }

    getConsultantByUsername(username) {
        const uri = `/sb/web/${username}`;
        return fetch(this.apiUrl(uri), {
            method: 'GET',
            headers: { Accept: 'application/json' }
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
        return querystring.parse(
          window.location.search.substr(1)
        );
    }

    showLoading() {
        $(() => {
            const docHeight = $(document).height();
            $('#page-wrapper').html(`
                <div class="loader-icon">
                    <div class="sk-chase">
                        <div class="sk-chase-dot"></div>
                        <div class="sk-chase-dot"></div>
                        <div class="sk-chase-dot"></div>
                        <div class="sk-chase-dot"></div>
                        <div class="sk-chase-dot"></div>
                        <div class="sk-chase-dot"></div>
                    </div>
                </div>
                <div id='overlay' class='body-overlay'></div>
            `);
            $('#overlay').height(docHeight);
        });
    }

    deletePartyCookies() {
        let $partyBarText = $('#partybar-find .partybar-text');
        $partyBarText.text('Find a party');

        TSCookie.DeleteParty();
    }
}
