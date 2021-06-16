import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';
import copyToClipboard from 'copy-to-clipboard';
import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';
import StatesSelect from '../common/directory/states';
import pagination from '../common/pagination';
import PartyCard from '../common/party-card';

const TST_CONSULTANT_ID = '0160785';
// Breakpoint for mobile
const SCREEN_MIN_WIDTH = 801;
// Number of page numbers to show in pagination
const DISPLAY_NUM_PAGES = 6;
const PAGE_SIZE = 10;
// Redirect
const CART_PAGE = '/cart.php';
const HOST_PAGE = '/host';
// API error message
const API_ERROR_MESSAGE = {
    errorMessage: 'An error has occurred.',
};

const SHOP_NO_PARTY_MESSAGE = "I'm shopping without a party or fundraiser";

class FindAParty {
    constructor(trigger, template) {
        this.$findParty = trigger;
        this.modalTemplate = template;
        this.$findPartyBar = trigger.parent();
        this.api = new TSApi();
        this.setParty(this.loadParty());
        this.initListeners();
    }

    loadParty() {
        return {
            id: TSCookie.getPartyId(),
            host: TSCookie.getPartyHost(),
            date: TSCookie.getPartyDate(),
            time: TSCookie.getPartyTime(),
            cid: TSCookie.getConsultantId(),
            cname: TSCookie.getConsultantName(),
            cimg: TSCookie.getConsultantImage(),
        };
    }

    saveCookie(party) {
        TSCookie.setPartyId(party.id);
        TSCookie.setPartyHost(party.host);
        TSCookie.setPartyDate(party.date);
        TSCookie.setPartyTime(party.time);
        TSCookie.setConsultantId(party.cid);
        TSCookie.setConsultantName(party.cname);
        TSCookie.setConsultantImage(party.cimg);
        TSCookie.setConsultantHasOpenParty(true);
    }

    /* party = {
     *     id: null|string,
     *     host: null|string,
     *     date: null|string,
     *     time: null|string,
     *     cid: null|string,
     *     cname: null|string,
     *     cimg: string
     * }
     */
    setParty(party) {
        this.party = party;
        this.renderPartyBar(this.$findPartyBar);
    }

    initListeners() {
        // Modal
        this.$findParty.on('click', (e) => {
            if ((!TSCookie.getPartyId() && !TSCookie.getConsultantHasOpenParty())
                || TSCookie.getConsultantId() === TST_CONSULTANT_ID
            ) {
                this.createModal(e, this.modalTemplate);
            } else {
                this.openPartyBarDropdown(this.$findParty);
            }
        });

        // Party bar in cart page (mobile)
        $('.cart-affiliate-party button').on('click', (e) => this.createModal(e, this.modalTemplate));

        // View all parties button in cart page
        $('body').on('click', '.view-all-parties', (e) => this.createModal(e, this.modalTemplate));

        // TS affiliate cart page
        $('body.cart #page-wrapper').on('change', '#tsacf-findparty', (e) => {
            this.createModal(e, this.modalTemplate);
            $(e.target).prop('checked', false);
        });

        // Search by State / Name
        $('body').on('submit', '#state-search-form', () => {
            this.searchInfo = {
                state: $('#party-search .state-search select').val(),
                name: $('#party-search .state-search input').val(),
                page: 1,
                sid: TSCookie.getConsultantId(),
            };

            this.search();
        });

        // Select party
        $('body').on('click', '#party-search-results .party-card', (e) => this.selectParty(e));

        // Submit
        $('body').on('click', '#party-continue', () => this.continueWithSelection());

        // Go back to search
        $('body').on('click', '#party-goback', () => this.returnSearch());
        $('body').on('click', '.return-search', () => this.returnSearch());

        // Move "Find a Party" bar into the main menu in mobile view
        $(window).on('resize', () => this.renderPartyBar(this.$findPartyBar));

        $('body').on('click', '.partymodal-cancel-btn', () => this.closeModal());
    }

    createModal(e, template) {
        $('#modal').removeClass('modal-results');
        this.modal = defaultModal();
        e.preventDefault();
        this.modal.open({ size: 'small' });
        const options = { template };
        utils.api.getPage('/', options, (err, res) => {
            if (err) {
                console.error('Failed to get common/find-party. Error:', err);
                return false;
            } else if (res) {
                this.modalLoaded(res);
            }
        });
    }

    openPartyBarDropdown(target) {
        target.toggleClass('active');

        const accord = target.next();

        if (accord.css('max-height') === '0px') {
            accord.css('max-height', (accord.prop('scrollHeight')));

            // Scroll down when showing party bar's options
            $('.header.is-open .navPages').animate({ scrollTop: accord.offset().top });
            // TST-164 for Safari
            // this code won't be applied to other browsers
            // because .navPages-container's overflow CSS property
            // is only set on Safari
            $('.header.is-open .navPages-container').animate({ scrollTop: accord.offset().top });
        } else {
            accord.css('max-height', 0);
        }

        const $findPartyBarArrow = this.$findParty.find('.partybar-arrow');
        if (target.hasClass('active')) {
            // Change arrow pointing down when party bar opened
            $findPartyBarArrow.addClass('fa-caret-down').removeClass('fa-caret-right');
        } else {
            // Default
            $findPartyBarArrow.addClass('fa-caret-right').removeClass('fa-caret-down');
        }

        const pid = TSCookie.getPartyId();

        if ((this.consultantHasOpenParties() && pid === 'null')
            || (this.consultantHasOpenParties() && !pid)) {
            this.hasOpenPartiesNoPartySelected();
        } else if (this.consultantHasOpenParties() && pid) {
            this.hasOpenPartiesWithPartySelected();
        } else {
            this.noOpenParties();
        }
    }

    consultantHasOpenParties() {
        return JSON.parse(TSCookie.getConsultantHasOpenParty());
    }

    hasOpenPartiesNoPartySelected() {
        // Get consultant's first name
        const consultant = TSCookie.getConsultantName().split(' ').slice(0, -1);

        const html =
            `<div class="partybar-accordion-items">
                <div class="partybar-button">
                    <button type="button" class="subhead-16 view-consultant-parties">view ${consultant}'s parties</button>
                </div>
                <div class="partybar-button">
                    <button type="button" class="subhead-16 view-all-parties">view all parties</button>
                </div>
            </div>`;

        $('.partybar-accordion').html(html);

        // View all parties button
        const $viewAllParties = this.$findPartyBar.find('.view-all-parties');
        $viewAllParties.on('click', (e) => this.createModal(e, this.modalTemplate));
    }

    hasOpenPartiesWithPartySelected() {
        const html =
            `<div class="partybar-accordion-items">
                <div class="partybar-button">
                    <button type="button" class="view-party">view party</button>
                </div>
                <div class="partybar-button">
                    <button type="button" class="copy-party-link">copy &amp; share party link </button>
                </div>
                <div class="partybar-button">
                    <p class="subhead-14">
                        <button type="button" class="view-all-parties">edit</button>
                        <span class="white-text">&verbar;</span>
                        <button type="button" class="remove-party">remove party</button>
                    </p>
                </div>
            </div>`;

        $('.partybar-accordion').html(html);

        // View party
        const $viewPartyButton = this.$findPartyBar.find('.partybar-accordion-items .view-party');
        $viewPartyButton.on('click', () => {
            window.location.href = `/p/${this.party.id}`;
        });

        // Copy Party URL to clipboard
        const $copyPartyUrl = this.$findPartyBar.find('.partybar-accordion-items .copy-party-link');
        $copyPartyUrl.on('click', () => {
            copyToClipboard(`${window.location.host}/p/${this.party.id}`);
            $copyPartyUrl.append('<i class="fas fa-check copied"></i>');

            setTimeout(() => {
                $('.copy-party-link .copied').remove();
            }, 5000);
        });

        // Remove party
        const $removeParty = this.$findPartyBar.find('.partybar-accordion-items .remove-party');
        $removeParty.on('click', () => {
            TSCookie.deleteParty();

            if (this.isOnPartyDetailsPage()) {
                window.location.href = HOST_PAGE;
            } else {
                window.location.reload();
            }
        });

        // View all parties button
        const $viewAllParties = this.$findPartyBar.find('.view-all-parties');
        $viewAllParties.on('click', (e) => this.createModal(e, this.modalTemplate));
    }

    noOpenParties() {
        // Get consultant's first name
        const consultant = TSCookie.getConsultantName().split(' ').slice(0, -1);

        const html =
            `<div class="partybar-accordion-items">
                <div class="partybar-text">
                    <p>${consultant} doesn't have any open parties</p>
                </div>
                <div class="partybar-button">
                    <button type="button" class="subhead-16 view-all-parties">view all parties</button>
                </div>
            </div>`;

        $('.partybar-accordion').html(html);

        // View all parties button
        const $viewAllParties = this.$findPartyBar.find('.view-all-parties');
        $viewAllParties.on('click', (e) => this.createModal(e, this.modalTemplate));
    }

    partyGreeting(hostname) {
        if (hostname) {
            return `<span><strong>${hostname}</strong> is my host</span>`;
        } else if (TSCookie.getPartyId() === 'null') {
            return `<span><strong>${SHOP_NO_PARTY_MESSAGE}</strong></span>`;
        }

        return 'Find a Party or Fundraiser';
    }

    modalLoaded(result) {
        this.modal.updateContent(result);
        this.renderStatesSelect();
    }

    closeModal() {
        this.modal.close();
    }

    renderStatesSelect() {
        const $statesSelect = document.querySelector('#party-search .state-search select');
        return new StatesSelect($statesSelect);
    }

    search() {
        if (this.searchInfo.name) {
            this.searchQuery = `${this.searchInfo.name}, ${this.searchInfo.state}`;
        } else {
            this.searchQuery = this.searchInfo.state;
        }

        this.api.searchPartyByState(
            this.searchInfo.state,
            this.searchInfo.name,
            this.searchInfo.page,
            PAGE_SIZE,
        )
            .then(res => {
                const statusCode = res.status.toString();
                const newResponse = (statusCode[0] === '5') ? API_ERROR_MESSAGE : res.json();
                return newResponse;
            })
            .then(data => {
                const newData = data.errorMessage
                    ? this.displayError(data.errorMessage)
                    : this.renderResults(data);
                return newData;
            })
            .catch(err => {
                console.warn('searchByState', err);
                this.displayError(err);
            });
    }

    displayError(err) {
        $('.alertbox-error span').text(err);
        $('.alertbox-error').show();
    }

    goToPage(p) {
        this.searchInfo.page = p;
        this.search();
    }

    selectParty(e) {
        $('.alertbox-error').hide();
        const $partyCard = $(e.target).closest('.party-card');

        $('.party-header').show();

        if (!$partyCard.hasClass('selected')) {
            this.selectedId = $partyCard.data('pid');
            $('.selected').toggleClass('selected');
            $partyCard.find('.party-header').hide();
            $('#party-continue').attr('disabled', false);
        } else {
            this.selectedId = null;
            $partyCard.find('.party-header').show();
            $('#party-continue').attr('disabled', true);
        }

        $(e.target).closest('.party-card').toggleClass('selected');

        const partyHost = $partyCard.data('phost');
        this.showSelectedPartyMessage(partyHost);
    }

    continueWithSelection() {
        if (this.selectedId) {
            this.continue({
                id: this.selectedId,
                host: $('.party-card.selected').data('phost'),
                date: $('.party-card.selected').data('pdate'),
                time: $('.party-card.selected').data('ptime'),
                cid: $('.party-card.selected').data('cid'),
                cname: $('.party-card.selected').data('cname'),
                cimg: $('.party-card.selected').data('cimg'),
            });
        } else {
            this.displayError('Please select a party before continuing');
        }

        if (this.isOnCartPage()) {
            window.location.href = CART_PAGE;
        } else {
            // Redirect to party details page
            window.location.href = `/p/${this.selectedId}`;
        }
    }

    continue(party) {
        this.saveCookie(party);
        this.setParty(party);
    }

    isOnPartyDetailsPage() {
        const url = document.location.pathname;

        return url.match(/^\/p\/\d+/ig) !== null;
    }

    isOnCartPage() {
        return document.location.pathname === CART_PAGE;
    }

    renderPartyBar($party) {
        // Partybar Greeting Text
        const hostname = TSCookie.getPartyHost();
        const $findPartyBarText = this.$findParty.find('.partybar-main-text');
        $findPartyBarText.html(this.partyGreeting(hostname));

        const $navPages = $('.navPages-container .navPages');

        /* Party bar does not have a background color by default
         * and need to set the background color to apple green.
         * It's kind of a hack when hiding it in
         * desktop view when user is in the cart page so that
         * it's not really obvious that the party bar gets hidden.
         */
        const appleGreen = '#6e7a06';

        $party.show();
        $party.css('background-color', appleGreen);

        // Show party bar in desktop or mobile
        if (this.isDesktop()) {
            $('header.header').append($party);
        } else {
            $navPages.append($party);
        }
    }

    isDesktop() {
        return window.innerWidth >= SCREEN_MIN_WIDTH;
    }

    showSelectedPartyMessage(host) {
        if (this.selectedId) {
            $('.next-step-selected-text').html(`You have selected <span>${host}'s</span> Party`);
        } else {
            $('.next-step-selected-text').text('');
        }
    }

    returnSearch() {
        $('#party-search-results').hide();
        $('#modal').removeClass('modal-results');
        $('.alertbox-error').hide();
        $('#party-search').show();
        $('.next-step-selected-text').text('');
        this.selectedId = null;
    }

    clearPartyWindow() {
        $('.party-card').remove();
        $('.findmodal-pagination-container').remove();
        $('.matching').remove();
    }

    /*
     * HTML
     */
    renderResults(response) {
        $('#party-search').hide();
        this.clearPartyWindow();

        const $matchingParties = $('<span>', { class: 'frame-caption matching' });
        $matchingParties.text(`${response.TotalRecordCount} Parties matching \"${this.searchQuery}\"`);
        $('#party-search-results .genmodal-body .search-filter-wrapper').append($matchingParties);

        const partyCard = new PartyCard();

        partyCard.getTemplate()
            .then(template => {
                response.Results.forEach(party => {
                    const $partyHtmlBlock = partyCard.insertPartyData(template, party);
                    $('#party-search-results article').append($partyHtmlBlock);
                });
            });

        $('#party-search-results').show();
        $('#modal').addClass('modal-results');
        $('#party-search-results article').show();
        $('#party-continue').show();
        $('#party-goback').hide();

        if (response.Results.length === 0) {
            this.displayError('No party was found.');
            $('#party-search-results article').hide();
            $('#party-continue').hide();
            $('.return-search').hide();
            $('#party-goback').show();
            return;
        }

        // If only one party is found,
        // select that party automatically
        if (response.Results.length === 1 && response.CurrentPage === 1) {
            const $partyCard = $('.party-card');
            this.selectedId = $partyCard.data('pid');
            $partyCard.addClass('selected');

            const partyHost = $partyCard.data('phost');
            this.showSelectedPartyMessage(partyHost);
        }

        // Pagination
        if (response.TotalRecordCount > 1) {
            this.getPagination(response);
        }
    }

    getPartyHtmlBlock(party) {
        const $block = $('<div>', {
            class: 'party-card result-card',
            'data-pid': party.PartyId,
            'data-phost': `${party.HostFirstName} ${party.HostLastName}`,
            'data-pdate': party.Date,
            'data-ptime': party.Time,
            'data-cid': party.ConsultantId,
            'data-cname': party.Consultant,
            'data-cimg': party.Image,
        });

        const $selectedHeader = this.getSelectedHeaderHtml();
        $block.append($selectedHeader);
        const $partyInfo = this.getInfoHtml(party);
        $block.append($partyInfo);
        return $block;
    }

    getSelectedHeaderHtml() {
        const $selectedHeader = $('<div>', { class: 'selected-header' });
        const $icon = $('<span>', { class: 'icon-system-check' });
        $selectedHeader.append($icon);

        const $title = $('<h3>', { class: 'selection-title' });
        $title.text('Current Party');
        $selectedHeader.append($title);

        return $selectedHeader;
    }

    getInfoHtml(party) {
        const $infoContainerHtml = $('<div>', { class: 'party-info' });

        const $nameHtml = $('<h5>', { class: 'party-name' });
        $nameHtml.text(party.PartyTitle);
        $infoContainerHtml.append($nameHtml);

        const $innerContainerHtml = $('<div>', { class: 'system-12' });

        const $dateHtml = $('<div>');
        $dateHtml.html(`<span>Date: ${party.Date}</span>`);
        $innerContainerHtml.append($dateHtml);

        const $consultantHtml = $('<div>');
        $consultantHtml.html(`<span>Consultant: ${party.Consultant}</span>`);
        $innerContainerHtml.append($consultantHtml);

        $infoContainerHtml.append($innerContainerHtml);

        return $infoContainerHtml;
    }

    getPagination(response) {
        const pageSize = response.PageSize;
        const totalRecordCount = response.TotalRecordCount;

        const $paginationContainer = $('<div>', { class: 'findmodal-pagination-container' });
        const $paginationText = $('<div>', { class: 'findmodal-pagination-text' });
        const $paginationList = $('<div>', { class: 'findmodal-pagination pagination' });

        const pageSizeCount = totalRecordCount < pageSize ? totalRecordCount : pageSize;
        $paginationText.html(`
            <p class="frame-caption">${pageSizeCount} out of ${totalRecordCount} results</p>
        `);

        pagination(
            $paginationList,
            response.CurrentPage,
            Math.ceil(totalRecordCount / pageSize),
            DISPLAY_NUM_PAGES,
            (p) => this.goToPage(p),
        );

        $paginationContainer.append($paginationText);
        $paginationContainer.append($paginationList);
        $('#party-search-results .findmodal-footer').prepend($paginationContainer);
    }
}

export default function () {
    $(document).ready(() => {
        const party = new FindAParty(
            $('#partybar-find'),
            'common/find-party',
        );

        return party;
    });
}
