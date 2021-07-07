import PageManager from '../page-manager';
import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';

class PartyDetails {
    constructor() {
        if (window.location.href.indexOf("host-planner") > -1) {
            this.api = new TSApi();
            this.pid = TSCookie.getPartyId();
            debugger;
            this.baseUrl = this.api.baseUrl;
            this.getPartyInfo();
        }
    }

    getPartyInfo() {
        var self = this;
        var url = this.baseUrl + '/party/planner?pid=' + this.pid;
        
        return fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        })
        .then(function(res) { return res.json(); })
        .then(function(data) { return self.renderResults(data); })
        .catch(function(err) { console.warn('getPartyInfo:', err)});
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

export default class PartyDetailsX extends PageManager {
    constructor() {
        const partyDetails = new PartyDetails();

        return partyDetails;
    }
}
