import Account from './account';
import nod from './common/nod';
import validation from './common/form-validation';
import { classifyForm, Validators, insertStateHiddenField, createPasswordValidationErrorTextObject } from './common/utils/form-utils';

export default class AccountOverride extends Account {

    registerEditAccountValidation($editAccountForm) {
        const validationModel = validation($editAccountForm, this.context);
        const formEditSelector = 'form[data-edit-account-form]';
        const editValidator = nod({
            submit: '${formEditSelector} input[type="submit"]',
        });
        const emailSelector = `${formEditSelector} [data-field-type="EmailAddress"]`;
        const $emailElement = $(emailSelector);
        const passwordSelector = `${formEditSelector} [data-field-type="Password"]`;
        const $passwordElement = $(passwordSelector);
        const password2Selector = `${formEditSelector} [data-field-type="ConfirmPassword"]`;
        const $password2Element = $(password2Selector);
        const currentPasswordSelector = `${formEditSelector} [data-field-type="CurrentPassword"]`;
        const $currentPassword = $(currentPasswordSelector);
        const phoneNumberSelector = '#account_phone';
        const $phoneNumberElement = $(phoneNumberSelector);

        // This only handles the custom fields, standard fields are added below
        editValidator.add(validationModel);

        // Form validation on Account Edit page where a user attempts to enter all zeroes (000-000-0000)
        if ($phoneNumberElement) {
            editValidator.add({
                selector: phoneNumberSelector,
                validate: (cb, val) => {
                    let result = true;

                    if (val === '000-000-0000') {
                        result = false;
                    }

                    cb(result);
                },
                errorMessage: this.context.phoneNumberZeroes,
            });
        }

        if ($emailElement) {
            editValidator.remove(emailSelector);
            /* @razoyo - TST-1060 - Removes email validation on acct creation page (we are using debounce for this now) */
            //Validators.setEmailValidation(editValidator, emailSelector, this.validationDictionary.valid_email);
        }

        if ($passwordElement && $password2Element) {
            const { password: enterPassword, password_match: matchPassword, invalid_password: invalidPassword } = this.validationDictionary;
            editValidator.remove(passwordSelector);
            editValidator.remove(password2Selector);
            Validators.setPasswordValidation(
                editValidator,
                passwordSelector,
                password2Selector,
                this.passwordRequirements,
                createPasswordValidationErrorTextObject(enterPassword, enterPassword, matchPassword, invalidPassword),
                true,
            );
        }

        if ($currentPassword) {
            editValidator.add({
                selector: currentPasswordSelector,
                validate: (cb, val) => {
                    let result = true;

                    if (val === '' && $passwordElement.val() !== '') {
                        result = false;
                    }

                    cb(result);
                },
                errorMessage: this.context.currentPassword,
            });
        }

        editValidator.add([
            {
                selector: `${formEditSelector} input[name='account_firstname']`,
                validate: (cb, val) => {
                    const result = val.length;

                    cb(result);
                },
                errorMessage: this.context.firstName,
            },
            {
                selector: `${formEditSelector} input[name='account_lastname']`,
                validate: (cb, val) => {
                    const result = val.length;

                    cb(result);
                },
                errorMessage: this.context.lastName,
            },
        ]);

        $editAccountForm.on('submit', event => {
            editValidator.performCheck();

            if (editValidator.areAll('valid')) {
                return;
            }

            event.preventDefault();
        });
    }
}
