/**
 * The Social Bug plugin does not load right away with the rest of the assets
 * on the page. We need to wait/check for the plugin until it is available.
 *
 * Ideally, Social Bug should fire off an event when it is fully loaded or add
 * the affiliate id to BigCommerce's global configuration object.
 */
function waitForSocialBug(callback) {
    if ($('#affiliatediv').length) {
        callback();
    } else {
        setTimeout(() => waitForSocialBug(callback), 500);
    }
}

/**
 * This function grabs the affiliate id from the Social Bug <div> tag once it's
 * loaded and appends it to the "Shop more" button.
 */
export default function () {
    waitForSocialBug(() => {
        const affiliateId = $('#affiliatediv').data('affiliateid');
        const affiliateParam = affiliateId !== undefined ? `&afid=${affiliateId}` : '';

        $('#shop-more-btn').attr('href', (i, href) => href + affiliateParam);
    });
}
