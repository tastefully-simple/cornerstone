import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';
import TSCopyLink from '../common/ts-copy-link';
// For await
import 'core-js/stable';
import 'regenerator-runtime/runtime';

class PartyDetails {
    constructor() {
        this.api = new TSApi();
        this.pid = TSCookie.getPartyId();
        this.partyInfo = {
            Consultant: '',
            ConsultantEmail: '',
            ConsultantId: '',
            ConsultantPhone: '',
            ConsultantXid: null,
            Date: '',
            FundraisingOrganization: '',
            HostFirtName: '',
            HostLastName: '',
            Image: '',
            IsFundraiser: false,
            ParsedDate: null,
            PartyId: null,
            PartySubTypeXID: '',
            PartyTitle: '',
            Time: '',
            Total: 0,
        };
        this.initPartyDetails();
    }

    async initPartyDetails() {
        if (typeof this.pid !== 'undefined') {
            try {
                await this.fetchPartyInfo();
            } catch (xhr) {
                const readableError = $(xhr.responseText).filter('p').html();
                console.warn('getPartyInfo:', readableError);
            }
            this.displayPartyInfo();
        }
    }

    fetchPartyInfo() {
        return this.api.getPartyInfo(this.pid)
            .done((data) => {
                this.partyInfo = data;
            });
    }

    displayPartyInfo() {
        if (this.partyInfo) {
            this.renderResults();
        }
    }

    renderResults() {
        if (typeof this.partyInfo === 'string') {
            console.warn('PartyDetails::renderResults', this.partyInfo);
            return;
        }
        this.getHtmlBlock();
    }

    getHtmlBlock() {
        document.getElementById('hpPartyDetailName').innerHTML = this.partyInfo.PartyTitle;
        document.getElementById('hpPartyDetailDate').innerHTML = this.partyInfo.Date;
        document.getElementById('hpPartyDetailTime').innerHTML = this.partyInfo.Time;
        document.getElementById('hpPartyDetailConsultant').innerHTML = this.partyInfo.Consultant;
        document.getElementById('hpPartyDetailConsultantPhone').innerHTML = this.partyInfo.ConsultantPhone;
        document.getElementById('hpPartyDetailConsultantEmail').innerHTML = this.partyInfo.ConsultantEmail;
        document.getElementById('hpPartyDetailTotal').innerHTML = `$${this.partyInfo.Total}`;
        const getUrl = window.location;
        const szPartyUrl = `${getUrl.protocol}//${getUrl.host}/p/${this.partyInfo.PartyId}`;
        const szHtml = `<a href="${szPartyUrl}">${szPartyUrl}</a>`;
        document.getElementById('hpPartyUrl').innerHTML = szHtml;
        TSCopyLink.socialShareHandler('#hpPartyDetail .socialLinks-copy', szPartyUrl);
        $('.share-link').addClass('visible');
    }
}

export default function () {
    if (window.location.href.indexOf('host-planner') > -1) {
        return new PartyDetails();
    }
}
