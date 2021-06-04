import TSCookie from './ts-cookie';
import PartyCard from './party-card';

const SHOP_NO_PARTY_MESSAGE = "I'm shopping without a party or fundraiser";

// Redirect
const CONSULTANT_PAGE = '/web';
const CART_PAGE = '/cart.php';

export default class ConsultantParties {
    constructor(response, modal, selectedConsultant) {
        this.response = response;
        this.modal = modal;
        this.consultant = selectedConsultant;
        this.$parent = $('#consultantparties-search-results');
        this.init();
    }

    init() {
        $('#consultant-search').hide();
        $('#consultant-search-results').hide();
        $('.alertbox-error').hide();

        this.$parent.show();

        // Set selected consultant info
        const $consultantImg = this.$parent.find('.consultant-image img');
        const $consultantName = this.$parent.find('.consultant-name');

        $consultantImg.attr('src', this.consultant.image);
        $consultantImg.attr('alt', `Photograph thumbnail of ${this.consultant.name}`);
        $consultantName.text(this.consultant.name);

        // Reset selected party card
        this.$parent.find('.party-card.selected').removeClass('selected');
        // Always select default party card first
        this.$parent.find('.default-party-card').addClass('selected');

        // Render Party cards
        const partyCard = new PartyCard();
        partyCard
            .getTemplate()
            .then(template => {
                this.response.Results.forEach(party => {
                    const $partyHtmlBlock = partyCard.insertPartyData(template, party);
                    this.$parent.find('article').append($partyHtmlBlock);
                });
            });

        // Event Listeners
        $('body').on(
            'click',
            '#consultantparties-search-results .party-card',
            (e) => this.selectParty(e),
        );

        $('body').on('click', '#consultantparties-continue', () => this.continueWithSelection());
    }

    selectParty(e) {
        $('.alertbox-error').hide();

        const $partyCard = $(e.target).closest('.party-card');

        $('.party-header').css('display', 'flex');

        /* Default party card does not have pid data attr.
         * So $partyCard.data('pid') will return undefined
         * when that card is selected
         */
        this.selectedId = $partyCard.data('pid');

        $partyCard.find('.party-header').show().toggle();
        $('.selected').removeClass('selected');
        $(e.target).closest('.party-card').addClass('selected');

        // Display highlighted party in modal's footer
        const partyHost = $partyCard.data('phost');
        this.showSelectedPartyMessage(partyHost);
    }

    continueWithSelection() {
        const $selectedPartyCard = this.$parent.find('.party-card.selected');

        if (this.selectedId) {
            const party = {
                id: this.selectedId,
                host: $selectedPartyCard.data('phost'),
                date: $selectedPartyCard.data('pdate'),
                time: $selectedPartyCard.data('ptime'),
                cid: $selectedPartyCard.data('cid'),
                cname: $selectedPartyCard.data('cname'),
                cimg: $selectedPartyCard.data('cimg'),
            };

            // Update green party bar text
            this.updatePartyBarText(party.host);

            this.savePartyCookies(party);
        } else {
            // To account for user not choosing to
            // select a party with selected consultant
            // that has active parties
            TSCookie.setPartyId(null);
        }

        if (this.isOnConsultantPage()) {
            window.location = CONSULTANT_PAGE;
        } else if (this.isOnCartPage()) {
            window.location = CART_PAGE;
        } else {
            this.modal.close();
        }
    }

    savePartyCookies(party) {
        TSCookie.setPartyId(party.id);
        TSCookie.setPartyHost(party.host);
        TSCookie.setPartyDate(party.date);
        TSCookie.setPartyTime(party.time);
        TSCookie.setConsultantId(party.cid);
        TSCookie.setConsultantName(party.cname);
        TSCookie.setConsultantImage(party.cimg);
    }

    showSelectedPartyMessage(host) {
        const selectedMessage = `You have selected <span>${host}'s</span> party`;

        if (this.selectedId) {
            this.$parent
                .find('.next-step-selected-text')
                .html(selectedMessage);
        } else {
            this.$parent
                .find('.next-step-selected-text')
                .text(SHOP_NO_PARTY_MESSAGE);
        }
    }

    updatePartyBarText(host) {
        if (this.selectedId) {
            $('.partybar-main-text').html(`<strong>${host}</strong> is my host`);
        } else {
            $('.partybar-main-text').html(`<strong>${SHOP_NO_PARTY_MESSAGE}</strong>`);
        }
    }

    isOnConsultantPage() {
        return document.location.pathname.includes(CONSULTANT_PAGE);
    }

    isOnCartPage() {
        return document.location.pathname === CART_PAGE;
    }
}
