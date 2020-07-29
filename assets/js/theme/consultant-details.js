import PageManager from './page-manager';
import TSApi from './common/ts-api';
import TSCookie from './common/ts-cookie';

export default class ConsultantDetailsPage extends PageManager {
    onReady() {
        let consultantDetails = new ConsultantDetails();
    }
}

// Modes to what data from API to render
const DETAILS_DATA = 0;
const PARTIES_DATA = 1;

// Modes to what party tab to render
const ATTEND_TAB = 0;
const PAST_TAB = 1;

class ConsultantDetails {
    constructor() {
        this.api = new TSApi();
        this.cid = TSCookie.GetConsultantId();

        this.fetchConsultantDetails();
        this.fetchConsultantParties();
    }

    fetchConsultantDetails() {
        this.api.getConsultantInfo(this.cid)
            .then(res => res.json())
            .then(data => this.renderResults(data, DETAILS_DATA))
            .catch(err => {
                console.warn('getConsultantInfo', err);
            });
    }

    fetchConsultantParties() {
        this.api.getConsultantParties(this.cid)
            .then(res => res.json())
            .then(data => this.renderResults(data, PARTIES_DATA))
            .catch(err => {
                console.warn('getConsultantParties', err);
            });
    }

    // Update party cookies
    setCookies(e, party) {
        e.stopPropagation();
        let phost = `${party.HostFirstName} ${party.HostLastName}`;
        TSCookie.SetPartyId(party.PartyId);
        TSCookie.SetPartyHost(phost);
        TSCookie.SetPartyDate(party.Date);
        TSCookie.SetPartyTime(party.Time);
    }

    /*
     * HTML
     */
    renderResults(response, mode) {
        switch (mode) {
            case DETAILS_DATA:
                this.renderConsultantDetails(response);
                break;
            case PARTIES_DATA:
                this.renderConsultantParties(response);
                break;
            default:
                console.error('Fetch Data Mode:', mode);
                break;
        }
    }

    renderConsultantDetails(response) {
        if (!response) {
            console.warn('No consultant was found');
            return;
        }

        this.getDetailsHtmlBlock(response);
    }

    renderConsultantParties(response) {
        if (!response) {
            console.warn('No parties found');
            return;
        }

        this.getPartiesHtmlBlock(response);
    }

    /*
     * Consultant Details - Basic Info section
     */
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

    /*
     * Consultant "my parties" section
     */
    getPartiesHtmlBlock(parties) {
        this.getTabContentHtmlBlock(parties.Attend, ATTEND_TAB);
        this.getTabContentHtmlBlock(parties.Past, PAST_TAB);
    }

    getTabContentHtmlBlock(parties, tab) {
        let $content;
        switch (tab) {
            case ATTEND_TAB:
                $content = $('.cparties-attend');
                break;
            case PAST_TAB:
                $content = $('.cparties-past');
                break;
            default:
                console.error('Party Tab Mode:', tab);
                break;
        }

        if (parties.length === 0) {
            $content.text('No parties found.');
            return;
        }

        parties.forEach((party, i) => {
            // Create elements for the data
            let $card = this.createPartyCard(party, tab);
            let $divider = $('<div>', { 'class': 'party-divider' });

            $content.append($card);

            if (i !== parties.length - 1) {
                $content.append($divider);
            }
        });
    }

    /* 
     * Helpers
     */

    /* Tab Content
     * - Party Host
     * - Date
     * - Consultant
     */
    createPartyCard(party, tab) {
        // Create the elements
        let $card       = $('<div>', { 'class': 'party-card' });
        let $col1       = $('<div>', { 'class': 'party-info' });
        let $col2       = $('<div>', { 'class': 'party-shop' });
        let $host       = $('<h4>', { 'class': 'party-host textgray-text' });
        let $date       = $('<p>', { 'class': 'party-date system-14' });
        let $consultant = $('<p>', { 'class': 'party-consultant system-14' });
        let $shop       = $('<a>', { 'class': 'party-shop-link' });

        // Add data to the elements
        $host.text(`${party.HostFirstName} ${party.HostLastName}'s Party`);
        $consultant.text(`Consultant: ${party.Consultant}`);
        $shop.attr('href', '/shop');
        $shop.text('shop');
        $shop.on('click', (e) => this.setCookies(e, party));

        let dateText = '';
        if (tab === PAST_TAB) {
            dateText = `Ended On: ${party.Date}`;
        } else {
            dateText = `Date: ${party.Date}`;
        }
        $date.text(dateText);

        // Append elements to $card
        $card.append($col1);
        $card.append($col2);

        $col1.append($host);
        $col1.append($date);
        $col1.append($consultant);

        $col2.append($shop);

        return $card;
    }
}
