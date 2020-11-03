import PageManager from '../page-manager';
import TSApi from './ts-api';
import TSCookie from './ts-cookie';

export default class TSAffiliationCheck extends PageManager {
    constructor(context) {
        super(context);

        this.api = new TSApi();
    }

    onReady() {
        this.getCartData()
            .then(cart => {
                if (cart.length > 0) {
                    const affiliations = {
                        cartID: cart[0].id,
                        // cart[0].email returns "" when user not signed in
                        email: cart[0].email ? cart[0].email : undefined,
                        consultantID: TSCookie.getConsultantId(),
                        partyID: TSCookie.getPartyId(),
                    };

                    this.api.affiliationCheck(affiliations);
                }
            })
            .catch(err => console.warn('StorefrontAPI::getCart()', err));
    }

    getCartData() {
        return fetch('/api/storefront/cart', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json());
    }
}
