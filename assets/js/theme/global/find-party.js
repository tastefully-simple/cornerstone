import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';
import TSApi from '../common/ts-api';
import StatesSelect from '../common/directory/states';

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

class FindAParty {
    constructor(trigger, template) {
        this.$findPartyBar = trigger.parent();
        this.pageSize = 10;

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
            this.pageSize
        )
        .then(res => res.json())
        .then(data => this.renderResults(data));
        .catch(err => {
            console.warn('searchByState', err);
            this.displayError(err);
        });
    }

    renderResults(response) {
        // Show search results
    }

    displayError(err) {
        $('.alertbox-error span').text(err);
        $('.alertbox-error').show();
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
