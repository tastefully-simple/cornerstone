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
