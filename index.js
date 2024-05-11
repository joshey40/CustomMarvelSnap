

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

const CARDS_API_URL = "https://marvelsnapzone.com/getinfo/?searchtype=cards&searchcardstype=true"
const LOCATIONS_API_URL = "https://marvelsnapzone.com/getinfo/?searchtype=locations&searchcardstype=true"

webApp.get('/cards', async (req, res) => {
    cards = await fetch(CARDS_API_URL)
        .then(response => response.json())
        .then(data => {
            var cards = data.success.cards;
            return cards;
        })
        .catch(error => console.log(error));
    res.send(cards);
});

webApp.get('/locations', async (req, res) => {
    locations = await fetch(LOCATIONS_API_URL)
        .then(response => response.json())
        .then(data => {
            var locations = data.success.locations;
            return locations;
        })
        .catch(error => console.log(error));
    res.send(locations);
});

// Done
webApp.listen(process.env.PORT || port, () => {
    console.log(`Server is running at http://localhost:${port} or https://custom-marvel-snap.cyclic.app`);
});
