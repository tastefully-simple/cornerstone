import utils from '@bigcommerce/stencil-utils';

export default class JoinKitContentCard {
    /**
     * Returns Promise that returns the join-kit-content-card template
     */
    async getTemplate() {
        const promise = new Promise((resolve, _reject) => {
            utils.api.getPage('/', {
                template: 'common/join-kit-content-card',
            }, (err, res) => {
                if (err) {
                    console.error('Error getting join-kit-content-card template');
                    throw new Error(err);
                }

                resolve(res);
            });
        });

        const template = await promise;

        return template;
    }

    /**
     * Replaces placholder values of provided join-kit-content-card template with data from kit content obj
     */
    insertCard(card, kitContent) {
        let newCard = card;

        newCard = newCard.replace(/{kit-content-img}/g, kitContent.img ? kitContent.img : '');
        newCard = newCard.replace(/{kit-content-name}/g, kitContent.name ? kitContent.name : '');
        newCard = newCard.replace(/{kit-content-qty}/g, kitContent.qty ? kitContent.qty : '');
        newCard = newCard.replace(/{kit-content-description}/g, kitContent.description ? kitContent.description : '');

        return newCard;
    }
}
