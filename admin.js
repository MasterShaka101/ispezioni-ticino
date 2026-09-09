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

const bookingsList =
    document.getElementById("bookings-list");

const blockedDaysList =
    document.getElementById("blocked-days-list");

const addBlockedDayButton =
    document.getElementById("add-blocked-day-button");

const blockedDayMessage =
    document.getElementById("blocked-day-message");

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
        caricaPrenotazioni();
        caricaGiorniBloccati();

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
        caricaPrenotazioni();
        caricaGiorniBloccati();
        
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
                    error.message;
                
                console.error(error);
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
            "Errore prenotazioni:",
            error
        );

        return;
    }


    bookingsList.innerHTML = "";


    if (!data || data.length === 0) {

        bookingsList.innerHTML =
            "<tr><td colspan='4'>Nessuna prenotazione.</td></tr>";

        return;
    }


    data.forEach(function (booking) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHtml(
                    booking.companies?.nome_ditta || ""
                )}
            </td>

            <td>
                ${booking.start_date}
            </td>

            <td>
                ${booking.end_date}
            </td>

            <td>

                <button
                    class="delete-booking-button"
                    data-id="${booking.id}"
                >
                    Elimina
                </button>

            </td>

        `;


        bookingsList.appendChild(row);

    });


    document
        .querySelectorAll(".delete-booking-button")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    eliminaPrenotazione(
                        button.dataset.id
                    );

                }
            );

        });

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
            "Errore giorni bloccati:",
            error
        );

        return;
    }


    blockedDaysList.innerHTML = "";


    if (!data || data.length === 0) {

        blockedDaysList.innerHTML =
            "<tr><td colspan='3'>Nessun giorno bloccato.</td></tr>";

        return;
    }


    data.forEach(function (blockedDay) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${blockedDay.blocked_date}
            </td>

            <td>
                ${escapeHtml(blockedDay.reason)}
            </td>

            <td>

                <button
                    class="delete-blocked-day-button"
                    data-id="${blockedDay.id}"
                >
                    Elimina
                </button>

            </td>

        `;


        blockedDaysList.appendChild(row);

    });


    document
        .querySelectorAll(".delete-blocked-day-button")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    eliminaGiornoBloccato(
                        button.dataset.id
                    );

                }
            );

        });

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


        const { error } =
            await supabaseClient
                .from("blocked_days")
                .insert([
                    {
                        blocked_date: date,
                        reason: reason
                    }
                ]);


        if (error) {

            if (error.code === "23505") {

                blockedDayMessage.textContent =
                    "Questa data è già bloccata.";

            } else {

                blockedDayMessage.textContent =
                    "Errore: " + error.message;

                console.error(
                    "Errore aggiunta giorno bloccato:",
                    error
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


        caricaGiorniBloccati();

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
            error
        );

        return;
    }


    caricaGiorniBloccati();

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
            error
        );

        return;
    }


    caricaPrenotazioni();

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
