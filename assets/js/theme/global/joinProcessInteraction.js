const loginPage         = document.getElementById('join-login');
const personalInfoPage = document.getElementById('personal-info');
const confirmationPage = document.getElementById('join-confirmation');

/**
 * This object will hold the user information for the join/login page.
 */
const loginUserInformation = {
    // TODO determine secure, unique string to use in place of this hardcoded ID
    Id: '0cd7112e-1600-4475-9a30-c8730b08c8a1',
    FirstName: null,
    LastName: null,
    EmailAddress: null,
    Password: null,
    Password2: null,
};

/**
 * This object will hold the user information for the Tell Us About Yourself page.
 */
const joinNewUserInformation = {
    Id: null,
    Prefix: null,
    PreferredName: null,
    FirstName: null,
    LastName: null,
    SSN: null,
    DOB: null,
    PrimaryPhone: null,
    CellPhone: null,
    TsCashOption: null,
    TsCashOptionText: null,
    TermsConditionsOptIn: false,
    OptInText: true,
    TermsConditionsVersion: null,
    BillingAddressLine1: null,
    BillingAddressLine2: null,
    BillingCity: null,
    BillingState: null,
    BillingZip: null,
    ShippingAddressLine1: null,
    ShippingAddressLine2: null,
    ShippingCity: null,
    ShippingState: null,
    ShippingZip: null,
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

/**
 * This variable will hold the specific parameters for each GET call to
 * Tastefully Simple's consultant search API
 */
let apiParams = '';
let consultantState = '';


/**
 * This function handles input changes for the login form
 * and the consultant search form in the join process
 */
function handleFormChange(event) {
    if (event.srcElement.form.id === 'frmJoinLoginTest') {
        loginUserInformation[event.target.name] = event.target.value;
    } else if (event.srcElement.form.id === 'consultantSearchForm'
        && event.target.name !== 'ConsultantState') {
        consultantSearchParams[event.target.name] = event.target.value;
    } else if (event.target.name === 'ConsultantState') {
        consultantState = event.target.value;
    }
}

/**
 * This function handles input changes for the JoinLoginText Form
 */
function handleJoinLoginTestFormChange(event) {
    const target = event.target;
    if (target.name !== 'OptInText'
        && target.name !== 'MobilePhoneCheckbox'
        && target.name !== 'AddressCheckbox') {
        if ((!$('#shipping-address').hasClass('hidden'))) {
            joinNewUserInformation[target.name] = target.value;
        } else if ((!$('#primaryPhoneField').hasClass('disabled'))) {
            joinNewUserInformation[target.name] = target.value;
        } else {
            joinNewUserInformation[target.name] = target.value;
            joinNewUserInformation.PrimaryPhone = joinNewUserInformation.CellPhone;
            joinNewUserInformation.ShippingAddressLine1 = joinNewUserInformation.BillingAddressLine1;
            joinNewUserInformation.ShippingAddressLine2 = joinNewUserInformation.BillingAddressLine2;
            joinNewUserInformation.ShippingCity = joinNewUserInformation.BillingCity;
            joinNewUserInformation.ShippingState = joinNewUserInformation.BillingState;
            joinNewUserInformation.ShippingZip = joinNewUserInformation.BillingZip;
        }
    }
}

/** This function will submit the login information
 * on the join/login page. This is still in development until
 * we determine which unique Id will be sent to the API in the loginUserInformation object.
*/
function submitLoginInfo() {
    console.log('submitLoginInfo running');
//     axios.post('https://qa1-tsapi.tastefullysimple.com/join/login', loginUserInformation)
//     .then((response) => {
//         console.log(response);
//     })
//   .catch((error) => {
//       console.log(error);
//   });
}

/**
 * Display consultant information returned from Tastefully Simple API
 */
function displayConsultantInformation(data) {
    $.each(data.Results, (i) => {
        const results = data.Results[i];
        // TODO add blank profile image to files for when user photo is not provided
        let sponsorImage = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
        if (results.Image) {
            sponsorImage = results.Image;
        }
        const {
            ConsultantId,
            Name,
            Title,
            PhoneNumber,
            EmailAddress,
            Location,
            WebUrl,
        } = results;
        $('#sponsorSearchData').append(`
            <ul id='${ConsultantId}'>
                <img src='${sponsorImage}'/>
                <li>${Name}</li>
                <li>${Title}</li>
                <li>Phone: ${PhoneNumber}</li>
                <li>Email: ${EmailAddress}</li>
                <li>${Location}</li>
                <a href='${WebUrl}' target='_blank'>View my TS page</a>
            </ul>
        `);
    });
}

/**
 * This function will take the error message returned from Tastefully Simple's API when
 * there is no consultant data available and append it on the dom
 */
function displayErrorMessage(error) {
    $('#sponsorSearchData').append(`
        <h4>${error.responseJSON}</h4>
    `);
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
    joinNewUserInformation.Id = $(event.target).closest('ul').attr('id');
    $(event.target).closest('ul').css('border', '1px solid #00757D', 'padding', '20px');
});

/**
 * Get consultant information from Tastefully Simple's API by ID, name, or
 * zip code within a 200 mile radius.
 */
function getConsultantInfo() {
    $.ajax({
        type: 'GET',
        accepts: 'json',
        url: `https://tsapi.tastefullysimple.com/search/join/${apiParams}`,
        success: (data) => {
            if (data.Results !== null) {
                displayConsultantInformation(data);
            }
        },
        error: (error) => {
            displayErrorMessage(error);
        },
    });
}

/** Search by consultant ID and display results on dom */
$('#btnConsIdSearch').on('click', (e) => {
    e.preventDefault();
    apiParams = `cid/${consultantSearchParams.consultantId}`;
    $('#sponsorSearchData').empty();
    $('#txtConsultantName').val('');
    $('#txtZipCode').val('');
    getConsultantInfo();
});

/** Search by consultant name and display results on dom */
$('#btnConsNameSearch').on('click', (e) => {
    e.preventDefault();
    apiParams = `name/${consultantSearchParams.consultantName}/${consultantState}/1`;
    $('#sponsorSearchData').empty();
    $('#txtConsultantID').val('');
    $('#txtZipCode').val('');
    getConsultantInfo();
});

/** Search by consultant zip code and display results on dom */
$('#btnConsZipSearch').on('click', (e) => {
    e.preventDefault();
    apiParams = `zip/${consultantSearchParams.consultantZipCode}/200/1`;
    $('#sponsorSearchData').empty();
    $('#txtConsultantID').val('');
    $('#txtConsultantName').val('');
    getConsultantInfo();
});

// Join Page Event Listeners
$('#frmJoinLoginTest').on('change', () => handleFormChange(event));
$('#submit').on('click', submitLoginInfo);

// Tell Us About Yourself Event Listeners
$('#frmJoinPersonalInfoTest').on('change', () => handleJoinLoginTestFormChange(event));

// Consultant Search Event Listeners
$('#consultantSearchForm').on('change', () => handleFormChange(event));

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
        if (event.target.checked) {
            login.classList.remove('active');
            signUp.classList.add('active');
            firstName.classList.remove('hidden');
            lastName.classList.remove('hidden');
            password2.classList.remove('hidden');
        } else {
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
            joinNewUserInformation.PrimaryPhone = joinNewUserInformation.CellPhone;
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
            joinNewUserInformation.ShippingAddressLine1 = null;
            joinNewUserInformation.ShippingAddressLine2 = null;
            joinNewUserInformation.ShippingCity = null;
            joinNewUserInformation.ShippingState = null;
            joinNewUserInformation.ShippingZip = null;
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
    modalLink.addEventListener('click', () => {
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

/**
 * Trigger submit on checkout button click.
 */
function triggerSubmit() {
    // const infoForm = personalInfoPage.querySelector('#frmJoinPersonalInfoTest');
    const checkoutButton = personalInfoPage.querySelector('#checkout');

    checkoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log(joinNewUserInformation);
        // infoForm.submit();
    });
}

/**
 * Trigger terms checkbox on form when external checkbox is clicked &
 * grab current Tastefully Simple terms and conditions on page load.
 */
function triggerTermsApprove() {
    const visibleCheckbox = personalInfoPage.querySelector('#TermsCheckboxVisible');
    const invisibleCheckbox = personalInfoPage.querySelector('#TermsCheckbox');
    // Grab current Tastefully Simple terms and conditions with version number
    $.ajax({
        type: 'GET',
        accepts: 'json',
        url: 'https://tsapi.tastefullysimple.com/join/tc',
        success: (data) => {
            if (data !== null) {
                joinNewUserInformation.TermsConditionsVersion = data.Version;
                $('#terms-conditions').append(`
                    <div>${data.HtmlMarkup}</div>
                `);
            }
        },
        error: (error) => {
            console.log(error);
            // TODO Determine how to handle this if terms and conditions route doesn't work
            // Option: Add hardcoded version of terms and conditions and set
            // joinNewUserInformation.TermsConditionsVersionvalue to that version #
        },
    });
    visibleCheckbox.addEventListener('change', () => {
        if (visibleCheckbox.checked === true) {
            invisibleCheckbox.checked = true;
            joinNewUserInformation.TermsConditionsOptIn = true;
        } else {
            invisibleCheckbox.checked = false;
            joinNewUserInformation.TermsConditionsOptIn = false;
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
            joinNewUserInformation.OptInText = true;
        } else {
            joinNewUserInformation.OptInText = false;
        }
    });
}

/**
 * Export join process front end functions.
 */
export default function joinProcessInteraction() {
    // call functions on join page
    if (loginPage) {
        removeContainer();
        toggleStyles();
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
    }

    if (confirmationPage) {
        removeContainer();
    }
}
