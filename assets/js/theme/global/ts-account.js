import TSApi from '../common/ts-api';
import FindAConsultant from './ts-find-consultant';
// For await
import 'core-js/stable';
import 'regenerator-runtime/runtime';

class Account extends FindAConsultant {
    constructor(tsConsultantId) {
        super(tsConsultantId);
        this.customerId = window.customer.id;
        this.api = new TSApi();
        this.modalTemplate = 'common/findConsultant/find-consultant-account';
        this.activeYumConsultantName = '';
        this.yumConsultants = [];

        // Identifiers
        this.consultantSearchId = '#consultant-search-account';
        this.zipcodeSearchId = '#zipcode-search-form-account';
        this.nameSearchId = '#name-search-form-account';
        this.cidSearchId = '#id-search-form-account';
        this.searchResultsId = '#consultant-search-results-account';
        this.cidContinueId = '#consultant-continue-account';

        this.init();
    }

    async init() {
        try {
            await this.fetchYumConsultants();
        } catch (xhr) {
            const readableError = JSON.parse(xhr.responseText || '{"error": "An error has occured"}');
            console.warn('getYumConsultant:', readableError);
        }

        this.setConsultant(this.loadConsultant());
        this.setYumConsultantName(this.getActiveYumConsultantName());
        this.setYumConsultantNameText();
        this.initListeners();
    }

    fetchYumConsultants() {
        return this.api.getYumConsultants(this.customerId)
            .done((data) => {
                this.yumConsultants = data;
            });
    }

    setYumConsultantName(name) {
        this.activeYumConsultantName = name;
    }

    getActiveYumConsultantName() {
        if (this.yumConsultants.length > 0) {
            const activeConsultants = this.yumConsultants.filter(c => c.IsActive === true);
            const activeConsultant = activeConsultants[0];
            return [activeConsultant.FirstName, activeConsultant.LastName].join(' ');
        }
        return this.activeYumConsultantName;
    }

    setYumConsultantNameText() {
        $('#yum-club-consultant').text(this.activeYumConsultantName);
    }

    displayYumConsultantNameText() {
        if (this.activeYumConsultantName) {
            $('#yum-club-info').show();
        }
    }

    continue() {
        $('.frame-caption.matching').hide();
        $(this.cidContinueId).html('Confirm');
        $(this.cidContinueId).addClass('confirm');
        $('.next-step-selected-text').text('You selected a new Yum Club consultant. Please confirm your choice.');
        $('.greeting').show();
        $('.findmodal-pagination-container').hide();
        $('.result-card').hide();
        $('.result-card.selected').show();
    }

    /* Override parent function to do nothing. This is done on purpose. */
    renderConsultant() {

    }

    bindFindConsultantTrigger() {
        $('body').on(
            'click',
            '#yum-edit.consultant-edit',
            (e) => {
                this.createModal(e);
            },
        );
    }

    initListeners() {
        super.initListeners();

        // Run only when on Rebillia tab
        $('body').on('click', '.navBar-section[data-name="rebillia-account-navBar-section"]', () => this.displayYumConsultantNameText());

        // Submit with consultant
        $('body').on('click', this.cidContinueId, () => this.continueWithSelection());

        // Confirm consultant
        $('body').on('click', `${this.cidContinueId}.confirm`, () => this.confirmSelection());
    }

    async confirmSelection() {
        if (window.selectedId) {
            const consultantName = $('.selected .consultant-name').text();
            this.setYumConsultantName(consultantName);
            this.setYumConsultantNameText();
            try {
                await this.api.setActiveYumConsultant(window.selectedId, this.customerId);
            } catch (xhr) {
                const readableError = JSON.parse(xhr.responseText || '{"error": "An error has occured"}');
                console.warn('setActiveYumConsultant:', readableError);
            }
            this.closeModal();
        }
    }
}


export default function (tsConsultantId) {
    if (window.location.href.indexOf('/account.php') > -1) {
        return new Account(tsConsultantId);
    }
}
