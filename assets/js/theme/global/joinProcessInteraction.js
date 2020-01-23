const loginPage = document.getElementById('join-login');
const personalInfoPage = document.getElementById('personal-info');

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
            primaryPhoneDiv.classList.add('disabled');
            primaryPhone.setAttribute('disabled', 'disabled');
        }
    });
}

/**
 * This function will hide billing address fields when 'shipping same as billing' is checked.
 */
function toggleAddressConditionalFields() {
    const addressCheckbox = personalInfoPage.querySelector('#AddressCheckbox');
    const shippingFieldset = personalInfoPage.querySelector('#shipping-address');

    addressCheckbox.addEventListener('change', (event) => {
        if (!event.target.checked) {
            shippingFieldset.classList.remove('hidden');
        } else {
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
    const infoForm = personalInfoPage.querySelector('#frmJoinPersonalInfoTest');
    const checkoutButton = personalInfoPage.querySelector('#checkout');

    checkoutButton.addEventListener('click', () => {
        infoForm.submit();
    });
}

/**
 * Trigger terms checkbox on form when external checkbox is clicked.
 */
function triggerTermsApprove() {
    const visibleCheckbox = personalInfoPage.querySelector('#TermsCheckboxVisible');
    const invisibleCheckbox = personalInfoPage.querySelector('#TermsCheckbox');

    visibleCheckbox.addEventListener('change', () => {
        if (visibleCheckbox.checked === true) {
            invisibleCheckbox.checked = true;
        } else {
            invisibleCheckbox.checked = false;
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
    }
}
