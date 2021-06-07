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
                });
        } else {
            this.applyAffiliationOptionsTemplates($wrapper);
        }
    }

    applyAffiliationOptionsTemplates($wrapper) {
        this.template('cart/ts-affiliation-options').then(template => {
            $wrapper.append(template);
        },
        this.template('common/alert-error').then(noSelectionErrorHtml => {
            const errorBoxMessage = '.ts-cart-affiliation-wrapper .alert-message span';

            $('.ts-cart-affiliation-wrapper').prepend(noSelectionErrorHtml);
            $(errorBoxMessage).text('A selection is required before you proceed');
        }),
        this.template('common/tooltip-square').then(partyTooltipHtml => {
            const partyTooltipParent = '#ts-affiliate-cart-form label:nth-child(1)';
            const partyTooltip = partyTooltipParent + ' .tooltip-center';
            const partyTooltipIcon = partyTooltipParent + ' .icon-system-info';

            $(partyTooltipParent).append(partyTooltipHtml);
            $(partyTooltip + ' p').text('What is a party? Tastefully Simple parties and fundraisers reward hosts of $200+ events with free products. Help us ensure your host gets credit for your order.');
            $(partyTooltip).attr('id', 'partyTooltip');
            $(partyTooltipIcon).attr('data-dropdown', 'partyTooltip');
        }),
        this.template('common/tooltip-square').then(consultantTooltipHtml => {
            const consultantTooltipParent = '#ts-affiliate-cart-form label:nth-child(3)';
            const consultantTooltip = consultantTooltipParent + ' .tooltip-center';
            const consultantTooltipIcon = consultantTooltipParent + ' .icon-system-info';

            $(consultantTooltipParent).append(consultantTooltipHtml);
            $(consultantTooltip + ' p').text('What is a consultant? Our consultants are independent business owners who help you decide what\'s to eat! Help us ensure your consultant receives their commission or credit.');
            $(consultantTooltip).attr('id', 'consultantTooltip');
            $(consultantTooltipIcon).attr('data-dropdown', 'consultantTooltip');
            this.selectionLogic();
        }));
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
            if (e.target == document.getElementById("tsacf-shopdirect")) {
                $(this.checkoutButton).html('check out');
                $(this.checkoutButton).data('selected', true);
            } else {
                $(this.checkoutButton).html($(this.checkoutButton).data('originalText'));
                $(this.checkoutButton).data('selected', false);
            }
        });
    }

    bindCheckoutButtonClickEvent() {
      $('#page-wrapper').on('click', '.cart-actions .button--primary', () => {
          var that = this;
          if($(this.checkoutButton).data('selected')) {
              window.location.href = $(this.checkoutButton).prop('href');
          }
          if(!$(this.checkoutButton).data('selected')) {
              $(that.formWrapper).addClass('error');
              $(that.formTitle).hide();
              $(this.noSelectionError).show();
          }
      });
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
}
