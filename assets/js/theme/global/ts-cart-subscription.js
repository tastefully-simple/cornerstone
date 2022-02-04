import { defaultModal } from '../global/modal';
import FindAConsultant from './ts-find-consultant';
import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';
import utils from '@bigcommerce/stencil-utils';
// For await
import 'core-js/stable';
import 'regenerator-runtime/runtime';

class CartSubscription extends FindAConsultant {
    constructor(tsConsultantId) {
        super(tsConsultantId);
        this.api = new TSApi();
        this.activeConsultant = null;
        this.activeConsultantName = null;
        this.customerId = null;
        this.currentClass = 'auto-ship';
        this.modalTemplate = 'common/cartSubscription/login';
        this.modalwidth = 550;
        this.tsimpleId = '0160785';
        this.yumConsultants = [];

        this.initListeners();
    }

    init(e) {
        e.preventDefault();
        if ($('#tsacf-shopdirect')[0] && $('#tsacf-shopdirect')[0].checked) {
            this.storeConsultantAffiliation(this.tsimpleId);
        }
        utils.api.cart.getCart({ includeOptions: true }, (err, response) => {
            if (err) {
                console.error(`Failed to get cart. Error: ${err}`);
            } else {
                this.subscriptionInCart(response);
            }
        });
    }

    subscriptionInCart(response) {
        this.customerId = response.customerId;
        this.customerEmail = response.email;
        const physicalItems = response.lineItems.physicalItems;
        for (let i = 0; i < physicalItems.length; i++) {
            const options = physicalItems[i].options;
            for (let j = 0; j < options.length; j++) {
                if (options[j].name.toLowerCase().includes('subscribe') && options[j].value.toLowerCase() !== 'one time only') {
                    this.customerLoggedIn();
                    return;
                }
            }
        }
        return this.goToCheckout();
    }

    customerLoggedIn() {
        if (this.customerId) {
            this.customerConsultant();
        } else {
            this.logIn();
        }
    }

    logIn() {
        this.createLoginModal();
    }

    createLoginModal() {
        this.modal = defaultModal();
        $('#modal').width(this.modalWidth);
        $('#modal').removeClass(this.currentClass);
        this.currentClass = 'auto-ship login';
        $('#modal').addClass(this.currentClass);
        this.modal.open();
        this.modalTemplate = 'common/cartSubscription/login';
        const template = this.modalTemplate;
        const options = { template };
        utils.api.getPage('/', options, (err, res) => {
            if (err) {
                console.error(`Failed to get ${template}. Error:`, err);
                return false;
            } else if (res) {
                this.loginModalLoaded(res);
            }
        });
    }

    loginModalLoaded(result) {
        this.modal.open();
        this.modal.updateContent(result);
    }

    async login(e) {
        e.preventDefault();
        const $loginForm = $(e.currentTarget);
        try {
            await this.fetchLogin(`${$loginForm.serialize()}&authenticity_token=${window.BCData.csrf_token}`);
        } catch (x) {
            console.warn('fetchLogin:', 'Something Went Wrong');
        }
    }

    renderRegister() {
        this.modalTemplate = 'common/cartSubscription/register';
        const template = this.modalTemplate;
        const options = { template };
        utils.api.getPage('/', options, (err, registerHtml) => {
            if (err) {
                console.error(`Failed to get ${template}. Error:`, err);
                return false;
            }
            this.modal.updateContent(registerHtml);
        });
    }

    async register(e) {
        e.preventDefault();
        const $registerForm = $(e.currentTarget);
        const customerEmail = $(e.currentTarget).find('#FormField_1_input').val();
        try {
            await this.fetchRegister(`${$registerForm.serialize()}&authenticity_token=${window.BCData.csrf_token}`, customerEmail);
        } catch (x) {
            console.warn('fetchRegister:', 'Something Went Wrong');
        }
    }

    fetchRegister(data, customerEmail) {
        return this.api.register(data)
            .done((res) => {
                const $resHtml = $(res);
                if ($($resHtml).find('#alertBox-message-text').length > 0) {
                    this.getInvalidRegister($($resHtml).find('#alertBox-message-text').text());
                } else {
                    this.registerConfirmation(customerEmail);
                }
            });
    }

    registerConfirmation(customerEmail) {
        utils.api.cart.getCart({ includeOptions: true }, (err, response) => {
            if (err) {
                console.error(`Failed to get cart. Error: ${err}`);
            } else {
                this.customerId = response.customerId;
            }
        });
        this.customerEmail = customerEmail;
        this.modalTemplate = 'common/cartSubscription/account-created';
        const template = this.modalTemplate;
        const options = { template };
        utils.api.getPage('/', options, (err, confirmationHtml) => {
            if (err) {
                console.error(`Failed to get ${template}. Error:`, err);
                return false;
            }
            const $confirmationHtml = $(confirmationHtml);
            $confirmationHtml.find('#created-email').html(this.customerEmail);
            this.modal.updateContent($confirmationHtml[0].outerHTML);
            setTimeout(() => {}, 3000);
            this.customerConsultant();
        });
    }

    getInvalidRegister(errMsg) {
        const template = 'common/alert/alert-error';
        const options = { template };
        utils.api.getPage('/', options, (err, invalidRegisterAlertHtml) => {
            if (err) {
                console.error(`Failed to get ${template}. Error:`, err);
                return false;
            }
            this.invalidRegister(invalidRegisterAlertHtml, errMsg);
        });
    }

    invalidRegister(html, errMsg) {
        const $html = $(html);
        $html.find('#alertBox-message-text').html(errMsg);
        $('#modal .alertbox-success').hide();
        $('#modal .account').prepend($html[0].outerHTML);
    }

    fetchLogin(data) {
        return this.api.login(data)
            .done(async (res) => {
                const $resHtml = $(res);
                if ($($resHtml).find('#alertBox-message-text').length > 0) {
                    this.getWrongLogin($($resHtml).find('#alertBox-message-text').text());
                } else {
                    await utils.api.cart.getCart({ includeOptions: true }, (err, response) => {
                        if (err) {
                            console.error(`Failed to get cart. Error: ${err}`);
                        } else {
                            this.customerId = response.customerId;
                            this.customerEmail = response.email;
                            this.customerConsultant();
                        }
                    });
                }
            });
    }

    getWrongLogin(errMsg) {
        const template = 'common/alert/alert-error';
        const options = { template };
        utils.api.getPage('/', options, (err, wrongLoginAlertHtml) => {
            if (err) {
                console.error(`Failed to get ${template}. Error:`, err);
                return false;
            }
            this.wrongLogin(wrongLoginAlertHtml, errMsg);
        });
    }

    wrongLogin(html, errMsg) {
        const $html = $(html);
        $html.find('#alertBox-message-text').html(errMsg);
        $('#modal .alertbox-success').hide();
        $('#modal .cart-sub-body').prepend($html[0].outerHTML);
    }

    async customerConsultant() {
        try {
            if (await this.fetchIsCustomerConsultant()) {
                this.renderAutoshipNotEligibleModal();
            } else {
                this.activeAutoships();
            }
        } catch (xhr) {
            const readableError = JSON.parse(xhr.responseText || '{"error": "An error has occured"}');
            console.warn('getUserIsConsultant:', readableError);
        }
    }

    async activeAutoships() {
        try {
            await this.fetchYumConsultants();
            this.setActiveConsultant();
            if (this.activeConsultant) {
                this.matchingConsultants();
            } else {
                this.goToCheckout();
            }
        } catch (xhr) {
            const readableError = JSON.parse(xhr.responseText || '{"error": "An error has occured"}');
            console.warn('getYumConsultants:', readableError);
        }
    }

    setActiveConsultant() {
        if (this.yumConsultants.length > 0) {
            this.yumConsultants.forEach((c) => {
                if (c.IsActive) {
                    this.activeConsultant = c.ConsultantID.trim();
                    this.activeConsultantName = `${c.FirstName} ${c.LastName}`;
                }
            });
        }
    }

    fetchYumConsultants() {
        return this.api.getYumConsultants(this.customerId)
            .done((data) => {
                this.yumConsultants = data;
            });
    }

    matchingConsultants() {
        if (TSCookie.getConsultantId() === this.activeConsultant
            || !TSCookie.getConsultantId()
        ) {
            this.goToCheckout();
        } else {
            this.partyAssociation();
        }
    }

    partyAssociation() {
        if (TSCookie.getPartyId()) {
            this.renderChooseConsultantWithParty();
        } else {
            this.renderChooseConsultant();
        }
    }

    async renderChooseConsultantWithParty() {
        this.modalTemplate = 'common/cartSubscription/choose-consultant-with-party';
        const template = this.modalTemplate;
        const options = { template };
        utils.api.getPage('/', options, (err, chooseConsultantHtml) => {
            if (err) {
                console.error(`Failed to get ${template}. Error:`, err);
                return false;
            }
            const $chooseConsultantHtml = $(chooseConsultantHtml);
            $chooseConsultantHtml.find('.active-yum').html(this.activeConsultantName);
            $chooseConsultantHtml.find('.active-consultant').html(TSCookie.getConsultantName());
            $chooseConsultantHtml.find('.active-party').html(TSCookie.getPartyHost());
            $('#modal').removeClass(this.currentClass);
            this.currentClass = 'auto-ship choose-with-party';
            $('#modal').addClass(this.currentClass);
            if (typeof this.modal !== 'undefined') {
                this.modal.open();
                this.modal.updateContent($chooseConsultantHtml[0].outerHTML);
            } else {
                this.modal = defaultModal();
                $('#modal').width(this.modalWidth);
                this.modal.open();
                this.modal.updateContent($chooseConsultantHtml[0].outerHTML);
            }
        });
        $('body').on('click', '#choose-consultant-options input', (e) => {
            $('#choose-consultant-options input').prop('checked', false);
            $('#choose-consultant-options .sub-text').hide();
            $(e.target).prop('checked', true);
            $('.cart-sub-body button').prop('disabled', false);
            $('.cart-sub-body button').text('Checkout');
            $(e.target).siblings('.sub-text').show();
        });
        $('body').on('click', '.cart-sub-body button', async () => {
            if (!$('.cart-sub-body button').attr('disabled')) {
                if ($('#choose-consultant-options input:checked').val() === 'current') {
                    if (await this.setPendingYumConsultant(TSCookie.getConsultantId())) {
                        this.goToCheckout();
                    }
                } else if (await this.storeConsultantAffiliation(this.activeConsultant)) {
                    this.goToCheckout();
                }
            }
        });
    }

    async renderChooseConsultant() {
        this.modalTemplate = 'common/cartSubscription/choose-consultant';
        const template = this.modalTemplate;
        const options = { template };
        utils.api.getPage('/', options, (err, chooseConsultantHtml) => {
            if (err) {
                console.error(`Failed to get ${template}. Error:`, err);
                return false;
            }
            const $chooseConsultantHtml = $(chooseConsultantHtml);
            $chooseConsultantHtml.find('.active-yum').html(this.activeConsultantName);
            $chooseConsultantHtml.find('.active-consultant').html(TSCookie.getConsultantName());
            $('#modal').removeClass(this.currentClass);
            this.currentClass = 'auto-ship choose';
            $('#modal').addClass(this.currentClass);
            if (typeof this.modal !== 'undefined') {
                this.modal.open();
                this.modal.updateContent($chooseConsultantHtml[0].outerHTML);
            } else {
                this.modal = defaultModal();
                $('#modal').width(this.modalWidth);
                this.modal.open();
                this.modal.updateContent($chooseConsultantHtml[0].outerHTML);
            }
        });
        $('body').on('click', '#choose-consultant-options input', (e) => {
            $('#choose-consultant-options input').prop('checked', false);
            $(e.target).prop('checked', true);
            $('.cart-sub-body button').prop('disabled', false);
            $('.cart-sub-body button').text('Checkout');
        });
        $('body').on('click', '.cart-sub-body button', async () => {
            if (!$('.cart-sub-body button').attr('disabled')) {
                if ($('#choose-consultant-options input:checked').val() === 'current') {
                    if (await this.setPendingYumConsultant(TSCookie.getConsultantId())) {
                        this.goToCheckout();
                    }
                } else if (await this.storeConsultantAffiliation(this.activeConsultant)) {
                    this.goToCheckout();
                }
            }
        });
    }

    async setPendingYumConsultant(consultantId) {
        try {
            await this.api.setPendingYumConsultant(consultantId, this.customerId);
            return true;
        } catch (xhr) {
            const readableError = JSON.parse(xhr.responseText || '{"error": "An error has occured"}');
            console.warn('setPendingYumConsultant:', readableError);
            return false;
        }
    }

    async storeConsultantAffiliation(consultantId) {
        try {
            await this.fetchConsultant(consultantId);
            return true;
        } catch (xhr) {
            const readableError = JSON.parse(xhr.responseText || '{"error": "An error has occured"}');
            console.warn('getConsultant:', readableError);
            return false;
        }
    }

    fetchConsultant(consultantId) {
        return this.api.getConsultant(consultantId)
            .done((data) => {
                const consultant = data.Results[0];
                TSCookie.setConsultantId(consultant.ConsultantId);
                TSCookie.setConsultantName(consultant.Name);
                TSCookie.setConsultantImage(consultant.Image);
                TSCookie.setConsultantHasOpenParty(consultant.HasOpenParty);
            });
    }

    renderAutoshipNotEligibleModal() {
        this.modalTemplate = 'common/cartSubscription/autoship-not-eligible';
        const template = this.modalTemplate;
        const options = { template };
        utils.api.getPage('/', options, (err, registerHtml) => {
            if (err) {
                console.error(`Failed to get ${template}. Error:`, err);
                return false;
            }
            $('#modal').removeClass(this.currentClass);
            this.currentClass = 'auto-ship not-eligible';
            $('#modal').addClass(this.currentClass);
            if (typeof this.modal !== 'undefined') {
                this.modal.open();
                this.modal.updateContent(registerHtml);
            } else {
                this.modal = defaultModal();
                $('#modal').width(this.modalWidth);
                this.modal.open();
                this.modal.updateContent(registerHtml);
            }
        });
    }

    fetchIsCustomerConsultant() {
        return this.api.getIsCustomerConsultant(this.customerEmail);
    }

    goToCheckout() {
        if (this.modal) {
            this.closeModal();
        }
        window.location.href = '/checkout';
    }

    initListeners() {
        // Bind To checkout Button
        $('body').on('click', '.cart-actions .button--primary:not([disabled]):not(.view-consultant-parties)', (e) => this.init(e));

        // Bind login submit
        $('body').on('submit', '#modal .login-form', (e) => this.login(e));

        // Bind back to login
        $('body').on('click', '#modal #to-login', () => this.createLoginModal());

        // Bind register submit
        $('body').on('submit', '#modal .account .form', (e) => this.register(e));

        // Bind register button
        $('body').on('click', '#modal .new-customer .button--primary', () => this.renderRegister());

        // Bind cancel button
        $('body').on('click', '#modal .subscriptionmodal-cancel-btn', () => this.closeModal());
    }
}


export default function (tsConsultantId) {
    if (window.location.href.indexOf('/cart.php') > -1) {
        return new CartSubscription(tsConsultantId);
    }
}
