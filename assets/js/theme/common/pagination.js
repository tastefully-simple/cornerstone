export default function($container, current, total, onGoTo) {
    const prevItem = (() => {
        const $item = $("<li>", {"class": "pagination-item"});
        const $link = $("<a>", {"class": "pagination-link previous-button"});
        const $icon = $("<i>", {"class": "fas fa-caret-left"});

        // First page
        if (current == 1) {
            $link.addClass("isDisabled");
        } else {
            $link.click(e => onGoTo(current-1));
        }

        $link.append($icon);
        $item.append($link);
        return $item;
    })();

    const nextItem = (() => {
        const $item = $("<li>", {"class": "pagination-item"});
        const $link = $("<a>", {"class": "pagination-link next-button"});
        const $icon = $("<i>", {"class": "fas fa-caret-right"});

        // Last page
        if (current >= total) {
            $link.addClass("isDisabled");
        } else {
            $link.click(e => onGoTo(current+1));
        }

        $link.append($icon);
        $item.append($link);
        return $item;
    })();

    const pagesArr = Array.from(new Array(total).keys());

    const pageItems = pagesArr.map((p, i) => {
      const pageNum = i+1;

      const $item = $("<li>", {"class": "pagination-item"});

      // current page
      if (pageNum == current) {
          $item.addClass("pagination-item--current");
      }

      const $link = $("<a>", {"class": "pagination-link"});
      $link.text(pageNum);
      $item.append($link);

      $link.click(e => onGoTo(pageNum))

      return $item;
    });

    const allItems = [prevItem]
      .concat(pageItems)
      .concat([nextItem]);

    const $list = $("<ul>", {"class": "pagination-list"});
    $list.append(allItems);

    $($container).html($list);
/*
    constructor(container, onClick) {
        this.container = container;
        this.onClick = onClick;
        this.page = 1;
        this.totalPages = 1;
    }

    updatePage(currentPage, totalPages) {
        this.page = page;
        this.totalPages = totalPages;
        this.render();
    }

    goToPrev() {
        if (this.page > 1) {
            const prevPage = this.page - 1
            console.log('Going previous to', prevPage);
        }
    }

    goToNext() {
        if (this.page < this.totalPages) {
            const nextPage = this.page + 1
            console.log('Going next to', nextPage);
        }
    }

    goToPage(num) {
        console.log('Going to', num);
    }

    render() {
        const prevItem = (() => {
            const $item = $("<li>", {"class": "pagination-item"});
            const $link = $("<a>", {"class": "pagination-link previous-button"});
            const $icon = $("<i>", {"class": "fas fa-caret-left"});

            // First page
            if (this.page == 1) {
                $link.addClass("isDisabled");
            } else {
                $link.click(e => this.goToPrev())
            }

            $link.append($icon);
            $item.append($link);
            return $item;
        })();

        const nextItem = (() => {
            const $item = $("<li>", {"class": "pagination-item"});
            const $link = $("<a>", {"class": "pagination-link next-button"});
            const $icon = $("<i>", {"class": "fas fa-caret-right"});

            // First page
            if (this.page >= this.totalPages) {
                $link.addClass("isDisabled");
            } else {
                $link.click(e => this.goToPrev())
            }

            $link.append($icon);
            $item.append($link);
            return $item;
        })();

        const pageItems = Array(this.totalPages).keys().map((p, i) => {
          const pageNum = i+1;

          const $item = $("<li>", {"class": "pagination-item"});

          // current page
          if (pageNum == this.page) {
              $item.addClass("pagination-item--current");
          }

          const $link = $("<a>", {"class": "pagination-link"});
          $link.text(pageNum);
          $link.append($icon);
          $item.append($link);

          $link.click(e => this.goToPage(pageNum))

          return $item;
        });

        const allItems = [prevItem]
          .concat(pageItems)
          .concat([nextItem]);

        const $list = $("<ul>", {"class": "pagination-list"});
        $list.append(allItems);

        $(this.container).html($list);
    }
*/
}
