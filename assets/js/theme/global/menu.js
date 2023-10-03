import collapsibleFactory from '../common/collapsible';
import collapsibleGroupFactory from '../common/collapsible-group';

const PLUGIN_KEY = 'menu';

/*
 * Manage the behaviour of a menu
 * @param {jQuery} $menu
 */
class Menu {
    constructor($menu) {
        this.$menu = $menu;
        this.$body = $('body');
        this.hasMaxMenuDisplayDepth = this.$body.find('.navPages-list').hasClass('navPages-list-depth-max');

        // Init collapsible
        this.collapsibles = collapsibleFactory('[data-collapsible]', { $context: this.$menu });
        this.collapsibleGroups = collapsibleGroupFactory($menu);

        // Auto-bind
        this.onMenuClick = this.onMenuClick.bind(this);

        // Listen
        this.bindEvents();
        this.initListeners();
        this.updateMenuLocation();
    }

    initListeners() {
        $(window).on('resize', () => this.updateMenuLocation());
    }
    updateMenuLocation() {
        if (window.innerWidth <= 800) {
            // Mobile menu. Move it to the original location
            $('#navPages-mainmenu-catshop').prependTo($('#navPages-catshop'));
            $('.right-menu').appendTo($('.tst-menu'));
            $('.right-menu .navPages-list--user').remove();
        } else {
            // Desktop menu. Move it to after the header
            $('.header-logo').after($('#navPages-catshop'));
        }
        const empty = function isEmpty(el) {
            return !$.trim(el.html());
        };
        function bannersTop() {
            if (empty($('.banner_left>div'))) {
                $('.banner_left').remove();
            }
            if (empty($('.banner_middle>div'))) {
                $('.banner_middle').remove();
            }
            if (empty($('.banner_right>div'))) {
                $('.banner_right').remove();
            }
            if (empty($('.banner-container'))) {
                $('.banner-tst').remove();
            }
            if (document.getElementsByClassName('find-partybar')[0].innerText === 'FIND A PARTY OR A FUNDRAISER') {
                $('.partybar-left').css('display', 'none');
                $('.consultant-partybar-container').css('grid-template-columns', '1fr');
            }
            if (document.getElementsByClassName('partybar-consult')[0].innerText === 'FIND A CONSULTANT') {
                $('.partybar-right').remove();
            }
            if (($('.partybar-consult').html() === 'find a consultant') && ($('.partybar-main-text').html() === 'Find a Party or a Fundraiser')) {
                $('.consultant-partybar').remove();
            }
        }
        setTimeout(bannersTop, 500);
    }

    collapseAll() {
        this.collapsibles.forEach(collapsible => collapsible.close());
        this.collapsibleGroups.forEach(group => group.close());
    }

    collapseNeighbors($neighbors) {
        const $collapsibles = collapsibleFactory('[data-collapsible]', { $context: $neighbors });

        $collapsibles.forEach($collapsible => $collapsible.close());
    }

    bindEvents() {
        this.$menu.on('click', this.onMenuClick);
    }

    unbindEvents() {
        this.$menu.off('click', this.onMenuClick);
    }

    onMenuClick(event) {
        event.stopPropagation();

        if (this.hasMaxMenuDisplayDepth) {
            const $neighbors = $(event.target).parent().siblings();

            this.collapseNeighbors($neighbors);
        }
    }
}

/*
 * Create a new Menu instance
 * @param {string} [selector]
 * @return {Menu}
 */
export default function menuFactory(selector = `[data-${PLUGIN_KEY}]`) {
    const $menu = $(selector).eq(0);
    const instanceKey = `${PLUGIN_KEY}Instance`;
    const cachedMenu = $menu.data(instanceKey);

    if (cachedMenu instanceof Menu) {
        return cachedMenu;
    }

    const menu = new Menu($menu);

    $menu.data(instanceKey, menu);

    return menu;
}
