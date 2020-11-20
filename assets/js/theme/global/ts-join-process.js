import utils from '@bigcommerce/stencil-utils';
import TSApi from '../common/ts-api';
import ConsultantCard from '../common/consultant-card';

const JOIN_PAGE = '/join';
const KIT_PAGE = '/business-blast-off-kit-fw2020/';
const PERSONAL_INFO_PAGE = '/tell-us-about-yourself/';

// Indicate which tab to be displayed in the join form
const JOIN_FORM_TABS = {
    login: true,
    signup: false,
};

class TSJoinProcess {
    constructor(themeSettings) {
        this.themeSettings = themeSettings;
        this.bbokProductId = this.themeSettings.ts_join_ss_product_id;
        this.tsApiBaseUrl = this.themeSettings.ts_tsapi_base_url;
        this.api = new TSApi();

        this.init();
    }

    init() {
        switch (document.location.pathname) {
            case JOIN_PAGE:
                this.renderJoin();
                return;
            case KIT_PAGE:
                this.renderKit();
                return;
            case PERSONAL_INFO_PAGE:
                this.renderPersonalInfo();
                return;
            default:
                return;
        }
    }

    renderJoin() {
        console.log('JOIN RENDERED');
        this.$login = document.getElementById('join-login');
        this.removeClassContainer();
        this.toggleFormTabs();
        $('#joinLoginForm').submit(e => this.handleSubmitLogin(e));

        // @TODO: Update this when the new TSAPI comes in
        utils.api.cart.getCart({}, (getCartErr, cart) => {
            if (getCartErr) {
                console.error('utils.api.cart.getCart::error', getCartErr);
                return;
            }

            if (cart) {
                const self = this;
                // Delete existing cart (to get rid of other items)
                // and re-add BBOK item if it's been added before
                this.deleteCart(cart.id)
                    .then(_res => {
                        self.addBBOKItem();
                    })
                    .catch(deleteErr => console.error('storefrontAPI::deleteCart', deleteErr));
            } else {
                // cart is undefined. add BBOK item
                this.addBBOKItem();
            }
        });
    }

    renderKit() {
        this.removeClassContainer();
        $('#kit-page-next').on('click', this.handleKitPageNext);
        console.log('KIT RENDERED');
    }

    renderPersonalInfo() {
        this.$personalInfo = document.getElementById('personal-info');

        this.removeClassContainer();
        //this.styleSelectValue();
        this.toggleCheckboxes();
        this.formatInputFields();
        this.renderFindSponsor();
        this.openTsTermsModal();
        this.closeTsTermsModal();
        this.getTsTermsAndCondition();
        this.goToCheckout();
    }

    /*
     * Join functions
     */

    toggleFormTabs() {
        const checkbox = this.$login.querySelector('#form-toggle');
        const signUp = this.$login.querySelector('#sign-up');
        const login = this.$login.querySelector('#login');
        const firstName = this.$login.querySelector('#firstNameField');
        const lastName = this.$login.querySelector('#lastNameField');
        const password2 = this.$login.querySelector('#password2Field');
        const email2 = this.$login.querySelector('#email2Field');
        const forgotPassword = this.$login.querySelector('.forgot-password');

        checkbox.addEventListener('change', (event) => {
            this.clearErrorMessages();
            if (event.target.checked) {
                JOIN_FORM_TABS.signup = true;
                JOIN_FORM_TABS.login = false;
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
                JOIN_FORM_TABS.signup = false;
                JOIN_FORM_TABS.login = true;
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

    addBBOKItem() {
        const formData = new FormData();
        formData.append('action', 'add');
        formData.append('product_id', this.bbokProductId);
        formData.append('qty[]', '1');

        utils.api.cart.itemAdd(formData, (itemAddErr, _res) => {
            console.log('addbbokitem this', this);
            if (itemAddErr) {
                console.error('utils.api.cart.itemAdd::error', itemAddErr);
            }

            utils.api.cart.getCart({}, (getCartErr, cart) => {
                if (getCartErr) {
                    console.error('utils.api.cart.getCart::error', getCartErr);
                }

                this.setLoginFormId(cart.id);
            });
        });
    }

    setLoginFormId(id = '') {
        $('#joinLoginForm > #Id').val(id);
    }

    handleSubmitLogin(e) {
        e.preventDefault();

        const email1 = $('#EmailAddress').val();
        const email2 = $('#EmailAddress2').val();
        const password1 = $('#Password').val();

        const $loginErrors = $('#loginErrors');
        const emptyFieldsErrorMessage = '<h5>Please make sure all inputs are filled in.</h5>';
        const emailNotMatchErrorMessage = '<h5>Email Addresses Must Match.</h5>';

        const isEmailMatch = email1 === email2;

        if (JOIN_FORM_TABS.login && (email1 === '' || password1 === '')) {
            $loginErrors.append(emptyFieldsErrorMessage);
        } else if (JOIN_FORM_TABS.signup) {
            const emptyFields = $('#joinLoginForm input').filter(function() {
                $.trim($(this).val()).length === 0;
            });

            if (emptyFields.length > 0) {
                $loginErrors.append(emptyFieldsErrorMessage);
            } else if (!isEmailMatch) {
                $loginErrors.append(emailNotMatchErrorMessage);
            } else {
                this.loginSuccess();
            }
        } else {
            this.loginSuccess();
        }
    }

    loginSuccess() {
        localStorage.setItem('isJoin', true);

        // Prevent autoform fillers from causing problems
        if (JOIN_FORM_TABS.login) {
            $('#FirstName').val('');
            $('#LastName').val('');
            $('#EmailAddress2').val('');
            $('#Password2').val('');
        }

      const userInfo = $('#joinLoginForm').serialize();
      $.ajax({
          type: 'POST',
          accepts: 'json',
          url: `${this.tsApiBaseUrl}/join/login`,
          data: userInfo,
          cache: false,
          success: (data) => {
              window.location.href = `${KIT_PAGE}?id=${data.Id}`;
          },
          error: (error) => {
              displayLoginErrorMessage(error);
          },
      });
    }

    /**
    * This function displays an error message on the login form.
    * results found when searching by ID or name. If an error
    * message from Tastefully Simple's API exists, that will display.
    */
    displayLoginErrorMessage(error) {
        if (error.responseJSON.errors) {
            $.each(error.responseJSON.errors, (i) => {
                const errors = error.responseJSON.errors[i];
                const { id, message } = errors;
                $('#loginErrors').append(`
                    <li data-errorid="${id}">${message}</li>
                `);
            });
        } else if (error) {
            $('#loginErrors').append(`
                <h4>${error.responseJSON}</h4>
            `);
        }
    }


    /*
     * Kit functions
     */
    handleKitPageNext() {
        const params = new URLSearchParams(window.location.search);
        if (params.has('id')) {
            const formId = params.get('id');
            let url = `${PERSONAL_INFO_PAGE}?id=${formId}`;

            // if we are here with a link id, we should have passed through step 1 which creates a cart.
            if (params.has('xfid')) {
                const linkId = encodeURIComponent(params.get('xfid'));
                url = `${url}&xfid=${linkId}`;
            }
            console.log("URL", url);
            window.location.href = url;
        } else {
            window.location.href = '/join';
        }
    }

    /*
     * Personal Info functions
     */

    // @TODO: find out what is the purpose of this, I don't currently
    // see the effect when removing the class "empty". Then rename the
    // function
    // This function will change value styling once a value is selected.
    styleSelectValue() {
        const $dates = this.$personalInfo.querySelectorAll('[type="date"]');
        const $selectors = this.$personalInfo.querySelectorAll('[type="select"]');

        // @TODO: put this function outside of styleSelectValue
        function addChangeHandler(elementArray) {
            elementArray.forEach((element) => {
                element.addEventListener('change', () => {
                    element.classList.remove('empty');
                });
            });
        }
        if ($dates) { addChangeHandler(dates); }
        if ($selectors) { addChangeHandler(selectors); }
    }

    togglePrimaryPhoneCheckbox() {
        const $phoneCheckbox = this.$personalInfo.querySelector('#MobilePhoneCheckbox');
        const $primaryPhone = this.$personalInfo.querySelector('#PrimaryPhone');
        const $primaryPhoneDiv = this.$personalInfo.querySelector('#primaryPhoneField');

        $phoneCheckbox.addEventListener('change', (event) => {
            if (!event.target.checked) {
                $primaryPhoneDiv.classList.remove('disabled');
                $primaryPhone.removeAttribute('disabled');
            } else {
                $('#primaryPhone').val('');
                $primaryPhoneDiv.classList.add('disabled');
                $primaryPhone.setAttribute('disabled', 'disabled');
            }
        });
    }

    toggleTextOptInCheckbox() {
        const $optInText = this.$personalInfo.querySelector('#OptInText');

        $optInText.addEventListener('change', () => {
            if (OptInText.checked === true) {
                document.getElementById('OptInText').checked = true;
            } else {
                document.getElementById('OptInText').checked = false;
            }
        });
    }

    toggleShippingCheckbox() {
        const addressCheckbox = this.$personalInfo.querySelector('#AddressCheckbox');
        const shippingFieldset = this.$personalInfo.querySelector('#shipping-address');

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

    toggleTsCashOtherCheckbox() {
        const $cashOption = this.$personalInfo.querySelector('#TsCashOption');
        const $otherField = this.$personalInfo.querySelector('#tsCashOptionTextField');

        $cashOption.addEventListener('change', () => {
            const strCashOption = $cashOption.options[$cashOption.selectedIndex].text;
            if (strCashOption === 'Other:') {
                $otherField.classList.remove('hidden');
            } else {
                $otherField.classList.add('hidden');
            }
        });
    }

    openTsTermsModal() {
        const $termsModal = this.$personalInfo.querySelector('#terms-modal');
        const $modalLink = this.$personalInfo.querySelector('#openTermsModal');

        $modalLink.addEventListener('click', (event) => {
            event.preventDefault();
            $termsModal.classList.add('modal-overlay--active');
        });
    }

    closeTsTermsModal() {
        const $termsModal = this.$personalInfo.querySelector('#terms-modal');
        const $closeIcons = this.$personalInfo.querySelectorAll('.terms-close');

        $closeIcons.forEach(($closeIcon) => {
            $closeIcon.addEventListener('click', () => {
                $termsModal.classList.remove('modal-overlay--active');
            });
        });
    }

    getTsTermsAndCondition() {
        $.ajax({
            type: 'GET',
            accepts: 'json',
            url: `${this.tsApiBaseUrl}/join/tc`,
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
    }

    toggleTermsCheckbox() {
        const $visibleCheckbox = this.$personalInfo.querySelector('#TermsCheckboxVisible');
        const $termsConditionsOptIn = this.$personalInfo.querySelector('#TermsConditionsOptIn');
        console.log("TERMS CONDITION", $termsConditionsOptIn);

        $visibleCheckbox.addEventListener('change', () => {
            if ($visibleCheckbox.checked === true) {
                $termsConditionsOptIn.checked = true;
            } else {
                $termsConditionsOptIn.checked = false;
            }
        });
    }

    goToCheckout() {
        this.validateCheckout();
        const $checkoutButton = this.$personalInfo.querySelector('#checkout');

        $checkoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.setSubmissionDefaults();
            this.clearErrorMessages();
            localStorage.setItem('isJoin', true);
            const $form = $('#frmJoinPersonalInfo');
            const disabled = $form.find(':input:disabled').removeAttr('disabled');
            const serialized = $form.serialize();
            disabled.attr('disabled', 'disabled');

            const $consultantCard = $('.consultant-card.selected');
            const cid = $consultantCard.data('cid') || null;
            const afid = $consultantCard.data('afid') || null;
            const name = $consultantCard.data('name') || null;

            TSCookie.setConsultantId(cid);
            TSCookie.setConsultantName(name);
            TSCookie.setAffiliateId(afid);

            const self = this;
            $.ajax({
                type: 'POST',
                url: `${this.tsApiBaseUrl}/join/user`,
                data: serialized,
                cache: true,
                success: () => {
                    window.location.href = '/checkout.php';
                },
                error: (error) => {
                    self.displayErrorMessage(error);
                },
            });
        });
    }

    /**
    * This function will grab the BigCommerce unique ID that is passed from the join/login page
    * and use it to validate the form submission to Tastefully Simple's endpoint.
    */
    validateCheckout() {
        const params = new URLSearchParams(window.location.search);

        if (params.has('id')) {
            this.setPersonalInfoFormId(params.get('id'));
        } else {
            window.location.href = '/join';
        }
    }

    setPersonalInfoFormId(id = '') {
        $('#frmJoinPersonalInfo > #Id').val(id);
    }

    setSubmissionDefaults() {
        if (this.$personalInfo.querySelector('#MobilePhoneCheckbox').checked) {
            const $cellPhone = this.$personalInfo.querySelector('#CellPhone');

            if ($cellPhone.value) {
                this.$personalInfo.querySelector('#PrimaryPhone').value = $cellPhone.value;
            }
        }

        if (this.$personalInfo.querySelector('#AddressCheckbox').checked) {
            const $billingLine1 = this.$personalInfo.querySelector('#BillingAddressLine1');
            const $billingLine2 = this.$personalInfo.querySelector('#BillingAddressLine2');
            const $billingCity = this.personalInfo.querySelector('#BillingCity');
            const $billingState = this.$personalInfo.querySelector('#BillingState');
            const $billingZip = this.$personalInfo.querySelector('#BillingZip');

            if ($billingLine1.value) {
                this.$personalInfo.querySelector('#ShippingAddressLine1').value = $billingLine1.value;
            }

            if (value) {
                this.$personalInfo.querySelector('#ShippingAddressLine2').value = $billingLine2.value;
            }

            if ($billingCity.value) {
                this.$personalInfo.querySelector('#ShippingCity').value = $billingCity.value;
            }

            if ($billingState.value) {
                this.personalInfo.querySelector('#ShippingState').value = $billingState.value;
            }

            if ($billingZip.value) {
                this.personalInfo.querySelector('#ShippingZip').value = $billingZip.value;
            }
        }

        const $birthDate = this.$personalInfo.querySelector('#BirthDate');

        if ($birthDate.value) {
            let DOB = new Date($birthDate.value);
            DOB = new Date(DOB.getTime() + Math.abs(DOB.getTimezoneOffset() * 60000));
            const month = (String(DOB.getMonth() + 1)).length > 1 ? (DOB.getMonth() + 1) : `0${(DOB.getMonth() + 1)}`;
            const day = (String(DOB.getDate()).length > 1) ? (DOB.getDate()) : `0${(DOB.getDate())}`;
            const year = DOB.getFullYear();
            DOB = `${month}/${day}/${year}`;
            this.$personalInfo.querySelector('DateOfBirth').value = DOB;
        } else {
            this.$personalInfo.querySelector('DateOfBirth').value = '';
        }
    }

    displayPersonalInfoErrorMessage(error) {
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

    /**
     * Personal info - Sponsor search
     */
    renderFindSponsor() {
        this.sponsorSearchParams = {
            consultantId: null,
            consultantName: null,
            consultantZipCode: null,
        };

        this.defaultSponsorData = {
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

        this.sponsorStateLocation = '';

        $('#consultantSearchForm').on('change', () => this.handleSponsorSearchFormChange(event));
        $('#btnConsIdSearch').on('click', (e) => this.searchSponsorById(e));
        $('#btnConsNameSearch').on('click', (e) => this.searchSponsorByName(e));
        $('#btnConsZipSearch').on('click', (e) => this.searchSponsorByZip(e));
    }

    handleSponsorSearchFormChange(e, event) {
        const target = e.target;
        if (e.srcElement.form.id === 'consultantSearchForm'
            && target.name !== 'ConsultantState'
            && target.name !== 'TermsCheckboxVisible'
            && target.name !== 'openTermsModal') {
            this.sponsorSearchParams[target.name] = target.value;
        } else if (target.name === 'ConsultantState') {
            this.sponsorStateLocation = target.value;
        }
    }

    searchSponsorById(e) {
        this.clearErrorMessages();
        this.removeEventHandlers();
        if (($('#txtConsultantID').val()) === '') {
            $('#sponsorSearchData').empty();
            e.preventDefault();
            $('#sponsorSearchData').append('Please enter a valid ID in the text box.');
        } else {
            e.preventDefault();
            $('#sponsorSearchData').empty();
            $('#txtConsultantName').val('');
            $('#txtZipCode').val('');
            const apiParams = `cid/${this.sponsorSearchParams.consultantId}`;
            console.log("API PARAMS", this.sponsorSearchParams);
            this.getSponsorById(apiParams);
        }
    }

    searchSponsorByName(e) {
        this.clearErrorMessages();
        this.removeEventHandlers();
        if (($('#txtConsultantName').val()) === ''
            || (($('#ConsultantState').val()) === '')) {
            $('#sponsorSearchData').empty();
            e.preventDefault();
            $('#sponsorSearchData').append('Please enter a name in the text box and select a state');
        } else {
            e.preventDefault();
            $('#sponsorSearchData').empty();
            $('#txtConsultantID').val('');
            $('#txtZipCode').val('');
            const apiParams = `name/${this.sponsorSearchParams.consultantName}/${this.sponsorStateLocation}/1`;
            this.getSponsorByName(apiParams);
        }
    }

    searchSponsorByZip(e) {
        this.clearErrorMessages();
        this.removeEventHandlers();
        if (($('#txtZipCode').val()) === '') {
            $('#sponsorSearchData').empty();
            e.preventDefault();
            $('#sponsorSearchData').append('Please enter a zip code in the text box.');
        } else {
            e.preventDefault();
            $('#sponsorSearchData').empty();
            $('#txtConsultantID').val('');
            $('#txtConsultantName').val('');
            const apiParams = `zip/${this.sponsorSearchParams.consultantZipCode}/200/1`;
            this.getSponsorByZip(apiParams);
        }
    }

    getSponsorById(apiParams) {
        const self = this;
        $.ajax({
            type: 'GET',
            accepts: 'json',
            url: `${self.tsApiBaseUrl}/search/join/${apiParams}`,
            success: (data) => {
                if (data.Results !== null) {
                    console.log("DATA", data);
                    self.renderSponsorResult(data);
                }
            },
            error: (err) => {
                const statusCode = err.status.toString();
                if (statusCode[0] === '5') {
                    self.renderSponsorErrorMessage();
                } else {
                    self.sponsorOptedOutErrorMessage();
                }
            },
        });
    }

    getSponsorByName(apiParams) {
        const self = this;
        $.ajax({
            type: 'GET',
            accepts: 'json',
            url: `${self.tsApiBaseUrl}/search/join/${apiParams}`,
            success: (data) => {
                if (data.Results !== null) {
                    self.renderSponsorResult(data);
                }
            },
            error: (err) => {
                const statusCode = err.status.toString();
                if (statusCode[0] === '5') {
                    self.renderSponsorErrorMessage();
                } else {
                    self.sponsorOptedOutErrorMessage();
                }
            },
        });
    }

    getSponsorByZip(apiParams) {
        const self = this;
        $.ajax({
            type: 'GET',
            accepts: 'json',
            url: `${self.tsApiBaseUrl}/search/join/${apiParams}`,
            success: (data) => {
                if (data.Results !== null) {
                    self.renderSponsorResult(data);
                }
            },
            error: (err) => {
                const statusCode = err.status.toString();
                if (statusCode[0] === '5') {
                    self.renderSponsorErrorMessage();
                } else {
                    document.getElementById('divTsConsFound').style.display = 'block';
                    self.renderSponsorResult(self.defaultSponsorData);
                }
            },
        });
    }

    renderSponsorResult(data) {
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
                console.log("THISSPONSOR", this);
                this.selectSponsor(e);
            });
        });
    }

    selectSponsor(e) {
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

    renderSponsorErrorMessage() {
        const $responseWrapper = $('#sponsorSearchData');
        $responseWrapper.addClass('sponsor-result--error');
        $responseWrapper.append('<p>An error has occurred.</p>');
    }

    sponsorOptedOutErrorMessage() {
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

    /**
     * Common
     */

    deleteCart(cartId) {
        return fetch(`/api/storefront/carts/${cartId}`, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * This function will remove the container class on the page wrapper for join pages.
     * This is to allow full width banner.
     */
    removeClassContainer() {
        document.getElementById('page-wrapper').classList.remove('container');
    }

    clearErrorMessages() {
        $('#formErrorMessages').html('');
        $('#loginErrors').html('');
        // from /tell-us-about-yourself
        if (document.getElementById('divTsConsFound')) {
            document.getElementById('divTsConsFound').style.display = 'none';
        }
        // from /tell-us-about-yourself
        if (document.getElementById('sponsorSearchData')) {
            document.getElementById('sponsorSearchData').style.border = '';
        }
    }

    /**
     * This function is only being called in Personal info page for now.
     * Placed it in /common/ because of its general function name
     * and can be reused on other pages
     */
    formatInputFields() {
        const $cellPhone = document.getElementById('CellPhone');
        $cellPhone.addEventListener('keydown', (e) =>this.enforceFormat(e));
        $cellPhone.addEventListener('keyup', (e) => this.formatToPhone(e));

        const $primaryPhone = document.getElementById('PrimaryPhone');
        $primaryPhone.addEventListener('keydown', (e) => this.enforceFormat(e));
        $primaryPhone.addEventListener('keyup', (e) => this.formatToPhone(e));

        const $ssn = document.getElementById('SSN');
        $ssn.addEventListener('keydown', (e) => this.enforceFormat(e));
        $ssn.addEventListener('keyup', (e) => this.formatToSSN(e));
    }

    /**
     * This function is only being called in Personal info page for now.
     * Placed it in /common/ because of its general function name
     * and can be reused on other pages
     */
    toggleCheckboxes() {
        this.togglePrimaryPhoneCheckbox();
        this.toggleTextOptInCheckbox();
        this.toggleShippingCheckbox();
        this.toggleTsCashOtherCheckbox();
        this.toggleTermsCheckbox();
    }

    enforceFormat(e) {
        // Input must be of a valid number format or a modifier key, and not longer than ten digits
        if (!isNumericInput(e) && !this.isModifierKey(e)) {
            e.preventDefault();
        }
    }

    formatToPhone(e) {
        if (this.isModifierKey(e)) {
            return;
        }

        const target = e.target;
        const input = target.value.replace(/\D/g, '').substring(0, 10); // First ten digits of input only
        target.value = formatToPhoneSub(input);
    }

    formatToSSN(e) {
        if (this.isModifierKey(e)) {
            return;
        }

        const target = e.target;
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
    }

    isNumericInput(e) {
        const key = e.keyCode;
        return ((key >= 48 && key <= 57) || // Allow number line
            (key >= 96 && key <= 105) // Allow number pad
        );
    }

    isModifierKey(e) {
        const key = e.keyCode;
        return (e.shiftKey === true || key === 35 || key === 36) || // Allow Shift, Home, End
            (key === 8 || key === 9 || key === 13 || key === 46) || // Allow Backspace, Tab, Enter, Delete
            (key > 36 && key < 41) || // Allow left, up, right, down
            (
                // Allow Ctrl/Command + A,C,V,X,Z
                (e.ctrlKey === true || e.metaKey === true) &&
                (key === 65 || key === 67 || key === 86 || key === 88 || key === 90)
            );
    }

    removeEventHandlers() {
        // TST-207
        // Remove click event so that when clicking the search button
        // in Find a Sponsor, selectConsultant() would not be called
        // multiple times
        $('body').off('click', '#sponsorSearchData .consultant-card');
    }
}

export default function(themeSettings) {
    $(document).ready(() => {
        const joinProcess = new TSJoinProcess(themeSettings);

        return joinProcess;
    });
}
