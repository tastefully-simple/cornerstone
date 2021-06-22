import PageManager from '../page-manager';
import TSAffiliationCheck from './ts-affiliation-check';
import TSCartAffiliation from './ts-cart-affiliation';

export default class TSCart extends PageManager {
    constructor(context) {
        super(context);

        this.themeSettings = this.context.themeSettings;
    }

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
        const tsConsultantId = this.themeSettings.ts_consultant_id;
        const tsCartAffiliation = new TSCartAffiliation(tsConsultantId);

        return tsCartAffiliation;
    }
}
