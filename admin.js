// ========================================
// CONFIGURAZIONE SUPABASE
// ========================================

const SUPABASE_URL = "https://htcuwuhebznznjpizepz.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_AVWMx6QAsgorykTKjF8RGA_xYSw9G_O";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// ========================================
// ELEMENTI PAGINA
// ========================================

const loginArea =
    document.getElementById("admin-login");

const adminArea =
    document.getElementById("admin-area");

const loginButton =
    document.getElementById("login-button");

const logoutButton =
    document.getElementById("logout-button");

const loginMessage =
    document.getElementById("login-message");

const addCompanyButton =
    document.getElementById("add-company-button");

const companyForm =
    document.getElementById("company-form");

const cancelCompanyButton =
    document.getElementById("cancel-company-button");

const saveCompanyButton =
    document.getElementById("save-company-button");

const companyMessage =
    document.getElementById("company-message");

const companiesList =
    document.getElementById("companies-list");


// ========================================
// LOGIN AMMINISTRATORE
// ========================================

loginButton.addEventListener(
    "click",
    async function () {

        const email =
            document
                .getElementById("admin-email")
                .value
                .trim();

        const password =
            document
                .getElementById("admin-password")
                .value;


        const { error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });


        if (error) {

            loginMessage.textContent =
                error.message;

            return;
        }


        loginMessage.textContent = "";

        mostraAreaAdmin();

        caricaDitte();

    }
);


// ========================================
// MOSTRA AREA ADMIN
// ========================================

function mostraAreaAdmin() {

    loginArea.classList.add("hidden");

    adminArea.classList.remove("hidden");

}


// ========================================
// CONTROLLO SESSIONE
// ========================================

async function controllaSessione() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();


    if (session) {

        mostraAreaAdmin();

        caricaDitte();

    }

}


// ========================================
// LOGOUT
// ========================================

logoutButton.addEventListener(
    "click",
    async function () {

        await supabaseClient.auth.signOut();

        adminArea.classList.add("hidden");

        loginArea.classList.remove("hidden");

    }
);


// ========================================
// APRI FORM
// ========================================

addCompanyButton.addEventListener(
    "click",
    function () {

        companyForm.classList.remove("hidden");

        companyMessage.textContent = "";

    }
);


// ========================================
// CHIUDI FORM
// ========================================

cancelCompanyButton.addEventListener(
    "click",
    function () {

        companyForm.classList.add("hidden");

        pulisciForm();

    }
);


// ========================================
// SALVA NUOVA DITTA
// ========================================

saveCompanyButton.addEventListener(
    "click",
    async function () {

        const nome =
            document
                .getElementById("company-name")
                .value
                .trim();

        const codice =
            document
                .getElementById("company-code")
                .value
                .trim();

        const giorni =
            Number(
                document
                    .getElementById("company-days")
                    .value
            );


        if (!nome || !codice) {

            companyMessage.textContent =
                "Inserisci nome ditta e codice.";

            return;
        }


        if (
            !Number.isInteger(giorni) ||
            giorni < 1 ||
            giorni > 10
        ) {

            companyMessage.textContent =
                "Il numero di giorni deve essere da 1 a 10.";

            return;
        }


        const { error } =
            await supabaseClient
                .from("companies")
                .insert([
                    {
                        nome_ditta: nome,
                        codice_univoco: codice,
                        numero_giorni: giorni
                    }
                ]);


        if (error) {

            if (
                error.code === "23505"
            ) {

                companyMessage.textContent =
                    "Questo codice univoco esiste già.";

            } else {

                companyMessage.textContent =
                    "Errore durante il salvataggio.";
            }

            return;
        }


        companyForm.classList.add("hidden");

        pulisciForm();

        caricaDitte();

    }
);


// ========================================
// CARICA DITTE
// ========================================

async function caricaDitte() {

    const {
        data,
        error
    } = await supabaseClient
        .from("companies")
        .select(
            "id, nome_ditta, codice_univoco, numero_giorni"
        )
        .order(
            "nome_ditta",
            {
                ascending: true
            }
        );


    if (error) {

        companiesList.innerHTML =
            "<tr><td colspan='4'>Errore nel caricamento.</td></tr>";

        return;
    }


    companiesList.innerHTML = "";


    data.forEach(function (company) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>${escapeHtml(company.nome_ditta)}</td>

            <td>${escapeHtml(company.codice_univoco)}</td>

            <td>${company.numero_giorni}</td>

            <td>
                <button
                    class="delete-button"
                    data-id="${company.id}"
                >
                    Elimina
                </button>
            </td>

        `;


        companiesList.appendChild(row);

    });


    document
        .querySelectorAll(".delete-button")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    eliminaDitta(
                        button.dataset.id
                    );

                }
            );

        });

}


// ========================================
// ELIMINA DITTA
// ========================================

async function eliminaDitta(id) {

    const conferma =
        confirm(
            "Vuoi davvero eliminare questa ditta?"
        );


    if (!conferma) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("companies")
            .delete()
            .eq("id", id);


    if (error) {

        alert(
            "Errore durante l'eliminazione."
        );

        return;
    }


    caricaDitte();

}


// ========================================
// PULISCI FORM
// ========================================

function pulisciForm() {

    document.getElementById(
        "company-name"
    ).value = "";

    document.getElementById(
        "company-code"
    ).value = "";

    document.getElementById(
        "company-days"
    ).value = "";

    companyMessage.textContent = "";

}


// ========================================
// PROTEZIONE TESTO HTML
// ========================================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


// ========================================
// AVVIO
// ========================================

controllaSessione();
