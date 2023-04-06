class TSSeoProcess {
    constructor() {
        this.seoNoFollow();
    }

    seoNoFollow() {
        $('a[href^="https://join.tastefullysimple.com"]').attr(
            "rel",
            "nofollow"
        );
        $('a[href^="https://tscentral.tastefullysimple.com"]').attr(
            "rel",
            "nofollow"
        );
    }
}

export default function () {
    const tsSeoProcess = new TSSeoProcess();

    return tsSeoProcess;
}
