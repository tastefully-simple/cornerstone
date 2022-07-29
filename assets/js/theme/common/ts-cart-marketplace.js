import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';

export default class TsCartMarketplace {
    constructor(themeSettings) {
        this.checkoutButton = '.cart-actions .button--primary';
        this.themeSettings = themeSettings;

        this.bindCheckoutButtonClickEvent();
        this.initListeners();
        this.validateCart();
    }

    initListeners() {
        $('body').on('click', '.marketplac-modal-cancel-btn', () => this.closeModal());
    }

    closeModal() {
        this.modal.close();
    }

    bindCheckoutButtonClickEvent() {
        $('#page-wrapper').on('click', '.cart-actions .button--primary', (event) => {
            const that = this;
            if (!$(this.checkoutButton).attr('disabled')) {
                event.preventDefault();
                that.validateCart(true);
            }
        });
    }

    validateCart(redirect = false) {
        utils.api.cart.getCart({}, (err, response) => {
            const products = response.lineItems.physicalItems;
            let marketplaceProducts = 0;
            // Count how many items have the brand "marketplace_brand"
            products.forEach((product) => {
                if (product.brand === this.themeSettings.marketplace_brand) {
                    marketplaceProducts++;
                }
            });

            // if this is a mixed cart, prevent the checkout and display a popup
            if (marketplaceProducts > 0 && products.length !== marketplaceProducts) {
                this.modal = defaultModal();
                this.modal.open({ size: 'small' });
                this.modal.updateContent($('#marketplace-popup-container').html());
            } else if (redirect) {
                window.location = '/checkout';
            }
        });
    }
}
