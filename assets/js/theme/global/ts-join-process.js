import utils from '@bigcommerce/stencil-utils';
import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';
import ConsultantCard from '../common/consultant-card';
import JoinKitContentCard from '../common/join-kit-content-card';

const JOIN_PAGE = '/join';
const KIT_PAGE = '/join-kit/';
const PERSONAL_INFO_PAGE = '/tell-us-about-yourself/';

// Indicate which tab to be displayed in the join form
const JOIN_FORM_TABS = {
    login: true,
    signup: false,
};

/**
 * To store the kit included items when
 * join-kit-content-card template is loaded
 * for faster loading after it loads the
 * template for the first time
 */
const KIT_CONTENT = {
    'bbok-0': null,
    'bbok-1': null,
};

class TSJoinProcess {
    constructor(themeSettings) {
        this.themeSettings = themeSettings;
        this.bbokProductId = this.themeSettings.ts_join_ss_product_id;
        this.bbokProducts = this.themeSettings.ts_join_kits;
        this.tsApiBaseUrl = this.themeSettings.ts_tsapi_base_url;
        this.kitContent = this.themeSettings.ts_join_kit_content;
        this.api = new TSApi();

        this.init();
    }

    init() {
        switch (document.location.pathname) {
            case JOIN_PAGE:
                this.renderJoin();
                break;
            case KIT_PAGE:
                this.renderKit();
                break;
            case PERSONAL_INFO_PAGE:
                this.renderPersonalInfo();
                break;
            default:
                break;
        }
    }

    renderJoin() {
        this.$login = document.getElementById('join-login');
        this.removeClassContainer();
        this.toggleFormTabs();
        $('#joinLoginForm').submit(e => this.handleSubmitLogin(e));
    }

    renderKit() {
        if (this.getUrlIdentifier()) {
            this.removeClassContainer();

            // Auto-select the first BBOK
            const bbok0 = 'bbok-0';
            const $kitCard = $(`.kit-card[data-bbok-product="${bbok0}"]`);
            this.selectedKitId = $kitCard.data('product-id');
            $kitCard.addClass('selected');
            $kitCard.find('.kit-card-header').hide();
            this.showKitContent(bbok0);

            $('body').on('click', '.kit-card', (e) => this.selectKit(e));
            $('.kit-continue-btn').on('click', () => this.continueWithKitSelection());
        } else {
            window.location.href = JOIN_PAGE;
        }
    }

    renderPersonalInfo() {
        if (this.getUrlIdentifier()) {
            this.$personalInfo = document.getElementById('personal-info');

            this.removeClassContainer();
            this.changeSelectValueStyling();
            this.toggleCheckboxes();
            this.formatInputFields();
            this.renderFindSponsor();
            this.openJoinTermsModal();
            this.closeJoinTermsModal();

            $('#checkout').on('click', (e) => this.goToCheckout(e));
        } else {
            window.location.href = JOIN_PAGE;
        }
    }

    /**
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

        checkbox.addEventListener('change', (e) => {
            this.clearErrorMessages();
            if (e.target.checked) {
                JOIN_FORM_TABS.signup = true;
                JOIN_FORM_TABS.login = false;
                login.classList.remove('active');
                signUp.classList.add('active');
                firstName.classList.remove('hidden');
                lastName.classList.remove('hidden');
                password2.classList.remove('hidden');
                email2.classList.remove('hidden');
                password2.querySelector('#Password2').setAttribute('tabindex', 0);
                email2.querySelector('#Email2').setAttribute('tabindex', 0);
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
                email2.querySelector('#Email2').setAttribute('tabindex', -1);
                forgotPassword.style.display = 'block';
            }
        });
    }

    handleSubmitLogin(e) {
        e.preventDefault();
        this.clearErrorMessages();

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
            const emptyFields = $('#joinLoginForm input').filter(function fn() {
                return $.trim($(this).val()).length === 0;
            });

            if (emptyFields.length > 0) {
                $loginErrors.append(emptyFieldsErrorMessage);
            } else if (!isEmailMatch) {
                $loginErrors.append(emailNotMatchErrorMessage);
            } else {
                this.signupSuccess();
            }
        } else {
            this.loginSuccess();
        }
    }

    loginSuccess() {
        $('#FirstName').val('');
        $('#LastName').val('');
        $('#EmailAddress2').val('');
        $('#Password2').val('');

        const userInfo = $('#joinLoginForm').serialize();
        this.api.joinLogin(userInfo)
            .done(data => {
                if (data.Success) {
                    localStorage.setItem('isJoin', true);
                    window.location.href = `${KIT_PAGE}?email=${data.Email}`;
                } else {
                    this.displayLoginErrorMessage(data);
                }
            })
            .fail(error => this.displayLoginErrorMessage(error));
    }

    signupSuccess() {
        const userInfo = $('#joinLoginForm').serialize();
        this.api.createJoinSession(userInfo)
            .done(data => {
                if (data.Success) {
                    localStorage.setItem('isJoin', true);
                    window.location.href = `${KIT_PAGE}?email=${data.Email}`;
                } else {
                    this.displayLoginErrorMessage(data);
                }
            })
            .fail(error => this.displayLoginErrorMessage(error));
    }

    /**
    * This function displays an error message on the login form.
    * results found when searching by ID or name. If an error
    * message from Tastefully Simple's API exists, that will display.
    */
    displayLoginErrorMessage(error) {
        if (error.errors) {
            const { id, message } = error.errors[0];
            $('#loginErrors').append(`
                <li data-errorid="${id}">${message}</h4>
            `);
        } else if (error.responseJSON.errors) {
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

    /**
     * Kit functions
     */

    selectKit(e) {
        const $kitCard = $(e.target).closest('.kit-card');

        $('.kit-card-header').show();

        this.selectedKitId = $kitCard.data('product-id');
        $('.selected').toggleClass('selected');
        $kitCard.find('.kit-card-header').hide();
        $('.kit-includes').empty();
        this.showKitContent($kitCard.data('bbok-product'));

        $(e.target).closest('.kit-card').toggleClass('selected');
    }

    showKitContent(selectedKit) {
        const kitContent = this.kitContent[selectedKit];

        const kitName = kitContent.name;
        const kitDescription = kitContent.description;
        $('.kit-content .bbok-title').html(kitName);
        $('.kit-content .bbok-description').html(kitDescription);

        const $itemsIncludedCol1 = $('<div>', { class: 'items-included-col' });
        const $itemsIncludedCol2 = $('<div>', { class: 'items-included-col' });
        $('.kit-includes').append($itemsIncludedCol1);
        $('.kit-includes').append($itemsIncludedCol2);

        const itemsIncludedCol1 = kitContent.items_included.col_1;
        const itemsIncludedCol2 = kitContent.items_included.col_2;

        if (KIT_CONTENT[selectedKit]) {
            $itemsIncludedCol1.append(KIT_CONTENT[selectedKit].col_1);
            $itemsIncludedCol2.append(KIT_CONTENT[selectedKit].col_2);
        } else {
            const joinKitContentCard = new JoinKitContentCard();
            joinKitContentCard.getTemplate()
                .then((template) => {
                    const cards1 = itemsIncludedCol1.map(item => {
                        const card = joinKitContentCard.insertCard(template, item);
                        $itemsIncludedCol1.append(card);
                        return card;
                    });
                    const cards2 = itemsIncludedCol2.map(item => {
                        const card = joinKitContentCard.insertCard(template, item);
                        $itemsIncludedCol2.append(card);
                        return card;
                    });

                    const cards = { col_1: cards1, col_2: cards2 };
                    KIT_CONTENT[selectedKit] = cards;
                });
        }

        $('.kit-content').show();
    }

    continueWithKitSelection() {
        // Add selected kit to cart
        if (this.selectedKitId) {
            // Store selectedKitId cookie to track which kit was selected
            // in join kit cart abandonment
            TSCookie.setSelectedKitId(this.selectedKitId);

            utils.api.cart.getCart({}, (getCartErr, cart) => {
                if (getCartErr) {
                    console.error('utils.api.cart.getCart::error', getCartErr);
                    return;
                }

                if (cart) {
                    // Delete existing cart (to get rid of other items)
                    // and re-add kit if it's been added before
                    this.deleteCart(cart.id)
                        .then(_res => {
                            this.addSelectedKitToCart();
                        })
                        .catch(deleteErr => console.error('storefrontAPI::deleteCart', deleteErr));
                } else {
                    // Cart is undefined, add kit
                    this.addSelectedKitToCart();
                }
            });
        } else {
            console.error('NO KIT SELECTED', this.selectedKitId);
        }
    }

    addSelectedKitToCart() {
        const formData = new FormData();
        formData.append('action', 'add');
        formData.append('product_id', this.selectedKitId);
        formData.append('qty[]', '1');

        utils.api.cart.itemAdd(formData, (itemAddErr, _res) => {
            if (itemAddErr) {
                console.error('utils.api.cart.itemAdd::error', itemAddErr);
            }

            utils.api.cart.getCart({}, (getCartErr, cart) => {
                if (getCartErr) {
                    console.error('utils.api.cart.getCart::error', getCartErr);
                }

                const selectedKit = cart.lineItems.physicalItems[0];
                const userInfo = {
                    cartId: cart.id,
                    kitSku: selectedKit.sku,
                };

                this.api.updateJoinSession(userInfo, this.getUrlIdentifier())
                    .done(() => {
                        const url = `${PERSONAL_INFO_PAGE}?email=${this.getUrlIdentifier()}&id=${cart.id}`;
                        window.location.href = url;
                    })
                    .fail(error => {
                        console.error('TSApi::updateJoinSession()', error);
                    });
            });
        });
    }

    /**
     * Personal Info functions
     */

    /**
     * This function will change value styling once a value is selected and
     * handles display issues on apple devices.
     */
    changeSelectValueStyling() {
        const dates = this.$personalInfo.querySelectorAll('[type="date"]');
        const selectors = this.$personalInfo.querySelectorAll('[type="select"]');

        const addChangeHandler = (elementArray) => {
            elementArray.forEach((element) => {
                element.addEventListener('change', () => {
                    element.classList.remove('empty');
                });
            });
        };

        if (dates) { addChangeHandler(dates); }
        if (selectors) { addChangeHandler(selectors); }
    }

    togglePrimaryPhoneCheckbox() {
        const $phoneCheckbox = this.$personalInfo.querySelector('#PhoneIsMobile');
        const $primaryPhone = this.$personalInfo.querySelector('#PrimaryPhone');
        const $primaryPhoneDiv = this.$personalInfo.querySelector('#primaryPhoneField');

        $phoneCheckbox.addEventListener('change', (e) => {
            if (!e.target.checked) {
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
        const $optInText = this.$personalInfo.querySelector('#SmsOptIn');

        $optInText.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.getElementById('SmsOptIn').checked = true;
            } else {
                document.getElementById('SmsOptIn').checked = false;
            }
        });
    }

    toggleShippingCheckbox() {
        const addressCheckbox = this.$personalInfo.querySelector('#AddressCheckbox');
        const shippingFieldset = this.$personalInfo.querySelector('#shipping-address');

        addressCheckbox.addEventListener('change', (e) => {
            if (!e.target.checked) {
                shippingFieldset.classList.remove('hidden');
            } else {
                $('#shipping-address input').val('');
                $('#ShippingState option:first').attr('selected', true);
                shippingFieldset.classList.add('hidden');
            }
        });
    }

    toggleTsCashOtherCheckbox() {
        const $cashOption = this.$personalInfo.querySelector('#CashOption');
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

    openJoinTermsModal() {
        const $termsModal = this.$personalInfo.querySelector('#terms-modal');
        const $modalLink = this.$personalInfo.querySelector('#openTermsModal');

        this.getJoinTermsAndConditions();

        $modalLink.addEventListener('click', (e) => {
            e.preventDefault();
            $termsModal.classList.add('modal-overlay--active');
        });
    }

    closeJoinTermsModal() {
        const $termsModal = this.$personalInfo.querySelector('#terms-modal');
        const $closeIcons = this.$personalInfo.querySelectorAll('.terms-close');

        $closeIcons.forEach(($closeIcon) => {
            $closeIcon.addEventListener('click', () => {
                $termsModal.classList.remove('modal-overlay--active');
            });
        });
    }

    getJoinTermsAndConditions() {
        this.api.getJoinTermsAndConditions()
            .done(data => {
                if (data !== null) {
                    document.getElementById('TermsVersion').value = data.Version;
                    $('#terms-conditions').append(`
                        <div>${data.HtmlMarkup}</div>
                    `);
                }
            })
            .fail(() => {
                $('#terms-conditions-backup').removeClass('hidden');
            });
    }

    toggleTermsCheckbox() {
        const $visibleCheckbox = this.$personalInfo.querySelector('#TermsCheckboxVisible');
        const $termsConditionsOptIn = this.$personalInfo.querySelector('#TermsOptIn');

        $visibleCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                $termsConditionsOptIn.checked = true;
            } else {
                $termsConditionsOptIn.checked = false;
            }
        });
    }

    goToCheckout(e) {
        e.preventDefault();

        this.setSubmissionDefaults();
        this.clearErrorMessages();
        localStorage.setItem('isJoin', true);
        const $form = $('#frmJoinPersonalInfo');
        // Insert URL identifier to #Id input field
        $($form).find('#CartId').val(this.getUrlCartIdentifier());
        const disabled = $form.find(':input:disabled').removeAttr('disabled');
        const userInfo = $form.serialize();
        disabled.attr('disabled', 'disabled');

        const $consultantCard = $('.consultant-card.selected');
        const cid = $consultantCard.data('cid') || null;
        const afid = $consultantCard.data('afid') || null;
        const name = $consultantCard.data('name') || null;

        this.api.updateJoinSession(userInfo, this.getUrlIdentifier())
            .done(() => {
                TSCookie.setConsultantId(cid);
                TSCookie.setConsultantName(name);
                TSCookie.setAffiliateId(afid);

                window.location.href = '/checkout.php';
            })
            .fail(error => this.displayCheckoutErrorMessage(error));
    }

    setSubmissionDefaults() {
        if (this.$personalInfo.querySelector('#PhoneIsMobile').checked) {
            const $cellPhone = this.$personalInfo.querySelector('#Phone');

            if ($cellPhone.value) {
                this.$personalInfo.querySelector('#PrimaryPhone').value = $cellPhone.value;
            }
        }

        if (this.$personalInfo.querySelector('#AddressCheckbox').checked) {
            const $billingLine1 = this.$personalInfo.querySelector('#BillingStreet1');
            const $billingLine2 = this.$personalInfo.querySelector('#BillingStreet2');
            const $billingCity = this.$personalInfo.querySelector('#BillingCity');
            const $billingState = this.$personalInfo.querySelector('#BillingState');
            const $billingZip = this.$personalInfo.querySelector('#BillingZip');

            if ($billingLine1.value) {
                this.$personalInfo.querySelector('#ShippingStreet1').value = $billingLine1.value;
            }

            if ($billingLine2.value) {
                this.$personalInfo.querySelector('#ShippingStreet2').value = $billingLine2.value;
            }

            if ($billingCity.value) {
                this.$personalInfo.querySelector('#ShippingCity').value = $billingCity.value;
            }

            if ($billingState.value) {
                this.$personalInfo.querySelector('#ShippingState').value = $billingState.value;
            }

            if ($billingZip.value) {
                this.$personalInfo.querySelector('#ShippingZip').value = $billingZip.value;
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
            this.$personalInfo.querySelector('#Birthday').value = DOB;
        } else {
            this.$personalInfo.querySelector('#Birthday').value = '';
        }
    }

    displayCheckoutErrorMessage(error) {
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
                if (id === 'ConsultantId' && $('#sponsorSearchData').children.length > 0) {
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

    handleSponsorSearchFormChange(e, _event) {
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
            this.getSponsor(apiParams);
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
            this.getSponsor(apiParams);
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

    /**
     * Get Sponsor by ID or Name
     */
    getSponsor(apiParams) {
        this.api.getSponsor(apiParams)
            .done(data => {
                if (data.Results !== null) {
                    this.renderSponsorResult(data);
                }
            })
            .fail(error => {
                if (error.status >= 500 && error.status < 600) {
                    this.renderSponsorErrorMessage();
                } else {
                    this.sponsorOptedOutErrorMessage();
                }
            });
    }

    getSponsorByZip(apiParams) {
        this.api.getSponsor(apiParams)
            .done(data => {
                if (data.Results !== null) {
                    this.renderSponsorResult(data);
                }
            })
            .fail(error => {
                if (error.status >= 500 && error.status < 600) {
                    this.renderSponsorErrorMessage();
                } else {
                    document.getElementById('divTsConsFound').style.display = 'block';
                    this.renderSponsorResult(this.defaultSponsorData);
                }
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
            $('#ConsultantId').val(cid);
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

    /**
     * This function is used in Kit page and Personal Info page
     * to fetch the email URL Identifier
     */
    getUrlIdentifier() {
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.get('email') !== 'undefined') {
            return urlParams.get('email');
        }
    }

    getUrlCartIdentifier() {
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.get('id') !== 'undefined') {
            return urlParams.get('id');
        }
    }

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
        const $cellPhone = document.getElementById('Phone');
        $cellPhone.addEventListener('keydown', (e) => this.enforceFormat(e));
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
        if (!this.isNumericInput(e) && !this.isModifierKey(e)) {
            e.preventDefault();
        }
    }

    formatToPhone(e) {
        if (this.isModifierKey(e)) {
            return;
        }

        const target = e.target;
        const input = target.value.replace(/\D/g, '').substring(0, 10); // First ten digits of input only
        target.value = this.formatToPhoneSub(input);
    }

    formatToPhoneSub(inputValue) {
        const input = inputValue.replace(/\D/g, '').substring(0, 10); // First ten digits of input only
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
        return inputValue;
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

export default function (themeSettings) {
    $(document).ready(() => {
        const joinProcess = new TSJoinProcess(themeSettings);

        return joinProcess;
    });
}
