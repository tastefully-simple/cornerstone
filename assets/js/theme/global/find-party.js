export default function() {
    $(document).ready(function() {
        let party = new FindAParty(
            document.querySelector('.party-bar')
        );
    });
}

const SCREEN_MIN_WIDTH = 801;

class FindAParty {
    constructor(trigger) {
        this.$findParty = trigger;

        // Move "Find a Party" into the main menu in mobile view
        this.movePartyElement(this.$findParty);
        $(window).on('resize', () => this.movePartyElement(this.$findParty));
    }

    movePartyElement($party) {
        let $navPages = $('.navPages-container .navPages');

        if (window.innerWidth >= SCREEN_MIN_WIDTH) {
            $('header').append($party);
        } else {
            $navPages.append($party);
        }
    }
}
