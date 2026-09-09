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
let myBookingDates = [];
let hasBooking = false;
let blockedDates = [];
    
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
    data: blockedData,
    error: blockedError
} = await supabaseClient
    .from("blocked_days")
    .select("blocked_date");


if (blockedError) {

    console.error(
        "Errore caricamento giorni bloccati:",
        blockedError.message,
        blockedError.code,
        blockedError.details,
        blockedError.hint
    );

} else {

    blockedDates =
        blockedData.map(function (item) {
            return item.blocked_date;
        });

}
        
    const {
        data,
        error
    } = await supabaseClient
        .from("bookings")
        .select("company_id, start_date, end_date");

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
myBookingDates = [];
hasBooking = false;

const currentCompanyId =
    Number(sessionStorage.getItem("companyId"));

data.forEach(function (booking) {

    const dates = getWeekdaysBetween(
        booking.start_date,
        booking.end_date
    );

    bookedDates.push(...dates);

    if (Number(booking.company_id) === currentCompanyId) {

        myBookingDates.push(...dates);

        hasBooking = true;
    }

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
if (myBookingDates.includes(dateString)) {

    dayElement.classList.add("my-booking");

}
else if (
    bookedDates.includes(dateString) ||
    blockedDates.includes(dateString)
) {

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
    blockedDates.includes(dateString) ||
    hasBooking ||
    (
        selectedDates.length >= requiredDays &&
        !selectedDates.includes(dateString)
    )
) {

    if (!myBookingDates.includes(dateString)) {
        dayElement.classList.add("disabled");
    }

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

    // Se abbiamo già selezionato tutti i giorni,
    // cliccando su uno dei giorni selezionati
    // cancelliamo tutta la selezione.
    if (selectedDates.length === requiredDays) {

        if (selectedDates.includes(dateString)) {

            selectedDates = [];

            renderCalendar();

            return;
        }

        return;
    }


    // Se abbiamo selezionato un solo giorno
    // e clicchiamo nuovamente sullo stesso giorno,
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
    if (selectedDates.length === 0) {

        selectedDates = [dateString];

        renderCalendar();

        return;
    }


    // Seconda data
    if (selectedDates.length === 1) {

        const dates =
            getWeekdaysBetween(
                selectedDates[0],
                dateString
            );


        // Il periodo deve avere esattamente
        // il numero di giorni richiesti.
        if (dates.length !== requiredDays) {

            return;
        }


        // Controlliamo che nessuna delle date
        // del periodo sia già occupata o bloccata.
        const periodUnavailable =
            dates.some(function (date) {

                return (
                    bookedDates.includes(date) ||
                    blockedDates.includes(date)
                );

            });


        if (periodUnavailable) {

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

    if (hasBooking) {

        message.textContent =
            "Hai confermato " +
            requiredDays +
            " " +
            (requiredDays === 1 ? "giorno." : "giorni.") +
            " Per cambiare data contattare il responsabile.";

        document.getElementById("confirmBooking").disabled = true;

    }
    else if (selectedDates.length === requiredDays) {

        message.textContent =
            "Hai selezionato tutti i " +
            requiredDays +
            " giorni. Puoi confermare la prenotazione.";

        document.getElementById("confirmBooking").disabled = false;

    }
    else {

        const remaining =
            requiredDays - selectedDates.length;

        message.textContent =
            "Devi ancora selezionare " +
            remaining +
            (remaining === 1 ? " giorno." : " giorni.");

        document.getElementById("confirmBooking").disabled = true;
    }
}
    
    const confirmBooking =
    document.getElementById("confirmBooking");

    const bookingMessage =
    document.getElementById("booking-message");
    
    const confirmationModal =
    document.getElementById("confirmation-modal");

    const cancelConfirmation =
    document.getElementById("cancel-confirmation");

    const confirmFinal =
    document.getElementById("confirm-final");

// POPUP CONFERMA PRENOTAZIONE


// Clic su "Conferma prenotazione"
// Apre il popup senza ancora salvare nulla.
confirmBooking.addEventListener("click", function () {

    if (selectedDates.length !== requiredDays) {
        return;
    }

    confirmationModal.classList.remove("hidden");
});


// Clic su "Annulla"
// Chiude il popup e mantiene le date selezionate.
cancelConfirmation.addEventListener("click", function () {

    confirmationModal.classList.add("hidden");
});


// Clic su "Conferma definitiva"
// Qui viene effettivamente salvata la prenotazione.
confirmFinal.addEventListener("click", async function () {

    if (selectedDates.length !== requiredDays) {
        return;
    }

    const companyId =
        sessionStorage.getItem("companyId");

    if (!companyId) {

        confirmationModal.classList.add("hidden");

        bookingMessage.textContent =
            "Errore: ditta non identificata.";

        return;
    }


    // La prima e l'ultima data del periodo selezionato
    const startDateSelected =
        selectedDates[0];

    const endDateSelected =
        selectedDates[selectedDates.length - 1];


    confirmFinal.disabled = true;

    bookingMessage.textContent =
        "Salvataggio della prenotazione...";


    const {
        data,
        error
    } = await supabaseClient.rpc(
        "create_booking",
        {
            p_company_id: Number(companyId),
            p_start_date: startDateSelected,
            p_end_date: endDateSelected
        }
    );


    if (error) {

        console.error(
            "Errore creazione prenotazione:",
            error.message,
            error.code,
            error.details,
            error.hint
        );

        confirmationModal.classList.add("hidden");

        bookingMessage.textContent =
            "Errore: " + error.message;

        confirmFinal.disabled = false;

        return;
    }


    console.log(
        "Prenotazione creata:",
        data
    );


    // Chiude il popup dopo la conferma
    confirmationModal.classList.add("hidden");


    // Messaggio definitivo
    bookingMessage.textContent =
        "Hai confermato " +
        requiredDays +
        " " +
        (requiredDays === 1 ? "giorno." : "giorni.") +
        " Per cambiare data contattare il responsabile.";


    // Ricarica le prenotazioni dal database
    await loadBookings();

});


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
