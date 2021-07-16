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
        this.displayPartyInfo();
    }

    async displayPartyInfo() {
        if (typeof this.pid !== 'undefined') {
            try {
                const partyInfo = await this.api.getPartyInfo(this.pid);
                this.renderResults(partyInfo);
            } catch (error) {
                console.warn('getPartyInfo:', error);
            }
        }
    }

    renderResults(response) {
        if (typeof response === 'string') {
            console.warn('PartyDetails::renderResults', response);
            return;
        }
        
        this.getHtmlBlock(response);
    }
  
    getHtmlBlock(data) {
        document.getElementById('hpPartyDetailName').innerHTML = data.PartyTitle;
        document.getElementById('hpPartyDetailDate').innerHTML = data.Date;
        document.getElementById('hpPartyDetailTime').innerHTML = data.Time;
        document.getElementById('hpPartyDetailConsultant').innerHTML = data.Consultant;
        document.getElementById('hpPartyDetailTotal').innerHTML = '$' + data.Total;
        
        var getUrl = window.location;
        var szPartyUrl = getUrl.protocol + '//' + getUrl.host + '/p/' + data.PartyId
        var szHtml = '<a href="' + szPartyUrl + '">' + szPartyUrl + '</a>';
        document.getElementById('hpPartyUrl').innerHTML = szHtml;
    }
}

export default function () {
    if (window.location.href.indexOf("host-planner") > -1) {
        return new PartyDetails();
    }
}
