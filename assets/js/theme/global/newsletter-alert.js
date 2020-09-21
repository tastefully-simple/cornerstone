import TSApi from '../common/ts-api';


class NewsletterSignup {
    constructor($form) {
        this.api = new TSApi();
        this.$form = $form;
        this.$input = $form.querySelector('input');
        this.$alert = this.initAlert();
        $form.appendChild(this.$alert);
        $form.addEventListener('submit', (e) => this.onSubmit(e));
    }

    initAlert() {
        const alert = document.createElement('div');
        alert.style.display = 'none';
        alert.classList.add('alertbox-container');
        return alert;
    }

    onSubmit(e) {
        e.preventDefault(); // Prevent from navigating off the page to original BC action

        // Capture form data about to be submitted
        const formData = new FormData(e.target);

        // Validate API call succeeds
        const onValidateResponse = (res) => {
            switch (res.status) {
                // Email has not used coupon
                case 200:
                    this.ajaxSubscribe(formData, true);
                    break;

                // Email has used coupon
                case 400:
                    this.ajaxSubscribe(formData, false);
                    break;

                // Invalid response
                default:
                    this.generalError();
                    break;
            }
        };

        // Validate API call fails
        const onValidateFail = (err) => {
            console.warn('Email validation error', err);
        };

        // Validate email against TST's API endpoint
        this.api.welcomeCheck(formData.get('nl_email'))
            .then(onValidateResponse)
            .catch(onValidateFail);
    }

    ajaxSubscribe(formData, showPromo) {
        fetch('/subscribe.php?action=subscribe', {
            method: 'POST',
            body: formData,
        })
            .then(res => this.handleSubscribe(res, showPromo))
            .catch(_err => this.generalError());
    }

    handleSubscribe(res, showPromo) {
        // BigCommerce subscribe success
        if (res.url.includes('success')) {
            if (showPromo) {
                this.successMessage(
                    'Good things are coming your way!',
                    'Use promo code: JHUP53 for 10% off on your $60 purchase',
                );
            } else {
                this.successMessage('Success!', 'You have been subscribed.');
            }
        } else if (res.url.includes('already_subscribed')) { // BigCommerce says already subscribed
            const message = `Thank you! You're currently opted in to receiving
                messages from Tastefully Simple`;
            this.errorMessage('', message);
        } else { // Unknown BigCommerce response
            this.generalError();
        }
    }

    successMessage(title, message) {
        this.alertMessage('success', title, message);
    }

    errorMessage(title, message) {
        this.alertMessage('error', title, message);
    }

    generalError() {
        this.errorMessage('Error', 'Something went wrong.');
    }

    alertMessage(status, title, message) {
        let retryHtml;
        if (status === 'error') {
            retryHtml = '<a class="retry-btn framelink-md">retry</a>';
        } else {
            retryHtml = '<a class="ok-btn framelink-md">ok</a>';
        }

        const alertBox =
            `
            <div class="alertbox-${status}">
                <h2 class="alert-title">${title}</h2>
                <p class="alert-message">${message}</p>
                ${retryHtml}
            </div>
            `;

        this.$alert.innerHTML = alertBox;
        this.$alert.style.display = 'block';

        if (retryHtml.includes('retry')) {
            this.$alert.querySelector('.retry-btn').addEventListener('click', () => {
                this.$input.focus();
                this.$alert.style.display = 'none';
            });
        } else {
            this.$alert.querySelector('.ok-btn').addEventListener('click', () => {
                this.$alert.style.display = 'none';
            });
        }
    }
}

export default function () {
    const $newsLetter = document.querySelector('.footer-newsletter > form');
    const newsletterSignup = new NewsletterSignup($newsLetter);

    return newsletterSignup;
}
