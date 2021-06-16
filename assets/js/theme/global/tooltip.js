class Tooltip {
    constructor() {
        $('body').on('click', '.close-tooltip', () => this.closeTooltip());
    }

    closeTooltip() {
        $('.tooltip-content.is-open').removeClass('is-open');
    }
}

export default function () {
    const tooltip = new Tooltip();
    return tooltip;
}
