import TSRouter from './global/ts-router';

export default class PageManager {
    constructor(context) {
        this.context = context;
        if (!context.template || !(context.template && context.template == 'pages/checkout')) {
            this.router = new TSRouter(context.themeSettings);
        }
    }

    type() {
        return this.constructor.name;
    }

    onReady() {
    }

    static load(context) {
        const page = new this(context);

        $(document).ready(() => {
            page.onReady.bind(page)();
        });
    }
}
