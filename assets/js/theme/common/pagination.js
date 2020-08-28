import _ from 'lodash';

export default function ($container, current, total, displayNumPages, onGoTo) {
    const prevItem = (() => {
        const $item = $('<li>', { class: 'custom-pagination-item' });
        const $link = $('<a>', { class: 'custom-pagination-link previous-button' });
        const $icon = $('<i>', { class: 'fas fa-caret-left' });

        // First page
        if (current === 1) {
            $link.addClass('isDisabled');
        } else {
            $link.click(_e => onGoTo(current - 1));
        }

        $link.append($icon);
        $item.append($link);
        return $item;
    })();

    const nextItem = (() => {
        const $item = $('<li>', { class: 'custom-pagination-item' });
        const $link = $('<a>', { class: 'custom-pagination-link next-button' });
        const $icon = $('<i>', { class: 'fas fa-caret-right' });

        // Last page
        if (current >= total) {
            $link.addClass('isDisabled');
        } else {
            $link.click(_e => onGoTo(current + 1));
        }

        $link.append($icon);
        $item.append($link);
        return $item;
    })();

    const getPageRange = (() => {
        let isOddNumber = false;

        // We need to check if displayNumPages is an odd number
        // If it is, we need to add +1 offsets
        if (displayNumPages % 2 !== 0) {
            isOddNumber = true;
        }
        // Create the offset for pages to the left and right of the current page selected
        const offset = Math.floor(displayNumPages / 2);

        let start = current - offset;
        let end = current + offset;

        if (isOddNumber) {
            end += 1;
        }

        // Situation where total from API result is less than displayNumPages option
        // This case we just set the start at 1 and end at the total
        if (total <= displayNumPages) {
            start = 1;
            end = total + 1;

        // Situation where current page is lower than offset
        // This case we set the start at 1 and end at displayNumPages + 1
        // Adding +1 to end to offset lodash's range function ending the range early by 1
        } else if (current <= offset) {
            start = 1;
            end = displayNumPages + 1;

        // Situation where adding the offset to current would be same or higher than the total pages
        // This case we start at (total minus displayNumPages) + 1
        // The end would be the total and we offset it with +1 for lodash's range function
        } else if ((current + offset) >= total) {
            start = (total - displayNumPages) + 1;
            end = total + 1;
        }

        // Use lodash's range function to produce an array of numbers in the specified range
        const range = _.range(start, end);
        return range;
    })();

    const pageItems = getPageRange.map(p => {
        const pageNum = p;

        const $item = $('<li>', { class: 'custom-pagination-item' });

        // current page
        if (pageNum === current) {
            $item.addClass('custom-pagination-item--current');
        }

        const $link = $('<a>', { class: 'custom-pagination-link' });
        $link.text(pageNum);
        $item.append($link);

        $link.click(_e => onGoTo(pageNum));

        return $item;
    });

    const allItems = [prevItem]
        .concat(pageItems)
        .concat([nextItem]);

    const $list = $('<ul>', { class: 'custom-pagination-list' });
    $list.append(allItems);

    $($container).html($list);
}
