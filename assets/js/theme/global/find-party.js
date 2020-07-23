import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';
import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';
import StatesSelect from '../common/directory/states';
import pagination from '../common/pagination';

export default function() {
    $(document).ready(function() {
        let party = new FindAParty(
            $('.partybar-container'),
            'common/find-party'
        );
    });
}

// Breakpoint for mobile
const SCREEN_MIN_WIDTH = 801;
// Number of page numbers to show in pagination
const DISPLAY_NUM_PAGES = 6;
const PAGE_SIZE = 10;

class FindAParty {
    constructor(trigger, template) {
        this.$findPartyBar = trigger.parent();

        // API
        this.api = new TSApi();

        // Modal
        trigger.on('click', (e) => this.createModal(e, template));

        // Search by State / Name
        $('body').on('submit', '#state-search-form', () => {
            this.searchInfo = {
                state: $('#party-search .state-search select').val(),
                name: $('#party-search .state-search input').val(),
                page: 1
            };

            this.search();
        });

        // Select party
        $('body').on('click', '.party-card', (e) => this.selectParty(e));

        // Submit
        $('body').on('click', '#party-continue', () => this.continue());

        // Move "Find a Party" bar into the main menu in mobile view
        this.movePartyElement(this.$findPartyBar);
        $(window).on('resize', () => this.movePartyElement(this.$findPartyBar));
    }

    createModal(e, template) {
        this.modal = defaultModal();
        e.preventDefault();
        this.modal.open({ size: 'small' });
        const options = { template: template };
        utils.api.getPage('/', options, (err, res) => {
            if (err) {
                console.error('Failed to get common/find-party. Error:', err);
                return false;
            } else if (res) {
                this.modalLoaded(res);
            }
        });
    }

    modalLoaded(result) {
        this.modal.updateContent(result);
        let $nameSelects = $('#party-search .state-search select');
        for (let i = 0; i < $nameSelects.length; i++) {
            new StatesSelect($nameSelects[i]);
        }
    }

    search() {
        this.api.searchPartyByState(
            this.searchInfo.state,
            this.searchInfo.name,
            this.searchInfo.page,
            PAGE_SIZE
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
        let $partyCard = $(e.target).closest('.party-card');

        if (!$partyCard.hasClass('selected')) {
            this.selectedId = $partyCard.data('pid');
            $('.selected').toggleClass('selected');
        } else {
            this.selectedId = null;
        }

        $(e.target).closest('.party-card').toggleClass('selected');

        let partyName = $partyCard.data('phost');
        $('#you-have-selected').html(`You have selected <span>${partyName}</span>'s Party`);

        // Set cookies
        this.setCookies($partyCard);
    }

    continue() {
        if (this.selectedId) {
            // Redirect
            window.location.href = '/party-details';
        } else {
            this.displayError('Please select a party before continuing');
        }
    }

    setCookies($partyCard) {
        TSCookie.SetPartyId($partyCard.data('pid'));
        TSCookie.SetPartyHost($partyCard.data('phost'));
        TSCookie.SetPartyDate($partyCard.data('pdate'));
        TSCookie.SetPartyTime($partyCard.data('ptime'));
        TSCookie.SetPartyTotal($partyCard.data('ptotal'));
    }

    movePartyElement($party) {
        let $navPages = $('.navPages-container .navPages');

        if (window.innerWidth >= SCREEN_MIN_WIDTH) {
            $('header').append($party);
        } else {
            $navPages.append($party);
        }
    }

    clearPartyWindow() {
        $('.party-card').remove();
        $('.party-pagination').remove();
        $('.party-footer').remove();
    }

    /*
     * HTML
     */
    renderResults(response) {
        if (!response.Results) {
            this.displayError("No party was found.");
            return;
        }

        $('#party-search').hide();
        $('.alertbox-error').hide();
        this.clearPartyWindow();

        // List of Parties
        response.Results.forEach(party => {
            let $partyHtmlBlock = this.getPartyHtmlBlock(party);
            $('#party-search-results article').append($partyHtmlBlock);
        });

        $('#party-search-results').show();

        // Footer
        let $footerHtml = this.getFooterHtml();
        $('#party-search-results').append($footerHtml);

        // If only one party is found,
        // select that party automatically
        if (response.Results.length == 1) {
            let $partyCard = $('.party-card');
            this.selectedId = $partyCard.data('pid');
            $partyCard.addClass('selected');

            let partyName = $partyCard.data('phost');
            $('#you-have-selected').html(`You have selected <span>${partyName}</span>'s Party`);
            // Set cookies
            this.setCookies($partyCard);
        }

        // Pagination
        let $paginationContainer = $('<div>', {'class': 'party-pagination pagination'});

        $footerHtml.prepend($paginationContainer);

        pagination(
            $paginationContainer,
            response.CurrentPage,
            Math.ceil(response.TotalRecordCount / response.PageSize),
            DISPLAY_NUM_PAGES,
            ((p) => this.goToPage(p))
        );
    }

    getPartyHtmlBlock(party) {
        let $blockHtml = $('<div>', {
            'class'       : 'party-card',
            'data-pid'    : party.PartyId,
            'data-phost'  : `${party.HostFirstName} ${party.HostLastName}`,
            'data-pdate'  : party.Date,
            'data-ptime'  : party.Time,
            'data-ptotal' : party.Total
        });

        let $selectedHeaderHtml = this.getSelectedHeaderHtml();
        $blockHtml.append($selectedHeaderHtml);
        let $partyInfoHtml = this.getInfoHtml(party);
        $blockHtml.append($partyInfoHtml);
        return $blockHtml;
    }

    getSelectedHeaderHtml() {
        let $selectedHeaderHtml = $('<div>', {'class': 'selected-header'});
        let $iconHtml = $('<span>', {'class': 'icon-system-check'});
        $selectedHeaderHtml.append($iconHtml);
        let $titleHtml = $('<h3>', {'class': 'selection-title'});
        $titleHtml.text('Current Party');
        $selectedHeaderHtml.append($titleHtml);
        return $selectedHeaderHtml;
    }

    getInfoHtml(party) {
        let $infoContainerHtml = $('<div>', {'class': 'party-info'});

        let $nameHtml = $('<h5>', {'class': 'party-name'});
        $nameHtml.text(`${party.HostFirstName} ${party.HostLastName}'s Party`);
        $infoContainerHtml.append($nameHtml);

        let $innerContainerHtml = $('<div>', {'class': 'system-12'});

        let $dateHtml = $('<div>');
        $dateHtml.html(`<span>Date: ${party.Date}</span>`);
        $innerContainerHtml.append($dateHtml);

        let $consultantHtml = $('<div>');
        $consultantHtml.html(`<span>Consultant: ${party.Consultant}</span>`);
        $innerContainerHtml.append($consultantHtml);

        $infoContainerHtml.append($innerContainerHtml);

        return $infoContainerHtml;
    }

    getFooterHtml() {
        let $footerHtml = $("<div>", {"class": "party-footer"});
        let $selectedHtml = $("<div>", {"class": "party-selected-next"});
        var $youHaveSelectedHtml = $("<p>", {"id": "you-have-selected", "class": "system-14"});
        $footerHtml.append($selectedHtml);
        $selectedHtml.append($youHaveSelectedHtml);
        var $continueHtml = $("<button>", {"id": "party-continue", "class": "button-secondary-icon"});
        $continueHtml.text("continue");
        $selectedHtml.append($continueHtml);
        return $footerHtml;
    }
}
