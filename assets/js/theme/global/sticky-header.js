export default function () {
    let stickyHeader = new StickyHeader(
        document.querySelector('#headerMain')
    );
}

class StickyHeader {
    constructor($header) {
        this.$header = $header;
        this.sticky = $header.offsetTop;

        window.addEventListener("scroll", () => this.onScroll(this.$header, this.sticky));
    }

    onScroll($header, sticky) {
        if (window.pageYOffset > sticky) {
            $header.classList.add("sticky-header");
        } else {
            $header.classList.remove("sticky-header");
        }
    }
}
