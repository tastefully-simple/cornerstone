import TSApi from '../common/ts-api';
import utils from '@bigcommerce/stencil-utils';

const JOIN_PAGE = '/join';
const CART_PAGE = '/cart.php';

export default class TSJoinAbandonment {
    constructor(context) {
        this.BBOK_PRODUCT_ID = context.themeSettings.ts_join_ss_product_id;
        this.api = new TSApi();
        this.modalTemplate = 'common/join-abandonment-modal';

        this.init();
    }

    init() {
        utils.api.cart.getCart({}, (err, cart) => {
            if (err) {
                console.error('utils.api.cart.getCart::error', err);
            }

            if (cart) {
                // Check cart if it has the BBOK item
                this.bbokItem =
                    cart.lineItems.physicalItems.filter(item => (
                        item.productId === this.BBOK_PRODUCT_ID
                    ))[0];

                if (this.bbokItem) {
                    this.renderAbandonment(cart);
                }
            }
        });
    }

    renderAbandonment(cart) {
        this.api.checkJoinSignup(cart.id, cart.email)
            .then(res => res.json())
            .then(data => {
                if (!data.Complete) {
                    this.signupInfo = {
                        cartId: cart.id,
                        isSignedIn: cart.email, // email || ""
                        cartItems: cart.lineItems,
                        redirectPage: data.NextSignupPage,
                        deleteJoinItem: data.DeleteJoinItem,
                    };
                    this.createModal();
                }
            })
            .catch(err => console.error('TSApi::checkJoinSignup()', err));
    }

    createModal() {
        const options = { template: this.modalTemplate };
        utils.api.getPage('/', options, (err, res) => {
            if (err) {
                console.error(`Failed to get ${this.modalTemplate}. Error:`, err);
                return false;
            } else if (res) {
                this.modalLoaded(res);
            }
        });
    }

    modalLoaded($content) {
        const $wrapper = document.createElement('div');
        $wrapper.classList.add('join-abandonment-modal');

        $wrapper.style.display = 'block';

        const continueToSignup =
            this.signupInfo.redirectPage === 10 || this.signupInfo.redirectPage === 20;

        if (continueToSignup) {
            $wrapper.innerHTML = $content;
            const $completeSignupBtn = $wrapper.querySelector('.jam-complete-signup');
            $completeSignupBtn.addEventListener('click', this.redirectToJoin);
        } else {
            let errorMessage;
            if (this.signupInfo.redirectPage === -3) {
                errorMessage = `This email address is associated with an active consultant account.
                    Enter a new email address.`;
            } else {
                // case -2
                errorMessage = 'Active join in process, no more client input requested at this moment.';
            }

            $wrapper.innerHTML = this.renderErrorHTMLBlock(errorMessage);
        }

        document.querySelector('.body').appendChild($wrapper);

        const $closeBtn = $wrapper.querySelector('.jam-close');
        $closeBtn.addEventListener('click', () => this.closeModal($wrapper));
    }

    deleteBBOKItem() {
        // Delete BBOK item and user stays in cart
        utils.api.cart.itemRemove(this.bbokItem.id, (err, _res) => {
            if (err) {
                console.error('utils.api.cart.itemRemove::error', err);
            }
        });
    }

    redirectToJoin() {
        this.setAttribute('href', JOIN_PAGE);
    }

    closeModal($modal) {
        const $hideModal = $modal;
        $hideModal.style.display = 'none';
        this.deleteBBOKItem();
        window.location = CART_PAGE;
    }

    renderErrorHTMLBlock(message) {
        return `<div class="jam-container">
            <div class="jam-title">
                <h1 class="frameheading-1 wanwhite-text">Error</h1>
            </div>
            <div class="jam-body">
                <div class="jam-body-wrapper">
                    <p>${message}</p>
                    <button class='jam-close'>close</button>
                </div>
            </div>
        </div>`;
    }
}
