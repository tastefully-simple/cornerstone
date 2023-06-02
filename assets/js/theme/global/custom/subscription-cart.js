import modalFactory from '../../global/modal';
import $ from 'jquery';
import 'foundation-sites/js/foundation/foundation';
import swal from '../../global/sweet-alert';
import utils from '@bigcommerce/stencil-utils';
import TSCookie from '../../common/ts-cookie';
import ConsultantParties from '../../common/consultant-parties';

// This is set as TRUE when all conditions to proceed to the checkout are cleared
window.allowSubscriptionCheckout = false;

// This is set as TRUE after BOLD submits to their checkout. It prevents the modals from being displayed again
window.boldCheckoutSubmitted = false;

class SubscriptionCart {
    constructor(tsConsultantId) {
        this.getAutoshipProducts();
        this.initListeners();
        this.TS_CONSULTANT_ID = tsConsultantId;
    }

    /**
     * Replaces all occurrences of the string "mapArray key" with the "mapArray value" in the "template" string
     * @param template
     * @param mapArray
     * @returns {*}
     */
    formatTemplate(template, mapArray) {
        let finalObj = template;
        // Replace all static data
        // eslint-disable-next-line guard-for-in
        for (const key in mapArray) {
            finalObj = finalObj.replaceAll(key, mapArray[key]);
        }
        return finalObj;
    }

    /**
     * Send a request to the BigCommerce login endpoint
     *
     * @param data
     * @returns {*}
     */
    sendLoginRequest(data) {
        const url = '/login.php?action=check_login';

        return $.ajax({
            type: 'POST',
            referrer: '/login.php',
            referrerPolicy: 'strict-origin-when-cross-origin',
            mode: 'cors',
            credentials: 'include',
            url,
            data,
        });
    }

    /**
     * Get autoship products from API
     */
    getAutoshipProducts() {
        let subscriptionProductsData = false;
        $.ajax({
            url: `${window.subscriptionManager.apiUrl}/Products/available`,
            type: 'GET',
            dataType: 'JSON',
            success(response) {
                if (response) {
                    const autoshipData = {
                        timeout: new Date().getTime() + 3600000, // Data expires in 1 hour
                        products: response,
                    };
                    subscriptionProductsData = JSON.stringify(autoshipData);
                }
                window.localStorage.setItem('subscription-products', subscriptionProductsData);
            },
        });
    }

    /**
     * Initialize event listeners
     */
    initListeners() {
        // Bind To checkout Button
        $('#page-wrapper').on('click', '.cart-actions .button--primary', (event) => {
            event.preventDefault();
            if (window.boldCheckoutSubmitted === true || window.allowSubscriptionCheckout === true) {
                return;
            }
            this.init(event);
        });

        // Sign-in form action
        $('body').on('submit', '#modal-autoship-sign-in form', (event) => {
            event.preventDefault();
            this.login(event);
        });

        // Enable button on consultant choose modal when an option is selected
        $('body').on('change', '#modal-consultant-choose input[type=radio]', () => {
            $('#modal-consultant-choose .button--primary').prop('disabled', false);
            $('#modal-consultant-choose .button--primary').html('Checkout');
        });

        // Enable button on Choose Consultant and Party modal when an option is selected
        // Also display/hide text under the selection
        $('body').on('change', '#modal-consultant-choose-with-party input[type=radio]', (event) => {
            $('#modal-consultant-choose-with-party .button--primary').prop('disabled', false);
            $('#modal-consultant-choose-with-party .button--primary').html('Checkout');
            if ($(event.target).hasClass('current-consultant')) {
                $('.text-current-consultant').css('visibility', 'visible');
                $('.text-new-consultant').css('visibility', 'hidden');
            } else {
                $('.text-current-consultant').css('visibility', 'hidden');
                $('.text-new-consultant').css('visibility', 'visible');
            }
        });

        // Save consultant on "choose consultant" modal
        $('body').on('click', '#modal-consultant-choose .button--primary', () => {
            this.saveConsultant('#modal-consultant-choose');
        });

        // Save consultant on "choose consultant and party" modal
        $('body').on('click', '#modal-consultant-choose-with-party .button--primary', () => {
            this.saveConsultant('#modal-consultant-choose-with-party');
        });
    }

    /**
     * Save consultant on the Consultant Choose modal
     */
    saveConsultant(modalId) {
        if (!$(`${modalId} button`).prop('disabled')) {
            $(`${modalId} button`).prop('disabled', true);
            const selectedConsultant = $(`${modalId} input[name="consultant"]:checked`).val();

            if (selectedConsultant.toString() === Cookies.get('cid').toString()) {
                this.setConsultantAsActive(selectedConsultant);
            } else {
                this.goToCheckout();
            }
        }
    }

    /**
     * Redirect customer to the checkout page
     */
    goToCheckout() {
        window.allowSubscriptionCheckout = true;
        document.querySelector('.cart-actions .button--primary').click();
    }

    /**
     * Initialize Subscription Cart
     * @param e
     */
    init(e) {
        const self = this;
        e.preventDefault();
        this.verifyShopDirectlyWithTst();

        utils.api.cart.getCart({ includeOptions: true }, (err, response) => {
            const pid = TSCookie.getPartyId();
            if (err) {
                console.error(`Failed to get cart. Error: ${err}`);
                swal.fire({
                    text: 'An error has happened. Please, try again later. (001)',
                    icon: 'error',
                });
            } else if (self.hasAutoshipProducts(response)) {
                self.isCustomerLogged();
            } else if (!self.hasOpenParties() || (self.hasOpenParties() && typeof pid !== 'undefined')) {
                window.location = '/checkout';
            }
        });
    }

    /**
     * Verify if the customer chose the option to shop wth Tastefully Simple
     */
    verifyShopDirectlyWithTst() {
        if (document.getElementById('tsacf-shopdirect') &&
            document.getElementById('tsacf-shopdirect').checked) {
            // Set Tastefully Simple as the consultant
            TSCookie.deleteParty();
            TSCookie.setConsultantId(this.TS_CONSULTANT_ID);
            TSCookie.setConsultantName('Tastefully Simple');
            TSCookie.setConsultantImage(null);
            TSCookie.setConsultantHasOpenParty(false);
        }
    }

    /**
     * Verifies if the current consultant has open parties
     * @returns {any|boolean}
     */
    hasOpenParties() {
        const pid = TSCookie.getPartyId();
        const hasOpenParties = JSON.parse(TSCookie.getConsultantHasOpenParty());

        return (hasOpenParties && (typeof pid === 'undefined' || !pid) && pid !== 'null');
    }

    /**
     * Verify if the cart has autoship-enabled products
     * @param cart
     * @returns {boolean}
     */
    hasAutoshipProducts(cart) {
        const autoshipData = window.localStorage.getItem('subscription-products') ?
            JSON.parse(window.localStorage.getItem('subscription-products')) : [];

        for (let i = 0; i < cart.lineItems.physicalItems.length; i++) {
            if (autoshipData.products.includes(cart.lineItems.physicalItems[i].productId)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Verifies if customer is logged.
     * If the customer is logged, proceed to verify if it is a Consultant.
     * If the customer is NOT logged, display login modal.
     */
    isCustomerLogged() {
        // If not logged, show login modal
        if (!window.subscriptionManager.customerId) {
            this.showModal('sign-in');
            return false;
        }

        // Customer is logged, let's verify if he has a consultant
        this.isCustomerConsultant();
    }

    /**
     * Show a modal window containing the template data from "type".
     * New types can be added by editing the constructor variable this.templates
     *
     * @param type
     */
    showModal(type, template) {
        const modal = this.createModal();
        const options = {
            template: `autoship/modals/${type}`,
        };
        this.loadModalContent(options, modal, template);
    }

    /**
     * Performs a get request to retrieve the template contents and load them into a modal
     * @param options
     * @param modal
     */
    loadModalContent(options, modal, template) {
        const self = this;
        utils.api.getPage('/', options, (err, tempResponse) => {
            let response = tempResponse;
            if (typeof template !== 'undefined') {
                response = self.formatTemplate(tempResponse, template);
            }

            if (err) {
                console.error(`Failed to get ${options.template}. Error:`, err);
                swal.fire({
                    text: 'An error has happened. Please, try again later. (002)',
                    icon: 'error',
                });
                return false;
            } else if (response) {
                modal.updateContent(response);
                $('.close-subscription-modal').click(() => {
                    modal.close();
                });
            }
        });
    }

    /**
     * Uses the modal factory to create a new modal
     * @returns {*}
     */
    createModal() {
        const modal = modalFactory('#subscriptions-modal-container')[0];
        modal.open({ clearContent: true, pending: true });

        return modal;
    }

    /**
     * Log-in customer
     * @param e
     * @returns {Promise<void>}
     */
    async login(e) {
        const $loginForm = $(e.currentTarget);
        try {
            await this.fetchLogin(`${$loginForm.serialize()}&authenticity_token=${window.BCData.csrf_token}`);
        } catch (x) {
            swal.fire({
                text: 'An error has happened. Please, try again later. (005)',
                icon: 'error',
            });
        }
    }

    /**
     * Send login request and verify if it is successful
     *
     * @param data
     * @returns {*}
     */
    fetchLogin(data) {
        const self = this;
        return this.sendLoginRequest(data)
            .done(async (res) => {
                const $resHtml = $(res);
                if ($($resHtml).find('#alertBox-message-text').length > 0) {
                    swal.fire({
                        text: $($resHtml).find('#alertBox-message-text').text(),
                        icon: 'error',
                    });
                } else {
                    // Get customer data from shopping cart
                    await utils.api.cart.getCart({ includeOptions: true }, (err, response) => {
                        if (err) {
                            console.error(`Failed to get cart. Error: ${err}`);
                        } else {
                            window.subscriptionManager.customerId = response.customerId;
                            window.subscriptionManager.customerEmail = response.email;
                            self.isCustomerConsultant();
                        }
                    });
                }
            });
    }

    /**
     * Verifies if current customer is a consultant
     */
    isCustomerConsultant() {
        const self = this;
        $.ajax({
            url: `${window.subscriptionManager.consultantApiUrl}/Info/isconsultant?emailAddress=${window.subscriptionManager.customerEmail}`,
            type: 'GET',
            dataType: 'JSON',
            success(response) {
                const pid = TSCookie.getPartyId();
                if (response) {
                    // This is a consultant.
                    self.showModal('is-consultant');
                } else if (self.hasOpenParties()) {
                    // Show party selection modal
                    self.showConsultantPartiesModal();
                } else if (pid && pid !== 'null') {
                    self.verifyPartyAndConsultant();
                } else {
                    self.verifyConsultantUpdates();
                }
            },
        });
    }

    /**
     * Ask customer to choose a party
     */
    showConsultantPartiesModal() {
        const consultant = TSCookie.getConsultantData();
        new ConsultantParties(
            Cookies.get('cid'),
            {},
            consultant,
            (() => {}),
        );
    }

    /**
     * Verify if the current consultant is different from the new one, when the customer has selected a party
     */
    verifyPartyAndConsultant() {
        const partyHostName = Cookies.get('phost');
        const partyId = Cookies.get('pid');
        const newConsultantName = Cookies.get('name');
        const newConsultantId = Cookies.get('cid').toString();
        const self = this;

        $.ajax({
            url: `${window.subscriptionManager.tsApiUrl}/cart/affiliations/?customerId=${window.subscriptionManager.customerId}`,
            type: 'GET',
            dataType: 'JSON',
            success(consultants) {
                const activeConsultant = consultants.filter(c => c.IsActive === true)[0];

                if (!activeConsultant) {
                    // Set the current temp consultant as active
                    self.setConsultantAsActive(newConsultantId);
                } else if (newConsultantId !== activeConsultant.ConsultantID.replace(/ /g, '')) {
                    // Ask customer to choose one
                    // Map consultant data to template
                    const map = {
                        '#current-consultant-name': `<b>${activeConsultant.FirstName} ${activeConsultant.LastName}</b>`,
                        '#party-host-name-party': `<b>${partyHostName}'s</b>`,
                        '#party-host-name': `<b>${partyHostName}</b>`,
                        '#party-id': partyId,
                        '#new-consultant-name': `<b>${newConsultantName}</b>`,
                        '#current-consultant-id': newConsultantName,
                        '#new-consultant-id': newConsultantId,
                        '*not*': '<b>not</b>',
                    };

                    self.showModal('choose-consultant-and-party', map);
                } else {
                    self.goToCheckout();
                }
            },
        });
    }

    /**
     * Verifies if the current selected consultant is the same as consultant in file.
     * If they are different, ask the customer to choose one of them
     */
    verifyConsultantUpdates() {
        const newConsultant = Cookies.get('cid') ? Cookies.get('cid').replace(/ /g, '') : false;
        const self = this;

        $.ajax({
            url: `${window.subscriptionManager.tsApiUrl}/cart/affiliations/?customerId=${window.subscriptionManager.customerId}`,
            type: 'GET',
            dataType: 'JSON',
            success(consultants) {
                const activeConsultant = consultants.filter(c => c.IsActive === true)[0];

                if (!activeConsultant && newConsultant) {
                    // Set the current temp consultant as active
                    self.setConsultantAsActive(newConsultant);
                } else if (newConsultant !== activeConsultant.ConsultantID.replace(/ /g, '')) {
                    // Ask customer to choose one
                    // Map consultant data to template
                    const map = {
                        '#current-consultant-id': activeConsultant.ConsultantID.replace(/ /g, ''),
                        '#current-consultant-name': `${activeConsultant.FirstName} ${activeConsultant.LastName}`,
                        '#consultant-name': `<b>${activeConsultant.FirstName} ${activeConsultant.LastName}</b>`,
                        '#new-consultant-id': newConsultant,
                        '#new-consultant-name': Cookies.get('name'),
                    };
                    self.showModal('choose-consultant', map);
                } else {
                    self.goToCheckout();
                }
            },
        });
    }

    /**
     * Set a given consultant as active
     * @param consultantId
     */
    setConsultantAsActive(consultantId) {
        // window.subscriptionManager is set on subscription-manager.js
        let setAffiliationUrl = `${window.subscriptionManager.tsApiUrl}/cart/setpendingaffiliation/`;
        setAffiliationUrl += `?customerId=${window.subscriptionManager.customerId}&consultantid=${consultantId}&overridepending=1`;
        const self = this;

        $.ajax({
            url: setAffiliationUrl,
            type: 'GET',
            dataType: 'JSON',
            success(response) {
                if (response) {
                    self.goToCheckout();
                }
            },
        });
    }
}

export default function (themeSettings) {
    if (window.location.href.indexOf('/cart.php') > -1) {
        return new SubscriptionCart(themeSettings.ts_consultant_id);
    }
}
