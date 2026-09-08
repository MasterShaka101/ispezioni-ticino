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

    // Per ora impostiamo i tre mesi di prova:
    // ottobre, novembre e dicembre 2026.

    const startDate = new Date(2026, 9, 1);
    const endDate = new Date(2026, 11, 31);

    let currentDate = new Date(2026, 9, 1);

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

        // Convertiamo domenica = 0
        // in lunedì = 0
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

                const dateString =
                    formatDate(date);


                if (selectedDates.includes(dateString)) {

                    dayElement.classList.add("selected");

                }


                dayElement.addEventListener(
                    "click",
                    function () {

                        toggleDate(dateString);

                    }
                );
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


        selectedCount.textContent =
            selectedDates.length;
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

        if (selectedDates.includes(dateString)) {

            selectedDates =
                selectedDates.filter(
                    date => date !== dateString
                );

        } else {

            selectedDates.push(dateString);

        }

        renderCalendar();
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
