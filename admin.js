// ========================================
// CONFIGURAZIONE SUPABASE
// ========================================

const SUPABASE_URL =
    "https://htcuwuhebznznjpizepz.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_AVWMx6QAsgorykTKjF8RGA_xYSw9G_O";

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

const bookingsList =
    document.getElementById("bookings-list");

const blockedDaysList =
    document.getElementById("blocked-days-list");

const addBlockedDayButton =
    document.getElementById("add-blocked-day-button");

const blockedDayMessage =
    document.getElementById("blocked-day-message");


// ========================================
// FUNZIONI DI SUPPORTO
// ========================================

function mostraAreaAdmin() {

    loginArea.classList.add("hidden");

    adminArea.classList.remove("hidden");
}


function mostraAreaLogin() {

    adminArea.classList.add("hidden");

    loginArea.classList.remove("hidden");
}


function mostraErrore(element, message) {

    if (element) {
        element.textContent = message;
    }
}


function creaCella(text) {

    const cell =
        document.createElement("td");

    cell.textContent =
        text ?? "";

    return cell;
}


function creaPulsanteElimina(
    className,
    id,
    callback
) {

    const button =
        document.createElement("button");

    button.className =
        className;

    button.dataset.id =
        id;

    button.textContent =
        "Elimina";

    button.addEventListener(
        "click",
        function () {

            callback(id);
        }
    );

    return button;
}


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


        if (!email || !password) {

            mostraErrore(
                loginMessage,
                "Inserisci email e password."
            );

            return;
        }


        loginButton.disabled =
            true;


        const { error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });


        loginButton.disabled =
            false;


        if (error) {

            mostraErrore(
                loginMessage,
                error.message
            );

            return;
        }


        loginMessage.textContent =
            "";

        mostraAreaAdmin();

        await Promise.all([
            caricaDitte(),
            caricaPrenotazioni(),
            caricaGiorniBloccati()
        ]);
    }
);


// ========================================
// CONTROLLO SESSIONE
// ========================================

async function controllaSessione() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();


    if (!session) {
        return;
    }


    mostraAreaAdmin();


    await Promise.all([
        caricaDitte(),
        caricaPrenotazioni(),
        caricaGiorniBloccati()
    ]);
}


// ========================================
// LOGOUT
// ========================================

logoutButton.addEventListener(
    "click",
    async function () {

        logoutButton.disabled =
            true;


        const { error } =
            await supabaseClient.auth.signOut();


        logoutButton.disabled =
            false;


        if (error) {

            console.error(
                "Errore logout:",
                error.message
            );

            return;
        }


        mostraAreaLogin();

        loginMessage.textContent =
            "";
    }
);


// ========================================
// APRI FORM NUOVA DITTA
// ========================================

addCompanyButton.addEventListener(
    "click",
    function () {

        companyForm.classList.remove(
            "hidden"
        );

        companyMessage.textContent =
            "";
    }
);


// ========================================
// CHIUDI FORM NUOVA DITTA
// ========================================

cancelCompanyButton.addEventListener(
    "click",
    function () {

        companyForm.classList.add(
            "hidden"
        );

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


        saveCompanyButton.disabled =
            true;


        const { error } =
            await supabaseClient
                .from("companies")
                .insert({
                    nome_ditta: nome,
                    codice_univoco: codice,
                    numero_giorni: giorni
                });


        saveCompanyButton.disabled =
            false;


        if (error) {

            if (error.code === "23505") {

                companyMessage.textContent =
                    "Questo codice univoco esiste già.";

            } else {

                companyMessage.textContent =
                    "Errore: " +
                    error.message;

                console.error(
                    "Errore aggiunta ditta:",
                    error.message
                );
            }

            return;
        }


        companyForm.classList.add(
            "hidden"
        );

        pulisciForm();

        await caricaDitte();
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

        console.error(
            "Errore caricamento ditte:",
            error.message
        );

        return;
    }


    companiesList.innerHTML =
        "";


    data.forEach(
        function (company) {

            const row =
                document.createElement("tr");


            row.appendChild(
                creaCella(
                    company.nome_ditta
                )
            );


            row.appendChild(
                creaCella(
                    company.codice_univoco
                )
            );


            row.appendChild(
                creaCella(
                    company.numero_giorni
                )
            );


            const actionCell =
                document.createElement("td");


            actionCell.appendChild(
                creaPulsanteElimina(
                    "delete-button",
                    company.id,
                    eliminaDitta
                )
            );


            row.appendChild(
                actionCell
            );


            companiesList.appendChild(
                row
            );
        }
    );
}


// ========================================
// CARICA PRENOTAZIONI
// ========================================

async function caricaPrenotazioni() {

    const {
        data,
        error
    } = await supabaseClient
        .from("bookings")
        .select(`
            id,
            company_id,
            start_date,
            end_date,
            companies (
                nome_ditta
            )
        `)
        .order(
            "start_date",
            {
                ascending: true
            }
        );


    if (error) {

        bookingsList.innerHTML =
            "<tr><td colspan='4'>Errore nel caricamento delle prenotazioni.</td></tr>";

        console.error(
            "Errore caricamento prenotazioni:",
            error.message
        );

        return;
    }


    bookingsList.innerHTML =
        "";


    if (
        !data ||
        data.length === 0
    ) {

        bookingsList.innerHTML =
            "<tr><td colspan='4'>Nessuna prenotazione.</td></tr>";

        return;
    }


    data.forEach(
        function (booking) {

            const row =
                document.createElement("tr");


            row.appendChild(
                creaCella(
                    booking.companies?.nome_ditta ||
                    ""
                )
            );


            row.appendChild(
                creaCella(
                    booking.start_date
                )
            );


            row.appendChild(
                creaCella(
                    booking.end_date
                )
            );


            const actionCell =
                document.createElement("td");


            actionCell.appendChild(
                creaPulsanteElimina(
                    "delete-booking-button",
                    booking.id,
                    eliminaPrenotazione
                )
            );


            row.appendChild(
                actionCell
            );


            bookingsList.appendChild(
                row
            );
        }
    );
}


// ========================================
// CARICA GIORNI BLOCCATI
// ========================================

async function caricaGiorniBloccati() {

    const {
        data,
        error
    } = await supabaseClient
        .from("blocked_days")
        .select(
            "id, blocked_date, reason"
        )
        .order(
            "blocked_date",
            {
                ascending: true
            }
        );


    if (error) {

        blockedDaysList.innerHTML =
            "<tr><td colspan='3'>Errore nel caricamento dei giorni bloccati.</td></tr>";

        console.error(
            "Errore caricamento giorni bloccati:",
            error.message
        );

        return;
    }


    blockedDaysList.innerHTML =
        "";


    if (
        !data ||
        data.length === 0
    ) {

        blockedDaysList.innerHTML =
            "<tr><td colspan='3'>Nessun giorno bloccato.</td></tr>";

        return;
    }


    data.forEach(
        function (blockedDay) {

            const row =
                document.createElement("tr");


            row.appendChild(
                creaCella(
                    blockedDay.blocked_date
                )
            );


            row.appendChild(
                creaCella(
                    blockedDay.reason
                )
            );


            const actionCell =
                document.createElement("td");


            actionCell.appendChild(
                creaPulsanteElimina(
                    "delete-blocked-day-button",
                    blockedDay.id,
                    eliminaGiornoBloccato
                )
            );


            row.appendChild(
                actionCell
            );


            blockedDaysList.appendChild(
                row
            );
        }
    );
}


// ========================================
// AGGIUNGI GIORNO BLOCCATO
// ========================================

addBlockedDayButton.addEventListener(
    "click",
    async function () {

        const date =
            document
                .getElementById("blocked-date")
                .value
                .trim();

        const reason =
            document
                .getElementById("blocked-reason")
                .value
                .trim();


        if (!date) {

            blockedDayMessage.textContent =
                "Seleziona una data.";

            return;
        }


        if (!reason) {

            blockedDayMessage.textContent =
                "Inserisci il motivo.";

            return;
        }


        addBlockedDayButton.disabled =
            true;


        const { error } =
            await supabaseClient
                .from("blocked_days")
                .insert({
                    blocked_date: date,
                    reason: reason
                });


        addBlockedDayButton.disabled =
            false;


        if (error) {

            if (error.code === "23505") {

                blockedDayMessage.textContent =
                    "Questa data è già bloccata.";

            } else {

                blockedDayMessage.textContent =
                    "Errore: " +
                    error.message;

                console.error(
                    "Errore aggiunta giorno bloccato:",
                    error.message
                );
            }

            return;
        }


        document.getElementById(
            "blocked-date"
        ).value = "";


        document.getElementById(
            "blocked-reason"
        ).value = "";


        blockedDayMessage.textContent =
            "Giorno bloccato aggiunto.";


        await caricaGiorniBloccati();
    }
);


// ========================================
// ELIMINA GIORNO BLOCCATO
// ========================================

async function eliminaGiornoBloccato(id) {

    const conferma =
        confirm(
            "Vuoi davvero eliminare questo giorno bloccato?"
        );


    if (!conferma) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("blocked_days")
            .delete()
            .eq("id", id);


    if (error) {

        alert(
            "Errore durante l'eliminazione."
        );

        console.error(
            "Errore eliminazione giorno bloccato:",
            error.message
        );

        return;
    }


    await caricaGiorniBloccati();
}


// ========================================
// ELIMINA PRENOTAZIONE
// ========================================

async function eliminaPrenotazione(id) {

    const conferma =
        confirm(
            "Vuoi davvero eliminare questa prenotazione?"
        );


    if (!conferma) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("bookings")
            .delete()
            .eq("id", id);


    if (error) {

        alert(
            "Errore durante l'eliminazione della prenotazione."
        );

        console.error(
            "Errore eliminazione prenotazione:",
            error.message
        );

        return;
    }


    await caricaPrenotazioni();
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

        console.error(
            "Errore eliminazione ditta:",
            error.message
        );

        return;
    }


    await caricaDitte();

    await caricaPrenotazioni();
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

    companyMessage.textContent =
        "";
}


// ========================================
// AVVIO
// ========================================

controllaSessione();
