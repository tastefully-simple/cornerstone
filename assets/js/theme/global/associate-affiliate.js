import axios from 'axios';

/**
 * This value represents the actual query string we are checking for in the URL
 * on page load. It should have the affiliate ID as a value.
 */
const afid = 'AFID';

/**
 * This value represents the base "short url" which transitions over to the
 * longer URL. We will append the AFID value from above to this URL and set
 * it as the source of the iframe.
 */
let TSAPI_URL = '';

/**
 * This function is responsible for grabbing the URL parameters before the BigCommerce cart
 * redirect happens. We are then able to use the Tastefully Simple SCID to display the associated
 * affiliate name from Social Bug on the screen.
 */
function getUrlVars() {
    const vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
        vars[key] = value;
    });

    if (vars.affiliate_action === 'add') {
        $(() => {
            const docHeight = $(document).height();
            $('body').append("<div id='overlay' class='body-overlay'></div>");
            $('#overlay').height(docHeight);
        });

        axios.get(`/cart.php?action=add&sku=${vars.sku}&source=buy_button`)
            .then(() => {
                window.location = `${TSAPI_URL}${vars.SCID}`;
            });
    }
}


/**
 * This function is responsible for creating an iframe which in turn should
 * set the appropriate Social Bug affiliate cookie for the current user.
 */
export default function (themeSettings) {
    const params = new URLSearchParams(window.location.search);
    TSAPI_URL = themeSettings.social_bug_affiliate_url;
    if (params.has(afid)) {
        const affiliate = params.get(afid);
        const frame = document.createElement('iframe');

        frame.style.display = 'none';
        frame.src = `${TSAPI_URL}${affiliate}`;

        document.body.appendChild(frame);
    }
    getUrlVars();
}

