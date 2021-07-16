import PageManager from '../page-manager';
import TSApi from '../common/ts-api';
import TSCookie from '../common/ts-cookie';
import pagination from '../common/pagination';
//For await
import "core-js/stable";
import "regenerator-runtime/runtime";

class PartySummary {
    constructor() {
        this.api = new TSApi();
        this.pid = TSCookie.getPartyId();
        this.guestCurrentPage = 1;
        this.guestPageSize = 10;
        this.displayGuestsTableInfo();
        this.displayRewardsInfo();
    }

    async displayGuestsTableInfo(guestInfo = null) {
        this.clearGuestsInfo();
        
        if (guestInfo == null) {
            var guestInfo = {"Guests": [], "TotalGuests": 0}; 
            if (typeof this.pid !== 'undefined') {
                try {
                    guestInfo = await this.api.getPartyGuests(this.pid);
                } catch(error) {
                    console.warn('getPartyGuests:', error);
                    guestInfo = {"Guests": [], "TotalGuests": 0};
                }
            }
        }

        const pageGuests = this.getPageGuests(guestInfo.Guests);
        this.getPagination(guestInfo);
        this.displayGuestsInfo(pageGuests);
        this.displayPaginationInfo(pageGuests, guestInfo.TotalGuests);
        this.displayBookedPartiesInfo(pageGuests);
    }

    async displayRewardsInfo() {
        var rewardsInfo = {"Rewards": [], "PartySales": 0}; 

        if (typeof this.pid !== 'undefined') {
            try {
                rewardsInfo = await this.api.getPartyRewards(this.pid);
            } catch(error) {
                console.warn('getPartyRewards:', error);
                rewardsInfo = {"Rewards": [], "PartySales": 0};
            }
        }


        this.displayRewardsSalesInfo(rewardsInfo.PartySales);
        rewardsInfo.Rewards.forEach((rewardCategoryInfo) => {
            switch(rewardCategoryInfo.Label) {
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

    displayRewardsSalesInfo(sales) {
        var formattedSales = Math.trunc(sales);
        if (sales != 0) {
            $('#host-rewards .rewards-amount-container').show();
            $('#host-rewards #rewards-amount').html(`$${formattedSales}`); 
        } else {
            $('#host-rewards .rewards-message').show();
        }
    }

    displayRewardsFreeShippingInfo(data) {
        var $progressBar = $('#host-rewards .shipping-progress');
        this.displayRewardsBar(data, data.Maximum / 5, $progressBar);
        this.displayRewardsAmount(data.DisplayValue, $progressBar);
        this.displayRewardsCheckmark(data, $progressBar);
    }

    displayRewardsProductEarnedInfo(data) {
        var $progressBar = $('#host-rewards .product-progress');
        this.displayRewardsBar(data, data.Maximum / 10, $progressBar);
        this.displayRewardsAmount(data.DisplayValue, $progressBar);
        this.displayRewardsCheckmark(data, $progressBar);
    }

    displayRewardsDiscountInfo(data) {
        var $progressBar = $('#host-rewards .discount-progress');
        this.displayRewardsBar(data, data.Maximum / 5, $progressBar);
        this.displayRewardsAmount(data.DisplayValue, $progressBar);
        this.displayRewardsCheckmark(data, $progressBar);
    }

    displayRewardsBar(data, multiple, $progressBar) {
        const width = this.getRewardCategoryWidth(data, multiple);
        $progressBar.css('width', width);
    }

    displayRewardsAmount(displayValue, $progressBar) {
        var formattedValue = displayValue.split('.')[0];
        $progressBar.find('.progress-amount').html(formattedValue);
    }

    getRewardCategoryWidth(data, multiple) {
        const barWidth = 456;

        if (data.Value == 0) {
            return 20;
        }

        if (data.Value >= data.Maximum) {
            return barWidth;
        }

        var roundedMultiple = Math.floor(data.Value / multiple) * multiple;
        var percent = roundedMultiple / data.Maximum; 
        var widthPixels = barWidth * percent;
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

    getPagination(guestInfo) {
        const totalRecordCount = guestInfo.TotalGuests;
        const displayNumPages = 6; //This doesn't seem to do anything

        const $paginationContainer = $('<div>', { class: 'guest-info-pagination-container' });
        const $paginationList = $('<div>', { class: 'guest-info-pagination pagination' });

        pagination(
            $paginationList,
            this.guestCurrentPage,
            Math.ceil(totalRecordCount / this.guestPageSize),
            displayNumPages,
            (p) => this.goToPage(p, guestInfo)
        );

        $paginationContainer.append($paginationList);
        $('#partyOrders').append($paginationContainer);
    }

    goToPage(p, guestInfo) {
        this.guestCurrentPage = p;
        this.displayGuestsTableInfo(guestInfo);
    }

    getPageGuests(guests) {
        if (guests.length == 0) {
            return [];
        }

        var chunks = [];
        for (let i = 0; i < guests.length; i += this.guestPageSize) {
           chunks.push(guests.slice(i, i + this.guestPageSize));
        }
      
        return chunks[this.guestCurrentPage-1];
    }

    displayGuestsInfo(guests) {
        if (guests.length == 0) {
            this.insertEmptyGuestRows();
            this.fillEmptyGuestRows();
            $('#partyOrders .guest-info-pagination-container').hide();
            $('#partyOrders .guest-info-pagination-container').hide();
            $('#partyOrders .booked-parties').toggleClass('collapsed');
            return;
        }
        guests.forEach((guest) => {
            this.insertGuestRow(guest);
        });
    }

    insertEmptyGuestRows() {
        for (let i = 0; i < 10; i++) {
            var $row = $('<tr>');
            $row.append($('<td>'));
            $('#partyOrders tbody').append($row);
        }
    }

    fillEmptyGuestRows() {
        var $firstCell = $('#partyOrders .simple-table tbody tr:first-of-type td'); 
        var $allCells = $('#partyOrders .simple-table tbody td');

        $allCells.attr('colspan', 3);
        $allCells.css('height', '34px');
        $firstCell.html('Your party orders will display here.');
    }

    insertGuestRow(guest) {
        var $row = $('<tr>');
        var date = new Date(guest.OrderFormCreateDate).toLocaleDateString();
        $row.append($('<td>').append(date));
        const star = '<span class="icon icon--ratingFull star"><svg><use xlink:href="#icon-star"><svg viewBox="0 0 26 28" id="icon-star"> <path d="M0 10.109q0-0.578 0.875-0.719l7.844-1.141 3.516-7.109q0.297-0.641 0.766-0.641t0.766 0.641l3.516 7.109 7.844 1.141q0.875 0.141 0.875 0.719 0 0.344-0.406 0.75l-5.672 5.531 1.344 7.812q0.016 0.109 0.016 0.313 0 0.328-0.164 0.555t-0.477 0.227q-0.297 0-0.625-0.187l-7.016-3.687-7.016 3.687q-0.344 0.187-0.625 0.187-0.328 0-0.492-0.227t-0.164-0.555q0-0.094 0.031-0.313l1.344-7.812-5.688-5.531q-0.391-0.422-0.391-0.75z"></path> </svg></use></svg></span>';
        var guestRecipient = '<span class="guest-recipient">' + guest.Recipient + '</span>';
        guestRecipient = guest.Booked ? (star + guestRecipient) : guestRecipient;
        $row.append($('<td>').append(guestRecipient));
        $row.append($('<td>').append(guest.GuestOrderTotal));
        $('#partyOrders tbody').append($row);
    }


    displayPaginationInfo(pageGuests, totalGuests) {
        const pageOrderTotal = this.getPageOrderTotal(pageGuests, totalGuests);
        const totalRecordCount = totalGuests;
        const pageSizeCount = totalRecordCount < this.guestPageSize ? totalRecordCount : this.guestPageSize;

        $('#partyOrders .display-count').html(`Displaying ${pageSizeCount} out of ${totalRecordCount} orders. Total: ${pageOrderTotal}`);
    }

    getPageOrderTotal(pageGuests, totalGuests) {
        var pageOrderTotal = 0;

        pageGuests.forEach((guest) => {
            pageOrderTotal += guest.GuestOrderTotal; 
        });

        return `$${pageOrderTotal.toLocaleString()}`;
    }

    displayBookedPartiesInfo(guests) {
        const max = 5;
        var bookedParties = 0;
        this.bindPartyEvents();
        for (let i = 0; i < guests.length; i++) {
            if (guests[i].Booked == true) {
                this.insertBookedPartyRow(guests[i]);
                bookedParties++;
            }
        }
        $('#partyOrders .collapsible').html(`${bookedParties} Booked Parties`);
        if (bookedParties == 0) {
            $('#partyOrders .booked-parties').toggleClass('collapsed');
        }
    }

    bindPartyEvents() {
        $('#partyOrders .booked-parties .collapse-parent').click(() => {
            $('#partyOrders .booked-parties').toggleClass('collapsed');
        });
    }

    insertBookedPartyRow(guest) {
        var date = new Date(guest.OrderFormCreateDate).toLocaleDateString();
        var $row = 
            $('<div>', {"class": "party"})
            .append($('<span>')
            .append(guest.Recipient + ' on ' + date))
        $('#partyOrders .booked-parties .party-list').append($row);
    }
}

export default function () {
    if (window.location.href.indexOf("host-planner") > -1) {
        return new PartySummary();
    }
}
