import utils from '@bigcommerce/stencil-utils';
import TSCookie from './ts-cookie';

export default class TSCartAffiliation {
    constructor() {
        this.init();
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
            this.template('cart/ts-affiliation-options')
                .then(template => {
                    $wrapper.append(template);
                });
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
}
