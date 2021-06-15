import utils from '@bigcommerce/stencil-utils';
import TSCookie from './ts-cookie';

export default class TSCartAffiliation {
    constructor() {
        this.init();
        this.checkoutButton = '.cart-actions .button--primary';
        this.formWrapper = '#ts-affiliate-cart-form-wrapper';
        this.formTitle = '.ts-cart-affiliation-wrapper > h2';
        this.noSelectionError = '.ts-cart-affiliation-wrapper .alertbox-error';
    }

    init() {
        this.renderTemplate();
    }

    renderTemplate() {
        const $wrapper = $('#ts-cart-affiliation .ts-cart-affiliation-wrapper');

        if (TSCookie.getConsultantId()) {
            this.template('cart/ts-selected-affiliation')
                .then(template => {
                    $wrapper.append(template);
                    this.renderSelectedAffiliation();
                });
        } else {
            this.applyAffiliationOptionsTemplates($wrapper);
        }
    }

    template(templatePath) {
        const template = new Promise((resolve, _reject) => {
            utils.api.getPage('/', {
                template: templatePath,
            }, (err, res) => {
                if (err) {
                    console.error(`Error getting ${templatePath} template`);
                    throw new Error(err);
                } else {
                    resolve(res);
                }
            });
        });

        return template;
    }

    /*
     * RADIO BUTTON SECTION
     */

    applyAffiliationOptionsTemplates($wrapper) {
        this.template('cart/ts-affiliation-options').then(
            template => {
                $wrapper.append(template);
            },
            this.template('common/alert-error').then(noSelectionErrorHtml => {
                const errorBoxMessage = '.ts-cart-affiliation-wrapper .alert-message span';
                const errorBoxTitle = '.ts-cart-affiliation-wrapper .alert-title';

                $('.ts-cart-affiliation-wrapper').prepend(noSelectionErrorHtml);
                $(errorBoxTitle).text('Selection Required');
                $(errorBoxMessage).text('A selection is required before you proceed');
            }),
            this.template('common/tooltip-square').then(partyTooltipHtml => {
                const partyTooltipParent = '#ts-affiliate-cart-form label:nth-child(1)';
                const partyTooltip = `${partyTooltipParent} .tooltip-right`;
                const partyTooltipIcon = `${partyTooltipParent} .icon-system-info`;
                const partyTooltipText =
                    `What is a party? Tastefully Simple parties and fundraisers reward
                    hosts of $200+ events with free products. Help us ensure your host
                    gets credit for your order.`;

                $(partyTooltipParent).append(partyTooltipHtml);
                $(`${partyTooltip} p`).text(partyTooltipText);
                $(partyTooltip).attr('id', 'partyTooltip');
                $(partyTooltipIcon).attr('data-dropdown', 'partyTooltip');
            }),
            this.template('common/tooltip-square').then(consultantTooltipHtml => {
                const consultantTooltipParent = '#ts-affiliate-cart-form label:nth-child(3)';
                const consultantTooltip = `${consultantTooltipParent} .tooltip-right`;
                const consultantTooltipIcon = `${consultantTooltipParent} .icon-system-info`;
                const consultantTooltipText =
                    `What is a consultant? Our consultants are independent business owners
                    who help you decide what\'s to eat! Help us ensure your consultant
                    receives their commission or credit.`;

                $(consultantTooltipParent).append(consultantTooltipHtml);
                $(`${consultantTooltip} p`).text(consultantTooltipText);
                $(consultantTooltip).attr('id', 'consultantTooltip');
                $(consultantTooltipIcon).attr('data-dropdown', 'consultantTooltip');
                this.selectionLogic();
            }),
        );
    }

    selectionLogic() {
        this.bindTsCartFormSelectionEvent();
        this.bindCheckoutButtonClickEvent();
    }

    bindTsCartFormSelectionEvent() {
        $(this.checkoutButton).data('originalText', $(this.checkoutButton).text());

        $('#page-wrapper').on('change', '#ts-affiliate-cart-form input', (e) => {
            $(this.formWrapper).removeClass('error');
            $(this.formTitle).show();
            $(this.noSelectionError).hide();

            if (e.target === document.getElementById('tsacf-shopdirect')) {
                $(this.checkoutButton).html('check out');
                $(this.checkoutButton).removeAttr('disabled');
                $(this.checkoutButton).removeAttr('onclick');
            } else {
                $(this.checkoutButton).html($(this.checkoutButton).data('originalText'));
                $(this.checkoutButton).attr('disabled', true);
            }
        });
    }

    bindCheckoutButtonClickEvent() {
        $('#page-wrapper').on('click', '.cart-actions .button--primary', () => {
            const that = this;

            if ($(this.checkoutButton).attr('disabled')) {
                $(that.formWrapper).addClass('error');
                $(that.formTitle).hide();
                $(this.noSelectionError).show();
            }
        });
    }

    /*
     * SELECTED AFFILIATION SECTION
     */

    renderSelectedAffiliation() {
        this.selectedConsultant = {
            id: TSCookie.getConsultantId(),
            name: TSCookie.getConsultantName(),
            image: TSCookie.getConsultantImage(),
        };

        // Update Selected Consultant
        this.updateConsultantSelection();
        // Update Selected party
        this.updatePartySelection();
    }

    updateConsultantSelection() {
        const $parent = $('.cart-affiliate-consultant-selected');

        // Update Selected consultant name
        $parent.find('.cart-affiliate-name').text(this.selectedConsultant.name);

        // Update Selected consultant image
        const $consultantImg = $parent.find('.cart-affiliate-img');

        $consultantImg.css('display', 'initial');
        $consultantImg.attr('alt', `Photograph thumbnail of ${this.selectedConsultant.name}`);

        if (this.selectedConsultant.image) {
            $consultantImg.attr('src', this.selectedConsultant.image);
        }
    }

    updatePartySelection() {
        const pid = TSCookie.getPartyId();
        const hasOpenParties = JSON.parse(TSCookie.getConsultantHasOpenParty());

        if (hasOpenParties && pid === 'null') {
            // Scenario 1
            this.hasOpenPartiesNoPartySelected();
        } else if (hasOpenParties && pid) {
            // Scenario 2
            this.hasOpenPartiesWithPartySelected();
        } else if (hasOpenParties && !pid) {
            // Scenario 3
            this.hasOpenPartiesNoPartySelectedYet();
        } else {
            // Scenario 4
            this.noOpenParties();
        }
    }

    // Scenario 1
    hasOpenPartiesNoPartySelected() {
        const html =
            `<div class="cart-affiliate-party noparty">
                <p class="cart-affiliate-party-name frame-subhead">I'm shopping without a party or fundraiser</p>
                <p>
                    <button type="button" class="framelink-sm cart-affiliate-btn view-consultant-parties">
                        view ${this.selectedConsultant.name}'s parties
                    </button>
                </p>
                <p>
                    <button type="button" class="framelink-sm cart-affiliate-btn view-all-parties">
                        view all parties
                    </button>
                </p>
            </div>`;

        $('.cart-affiliate-party-state').html(html);
        this.enableCheckout();
    }

    // Scenario 2
    hasOpenPartiesWithPartySelected() {
        const phost = TSCookie.getPartyHost();
        const html =
            `<div class="cart-affiliate-party">
                <p class="cart-affiliate-party-name frame-subhead">
                    <span class="frameheading-4">${phost}</span>
                    is my host <button type="button" class="framelink-sm remove-party">remove</button>
                </p>
            </div>`;

        $('.cart-affiliate-party-state').html(html);
        this.enableCheckout();

        // Remove Party
        const $removeParty = $('.cart-affiliate-party').find('.remove-party');
        $removeParty.on('click', () => {
            TSCookie.deleteParty();
            window.location.reload();
        });
    }

    // Scenario 3
    hasOpenPartiesNoPartySelectedYet() {
        $('.cart-affiliate-party-state').text('');

        const $parentCartAction = $('.cart-actions');
        $parentCartAction.find('.button--primary').attr('href', '/checkout').hide();

        const $continueBtn = $('<a>', { class: 'button button--primary view-consultant-parties' });
        $continueBtn.text('continue');
        $parentCartAction.prepend($continueBtn);
    }

    // Scenario 4
    noOpenParties() {
        $('.cart-affiliate-party-state').text('');
        this.enableCheckout();
    }

    enableCheckout() {
        $(this.checkoutButton).html('check out');
        $(this.checkoutButton).removeAttr('onclick');
        $(this.checkoutButton).removeAttr('disabled');
    }
}
