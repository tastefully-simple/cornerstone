import { confetti } from 'dom-confetti';

const loginPage = document.getElementById('join-login');
const personalInfoPage = document.getElementById('personal-info');
const kitPage = document.getElementById('kit');
const confirmationPage = document.getElementById('join-confirmation');

/**
 * This object will hold the user information for the join/login page.
 */
const loginUserInformation = {
    Id: null,
    FirstName: null,
    LastName: null,
    EmailAddress: null,
    Password: null,
    Password2: null,
};

/**
 * This object will be used to indicate whether a user is on the log in or sign up form
 */
const toggleLoginSignUp = {
    logInForm: true,
    signUpForm: false,
};

/** Variables used to associate sponsor selected with SocialBug and create hidden iframe */
const frame = document.createElement('iframe');

/**
 * This object will hold the consultant search information
 * on the Tell Us About Yourself page
 */
const consultantSearchParams = {
    consultantId: null,
    consultantName: null,
    consultantZipCode: null,
};

const sponsorImage = 'https://cdn11.bigcommerce.com/s-o55vb7mkz/product_images/uploaded_images/noconsultantphoto.png?t=1580312119&_ga=2.203167573.593569075.1580160573-1791376761.1579809387';
const defaultConsultantSearchMarkup = `
    <div data-consid='0160785' data-afid='1' class="sponsor-wrapper">
        <div data-consid='0160785' data-afid='1' class="sponsor-img-wrapper" style="background-image: url(${sponsorImage})"></div>
            <ul>
                <li class="sponsor-name">Tastefully Simple</li>
                <li class="sponsor-phone"><svg><use xlink:href="#icon-phone"/></svg>866.448.6446</li>
                <li class="sponsor-email"><svg><use xlink:href="#icon-email"/></svg>help@tastefullysimple.com</li>
                <li>Alexandria, MN</li>
                <li><a href='https://www.tastefullysimple.com/web/htstoyou' target='_blank' class="sponsor-link">Shop With Me</a><svg><use xlink:href="#icon-new-page_outlined"/></svg></li>
            </ul>
        <div class="checkmark"></div>
    </div>
    <div class="sponsor-divider"></div>
`;

/**
 * This variables will hold parameters for GET calls to
 * Tastefully Simple's consultant search API
 */
let apiParams = '';
let consultantState = '';
let locationDisplay = '';

/** API URLs used throughout the join process */
const API_URLS = {
    BLAST_OFF: 'https://tastefully-simple-sandbox-2.mybigcommerce.com/business-blast-off-kit-ss2020/?id=',
    TELL_US: 'https://tastefully-simple-sandbox-2.mybigcommerce.com/tell-us-about-yourself?id=',
    CHECKOUT: 'https://tastefullysimpl.sb-affiliate.com/r66/',
    JOIN_TC: 'https://tsapi.tastefullysimple.com/join/tc',
    SOCIAL_BUG: 'https://tastefullysimpl.sb-affiliate.com/r66/',
};

// Initialize Social Bug Functionality
function initializeSocialBug(affiliateId) {
    frame.style.display = 'none';
    frame.src = `${API_URLS.SOCIAL_BUG}${affiliateId}`;

    document.body.appendChild(frame);
}

// Update Social Bug Functionality
function associateSocialBugAffiliate(socialBugAfId) {
    frame.src = `${API_URLS.SOCIAL_BUG}${socialBugAfId}`;
}

function waitForSocialBug(callback) {
    if ($('#affiliatediv').length) {
        callback();
    } else {
        setTimeout(() => waitForSocialBug(callback), 500);
    }
}

function setLoginFormId(formIdValue = '') {
    $('#frmJoinLoginTest > #Id').val(formIdValue);
}
function setInfoFormId(formIdValue = '') {
    $('#frmJoinPersonalInfo > #Id').val(formIdValue);
}

/**
 * This function displays an error message on the login form.
 * results found when searching by ID or name. If an error
 * message from Tastefully Simple's API exists, that will display.
 */
function displayLoginErrorMessage(error) {
    if (error.responseJSON.errors) {
        $.each(error.responseJSON.errors, (i) => {
            const errors = error.responseJSON.errors[i];
            const {
                id,
                message,
            } = errors;
            $('#loginErrors').append(`
                <li data-errorid='${id}'>${message}</li>
            `);
        });
    } else if (error) {
        $('#loginErrors').append(`
            <h4>${error.responseJSON}</h4>
        `);
    }
}

/**
 * This function displays an error message when there are no consultant
 * results found when searching by ID or name. If an error
 * message from Tastefully Simple's API exists, that will display.
 */
function displayErrorMessage(error) {
    if (error.responseJSON.errors) {
        $.each(error.responseJSON.errors, (i) => {
            const errors = error.responseJSON.errors[i];
            const {
                id,
                message,
            } = errors;
            $('#formErrorMessages').append(`
                <li data-errorid='${id}'>${message}</li>
            `);
        });
        $('#formErrorMessages').append(`
        <h5>If you continue to experience issues, please contact the 
        Customer Services team at 866.448.6446.</li>
    `);
    } else if (error) {
        $('#formErrorMessages').append(`
            <h4>${error.responseJSON}</h4>
        `);
    } else {
        $('#sponsorSearchData').append(`
            <h4>No results found.</h4>
        `);
    }
}

function clearErrorMessages() {
    $('#formErrorMessages').html('');
    $('#loginErrors').html('');
    if (document.getElementById('divTsConsFound')) {
        document.getElementById('divTsConsFound').style.display = 'none';
    }
}

/**
 * This function handles input changes for the login form
 * and the consultant search form in the join process
 */
function handleFormChange(event) {
    const target = event.target;
    if (event.srcElement.form.id === 'frmJoinLoginTest'
        && toggleLoginSignUp.logInForm === false
        || toggleLoginSignUp.signUpForm === true) {
        loginUserInformation[target.name] = target.value;
    } else if (event.srcElement.form.id === 'frmJoinLoginTest'
        && toggleLoginSignUp.logInForm === true
        || event.srcElement.form.id === 'frmJoinLoginTest'
        && toggleLoginSignUp.signUpForm === false) {
        loginUserInformation[target.name] = target.value;
        loginUserInformation.Password2 = loginUserInformation.Password;
    } else if (event.srcElement.form.id === 'consultantSearchForm'
        && target.name !== 'ConsultantState'
        && target.name !== 'TermsCheckboxVisible'
        && target.name !== 'openTermsModal') {
        consultantSearchParams[target.name] = target.value;
    } else if (target.name === 'ConsultantState') {
        consultantState = target.value;
    }
}


/** This function will submit the login information
 * on the join/login page. This is still in development until
 * we determine which unique Id will be sent to the API in the loginUserInformation object.
*/
function submitLoginInfo() {
    $.ajax({
        type: 'POST',
        accepts: 'json',
        url: 'https://tsapi.tastefullysimple.com/join/login',
        data: $('#frmJoinLoginTest').serialize(),
        cache: false,
        success: (data) => {
            location.href = `${API_URLS.BLAST_OFF}${data.Id}`;
        },
        error: (error) => {
            displayLoginErrorMessage(error);
        },
    });
}

/**
 * Display consultant information returned from Tastefully Simple API when searching by ID or name
 */
function displayConsultantInformation(data) {
    // TODO need to add proximity when searching by consultant zip code
    $.each(data.Results, (i) => {
        const results = data.Results[i];
        const {
            AfId,
            ConsultantId,
            Image,
            Name,
            Title,
            PhoneNumber,
            EmailAddress,
            Location,
            WebUrl,
            Distance,
        } = results;
        if (Distance !== 0) {
            locationDisplay = `${Location} (${Distance} mi)`;
        } else {
            locationDisplay = Location;
        }
        $('#sponsorSearchData').append(`
            <div data-consid='${ConsultantId}' data-afid='${AfId}' class="sponsor-wrapper">
                <div data-consid='${ConsultantId}' data-afid='${AfId}' class="sponsor-img-wrapper" style="background-image: url(${Image})"></div>
                    <ul>
                        <li class="sponsor-name">${Name}</li>
                        <li>${Title}</li>
                        <li class="sponsor-phone"><svg><use xlink:href="#icon-phone"/></svg>${PhoneNumber}</li>
                        <li class="sponsor-email"><svg><use xlink:href="#icon-email"/></svg>${EmailAddress}</li>
                        <li>${locationDisplay}</li>
                        <li><a href='${WebUrl}' target='_blank' class="sponsor-link">View my TS page</a><svg><use xlink:href="#icon-new-page_outlined"/></svg></li>
                    </ul>
                <div class="checkmark"></div>
            </div>
            <div class="sponsor-divider"></div>
    `);
        if (data.Results.length < 3) {
            $('#sponsorSearchData').addClass('no-scroll');
        } else {
            $('#sponsorSearchData').removeClass('no-scroll');
        } if (!PhoneNumber) {
            $('.sponsor-phone').addClass('hidden');
        } if (!EmailAddress) {
            $('.sponsor-email').addClass('hidden');
        } if (data.Results.length > 0) {
            $('.sponsorSearchData-wrapper').addClass('active');
            $('#sponsorSearchData').addClass('active');
        }
    });
}

/**
 * These two functions will allow us to select a sponsor from the data
 * that is returned from Tastefully Simple's API.
 */

// TODO update to jquery each
function selectSponsor(array, type, func) {
    for (let i = 0; i < array.length; i++) {
        $(array[i]).bind(type, func);
    }
}

const sponsorSearchData = $('#sponsorSearchData');

selectSponsor(sponsorSearchData, 'click', (event) => {
    $('.sponsor-wrapper').removeClass('sponsor-wrapper--active');
    document.getElementById('SponsorId').value = $(event.target).closest('div').data('consid');
    $(event.target).closest('.sponsor-wrapper').addClass('sponsor-wrapper--active');

    const socialBugAfId = ($(event.target).closest('div').data('afid'));
    associateSocialBugAffiliate(socialBugAfId);
});

/**
 * Get consultant information from Tastefully Simple's API by name.
 */
function getConsultantInfoByName() {
    $.ajax({
        type: 'GET',
        accepts: 'json',
        url: `https://tsapi.tastefullysimple.com/search/join/${apiParams}`,
        success: (data) => {
            if (data.Results !== null) {
                displayConsultantInformation(data);
            }
        },
        error: () => {
            $('#sponsorSearchData').append(`
           <p>The consultant you are searching for does not have a Tastefully Simple website. In order to continue:</p>
           <ul class="sponsor-result--error">
            <li>Contact your consultant</li>
            <li>Contact HQ at 1.866.448.6446 or <a href="mailto:help@tastefullysimple.com">help@tastefullysimple.com</a></li>
           </ul>`);
        },
    });
}

/**
 * Get consultant information from Tastefully Simple's API by ID.
 */
function getConsultantInfoByID() {
    $.ajax({
        type: 'GET',
        accepts: 'json',
        url: `https://tsapi.tastefullysimple.com/search/join/${apiParams}`,
        success: (data) => {
            if (data.Results !== null) {
                displayConsultantInformation(data);
            }
        },
        error: () => {
            $('#sponsorSearchData').append(`
           <p>The consultant you are searching for does not have a Tastefully Simple website. In order to continue:</p>
           <ul class="sponsor-result--error">
            <li>Contact your consultant</li>
            <li>Contact HQ at 1.866.448.6446 or <a href="mailto:help@tastefullysimple.com">help@tastefullysimple.com</a></li>
           </ul>`);
        },
    });
}

/**
 * Get consultant information from Tastefully Simple's API zip code.
 * If no consultants are within a 200 mile radius, the Tastefully Simple generic consultant will display.
 */
function getConsultantInfoByZip() {
    $.ajax({
        type: 'GET',
        accepts: 'json',
        url: `https://tsapi.tastefullysimple.com/search/join/${apiParams}`,
        success: (data) => {
            if (data.Results !== null) {
                displayConsultantInformation(data);
            }
        },
        error: () => {
            document.getElementById('divTsConsFound').style.display = 'block';
            $('#sponsorSearchData').append(defaultConsultantSearchMarkup);
        },
    });
}

/** Search by consultant ID and display results on dom */
$('#btnConsIdSearch').on('click', (e) => {
    if (($('#txtConsultantID').val()) === '') {
        $('#sponsorSearchData').empty();
        e.preventDefault();
        $('#sponsorSearchData').append('Please enter a valid ID in the text box.');
    } else {
        e.preventDefault();
        $('#sponsorSearchData').empty();
        apiParams = `cid/${consultantSearchParams.consultantId}`;
        $('#txtConsultantName').val('');
        $('#txtZipCode').val('');
        getConsultantInfoByID();
    }
});

/** Search by consultant name and display results on dom */
$('#btnConsNameSearch').on('click', (e) => {
    clearErrorMessages();
    if (($('#txtConsultantName').val()) === ''
        || (($('#ConsultantState').val()) === '')) {
        $('#sponsorSearchData').empty();
        e.preventDefault();
        $('#sponsorSearchData').append('Please enter a name in the text box and select a state');
    } else {
        e.preventDefault();
        $('#sponsorSearchData').empty();
        apiParams = `name/${consultantSearchParams.consultantName}/${consultantState}/1`;
        $('#txtConsultantID').val('');
        $('#txtZipCode').val('');
        getConsultantInfoByName();
    }
});

/** Search by consultant zip code and display results on dom */
$('#btnConsZipSearch').on('click', (e) => {
    clearErrorMessages();
    if (($('#txtZipCode').val()) === '') {
        $('#sponsorSearchData').empty();
        e.preventDefault();
        $('#sponsorSearchData').append('Please enter a zip code in the text box.');
    } else {
        e.preventDefault();
        $('#sponsorSearchData').empty();
        apiParams = `zip/${consultantSearchParams.consultantZipCode}/200/1`;
        $('#txtConsultantID').val('');
        $('#txtConsultantName').val('');
        getConsultantInfoByZip();
    }
});

// Join Page Event Listeners
$('#frmJoinLoginTest').submit((e) => {
    e.preventDefault();
    clearErrorMessages();
    if (toggleLoginSignUp.logInForm === true
        && ($('#EmailAddress').val()) === ''
        || toggleLoginSignUp.logInForm === true
        && ($('#Password').val()) === '') {
        $('#loginErrors').append('<h5>Please make sure all inputs are filled in.</h5>');
    } else if (toggleLoginSignUp.signUpForm === true) {
        if (($('#FirstName').val()) === ''
            || ($('#LastName').val()) === ''
            || ($('#EmailAddress').val()) === ''
            || ($('#Password').val()) === ''
            || ($('#Password2').val()) === '') {
            $('#loginErrors').append('<h5>Please make sure all inputs are filled in.</h5>');
        } else {
            localStorage.setItem('isJoin', true);
            submitLoginInfo();
        }
    } else {
        localStorage.setItem('isJoin', true);
        submitLoginInfo();
    }
});

// Consultant Search Event Listeners
$('#consultantSearchForm').on('change', () => handleFormChange(event));

// Kit Page Event Listeners
$('#kit-page-next').on('click', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('id')) {
        const szFormId = params.get('id');
        location.href = `${API_URLS.TELL_US}${szFormId}`;
    } else {
        location.href = '/join';
    }
});

/**
 * This function will remove the container class on the page wrapper for join pages. This is to allow full width banner.
 */
function removeContainer() {
    document.getElementById('page-wrapper').classList.remove('container');
}

/**
 * This function will show or hide form sign up fields when toggle is checked.
 */
function toggleStyles() {
    const checkbox = loginPage.querySelector('#form-toggle');
    const signUp = loginPage.querySelector('#sign-up');
    const login = loginPage.querySelector('#login');
    const firstName = loginPage.querySelector('#firstNameField');
    const lastName = loginPage.querySelector('#lastNameField');
    const password2 = loginPage.querySelector('#password2Field');

    checkbox.addEventListener('change', (event) => {
        clearErrorMessages();
        if (event.target.checked) {
            toggleLoginSignUp.signUpForm = true;
            toggleLoginSignUp.logInForm = false;
            login.classList.remove('active');
            signUp.classList.add('active');
            firstName.classList.remove('hidden');
            lastName.classList.remove('hidden');
            password2.classList.remove('hidden');
        } else {
            toggleLoginSignUp.logInForm = true;
            toggleLoginSignUp.signUpForm = false;
            signUp.classList.remove('active');
            login.classList.add('active');
            firstName.classList.add('hidden');
            lastName.classList.add('hidden');
            password2.classList.add('hidden');
        }
    });
}


/**
 * This function will change value styling once a value is selected.
 */
function styleSelectValue() {
    const dates = personalInfoPage.querySelectorAll('[type="date"]');
    const selectors = personalInfoPage.querySelectorAll('[type="select"]');

    function addChangeHandler(elementArray) {
        elementArray.forEach((element) => {
            element.addEventListener('change', () => {
                element.classList.remove('empty');
            });
        });
    }
    if (dates) { addChangeHandler(dates); }
    if (selectors) { addChangeHandler(selectors); }
}

/**
 * This function will hide primary phone field when 'cell is primary' is checked.
 */
function togglePhoneConditionalField() {
    const phoneCheckbox = personalInfoPage.querySelector('#MobilePhoneCheckbox');
    const primaryPhone = personalInfoPage.querySelector('#PrimaryPhone');
    const primaryPhoneDiv = personalInfoPage.querySelector('#primaryPhoneField');
    phoneCheckbox.addEventListener('change', (event) => {
        if (!event.target.checked) {
            primaryPhoneDiv.classList.remove('disabled');
            primaryPhone.removeAttribute('disabled');
        } else {
            $(primaryPhone).val('');
            primaryPhoneDiv.classList.add('disabled');
            primaryPhone.setAttribute('disabled', 'disabled');
        }
    });
}

/**
 * This function will hide shipping address fields when 'shipping same as billing' is checked.
 */
function toggleAddressConditionalFields() {
    const addressCheckbox = personalInfoPage.querySelector('#AddressCheckbox');
    const shippingFieldset = personalInfoPage.querySelector('#shipping-address');
    addressCheckbox.addEventListener('change', (event) => {
        if (!event.target.checked) {
            shippingFieldset.classList.remove('hidden');
        } else {
            $(shippingFieldset).empty();
            shippingFieldset.classList.add('hidden');
        }
    });
}

/**
 * This function will show the "other" text field when Other is the option selected in TS Cash dropdown.
 */
function toggleTsCashConditionalField() {
    const cashOption = personalInfoPage.querySelector('#TsCashOption');
    const otherField = personalInfoPage.querySelector('#tsCashOptionTextField');

    cashOption.addEventListener('change', () => {
        const strCashOption = cashOption.options[cashOption.selectedIndex].text;
        if (strCashOption === 'Other:') {
            otherField.classList.remove('hidden');
        } else {
            otherField.classList.add('hidden');
        }
    });
}

/**
 * This function will show modal on link click.
 */
function openTermsModal() {
    const termsModal = personalInfoPage.querySelector('#terms-modal');
    const modalLink = personalInfoPage.querySelector('#openTermsModal');

    modalLink.addEventListener('click', (event) => {
        event.preventDefault();
        termsModal.classList.add('join__modal-overlay--active');
    });
}

/**
 * This function will close the terms modal on icon click.
 */
function closeTermsModal() {
    const termsModal = personalInfoPage.querySelector('#terms-modal');
    const closeIcons = personalInfoPage.querySelectorAll('.terms-close');

    closeIcons.forEach((closeIcon) => {
        closeIcon.addEventListener('click', () => {
            termsModal.classList.remove('join__modal-overlay--active');
        });
    });
}

function setSubmissionDefaults() {
    if (document.getElementById('MobilePhoneCheckbox').checked) {
        if (document.getElementById('CellPhone').value) {
            document.getElementById('PrimaryPhone').value = document.getElementById('CellPhone').value;
        }
    }

    if (document.getElementById('AddressCheckbox').checked === true) {
        if (document.getElementById('BillingAddressLine1').value) {
            document.getElementById('ShippingAddressLine1').value = document.getElementById('BillingAddressLine1').value;
        }
        if (document.getElementById('BillingAddressLine2').value) {
            document.getElementById('ShippingAddressLine2').value = document.getElementById('BillingAddressLine2').value;
        }
        if (document.getElementById('BillingCity').value) {
            document.getElementById('ShippingCity').value = document.getElementById('BillingCity').value;
        }
        if (document.getElementById('BillingState').value) {
            document.getElementById('ShippingState').value = document.getElementById('BillingState').value;
        }
        if (document.getElementById('BillingZip').value) {
            document.getElementById('ShippingZip').value = document.getElementById('BillingZip').value;
        }
    }

    try {
        if (document.getElementById('BirthDate').value) {
            let DOB = new Date(document.getElementById('BirthDate').value);
            DOB = new Date(DOB.getTime() + Math.abs(DOB.getTimezoneOffset() * 60000));
            const month = (String(DOB.getMonth() + 1)).length > 1 ? (DOB.getMonth() + 1) : `0${(DOB.getMonth() + 1)}`;
            const day = (String(DOB.getDate()).length > 1) ? (DOB.getDate()) : `0${(DOB.getDate())}`;
            const year = DOB.getFullYear();
            DOB = `${month}/${day}/${year}`;
            document.getElementById('DateOfBirth').value = DOB;
        }
    } catch (err) {
        document.getElementById('DateOfBirth').value = '';
    }
}

/**
 * Trigger submit on checkout button click.
 */
function triggerSubmit() {
    const checkoutButton = personalInfoPage.querySelector('#checkout');

    checkoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        setSubmissionDefaults();
        clearErrorMessages();
        const oForm = $('#frmJoinPersonalInfo');
        const disabled = oForm.find(':input:disabled').removeAttr('disabled');
        const serialized = oForm.serialize();
        disabled.attr('disabled', 'disabled');
        const iSponsorID = document.getElementById('SponsorId').value;
        $.ajax({
            type: 'POST',
            url: 'https://tsapi.tastefullysimple.com/join/user',
            data: serialized,
            cache: true,
            success: () => {
                location.href = `${API_URLS.CHECKOUT}${iSponsorID}?PID=172`;
            },
            error: (error) => {
                displayErrorMessage(error);
            },
        });
    });
}

/**
 * Trigger terms checkbox on form when external checkbox is clicked &
 * grab current Tastefully Simple terms and conditions on page load.
 */
function triggerTermsApprove() {
    const visibleCheckbox = personalInfoPage.querySelector('#TermsCheckboxVisible');

    // Grab current Tastefully Simple terms and conditions with version number
    $.ajax({
        type: 'GET',
        accepts: 'json',
        url: `${API_URLS.JOIN_TC}`,
        success: (data) => {
            if (data !== null) {
                document.getElementById('TermsConditionsVersion').value = data.Version;
                $('#terms-conditions').append(`
                    <div>${data.HtmlMarkup}</div>
                `);
            }
        },
        error: () => {
            $('#terms-conditions-backup').removeClass('hidden');
        },
    });

    visibleCheckbox.addEventListener('change', () => {
        if (visibleCheckbox.checked === true) {
            document.getElementById('TermsConditionsOptIn').checked = true;
        } else {
            document.getElementById('TermsConditionsOptIn').checked = false;
        }
    });
}

/**
 * Trigger text opt in
 */
function triggerTextOptIn() {
    const OptInText = personalInfoPage.querySelector('#OptInText');
    OptInText.addEventListener('change', () => {
        if (OptInText.checked === true) {
            document.getElementById('OptInText').checked = true;
        } else {
            document.getElementById('OptInText').checked = false;
        }
    });
}

/**
 * Trigger confetti
 */
function triggerConfetti() {
    const confettiRoots = document.querySelectorAll('[data-fun]');
    confettiRoots.forEach(confettiRoot => {
        confetti(confettiRoot);
    });
}

/**
* This function will be called on page load for /join. It will be used to make a call to BigCommerce's API
* to add the consultant kit to the cart and associate the user who is joining with a unique ID
* from BigCommerce.
*/
function postData(url = '', cartItems = {}) {
    return fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartItems),
    });
}

function getData(url = '') {
    return fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

/**
 * This function will grab the BigCommerce unique ID that is passed from the join/login page
 * and use it to validate the form submission to Tastefully Simple's endpoint.
 */
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('id')) {
        setInfoFormId(params.get('id'));
    } else {
        location.href = '/join';
    }
}

function createCart() {
    console.log('No cart create one');
    postData('/api/storefront/cart', {
        lineItems: [
            {
                quantity: 1,
                productId: 133,
            },
        ],
    })
        .then(response => response.json())
        .then(data => {
            setLoginFormId(data.id);
        })
        .catch(error => console.log(error));
}
/**
 * Export join process front end functions.
 */
export default function joinProcessInteraction() {
    // call functions on join page
    if (loginPage) {
        removeContainer();
        toggleStyles();
        $(document).ready(() => {
            console.log('Log Cart');
            getData('/api/storefront/cart')
                .then(response => response.json())
                .then(myJson => {
                    if (myJson.length > 0) {
                        console.log('Cart found');
                        setLoginFormId(myJson[0].id);
                    } else {
                        createCart();
                    }
                });
        });
    }
    // call functions on kit page
    if (kitPage) {
        removeContainer();
    }
    // call functions on tell us about yourself page
    if (personalInfoPage) {
        removeContainer();
        styleSelectValue();
        togglePhoneConditionalField();
        toggleAddressConditionalFields();
        toggleTsCashConditionalField();
        openTermsModal();
        closeTermsModal();
        triggerSubmit();
        triggerTermsApprove();
        triggerTextOptIn();
        getUrlParams();
        waitForSocialBug(() => {
            const affiliateId = $('#affiliatediv').data('affiliateid');
            initializeSocialBug(affiliateId);
        });
    }

    if (confirmationPage) {
        removeContainer();
        triggerConfetti();
    }
}
