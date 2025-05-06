/*
 *
 ============================================================================
 *    Dokumentname: _dbquery.js
 *    Beschreibung: JavaScript für die Streamforge-Webseite Webprojekt FS2025
 *    Copyright:    keine
 *    Erstellt:     2025-02-12
 *    Autoren:      Kjell Mühlhoff, Eric Pernet
 ============================================================================
 */

const url = 'http://localhost:8080/'; // Basis-URL für alle Backend-Abfragen

// DOM-Elemente abrufen
let Suche = document.getElementById("Suche");
let answerMusician = document.getElementById("answerMusician");
let answerURL = document.getElementById("answerURL");
let videoFrame = document.getElementById("URL");
let answerGenre = document.getElementById("answerGenre");
let answerDate = document.getElementById("answerDate");
let answerAlbum = document.getElementById("answerAlbum");
let answerTitel = document.getElementById("answerTitel");
let Genrelist = document.getElementById("Genrelist");

/* Funktion zur Suche eines Songs */
async function songHandler() {
    if (Suche.value != '') {
        try {
            let fetchPromise = fetch(url + 'db/' + 'Titel/' + Suche.value);
            let response = await fetchPromise;

            console.log(Suche.value);

            if (response.ok) {
                let json = await response.json();

                // Ausgabe des gefundenen Songs
                Suche.textContent = json[0].Titel;
                answerTitel.textContent = json[0].Titel;
                answerMusician.textContent = json[0].Künstler;
                answerURL.textContent = json[0].URL;
                answerDate.textContent = json[0].Erstellungsdatum;
                answerAlbum.textContent = json[0].Album;
                answerGenre.textContent = json[0].Genre;
                answerSongTITEL.textContent = "Song:";
                answerAlbumTITEL.textContent = "Album:";
                answerGenreTITEL.textContent = "Genre:";
                answerErscheinungsdatumTITEL.textContent = "Erscheinungsdatum:";
                answerMusikerTITEL.textContent = "Musiker:";
                answerURLTITEL.textContent = "URL:";
                answerLIEDERTITEL.textContent = "";
                Genrelist.textContent = "";

                // Video wird geladen
                videoFrame.src = json[0].URL;
            } else {
                console.error("Error fetching data. Response not OK.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
}

/* Funktion zur Suche eines Albums */
async function albumHandler() {
    if (Suche.value != '') {
        try {
            let fetchPromise = fetch(url + 'db/' + 'Album/' + Suche.value);
            let response = await fetchPromise;

            if (response.ok) {
                let json = await response.json();

                // Anzeige der ersten gefundenen Songdaten aus dem Album
                Suche.textContent = json[0].Album;
                answerTitel.textContent = json[0].Titel;
                answerMusician.textContent = json[0].Künstler;
                answerDate.textContent = json[0].Erstellungsdatum;
                answerAlbum.textContent = json[0].Album;
                answerGenre.textContent = json[0].Genre;
                answerSongTITEL.textContent = "";
                answerAlbumTITEL.textContent = "Album:";
                answerGenreTITEL.textContent = "Genre:";
                answerErscheinungsdatumTITEL.textContent = "Erscheinungsdatum:";
                answerMusikerTITEL.textContent = "Musiker:";
                answerLIEDERTITEL.textContent = "Lieder:";

                videoFrame.src = json[0].URL;
            } else {
                console.error("Error fetching data. Response not OK.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
}

/* Funktion zur Suche eines Genres */
async function genreHandler() {
    let i;
    if (Suche.value != '') {
        try {
            let fetchPromise = fetch(url + 'db/' + 'Genre/' + Suche.value);
            let response = await fetchPromise;

            if (response.ok) {
                let json = await response.json();

                console.log("TESTTTT");

                answerLIEDERTITEL.textContent = "Lieder:";

                // Alle vorherigen Infos werden geleert
                Suche.textContent = "";
                answerTitel.textContent = "";
                answerMusician.textContent = "";
                answerDate.textContent = "";
                answerAlbum.textContent = "";
                answerGenre.textContent = "";
                answerURL.textContent = "";

                answerURLTITEL.textContent = "";
                answerSongTITEL.textContent = "";
                answerAlbumTITEL.textContent = "";
                answerGenreTITEL.textContent = "";
                answerErscheinungsdatumTITEL.textContent = "";
                answerMusikerTITEL.textContent = "";

                let resultString = "";

                // Liste aller Songtitel des Genres
                for (let i = 0; i < json.length; i++) {
                    resultString = resultString + "\n";
                    resultString = resultString + json[i].Titel;
                }

                console.log(resultString);

                Genrelist.textContent = resultString;

                videoFrame.src = json[0].URL;
            } else {
                console.error("Error fetching data. Response not OK.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
}

/* Navigiert zur Playlists-Webseite */
async function playlistswebsite() {
    window.location.href = "Playlists.html";
}

/* Navigiert zur Impressum-Webseite */
async function impressumwebsite() {
    window.location.href = "Impressum.html";
}

/* Navigiert zur Homepage */
async function Homepage() {
    window.location.href = "_dbquery.html";
}

/* Login-Funktionalität */
async function login() {
    try {
        let passworthash = hashCode(passwort.value); // Passwort wird gehasht

        console.log(passworthash);

        let fetchPromise = fetch(url + 'db/' + benutzername.value + '/' + passworthash);
        let response = await fetchPromise;

        if (response.ok) {
            let json = await response.text();
            console.log(`Message erhalten: ${json}`);

            if (response.ok) {
                if (json == "Login erfolgreich") {
                    window.location.href = "_dbquery.html"; // Weiterleitung bei Erfolg
                } else {
                    loginbestätigung.textContent = json;
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}

/* Hash-Funktion für das Passwort */
function hashCode(str) {
    let hash = 0;

    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Konvertiert zu 32-Bit Integer
    }

    return hash;
}

/* Funktion zum Einfügen eines Songs in eine Playlist */
async function insertSong() {
    try {
        console.log(InsertTitel.value);

        let fetchPromise = fetch(url + InsertTitel.value + '/' + InsertPlaylist.value);
        let response = await fetchPromise;

        if (response.ok) {
            let json = await response.text();

            playliständerung.textContent = json;
        }
    } catch (error) {
        console.log(error);
    }
}
