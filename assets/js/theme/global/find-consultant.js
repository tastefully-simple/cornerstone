import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';
import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';
import StatesSelect from '../common/directory/states.js';
import pagination from '../common/pagination.js';

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

const NO_SEARCH = 0;
const SEARCH_BY_ZIP = 1;
const SEARCH_BY_NAME = 2;
const SEARCH_BY_ID = 3;

// Number of page numbers to show in pagination
const DISPLAY_NUM_PAGES = 6;

class FindAConsultant {
    constructor(trigger, template) {
        this.$findConsultant = trigger;
        this.searchInfo = { mode: NO_SEARCH };
        this.pageSize = 10;

        // API
        this.api = new TSApi();

        // Modal
        trigger.addEventListener('click', (e) => this.createModal(e, template));

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
        $('body').on('click', '.consultant-card', this.selectConsultant.bind(this));
        
        // Submit
        $('body').on('click', '#consultant-continue', () => this.continue())

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

            // Insert consultant name in the header
            this.insertConsultantNameInHeader();

            this.modal.close();
        } else {
            this.displayError("Please select a consultant before continuing");
        }
    }

    insertConsultantNameInHeader() {
        let consultantName = TSCookie.GetConsultantName();
        let nameHtml = 
            `<span>
                <strong>${consultantName}</strong> is your Consultant <small>(edit)</small>
            </span>`;
        let defaultConsultantHtml =
            `<span class="fa fa-map-marker fa-fw" aria-hidden="true"></span>
             <span class="headertoplinks-consult-text">Find a Consultant</span>`;

        let $header = $('#headerMain');
        let offsetTop = $header.offset().top;
        let isStickyHeader = $header.hasClass('sticky-header');

        if (consultantName && !isStickyHeader && !(window.pageYOffset > offsetTop)) {
            this.$findConsultant.innerHTML = nameHtml;
        } else {
            this.$findConsultant.innerHTML = defaultConsultantHtml;
        }
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

    /*
     * HTML
     */
    renderResults(response) {
        if (!response.Results) {
            this.displayError("No consultant was found. Search again or shop directly with Tastefully Simple, Inc.");
            return;
        }
        $("#consultant-search").hide();
        $('.alertbox-error').hide();
        this.clearConsultantWindow();

        var $matchingConsultants = $("<span>", {"class": "system-14 matching"});
        $matchingConsultants.text(`Consultants matching \"${response.TotalRecordCount}\"`);
        $("#consultant-search-results .buy-wide-card").append($matchingConsultants);

        //Generate consultant and divider html
        response.Results.forEach((consultant) => {
            var $consultantHtmlBlock = this.getConsultantHtmlBlock(consultant);
            var $dividerHtml = $("<div>", {"class": "consultant-divider"});
            $("#consultant-search-results .buy-wide-card").append($consultantHtmlBlock);
            $("#consultant-search-results .buy-wide-card").append($dividerHtml);
        });

        $("#consultant-search-results").show();

        // Pagination is only needed when searching by zipcode or searching by name
        // Searching by Consultant Id should produce only 1 result
        if (this.searchInfo.mode != SEARCH_BY_ID) {
            var $paginationContainer = $("<div>", {"class": "consultant-pagination pagination"});
            $("#consultant-search-results .genmodal-body").append($paginationContainer);
            pagination(
                $paginationContainer,
                response.CurrentPage,
                Math.ceil(response.TotalRecordCount / response.PageSize),
                DISPLAY_NUM_PAGES,
                ((p) => this.goToPage(p))
            );
        }

        var $footerHtml = this.getFooterHtml()
        $("#consultant-search-results .genmodal-body").append($footerHtml);
    }

    getConsultantHtmlBlock(consultant) {
        var $blockHtml = $("<div>", {
            "class": "consultant-card",
            "data-cid" : consultant.ConsultantId
        });

        var $selectedHeaderHtml = this.getSelectedHeaderHtml();
        $blockHtml.append($selectedHeaderHtml);
        var $imageHtml = this.getImageHtml(consultant.Image);
        $blockHtml.append($imageHtml);
        var $consultantInfoHtml = this.getInfoHtml(consultant);
        $blockHtml.append($consultantInfoHtml);
        return $blockHtml;
    }

    getSelectedHeaderHtml() {
        var $selectedHeaderHtml = $("<div>", {"class": "selected-header"});
        var $iconHtml = $("<span>", {"class": "check-icon"});
        $selectedHeaderHtml.append($iconHtml);
        var $titleContainerHtml = $("<div>", {"class": "vertical-center"});
        var $titleHtml = $("<span>", {"class": "selection-title"});
        $titleHtml.text("Selected");
        $titleContainerHtml.append($titleHtml);
        $selectedHeaderHtml.append($titleContainerHtml);
        return $selectedHeaderHtml;
    }

    getImageHtml(image) {
        var $imageContainerHtml = $("<div>", {"class": "consultant-image"});
        var $imageHtml = $("<img>");
        $imageHtml.attr("src", image);
        $imageHtml.attr("onerror", "this.onerror=null;this.src='https://www.tastefullysimple.com/_/media/images/noconsultantphoto.png';");
        $imageContainerHtml.append($imageHtml);
        return $imageContainerHtml;
    }

    getInfoHtml(consultant) {
        var $infoContainerHtml = $("<div>", {"class": "consultant-info"});
        var $nameHtml = $("<h5>", {"class": "frameheading-5 consultant-name"});
        $nameHtml.text(consultant.Name);
        $infoContainerHtml.append($nameHtml);
        var $innerContainerHtml = $("<div>", {"class": "system-14"});

        var $titleHtml = $("<span>");
        $titleHtml.text(consultant.Title);
        $innerContainerHtml.append($titleHtml);

        var $phoneHtml = this.getPhoneHtml(consultant.PhoneNumber);
        $innerContainerHtml.append($phoneHtml);

        var $emailHtml = this.getEmailHtml(consultant.EmailAddress);
        $innerContainerHtml.append($emailHtml);

        var $addressHtml = $("<span>");
        $addressHtml.text(consultant.Location);
        $innerContainerHtml.append($addressHtml);

        var $pageLinkHtml = this.getPageLinkHtml();
        $innerContainerHtml.append($pageLinkHtml);

        $infoContainerHtml.append($innerContainerHtml);

        return $infoContainerHtml;
    }

    getPhoneHtml(phoneNumber) {
        var $phoneHtml = $("<div>", {"class": "consultant-phone"});
        var $iconHtml = $("<span>", {"class": "icon-system-phone"});
        $phoneHtml.append($iconHtml);
        var $textContainerHtml = $("<div>", {"class": "vertical-center system-14"});
        var $textHtml = $("<span>");
        $textHtml.text(phoneNumber);
        $textContainerHtml.append($textHtml);
        $phoneHtml.append($textContainerHtml);
        return $phoneHtml;
    }

    getEmailHtml(email) {
        var $emailHtml = $("<div>", {"class": "consultant-email"});
        var $iconHtml = $("<span>", {"class": "icon-system-envelope"});
        $emailHtml.append($iconHtml);
        var $textContainerHtml = $("<div>", {"class": "vertical-center system-14"}); 
        var $textHtml = $("<span>");
        $textHtml.text(email);
        $textContainerHtml.append($textHtml);
        $emailHtml.append($textContainerHtml);
        return $emailHtml;
    }

    getPageLinkHtml() {
        var $pageLinkHtml = $("<div>", {"class": "ts-page-link"});
        var $linkContainerHtml = $("<div>", {"class": "vertical-center"});
        var $linkHtml = $("<a>", {"class": "framelink-lg"});
        $linkHtml.text("View my TS page");
        $linkHtml.attr("href", "#");
        $linkContainerHtml.append($linkHtml);
        $pageLinkHtml.append($linkContainerHtml);
        var $iconHtml = $("<span>", {"class": "icon-system-download"});
        $pageLinkHtml.append($iconHtml);
        return $pageLinkHtml;
    }

    getFooterHtml() {
        var $footerHtml = $("<div>", {"class": "consultant-footer"});
        var $youHaveSelectedHtml = $("<span>", {"id": "you-have-selected", "class": "system-14"});
        $footerHtml.append($youHaveSelectedHtml);
        var $continueHtml = $("<button>", {"id": "consultant-continue", "class": "button-secondary-icon"});
        $continueHtml.text("continue");
        $footerHtml.append($continueHtml);
        return $footerHtml;
    }
}
