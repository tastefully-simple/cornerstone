const JOIN_US_PAGE = '/join-us';

class TSJoinProcess {
    constructor(themeSettings) {
        this.joinStoreUrl = themeSettings.ts_join_store_url;

        this.setJoinStoreUrl();
    }

    setJoinStoreUrl() {
        if (document.location.pathname === JOIN_US_PAGE) {
            const $joinTodayBtns = document.querySelectorAll('.join-today-btn a');

            $joinTodayBtns.forEach(btn => {
                const joinBtn = btn;

                joinBtn.href = this.joinStoreUrl;
                joinBtn.target = '_blank';
            });
        }
    }
}

export default function (themeSettings) {
    const tsJoinProcess = new TSJoinProcess(themeSettings);

    return tsJoinProcess;
}
