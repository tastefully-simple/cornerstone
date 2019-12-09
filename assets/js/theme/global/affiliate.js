import axios from 'axios';

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
 * If we are on the cart page, let's make a call to the TS API to get the
 * current consultant's full name so we can set that near the bottom of
 * the cart page.
 */
function setAffiliateNameById(affiliateId) {
    if (document.getElementById('affiliate-name') === null) {
        return;
    }

    axios.get(`https://qa1-tsapi.tastefullysimple.com/sb/id/${affiliateId}`)
        .then(response => {
            document.getElementById('cart-affiliate-info').style.display = 'inherit';

            if (response.data === null) {
                document.getElementById('cart-no-affiliate-name').style.display = 'inherit';
                return;
            }

            const fullName = `${response.data.FirstName} ${response.data.LastName}`;

            if (fullName.toLowerCase() === 'tastefully simple') {
                document.getElementById('cart-tastefully-simple-name').style.display = 'inherit';
                return;
            }

            document.getElementById('affiliate-name').innerText = fullName;
            document.getElementById('cart-affiliate-name').style.display = 'inherit';
        });
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

        setAffiliateNameById(affiliateId);
    });
}
