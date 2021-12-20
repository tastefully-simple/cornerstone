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
                console.error('Failed to get common/cartSubscription/login. Error:', err);
                return false;
            } else if (res) {
                this.loginModalLoaded(res);
            }
        });
    }

    loginModalLoaded(result) {
        this.modal.updateContent(result);
    }

    async login() {
        try {
            await this.fetchLogin();
        } catch (res) {
            //:TODO
            console.warn('fetchLogin:', res);
        }
    }

    fetchLogin() {
        return this.api.fetchLogin()
            .done((data) => {
                this.yumConsultants = data;
            });
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

        //Bind login button
        $('body').on('submit', '#modal .login-form', (e) => this.login(e));

        //Bind cancel button
        $('body').on('click', '#modal .subscriptionmodal-cancel-btn', () => this.closeModal());
    }
}


export default function (tsConsultantId) {
    if (window.location.href.indexOf('/cart.php') > -1) {
        return new CartSubscription(tsConsultantId);
    }
}
