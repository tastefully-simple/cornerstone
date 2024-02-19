import Auth from './auth';
import stateCountry from './common/state-country';
import nod from './common/nod';
import validation from './common/form-validation';
import { classifyForm, Validators, createPasswordValidationErrorTextObject } from './common/utils/form-utils';
import { createTranslationDictionary } from './common/utils/translations-utils';

export default class AuthOverride extends Auth {


    registerCreateAccountValidator($createAccountForm) {
        const validationModel = validation($createAccountForm, this.context);
        const createAccountValidator = nod({
            submit: `${this.formCreateSelector} input[type='submit']`,
        });
        const $stateElement = $('[data-field-type="State"]');
        const emailSelector = `${this.formCreateSelector} [data-field-type='EmailAddress']`;
        const $emailElement = $(emailSelector);
        const passwordSelector = `${this.formCreateSelector} [data-field-type='Password']`;
        const $passwordElement = $(passwordSelector);
        const password2Selector = `${this.formCreateSelector} [data-field-type='ConfirmPassword']`;
        const $password2Element = $(password2Selector);

        createAccountValidator.add(validationModel);

        if ($stateElement) {
            let $last;

            // Requests the states for a country with AJAX
            stateCountry($stateElement, this.context, (err, field) => {
                if (err) {
                    throw new Error(err);
                }

                const $field = $(field);

                if (createAccountValidator.getStatus($stateElement) !== 'undefined') {
                    createAccountValidator.remove($stateElement);
                }

                if ($last) {
                    createAccountValidator.remove($last);
                }

                if ($field.is('select')) {
                    $last = field;
                    Validators.setStateCountryValidation(createAccountValidator, field, this.validationDictionary.field_not_blank);
                } else {
                    Validators.cleanUpStateValidation(field);
                }
            });
        }

        if ($emailElement) {
            createAccountValidator.remove(emailSelector);
            /* @razoyo - TST-1060 - Removes email validation on acct creation page (we are using debounce for this now) */
            //Validators.setEmailValidation(createAccountValidator, emailSelector, this.validationDictionary.valid_email);
        }

        if ($passwordElement && $password2Element) {
            const { password: enterPassword, password_match: matchPassword, invalid_password: invalidPassword } = this.validationDictionary;

            createAccountValidator.remove(passwordSelector);
            createAccountValidator.remove(password2Selector);
            Validators.setPasswordValidation(
                createAccountValidator,
                passwordSelector,
                password2Selector,
                this.passwordRequirements,
                createPasswordValidationErrorTextObject(enterPassword, enterPassword, matchPassword, invalidPassword),
            );
        }

        // Form validation for Phone Number filed on Create Account page where a user attempts to enter all zeroes (000-000-0000)
        if (this.$phoneNumberElement) {
            createAccountValidator.add({
                selector: this.phoneNumberSelector,
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

        $createAccountForm.on('submit', event => {
            createAccountValidator.performCheck();

            if (createAccountValidator.areAll('valid')) {
                return;
            }

            event.preventDefault();
        });
    }
}
