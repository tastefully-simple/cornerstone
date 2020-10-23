import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';

// Redirects
const LOGIN_PAGE = '/login.php';
const SIGNUP_PAGE = '/login.php?action=create_account';

// Form Actions
const LOGIN_FORM_ACTION = '/login.php?action=check_login';
const SIGNUP_FORM_ACTION = '/login.php?action=save_new_account';

/*
 * loginStateChecker cookie has 3 possible values:
 * "init" - when user clicks sign in/create account button. And
 *      when a redirect happens, this is an additional checker to
 *      verify that the user logged in
 *
 * "checkLastLogin" - when user logs in, API gets fired
 *
 * "noop" - no checking needs to happen
 */
class TSCheckUserLogin {
    constructor() {
        this.api = new TSApi();
        this.init();
    }

    init() {
        if (this.isOnLoginPage() || this.isOnSignupPage()) {
            const formAction = this.isOnLoginPage() ? LOGIN_FORM_ACTION : SIGNUP_FORM_ACTION;
            const $loginForm = document.querySelector(`form[action="${formAction}"]`);
            $loginForm.addEventListener('submit', () => TSCookie.setLoginStateChecker('init'));
        }

        if (TSCookie.getLoginStateChecker()) {
            this.checkLastLogin();
        }
    }

    checkLastLogin() {
        const $email = document.querySelector('input.customer-email');
        const previousUrl = document.referrer;
        const isStateInit = TSCookie.getLoginStateChecker() === 'init';

        if (previousUrl.includes('login.php') && $email && isStateInit) {
            TSCookie.setLoginStateChecker('checkLastLogin');

            this.api.lastLoginCheck($email.value)
                .then(res => res)
                .catch(err => console.warn('TSCheckCustomerLogin:checkLastLogin()', err));
        } else {
            TSCookie.setLoginStateChecker('noop');
        }
    }

    isOnLoginPage() {
        const loc = document.location;
        return loc.pathname + loc.search === LOGIN_PAGE;
    }

    isOnSignupPage() {
        const loc = document.location;
        return loc.pathname + loc.search === SIGNUP_PAGE;
    }
}

export default function () {
    $(document).ready(() => {
        const checkUserLogin = new TSCheckUserLogin();

        return checkUserLogin;
    });
}
