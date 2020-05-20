export default function (e) {
    let signup = new NewsletterSignup(
        document.querySelector('.footer-newsletter > form')
    );
}

class NewsletterSignup {
    constructor($form) {
        this.$form = $form;
        this.$input = $form.querySelector('input');
        this.$alert = this.initAlert();
        $form.appendChild(this.$alert);
        $form.addEventListener('submit', (e) => this.onSubmit(e));
    }

    initAlert() {
        let alert = document.createElement('div');
        alert.style.display = 'none';
        alert.classList.add('alertbox-container');
        return alert;
    }

    onSubmit(e) {
        e.preventDefault(); // Prevent from navigating off the page to original BC action

        // Capture form data about to be submitted
        let formData = new FormData(this);

        // Validate API call succeeds
        let onValidateResponse = (res) => {
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
        let onValidateFail = (err) => {
            console.warn('Email validation error', err);
        };

        // Validate email against TST's API endpoint
        this.validateEmail(formData.get('nl_email'))
            .then(onValidateResponse)
            .catch(onValidateFail);
    }

    validateEmail(email) {
        let welcomeUrl = window.theme_settings.tst_api_url + '/users/welcome/check';
        return fetch(welcomeUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({'email': email})
        });
    }

    ajaxSubscribe(formData, showPromo) {
        fetch('/subscribe.php?action=subscribe', {
          method: 'POST',
          body: formData
        }).then(res => this.handleSubscribe(res, showPromo))
          .catch(err => this.generalError())
        ;
    }

    handleSubscribe(res, showPromo) {
        // BigCommerce subscribe success
        if (res.url.includes('success')) {
            if (showPromo) {
                this.successMessage(
                    'Good things are coming your way!',
                    'Use promo code: 00000 for 10% off on your $60 purchase.'
                );
            } else {
                this.successMessage('Success!', 'You have been subscribed.');
            }
        }
        // BigCommerce says already subscribed
        else if (res.url.includes('already_subscribed')) {
            this.errorMessage('Error', 'You have already been subscribed.');
        } 
        // Unknown BigCommerce response
        else {
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
        if (status == 'error') {
            retryHtml = '<a class="retry-btn framelink-md">retry</a>';
        } else {
            retryHtml = '';
        }

        let alertBox = 
            ```
            <div class="alertbox-${status}">
                <h2 class="alert-title">${title}</h2>
                <p class="alert-message">${message}</p>
                ${retryHtml}
            </div>
            ```
        
        this.$alert.innerHTML = alertBox;
        this.$alert.style.display = 'block';

        if (retryHtml != '') {
            this.$alert.querySelector('.retry-btn').addEventListener('click', () => {
                this.$input.focus();
                this.$alert.style.display = 'none';
            });
        }
    }
}
