import { api, hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import { createTranslationDictionary } from '../theme/common/utils/translations-utils';
import urlUtils from './common/utils/url-utils';

export default class Category extends CatalogPage {
    constructor(context) {
        super(context);
        this.validationDictionary = createTranslationDictionary(context);
    }

    onReady() {
        const self = this;
        $('[data-button-type="add-cart"]').on('click', (e) => {
            $(e.currentTarget).next().attr({
                role: 'status',
                'aria-live': 'polite',
            });
        });

        // Load all filters and hide the "show more" links
        $('#facetedSearch ul[data-has-more-results="true"]').each((index, element) => {
            const facet = $(element).attr('data-facet');
            self.getMoreFacetResults(facet, element);
        });

        compareProducts(this.context.urls);

        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }

        $('a.reset-btn').on('click', () => {
            $('span.reset-message').attr({
                role: 'status',
                'aria-live': 'polite',
            });
        });

        this.ariaNotifyNoProducts();
    }

    getMoreFacetResults(facet, ulResult) {
        let facetUrl = urlUtils.getUrl();
        if (facetUrl === '/recipes/') {
            const recipesPerPage = this.context.themeSettings.recipespage_products_per_page;
            facetUrl = `/recipes/?limit=${recipesPerPage}`;
        }

        api.getPage(facetUrl, {
            template: 'category/show-more-auto',
            params: {
                list_all: facet,
            },
        }, (err, response) => {
            if (err) {
                throw new Error(err);
            }
            $(ulResult).html(response);
        });

        return true;
    }

    ariaNotifyNoProducts() {
        const $noProductsMessage = $('[data-no-products-notification]');
        if ($noProductsMessage.length) {
            $noProductsMessage.focus();
        }
    }

    initFacetedSearch() {
        const {
            price_min_evaluation: onMinPriceError,
            price_max_evaluation: onMaxPriceError,
            price_min_not_entered: minPriceNotEntered,
            price_max_not_entered: maxPriceNotEntered,
            price_invalid_value: onInvalidPrice,
        } = this.validationDictionary;
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');

        /**
         * Choose the FacetedSearch results template and amount of products per page
         * according to the category URL
         */
        let productsPerPage;
        let productListingComponent;

        const pathName = window.location.pathname;

        if (pathName.search('/recipes/') !== -1) {
            // eslint-disable-next-line radix
            productsPerPage = parseInt(this.context.themeSettings.recipespage_products_per_page);
            productListingComponent = 'recipes/product-listing';

            const countTotalRecipes = $('.productGrid li').length;

            if (countTotalRecipes > productsPerPage) {
                /**
                 * Remove last recipe card when no limit is set in the query string
                 */
                $('.productGrid li:last-child').remove();
            }

            const urlParams = new URLSearchParams(window.location.search);
            // eslint-disable-next-line radix
            const currentRecipeLimit = urlParams.get('limit') ? parseInt(urlParams.get('limit')) : false;

            // If no limit is set on the current URL, add it to all:
            if (currentRecipeLimit !== productsPerPage) {
                // 1. Pagination Links
                $('ul.pagination-list li').each((index, element) => {
                    $(element).children('a')[0].href += `&limit=${productsPerPage}`;
                });

                $('#faceted-search-container .sidebarBlock ul.navList').each((indexNavlist, navlist) => {
                    let itemUrl;
                    $(navlist).children('li').each((index, element) => {
                        itemUrl = $(element).children('a')[0].href;

                        if (itemUrl.indexOf('?') === -1) {
                            $(element).children('a')[0].href += `?limit=${productsPerPage}`;
                        } else {
                            $(element).children('a')[0].href += `&limit=${productsPerPage}`;
                        }
                    });
                });
            }
        } else {
            productsPerPage = this.context.categoryProductsPerPage;
            productListingComponent = 'category/product-listing';
        }

        const requestOptions = {
            config: {
                category: {
                    shop_by_price: true,
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            template: {
                productListing: productListingComponent,
                sidebar: 'category/sidebar',
            },
            showMore: 'category/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $productListingContainer.html(content.productListing);
            $facetedSearchContainer.html(content.sidebar);
            $('body').triggerHandler('compareReset');

            $('html, body').animate({
                scrollTop: 0,
            }, 100);
        }, {
            validationErrorMessages: {
                onMinPriceError,
                onMaxPriceError,
                minPriceNotEntered,
                maxPriceNotEntered,
                onInvalidPrice,
            },
        });
    }
}
