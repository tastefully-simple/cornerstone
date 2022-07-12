import { api, hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import FacetedSearch from './common/faceted-search';
import compareProducts from './global/compare-products';
import urlUtils from './common/utils/url-utils';
import Url from 'url';
import collapsibleFactory from './common/collapsible';
import 'jstree';
import nod from './common/nod';

const leftArrowKey = 37;
const rightArrowKey = 39;

export default class Search extends CatalogPage {
    // eslint-disable-next-line no-useless-constructor
    constructor(context) {
        super(context);
    }
    formatCategoryTreeForJSTree(node) {
        const nodeData = {
            text: node.data,
            id: node.metadata.id,
            state: {
                selected: node.selected,
            },
        };

        if (node.state) {
            nodeData.state.opened = node.state === 'open';
            nodeData.children = true;
        }

        if (node.children) {
            nodeData.children = [];
            node.children.forEach((childNode) => {
                nodeData.children.push(this.formatCategoryTreeForJSTree(childNode));
            });
        }

        return nodeData;
    }

    showProducts(navigate = true) {
        this.$productListingContainer.removeClass('u-hidden');
        this.$facetedSearchContainer.removeClass('u-hidden');
        this.$contentResultsContainer.addClass('u-hidden');

        $('[data-content-results-toggle]').removeClass('navBar-action-color--active');
        $('[data-content-results-toggle]').addClass('navBar-action');

        $('[data-product-results-toggle]').removeClass('navBar-action');
        $('[data-product-results-toggle]').addClass('navBar-action-color--active');

        this.activateTab($('[data-product-results-toggle]'));

        if (!navigate) {
            return;
        }

        const searchData = $('#search-results-product-count span').data();
        const url = (searchData.count > 0) ? searchData.url : urlUtils.replaceParams(searchData.url, {
            page: 1,
        });

        urlUtils.goToUrl(url);
    }

    showContent(navigate = true) {
        this.$contentResultsContainer.removeClass('u-hidden');
        this.$productListingContainer.addClass('u-hidden');
        this.$facetedSearchContainer.addClass('u-hidden');

        $('[data-product-results-toggle]').removeClass('navBar-action-color--active');
        $('[data-product-results-toggle]').addClass('navBar-action');

        $('[data-content-results-toggle]').removeClass('navBar-action');
        $('[data-content-results-toggle]').addClass('navBar-action-color--active');

        this.activateTab($('[data-content-results-toggle]'));

        if (!navigate) {
            return;
        }

        const searchData = $('#search-results-content-count span').data();
        const url = (searchData.count > 0) ? searchData.url : urlUtils.replaceParams(searchData.url, {
            page: 1,
        });

        urlUtils.goToUrl(url);
    }

    activateTab($tabToActivate) {
        const $tabsCollection = $('[data-search-page-tabs]').find('[role="tab"]');

        $tabsCollection.each((idx, tab) => {
            const $tab = $(tab);

            if ($tab.is($tabToActivate)) {
                $tab.removeAttr('tabindex');
                $tab.attr('aria-selected', true);
                return;
            }

            $tab.attr('tabindex', '-1');
            $tab.attr('aria-selected', false);
        });
    }

    onTabChangeWithArrows(event) {
        const eventKey = event.which;
        const isLeftOrRightArrowKeydown = eventKey === leftArrowKey
            || eventKey === rightArrowKey;
        if (!isLeftOrRightArrowKeydown) return;

        const $tabsCollection = $('[data-search-page-tabs]').find('[role="tab"]');

        const isActiveElementNotTab = $tabsCollection.index($(document.activeElement)) === -1;
        if (isActiveElementNotTab) return;

        const $activeTab = $(`#${document.activeElement.id}`);
        const activeTabIdx = $tabsCollection.index($activeTab);
        const lastTabIdx = $tabsCollection.length - 1;

        let nextTabIdx;
        switch (eventKey) {
            case leftArrowKey:
                nextTabIdx = activeTabIdx === 0 ? lastTabIdx : activeTabIdx - 1;
                break;
            case rightArrowKey:
                nextTabIdx = activeTabIdx === lastTabIdx ? 0 : activeTabIdx + 1;
                break;
            default: break;
        }

        $($tabsCollection.get(nextTabIdx)).focus().trigger('click');
    }

    getUrlParameter(queryParam) {
        const regex = new RegExp(`[\\?&]${queryParam}=([^&#]*)`);
        const results = regex.exec(window.location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    setupSortByQuerySearchParam() {
        const searchQuery = this.getUrlParameter('search_query');

        if (searchQuery.length === 0) return;

        const $baseInput = $('<input/>').attr('type', 'hidden');

        $('[data-sort-by]').each((idx, form) => {
            const $form = $(form);
            $form.append(
                $baseInput.clone().attr({
                    name: 'search_query',
                    value: searchQuery,
                }),
                $baseInput.clone().attr({
                    name: 'section',
                    value: $form.data('sort-by'),
                }),
            );
        });
    }

    onReady() {
        const urlParams = new URLSearchParams(window.location.search);
        const currentCategory = urlParams.get('category');
        const recipesCategoryId = this.context.themeSettings.recipe_search_category_recipe_filter_id;
        const self = this;

        if (typeof currentCategory !== 'undefined' && currentCategory === recipesCategoryId) {
            // We are searching for recipes, therefore the sidebar is being displayed.
            // Load all filters and hide the "show more" links
            $('#facetedSearch ul[data-has-more-results="true"]').each((index, element) => {
                const facet = $(element).attr('data-facet');
                self.getMoreFacetResults(facet, element);
            });
        }

        compareProducts(this.context.urls);
        this.setupSortByQuerySearchParam();

        const $searchForm = $('[data-advanced-search-form]');
        const $categoryTreeContainer = $searchForm.find('[data-search-category-tree]');
        const url = Url.parse(window.location.href, true);
        const treeData = [];
        this.$productListingContainer = $('#product-listing-container');
        this.$facetedSearchContainer = $('#faceted-search-container');
        this.$contentResultsContainer = $('#search-results-content');

        // Verifies if the recipe search is enabled
        if (this.context.themeSettings.recipe_search_status === '1') {
            this.initRecipeSearch();
        }

        // Init faceted search
        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }

        // Init collapsibles
        collapsibleFactory();

        $('[data-product-results-toggle]').on('click', event => {
            event.preventDefault();
            this.showProducts();
        });

        $('[data-content-results-toggle]').on('click', event => {
            event.preventDefault();
            this.showContent();
        });

        $('[data-search-page-tabs]').on('keyup', this.onTabChangeWithArrows);

        if (this.$productListingContainer.find('li.product').length === 0 || url.query.section === 'content') {
            this.showContent(false);
        } else {
            this.showProducts(false);
        }

        const validator = this.initValidation($searchForm)
            .bindValidation($searchForm.find('#search_query_adv'));

        this.context.categoryTree.forEach((node) => {
            treeData.push(this.formatCategoryTreeForJSTree(node));
        });

        this.categoryTreeData = treeData;
        this.createCategoryTree($categoryTreeContainer);

        $searchForm.on('submit', event => {
            const selectedCategoryIds = $categoryTreeContainer.jstree().get_selected();

            if (!validator.check()) {
                return event.preventDefault();
            }

            $searchForm.find('input[name="category\[\]"]').remove();

            for (const categoryId of selectedCategoryIds) {
                const input = $('<input>', {
                    type: 'hidden',
                    name: 'category[]',
                    value: categoryId,
                });

                $searchForm.append(input);
            }
        });

        setTimeout(() => {
            $('[data-search-aria-message]').removeClass('u-hidden');
        }, 100);
    }

    getMoreFacetResults(facet, ulResult) {
        const facetUrl = urlUtils.getUrl();

        api.getPage(facetUrl, {
            template: 'search/show-more-auto',
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

    loadTreeNodes(node, cb) {
        $.ajax({
            url: '/remote/v1/category-tree',
            data: {
                selectedCategoryId: node.id,
                prefix: 'category',
            },
            headers: {
                'x-xsrf-token': window.BCData && window.BCData.csrf_token ? window.BCData.csrf_token : '',
            },
        }).done(data => {
            const formattedResults = [];

            data.forEach((dataNode) => {
                formattedResults.push(this.formatCategoryTreeForJSTree(dataNode));
            });

            cb(formattedResults);
        });
    }

    createCategoryTree($container) {
        const treeOptions = {
            core: {
                data: (node, cb) => {
                    // Root node
                    if (node.id === '#') {
                        cb(this.categoryTreeData);
                    } else {
                        // Lazy loaded children
                        this.loadTreeNodes(node, cb);
                    }
                },
                themes: {
                    icons: true,
                },
            },
            checkbox: {
                three_state: false,
            },
            plugins: [
                'checkbox',
            ],
        };

        $container.jstree(treeOptions);
    }

    initFacetedSearch() {
        // eslint-disable-next-line object-curly-newline
        const { onMinPriceError, onMaxPriceError, minPriceNotEntered, maxPriceNotEntered, onInvalidPrice } = this.context;
        const $productListingContainer = $('#product-listing-container');
        const $contentListingContainer = $('#search-results-content');
        const $facetedSearchContainer = $('#faceted-search-container');
        const $searchHeading = $('#search-results-heading');
        const $contentCount = $('#search-results-content-count');
        const productsPerPage = this.context.searchProductsPerPage;
        const requestOptions = {
            template: {
                productListing: 'search/product-listing',
                contentListing: 'search/content-listing',
                sidebar: 'search/sidebar',
                heading: 'search/heading',
                productCount: 'search/product-count',
                contentCount: 'search/content-count',
            },
            config: {
                product_results: {
                    limit: productsPerPage,
                },
            },
            showMore: 'search/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $searchHeading.html(content.heading);

            const url = Url.parse(window.location.href, true);
            if (url.query.section === 'content') {
                $contentListingContainer.html(content.contentListing);
                $contentCount.html(content.contentCount);
                this.showContent(false);
            } else {
                $productListingContainer.html(content.productListing);
                $facetedSearchContainer.html(content.sidebar);
                this.showProducts(false);
            }

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

    initValidation($form) {
        this.$form = $form;
        this.validator = nod({
            submit: $form,
        });

        return this;
    }

    bindValidation($element) {
        if (this.validator) {
            this.validator.add({
                selector: $element,
                validate: 'presence',
                errorMessage: $element.data('errorMessage'),
            });
        }

        return this;
    }

    check() {
        if (this.validator) {
            this.validator.performCheck();
            return this.validator.areAll('valid');
        }

        return false;
    }
    initRecipeSearch() {
        const urlParams = new URLSearchParams(window.location.search);
        const currentCategory = urlParams.get('category');
        const recipesCategoryId = this.context.themeSettings.recipe_search_category_recipe_filter_id;
        const productsCategoryId = this.context.themeSettings.recipe_search_category_shop_filter_id;

        /**
         * If the current search results page is not recipes, make a request to count how many recipes were found
         * for the current query and set the results together with the results page link
         */
        if (typeof currentCategory !== 'undefined' && currentCategory === recipesCategoryId) {
            this.getResultsCount('products', productsCategoryId, this.context.themeSettings.categorypage_products_per_page);
        } else {
            // We are displaying recipes in the search results. Count how many products can be found for the same query
            this.getResultsCount('recipes', recipesCategoryId, this.context.themeSettings.recipespage_products_per_page);
        }
    }
    getResultsCount(type, categoryId, limitPage) {
        const urlParams = new URLSearchParams(window.location.search);
        const headers = {
            'stencil-options': '{"render_with":"recipes/empty,recipes/empty,recipes/empty,recipes/search-results-content-count"}',
            'x-xsrf-token': window.BCData && window.BCData.csrf_token ? window.BCData.csrf_token : '',
            'x-requested-with': 'stencil-utils',
            'accept-language': ' en-US,en;q=0.5',
        };
        const config = {
            method: 'GET',
            headers,
            credentials: 'include',
        };

        // Set new params for the search results URL
        urlParams.set('category', categoryId);
        urlParams.set('page', 1);
        urlParams.set('limit', limitPage);

        // Create URL for the search results
        const url = `${window.location.origin + window.location.pathname}?${urlParams.toString()}`;

        return fetch(url, config)
            .then(async r => {
                const response = await r.json();
                if (typeof response !== 'undefined' && typeof response['components/recipes/search-results-content-count'] !== 'undefined') {
                    // eslint-disable-next-line radix
                    const totalItemsFound = parseInt(response['components/recipes/search-results-content-count']);
                    // If items are found, create a link and display it
                    if (totalItemsFound > 0) {
                        document.getElementById(`${type}-search-results-count`).innerHTML = '';
                        const searchResultsLink = document.createElement('a');
                        searchResultsLink.href = url;
                        searchResultsLink.innerHTML = `${type}(${totalItemsFound})`;
                        document.getElementById(`${type}-search-results-count`).appendChild(searchResultsLink);
                    } else {
                        document.getElementById(`${type}-search-results-count`).innerHTML = `${type}(0)`;
                    }
                } else {
                    document.getElementById(`${type}-recipe-search-results-count`).innerHTML = `${type}(0)`;
                }
            })
            .catch((err) => console.error(err));
    }
}
