import PageManager from './page-manager';
import TSApi from './common/ts-api';
import TSCookie from './common/ts-cookie';

export default class ConsultantDetailsPage extends PageManager {
    onReady() {
        let consultantDetails = new ConsultantDetails(
            $('#consultantDetails')
        );
    }
}

class ConsultantDetails {
    constructor(el) {
        this.$consultantDetails = el;
        this.api = new TSApi();

        this.fetchConsultantDetails();
    }

    fetchConsultantDetails() {
        let cid = TSCookie.GetConsultantId();

        this.api.getConsultantInfo(cid)
            .then(res => res.json())
            .then(data => this.renderResults(data))
            .catch(err => {
                console.warn('getConsultantInfo', err);
            });
    }

    /*
     * HTML
     */
    renderResults(response) {
        if (!response) {
            console.warn('No consultant was found');
            return;
        }

        this.getDetailsHtmlBlock(response);
    }

    getDetailsHtmlBlock(details) {
        this.getDetailsSummaryHtmlBlock(details);
        this.getDetailsMoreInfoHtmlBlock(details);
    }

    /* Column 1 - Consultant Details Summary
     * - Image
     * - Name
     * - Title
     * - Location
     */
    getDetailsSummaryHtmlBlock(details) {
        let $img       = $('.cdetails-img');
        let $name      = $('.cdetails-name');
        let $title     = $('.cdetails-title');
        let $location  = $('.cdetails-location');

        let imgError =
            `this.onerror=null;
             this.src='https://www.tastefullysimple.com/_/media/images/noconsultantphoto.png';`;

        $img.attr('src', details.Image);
        $img.attr('onerror', imgError);
        $name.text(details.Name || "Jane Doe");
        $title.text(details.Title || "Consultant");
        $location.text(details.Location || "Alexandria, MN");
    }

    /* Column 2 - Consultant Details More Info
     * - Greetings
     * - Headline
     * - Phone Number
     * - Email
     */
    getDetailsMoreInfoHtmlBlock(details) {
        let consultantFName = details.Name.split(" ")[0];

        let $greetings   = $('.cdetails-greetings');
        let $headline    = $('.cdetails-headline');
        let $phoneNumber = $('.cdetails-phone-number');
        let $email       = $('.cdetails-email');

        $greetings.text(`hello, I'm ${consultantFName}!`);
        $headline.text(details.Headline || "Testing Shop or Host With Me Headline");
        $phoneNumber.text(details.PhoneNumber || "888-888-8888");
        $email.text(details.EmailAddress || "help@tastefullysimple.com");
    }
}
