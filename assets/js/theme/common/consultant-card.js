import utils from '@bigcommerce/stencil-utils';

export default class ConsultantCard {

    /* Returns Promise that returns the consultant-card template */
    async getTemplate() {
        let promise = new Promise ((resolve, reject) => {
            utils.api.getPage(window.location, {
                template: 'common/consultant-card',
            }, (err, res) => {
                if (err) {
                    console.error('Error getting consultant-card template');
                    throw new Error(err);
                }
                resolve(res);
            });
        });
        let template = await promise;

        return template;
    }

    /* Replaces placholder values of provided consultant-card template with data from consultant obj */
    insertConsultantData(card, consultant) {
        card = card.replace(/{consultant-id}/g, consultant.ConsultantId ? consultant.ConsultantId : '');
        card = card.replace(/{consultant-afid}/g, consultant.AfId? consultant.AfId : '');
        card = card.replace(/{consultant-imagesrc}/g, consultant.Image ? consultant.Image : '');
        card = card.replace(/{consultant-name}/g, consultant.Name ? consultant.Name : '');
        card = card.replace(/{consultant-title}/g, consultant.Title ? consultant.Title : '');
        card = card.replace(/{consultant-phone}/g, consultant.PhoneNumber ? consultant.PhoneNumber : '');
        card = card.replace(/{consultant-email}/g, consultant.EmailAddress ? consultant.EmailAddress : '');
        card = card.replace(/{consultant-location}/g, consultant.Location ? consultant.Location : '');
        card = card.replace(/{consultant-weburl}/g, consultant.WebUrl ? consultant.WebUrl : '');
        return card;
    }

}

