class Accordian {
    constructor($accordion) {
        this.openItem = null;

        this.$accordion = $accordion;
        let itemsArr = Array.from($accordion.querySelectorAll('.tst-accordion-item'));
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
    constructor($item, accordion) {
        this.isOpen = false;

        // DOM
        this.$item = $item;
        this.$title = $item.querySelector('.tst-accordion-title');
        this.$body = $item.querySelector('.tst-accordion-body');
        this.accordion = accordion

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
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.$item.classList.add('open');
        this.isOpen = true;
        this.accordion.itemOpened(this);
    }

    close() {
        this.$item.classList.remove('open');
        this.isOpen = false;
    }
}

export default function () {
    let accordion = $('.tst-accordion');
    accordion.each((i, elem) => {
        new Accordian(elem);
    });
}
