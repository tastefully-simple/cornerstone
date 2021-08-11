import copy from 'copy-to-clipboard';

export default class TSCopyLink {
    static socialShareHandler(buttonSelector, url = window.location.href) {
        const $button = $(buttonSelector);
        $button.click(() => {
            this.copyToClipboard($button, url);
        });
    }

    static copyToClipboard($button, url) {
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
