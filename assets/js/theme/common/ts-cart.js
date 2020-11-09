import PageManager from '../page-manager';
import TSAffiliationCheck from './ts-affiliation-check';
import TSJoinAbandonment from './ts-join-abandonment';

export default class TSCart extends PageManager {
    constructor(context) {
        super(context);

        this.context = context;
    }

    onReady() {
        this.initTSAffiliationCheck();
        this.initTSJoinAbandonment();
    }

    initTSAffiliationCheck() {
        const tsAffiliationCheck = new TSAffiliationCheck();
        return tsAffiliationCheck;
    }

    initTSJoinAbandonment() {
        const tsJoinAbandonment = new TSJoinAbandonment(this.context);
        return tsJoinAbandonment;
    }
}
