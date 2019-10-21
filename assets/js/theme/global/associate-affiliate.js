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
const src = 'https://tastefullysimpl.sb-affiliate.com/r66/';

/**
 * This function is responsible for creating an iframe which in turn should
 * set the appropriate Social Bug affiliate cookie for the current user.
 */
export default function () {
    const params = new URLSearchParams(window.location.search);

    if (params.has(afid)) {
        const affiliate = params.get(afid);
        const frame = document.createElement('iframe');

        frame.style.display = 'none';
        frame.src = `${src}${affiliate}`;

        document.body.appendChild(frame);
    }
}
