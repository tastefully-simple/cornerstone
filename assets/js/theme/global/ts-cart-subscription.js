import { defaultModal } from '../global/modal';
import FindAConsultant from './ts-find-consultant';
import TSApi from '../common/ts-api';
import utils from '@bigcommerce/stencil-utils';
// For await
import 'core-js/stable';
import 'regenerator-runtime/runtime';

class CartSubscription extends FindAConsultant {
    constructor(tsConsultantId) {
        super(tsConsultantId);
        this.api = new TSApi();
        this.modalTemplate = 'common/cartSubscription/login';
        this.customerId;

        // Identifiers

        this.initListeners();
    }

    init(e) {
        e.preventDefault();
        utils.api.cart.getCart({includeOptions: true}, (err, response) => {
            err 
              ? console.error(`Failed to get cart. Error: ${err}`) 
              : this.subscriptionInCart(response);
        });
    }

    subscriptionInCart(response) {
        this.customerId = response.customerId;
        this.customerEmail = response.email;
        const physicalItems = response.lineItems.physicalItems; 
        for (var i = 0; i < physicalItems.length; i++) {
            const options = physicalItems[i].options;
            for (var j = 0; j < options.length; j++) {
                if (options[j].name.toLowerCase().includes('subscribe') && options[j].value.toLowerCase() !== 'one time only') {
                    this.customerLoggedIn();
                    return;
                }
            }
        }
        return this.goToCheckout();
    }

    customerLoggedIn() {
        this.customerId ? this.customerConsultant() : this.logIn();
    }

    logIn() {
        this.createModal();
    }
    
    createModal(width = 550) {
        this.modal = defaultModal();
        $('#modal').width(width);
        this.modal.open();
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
        this.modal.updateContent(result);
    }

    async login(e) {
        e.preventDefault();
        const $loginForm = $(e.currentTarget);
        try {
            await this.fetchLogin(`${$loginForm.serialize()}&authenticity_token=${window.BCData.csrf_token}`);
        } catch (res) {
            //:TODO
            console.warn('fetchLogin:', res);
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
        debugger;
        try {
            await this.fetchRegister(`${$registerForm.serialize()}&authenticity_token=${window.BCData.csrf_token}`, customerEmail);
        } catch (res) {
            //:TODO
            console.warn('fetchLogin:', res);
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
        //TODO don't need to set globally; check others
        this.modalTemplate = 'common/cartSubscription/account-created';
        const template = this.modalTemplate;
        const options = { template };
        utils.api.getPage('/', options, (err, confirmationHtml) => {
            if (err) {
                console.error(`Failed to get ${template}. Error:`, err);
                return false;
            }
            const $confirmationHtml = $(confirmationHtml);
            $confirmationHtml.find('#created-email').html(customerEmail);
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
        var $html = $(html);
        $html.find('#alertBox-message-text').html(errMsg);
        $('#modal .alertbox-success').hide();
        $('#modal .account').prepend($html[0].outerHTML);
    }

    fetchLogin(data) {
        return this.api.login(data)
            .done((res) => {
                const $resHtml = $(res);
                if ($($resHtml).find('#alertBox-message-text').length > 0) {
                    this.getWrongLogin($($resHtml).find('#alertBox-message-text').text());
                } else {
                    this.customerConsultant();
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
        var $html = $(html);
        $html.find('#alertBox-message-text').html(errMsg);
        $('#modal .alertbox-success').hide();
        $('#modal .cart-sub-body').prepend($html[0].outerHTML);
    }

    async customerConsultant() {
        try {
            await this.fetchIsCustomerConsultant() ? this.renderAutoshipNotEligibleModal() : this.activeAutoships();
        } catch (xhr) {
            const readableError = JSON.parse(xhr.responseText || '{"error": "An error has occured"}');
            console.warn('getUserIsConsultant:', readableError);
        }
    }

    activeAutoships() {
        debugger;
    }

    renderAutoshipNotEligibleModal() {
        this.modalTemplate = 'common/cartSubscription/autoshipNotEligible'; 
        this.createModal();
    }

    fetchIsCustomerConsultant() {
        return this.api.getIsCustomerConsultant(this.customerEmail)
            .done((data) => {
                this.yumConsultants = data;
            });
    }
  
    goToCheckout() {
        window.location.href = '/checkout';
    }

    initListeners() {
        super.initListeners();
        
        //Bind To checkout Button
        $('body').on('click', '.cart-actions .button--primary:not([disabled])', (e) => this.init(e));

        //Bind login submit
        $('body').on('submit', '#modal .login-form', (e) => this.login(e));

        //Bind register submit
        $('body').on('submit', '#modal .account .form', (e) => this.register(e));

        //Bind register button
        $('body').on('click', '#modal .new-customer .button--primary', (e) => this.renderRegister());

        //Bind cancel button
        $('body').on('click', '#modal .subscriptionmodal-cancel-btn', () => this.closeModal());
    }
}


export default function (tsConsultantId) {
    if (window.location.href.indexOf('/cart.php') > -1) {
        return new CartSubscription(tsConsultantId);
    }
}
