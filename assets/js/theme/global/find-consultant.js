import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';
import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';
import StatesSelect from '../common/directory/states.js';
import pagination from '../common/pagination.js';
import ConsultantCard from '../common/consultant-card';

/**
 * Creates a Cornerstone popup modal for Find A Consultant. 
 * A second view is available once the user hits search. The modal is then 
 * populated with data from the user's search parameters
 */
export default function() {
    $(document).ready(function() {
        let consultant = new FindAConsultant(
            document.querySelector('.headertoplinks-consult'),
            'common/find-consultant'
        );
    });
}

// Consultants
const TST_CONSULTANT_ID = "0160785";

// Search mode
const NO_SEARCH = 0;
const SEARCH_BY_ZIP = 1;
const SEARCH_BY_NAME = 2;
const SEARCH_BY_ID = 3;

// Pagination
const DISPLAY_NUM_PAGES = 6;

// Redirect
const CONSULTANT_PAGE = '/web';
const PARTY_DETAILS_PAGE = '/party-details';

class FindAConsultant {
    constructor(trigger, template) {
        this.$findConsultant = trigger;
        this.searchInfo = { mode: NO_SEARCH };
        this.pageSize = 10;

        // API
        this.api = new TSApi();

        // Modal
        trigger.addEventListener('click', (e) => {
            let consultantId = TSCookie.GetConsultantId();
            // Github issue #179, go to consultant page
            if (consultantId && consultantId != TST_CONSULTANT_ID && e.target.tagName != 'SMALL') {
                window.location = CONSULTANT_PAGE;
            } else {
                this.createModal(e, template);
            }
        });

        // Consultant bar in cart page
        $('.cart-affiliate-info button').on('click', (e) => this.createModal(e,template));

        // Return
        $('body').on('click', '.return-search', this.returnSearch.bind(this));

        // Search by ZIP
        $('body').on('submit', '#zipcode-search-form', () => {
            this.searchInfo = {
                mode: SEARCH_BY_ZIP,
                zip: $('#consultant-search .zip-search input').val(),
                radius: $('#consultant-search .zip-search select').val(),
                page: 1
            };

            this.search();
        });

        // Search by Name
        $('body').on('submit', '#name-search-form', () => {
            this.searchInfo = {
                mode: SEARCH_BY_NAME,
                name: $('#consultant-search .name-search input').val(),
                state: $('#consultant-search .name-search select').val(),
                page: 1
            };

            this.search();
        });

        // Search by ID
        $('body').on('submit', '#id-search-form', () => {
            this.searchInfo = {
                mode: SEARCH_BY_ID,
                id: $('#consultant-search .id-search input').val(),
                page: 1
            };

            this.search();
        });

        // Select
        $('body').on('click', '#consultant-search-results .consultant-card', this.selectConsultant.bind(this));
        
        // Submit with consultant
        $('body').on('click', '#consultant-continue', () => this.continue());
        // Submit with Tastefully Simple
        $('body').on('click', '#no-consultants-continue', () => this.shopWithTsimple());

        // Move "Find a Consultant" into the main menu in mobile view
        this.screenMinWidth = 801;
        this.moveConsultantEl(trigger, this.screenMinWidth);
        $(window).on('resize', () => this.moveConsultantEl(trigger, this.screenMinWidth));

        // Insert consultant name in the header
        this.insertConsultantNameInHeader();
        // Account for sticky header
        $(window).on('scroll', () => this.insertConsultantNameInHeader());
    }

    createModal(e, template) {
        this.modal = defaultModal();
        e.preventDefault();
        this.modal.open({ size: 'large' });
        const options = { template: template };
        utils.api.getPage('/', options, (err, res) => {
            if (err) {
                console.error('Failed to get common/find-consultant. Error:', err);
                return false;
            } else if (res) {
                this.modalLoaded(res);
            }
        });
    }

    modalLoaded(result) {
        this.modal.updateContent(result);
        let nameSelects = $('#consultant-search .name-search select');
        for (let i = 0; i < nameSelects.length; i++) {
            new StatesSelect(nameSelects[i]);
        }
    }

    returnSearch() {
        $("#consultant-search-results").hide();
        $('.alertbox-error').hide();
        $("#consultant-search").show();
        this.clearConsultantWindow();
    }

    clearConsultantWindow() {
        $(".matching").remove();
        $(".consultant-card").remove();
        $(".consultant-divider").remove();
        $(".consultant-pagination").remove();
        $(".consultant-footer").remove();
    }

    displayError(err) {
        $('.alertbox-error span').text(err);
        $('.alertbox-error').show();
    }

    search() {
        switch (this.searchInfo.mode) {
            case SEARCH_BY_ZIP:
                this.api.searchConsultantsByZip(
                        this.searchInfo.zip,
                        this.searchInfo.radius,
                        this.searchInfo.page,
                        this.pageSize
                    )
                    .then(res => res.json())
                    .then(data => {
                        this.renderResults(data);
                    })
                    .catch(err => { 
                        console.warn('searchByZip', err); 
                        this.displayError(err);
                    });
                break;

            case SEARCH_BY_NAME:
                this.api.searchConsultantsByName(
                        this.searchInfo.name,
                        this.searchInfo.state,
                        this.searchInfo.page,
                        this.pageSize
                    )
                    .then(res => res.json())
                    .then(data => {
                        this.renderResults(data);
                    })
                    .catch(err => { 
                        console.warn('searchByName', err);
                        this.displayError(err);
                    });
                break;

            case SEARCH_BY_ID:
                this.api.getConsultant(this.searchInfo.id)
                    .then(res => res.json())
                    .then(data => {
                        this.renderResults(data);
                    })
                    .catch(err => { 
                        console.warn('searchById', err);
                        this.displayError(err);
                    });
                break;
        }
    }

    goToPage(p) {
        this.searchInfo.page = p;

        switch (this.searchInfo.mode) {
            case SEARCH_BY_ZIP:
                this.search()
                break;

            case SEARCH_BY_NAME:
                this.search();
                break;
        }

    }

    selectConsultant(e) {
        if (!($(e.target).hasClass('consultant-card') || $(e.target).is('img'))) {
            return true;
        }
        $('.alertbox-error').hide();
        var $consultantCard = $(e.target).closest(".consultant-card");
        if (!$consultantCard.hasClass("selected")) {
            this.selectedId = $consultantCard.data('cid');
            $(".selected").toggleClass("selected");
        } else {
            this.selectedId = null;
        }

        $(e.target).closest(".consultant-card").toggleClass("selected");
        var consultantName = $(".selected .consultant-name").text();
        $("#you-have-selected").html(`You have selected <span>${consultantName}</span> as your consultant`);
    }

    continue() {
        if (this.selectedId) {
            // Set cookie for consultant name
            let consultantName = $(".selected .consultant-name").text();
            TSCookie.SetConsultantName(consultantName);
            // Set cookie for consultant ID
            TSCookie.SetConsultantId(this.selectedId);

            if (this.isOnConsultantPage()) {
                window.location = CONSULTANT_PAGE;
            } else {
                // Insert consultant name in the header
                this.insertConsultantNameInHeader();
                this.modal.close();
            }

            // Delete party cookies
            this.deletePartyCookies();
        } else {
            this.displayError("Please select a consultant before continuing");
        }
    }

    shopWithTsimple() {
        // Set cookie for consultant name
        TSCookie.SetConsultantName("Tastefully Simple");
        // Set cookie for consultant ID
        TSCookie.SetConsultantId(TST_CONSULTANT_ID);

        if (this.isOnConsultantPage()) {
            window.location = CONSULTANT_PAGE;
        } else {
            // Insert consultant name in the header
            this.insertConsultantNameInHeader();
            this.modal.close();
        }
    }

    insertConsultantNameInHeader() {
        let consultantId = TSCookie.GetConsultantId();
        let consultantName = TSCookie.GetConsultantName();

        let defaultConsultantHtml =
            `<span class="fa fa-map-marker fa-fw" aria-hidden="true"></span>
                <span class="headertoplinks-consult-text">Find a Consultant</span>`;
        
        if (consultantId && consultantId != TST_CONSULTANT_ID) {
            let nameHtml = 
                `<span>
                    <strong>${consultantName}</strong> is your Consultant
                    <small>(edit)</small>
                </span>`;

            this.$findConsultant.innerHTML = nameHtml;
            $('.cart-affiliate').css('height', 'initial');
            $('.cart-affiliate-btn').text('(edit)');
            $('.cart-affiliate-img').css('display', 'initial');
        }
        else {
            this.$findConsultant.innerHTML = defaultConsultantHtml;
            $('.cart-affiliate').css('height', '83px');
            $('.cart-affiliate-btn').text('(Find a Consultant)');
            $('.cart-affiliate-img').css('display', 'none');
        }

        $('.affiliate-name').text(consultantName);

        // let $header = $('#headerMain');
        // let offsetTop = $header.offset().top;
        // let isStickyHeader = $header.hasClass('sticky-header');
        
        // if (consultantName && consultantId != TST_CONSULTANT_ID && !isStickyHeader && !(window.pageYOffset > offsetTop)) {
        //     this.$findConsultant.innerHTML = nameHtml;
        //     // Consultant bar in cart page
        // } else {
        //     this.$findConsultant.innerHTML = defaultConsultantHtml;
        // }
    }

    moveConsultantEl($consultant, screenMinWidth) {
        let $navPages = $('.navPages-container .navPages');
        let $topHeader = $('.header-top .header-top-links');

        if (window.innerWidth >= screenMinWidth) {
            // Put back consultant in the top header
            $topHeader.prepend($consultant);
        } else {
            // Add consultant to mobile main menu
            $navPages.prepend($consultant);
        }
    }

    isOnConsultantPage() {
        return document.location.pathname == CONSULTANT_PAGE;
    }

    isOnPartyDetailsPage() {
        return document.location.pathname == PARTY_DETAILS_PAGE;
    }

    deletePartyCookies() {
        if (this.isOnPartyDetailsPage()) {
            document.location = PARTY_DETAILS_PAGE;
        }

        let $partyBarText = $('#partybar-find .partybar-text');
        $partyBarText.text('Find a party');

        TSCookie.DeleteParty();
    }
    /*
     * HTML
     */
    renderResults(response) {
        if (response.Results) {
            this.renderHasResults(response);
        } else {
            this.renderNoResults(response);
        }
    }

    renderHasResults(response) {
        $("#consultant-search").hide();
        $('.alertbox-error').hide();
        this.clearConsultantWindow();

        var $matchingConsultants = $("<span>", {"class": "system-14 matching"});
        $matchingConsultants.text(`Consultants matching \"${response.TotalRecordCount}\"`);
        $("#consultant-search-results .buy-wide-card").append($matchingConsultants);

        const consultantCard = new ConsultantCard();
        let that = this;
        // Get consultant-card template
        consultantCard.getTemplate().then(function(template) {

            response.Results.forEach((consultant) => {
                const consultantCardHtml = consultantCard.insertConsultantData(template, consultant);
                $("#consultant-search-results .buy-wide-card").append(consultantCardHtml);
            });

            $("#consultant-search-results").show();

            // Pagination is only needed when searching by zipcode or searching by name
            // Searching by Consultant Id should produce only 1 result
            if (that.searchInfo.mode != SEARCH_BY_ID) {
                var $paginationContainer = $("<div>", {"class": "consultant-pagination pagination"});
                $("#consultant-search-results .genmodal-body").append($paginationContainer);
                pagination(
                    $paginationContainer,
                    response.CurrentPage,
                    Math.ceil(response.TotalRecordCount / response.PageSize),
                    DISPLAY_NUM_PAGES,
                    ((p) => that.goToPage(p))
                );
            }

            $("#consultant-search-results .genmodal-body")
                .append(that.getResultsFooterHtml());
        });
    }

    renderNoResults(response) {
        this.displayError(
            "No consultant was found."
            + " Search again or shop directly with Tastefully Simple, Inc."
        );

        $("#consultant-search .genmodal-body")
            .append(this.getNoResultsFooterHtml());
    }

    getResultsFooterHtml() {
        var $footerHtml = $("<div>", {"class": "consultant-footer"});
        var $youHaveSelectedHtml = $("<span>", {"id": "you-have-selected", "class": "system-14"});
        $footerHtml.append($youHaveSelectedHtml);
        var $continueHtml = $("<button>", {"id": "consultant-continue", "class": "button-secondary-icon"});
        $continueHtml.text("continue");
        $footerHtml.append($continueHtml);
        return $footerHtml;
    }

    getNoResultsFooterHtml() {
        var $parent = $("#consultant-search .genmodal-body");

        // If no footer (i.e. "Shop with TST" button) is found, then return one
        if ($parent.find(".consultant-footer").length == 0) {
            var $footerHtml = $("<div>", {"class": "consultant-footer"});
            var $tSimpleBtn = $("<button>", {"id": "no-consultants-continue", "class": "button-secondary-icon"});
            $tSimpleBtn.text("Shop with Tastefully Simple");
            $footerHtml.append($tSimpleBtn);
            return $footerHtml;
        }
    }
}
