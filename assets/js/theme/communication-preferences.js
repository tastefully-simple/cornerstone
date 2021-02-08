import PageManager from './page-manager';
import TSApi from './common/ts-api';


export default class CommunicationPreferences extends PageManager {
    constructor(context) {
        super(context);

        this.api = new TSApi();
        this.email = this.context.customerEmail;
        this.cid = this.context.customerId;
        this.container = document.querySelector('.account-head');

        return this;
    }

    onReady() {
        if (this.cid) {
            this.container.textContent = 'Loading...';
            this.iframeData();
        }
    }

    iframeData() {
        this.api.getCommunicationPreferences(this.email, this.cid)
            .then(src => {
                const iframe = document.createElement('iframe');

                iframe.id = 'iframe';
                iframe.src = src;
                iframe.setAttribute('width', '800px');
                iframe.setAttribute('height', '600px');
                this.container.textContent = '';
                this.container.append(iframe);
            })
            .catch(err => {
                this.container.textContent = 'Error handling request';
                console.warn('getCommunicationPreferences', err);
            });
    }
}
