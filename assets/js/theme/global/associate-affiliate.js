import axios from 'axios';

/**
 * This value represents the actual query string we are checking for in the URL
 * on page load. It should have the affiliate ID as a value.
 */
const AFID = 'AFID';

/**
 * This function grabs the affiliate id from the Social Bug <div> tag once it's
 * loaded and appends it to the "Shop more" button.
 */
export default function () {
    const params = new URLSearchParams(window.location.search);

    if (params.has(AFID)) {
        
        console.log(params.get(AFID));
    }
}
