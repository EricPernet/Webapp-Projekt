/*
============================================================================
*    Dokumentname: app.js
*    Beschreibung: Backend-Server mit Express für Streamforge (FS2025)
*    Copyright:    keine
*    Erstellt:     2025-02-12
*    Autoren:      Kjell Mühlhoff, Eric Pernet
============================================================================
*/

import express from 'express';                 // Für Node.js
import mariadb from 'mariadb';                // Für MariaDB
import cookieParser from 'cookie-parser';     // Für Cookies

const app = express();
const port = 8080;

// Verbindung zu MariaDB
const pool = mariadb.createPool({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "root",
    database: "mydb",
    supportBigNumbers: true
});

let benutzer = [];                             // Zwischenspeicher für eingeloggte Benutzer
app.use(cookieParser());                      // Cookies verwenden


// Abfragen aller Songs
app.get('/db', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM song;");
        res.send(result);
    } catch (err) {
        throw err;
    }
});

// Songs nach Titel aussuchen
app.get('/db/Titel/:Titel', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM song WHERE Titel = ?;", [req.params.Titel]);
        res.send(result);
    } catch (err) {
        throw err;
    }
});

// Songs nach Album aussuchen
app.get('/db/Album/:Album', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM song WHERE Album = ?;", [req.params.Album]);
        res.send(result);
    } catch (err) {
        throw err;
    }
});

// Songs nach Genre aussuchen
app.get('/db/Genre/:Genre', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM song WHERE Genre = ?;", [req.params.Genre]);
        res.send(result);
    } catch (err) {
        throw err;
    }
});

// Startet den Server
app.listen(port, () => console.log(`Listening on port ${port}`));

// Statische Dateien aus "static"-Verzeichnis bereitstellen
app.use(express.static('static'));

// Weiterleitung der Root-URL auf Loginseite
app.get('/', (req, res) => {
    res.redirect('login.html');
});

// Hilfsfunktion: Benutzername anhand Cookie aus benutzer[] holen
function getuser(parsec) {
    const user = benutzer.find(item => item.cookie == parsec);
    return user ? user.Benutzername : "unknown user";
}

// Titel einer Playlist hinzufügen oder entfernen
app.get('/:Titel/:Playlist', async (req, res) => {
    try {
        const { Titel, Playlist } = req.params;
        const userid = req.cookies.userid;
        const ersteller = await pool.query("SELECT Ersteller FROM playlists WHERE Playlistname = ?;", [Playlist]);

        const zugriffsberechtigter = getuser(userid);
        const Bestandscheck = await pool.query("SELECT Titel FROM song WHERE Titel = ?;", [Titel]);

        if (!Bestandscheck[0]) {
            return res.send("Dieser Song ist leider nicht in der Datenbank");
        }

        if (zugriffsberechtigter === ersteller[0].Ersteller) {
            const check = await pool.query("SELECT Songs_Songname FROM playlist_has_songs WHERE Songs_Songname = ? AND Playlists_Name = ?;", [Titel, Playlist]);

            const checkPlaylistname = await pool.query("SELECT Playlistname FROM playlists WHERE Playlistname = ?;", [Playlist]);

            if (check == "") {
                await pool.query("INSERT into playlist_has_songs (Songs_Songname, Playlists_Name) values (?,?)", [Bestandscheck[0].Titel, checkPlaylistname[0].Playlistname]);
                res.send("Song zur Playlist hinzugefügt");
            } else {
                await pool.query("DELETE FROM playlist_has_songs WHERE Songs_Songname = ?", [Titel]);
                res.send("Song aus der Playlist entfernt");
            }
        } else {
            res.send("Du hast keinen Zugriff auf diese Playlist");
        }
    } catch (err) {
        throw err;
    }
});

// Hilfsfunktion: User-ID generieren und Cookie setzen
function getUserId(req, res) {
    let userid = req.cookies.userid;
    if (!userid) {
        userid = crypto.randomUUID();
        res.cookie('userid', userid);
    }
    return userid;
}

// Login-Funktion mit Passwortabfrage
app.get('/db/:benutzername/:passwort', async (req, res) => {
    try {
        const { benutzername, passwort } = req.params;
        const result = await pool.query("SELECT Passwort FROM benutzer WHERE Benutzername = ?;", [benutzername]);

        const richtigespasswort = result[0]?.Passwort;

        if (richtigespasswort === passwort) {
            if (!benutzer.some(item => item.Benutzername === benutzername)) {
                const userid = getUserId(req, res);
                benutzer.push({ cookie: userid, Benutzername: benutzername });
            }
            return res.send("Login erfolgreich");
        } else {
            return res.send("Login erfolgslos");
        }
    } catch (err) {
        throw err;
    }
});

// Gibt die Songs einer Playlist zurück
app.get('/:Playlistname', async (req, res) => {
    try {
        const Playlistname = req.params.Playlistname;
        const result = await pool.query("SELECT Songs_Songname FROM playlist_has_songs WHERE Playlists_Name = ?;", [Playlistname]);
        return res.send(result);
    } catch (err) {
        throw err;
    }
});

// Folgen oder Entfolgen einer Playlist durch eingeloggten Benutzer
app.get('/Datenbank/Benutzer_Benutzername/:Playlists_Playlistname', async (req, res) => {
    try {
        const Playlist = req.params.Playlists_Playlistname;
        const userid = req.cookies.userid;
        const Account = getuser(userid);

        const check = await pool.query("SELECT Playlists_Playlistname FROM benutzer_likes_playlists WHERE Benutzer_Benutzername = ? AND Playlists_Playlistname = ?;", [Account, Playlist]);
        const checkPlaylistname = await pool.query("SELECT Playlistname FROM playlists WHERE Playlistname = ?;", [Playlist]);

        if (checkPlaylistname == "") {
            res.send("Playlist existiert nicht");
        } else {
            if (check == "") {
                await pool.query("INSERT INTO benutzer_likes_playlists (Benutzer_Benutzername, Playlists_Playlistname) VALUES (?, ?)", [Account, checkPlaylistname[0].Playlistname]);
                res.send("Playlist gefolgt");
            } else {
                await pool.query("DELETE FROM benutzer_likes_playlists WHERE Benutzer_Benutzername = ? AND Playlists_Playlistname = ?", [Account, checkPlaylistname[0].Playlistname]);
                res.send("Playlist entfolgt");
            }
        }
    } catch (err) {
        throw err;
    }
});

// Zeigt alle Playlists an, denen ein Benutzer folgt
app.get('/Datenbank/likes/Benutzer/Playlists', async (req, res) => {
    try {
        const userid = req.cookies.userid;
        const account = getuser(userid);
        const result = await pool.query("SELECT Playlists_Playlistname FROM benutzer_likes_playlists WHERE Benutzer_Benutzername = ?;", [account]);
        return res.send(result);
    } catch (err) {
        throw err;
    }
});
