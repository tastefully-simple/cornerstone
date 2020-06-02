import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';
import $ from 'jquery';

export default function(context) {
  $(document).ready(function() {
    const modal = defaultModal();
    $('.headertoplinks-consult').on('click', (e) => {
      e.preventDefault();
      modal.open({ size: 'large' });
      const options = { template: 'common/find-consultant' }
      utils.api.getPage('/', options, (err, res) => {
        if (err) {
          console.error('Failed to get common/find-consultant. Error:', err);
          return false;
        } else if (res) {
          modal.updateContent(res);
        }
      });
    });
  });
}
