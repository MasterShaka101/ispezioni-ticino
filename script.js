// ========================================
// CONFIGURAZIONE PERIODO DI PRENOTAZIONE
// ========================================

const bookingPeriod = {
    startDate: "2026-10-01",
    endDate: "2026-12-31"
};


// Converte YYYY-MM-DD in una data locale
function parseLocalDate(dateString) {

    const [year, month, day] =
        dateString.split("-").map(Number);

    return new Date(year, month - 1, day);
}


// NOME DELLA DITTA

const companyName =
    sessionStorage.getItem("companyName");

const companyRequiredDays =
    sessionStorage.getItem("companyRequiredDays");

const companyNameElement =
    document.getElementById("company-name");


// Se siamo nel calendario e non c'è una ditta autenticata,
// torniamo alla pagina di login.
if (
    document.getElementById("calendar") &&
    (!companyName || !companyRequiredDays)
) {
    window.location.href = "index.html";
}


// Mostra il nome della ditta
if (companyNameElement && companyName) {

    companyNameElement.textContent =
        companyName;

}


// LOGIN


async function login() {

    const codice =
        document.getElementById("username").value.trim();

    const message =
        document.getElementById("login-message");


    if (!codice) {

        message.textContent =
            "Inserisci il codice univoco.";

        return;
    }


    const SUPABASE_URL =
        "https://htcuwuhebznznjpizepz.supabase.co";

    const SUPABASE_ANON_KEY =
        "sb_publishable_AVWMx6QAsgorykTKjF8RGA_xYSw9G_O";


    const supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );


    console.log("Login ditta avviato");
    console.log("Codice:", codice);


    const {
        data,
        error
    } = await supabaseClient.rpc(
        "get_company_by_code",
        {
            p_codice: codice
        }
    );


    console.log("Risultato RPC:", data);
    console.log("Errore RPC:", error);


    if (error) {

        message.textContent =
            "Errore: " + error.message;

        return;
    }


    if (!data || data.length === 0) {

        message.textContent =
            "Codice univoco non valido.";

        return;
    }


    const company = data[0];

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

// --------------------------------------------------
// CALENDARIO
// --------------------------------------------------

const calendar = document.getElementById("calendar");

if (calendar) {

    const monthTitle = document.getElementById("monthTitle");
    const periodInfo = document.getElementById("period-info");
    const prevMonth = document.getElementById("prevMonth");
    const nextMonth = document.getElementById("nextMonth");

const SUPABASE_URL =
    "https://htcuwuhebznznjpizepz.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_AVWMx6QAsgorykTKjF8RGA_xYSw9G_O";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

let bookedDates = [];
    
    // Numero di giorni che questa ditta deve prenotare
   const requiredDays =
    Number(sessionStorage.getItem("companyRequiredDays")) || 3;

const startDate =
    parseLocalDate(bookingPeriod.startDate);

const endDate =
    parseLocalDate(bookingPeriod.endDate);

let currentDate =
    new Date(startDate);

    // Date selezionate
    let selectedDates = [];

    async function loadBookings() {

    const {
        data,
        error
    } = await supabaseClient
        .from("bookings")
        .select("start_date, end_date");

    if (error) {

        console.error(
    "Errore caricamento prenotazioni:",
    error.message,
    error.code,
    error.details,
    error.hint
);

        return;
    }

    bookedDates = [];

    data.forEach(function (booking) {

        const dates = getWeekdaysBetween(
            booking.start_date,
            booking.end_date
        );

        bookedDates.push(...dates);

    });

    renderCalendar();
}

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


    function renderCalendar() {

        calendar.innerHTML = "";

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        monthTitle.textContent =
            monthNames[month] + " " + year;

        periodInfo.textContent =
    "Il periodo assegnato è lungo " +
    requiredDays +
    " " +
    (requiredDays === 1 ? "giorno" : "giorni") +
    " consecutivi.";

        // Primo giorno del mese
        const firstDay = new Date(year, month, 1);

        // Trasformiamo:
        // domenica = 0
        // lunedì = 0
        let startingDay = firstDay.getDay() - 1;

        if (startingDay === -1) {
            startingDay = 6;
        }


        // Celle vuote prima del primo giorno
        for (let i = 0; i < startingDay; i++) {

            const emptyDay = document.createElement("div");

            emptyDay.className = "calendar-day empty";

            calendar.appendChild(emptyDay);
        }


        // Numero di giorni del mese
        const daysInMonth =
            new Date(year, month + 1, 0).getDate();


        for (let day = 1; day <= daysInMonth; day++) {

            const date = new Date(year, month, day);

            const dayElement =
                document.createElement("div");

            dayElement.className = "calendar-day";

            dayElement.textContent = day;


            // Sabato e domenica
            if (
                date.getDay() === 0 ||
                date.getDay() === 6
            ) {

                dayElement.classList.add("weekend");

            } else {

                const dateString = formatDate(date);


                // Data già selezionata
                // Data già prenotata
if (bookedDates.includes(dateString)) {

    dayElement.classList.add("disabled");

}
// Data già selezionata dalla ditta corrente
else if (selectedDates.includes(dateString)) {

    dayElement.classList.add("selected");

}


                // Se abbiamo già raggiunto il numero massimo
                // e questa data non è già selezionata,
                // la rendiamo non selezionabile.
                if (
    bookedDates.includes(dateString) ||
    (
        selectedDates.length >= requiredDays &&
        !selectedDates.includes(dateString)
    )
) {

                    dayElement.classList.add("disabled");

                } else {

                    dayElement.addEventListener(
                        "click",
                        function () {

                            toggleDate(dateString);

                        }
                    );
                }
            }


            calendar.appendChild(dayElement);
        }


        // Disabilita il mese precedente
        if (
            currentDate.getFullYear() ===
                startDate.getFullYear()
            &&
            currentDate.getMonth() ===
                startDate.getMonth()
        ) {

            prevMonth.disabled = true;

        } else {

            prevMonth.disabled = false;

        }


        // Disabilita il mese successivo
        if (
            currentDate.getFullYear() ===
                endDate.getFullYear()
            &&
            currentDate.getMonth() ===
                endDate.getMonth()
        ) {

            nextMonth.disabled = true;

        } else {

            nextMonth.disabled = false;

        }


                // Cambia il messaggio quando la selezione è completa
        updateSelectionMessage();
    }


    function formatDate(date) {

        return (
            date.getFullYear() +
            "-" +
            String(date.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(date.getDate()).padStart(2, "0")
        );
    }


function toggleDate(dateString) {

    // Se i 3 giorni sono già selezionati,
    // cliccando su QUALSIASI dei 3
    // cancelliamo tutta la selezione.
    if (selectedDates.length === requiredDays) {

        if (selectedDates.includes(dateString)) {

            selectedDates = [];

            renderCalendar();
            return;
        }

        return;
    }


    // Prima data
    if (selectedDates.length === 0) {

        selectedDates = [dateString];

        renderCalendar();
        return;
    }


    // Seconda data
    if (selectedDates.length === 1) {

        const dates = getWeekdaysBetween(
            selectedDates[0],
            dateString
        );


        // Devono essere esattamente 3 giorni feriali
        if (dates.length !== requiredDays) {

            return;
        }


        selectedDates = dates;

renderCalendar();
    }
}

function getWeekdaysBetween(startString, endString) {

    const start = new Date(startString);
    const end = new Date(endString);

    // Se la seconda data viene prima della prima,
    // invertiamo le date.
    let first = start;
    let last = end;

    if (first > last) {
        first = end;
        last = start;
    }


    const result = [];

    const current = new Date(first);


    while (current <= last) {

        const dayOfWeek = current.getDay();

        // Lunedì = 1
        // ...
        // Venerdì = 5
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {

            result.push(formatDate(current));
        }

        current.setDate(current.getDate() + 1);
    }


    return result;
}

    function updateSelectionMessage() {

        const selectionInfo =
            document.querySelector(".selection-info");

        if (!selectionInfo) {
            return;
        }


        let message =
            selectionInfo.querySelector(".booking-message");


        if (!message) {

            message =
                document.createElement("div");

            message.className = "booking-message";

            selectionInfo.appendChild(message);
        }


        if (selectedDates.length === requiredDays) {

    message.textContent =
        "Hai selezionato tutti i " +
        requiredDays +
        " giorni. Puoi confermare la prenotazione.";

    document.getElementById("confirmBooking").disabled = false;

} else {

    const remaining =
        requiredDays - selectedDates.length;

    message.textContent =
        "Devi ancora selezionare " +
        remaining +
        (remaining === 1 ? " giorno." : " giorni.");

    document.getElementById("confirmBooking").disabled = true;
}
    }


    prevMonth.addEventListener("click", function () {

        currentDate.setMonth(
            currentDate.getMonth() - 1
        );

        renderCalendar();
    });


    nextMonth.addEventListener("click", function () {

        currentDate.setMonth(
            currentDate.getMonth() + 1
        );

        renderCalendar();
    });


    loadBookings();
}
