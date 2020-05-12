import $ from 'jquery';

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

export default function (e) {
    const $form = document.querySelector('footer article[data-section-type="newsletterSubscription"] form');
    const $message = document.createElement('p');
    $message.style.color = '#FFFFFF';
    $form.prepend($message);

    $form.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this); // this = form element
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
                if (resUrl === `${url}success` && res === '"OK"') {
                    $message.innerHTML = '';
                    $message.innerHTML = `Success! You successfully subscribed. 
                      Use promo code: 000000 for 10% off on your $60 purchase.`;
                } else if (resUrl === `${url}already_subscribed` || res === '"OK"') {
                    $message.innerHTML = '';
                    $message.innerHTML = 'You have already subscribed';
                } else if (res === '"Please send the email address to check"') {
                    $message.innerHTML = '';
                    $message.innerHTML = 'Error! Blank email';
                } else if (resUrl === `${url}success`) {
                    $message.innerHTML = '';
                    $message.innerHTML = 'Success! You have been subscribed';
                } else {
                    $message.inner = '';
                    $message.innerHTML = 'Error!';
                }
            });
        });
    });
}

