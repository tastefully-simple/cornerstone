import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';
import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';
import StatesSelect from '../common/directory/states';
import pagination from '../common/pagination';
import PartyCard from '../common/party-card';

// Breakpoint for mobile
const SCREEN_MIN_WIDTH = 801;
// Number of page numbers to show in pagination
const DISPLAY_NUM_PAGES = 6;
const PAGE_SIZE = 10;
// Redirect
const PARTY_DETAILS_PAGE = '/party-details';
const CART_PAGE = '/cart.php';
// API error message
const API_ERROR_MESSAGE = {
    errorMessage: 'An error has occurred.',
};

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

        if (this.isOnCartPage()) {
            this.renderPartyInCart();
        }
    }

    initListeners() {
        // Modal
        this.$findParty.on('click', (e) => {
            if (!TSCookie.getPartyId()) {
                this.createModal(e, this.modalTemplate);
            } else {
                this.openDropdown(this.$findParty);
            }
        });

        const $findPartyButtons = this.$findPartyBar.find('.partybar-accordion').find('.partybar-button');
        const $viewPartyButton = $($findPartyButtons[0]);
        // View party button
        $viewPartyButton.on('click', () => {
            window.location.href = `/p/${this.party.id}`;
        });

        const $switchPartyButton = $($findPartyButtons[1]);
        // Switch party button
        $switchPartyButton.on('click', (e) => {
            this.createModal(e, this.modalTemplate);
        });

        const $deletePartyButton = $($findPartyButtons[2]);
        // Delete party button
        $deletePartyButton.on('click', () => this.deletePartyCookies());

        // Party bar in cart page (mobile)
        $('.cart-affiliate-party button').on('click', (e) => this.createModal(e, this.modalTemplate));
        // Party bar in cart page (desktop)
        $('.partybar button').on('click', (e) => this.createModal(e, this.modalTemplate));

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
        $('body').on('click', '.party-card', (e) => this.selectParty(e));

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

    openDropdown(target) {
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

        const $findPartyBarArrow = this.$findParty.find('.fa-caret-right');
        if (target.hasClass('active')) {
            // Change arrow pointing down when party bar opened
            $findPartyBarArrow.addClass('fa-caret-down').removeClass('fa-caret-right');
        } else {
            // Default
            $findPartyBarArrow.addClass('fa-caret-right').removeClass('fa-caret-down');
        }
    }

    partyGreeting(hostname) {
        if (hostname) {
            return `You\'re shopping in <strong>${hostname}\'s</strong> party`;
        }
        return 'Find a party';
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
            this.searchInfo.sid,
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
        } else {
            this.selectedId = null;
            $partyCard.find('.party-header').show();
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
            // Redirect
            window.location.href = `/p/${this.selectedId}`;
        } else {
            this.displayError('Please select a party before continuing');
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

    renderPartyInCart() {
        const phost = this.party.host;
        const $cartHeader = $('.cart-affiliate');
        const $findPartyBarMobile = $('<div>', { class: 'cart-affiliate-party no-party-selected' });
        const $findPartyBarDesktop = $('<div>', { class: 'partybar no-party-selected' });

        if (phost) {
            $findPartyBarMobile.html(`<p><strong>${phost}</strong> is your host</p>
                <button><span><small>(edit)</small></span></button>`);
        } else {
            this.noPartySelectedHtml($findPartyBarMobile);
            this.noPartySelectedHtml($findPartyBarDesktop);

            // initial no party selected (desktop)
            if (window.innerWidth >= SCREEN_MIN_WIDTH) {
                this.$findPartyBar.hide();
                $($findPartyBarDesktop).insertAfter($cartHeader);
            }

            $(window).resize(() => {
                if (window.innerWidth >= SCREEN_MIN_WIDTH) {
                    this.$findPartyBar.hide();
                    $findPartyBarDesktop.show();
                    $($findPartyBarDesktop).insertAfter($cartHeader);
                } else {
                    // Show default party bar in mobile menu
                    this.$findPartyBar.show();
                    $findPartyBarDesktop.hide();
                }
            });
        }

        $cartHeader.append($findPartyBarMobile);
    }

    renderPartyBar($party) {
        // Partybar Greeting Text
        const hostname = TSCookie.getPartyHost();
        const $findPartyBarText = this.$findParty.find('.partybar-text');
        $findPartyBarText.html(this.partyGreeting(hostname));

        const $navPages = $('.navPages-container .navPages');

        if (window.innerWidth >= SCREEN_MIN_WIDTH && this.isOnCartPage()) {
            $('.cart-affiliate').append($party);
        } else if (window.innerWidth >= SCREEN_MIN_WIDTH) {
            $('header.header').append($party);
        } else {
            $navPages.append($party);
        }
    }

    noPartySelectedHtml($partyBar) {
        const softRed = '#FFDDDD';
        const grey = '#2D2D2D';

        $partyBar.css('background-color', softRed);
        $partyBar.css('color', grey);
        $partyBar.html(`<p>Are you shopping in a <strong>party?</strong></p>
            <button class="framelink-md teal-text">Find It Here</button>`);
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
        $('.return-search').remove();
        $('.findmodal-pagination').remove();
        $('.matching').remove();
    }

    deletePartyCookies() {
        if (this.isOnPartyDetailsPage()) {
            document.location = PARTY_DETAILS_PAGE;
        }

        if (this.isOnCartPage()) {
            document.location = CART_PAGE;
        }

        const $partyBarText = $('#partybar-find .partybar-text');
        $partyBarText.text('Find a party');

        TSCookie.deleteParty();
    }

    /*
     * HTML
     */
    renderResults(response) {
        $('#party-search').hide();
        this.clearPartyWindow();

        // Return search
        const $returnSearch = $('<div>', { class: 'return-search' });
        $returnSearch.html(`
            <div class="vertical-center">
                <span class="icon-system-left-caret"></span>
            </div>
            <span class="frame-caption return-search-text">Refine your search</span>
        `);

        $('#party-search-results .genmodal-body .search-filter-wrapper').prepend($returnSearch);

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

        // Footer
        const $footerHtml = $('#party-search-results .findmodal-footer');

        // Pagination
        const $paginationContainer = $('<div>', { class: 'findmodal-pagination pagination' });
        $footerHtml.prepend($paginationContainer);

        pagination(
            $paginationContainer,
            response.CurrentPage,
            Math.ceil(response.TotalRecordCount / response.PageSize),
            DISPLAY_NUM_PAGES,
            (p) => this.goToPage(p),
        );
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
