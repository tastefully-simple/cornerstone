import PageManager from '../page-manager';
import TSAffiliationCheck from './ts-affiliation-check';
import TSJoinAbandonment from './ts-join-abandonment';

export default class TSCart extends PageManager {
    onReady() {
        this.initTSAffiliationCheck();
        this.initTSJoinAbandonment();
    }

    initTSAffiliationCheck() {
        const tsAffiliationCheck = new TSAffiliationCheck();
        return tsAffiliationCheck;
    }

    initTSJoinAbandonment() {
        const tsJoinAbandonment = new TSJoinAbandonment();
        return tsJoinAbandonment;
    }
}
