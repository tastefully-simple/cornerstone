import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';
import TSApi from '../common/tsapi';
import StatesSelect from '../common/directory/states.js';

/**
 * Creates a Cornerstone popup modal for Find A Consultant. 
 * A second view is available once the user hits search. The modal is then 
 * populated with data from the user's search parameters
 */
export default function() {
    $(document).ready(function() {
        let consultant = new FindAConsultant(
            document.querySelector('.headertoplinks-consult'),
            'common/find-consultant',
            window.theme_settings.social_bug_affiliate_url
        );
    });
}

class FindAConsultant {
    constructor(trigger, template, continueUrl) {
        this.continueUrl = continueUrl;

        // API
        this.api = new TSApi();

        // Modal
        trigger.addEventListener('click', (e) => this.createModal(e,template));

        // Return
        $('body').on('click', '.return-search', this.returnSearch.bind(this));

        // Searches
        const buttonSel = (t) => '#consultant-search .' + t + '-search .button-alternate';
        $('body').on('click', buttonSel('zip'), () => this.searchByZip());
        $('body').on('click', buttonSel('name'), () => this.searchByName());
        $('body').on('click', buttonSel('id'), () => this.searchById());

        // Select
        $('body').on('click', '.consultant-card', this.selectConsultant.bind(this));
        
        // Submit
        $('body').on('click', '#consultant-continue', () => this.continue())

        // Move "Find a Consultant" into the main menu in mobile view
        this.screenMinWidth = 801;
        this.moveConsultantEl(trigger, this.screenMinWidth);
        $(window).on('resize', () => this.moveConsultantEl(trigger, this.screenMinWidth));
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
        $("#consultant-search").show();
        $(".matching").remove();
        $(".consultant-card").remove();
        $(".consultant-divider").remove();
        $(".consultant-footer").remove();
    }

    displayError(err) {
        $('.alertbox-error span').text(err);
        $('.alertbox-error').show();
    }

    searchByZip() {
        $('.zip-search form').closest('form').submit();
        let zip = $('#consultant-search .zip-search input').val();
        if (zip === "") {
            return;
        }
        this.api.searchConsultantsByZip(zip, "100", "1", "20")
            .then(res => res.json())
            .then(data => this.renderResults(data))
            .catch(err => { 
                console.warn('searchByZip', err); 
                this.displayError(err);
            });
    }

    searchByName() {
        $('.name-search').closest('form').submit();
        let name  = $('#consultant-search .name-search input').val();
        let state = $('#consultant-search .name-search select').val();
        if (state == "") {
            return;
        }

        this.api.searchConsultantsByName(name, state, "1", "20")
            .then(res => res.json())
            .then(data => this.renderResults(data))
            .catch(err => { 
                console.warn('searchByName', err);
                this.displayError(err);
            });
    }

    searchById() {
        $('.id-search').closest('form').submit();
        let id = $('#consultant-search .id-search input').val();
        if (id === "") {
            return;
        }
        this.api.getConsultant(id)
            .then(res => res.json())
            .then(data => this.renderResults(data))
            .catch(err => { 
                console.warn('searchById', err);
                this.displayError(err);
            });
    }

    selectConsultant(e) {
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
          let frame = document.createElement('iframe');
          frame.style.display = 'none';
          frame.src = this.continueUrl + this.selectedId;
          document.body.appendChild(frame);
          this.modal.close();
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
        $("#consultant-search").hide();

        var $matchingConsultants = $("<span>", {"class": "system-14 matching"});
        $matchingConsultants.text(`Consultants matching \"${response.TotalRecordCount}\"`);
        $("#consultant-search-results .buy-wide-card").append($matchingConsultants);

        //Generate consultant and divider html
        /*
        */

        response.Results.forEach((consultant) => {
            var $consultantHtmlBlock = this.getConsultantHtmlBlock(consultant);
            var $dividerHtml = $("<div>", {"class": "consultant-divider"});
            $("#consultant-search-results .buy-wide-card").append($consultantHtmlBlock);
            $("#consultant-search-results .buy-wide-card").append($dividerHtml);
        });

        $("#consultant-search-results").show();

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
        $imageHtml.attr("src", image.url);
        $imageHtml.attr("alt", image.alt);
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
