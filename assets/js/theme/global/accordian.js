class Accordian {
    constructor($accordian) {
        this.openItem = null;

        this.$accordian = $accordian;
        let itemsArr = Array.from($accordian.querySelectorAll('.tst-accordian-item'));
        this.items = itemsArr.map((el) => {
          return new AccordianItem(el, this);
        });
    }

    itemOpened(item) {
        if (this.openItem) {
            this.openItem.close();
        }
        this.openItem = item;
    }
}

class AccordianItem {
    constructor($item, accordian) {
        this.isOpen = false;

        // DOM
        this.$item = $item;
        this.$title = $item.querySelector('.tst-accordian-title');
        this.$body = $item.querySelector('.tst-accordian-body');
        this.accordian = accordian

        this.initListeners();
    }

    initListeners() {
        this.$item.addEventListener(
            'click',
            () => this.onClick(),
            false
        );
    }

    onClick() {
        console.log(this);
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        console.log('opening...');
        this.$item.classList.add('open');
        this.isOpen = true;
        this.accordian.itemOpened(this);
    }

    close() {
        console.log('closing...');
        this.$item.classList.remove('open');
        this.isOpen = false;
    }
}

export default function () {
    let accordian = $('.tst-accordian');
    accordian.each((i, elem) => {
        new Accordian(elem);
    });
}
