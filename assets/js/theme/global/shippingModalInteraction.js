const cartPage = document.getElementsByClassName('cart-totals')[0];

/**
 * This function will show modal on link click.
 */
function openShippingModal() {
    const shippingModal = cartPage.querySelector('#shipping-modal');
    const modalLink = cartPage.querySelector('#openShippingModal');

    modalLink.addEventListener('click', (event) => {
        event.preventDefault();
        shippingModal.classList.add('modal-overlay--active');
    });
}

/**
 * This function will close the terms modal on icon click.
 */
function closeShippingModal() {
    const shippingModal = cartPage.querySelector('#shipping-modal');
    const closeIcons = cartPage.querySelectorAll('.shipping-modal-close');

    closeIcons.forEach((closeIcon) => {
        closeIcon.addEventListener('click', () => {
            shippingModal.classList.remove('modal-overlay--active');
        });
    });
}


export default function shippingModalInteraction() {
    if (cartPage) {
        $(document).ready(() => {
            closeShippingModal();
            openShippingModal();
        });
    }
}
