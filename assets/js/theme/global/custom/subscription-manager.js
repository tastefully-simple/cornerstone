import modalFactory from '../../global/modal';
import $ from 'jquery';
import 'foundation-sites/js/foundation/foundation';
import swal from '../../global/sweet-alert';

/**
 * Replaces all occurrences of the string "mapArray key" with the "mapArray value" in the "template" string
 * @param template
 * @param mapArray
 * @returns {*}
 */
function formatTemplate(template, mapArray) {
    let finalObj = template;
    // Replace all static data
    // eslint-disable-next-line guard-for-in
    for (const key in mapArray) {
        finalObj = finalObj.replaceAll(key, mapArray[key]);
    }
    return finalObj;
}

/**
 * Format date "2023-03-31T21:38:22Z" to "March 31, 2023"
 * @param myDate
 * @returns {string}
 */
function formatDate(myDate) {
    const date = new Date(myDate);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Get a list of all images
 * @param products
 * @returns {string}
 */
function getProductsImageList(products) {
    let images = '';
    // eslint-disable-next-line guard-for-in
    for (const key in products) {
        images += `<img src="${products[key].images[0].src}">`;
    }

    return images;
}

/**
 *  Open subscription modal and load content inside of it
 * @param subscriptionModal
 * @param contentTemplate
 */
function loadSubscriptionModal(subscriptionModal, contentTemplate) {
    // Open Modal with a Preloader layer
    subscriptionModal.open({ clearContent: true, pending: true });

    $.ajax({
        url: `${window.subscriptionManager.apiUrl}/customers/${window.subscriptionManager.customerId}/subscriptions`,
        type: 'GET',
        dataType: 'JSON',
        success(response) {
            if (response.length >= 1) {
                window.subscriptionManager.subscriptions = response;

                const subscriptionTemplate = window.subscriptionManager.subscriptionCard;
                const subscriptions = window.subscriptionManager.subscriptions;
                subscriptionModal.updateContent(contentTemplate);
                $(`#subscriptionManager--${window.subscriptionManager.version} .subscriptions-list-content`).html(' ');

                // Create subscriptions list
                subscriptions.forEach((subscription) => {
                    const subscriptionImages = getProductsImageList(subscription.LineItems);
                    const map = {
                        '#NextOrder': formatDate(subscription.NextOrder),
                        '#Id': subscription.Id,
                        '#ProductsList': subscriptionImages,
                    };
                    window.subscriptionManager.subs[subscription.Id] = subscription;
                    window.subscriptionManager.subs[subscription.Id].images = subscriptionImages;
                    $(`#subscriptionManager--${window.subscriptionManager.version} .subscriptions-list-content`).prepend(formatTemplate(subscriptionTemplate, map));
                });
            }
        },
    });
}

/**
 * Verify if this product has the autoship widget
 * @param productId
 */
function isAutoshipEnabled(productId) {
    $.ajax({
        url: `${window.subscriptionManager.apiUrl}/Subscriptions/products/${productId}`,
        type: 'GET',
        dataType: 'JSON', // added data type
        success(response) {
            if (response) {
                // This product is Autoship Eligible. Show  Widget Version 2
                window.subscriptionManager.version = 'future';
            }
            // Display Button and message
            $(`#subscription--container-${window.subscriptionManager.version}`).show();
            const subscriptionModal = modalFactory(`#subscriptionManager--${window.subscriptionManager.version}`)[0];
            // Show Add to Next Delivery (Widget Version 1) or This product is Autoship Eligible (Widget version 2)
            const $subscriptionManagerTrigger = $(`#subscriptionManager--trigger-${window.subscriptionManager.version}`);
            $subscriptionManagerTrigger.on('click', () => {
                loadSubscriptionModal(subscriptionModal, $(`#subscriptionManager--${window.subscriptionManager.version}`).html());
            });
            $('body').on('click', '.close-subscriptions', () => {
                subscriptionModal.close();
            });
        },
    });
}

/**
 * Verifies if the current customer has subscriptions
 * @param customerId
 */
function hasSubscriptions(customerId) {
    $.ajax({
        url: `${window.subscriptionManager.apiUrl}/customers/${customerId}/hassubscriptions`,
        type: 'GET',
        dataType: 'JSON', // added data type
        success(response) {
            if (response === true) {
                // show component if the customer has active subscriptions
                $('#subscription-manager-block').show();
            }
        },
    });
}

/**
 * Updates the modal display after the product has been added, showing the details of the updated subscription
 * @param subscriptionId
 */
function subscriptionUpdated(subscriptionId) {
    const newImageUrl = $('.productView-thumbnail-link:first img').attr('src');
    const successTemplate = $(`#subscription-success-template--${window.subscriptionManager.version}`).html();
    const subscription = window.subscriptionManager.subs[subscriptionId];
    window.subscriptionManager.subs[subscriptionId] += `<img src="${newImageUrl}">`;

    const map = {
        '#NextOrder': formatDate(subscription.NextOrder),
        '#Id': subscriptionId,
        '#SubscriptionProducts': subscription.images,
        '#NewProduct': `<img src="${newImageUrl}">`,
    };

    $(`#subscriptionManager--${window.subscriptionManager.version} .modal-body:first`).html(formatTemplate(successTemplate, map));
}

/**
 * Renew the Current Customer API JWT token
 * @returns {Promise<void>}
 */
async function renewToken() {
    const resource = `/customer/current.jwt?app_client_id=${window.currentCustomer.bigcommerce_app_client_id}`;
    window.currentCustomer.token = await fetch(resource)
        .then(response => {
            if (response.status === 200) {
                return response.text();
            }
            swal.fire({
                text: 'An error has happened. Please, try again later. (001)',
                icon: 'error',
            });
            return response.status;
        })
        .catch(error => {
            console.log(error);
            swal.fire({
                text: 'An error has happened. Please, try again later. (002)',
                icon: 'error',
            });
            return -1;
        });
}

/**
 * Send a request to add productId into subscriptionId
 * @param subscriptionId
 * @param productId
 * @returns {Promise<void>}
 */
async function updateSubscription(subscriptionId, productId) {
    await renewToken();

    $.ajax({
        url: `${window.subscriptionManager.apiUrl}/Subscriptions/${subscriptionId}/products`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'jwt-token': window.currentCustomer.token,
        },
        data: JSON.stringify({
            productId,
            variantId: '',
            quantity: 1,
        }),
        // eslint-disable-next-line no-unused-vars
        success(response) {
            subscriptionUpdated(subscriptionId);
            $(`#subscriptionManager--${window.subscriptionManager.version} .subscriptions-footer:first`).hide();
            $(`#subscriptionManager--${window.subscriptionManager.version} .subscriptions-cancel`).hide();
            $(`#subscriptionManager--${window.subscriptionManager.version} .subscriptions-continue`).hide();
            $(`#subscriptionManager--${window.subscriptionManager.version} .subscriptions-done`).show();
            $(`#subscriptionManager--${window.subscriptionManager.version} .modal-header p`).html('product added to delivery');
        },
        // eslint-disable-next-line no-unused-vars
        error(xhr, status, error) {
            swal.fire({
                text: 'An error has happened. Please, try again later. (003)',
                icon: 'error',
            });
        },
    });
}

/**
 * Main function
 * @param customerId
 * @param productId
 * @param subscriptionManagement
 * @returns {boolean}
 */
export default function (customerId, productId, subscriptionManagement) {
    if (!customerId || !subscriptionManagement.enabled || productId === undefined) {
        return false;
    }

    // Set template data for the modal
    window.subscriptionManager = {
        subscriptionCard: $('#subscription-card-template').html(),
        apiUrl: subscriptionManagement.api_url,
        subscriptions: [],
        subs: [],
        version: 'next',
        customerId,
        productId,
    };

    $(document).ready(() => {
        // Verify if this customer has subscriptions
        hasSubscriptions(customerId);
        // Verify if this product has the Bold widget
        isAutoshipEnabled(productId);
    });

    $('body').on('click', '.subscription-select', (event) => {
        $('.subscriptions-continue').removeClass('disabled');
        $('.subscription-next-order-message').show();
        $('.subscription-card').removeClass('subscription-selected');
        $(event.currentTarget.parentElement.parentElement).addClass('subscription-selected');
    });

    $('body').on('click', '.subscriptions-continue', () => {
        const selectedSubscription = $('input[name="select-subscription"]:checked').val();
        $('.subscriptions-continue').addClass('disabled');

        if (selectedSubscription !== undefined) {
            updateSubscription(selectedSubscription, productId);
        }
    });
}
