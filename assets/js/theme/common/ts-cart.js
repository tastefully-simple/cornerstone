import PageManager from '../page-manager';
import TSAffiliationCheck from './ts-affiliation-check';
import TSCartAffiliation from './ts-cart-affiliation';

export default class TSCart extends PageManager {
    onReady() {
        this.initTSAffiliationCheck();
        this.initTSCartAffiliation();
    }

    initTSAffiliationCheck() {
        const tsAffiliationCheck = new TSAffiliationCheck();
        return tsAffiliationCheck;
    }

    // TST-426
    initTSCartAffiliation() {
        const tsCartAffiliation = new TSCartAffiliation();
        return tsCartAffiliation;
    }
}
