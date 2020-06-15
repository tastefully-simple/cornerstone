export default function () {
    let stickyHeader = new StickyHeader(
        document.querySelector('#headerMain')
    );
}

class StickyHeader {
    constructor($header) {
        this.$header = $header;
        this.sticky = $header.offsetTop;

        window.addEventListener('scroll', () => this.onScroll(this.$header, this.sticky));
    }

    onScroll($mainHeader, sticky) {
        let $navlinks = document.querySelector('.header-top-links');
        let $topHeaderContainer = document.querySelector('header .header-top .container');
        let $mainHeaderContainer = $mainHeader.querySelector('.container');

        if (window.pageYOffset > sticky) {
            $mainHeader.classList.add('sticky-header');
            $mainHeaderContainer.appendChild($navlinks);
        } else {
            $mainHeader.classList.remove('sticky-header');
            $topHeaderContainer.appendChild($navlinks);
        }
    }
}
