import PageManager from './page-manager';
import accountSignupHtml from './common/ts-account-html.js';

export default class Checkout extends PageManager {
    constructor(context) {
        super(context);
    }

    onReady() {
        this.intervalID = setInterval(() => {
            if (this.isCheckoutLoaded()) {
                this.checkoutLoaded();
                clearInterval(this.intervalID);
            }
        }, 250);
    }

    isCheckoutLoaded() {
        return document.querySelector('#checkout-page-container .optimizedCheckout-checkoutStep .customerEmail-body') !== null;
    }

    checkoutLoaded() {
        this.replaceAccountSignup();
    }

    replaceAccountSignup() {
        if (document.getElementById('checkout-customer-guest')) {
            const acctSignin = document.querySelector('#checkout-customer-guest .customerEmail-container + p');
            if (acctSignin) {
                acctSignin.replaceWith(accountSignupHtml());
            }
        }
    }
}
