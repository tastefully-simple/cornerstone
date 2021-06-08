import TSCookie from './ts-cookie';

export default class TSRemoveAffiliation {
    constructor(affiliation) {
        this.affiliation = affiliation;
    }

    openAlert() {
        const $alert = $('<div>', { class: 'remove-affiliation-alertbox-container' });
        const html =
            `<div class="alertbox-success">
                <h2 class="alert-title">Please Confirm</h2>
                <p class="alert-message">${this.alertMessage()}</p>
                <div class="remove-affiliation-buttons">
                    <button class="ok-btn subhead-16 remove-affiliation-cancel">
                        no, keep consultant
                    </button>
                    <button class="ok-btn subhead-16 remove-affiliation-confirm">
                        yes, remove consultant
                    </button>
                </div>
            </div>`;

        $alert.html(html);
        $('body').append($alert);

        $($alert).on('click', '.remove-affiliation-cancel', () => {
            $alert.remove();
        });

        $($alert).on('click', '.remove-affiliation-confirm', this.deleteAffiliation);
    }

    alertMessage() {
        const pid = TSCookie.getPartyId();

        if (pid && pid !== 'null') {
            return `Removing your consultant will also remove the party
                or fundraiser that you have selected. Are you sure you'd like to proceed?`;
        }

        return `You have requested to removing your consultant. This will mean that
            they will not get credit for your order`;
    }

    deleteAffiliation() {
        TSCookie.deleteConsultant();
        TSCookie.deleteParty();

        window.location.reload();
    }
}
