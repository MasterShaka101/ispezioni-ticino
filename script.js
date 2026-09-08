function login() {

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("login-message");

    if (username === "test" && password === "1234") {

        message.textContent = "Accesso effettuato!";

    } else {

        message.textContent = "Nome utente o password non corretti.";

    }
}
