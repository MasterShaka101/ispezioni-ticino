function login() {

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("login-message");

    if (username === "test" && password === "1234") {

        window.location.href = "calendario.html";

    } else {

        message.textContent = "Nome utente o password non corretti.";

    }
}


// --------------------------------------------------
// CALENDARIO
// --------------------------------------------------

const calendar = document.getElementById("calendar");

if (calendar) {

    const monthTitle = document.getElementById("monthTitle");
    const selectedCount = document.getElementById("selectedCount");
    const prevMonth = document.getElementById("prevMonth");
    const nextMonth = document.getElementById("nextMonth");

    // Numero di giorni che questa ditta deve prenotare
    const requiredDays = 3;

    // Periodo disponibile
    const startDate = new Date(2026, 9, 1);
    const endDate = new Date(2026, 11, 31);

    // Mese visualizzato inizialmente
    let currentDate = new Date(2026, 9, 1);

    // Date selezionate
    let selectedDates = [];

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
                if (selectedDates.includes(dateString)) {

                    dayElement.classList.add("selected");

                }


                // Se abbiamo già raggiunto il numero massimo
                // e questa data non è già selezionata,
                // la rendiamo non selezionabile.
                if (
                    selectedDates.length >= requiredDays &&
                    !selectedDates.includes(dateString)
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


        // Aggiorna il contatore
        selectedCount.textContent =
            selectedDates.length + " di " + requiredDays;


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

    // Se abbiamo già una selezione completa,
    // non permettiamo di modificarla cliccando sui giorni.
    if (selectedDates.length === requiredDays) {
        return;
    }


    // Prima data
    if (selectedDates.length === 0) {

        selectedDates = [dateString];

        renderCalendar();
        return;
    }


    // Seconda data:
    // calcoliamo automaticamente i giorni feriali
    // tra la prima data e quella cliccata.
    if (selectedDates.length === 1) {

        const dates = getWeekdaysBetween(
            selectedDates[0],
            dateString
        );


        // Se non sono esattamente 3 giorni,
        // non accettiamo la selezione.
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

        } else {

            const remaining =
                requiredDays - selectedDates.length;

            message.textContent =
                "Devi ancora selezionare " +
                remaining +
                (remaining === 1 ? " giorno." : " giorni.");
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


    renderCalendar();
}
