import utils from '@bigcommerce/stencil-utils';

export default class PartyCard {
    /* Returns Promise that returns the party-card template */
    getTemplate() {
        const template = new Promise((resolve, _reject) => {
            utils.api.getPage('/', {
                template: 'common/party-card',
            }, (err, res) => {
                if (err) {
                    console.error('Error getting party-card template');
                    throw new Error(err);
                }

                resolve(res);
            });
        });

        return template;
    }

    /* Replaces placholder values of provided party-card template with data from party obj */
    insertPartyData(card, party) {
        let newCard = card;

        newCard = newCard.replace(/{party-id}/g, party.PartyId ? party.PartyId : '');
        newCard = newCard.replace(/{party-host}/g, party.HostFirstName ? `${party.HostFirstName} ${party.HostLastName}` : '');
        newCard = newCard.replace(/{party-date}/g, party.Date ? party.Date : '');
        newCard = newCard.replace(/{party-time}/g, party.Time ? party.Time : '');
        newCard = newCard.replace(/{party-title}/g, party.PartyTitle ? party.PartyTitle : '');
        newCard = newCard.replace(/{consultant-id}/g, party.ConsultantId ? party.ConsultantId : '');
        newCard = newCard.replace(/{consultant-name}/g, party.Consultant ? party.Consultant : '');
        newCard = newCard.replace(/{consultant-image}/g, party.Image ? party.Image : '');

        return newCard;
    }
}
