import TSCookie from './ts-cookie';

export default class TSRemoveAffiliation {
    constructor(affiliation) {
        this.affiliation = affiliation;
    }

    openAlert() {
        const $alert = $('<div>', { class: 'remove-affiliation-alertbox-container' });

        $alert.html(this.alertHtml());
        $('body').append($alert);

        $($alert).on('click', '.remove-affiliation-decline', () => $alert.remove());

        $($alert).on('click', '.remove-affiliation-accept', this.deleteAffiliation);
    }

    alertHtml() {
        return `<div class="alertbox-action">
            <div class="alert-title">
                <h2>Please Confirm</h2>
                <span class="close-tooltip remove-affiliation-decline">x</span>
            </div>
            <div class="alert-message">
                <p>${this.alertMessage()}</p>
                <div class="alert-actions">
                    <button class="alertaction-decline remove-affiliation-decline">no, keep consultant</button>
                    <button class="alertaction-accept remove-affiliation-accept">yes, remove consultant</button>
                </div>
            </div>
        </div>`;
    }

    alertMessage() {
        const pid = TSCookie.getPartyId();

        if (pid && pid !== 'null') {
            return `Removing your consultant will also remove the party
                or fundraiser that you have selected. Are you sure you'd like to proceed?`;
        }

        return `You have requested to remove your consultant. This will mean that
            they will not get credit for your order`;
    }

    deleteAffiliation() {
        TSCookie.deleteConsultant();
        TSCookie.deleteParty();

        window.location.reload();
    }
}
