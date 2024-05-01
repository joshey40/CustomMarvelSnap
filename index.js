// Web Server (index.html, main.js, style.css)
const express = require('express');
const { join } = require('path');
const webApp = express();
const port = 3000;

webApp.use(express.static('public'));
webApp.use('/js', express.static(__dirname + '/js'));
webApp.use('/css', express.static(__dirname + '/css'));
webApp.use('/res', express.static(__dirname + '/res'));

webApp.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });

webApp.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

const CARDS_API_URL = "https://marvelsnapzone.com/getinfo/?searchtype=cards&searchcardstype=true"
const LOCATIONS_API_URL = "https://marvelsnapzone.com/getinfo/?searchtype=locations&searchcardstype=true"

fetch(CARDS_API_URL)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        // process the data here
        data.success.cards.forEach(card => {
            console.log(card);
        });
    })
    .catch(error => console.log(error));

// Done
webApp.listen(process.env.PORT || port, () => {
    console.log(`Server is running at http://localhost:${port} or https://custom-marvel-snap.cyclic.app`);
});
