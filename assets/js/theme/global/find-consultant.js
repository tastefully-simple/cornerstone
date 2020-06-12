import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';

/**
 * Creates a Cornerstone popup modal for Find A Consultant. 
 * A second view is available once the user hits search. The modal is then 
 * populated with data from the user's search parameters
 */
export default function() {
  $(document).ready(function() {
    const modal = defaultModal();
    $('.headertoplinks-consult').on('click', (e) => {
      e.preventDefault();
      modal.open({ size: 'large' });
      const options = { template: 'common/find-consultant' }
      utils.api.getPage('/', options, (err, res) => {
        if (err) {
          console.error('Failed to get common/find-consultant. Error:', err);
          return false;
        } else if (res) {
          modal.updateContent(res);
        }
      });
    });

    $('body').on('click', '.return-search', function() {
      $("#consultant-search-results").hide();
      $(".matching").remove();
      $(".consultant-card").remove();
      $(".consultant-divider").remove();
      $(".consultant-footer").remove();
      $("#consultant-search").show();
    });

    $('body').on('click', '.button-alternate', function() {
      $("#consultant-search").hide();
      var consultantsResult = getConsultantSearchResults();
      var matchingConsultants = document.createElement("span");
      matchingConsultants.className = "system-14 matching";
      matchingConsultants.textContent = `Consultants matching \"${consultantsResult.results}\"`;
      $("#consultant-search-results .buy-wide-card").append(matchingConsultants);
      consultantsResult.consultants.forEach(function(consultant) {
        var consultantHtmlBlock = getConsultantHtmlBlock(consultant);
        var dividerHtml = document.createElement("div");
        dividerHtml.className = "consultant-divider";
        $("#consultant-search-results .buy-wide-card").append(consultantHtmlBlock);
        $("#consultant-search-results .buy-wide-card").append(dividerHtml);
      });
      $("#consultant-search-results").show();
      var footerHtml = document.createElement("div");
      footerHtml.className = "consultant-footer";
      var youHaveSelectedHtml = document.createElement("span");
      youHaveSelectedHtml.className = "system-14 you-have-selected";
      footerHtml.append(youHaveSelectedHtml);
      var continueHtml = document.createElement("button");
      continueHtml.className = "button-secondary-icon";
      continueHtml.textContent = "continue";
      footerHtml.append(continueHtml);
      $(".genmodal-body").append(footerHtml);
      $(".consultant-card").click(function(event) {
        var consultantCard = $(event.target).closest(".consultant-card");
        if (!consultantCard.hasClass("selected")) {
          $(".selected").toggleClass("selected");
        }
        $(event.target).closest(".consultant-card").toggleClass("selected");
        var consultantName = $(".selected .consultant-name").text();
        youHaveSelectedHtml.innerHTML = `You have selected <span>${consultantName}</span> as your consultant`;
      });
    });
  });
}

/**
 * Makes an API call to retrieve consultants (based off of search parameters)
 * and returns the data in a json object
 */
function getConsultantSearchResults(searchParameters = 1) {
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

/**
 * Makes an API call to retrieve consultants (based off of search parameters)
 * and returns the data in a json object
 */
function getConsultantHtmlBlock(consultant) {
  var blockHtml = document.createElement("div");
  blockHtml.className = "consultant-card";
  var selectedHeaderHtml = getSelectedHeaderHtml();
  blockHtml.appendChild(selectedHeaderHtml);
  var imageHtml = getImageHtml(consultant.image);
  blockHtml.appendChild(imageHtml);
  var consultantInfoHtml = getInfoHtml(consultant);
  blockHtml.appendChild(consultantInfoHtml);
  return blockHtml;
}

/**
 * Generates the consultant block selected header html
 */
function getSelectedHeaderHtml() {
  var selectedHeaderHtml = document.createElement("div");
  selectedHeaderHtml.className = "selected-header";
  var iconHtml = document.createElement("span");
  iconHtml.className = "check-icon";
  selectedHeaderHtml.appendChild(iconHtml);
  var titleContainerHtml = document.createElement("div");
  titleContainerHtml.className = "vertical-center";
  var titleHtml = document.createElement("span");
  titleHtml.className = "selection-title";
  titleHtml.textContent = "Selected";
  titleContainerHtml.appendChild(titleHtml);
  selectedHeaderHtml.appendChild(titleContainerHtml);
  return selectedHeaderHtml;
}

/**
 * Generates the consultant block info html
 */
function getInfoHtml(consultant) {
  var infoContainerHtml = document.createElement("div");
  infoContainerHtml.className = "consultant-info";
  var nameHtml = document.createElement("h5");
  nameHtml.className = "frameheading-5 consultant-name";
  nameHtml.textContent = consultant.name;
  infoContainerHtml.appendChild(nameHtml);
  var innerContainerHtml = document.createElement("div");
  innerContainerHtml.className = "system-14";
  var titleHtml = document.createElement("span");
  titleHtml.textContent = consultant.title;
  innerContainerHtml.appendChild(titleHtml);
  var phoneHtml = getPhoneHtml(consultant.phone);
  innerContainerHtml.appendChild(phoneHtml);
  var emailHtml = getEmailHtml(consultant.email);
  innerContainerHtml.appendChild(emailHtml);
  var addressHtml = document.createElement("span");
  addressHtml.textContent = consultant.address;
  innerContainerHtml.appendChild(addressHtml);
  var pageLinkHtml = getPageLinkHtml();
  innerContainerHtml.appendChild(pageLinkHtml);
  infoContainerHtml.appendChild(innerContainerHtml);
  return infoContainerHtml;
}

/**
 * Generates consultant block phone html
 */
function getPhoneHtml(phoneNumber) {
  var phoneHtml = document.createElement("div");
  phoneHtml.className = "consultant-phone";
  var iconHtml = document.createElement("span");
  iconHtml.className = "icon-system-phone";
  phoneHtml.appendChild(iconHtml);
  var textContainerHtml = document.createElement("div");
  textContainerHtml.className = "vertical-center system-14";
  var textHtml = document.createElement("span");
  textHtml.textContent = phoneNumber;
  textContainerHtml.appendChild(textHtml);
  phoneHtml.appendChild(textContainerHtml);
  return phoneHtml;
}

/**
 * Generates consultant block email html
 */
function getEmailHtml(email) {
  var emailHtml = document.createElement("div");
  emailHtml.className = "consultant-email";
  var iconHtml = document.createElement("span");
  iconHtml.className = "icon-system-envelope";
  emailHtml.appendChild(iconHtml);
  var textContainerHtml = document.createElement("div");
  textContainerHtml.className = "vertical-center system-14";
  var textHtml = document.createElement("span");
  textHtml.textContent = email;
  textContainerHtml.appendChild(textHtml);
  emailHtml.appendChild(textContainerHtml);
  return emailHtml;
}

/**
 * Generates consultant block page link html
 */
function getPageLinkHtml() {
  var pageLinkHtml = document.createElement("div");
  pageLinkHtml.className = "ts-page-link";
  var linkContainerHtml = document.createElement("div");
  linkContainerHtml.className = "vertical-center";
  var linkHtml = document.createElement("a");
  linkHtml.textContent = "View my TS page";
  linkHtml.href = "#";
  linkHtml.className = "framelink-lg";
  linkContainerHtml.appendChild(linkHtml);
  pageLinkHtml.appendChild(linkContainerHtml);
  var iconHtml = document.createElement("span");
  iconHtml.className = "icon-system-download";
  pageLinkHtml.appendChild(iconHtml);
  return pageLinkHtml;
}

/**
 * Generates consultant block image html
 */
function getImageHtml(image) {
  var imageContainerHtml = document.createElement("div");
  imageContainerHtml.className = "consultant-image";
  var imageHtml = document.createElement("img");
  imageHtml.src = image.url;
  imageHtml.alt = image.alt;
  imageContainerHtml.appendChild(imageHtml);
  return imageContainerHtml;
}
