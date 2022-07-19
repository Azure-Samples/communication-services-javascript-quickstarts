/** DOM manipulation */

export const initUI = function (signIn, signOut, displayToken) {
    document.getElementById('callCteButton').addEventListener("click", () => {
        displayToken();
    })
    document.getElementById('signInBtn').addEventListener("click", () => {
        signIn();
    });
    document.getElementById('signOutBtn').addEventListener("click", () => {
        signOut();
    });
};

export const welcomeUser = function (username) {

    const welcomeDiv = document.getElementById('welcome-div');
    welcomeDiv.innerHTML = `Logged in as ${username}!`
    welcomeDiv.classList.remove('d-none');

    document.getElementById('title-div').classList.add('d-none');
    document.getElementById('card-content').classList.remove('d-none');


    document.getElementById('signInBtn').classList.add('d-none');
    document.getElementById('signOutBtn').classList.remove('d-none');
    document.getElementById('callCteButton').classList.remove('d-none');
}

export const renderToken = function (token) {
    const response = document.getElementById("response");
    response.replaceChildren(document.createTextNode('\n' + JSON.stringify(token, null, 4) + '\n'));
}

