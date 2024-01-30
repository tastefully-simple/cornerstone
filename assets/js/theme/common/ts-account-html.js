export default function createAccountSignup() {
    let parentDiv = document.createElement('div');
    parentDiv.classList.add('customer-no-account');
    const html = `
        <div class="img-container">
            <img src="/assets/img/vip_rewards.png" alt="Vip Rewards"> 
        </div>
        <div class="customer-no-account-text"> 
            <p class="create-account-text"><a href="/login.php">Sign in</a> or <a href="/login.php?action=create_account">create an account</a> to earn reward points on this order.</p> 
            <br> 
            <p class="have-account-text">Already have an account?<br><a href="/login.php">Sign in now.</a></p> 
        </div>
    `;
    parentDiv.innerHTML = html;

    return parentDiv;
}
