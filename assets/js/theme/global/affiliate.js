/**
 * This function grabs the affiliate id from the Social Bug <div> tag and
 * appends it to the "Shop more" button.
 */
export default function () {
    const affiliateId = $('#affiliatediv').data('affiliateid');
    const affiliateParam = affiliateId !== undefined ? `&afid=${affiliateId}` : '';

    $('#shop-more-btn').attr('href', (i, href) => href + affiliateParam);
}
