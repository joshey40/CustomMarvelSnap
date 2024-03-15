const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, onValue } = require('firebase/database');

const firebaseConfig = {
    apiKey: "AIzaSyApRPDgwka94D6l6B8ifZMx7P1vU1XiP3c",
    authDomain: "custommarvelsnap-c7f43.firebaseapp.com",
    databaseURL: "https://custommarvelsnap-c7f43-default-rtdb.firebaseio.com",
    projectId: "custommarvelsnap-c7f43",
    storageBucket: "custommarvelsnap-c7f43.appspot.com",
    messagingSenderId: "920972348179",
    appId: "1:920972348179:web:60f2c648aab261df2428e6",
    measurementId: "G-CTSJ3Z1M3Y"
  };

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Add Custom Card
const customCardRef = ref(db, 'cards/customCards');
function addCustomCard(card) {
    set(customCardRef, card);
}

// Web Server (index.html, main.js, style.css)
const express = require('express');
const { join } = require('path');
const webApp = express();
const port = 3000;

webApp.use(express.static('public'));
webApp.use('/js', express.static(__dirname + '/js'));
webApp.use('/css', express.static(__dirname + '/css'));
webApp.use('/res', express.static(__dirname + '/res'));

webApp.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

// Read and send Data
const cardsRef = ref(db, 'cards');

onValue(cardsRef, (snapshot) => {
    const data = snapshot.val();
    webApp.get('/cards', (req, res) => {
        var JSONdata = JSON.stringify(data);
        res.send(JSONdata);
    });
});

// Done
webApp.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
