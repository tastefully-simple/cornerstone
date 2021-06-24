import pagination from '../common/pagination';
import TSCookie from './ts-cookie';
import TSApi from './ts-api';
import PartyCard from './party-card';

// Number of page numbers to show in pagination
const DISPLAY_NUM_PAGES = 6;
const PAGE_SIZE = 10;

const SHOP_NO_PARTY_MESSAGE = "I'm shopping without a party or fundraiser";

// Redirect
const CONSULTANT_PAGE = '/web';
const CART_PAGE = '/cart.php';

export default class ConsultantParties {
    constructor(selectedCid, modal, selectedConsultant, renderConsultantCb) {
        this.selectedCid = selectedCid;
        this.modal = modal;
        this.consultant = selectedConsultant;
        this.$parent = $('#consultantparties-search-results');
        this.api = new TSApi();
        this.page = 1;

        // Callback function to run renderConsultant()
        // from FindAConsultant class to update the selected
        // consultant in the header
        this.renderConsultantCb = renderConsultantCb;

        this.getParties();
    }

    getParties() {
        this.api.getPartiesByConsultant(this.selectedCid, this.page, PAGE_SIZE)
            .then(res => res.json())
            .then(data => {
                this.response = data;
                this.renderModal();
            })
            .catch(err => {
                console.warn('getPartiesByConsultant', err);
            });
    }

    renderModal() {
        this.clearWindow();
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

        this.$parent.find('article').append(this.defaultPartyCardHtml());
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
                    this.$parent.find('.party-info .consultant-name').remove();
                });
            });

        if (this.response.TotalRecordCount > 1) {
            this.getPagination();
        }

        // Event Listeners
        $('body').on(
            'click',
            '#consultantparties-search-results .party-card',
            (e) => this.selectParty(e),
        );

        $('body').on('click', '#consultantparties-continue', () => this.continueWithSelection());
    }

    defaultPartyCardHtml() {
        return `<div class="party-card result-card default-party-card selected">
            <div class="party-header">
                <span class="ts-circle"></span>
                <div class="vertical-center">
                    <span class="frame-caption selection-title">Select</span>
                </div>
            </div>
            <div class="selected-header">
                 <span class="ts-circle"></span>
                 </span>
                 <div class="vertical-center">
                     <span class="frame-caption selection-title">Selected</span>
                 </div>
             </div>

            <div class="party-info">
                <p class="subhead-14 party-name">Shop without a party or fundraiser</p>
            </div>
        </div>`;
    }

    selectParty(e) {
        $('.alertbox-error').hide();

        const $partyCard = $(e.target).closest('.party-card');

        $('.party-header').css('display', 'flex');

        /* Default party card does not have pid data attr.
         * So $partyCard.data('pid') will return undefined
         * when that card is selected
         */
        this.selectedPid = $partyCard.data('pid');

        $partyCard.find('.party-header').show().toggle();
        $('.selected').removeClass('selected');
        $(e.target).closest('.party-card').addClass('selected');

        // Display highlighted party in modal's footer
        const partyHost = $partyCard.data('phost');
        this.showSelectedPartyMessage(partyHost);
    }

    continueWithSelection() {
        // Reset party cookies
        TSCookie.deleteParty();

        const $selectedPartyCard = this.$parent.find('.party-card.selected');

        if (this.selectedPid) {
            const party = {
                id: this.selectedPid,
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
            this.updatePartyBarText(null);
        }

        // Save consultant cookies even if the user did
        // not select any party from the selected consultant
        this.saveConsultantCookies(this.consultant);

        // Run renderConsultant() from FindAConsultant class
        this.renderConsultantCb();

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

    saveConsultantCookies(consultant) {
        TSCookie.setConsultantId(consultant.id);
        TSCookie.setConsultantName(consultant.name);
        TSCookie.setConsultantImage(consultant.image);
        TSCookie.setConsultantHasOpenParty(consultant.hasOpenParty);
    }

    showSelectedPartyMessage(host) {
        const selectedMessage = `You have selected <span>${host}'s</span> party`;

        if (this.selectedPid) {
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
        if (this.selectedPid) {
            $('.partybar-main-text').html(`<span><strong>${host}</strong> is my host</span>`);
        } else {
            $('.partybar-main-text').html(`<span><strong>${SHOP_NO_PARTY_MESSAGE}</strong></span>`);
        }
    }

    isOnConsultantPage() {
        return document.location.pathname.includes(CONSULTANT_PAGE);
    }

    isOnCartPage() {
        return document.location.pathname === CART_PAGE;
    }

    getPagination() {
        const pageSize = this.response.PageSize;
        const totalRecordCount = this.response.TotalRecordCount;

        const $paginationContainer = $('<div>', { class: 'findmodal-pagination-container' });
        const $paginationText = $('<div>', { class: 'findmodal-pagination-text' });
        const $paginationList = $('<div>', { class: 'findmodal-pagination pagination' });

        const pageSizeCount = totalRecordCount < pageSize ? totalRecordCount : pageSize;
        $paginationText.html(`
            <p class="frame-caption">${pageSizeCount} out of ${totalRecordCount} results</p>
        `);

        pagination(
            $paginationList,
            this.response.CurrentPage,
            Math.ceil(totalRecordCount / pageSize),
            DISPLAY_NUM_PAGES,
            (p) => this.goToPage(p),
        );

        $paginationContainer.append($paginationText);
        $paginationContainer.append($paginationList);
        $('#consultantparties-search-results .findmodal-footer').prepend($paginationContainer);
    }

    goToPage(p) {
        this.page = p;
        this.getParties();
    }

    clearWindow() {
        $('.party-card').remove();
        $('.findmodal-pagination-container').remove();
    }
}
