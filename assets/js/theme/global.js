import './global/jquery-migrate';
import './common/select-option-plugin';
import PageManager from './page-manager';
import quickSearch from './global/quick-search';
import currencySelector from './global/currency-selector';
import mobileMenuToggle from './global/mobile-menu-toggle';
import menu from './global/menu';
import foundation from './global/foundation';
import quickView from './global/quick-view';
import cartPreview from './global/cart-preview';
import privacyCookieNotification from './global/cookieNotification';
import maintenanceMode from './global/maintenanceMode';
import carousel from './common/carousel';
import loadingProgressBar from './global/loading-progress-bar';
import svgInjector from './global/svg-injector';
import objectFitImages from './global/object-fit-polyfill';
import joinProcessInteraction from './global/joinProcessInteraction';
import shippingModalInteraction from './global/shippingModalInteraction';
import accordian from './global/accordian';
import newsletterAlert from './global/newsletter-alert';
import stickyHeader from './global/sticky-header';
import findConsultant from './global/find-consultant';
import findParty from './global/find-party';
import tooltip from './global/tooltip';
import tsCheckUserLogin from './global/ts-check-user-login';


export default class Global extends PageManager {
    onReady() {
        cartPreview(this.context.secureBaseUrl, this.context.cartId);
        quickSearch();
        currencySelector();
        foundation($(document));
        quickView(this.context);
        carousel();
        menu();
        mobileMenuToggle();
        privacyCookieNotification();
        maintenanceMode(this.context.maintenanceMode);
        loadingProgressBar();
        svgInjector();
        objectFitImages();
        joinProcessInteraction(this.context.themeSettings);
        shippingModalInteraction(this.context.themeSettings);
        accordian();
        newsletterAlert();
        stickyHeader();
        findConsultant();
        findParty();
        tooltip();
        tsCheckUserLogin();
    }
}
