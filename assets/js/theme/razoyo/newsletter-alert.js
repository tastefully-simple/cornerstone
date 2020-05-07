import $ from 'jquery';

function checkEmail(email) {
    // Mock server
    // response: boolean
    // eligible email: subscriber1@example.com
    const url = 'https://whos-listening.herokuapp.com/email-check';

    return fetch(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "emailAddress": email
        })
    })
    .then(response => response.json());
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
            .then(isEligible => {
                if (isEligible) {
                    $message.innerHTML = '';
                    $message.innerHTML = `Success! You successfully subscribed. 
                      Use promo code: 000000 for 10% off on your $60 purchase.`;
                } else {
                    if (resUrl === `${url}success`) {
                        $message.innerHTML = '';
                        $message.innerHTML = 'Success! You successfully subscribed';
                    } else if (resUrl === `${url}already_subscribed`) {
                        $message.innerHTML = '';
                        $message.innerHTML = 'Error! You have already subscribed';
                    } else {
                        $message.innerHTML = '';
                        $message.innerHTML = 'Error! Blank email';
                    }
                }
            })
        })
    });
}

