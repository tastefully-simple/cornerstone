function checkEmail(email) {
    const url = 'https://qa1-tsapi.tastefullysimple.com/users/welcome/check';

    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({'email': email})
    })
    .then(response => response.text())
    .catch(err => console.log('checkEmail Error', err));
}

function addAlertBox(status, title, message) {
    const $alertBox = document.createElement('div');
    $alertBox.className = `alertbox-${status}`;

    const $alertTitle = document.createElement('h2');
    $alertTitle.classList.add('alert-title');
    $alertTitle.innerHTML = title;

    const $alertMessage = document.createElement('p');
    const $alertMessageSpan = document.createElement('span');
    $alertMessage.classList.add('alert-message');
    $alertMessageSpan.innerHTML = message;
    $alertMessage.appendChild($alertMessageSpan);

    $alertBox.appendChild($alertTitle);
    $alertBox.appendChild($alertMessage);

    if (status === 'error') {
        const $retry = document.createElement('a');
        $retry.classList.add('retry-btn');
        $retry.classList.add('framelink-md');
        $retry.innerHTML = 'retry';
        $alertBox.appendChild($retry);
    }

    return $alertBox;
}

export default function (e) {
    const $form = document.querySelector('footer div[data-section-type="newsletterSubscription"] form');
    const $alertBoxContainer = document.createElement('div');
    $alertBoxContainer.classList.add('alertbox-container');

    $form.addEventListener('submit', function(e) {
        e.preventDefault();

        const self = this; // this = form element
        const formData = new FormData(self);
        const $inputEmail = document.querySelector('footer #nl_email');

        fetch('/subscribe.php?action=subscribe', {
          method: 'POST',
          body: formData
        })
        .then(res => res.url)
        .then(resUrl => {
            const url = window.location.origin + '/subscribe.php?result=';

            checkEmail($inputEmail.value)
            .then(res => {
                let $alertBox;
                if (resUrl === `${url}success` && res === '"OK"') {
                    const title = 'Good things are coming your way!';
                    const message = 'Use promo code: 00000 for 10% off on your $60 purchase.';
                    $alertBox = addAlertBox('success', title, message);
                    $alertBoxContainer.innerHTML = '';
                    $alertBoxContainer.appendChild($alertBox);
                } else if (resUrl === `${url}already_subscribed`) {
                    $alertBox = addAlertBox('error', 'Error', 'You have already been subscribed.');
                    $alertBoxContainer.innerHTML = '';
                    $alertBoxContainer.appendChild($alertBox);
                } else if (res === '"Please send the email address to check"') {
                    $alertBox = addAlertBox('error', 'Error', 'Please enter a valid email address.');
                    $alertBoxContainer.innerHTML = '';
                    $alertBoxContainer.appendChild($alertBox);
                } else if (resUrl === `${url}success`) {
                    $alertBox = addAlertBox('success', 'Success', 'You have been subscribed.');
                    $alertBoxContainer.innerHTML = '';
                    $alertBoxContainer.appendChild($alertBox);
                } else {
                    $alertBox = addAlertBox('error', 'Error', 'Something went wrong');
                    $alertBoxContainer.innerHTML = '';
                    $alertBoxContainer.appendChild($alertBox);
                }

                // Prevents the inner element ($alertBox) being clicked when $alertBoxContainer is clicked
                $alertBox.addEventListener('click', (e) => e.stopPropagation());
                self.appendChild($alertBoxContainer);

                const $retry = document.querySelector('.alertbox-container a');
                if ($retry) {
                    const $input = document.querySelector('form .newsletter-inputs input');
                    $retry.addEventListener('click', function() {
                        $input.focus();
                        self.removeChild($alertBoxContainer);
                    });
                }
            });
        });
    });

    // Closes the alertbox when the outside of alertbox is clicked
    $alertBoxContainer.addEventListener('click', function(e) {
        const $retry = document.querySelector('.alertbox-container a');

        if ($retry) {
            const $input = document.querySelector('form .newsletter-inputs input');
            $input.focus();
        }

        $form.removeChild(this);
    });
}
