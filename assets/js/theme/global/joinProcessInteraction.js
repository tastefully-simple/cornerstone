import { confetti } from 'dom-confetti';
import TSCookie from '../common/ts-cookie';
import ConsultantCard from '../common/consultant-card';

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

/**
 * This object will hold the consultant search information
 * on the Tell Us About Yourself page
 */
const consultantSearchParams = {
    consultantId: null,
    consultantName: null,
    consultantZipCode: null,
};

const defaultConsultantData = {
    Results: [{
        ConsultantId: '0160785',
        EmailAddress: 'help@tastefullysimple.com',
        Location: 'Alexandria, MN',
        Name: 'Tastefully Simple',
        PhoneNumber: '866.448.6446',
        WebUrl: 'https://www.tastefullysimple.com/web/htstoyou',
        AfId: '1',
    }],
};


/**
 * This variables will hold parameters for GET calls to
 * Tastefully Simple's consultant search API
 */
let apiParams = '';
let consultantState = '';
// TST-175 Commenting out locationDisplay because it's not
// being used. Not sure if it's needed anywhere
// let locationDisplay = '';

/** API URLs used throughout the join process */
const API_URLS = {
    BLAST_OFF: '',
    TELL_US: '',
    CHECKOUT: '',
    TSAPI_BASE: '',
    JOIN_SS_PRODUCT_ID: 0,
};

const isNumericInput = (event) => {
    const key = event.keyCode;
    return ((key >= 48 && key <= 57) || // Allow number line
        (key >= 96 && key <= 105) // Allow number pad
    );
};

const isModifierKey = (event) => {
    const key = event.keyCode;
    return (event.shiftKey === true || key === 35 || key === 36) || // Allow Shift, Home, End
        (key === 8 || key === 9 || key === 13 || key === 46) || // Allow Backspace, Tab, Enter, Delete
        (key > 36 && key < 41) || // Allow left, up, right, down
        (
            // Allow Ctrl/Command + A,C,V,X,Z
            (event.ctrlKey === true || event.metaKey === true) &&
            (key === 65 || key === 67 || key === 86 || key === 88 || key === 90)
        );
};

const enforceFormat = (event) => {
    // Input must be of a valid number format or a modifier key, and not longer than ten digits
    if (!isNumericInput(event) && !isModifierKey(event)) {
        event.preventDefault();
    }
};

function formatToPhoneSub(txtValue) {
    const input = txtValue.replace(/\D/g, '').substring(0, 10); // First ten digits of input only
    const zip = input.substring(0, 3);
    const middle = input.substring(3, 6);
    const last = input.substring(6, 10);

    if (input.length > 6) {
        return `${zip}-${middle}-${last}`;
    } else if (input.length > 3) {
        return `${zip}-${middle}`;
    } else if (input.length > 0) {
        return `${zip}`;
    }
    return txtValue;
}

const formatToPhone = (event) => {
    if (isModifierKey(event)) { return; }

    // I am lazy and don't like to type things more than once
    const target = event.target;
    const input = target.value.replace(/\D/g, '').substring(0, 10); // First ten digits of input only
    target.value = formatToPhoneSub(input);
};

const formatToSSN = (event) => {
    if (isModifierKey(event)) { return; }

    // I am lazy and don't like to type things more than once
    const target = event.target;
    const input = target.value.replace(/\D/g, '').substring(0, 9); // First ten digits of input only
    const zip = input.substring(0, 3);
    const middle = input.substring(3, 5);
    const last = input.substring(5, 9);

    if (input.length > 5) {
        target.value = `${zip}-${middle}-${last}`;
    } else if (input.length > 3) {
        target.value = `${zip}-${middle}`;
    } else if (input.length > 0) {
        target.value = `${zip}`;
    }
};

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
                <li class="join__error" data-errorid='${id}'>${message}</li>
            `);
            if (id === 'SponsorId' && $('#sponsorSearchData').children.length > 0) {
                document.getElementById('sponsorSearchData').style.border = '1px solid #D0021B';
            }
        });
        $('#formErrorMessages').append(`
        <h5 class="join__error" >If you continue to experience issues, please contact the 
        Customer Services team at 866.448.6446.</li>
    `);
    } else if (error) {
        $('#formErrorMessages').append(`
            <h4 class="join__error">${error.responseJSON}</h4>
        `);
    } else {
        $('#sponsorSearchData').append(`
            <h4  class="join__error">No results found.</h4>
        `);
    }
}

function populateFormFields(data) {
    $(document).ready(() => {
        if (data) {
            document.getElementById('PreferredName').value = data.PreferredName;
            document.getElementById('FirstName').value = data.FirstName;
            document.getElementById('LastName').value = data.LastName;
            document.getElementById('CellPhone').value = data.CellPhone;
            if (data.CellPhone === data.PrimaryPhone) {
                document.getElementById('MobilePhoneCheckbox').checked = true;
            } else {
                document.getElementById('PrimaryPhone').value = data.PrimaryPhone;
            }
            if (document.getElementById('CellPhone').value) {
                document.getElementById('CellPhone').value = formatToPhoneSub(document.getElementById('CellPhone').value);
            }
            if (document.getElementById('PrimaryPhone').value) {
                document.getElementById('PrimaryPhone').value = formatToPhoneSub(document.getElementById('PrimaryPhone').value);
            }

            document.getElementById('BillingAddressLine1').value = data.BillingAddressLine1;
            document.getElementById('BillingAddressLine2').value = data.BillingAddressLine2;
            document.getElementById('BillingCity').value = data.BillingCity;
            document.getElementById('BillingState').value = data.BillingState;
            document.getElementById('BillingZip').value = data.BillingZip;

            document.getElementById('ShippingAddressLine1').value = data.ShippingAddressLine1;
            document.getElementById('ShippingAddressLine2').value = data.ShippingAddressLine2;
            document.getElementById('ShippingCity').value = data.ShippingCity;
            document.getElementById('ShippingState').value = data.ShippingState;
            document.getElementById('ShippingZip').value = data.ShippingZip;

            let bAddressesMatch = false;
            if (data.BillingAddressLine1 && data.BillingCity && data.BillingState && data.BillingZip &&
                data.ShippingAddressLine1 && data.ShippingCity && data.ShippingState && data.ShippingZip) {
                if (data.BillingAddressLine1 === data.ShippingAddressLine1 &&
                    data.BillingCity === data.ShippingCity &&
                    data.BillingState === data.ShippingState &&
                    data.BillingZip === data.ShippingZip) {
                    bAddressesMatch = true;
                }
                if (bAddressesMatch && data.BillingAddressLine2 && data.ShippingAddressLine2) {
                    if (data.BillingAddressLine2 !== data.ShippingAddressLine2) {
                        bAddressesMatch = false;
                    }
                }
                if (bAddressesMatch && data.BillingAddressLine2 && !data.ShippingAddressLine2) {
                    bAddressesMatch = false;
                } else if (bAddressesMatch && data.BillingAddressLine2 && !data.ShippingAddressLine2) {
                    bAddressesMatch = false;
                } else if (bAddressesMatch && !data.BillingAddressLine2 && data.ShippingAddressLine2) {
                    bAddressesMatch = false;
                }
            }

            if (!data.ShippingAddressLine1 || data.ShippingAddressLine1.length === 0) {
                bAddressesMatch = true;
            }

            document.getElementById('AddressCheckbox').checked = bAddressesMatch;
            if (!bAddressesMatch) {
                document.getElementById('shipping-address').classList.remove('hidden');
            }
        }
    });
}

/**
* This function checks the URL for a link id from sitecore-tso
* If the link is valid redirect the user to the kit selection page.
*/
function checkLinkId(formIdValue = '') {
    const params = new URLSearchParams(window.location.search);
    if (params.has('xfid')) {
        const szLinkId = encodeURIComponent(params.get('xfid'));
        if (szLinkId) {
            const docHeight = $(document).height();
            $('body').append("<div id='divOverlayLinkLookup' class='body-overlay'></div>");
            $('#divOverlayLinkLookup').height(docHeight);

            $.ajax({
                type: 'GET',
                accepts: 'json',
                url: `${API_URLS.TSAPI_BASE}/users/scauth/check/?id=${szLinkId}`,
                cache: true,
                success: () => {
                    window.location.href = `${API_URLS.BLAST_OFF}?id=${formIdValue}&xfid=${szLinkId}`;
                    setTimeout(() => { document.getElementById('divOverlayLinkLookup').remove(); }, 3000);
                },
                error: () => {
                    document.getElementById('divOverlayLinkLookup').remove();
                },
            });
        }
    }
}

/**
* This function checks the URL for a link id from sitecore-tso
* If the link is valid the form field are loaded.
*/
function loadLinkId(formIdValue = '') {
    const params = new URLSearchParams(window.location.search);
    if (params.has('xfid')) {
        const szLinkId = encodeURIComponent(params.get('xfid'));
        if (szLinkId) {
            const docHeight = $(document).height();
            $('body').append("<div id='divOverlayLinkLookup' class='body-overlay'></div>");
            $('#divOverlayLinkLookup').height(docHeight);
            $.ajax({
                type: 'GET',
                accepts: 'json',
                url: `${API_URLS.TSAPI_BASE}/users/scauth/load/?id=${szLinkId}&cid=${formIdValue}`,
                cache: true,
                success: (data) => {
                    populateFormFields(data);
                    setTimeout(() => { document.getElementById('divOverlayLinkLookup').remove(); }, 3000);
                },
                error: (error) => {
                    displayLoginErrorMessage(error);
                    document.getElementById('divOverlayLinkLookup').remove();
                },
            });
        }
    }
}

function setLoginFormId(formIdValue = '') {
    $('#frmJoinLoginTest > #Id').val(formIdValue);
    checkLinkId(formIdValue);
}

function setInfoFormId(formIdValue = '') {
    $('#frmJoinPersonalInfo > #Id').val(formIdValue);
    loadLinkId(formIdValue);
}

function clearErrorMessages() {
    $('#formErrorMessages').html('');
    $('#loginErrors').html('');
    if (document.getElementById('divTsConsFound')) {
        document.getElementById('divTsConsFound').style.display = 'none';
    }
    if (document.getElementById('sponsorSearchData')) {
        document.getElementById('sponsorSearchData').style.border = '';
    }
}

function removeEventHandlers() {
    // TST-207
    // Remove click event so that when clicking the search button
    // in Find a Sponsor, selectConsultant() would not be called
    // multiple times
    $('body').off('click', '#sponsorSearchData .consultant-card');
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
*   on the join/login page.
*/
function submitLoginInfo() {
    // prevent autoform fillers from causeing problems.
    if (toggleLoginSignUp.logInForm === true) {
        document.getElementById('FirstName').value = '';
        document.getElementById('LastName').value = '';
        document.getElementById('EmailAddress2').value = '';
        document.getElementById('Password2').value = '';
    }

    $.ajax({
        type: 'POST',
        accepts: 'json',
        url: `${API_URLS.TSAPI_BASE}/join/login`,
        data: $('#frmJoinLoginTest').serialize(),
        cache: false,
        success: (data) => {
            window.location.href = `${API_URLS.BLAST_OFF}?id=${data.Id}`;
        },
        error: (error) => {
            displayLoginErrorMessage(error);
        },
    });
}

/**
 * This function will allow us to select a sponsor from the data
 * that is returned from Tastefully Simple's API.
 */
function selectConsultant(e) {
    // If "View my TS page" link is clicked,
    // do nothing. Don't select the consultant
    if ($(e.target).is('.ts-page-link .framelink-lg')) {
        return;
    }

    $('.consultant-header').show();

    const $consultantCard = $(e.target).closest('.consultant-card');

    if (!$consultantCard.hasClass('selected')) {
        $('#sponsorSearchData .selected').toggleClass('selected');
        $consultantCard.addClass('selected');
        const cid = $consultantCard.data('cid') || null;
        $('#SponsorId').val(cid);
        $consultantCard.find('.consultant-header').hide();
    } else {
        $consultantCard.find('.consultant-header').show();
        $consultantCard.removeClass('selected');
    }
}

/**
 * Display consultant information returned from Tastefully Simple API when searching by ID or name
 */
function displayConsultantInformation(data) {
    const consultantCard = new ConsultantCard();
    consultantCard.getTemplate().then(template => {
        data.Results.forEach((consultant) => {
            const consultantCardHtml = consultantCard.insertConsultantData(template, consultant);
            $('#sponsorSearchData').removeClass('sponsor-result--error');
            $('#sponsorSearchData').append(consultantCardHtml);
            if (data.Results.length < 3) {
                $('#sponsorSearchData').addClass('no-scroll');
            } else {
                $('#sponsorSearchData').removeClass('no-scroll');
            }
        });
        $('body').on('click', '#sponsorSearchData .consultant-card', (e) => {
            selectConsultant(e);
        });
    });
}

function sponsorOptedOutErrorMessage() {
    const $responseWrapper = $('#sponsorSearchData');
    $responseWrapper.addClass('sponsor-result--error');
    $responseWrapper.append(`
        <p>The consultant you are searching for is not currently sponsoring. In order to continue:</p>
        <ul>
            <li>Contact your consultant</li>
            <li>Contact HQ at 1.866.448.6446 or
                <a class="textgray-text" href="mailto:help@tastefullysimple.com">help@tastefullysimple.com</a>
            </li>
        </ul>
    `);
}

function displayAPIErrorMessage() {
    const $responseWrapper = $('#sponsorSearchData');
    $responseWrapper.addClass('sponsor-result--error');
    $responseWrapper.append('<p>An error has occurred.</p>');
}

/**
 * Get consultant information from Tastefully Simple's API by name.
 */
function getConsultantInfoByName() {
    $.ajax({
        type: 'GET',
        accepts: 'json',
        url: `${API_URLS.TSAPI_BASE}/search/join/${apiParams}`,
        success: (data) => {
            if (data.Results !== null) {
                displayConsultantInformation(data);
            }
        },
        error: (err) => {
            const statusCode = err.status.toString();
            if (statusCode[0] === '5') {
                displayAPIErrorMessage();
            } else {
                sponsorOptedOutErrorMessage();
            }
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
        url: `${API_URLS.TSAPI_BASE}/search/join/${apiParams}`,
        success: (data) => {
            if (data.Results !== null) {
                displayConsultantInformation(data);
            }
        },
        error: (err) => {
            const statusCode = err.status.toString();
            if (statusCode[0] === '5') {
                displayAPIErrorMessage();
            } else {
                sponsorOptedOutErrorMessage();
            }
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
        url: `${API_URLS.TSAPI_BASE}/search/join/${apiParams}`,
        success: (data) => {
            if (data.Results !== null) {
                displayConsultantInformation(data);
            }
        },
        error: (err) => {
            const statusCode = err.status.toString();
            if (statusCode[0] === '5') {
                displayAPIErrorMessage();
            } else {
                document.getElementById('divTsConsFound').style.display = 'block';
                displayConsultantInformation(defaultConsultantData);
            }
        },
    });
}

/** Search by consultant ID and display results on dom */
$('#btnConsIdSearch').on('click', (e) => {
    clearErrorMessages();
    removeEventHandlers();
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
    removeEventHandlers();
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
    removeEventHandlers();
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

/**
 * This function checks to see if the join form email and confirmation email match
 */
function isConfirmEmailMatch() {
    const email = document.getElementById('EmailAddress').value;
    const confirmEmail = document.getElementById('EmailAddress2').value;
    return (email === confirmEmail);
}

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
            || ($('#EmailAddress2').val()) === ''
            || ($('#Password').val()) === ''
            || ($('#Password2').val()) === '') {
            $('#loginErrors').append('<h5>Please make sure all inputs are filled in.</h5>');
        } else if (!isConfirmEmailMatch()) {
            $('#loginErrors').append('<h5>Email Addresses Must Match.</h5>');
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
        let szUrl = `${API_URLS.TELL_US}?id=${szFormId}`;

        // if we are here with a link id, we should have passed through step 1 which creates a cart.
        if (params.has('xfid')) {
            const szLinkId = encodeURIComponent(params.get('xfid'));
            szUrl = `${szUrl}&xfid=${szLinkId}`;
        }
        window.location.href = szUrl;
    } else {
        window.location.href = '/join';
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
    const email2 = loginPage.querySelector('#email2Field');
    const forgotPassword = loginPage.querySelector('.forgot-password');

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
            email2.classList.remove('hidden');
            password2.querySelector('#Password2').setAttribute('tabindex', 0);
            email2.querySelector('#EmailAddress2').setAttribute('tabindex', 0);
            forgotPassword.style.display = 'none';
        } else {
            toggleLoginSignUp.logInForm = true;
            toggleLoginSignUp.signUpForm = false;
            signUp.classList.remove('active');
            login.classList.add('active');
            firstName.classList.add('hidden');
            lastName.classList.add('hidden');
            password2.classList.add('hidden');
            email2.classList.add('hidden');
            password2.querySelector('#Password2').setAttribute('tabindex', -1);
            email2.querySelector('#EmailAddress2').setAttribute('tabindex', -1);
            forgotPassword.style.display = 'block';
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
            $('#shipping-address input').val('');
            $('#ShippingState option:first').attr('selected', true);
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
        termsModal.classList.add('modal-overlay--active');
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
            termsModal.classList.remove('modal-overlay--active');
        });
    });
}

function setSubmissionDefaults() {
    if (document.getElementById('MobilePhoneCheckbox').checked === true) {
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
        localStorage.setItem('isJoin', true);
        const oForm = $('#frmJoinPersonalInfo');
        const disabled = oForm.find(':input:disabled').removeAttr('disabled');
        const serialized = oForm.serialize();
        disabled.attr('disabled', 'disabled');

        const $consultantCard = $('.consultant-card.selected');
        const cid = $consultantCard.data('cid') || null;
        const afid = $consultantCard.data('afid') || null;
        const name = $consultantCard.data('name') || null;

        TSCookie.setConsultantId(cid);
        TSCookie.setConsultantName(name);
        TSCookie.setAffiliateId(afid);

        $.ajax({
            type: 'POST',
            url: `${API_URLS.TSAPI_BASE}/join/user`,
            data: serialized,
            cache: true,
            success: () => {
                window.location.href = '/checkout.php';
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
        url: `${API_URLS.TSAPI_BASE}/join/tc`,
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
    localStorage.removeItem('isJoin');
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

function deleteData(url = '') {
    return fetch(url, {
        method: 'DELETE',
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
        window.location.href = '/join';
    }
}

function createCart() {
    postData('/api/storefront/cart', {
        lineItems: [
            {
                quantity: 1,
                productId: API_URLS.JOIN_SS_PRODUCT_ID,
            },
        ],
    })
        .then(response => response.json())
        .then(data => {
            setLoginFormId(data.id);
        })
        .catch(error => console.error(error));
}

function deleteBBOKCart() {
    $(document).ready(() => {
        getData('/api/storefront/cart')
            .then(response => response.json())
            .then(cart => {
                if (cart.length > 0) {
                    const physicalItems = cart[0].lineItems.physicalItems;

                    physicalItems.forEach(item => {
                        // Delete cart if BBOK product is in cart outside the join process
                        if (item.productId === Number(API_URLS.JOIN_SS_PRODUCT_ID)) {
                            deleteData(`/api/storefront/carts/${cart[0].id}`);
                            return;
                        }
                    });
                }
            })
            .catch(err => {
                console.warn('getData', err);
            });
    });
}

/**
 * Export join process front end functions.
 */
export default function joinProcessInteraction(themeSettings) {
    API_URLS.BLAST_OFF = `${themeSettings.ts_current_store_base_url}/business-blast-off-kit-fw2020/`;
    API_URLS.TELL_US = `${themeSettings.ts_current_store_base_url}/tell-us-about-yourself`;
    API_URLS.TSAPI_BASE = themeSettings.ts_tsapi_base_url;
    API_URLS.JOIN_SS_PRODUCT_ID = `${themeSettings.ts_join_ss_product_id}`;

    // call functions on join page
    if (loginPage) {
        removeContainer();
        toggleStyles();
        $(document).ready(() => {
            getData('/api/storefront/cart')
                .then(response => response.json())
                .then(cart => {
                    if (cart.length > 0) {
                        // Delete prev cart before joining
                        deleteData(`/api/storefront/carts/${cart[0].id}`)
                            .then(_res => {
                                // Create cart with BBOK product
                                createCart();
                                setLoginFormId(cart[0].id);
                            })
                            .catch(err => {
                                console.warn('deleteCart', err);
                            });
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

        $(document).ready(() => {
            const inputElement = document.getElementById('CellPhone');
            inputElement.addEventListener('keydown', enforceFormat);
            inputElement.addEventListener('keyup', formatToPhone);

            const inputElement1 = document.getElementById('PrimaryPhone');
            inputElement1.addEventListener('keydown', enforceFormat);
            inputElement1.addEventListener('keyup', formatToPhone);

            const inputElement2 = document.getElementById('SSN');
            inputElement2.addEventListener('keydown', enforceFormat);
            inputElement2.addEventListener('keyup', formatToSSN);
        });
    }

    if (confirmationPage) {
        removeContainer();
        triggerConfetti();
    }

    if (!personalInfoPage) {
        // Don't delete cart if user is in /join or /kit page
        if (loginPage || kitPage) {
            return;
        }

        // Delete cart if BBOK product is in cart outside the join process
        deleteBBOKCart();
    }
}
