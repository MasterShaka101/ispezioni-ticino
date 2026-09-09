// ========================================
// CONFIGURAZIONE
// ========================================

const SUPABASE_URL =
    "https://htcuwuhebznznjpizepz.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_AVWMx6QAsgorykTKjF8RGA_xYSw9G_O";

const bookingPeriod = {
    startDate: "2026-10-01",
    endDate: "2026-12-31"
};

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


// ========================================
// FUNZIONI GENERALI
// ========================================

// Converte YYYY-MM-DD in una data locale
function parseLocalDate(dateString) {

    const [year, month, day] =
        dateString.split("-").map(Number);

    return new Date(
        year,
        month - 1,
        day
    );
}


// Converte una data in YYYY-MM-DD
function formatDate(date) {

    return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
    );
}


// Restituisce tutti i giorni feriali compresi
// tra due date, estremi inclusi.
function getWeekdaysBetween(startString, endString) {

    let first =
        parseLocalDate(startString);

    let last =
        parseLocalDate(endString);

    // Se la seconda data viene prima della prima,
    // invertiamo le date.
    if (first > last) {

        const temporary = first;

        first = last;
        last = temporary;
    }

    const result = [];

    const current =
        new Date(first);

    while (current <= last) {

        const dayOfWeek =
            current.getDay();

        // Lunedì = 1
        // ...
        // Venerdì = 5
        if (
            dayOfWeek >= 1 &&
            dayOfWeek <= 5
        ) {
            result.push(
                formatDate(current)
            );
        }

        current.setDate(
            current.getDate() + 1
        );
    }

    return result;
}


// ========================================
// LOGIN
// ========================================

async function login() {

    const usernameElement =
        document.getElementById("username");

    const message =
        document.getElementById("login-message");

    const codice =
        usernameElement.value.trim();

    if (!codice) {

        message.textContent =
            "Inserisci il codice univoco.";

        return;
    }

    const {
        data,
        error
    } = await supabaseClient.rpc(
        "get_company_by_code",
        {
            p_codice: codice
        }
    );

    if (error) {

        console.error(
            "Errore login:",
            error.message
        );

        message.textContent =
            "Errore: " + error.message;

        return;
    }

    if (
        !data ||
        data.length === 0
    ) {

        message.textContent =
            "Codice univoco non valido.";

        return;
    }

    const company =
        data[0];

    sessionStorage.setItem(
        "companyId",
        company.id
    );

    sessionStorage.setItem(
        "companyName",
        company.nome_ditta
    );

    sessionStorage.setItem(
        "companyRequiredDays",
        company.numero_giorni
    );

    window.location.href =
        "calendario.html";
}


// ========================================
// CALENDARIO
// ========================================

const calendar =
    document.getElementById("calendar");


// Il codice seguente viene eseguito
// solamente nella pagina calendario.
if (calendar) {

    // ------------------------------------
    // DATI DELLA DITTA
    // ------------------------------------

    const companyName =
        sessionStorage.getItem("companyName");

    const companyRequiredDays =
        sessionStorage.getItem(
            "companyRequiredDays"
        );

    const companyId =
        sessionStorage.getItem("companyId");

    const companyNameElement =
        document.getElementById("company-name");


    // Se manca l'autenticazione della ditta,
    // torniamo alla pagina di login.
    if (
        !companyName ||
        !companyRequiredDays ||
        !companyId
    ) {

        window.location.href =
            "index.html";

    } else {

        if (companyNameElement) {

            companyNameElement.textContent =
                companyName;
        }


        // --------------------------------
        // ELEMENTI DEL CALENDARIO
        // --------------------------------

        const monthTitle =
            document.getElementById("monthTitle");

        const periodInfo =
            document.getElementById("period-info");

        const prevMonth =
            document.getElementById("prevMonth");

        const nextMonth =
            document.getElementById("nextMonth");

        const confirmBooking =
            document.getElementById("confirmBooking");

        const bookingMessage =
            document.getElementById("booking-message");

        const confirmationModal =
            document.getElementById(
                "confirmation-modal"
            );

        const cancelConfirmation =
            document.getElementById(
                "cancel-confirmation"
            );

        const confirmFinal =
            document.getElementById(
                "confirm-final"
            );


        // --------------------------------
        // DATI CALENDARIO
        // --------------------------------

        const requiredDays =
            Number(companyRequiredDays);

        const startDate =
            parseLocalDate(
                bookingPeriod.startDate
            );

        const endDate =
            parseLocalDate(
                bookingPeriod.endDate
            );

        let currentDate =
            new Date(startDate);

        let selectedDates = [];

        let hasBooking = false;

        let bookedDates = new Set();

        let myBookingDates = new Set();

        let blockedDates = new Set();


        const monthNames = [
            "gennaio",
            "febbraio",
            "marzo",
            "aprile",
            "maggio",
            "giugno",
            "luglio",
            "agosto",
            "settembre",
            "ottobre",
            "novembre",
            "dicembre"
        ];


        // --------------------------------
        // AGGIORNA MESSAGGIO
        // --------------------------------

        function updateSelectionMessage() {

            if (!bookingMessage) {
                return;
            }

            if (hasBooking) {

                bookingMessage.textContent =
                    "Hai confermato " +
                    requiredDays +
                    " " +
                    (
                        requiredDays === 1
                            ? "giorno."
                            : "giorni."
                    ) +
                    " Per cambiare data contattare il responsabile.";

                confirmBooking.disabled =
                    true;

                return;
            }


            if (
                selectedDates.length ===
                requiredDays
            ) {

                bookingMessage.textContent =
                    "Hai selezionato tutti i " +
                    requiredDays +
                    " giorni. Puoi confermare la prenotazione.";

                confirmBooking.disabled =
                    false;

                return;
            }


            const remaining =
                requiredDays -
                selectedDates.length;

            bookingMessage.textContent =
                "Devi ancora selezionare " +
                remaining +
                (
                    remaining === 1
                        ? " giorno."
                        : " giorni."
                );

            confirmBooking.disabled =
                true;
        }


        // --------------------------------
        // CARICAMENTO DATI DAL DATABASE
        // --------------------------------

        async function loadBookings() {

            // Giorni bloccati
            const {
                data: blockedData,
                error: blockedError
            } = await supabaseClient
                .from("blocked_days")
                .select("blocked_date");


            if (blockedError) {

                console.error(
                    "Errore caricamento giorni bloccati:",
                    blockedError.message
                );

                return;
            }


            blockedDates =
                new Set(
                    blockedData.map(
                        item => item.blocked_date
                    )
                );


            // Prenotazioni
            const {
                data,
                error
            } = await supabaseClient
                .from("bookings")
                .select(
                    "company_id, start_date, end_date"
                );


            if (error) {

                console.error(
                    "Errore caricamento prenotazioni:",
                    error.message
                );

                return;
            }


            bookedDates =
                new Set();

            myBookingDates =
                new Set();

            hasBooking =
                false;


            data.forEach(
                function (booking) {

                    const dates =
                        getWeekdaysBetween(
                            booking.start_date,
                            booking.end_date
                        );


                    dates.forEach(
                        function (date) {

                            bookedDates.add(date);
                        }
                    );


                    if (
                        Number(booking.company_id) ===
                        Number(companyId)
                    ) {

                        dates.forEach(
                            function (date) {

                                myBookingDates.add(
                                    date
                                );
                            }
                        );

                        hasBooking =
                            true;
                    }
                }
            );


            renderCalendar();
        }


        // --------------------------------
        // RENDER CALENDARIO
        // --------------------------------

        function renderCalendar() {

            calendar.innerHTML = "";

            const year =
                currentDate.getFullYear();

            const month =
                currentDate.getMonth();


            monthTitle.textContent =
                monthNames[month] +
                " " +
                year;


            periodInfo.textContent =
                "Il periodo assegnato è lungo " +
                requiredDays +
                " " +
                (
                    requiredDays === 1
                        ? "giorno"
                        : "giorni"
                ) +
                " consecutivi.";


            // Primo giorno del mese
            const firstDay =
                new Date(
                    year,
                    month,
                    1
                );


            // Lunedì = 0
            // ...
            // Domenica = 6
            let startingDay =
                firstDay.getDay() - 1;


            if (startingDay === -1) {
                startingDay = 6;
            }


            // Celle vuote prima del primo giorno
            for (
                let i = 0;
                i < startingDay;
                i++
            ) {

                const emptyDay =
                    document.createElement("div");

                emptyDay.className =
                    "calendar-day empty";

                calendar.appendChild(
                    emptyDay
                );
            }


            // Numero di giorni del mese
            const daysInMonth =
                new Date(
                    year,
                    month + 1,
                    0
                ).getDate();


            for (
                let day = 1;
                day <= daysInMonth;
                day++
            ) {

                const date =
                    new Date(
                        year,
                        month,
                        day
                    );

                const dayElement =
                    document.createElement("div");

                dayElement.className =
                    "calendar-day";

                dayElement.textContent =
                    day;


                // Weekend
                if (
                    date.getDay() === 0 ||
                    date.getDay() === 6
                ) {

                    dayElement.classList.add(
                        "weekend"
                    );

                    calendar.appendChild(
                        dayElement
                    );

                    continue;
                }


                const dateString =
                    formatDate(date);


                const isMyBooking =
                    myBookingDates.has(
                        dateString
                    );

                const isBooked =
                    bookedDates.has(
                        dateString
                    );

                const isBlocked =
                    blockedDates.has(
                        dateString
                    );

                const isSelected =
                    selectedDates.includes(
                        dateString
                    );


                // Prenotazione della ditta corrente
                if (isMyBooking) {

                    dayElement.classList.add(
                        "my-booking"
                    );
                }


                // Data occupata o bloccata
                else if (
                    isBooked ||
                    isBlocked
                ) {

                    dayElement.classList.add(
                        "disabled"
                    );
                }


                // Data selezionata
                else if (isSelected) {

                    dayElement.classList.add(
                        "selected"
                    );
                }


                // Se la ditta ha già prenotato
                // non può più selezionare date.
                const selectionComplete =
                    selectedDates.length >=
                    requiredDays;


                const unavailable =
                    isBooked ||
                    isBlocked ||
                    hasBooking ||
                    (
                        selectionComplete &&
                        !isSelected
                    );


                if (
                    !isMyBooking &&
                    !unavailable
                ) {

                    dayElement.addEventListener(
                        "click",
                        function () {

                            toggleDate(
                                dateString
                            );
                        }
                    );
                }


                calendar.appendChild(
                    dayElement
                );
            }


            // --------------------------------
            // NAVIGAZIONE MESI
            // --------------------------------

            const isFirstMonth =
                currentDate.getFullYear() ===
                    startDate.getFullYear() &&
                currentDate.getMonth() ===
                    startDate.getMonth();


            const isLastMonth =
                currentDate.getFullYear() ===
                    endDate.getFullYear() &&
                currentDate.getMonth() ===
                    endDate.getMonth();


            prevMonth.disabled =
                isFirstMonth;

            nextMonth.disabled =
                isLastMonth;


            updateSelectionMessage();
        }


        // --------------------------------
        // SELEZIONE DATE
        // --------------------------------

        function toggleDate(dateString) {

            // Se abbiamo già raggiunto il numero
            // richiesto, cliccando su una data
            // selezionata cancelliamo tutto.
            if (
                selectedDates.length ===
                requiredDays
            ) {

                if (
                    selectedDates.includes(
                        dateString
                    )
                ) {

                    selectedDates = [];

                    renderCalendar();
                }

                return;
            }


            // Se abbiamo una sola data
            // e clicchiamo nuovamente su quella,
            // cancelliamo la selezione.
            if (
                selectedDates.length === 1 &&
                selectedDates[0] === dateString
            ) {

                selectedDates = [];

                renderCalendar();

                return;
            }


            // Prima data
            if (
                selectedDates.length === 0
            ) {

                selectedDates = [
                    dateString
                ];

                renderCalendar();

                return;
            }


            // Seconda data
            if (
                selectedDates.length === 1
            ) {

                const dates =
                    getWeekdaysBetween(
                        selectedDates[0],
                        dateString
                    );


                // Il periodo deve avere
                // esattamente i giorni richiesti.
                if (
                    dates.length !==
                    requiredDays
                ) {

                    return;
                }


                // Controlliamo date occupate
                // o bloccate.
                const periodUnavailable =
                    dates.some(
                        function (date) {

                            return (
                                bookedDates.has(date) ||
                                blockedDates.has(date)
                            );
                        }
                    );


                if (periodUnavailable) {
                    return;
                }


                selectedDates =
                    dates;

                renderCalendar();
            }
        }


        // --------------------------------
        // POPUP CONFERMA
        // --------------------------------

        confirmBooking.addEventListener(
            "click",
            function () {

                if (
                    selectedDates.length !==
                    requiredDays
                ) {
                    return;
                }

                confirmationModal.classList.remove(
                    "hidden"
                );
            }
        );


        // Annulla
        cancelConfirmation.addEventListener(
            "click",
            function () {

                confirmationModal.classList.add(
                    "hidden"
                );
            }
        );


        // --------------------------------
        // CONFERMA DEFINITIVA
        // --------------------------------

        confirmFinal.addEventListener(
            "click",
            async function () {

                if (
                    selectedDates.length !==
                    requiredDays
                ) {
                    return;
                }


                if (!companyId) {

                    confirmationModal.classList.add(
                        "hidden"
                    );

                    bookingMessage.textContent =
                        "Errore: ditta non identificata.";

                    return;
                }


                const startDateSelected =
                    selectedDates[0];

                const endDateSelected =
                    selectedDates[
                        selectedDates.length - 1
                    ];


                confirmFinal.disabled =
                    true;

                bookingMessage.textContent =
                    "Salvataggio della prenotazione...";


                const {
                    error
                } = await supabaseClient.rpc(
                    "create_booking",
                    {
                        p_company_id:
                            Number(companyId),

                        p_start_date:
                            startDateSelected,

                        p_end_date:
                            endDateSelected
                    }
                );


                if (error) {

                    console.error(
                        "Errore creazione prenotazione:",
                        error.message
                    );

                    confirmationModal.classList.add(
                        "hidden"
                    );

                    bookingMessage.textContent =
                        "Errore: " +
                        error.message;

                    confirmFinal.disabled =
                        false;

                    return;
                }


                // Chiude il popup
                confirmationModal.classList.add(
                    "hidden"
                );


                // Ricarica i dati dal database.
                // In questo modo la ditta viene
                // immediatamente bloccata.
                await loadBookings();
            }
        );


        // --------------------------------
        // NAVIGAZIONE MESI
        // --------------------------------

        prevMonth.addEventListener(
            "click",
            function () {

                currentDate.setMonth(
                    currentDate.getMonth() - 1
                );

                renderCalendar();
            }
        );


        nextMonth.addEventListener(
            "click",
            function () {

                currentDate.setMonth(
                    currentDate.getMonth() + 1
                );

                renderCalendar();
            }
        );


        // --------------------------------
        // AVVIO CALENDARIO
        // --------------------------------

        loadBookings();
    }
}
// Precompila il codice se presente nell'URL
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const codice = params.get("codice");

    if (codice) {
        const usernameInput = document.getElementById("username");

        if (usernameInput) {
            usernameInput.value = codice;
        }
    }
});
