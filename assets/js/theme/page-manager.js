import TSRouter from './global/ts-router';

export default class PageManager {
    constructor(context) {
        this.context = context;
        this.router = new TSRouter(context.themeSettings);
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
