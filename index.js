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
webApp.listen(process.env.PORT || port, () => {
    console.log(`Server is running at http://localhost:${port} or https://custom-marvel-snap.cyclic.app`);
});
