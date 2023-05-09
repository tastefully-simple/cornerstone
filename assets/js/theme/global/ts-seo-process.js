class TSSeoProcess {
    constructor() {
        this.seoNoFollow();
    }

    seoNoFollow() {
        $('a[href*="join.tastefullysimple.com"]').attr("rel", "nofollow");
        $('a[href*="tscentral.tastefullysimple.com"]').attr("rel", "nofollow");
    }
}

export default function () {
    const tsSeoProcess = new TSSeoProcess();

    return tsSeoProcess;
}
