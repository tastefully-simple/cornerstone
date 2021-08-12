import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';
import pagination from '../common/pagination';
// For await
import 'core-js/stable';
import 'regenerator-runtime/runtime';

class PartySummary {
    constructor() {
        this.api = new TSApi();
        this.pid = TSCookie.getPartyId();
        this.guestCurrentPage = 1;
        this.guestPageSize = 10;
        this.guestInfo = { Guests: [], TotalGuests: 0 };
        this.rewardsInfo = { Rewards: [], PartySales: 0 };
        this.bookingsInfo = { Bookings: [], TotalBookings: 0 };
        this.init();
        this.bindPartyEvents();
    }

    async init() {
        try {
            await this.fetchPartySummary();
        } catch (xhr) {
            const readableError = $(xhr.responseText).filter('p').html();
            console.warn('getPartySumary:', readableError);
        }
        this.displayGuestsTableInfo();
        this.displayRewardsInfo();
    }

    fetchPartySummary() {
        if (typeof this.pid !== 'undefined') {
            return this.api.getPartySummary(this.pid)
                .done((data) => {
                    this.guestInfo = data.Guests;
                    this.rewardsInfo = data.Rewards;
                    this.bookingsInfo = data.Bookings;
                });
        }
    }

    displayGuestsTableInfo() {
        this.clearGuestsInfo();
        const pageGuests = this.getPageGuests();
        this.getPagination();
        this.displayGuestsInfo(pageGuests);
        this.displayPaginationInfo(pageGuests);
        this.displayBookedPartiesInfo();
    }

    displayRewardsInfo() {
        this.displayRewardsSalesInfo();
        this.rewardsInfo.Rewards.forEach((rewardCategoryInfo) => {
            switch (rewardCategoryInfo.Label) {
                case 'Free Shipping':
                    this.displayRewardsFreeShippingInfo(rewardCategoryInfo);
                    break;
                case 'Free Product Earned':
                    this.displayRewardsProductEarnedInfo(rewardCategoryInfo);
                    break;
                case '50% Off Item(s)':
                    this.displayRewardsDiscountInfo(rewardCategoryInfo);
                    break;
                default:
                    break;
            }
        });
    }

    displayRewardsSalesInfo() {
        const formattedSales = Math.trunc(this.rewardsInfo.PartySales);
        if (this.rewardsInfo.PartySales !== 0) {
            $('#host-rewards .rewards-amount-container').show();
            $('#host-rewards #rewards-amount').html(`$${formattedSales}`);
        } else {
            $('#host-rewards .rewards-message').show();
        }
    }

    displayRewardsFreeShippingInfo(data) {
        const $progressBar = $('#host-rewards .shipping-progress');
        $(window).resize(() => {
            const newWidth = this.getRewardCategoryWidth(data, data.Maximum / 5);
            $progressBar.width(newWidth);
        });
        this.displayRewardsBar(data, data.Maximum / 5, $progressBar);
        this.displayRewardsAmount(data.DisplayValue, $progressBar);
        this.displayRewardsCheckmark(data, $progressBar);
    }

    displayRewardsProductEarnedInfo(data) {
        const $progressBar = $('#host-rewards .product-progress');
        $(window).resize(() => {
            const newWidth = this.getRewardCategoryWidth(data, data.Maximum / 5);
            $progressBar.width(newWidth);
        });
        this.displayRewardsBar(data, data.Maximum / 10, $progressBar);
        this.displayRewardsAmount(data.DisplayValue, $progressBar);
        this.displayRewardsCheckmark(data, $progressBar);
    }

    displayRewardsDiscountInfo(data) {
        const $progressBar = $('#host-rewards .discount-progress');
        $(window).resize(() => {
            const newWidth = this.getRewardCategoryWidth(data, data.Maximum / 5);
            $progressBar.width(newWidth);
        });
        this.displayRewardsBar(data, data.Maximum / 5, $progressBar);
        this.displayRewardsAmount(data.DisplayValue, $progressBar);
        this.displayRewardsCheckmark(data, $progressBar);
    }

    displayRewardsBar(data, multiple, $progressBar) {
        const width = this.getRewardCategoryWidth(data, multiple);
        $progressBar.width(width);
    }

    displayRewardsAmount(displayValue, $progressBar) {
        const formattedValue = displayValue.split('.')[0];
        $progressBar.find('.progress-amount').html(formattedValue);
    }

    getRewardCategoryWidth(data, multiple) {
        const minWidth = 20;
        const barWidth = $('#host-rewards .progress-container').width();

        if (data.Value === 0) {
            return minWidth;
        }

        if (data.Value >= data.Maximum) {
            return barWidth;
        }

        const roundedMultiple = Math.floor(data.Value / multiple) * multiple;
        if (roundedMultiple === 0) {
            return minWidth;
        }
        const percent = roundedMultiple / data.Maximum;
        const widthPixels = barWidth * percent;
        return widthPixels;
    }

    displayRewardsCheckmark(data, $element) {
        if (data.Value >= data.Maximum) {
            $($element.find('.pointer')).addClass('achieved');
        }
    }

    clearGuestsInfo() {
        $('#partyOrders tbody').empty();
        $('#partyOrders .booked-parties .party-list').empty();
        $('#partyOrders .guest-info-pagination-container').remove();
    }

    getPagination() {
        const totalRecordCount = this.guestInfo.TotalGuests;
        const displayNumPages = 6; // This doesn't seem to do anything

        const $paginationContainer = $('<div>', { class: 'guest-info-pagination-container' });
        const $paginationList = $('<div>', { class: 'guest-info-pagination pagination' });

        pagination(
            $paginationList,
            this.guestCurrentPage,
            Math.ceil(totalRecordCount / this.guestPageSize),
            displayNumPages,
            (p) => this.goToPage(p, this.guestInfo),
        );

        $paginationContainer.append($paginationList);
        $('#partyOrders').append($paginationContainer);
    }

    goToPage(p) {
        this.guestCurrentPage = p;
        this.displayGuestsTableInfo();
    }

    getPageGuests() {
        const chunks = [];
        if (this.guestInfo.Guests.length === 0) {
            return chunks;
        }

        for (let i = 0; i < this.guestInfo.Guests.length; i += this.guestPageSize) {
            chunks.push(this.guestInfo.Guests.slice(i, i + this.guestPageSize));
        }
        return chunks[this.guestCurrentPage - 1];
    }

    displayGuestsInfo(guests) {
        if (guests.length === 0) {
            this.insertEmptyGuestRows();
            this.fillEmptyGuestRows();
            $('#partyOrders .guest-info-pagination-container').hide();
            $('#partyOrders .guest-info-pagination-container').hide();
            return;
        }
        guests.forEach((guest) => {
            this.insertGuestRow(guest);
        });
        if (guests.length < this.guestPageSize) {
            this.insertEmptyGuestRows(this.guestPageSize - guests.length);
        }
    }

    insertEmptyGuestRows(n = 10) {
        for (let i = 0; i < n; i++) {
            const $row = $('<tr>', { class: 'system-14' });
            $row.append($('<td>', { colspan: 3 }));
            $('#partyOrders tbody').append($row);
        }
    }

    fillEmptyGuestRows() {
        const $firstCell = $('#partyOrders .simple-table tbody tr:first-of-type td');
        const $allCells = $('#partyOrders .simple-table tbody td');

        $allCells.attr('colspan', 3);
        $firstCell.html('Your party orders will display here.');
    }

    insertGuestRow(guest) {
        const $row = $('<tr>');
        const date = new Date(guest.OrderFormCreateDate).toLocaleDateString();
        $row.append($('<td>').append(date));
        const star = '<span class="icon icon--ratingFull star"><svg><use xlink:href="#icon-star"><svg viewBox="0 0 26 28" id="icon-star"> <path d="M0 10.109q0-0.578 0.875-0.719l7.844-1.141 3.516-7.109q0.297-0.641 0.766-0.641t0.766 0.641l3.516 7.109 7.844 1.141q0.875 0.141 0.875 0.719 0 0.344-0.406 0.75l-5.672 5.531 1.344 7.812q0.016 0.109 0.016 0.313 0 0.328-0.164 0.555t-0.477 0.227q-0.297 0-0.625-0.187l-7.016-3.687-7.016 3.687q-0.344 0.187-0.625 0.187-0.328 0-0.492-0.227t-0.164-0.555q0-0.094 0.031-0.313l1.344-7.812-5.688-5.531q-0.391-0.422-0.391-0.75z"></path> </svg></use></svg></span>';
        let guestRecipient = `<span class="guest-recipient">${guest.Recipient}</span>`;
        guestRecipient = guest.Booked ? (star + guestRecipient) : guestRecipient;
        $row.append($('<td>').append(guestRecipient));
        const total = guest.GuestOrderTotal.toFixed(2);
        $row.append($('<td>').append(`$${total}`));
        $('#partyOrders tbody').append($row);
    }


    displayPaginationInfo() {
        const ordersTotal = this.getOrdersTotal();
        const totalRecordCount = this.guestInfo.TotalGuests;
        const pageSizeCount = totalRecordCount < this.guestPageSize ? totalRecordCount : this.guestPageSize;

        $('#partyOrders .display-count').html(`Displaying ${pageSizeCount} out of ${totalRecordCount} orders. Total: ${ordersTotal}`);
    }

    getOrdersTotal() {
        let ordersTotal = 0;

        this.guestInfo.Guests.forEach((guest) => {
            ordersTotal += guest.GuestOrderTotal;
        });

        return `$${ordersTotal.toLocaleString()}`;
    }

    displayBookedPartiesInfo() {
        const guests = this.bookingsInfo.Bookings;
        const maxBookings = 5;
        const totalBookings = this.bookingsInfo.TotalBookings > maxBookings ? maxBookings : this.bookingsInfo.TotalBookings;
        guests.forEach((booking) => {
            this.insertBookedPartyRow(booking);
        });
        if (totalBookings === 1) {
            $('#partyOrders .collapsible').html(`${totalBookings} Booked Party`);
        } else {
            $('#partyOrders .collapsible').html(`${totalBookings} Booked Parties`);
        }
    }

    bindPartyEvents() {
        $('#partyOrders .booked-parties .collapse-parent').click(() => {
            $('#partyOrders .booked-parties').toggleClass('collapsed');
        });
    }

    insertBookedPartyRow(booking) {
        const date = new Date(booking.PartyDate).toLocaleDateString();
        const $row =
            $('<div>', { class: 'party' })
                .append($('<span>', { class: 'system-12' })
                    .append(`${booking.Recipient} on ${date}`));
        $('#partyOrders .booked-parties .party-list').append($row);
    }
}

export default function () {
    if (window.location.href.indexOf('host-planner') > -1) {
        return new PartySummary();
    }
}
