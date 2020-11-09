import utils from '@bigcommerce/stencil-utils';

export default class TSAddToCart {
    constructor($product) {
        this.$addToCartBtn = $product.querySelector('.add-to-cart-btn');
        this.productId = $product.querySelector("input[name='product_id']").value;

        this.$addToCartBtn.addEventListener('click', (e) => this.addProductToCart(e));
    }

    addProductToCart(e) {
        this.$addToCartBtn.removeAttribute('href'); // to bypass BC's GA event
        e.preventDefault();

        const formData = new FormData();
        formData.append('action', 'add');
        formData.append('product_id', this.productId);
        formData.append('qty[]', '1');

        utils.api.cart.itemAdd(formData, (err, response) => {
            const errorMessage = err || response.data.error;
            if (errorMessage) {
                console.error('TSAddToCart::addProductToCart()', errorMessage);
                return;
            }

            // TST-262 Update quantity of Cart's count indicator
            const quantity = Number(localStorage.getItem('cart-quantity'));
            $('body').trigger('cart-quantity-update', quantity + 1);

            this.$addToCartBtn.innerHTML = 'Added to Cart';
            // Revert back to "Add to Cart" after 3sec
            setTimeout(() => {
                this.$addToCartBtn.innerHTML = 'Add to Cart';
            }, 3000);
        });
    }
}
