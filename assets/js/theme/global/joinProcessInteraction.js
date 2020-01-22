/**
 * This function will remove the container class on the page wrapper for join pages. This is to allow full width banner.
 */
function removeContainer() {
    if (document.getElementsByClassName('join').length !== 0) {
        document.getElementById('page-wrapper').classList.remove('container');
    }
}

/**
 * This function will show or hide form sign up fields when toggle is checked.
 */
function toggleStyles() {
    const checkbox  = document.getElementById('form-toggle');
    const signUp    = document.getElementById('sign-up');
    const login     = document.getElementById('login');
    const firstName = document.getElementById('firstNameField');
    const lastName  = document.getElementById('lastNameField');
    const password2 = document.getElementById('password2Field');
    if (checkbox) {
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
}

/**
 * This function will change value styling once a value is selected.
 */
function selectStyling() {
    const dates = document.querySelectorAll('[type="date"]');
    const selectors = document.querySelectorAll('[type="select"]');
    function addChangeHandler(elementArray){
        elementArray.forEach((element) => {
            element.addEventListener('change', (event) => {
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
function phoneConditionalFields() {
    const phoneCheckbox = document.getElementById('MobilePhoneCheckbox');
    phoneCheckbox.addEventListener('change', (event) => {
        const primaryPhone = document.getElementById('PrimaryPhone');
        const primaryPhoneDiv = document.getElementById('primaryPhoneField');
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
function addressConditionalFields() {
    const addressCheckbox = document.getElementById('AddressCheckbox');
    addressCheckbox.addEventListener('change', (event) => {
        const shippingFieldset = document.getElementById('shipping-address');
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
function tsCashConditionalOtherField() {
    const cashOption = document.getElementById('TsCashOption');
    const otherField = document.getElementById('tsCashOptionTextField')
    cashOption.addEventListener('change', (event) => {
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
    const termsModal = document.getElementById('terms-modal');
    const modalLink = document.getElementById('openTermsModal');
    modalLink.addEventListener('click', (event) => {
        termsModal.classList.add('join__modal-overlay--active');
    });
}

/**
 * This function will close the terms modal on icon click.
 */
function closeTermsModal() {
    const termsModal = document.getElementById('terms-modal');
    const closeIcons = document.getElementsByClassName('terms-close');
    closeIcons.forEach((closeIcon) => {
        closeIcon.addEventListener('click', (event) => {
            termsModal.classList.remove('join__modal-overlay--active');
        });
    });
}

/**
 * Trigger submit on checkout button click.
 */
function triggerSubmit() {
    const infoForm = document.getElementById('frmJoinPersonalInfoTest');
    const checkoutButton = document.getElementById('checkout');
    checkoutButton.addEventListener('click', (event) => {
        infoForm.submit();
    });
}

/**
 * Trigger terms checkbox on form when external checkbox is clicked.
 */
function triggerTermsApprove() {
    const visibleCheckbox = document.getElementById('TermsCheckboxVisible');
    const invisibleCheckbox = document.getElementById('TermsCheckbox');
    visibleCheckbox.addEventListener('change', (event) => {
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
    removeContainer();
    toggleStyles();
    selectStyling();
    phoneConditionalFields();
    addressConditionalFields();
    tsCashConditionalOtherField();
    openTermsModal();
    closeTermsModal();
    triggerSubmit();
    triggerTermsApprove();
}
