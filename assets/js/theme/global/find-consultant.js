import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';

/**
 * Makes an API call to retrieve consultants (based off of search parameters)
 * and returns the data in a json object
 */
function getConsultantSearchResults(searchParameters) {
    var json = {
      "item1": 1,
      "item2": 2,
    };
    return json;
}

/**
 * Creates a Cornerstone popup modal for Find A Consultant. 
 * A second view is available once the user hits search. The modal is then 
 * populated with data from the user's search parameters
 */
export default function() {
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

    $('body').on('click', '.button-alternate', function() {
        $("#consultant-search").hide();
        $("#consultant-search-results").show();
    });
  });
}
