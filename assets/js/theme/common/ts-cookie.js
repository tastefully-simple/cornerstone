import Cookies from 'js-cookie';

export default {
    // Social Bug Affiliate ID
    SetAffiliateId: function(afid) {
        Cookies.set('afid', afid,
            {
                secure: true, expires: 7, path: '/', domain: 'tastefully-simple-sandbox-2.mybigcommerce.com',
            },
        );
    },

    GetAffiliateId: function() {
        return Cookies.get('afid');
    },

    // Consultant ID
    SetConsultantId: function(cid) {
        Cookies.set('cid', cid,
            {
                secure: true, expires: 7, path: '/', domain: 'tastefully-simple-sandbox-2.mybigcommerce.com',
            },
        );
    },

    GetConsultantId: function() {
        return Cookies.get('cid');
    },

    // Consultant XID
    SetConsultantXid: function(cxid) {
        Cookies.set('cxid', cxid,
            {
                secure: true, expires: 7, path: '/', domain: 'tastefully-simple-sandbox-2.mybigcommerce.com',
            },
        );
    },

    GetConsultantXid: function() {
        return Cookies.get('cxid');
    },

    // Party Date
    SetConsultantName: function(name) {
        Cookies.set('name', name,
            {
                secure: true, expires: 7, path: '/', domain: 'tastefully-simple-sandbox-2.mybigcommerce.com',
            },
        );
    },

    GetConsultantName: function() {
        return Cookies.get('name');
    },

    // Party Id
    SetPartyId: function(pid) {
        Cookies.set('pid', pid,
            {
                secure: true, expires: 7, path: '/', domain: 'tastefully-simple-sandbox-2.mybigcommerce.com',
            },
        );
    },

    GetPartyId: function() {
        return Cookies.get('pid');
    },

    // Party Host
    SetPartyHost: function(phost) {
        Cookies.set('phost', phost,
            {
                secure: true, expires: 7, path: '/', domain: 'tastefully-simple-sandbox-2.mybigcommerce.com',
            },
        );
    },

    GetPartyHost: function() {
        return Cookies.get('phost');
    },

    // Party Date
    SetPartyDate: function(pdate) {
        Cookies.set('pdate', pdate,
            {
                secure: true, expires: 7, path: '/', domain: 'tastefully-simple-sandbox-2.mybigcommerce.com',
            },
        );
    },

    GetPartyDate: function() {
        return Cookies.get('pdate');
    },

    // Party Time
    SetPartyTime: function(ptime) {
        Cookies.set('ptime', ptime,
            {
                secure: true, expires: 7, path: '/', domain: 'tastefully-simple-sandbox-2.mybigcommerce.com',
            },
        );
    },

    GetPartyTime: function() {
        return Cookies.get('ptime');
    },

    // Party Total
    SetPartyTotal: function(ptotal) {
        Cookies.set('ptotal', ptotal,
            {
                secure: true, expires: 7, path: '/', domain: 'tastefully-simple-sandbox-2.mybigcommerce.com',
            },
        );
    },

    GetPartyTotal: function() {
        return Cookies.get('ptotal');
    },

    // Debugging
    GetTest: function() {
        return Cookies.get('_test');
    },

    SetTest: function(value) {
        Cookies.set('_test', value);
    }
}
