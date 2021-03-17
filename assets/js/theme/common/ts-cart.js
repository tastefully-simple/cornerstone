import PageManager from '../page-manager';
import TSAffiliationCheck from './ts-affiliation-check';

export default class TSCart extends PageManager {
    onReady() {
        this.initTSAffiliationCheck();
    }

    initTSAffiliationCheck() {
        const tsAffiliationCheck = new TSAffiliationCheck();
        return tsAffiliationCheck;
    }
}
