import utils from '@bigcommerce/stencil-utils';

export default function () {
    window.tsAddToCart = (element, event) => {
        const $addToCartBtn = element;
        $addToCartBtn.removeAttribute('href'); // to bypass BC's GA event
        event.preventDefault();

        const productId = $addToCartBtn.getAttribute('data-product-id');
        const formData = new FormData();
        formData.append('action', 'add');
        formData.append('product_id', productId);
        formData.append('qty[]', '1');

        const quantity = Number(localStorage.getItem('cart-quantity'));

        utils.api.cart.itemAdd(formData, (err, response) => {
            const errorMessage = err || response.data.error;
            if (errorMessage) {
                console.error('tsAddToCart()', errorMessage);
                return;
            }

            // TST-262 Update quantity of Cart's count indicator
            $('body').trigger('cart-quantity-update', quantity + 1);

            $addToCartBtn.innerHTML = 'Added to Cart';

            // Revert back to "Add to Cart" after 3sec
            setTimeout(() => {
                $addToCartBtn.innerHTML = 'Add to Cart';
            }, 3000);
        });
    };
}
