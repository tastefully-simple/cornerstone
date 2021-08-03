import PageManager from '../page-manager';
import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';
//For await
import "core-js/stable";
import "regenerator-runtime/runtime";

class PartyDetails {
    constructor() {
        this.api = new TSApi();
        this.pid = TSCookie.getPartyId();
        this.partyInfo;
        this.initPartyDetails();
    }

    async initPartyDetails() {
        try { await this.fetchPartyInfo() } catch {};
        this.displayPartyInfo();
    }

    fetchPartyInfo() {
        if (typeof this.pid !== 'undefined') {
            return this.api.getPartyInfo(this.pid)
            .done((data) => {
                this.partyInfo = data;
            })
            .fail((xhr, textStatus, error) => {
                const readableError = $(xhr.responseText).filter('p').html();
                console.warn('getPartyInfo:', readableError);
            });
        }
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
        document.getElementById('hpPartyDetailTotal').innerHTML = '$' + this.partyInfo.Total;
        
        var getUrl = window.location;
        var szPartyUrl = getUrl.protocol + '//' + getUrl.host + '/p/' + this.partyInfo.PartyId
        var szHtml = '<a href="' + szPartyUrl + '">' + szPartyUrl + '</a>';
        document.getElementById('hpPartyUrl').innerHTML = szHtml;
    }
}

export default function () {
    if (window.location.href.indexOf("host-planner") > -1) {
        return new PartyDetails();
    }
}
