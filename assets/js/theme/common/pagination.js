export default function($container, current, total, onGoTo) {
    const prevItem = (() => {
        const $item = $("<li>", {"class": "custom-pagination-item"});
        const $link = $("<a>", {"class": "custom-pagination-link previous-button"});
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
        const $item = $("<li>", {"class": "custom-pagination-item"});
        const $link = $("<a>", {"class": "custom-pagination-link next-button"});
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

        const $item = $("<li>", {"class": "custom-pagination-item"});

        // current page
        if (pageNum == current) {
            $item.addClass("custom-pagination-item--current");
        }

        const $link = $("<a>", {"class": "custom-pagination-link"});
        $link.text(pageNum);
        $item.append($link);

        $link.click(e => onGoTo(pageNum))

        return $item;
    });

    const allItems = [prevItem]
        .concat(pageItems)
        .concat([nextItem]);

    const $list = $("<ul>", {"class": "custom-pagination-list"});
    $list.append(allItems);

    $($container).html($list);
}
