import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';
import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';
import StatesSelect from '../common/directory/states';
import pagination from '../common/pagination';

// Breakpoint for mobile
const SCREEN_MIN_WIDTH = 801;
// Number of page numbers to show in pagination
const DISPLAY_NUM_PAGES = 6;
const PAGE_SIZE = 10;

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
            id: TSCookie.GetPartyId(),
            host: TSCookie.GetPartyHost(),
            date: TSCookie.GetPartyDate(),
            time: TSCookie.GetPartyTime(),
            cid: TSCookie.GetConsultantId(),
            cname: TSCookie.GetConsultantName(),
        };
    }

    saveCookie(party) {
        TSCookie.SetPartyId(party.id);
        TSCookie.SetPartyHost(party.host);
        TSCookie.SetPartyDate(party.date);
        TSCookie.SetPartyTime(party.time);
        TSCookie.SetConsultantId(party.cid);
        TSCookie.SetConsultantName(party.cname);
    }

    /* party = {
     *     id: null|string,
     *     host: null|string,
     *     date: null|string,
     *     time: null|string,
     *     cid: null|string,
     *     cname: null|string,
     * }
     */
    setParty(party) {
        this.party = party;
        this.renderPartyBar(this.$findPartyBar);
    }

    initListeners() {
        // Modal
        this.$findParty.on('click', (e) => {
            if (!TSCookie.GetPartyId()) {
                this.createModal(e, this.modalTemplate);
            } else {
                this.openDropdown(this.$findParty);
            }
        });

        const $findPartyButtons = this.$findPartyBar.find('.partybar-accordion').find('.partybar-button');
        const $viewPartyButton = $($findPartyButtons[0]);
        // View party button
        $viewPartyButton.on('click', () => {
            window.location.href = '/party-details';
        });

        const $switchPartyButton = $($findPartyButtons[1]);
        // Switch party button
        $switchPartyButton.on('click', (e) => {
            this.createModal(e, this.modalTemplate);
        });

        // Search by State / Name
        $('body').on('submit', '#state-search-form', () => {
            this.searchInfo = {
                state: $('#party-search .state-search select').val(),
                name: $('#party-search .state-search input').val(),
                page: 1,
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
    }

    createModal(e, template) {
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

    renderStatesSelect() {
        const $statesSelect = document.querySelector('#party-search .state-search select');
        return new StatesSelect($statesSelect);
    }

    search() {
        this.api.searchPartyByState(
            this.searchInfo.state,
            this.searchInfo.name,
            this.searchInfo.page,
            PAGE_SIZE,
        )
            .then(res => res.json())
            .then(data => this.renderResults(data))
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

        if (!$partyCard.hasClass('selected')) {
            this.selectedId = $partyCard.data('pid');
            $('.selected').toggleClass('selected');
        } else {
            this.selectedId = null;
        }

        $(e.target).closest('.party-card').toggleClass('selected');

        const partyName = $partyCard.data('phost');
        $('.next-step-selected-text').html(`You have selected <strong>${partyName}'s</strong> Party`);
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
            });
            // Redirect
            window.location.href = '/party-details';
        } else {
            this.displayError('Please select a party before continuing');
        }
    }

    continue(party) {
        this.saveCookie(party);
        this.setParty(party);
    }

    renderPartyBar($party) {
        // Partybar Greeting Text
        const hostname = TSCookie.GetPartyHost();
        const $findPartyBarText = this.$findParty.find('.partybar-text');
        $findPartyBarText.html(this.partyGreeting(hostname));

        const $navPages = $('.navPages-container .navPages');

        if (window.innerWidth >= SCREEN_MIN_WIDTH) {
            $('header.header').append($party);
        } else {
            $navPages.append($party);
        }
    }

    returnSearch() {
        $('#party-search-results').hide();
        $('.alertbox-error').hide();
        $('#party-search').show();
    }

    clearPartyWindow() {
        $('.party-card').remove();
        $('.return-search').remove();
        $('.findmodal-pagination').remove();
    }

    /*
     * HTML
     */
    renderResults(response) {
        $('#party-search').hide();
        this.clearPartyWindow();

        // List of Parties
        response.Results.forEach(party => {
            const $partyHtmlBlock = this.getPartyHtmlBlock(party);
            $('#party-search-results article').append($partyHtmlBlock);
        });

        $('#party-search-results').show();
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
        if (response.Results.length === 1) {
            const $partyCard = $('.party-card');
            this.selectedId = $partyCard.data('pid');
            $partyCard.addClass('selected');

            const partyName = $partyCard.data('phost');
            $('#you-have-selected').html(`You have selected <strong>${partyName}'s</strong> Party`);
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
            ((p) => this.goToPage(p)),
        );

        // Return search
        const $returnSearch = $('<div>', { class: 'return-search' });
        $returnSearch.html(`
            <div class="vertical-center">
                <span class="icon-system-left-caret"></span>
            </div>
            <span class="frame-caption">Refine your search</span>
        `);

        $footerHtml.prepend($returnSearch);
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
        $nameHtml.text(`${party.HostFirstName} ${party.HostLastName}'s Party`);
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
