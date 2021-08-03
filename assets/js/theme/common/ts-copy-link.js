import copy from 'copy-to-clipboard';

export default class TSCopyLink {
    constructor(buttonSelector, url = window.location.href) {
        this.$button = $(buttonSelector);
        this.url = url;
        this.socialShareHandler();
    }

    socialShareHandler() {
        this.$button.click(() => {
            this.copyToClipboard(this.$button, this.url);
        });
    }

    copyToClipboard($button, url) {
        const $linkCopiedMessage = $('.link-copied-text');

        copy(url);
        $button.html('<i class="fas fa-check"></i>');
        $linkCopiedMessage.addClass('copied');

        setTimeout(() => {
            $button.html('Copy Link');
            $linkCopiedMessage.removeClass('copied');
        }, 10000);
    }
}
