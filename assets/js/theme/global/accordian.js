class Accordian {
    constructor($accordian) {
        this.$accordian = $accordian;
        this.$title = $accordian.querySelector('.tst-accordian-title');
        this.$body = $accordian.querySelector('.tst-accordian-body');

        this.initListeners();
    }

    initListeners() {
        this.$accordian.addEventListener(
            'click',
            () => this.onClick(),
            false
        );
    }

    onClick() {
        this.$accordian.classList.toggle('open');
    }
}

export default function () {
    let accordians = $('.tst-accordian');
    accordians.each((i, elem) => {
        new Accordian(elem);
    });
}

/*
    var accItem = document.getElementsByClassName('footer-info-col--small');
    var accHD = document.getElementsByClassName('footer-info-heading acc-head');
    for (i = 0; i < accHD.length; i++) {
        accHD[i].addEventListener('click', toggleItem, false);
    }
    function toggleItem() {
        var itemClass = this.parentNode.className;
        for (i = 0; i < accItem.length; i++) {
            accItem[i].className = 'footer-info-col footer-info-col--small close';
        }
        if (itemClass == 'footer-info-col footer-info-col--small close') {
            this.parentNode.classList.add('open').classList.remove('close');
        }
    }
*/
