import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';

/**
 * Creates a Cornerstone popup modal for Find A Consultant. 
 * A second view is available once the user hits search. The modal is then 
 * populated with data from the user's search parameters
 */
export default function() {
  $(document).ready(function() {
    let consultant = new FindAConsultant(
        document.querySelector('.headertoplinks-consult')
    );
  });
}

class FindAConsultant {
  constructor(trigger, template = 'common/find-consultant') {
    trigger.addEventListener('click', (e) => this.createModal(e,template));
    $('body').on('click', '.return-search', this.returnSearch.bind(this));
    $('body').on('click', '#consultant-search .button-alternate', this.displayConsultantsResult.bind(this));
    $('body').on('click', '.consultant-card', this.selectConsultant.bind(this));
  }

  createModal(e, template) {
    const modal = defaultModal();
    e.preventDefault();
    modal.open({ size: 'large' });
    const options = { template: template }
    utils.api.getPage('/', options, (err, res) => {
      if (err) {
        console.error('Failed to get common/find-consultant. Error:', err);
        return false;
      } else if (res) {
        modal.updateContent(res);
      }
    });
    return modal;
  }

  returnSearch() {
    $("#consultant-search-results").hide();
    $("#consultant-search").show();
    $(".matching").remove();
    $(".consultant-card").remove();
    $(".consultant-divider").remove();
    $(".consultant-footer").remove();
  }

  displayConsultantsResult() {

    var consultantsResult = this.getConsultantSearchResults();
    $("#consultant-search").hide();

    var $matchingConsultants = $("<span>", {"class": "system-14 matching"});
    $matchingConsultants.text(`Consultants matching \"${consultantsResult.results}\"`);
    $("#consultant-search-results .buy-wide-card").append($matchingConsultants);

    //Generate consultant and divider html
    consultantsResult.consultants.forEach(function(consultant) {
      var $consultantHtmlBlock = this.getConsultantHtmlBlock(consultant);
      var $dividerHtml = $("<div>", {"class": "consultant-divider"});
      $("#consultant-search-results .buy-wide-card").append($consultantHtmlBlock);
      $("#consultant-search-results .buy-wide-card").append($dividerHtml);
    }.bind(this));

    $("#consultant-search-results").show();

    var $footerHtml = this.getFooterHtml()
    $("#consultant-search-results .genmodal-body").append($footerHtml);
  }

  /**
   * Makes an API call to retrieve consultants (based off of search parameters)
   * and returns the data in a json object
   */
  getConsultantSearchResults(searchParameters = 1) {
    var json = {
      results: 999,
      consultants: [
        {
          name: "Sally Sue Hernandez" ,
          title: "Diamond",
          phone: "214-555-5555",
          email: "test-email@gmail.com",
          image: {
            url: "https://lh3.googleusercontent.com/IeNJWoKYx1waOhfWF6TiuSiWBLfqLb18lmZYXSgsH1fvb8v1IYiZr5aYWe0Gxu-pVZX3",
            alt: ""
          },
          address: "Minneapolis, MN 55608"
        },
        {
          name: "Dally Due Hernandez" ,
          title: "Diamond",
          phone: "214-555-5551",
          email: "test-email1@gmail.com",
          image: {
            url: "https://lh3.googleusercontent.com/IeNJWoKYx1waOhfWF6TiuSiWBLfqLb18lmZYXSgsH1fvb8v1IYiZr5aYWe0Gxu-pVZX3",
            alt: ""
          },
          address: "Minneapolis, MN 55608"
        },
        {
          name: "Tally Tue Hernandez" ,
          title: "Diamond",
          phone: "214-555-5552",
          email: "test-email2@gmail.com",
          image: {
            url: "https://lh3.googleusercontent.com/IeNJWoKYx1waOhfWF6TiuSiWBLfqLb18lmZYXSgsH1fvb8v1IYiZr5aYWe0Gxu-pVZX3",
            alt: ""
          },
          address: "Minneapolis, MN 55608"
        },
        {
          name: "Rally Rue Hernandez" ,
          title: "Diamond",
          phone: "214-555-5553",
          email: "test-email3@gmail.com",
          image: {
            url: "https://lh3.googleusercontent.com/IeNJWoKYx1waOhfWF6TiuSiWBLfqLb18lmZYXSgsH1fvb8v1IYiZr5aYWe0Gxu-pVZX3",
            alt: ""
          },
          address: "Minneapolis, MN 55608"
        }
      ]
    };

    return json;
  }

  getConsultantHtmlBlock(consultant) {
    var $blockHtml = $("<div>", {"class": "consultant-card"});
    var $selectedHeaderHtml = this.getSelectedHeaderHtml();
    $blockHtml.append($selectedHeaderHtml);
    var $imageHtml = this.getImageHtml(consultant.image);
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
    $nameHtml.text(consultant.name);
    $infoContainerHtml.append($nameHtml);
    var $innerContainerHtml = $("<div>", {"class": "system-14"});

    var $titleHtml = $("<span>");
    $titleHtml.text(consultant.title);
    $innerContainerHtml.append($titleHtml);

    var $phoneHtml = this.getPhoneHtml(consultant.phone);
    $innerContainerHtml.append($phoneHtml);

    var $emailHtml = this.getEmailHtml(consultant.email);
    $innerContainerHtml.append($emailHtml);

    var $addressHtml = $("<span>");
    $addressHtml.text(consultant.address);
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
    console.log(1);
    var $footerHtml = $("<div>", {"class": "consultant-footer"});
    var $youHaveSelectedHtml = $("<span>", {"id": "you-have-selected", "class": "system-14"});
    $footerHtml.append($youHaveSelectedHtml);
    var $continueHtml = $("<button>", {"class": "button-secondary-icon"});
    $continueHtml.text("continue");
    $footerHtml.append($continueHtml);
    return $footerHtml;
  }

  selectConsultant(e) {
    console.log(2);
    var $consultantCard = $(e.target).closest(".consultant-card");
    if (!$consultantCard.hasClass("selected")) {
      $(".selected").toggleClass("selected");
    }
    $(e.target).closest(".consultant-card").toggleClass("selected");
    var consultantName = $(".selected .consultant-name").text();
    $("#you-have-selected").html(`You have selected <span>${consultantName}</span> as your consultant`);
  }
}
