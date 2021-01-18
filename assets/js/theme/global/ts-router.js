import querystring from 'querystring';
import TSCookie from '../common/ts-cookie';
import TSApi from '../common/ts-api';

export default class TSRouter {
    constructor(settings) {
        this.settings = settings;
        this.api = new TSApi();

        this.checkUrls();
    }

    checkUrls() {
        // Function returns true to stop routing chain
        return this.checkUrlForBuyNow()
            || this.checkUrlForPartyId()
            || this.checkUrlForPartyPlannerId()
            || this.checkUrlForMissingPartyId()
            || this.checkUrlForConsultantId()
            || this.checkUrlForConsultantWebSlug()
            || this.checkUrlForPartyDetailPage()
            || this.checkUrlForTest();
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
                .then(() => {
                    window.location = this.apiUrl(params.SCID);
                });

            return true;
        }

        return false;
    }


    // Check for party id
    checkUrlForPartyId() {
        const szUrl = window.location.pathname;
        if (szUrl.match(/^\/p\/\d+/ig)) {
            const filterString = szUrl.match(/\d+/g);
            const iPid = filterString[0];

            if (iPid > 0) {
                this.showLoading();
                this.api.getPartyDetails(iPid)
                    .then(res => {
                        /* TST-267 Closed party (HTTP 410) or other
                         * non-200 responses are being handled in
                         * Party Detail Widget script in Shogun
                         */
                        const newResponse = res.ok ? res.json() : res.status;
                        return newResponse;
                    })
                    .then(party => {
                        if (typeof party !== 'number') {
                            if (party.IsClosed) {
                                this.setPartyCookies(party);
                                localStorage.removeItem('partyDetails');
                                window.location = '/closed-party';
                            } else {
                                TSCookie.setAffiliateId(party.AfId);
                                TSCookie.setConsultantId(party.ConsultantId);
                                TSCookie.setConsultantName(party.ConsultantName);
                                TSCookie.setConsultantImage(party.Image);
                                this.setPartyCookies(party);

                                localStorage.setItem('partyDetails', JSON.stringify(party));
                                window.location = '/party-details';
                            }
                        } else {
                            TSCookie.setPartyCookies(party);
                            localStorage.removeItem('partyDetails');
                            window.location = '/closed-party';
                        }
                    })
                    .catch(err => {
                        console.warn('TSApi::getPartyDetails()', err);
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
                this.api.getPartyDetails(iPid)
                    .then(res => res.json())
                    .then(party => {
                        TSCookie.setAffiliateId(party.AfId);
                        TSCookie.setConsultantId(party.ConsultantId);
                        TSCookie.setConsultantName(party.ConsultantName);
                        this.setPartyCookies(party);
                        window.location = '/host-planner';
                    })
                    .catch(err => {
                        console.warn('getPartyDetails', err);
                    });

                return true;
            }
        }

        return false;
    }

    checkUrlForMissingPartyId() {
        const matches = window.location.pathname.match(/^\/party-details/i);
        if (matches && !TSCookie.getPartyId()) {
            this.showLoading();
            window.location = '/';
            return true;
        }

        return false;
    }

    // SCID
    checkUrlForConsultantId() {
        const szUrl = window.location.search;
        const matches = szUrl.match(/scid=\d+/ig);

        if (matches) {
            const consultantId = matches[0].substring(5);

            this.showLoading();

            this.api.getConsultantInfo(consultantId)
                .then(response => response.json())
                .then(data => {
                    TSCookie.setConsultantId(data.ConsultantId);
                    TSCookie.setConsultantName(data.Name);
                    TSCookie.setConsultantImage(data.Image);

                    window.location = window.location.pathname;
                })
                .catch(err => console.warn('checkUrlForConsultantId', err));

            return true;
        }
        return false;
    }

    // Consultant Web Slug
    checkUrlForConsultantWebSlug() {
        const szUrl = window.location.pathname;

        if (szUrl.match(/^\/web\/[a-z0-9]+/i)) {
            this.showLoading();
            const cUsername = szUrl.substring(5);

            this.api.getConsultantByUsername(cUsername)
                .then(res => res.json())
                .then(data => {
                    window.location = '/web';

                    const cname = `${data.FirstName} ${data.LastName}`;
                    TSCookie.setConsultantName(cname);
                    TSCookie.setConsultantId(data.ConsultantId);
                    this.deletePartyCookies();
                })
                .catch(err => {
                    console.warn('getConsultantByUsername', err);
                    window.location = '/';
                });

            return true;
        }
        return false;
    }

    checkUrlForPartyDetailPage() {
        const szUrl = window.location.pathname;

        if (szUrl === '/party-details' || szUrl === '/closed-party') {
            const partyId = TSCookie.getPartyId();
            history.pushState(null, null, `/p/${partyId}`);

            if (szUrl === '/closed-party') {
                TSCookie.deleteParty();
            }

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

    setPartyCookies(party) {
        const closedDate = new Date();
        closedDate.setDate(closedDate.getDate() - 1);

        const partyDate = new Date(party.Date);
        partyDate.setDate(partyDate.getDate() + 31);

        const date = party.IsClosed ? closedDate : partyDate;

        TSCookie.setPartyId(party.PartyId, date);
        TSCookie.setPartyHost(party.HostName, date);
        TSCookie.setPartyDate(party.Date, date);
        TSCookie.setPartyTime(party.Time, date);
    }

    /* TST-175
     * commented out sendPartyOrder() as it's not being called anywhere
     * and ESLint detects that 'getFullUrl' is not defined
     */
    // sendPartyOrder(orderId, partyId) {
    //     const uri = `/webhook/party/order/${orderId}/${partyId}`;
    //     return fetch(getFullUrl(uri), {
    //         method: 'GET',
    //         headers: { Accept: 'application/json' },
    //     });
    // }

    apiUrl(uri) {
        return this.settings.ts_tsapi_base_url + uri;
    }

    getQuery() {
        return querystring.parse(window.location.search.substr(1));
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
        const $partyBarText = $('#partybar-find .partybar-text');
        $partyBarText.text('Find a party');

        TSCookie.deleteParty();
    }
}
