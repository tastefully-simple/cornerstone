import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';
import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';
import StatesSelect from '../common/directory/states';
import pagination from '../common/pagination';
import ConsultantCard from '../common/consultant-card';
import ConsultantParties from '../common/consultant-parties';
import TSRemoveAffiliation from '../common/ts-remove-affiliation';

/**
 * Creates a Cornerstone popup modal for Find A Consultant.
 * A second view is available once the user hits search. The modal is then
 * populated with data from the user's search parameters
 */

export default class FindAConsultant {
    constructor(tsConsultantId) {
        // Search mode
        this.noSearch = 0;
        this.searchByZip = 1;
        this.searchByName = 2;
        this.searchById = 3;

        // Pagination
        this.displayNumPages = 6;

        // Redirect
        this.consultantPage = '/web';
        this.partyDetailsPage = '/party-details';
        this.cartPage = '/cart.php';

        // API error message
        this.apiErrorMessage = {
            errorMessage: 'An error has occurred.',
        };

        // Identifiers
        this.consultantSearchId = '#consultant-search';
        this.zipcodeSearchId = '#zipcode-search-form';
        this.nameSearchId = '#name-search-form';
        this.cidSearchId = '#id-search-form';
        this.searchResultsId = '#consultant-search-results';
        this.cidContinueId = '#consultant-continue';
        this.$findConsultant = document.querySelector('.headertoplinks-consult');

        this.modalTemplate = 'common/findConsultant/find-consultant';
        this.tsConsultantId = tsConsultantId;
        this.searchInfo = { mode: this.noSearch };
        this.pageSize = 10;
        this.screenMinWidth = 801;
        this.api = new TSApi();
        this.removeAffiliation = new TSRemoveAffiliation();
        window.selectedId = null;
    }

    init() {
        this.setConsultant(this.loadConsultant());
        this.initListeners();
        this.renderConsultant();
    }

    loadConsultant() {
        return {
            id: TSCookie.getConsultantId(),
            name: TSCookie.getConsultantName(),
            image: TSCookie.getConsultantImage(),
            hasOpenParty: TSCookie.getConsultantHasOpenParty(),
        };
    }

    saveCookies(consultant) {
        TSCookie.setConsultantId(consultant.id);
        TSCookie.setConsultantName(consultant.name);
        TSCookie.setConsultantImage(consultant.image);
        TSCookie.setConsultantHasOpenParty(consultant.hasOpenParty);
    }

    isExternalConsultant() {
        return this.consultant.id
            && this.consultant.id !== this.tsConsultantId;
    }

    bindFindConsultantTrigger() {
        this.$findConsultant.addEventListener('click', (e) => {
            // Github issue #179, go to consultant page
            if (this.consultant.id
                && this.consultant.id !== this.tsConsultantId
                && e.target.tagName !== 'SMALL'
                && !$(e.target).hasClass('consultant-edit')
                && !$(e.target).hasClass('consultant-remove')
            ) {
                window.location = this.consultantPage;
            } else if ($(e.target).hasClass('consultant-remove')) {
                this.removeAffiliation.openAlert();
            } else {
                this.createModal(e);
            }
        });
    }

    initListeners() {
        // Trigger modal or go to consultant page if clicking on
        // consultant name
        this.bindFindConsultantTrigger();

        // Consultant edit button in cart page
        $('body').on(
            'click',
            '.cart-affiliate-btn.consultant-edit',
            (e) => this.createModal(e),
        );

        // Consultant remove button in cart page
        $('body').on(
            'click',
            '.cart-affiliate-btn.consultant-remove',
            () => this.removeAffiliation.openAlert(),
        );

        $('body').on(
            'click',
            '#consultantparties-search-results .consultant-remove',
            () => this.removeAffiliation.openAlert(),
        );

        // Open consultant parties modal in cart
        $('body.cart').on(
            'click',
            '.view-consultant-parties',
            (e) => this.openConsultantParties(e),
        );

        // Open consultant parties modal in
        // party bar mobile
        $('.partybar').on(
            'click',
            '.view-consultant-parties',
            (e) => this.openConsultantParties(e),
        );

        // Trigger modal when the modaltrigger-consult class is present
        $('.modaltrigger-consult').on(
            'click',
            (e) => this.createModal(e),
        );

        // TS affiliate cart page
        $('body.cart #page-wrapper').on(
            'change',
            '#tsacf-findconsultant',
            (e) => {
                this.createModal(e);
                $(e.target).prop('checked', false);
            },
        );

        // Return
        $('body').on(
            'click',
            '.search-filter-wrapper .return-search',
            this.returnSearch.bind(this),
        );

        // Go back to search when editing consultant in consultant parties modal
        const $consultantSearch = document.querySelector(this.consultantSearchId);
        if (!$consultantSearch) {
            $('body').on(
                'click',
                '#consultantparties-search-results .consultant-edit',
                (e) => this.createModal(e),
            );
        } else {
            $('body').on(
                'click',
                '#consultantparties-search-results .consultant-edit',
                this.returnSearch.bind(this),
            );
        }

        // Search by ZIP
        $('body').on('submit', this.zipcodeSearchId, (e) => {
            e.preventDefault();
            this.searchInfo = {
                mode: this.searchByZip,
                zip: $(`${this.consultantSearchId} .zip-search input`).val(),
                radius: $(`${this.consultantSearchId} .zip-search select`).val(),
                page: 1,
            };

            this.search();
        });

        // Search by Name
        $('body').on('submit', this.nameSearchId, () => {
            this.searchInfo = {
                mode: this.searchByName,
                name: $(`${this.consultantSearchId} .name-search input`).val(),
                state: $(`${this.consultantSearchId} .name-search select`).val(),
                page: 1,
            };

            this.search();
        });

        // Search by ID
        $('body').on('submit', this.cidSearchId, () => {
            this.searchInfo = {
                mode: this.searchById,
                id: $(`${this.consultantSearchId} .id-search input`).val(),
                page: 1,
            };

            this.search();
        });

        // Select consultant result
        $('body').on(
            'click',
            `${this.searchResultsId} .consultant-card`,
            this.highlightConsultant.bind(this),
        );

        // Submit with consultant
        $('body').on('click', this.cidContinueId, () => this.continueWithSelection());

        // Submit with Tastefully Simple
        $('body').on('click', '#no-consultants-continue', () => this.continueWithInternal());

        $('body').on('click', '.consultantmodal-cancel-btn', () => this.closeModal());
    }

    createModal(e) {
        $('#modal').removeClass('modal-results');
        this.modal = defaultModal();
        e.preventDefault();
        this.modal.open({ size: 'small' });
        const template = this.modalTemplate;
        const options = { template };
        utils.api.getPage('/', options, (err, res) => {
            if (err) {
                console.error(`Failed to get${template}. Error:`, err);
                return false;
            } else if (res) {
                this.modalLoaded(res);
            }
        });
    }

    modalLoaded(result) {
        this.modal.updateContent(result);
        this.renderStatesSelect();

        // TST-475 make sure to close the partybar dropdown
        $('#partybar-find .partybar-arrow').addClass('fa-caret-right').removeClass('fa-caret-down');
        $('#partybar-find').removeClass('active');
        $('.partybar .partybar-accordion').css('max-height', '0px');
    }

    closeModal() {
        this.modal.close();
    }

    openConsultantParties(e) {
        const template = 'common/consultant-parties';
        $('#modal').removeClass('modal-results');
        this.modal = defaultModal();
        e.preventDefault();
        this.modal.open({ size: 'small' });
        const options = { template };
        utils.api.getPage('/', options, (err, res) => {
            if (err) {
                console.error(`Failed to get ${template}. Error:`, err);
                return false;
            } else if (res) {
                this.modal.updateContent(res);
                $('#consultantparties-search-results').show();
                this.renderConsultantParties(this.consultant);
            }
        });
    }

    renderStatesSelect() {
        const $statesSelect = document.querySelector(`${this.consultantSearchId} .name-search select`);
        return new StatesSelect($statesSelect);
    }

    returnSearch() {
        $(this.searchResultsId).hide();
        $('#consultantparties-search-results').hide();
        $('#modal').removeClass('modal-results');
        $('.alertbox-error').hide();
        $(this.consultantSearchId).show();
        this.clearConsultantWindow();
        window.selectedId = null;
        $('.next-step-selected-text').text('');
    }

    clearConsultantWindow() {
        $('.matching').remove();
        $('.consultant-card').remove();
        $('.consultant-divider').remove();
        $('.findmodal-pagination-container').remove();
    }

    displayError(err) {
        $(`${this.consultantSearchId} .alertbox-error span`).html(err);
        $(`${this.consultantSearchId} .alertbox-error`).show();
        $(`${this.consultantSearchId} .genmodal-body`).animate({ scrollTop: 0 });
    }

    search() {
        switch (this.searchInfo.mode) {
            case this.searchByZip:
                this.searchQuery = this.searchInfo.zip;

                this.api.searchConsultantsByZip(
                    this.searchInfo.zip,
                    this.searchInfo.radius,
                    this.searchInfo.page,
                    this.pageSize,
                )
                    .then(res => {
                        const statusCode = res.status.toString();
                        const newResponse = (statusCode[0] === '5') ? this.apiErrorMessage : res.json();
                        return newResponse;
                    })
                    .then(data => {
                        const newData = data.errorMessage
                            ? this.displayError(data.errorMessage)
                            : this.renderResults(data);
                        return newData;
                    })
                    .catch(err => {
                        console.warn('searchByZip', err);
                        this.displayError(err);
                    });
                break;

            case this.searchByName:
                this.searchQuery = `${this.searchInfo.name}, ${this.searchInfo.state}`;

                this.api.searchConsultantsByName(
                    this.searchInfo.name,
                    this.searchInfo.state,
                    this.searchInfo.page,
                    this.pageSize,
                )
                    .then(res => {
                        const statusCode = res.status.toString();
                        const newResponse = (statusCode[0] === '5') ? this.apiErrorMessage : res.json();
                        return newResponse;
                    })
                    .then(data => {
                        const newData = data.errorMessage
                            ? this.displayError(data.errorMessage)
                            : this.renderResults(data);
                        return newData;
                    })
                    .catch(err => {
                        console.warn('searchByName', err);
                        this.displayError(err);
                    });
                break;

            case this.searchById:
                this.searchQuery = this.searchInfo.id;

                this.api.getConsultant(this.searchInfo.id)
                    .then(res => {
                        const statusCode = res.status.toString();
                        const newResponse = (statusCode[0] === '5') ? this.apiErrorMessage : res.json();
                        return newResponse;
                    })
                    .then(data => {
                        const newData = data.errorMessage
                            ? this.displayError(data.errorMessage)
                            : this.renderResults(data);
                        return newData;
                    })
                    .catch(err => {
                        console.warn('searchById', err);
                        this.displayError(err);
                    });
                break;

            default:
                console.error('SearchInfo.mode:', this.searchInfo.mode);
                break;
        }
    }

    goToPage(p) {
        this.searchInfo.page = p;

        switch (this.searchInfo.mode) {
            case this.searchByZip:
                this.search();
                break;

            case this.searchByName:
                this.search();
                break;

            default:
                console.error('SearchInfo.mode:', this.searchInfo.mode);
                break;
        }
    }

    highlightConsultant(e) {
        // If "View my TS page" link is clicked,
        // do nothing. Don't select the consultant
        if ($(e.target).is('.ts-page-link .framelink-lg')) {
            return;
        }

        $('.consultant-header').show();
        $('.alertbox-error').hide();
        const $consultantCard = $(e.target).closest('.consultant-card');
        if (!$consultantCard.hasClass('selected')) {
            window.selectedId = $consultantCard.data('cid');
            $(`${this.searchResultsId} .selected`).toggleClass('selected');
            $consultantCard.find('.consultant-header').hide();
            $(this.cidContinueId).attr('disabled', false);
        } else {
            $consultantCard.find('.consultant-header').show();
            window.selectedId = null;
            $(this.cidContinueId).attr('disabled', true);
        }

        $(e.target).closest('.consultant-card').toggleClass('selected');
        const consultantName = $('.selected .consultant-name').text();
        const $nextStepText = $(`${this.searchResultsId} .next-step-selected-text`);
        if (window.selectedId) {
            $nextStepText
                .html(`You have selected <span>${consultantName}</span> as your consultant`);
        } else {
            $nextStepText.text('');
        }
    }

    continueWithSelection() {
        if (window.selectedId) {
            this.continue({
                id: window.selectedId,
                name: $('.selected .consultant-name').text(),
                image: $('.selected .consultant-image img').attr('src'),
                hasOpenParty: $('.selected').data('copenparty'),
            });
            this.deletePartyCookies();
        } else {
            this.displayError('Please select a consultant before continuing');
        }
    }

    continueWithInternal() {
        this.continue({
            id: this.tsConsultantId,
            name: 'Tastefully Simple',
            image: null,
            hasOpenParty: false,
        });
        this.deletePartyCookies();
    }

    continue(consultant) {
        if (consultant.hasOpenParty) {
            this.renderConsultantParties(consultant);
        } else if (this.isOnCartPage() && !consultant.hasOpenParty) {
            this.saveCookies(consultant);
            window.location = this.cartPage;
        } else if (this.isOnConsultantPage() && !consultant.hasOpenParty) {
            this.saveCookies(consultant);
            window.location = this.consultantPage;
        } else {
            // TST-475 set partybar to its default text
            $('.partybar-main-text').text('Find a Party or Fundraiser');

            this.saveCookies(consultant);
            this.modal.close();
        }

        this.setConsultant(consultant);
    }

    // consultant = { id: string, name: null|string, image: string }
    setConsultant(consultant) {
        this.consultant = consultant;
        this.renderConsultant();
    }

    renderConsultant() {
        // Main consultant DOM rendering
        this.defaultConsultantHtml =
            `<span class="fa fa-map-marker fa-lg" aria-hidden="true"></span>
                <span class="headertoplinks-consult-text">Find a Consultant</span>`;

        if (window.innerWidth <= this.screenMinWidth) {
            this.renderConsultantInMobileMenu();
        } else {
            this.renderConsultantInHeader();
        }
    }

    renderConsultantInMobileMenu() {
        $('.navPages-container .navPages').prepend(this.$findConsultant);

        if (this.isExternalConsultant()) {
            if (TSCookie.getConsultantId() === this.consultant.id) {
                this.$findConsultant.classList.add('consultant-mobile');
                this.$findConsultant.innerHTML = this.consultantInMobileHtml();
                $('.find-consultant-m .consultant-img').attr('src', this.consultant.image);
            }
        } else {
            this.$findConsultant.innerHTML = this.defaultConsultantHtml;
        }
    }

    consultantInMobileHtml() {
        const html =
            `<div class="find-consultant-m">
                <img class="consultant-img"
                     src="https://consultant.api.tastefullysimple.com/image/profile/noconsultantphoto.png"
                     alt="Photograph thumbnail of ${this.consultant.name}"
                     style="display: initial;">
                ${this.consultantInfoHtml()}
            </div>`;

        return html;
    }

    consultantInfoHtml() {
        const html =
            `<div class="consultant-info">
                <p class="framelink-xl consultant-name">${this.consultant.name}</p>
                <div class="consultant-info-control">
                    <p class="frame-subhead">
                        <span>is my consultant</span>
                        <button type="button" class="framelink-sm">
                            <span class="consultant-edit">edit</span>
                        </button>
                        <span class="verbar">&verbar;</span>
                        <button type="button" class="framelink-sm">
                            <span class="cart-affilitiate-btn consultant-remove">remove</span>
                        </button>
                    </p>
                </div>
            </div>`;

        return html;
    }

    renderConsultantInHeader() {
        $('.header-top .header-top-links').prepend(this.$findConsultant);

        // Account for consultant in the sticky header
        const $header = $('#headerMain');
        const offsetTop = $header.offset().top;
        const isStickyHeader = $header.hasClass('sticky-header');
        const isStickyHeaderDisabled = !isStickyHeader && !(window.pageYOffset === offsetTop);

        if (this.isExternalConsultant() && isStickyHeaderDisabled) {
            if (TSCookie.getConsultantId() === this.consultant.id) {
                this.$findConsultant.setAttribute('title', `${this.consultant.name} is your Consultant`);
                this.$findConsultant.innerHTML = this.consultantInfoHtml();
            }
        } else {
            this.$findConsultant.innerHTML = this.defaultConsultantHtml;
        }
    }

    isOnConsultantPage() {
        return document.location.pathname.includes(this.consultantPage);
    }

    isOnPartyDetailsPage() {
        const url = document.location.pathname;

        return url.match(/^\/p\/\d+/ig) !== null;
    }

    isOnCartPage() {
        return document.location.pathname === this.cartPage;
    }

    deletePartyCookies() {
        if (this.isOnPartyDetailsPage()) {
            document.location = this.partyDetailsPage;
        }

        const $partyBarText = $('#partybar-find .partybar-text');
        $partyBarText.text('Find a party');

        TSCookie.deleteParty();
    }
    /*
     * HTML
     */
    renderResults(response) {
        window.selectedId = null;

        if (response.Results) {
            this.renderHasResults(response);
        } else {
            this.renderNoResults();
        }
    }

    renderHasResults(response) {
        $(this.consultantSearchId).hide();
        $('.alertbox-error').hide();
        this.clearConsultantWindow();

        const $matchingConsultants = $('<span>', { class: 'frame-caption matching' });
        $matchingConsultants.text(`${response.TotalRecordCount} Consultant's Matching \"${this.searchQuery}\"`);
        $(`${this.searchResultsId} .genmodal-body .search-filter-wrapper`).append($matchingConsultants);

        const consultantCard = new ConsultantCard();
        // Get consultant-card template
        consultantCard.getTemplate().then(template => {
            response.Results.forEach((consultant) => {
                const consultantCardHtml = consultantCard.insertConsultantData(template, consultant);
                $(`${this.searchResultsId} .buy-wide-card`).append(consultantCardHtml);
            });

            $(this.searchResultsId).show();
            $('#modal').addClass('modal-results');

            // Pagination is only needed if search result is more than 1 record
            if (this.searchInfo.mode !== this.searchById && response.TotalRecordCount > 1) {
                this.getPagination(response);
            }
        });
    }

    renderNoResults() {
        $.when(this.displayError('<strong>No consultant was found.</strong><br>'
            + ' Revise your search or shop directly with Tastefully Simple.'))
            .then(() => {
                this.displayNoResultsButton();
            });
    }

    displayNoResultsButton() {
        // to clear out the no-consultants-continue button
        // when user tries to search again with no results found
        $('#no-consultants-continue').remove();

        const $errorWrapper = $(`${this.consultantSearchId} .alertbox-error p`);
        const $tSimpleBtn = $('<button>', { id: 'no-consultants-continue', class: 'button-secondary' });
        $tSimpleBtn.text('shop with tastefully simple');
        $errorWrapper.append($tSimpleBtn);
    }

    renderConsultantParties(consultant) {
        window.selectedId = window.selectedId ? window.selectedId : TSCookie.getConsultantId();

        const consultantParties =
            new ConsultantParties(
                window.selectedId,
                this.modal,
                consultant,
                this.renderConsultant.bind(this),
            );

        return consultantParties;
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
            this.displayNumPages,
            (p) => this.goToPage(p),
        );

        $paginationContainer.append($paginationText);
        $paginationContainer.append($paginationList);
        $(`${this.searchResultsId} .findmodal-footer`).prepend($paginationContainer);
    }
}
