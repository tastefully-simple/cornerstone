export default function () {
    let stickyHeader = new StickyHeader(
        document.querySelector('#headerMain'),
        { screenMinWidth: 801 }
    );
}

class StickyHeader {
    constructor($header, config) {
        this.$header = $header;
        this.sticky = $header.offsetTop;
        this.config = config;

        window.addEventListener('scroll', () => (
            this.onScroll(this.$header, this.sticky, this.config.screenMinWidth)
        ));
    }

    onScroll($mainHeader, sticky, screenMinWidth) {
        let $navlinks = document.querySelector('.header-top-links');
        let $topHeaderContainer = document.querySelector('header .header-top .container');
        let $mainHeaderContainer = $mainHeader.querySelector('.container');

        if (window.pageYOffset > sticky && (window.innerWidth >= screenMinWidth)) {
            $mainHeader.classList.add('sticky-header');
            $mainHeaderContainer.appendChild($navlinks);
        } else {
            $mainHeader.classList.remove('sticky-header');
            $topHeaderContainer.appendChild($navlinks);
        }
    }
}
