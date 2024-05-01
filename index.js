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
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});

webApp.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

var req = new XMLHttpRequest();
req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200) {
        console.log(req.responseText);
        var data = JSON.parse(req.responseText);
        officialCards = data.officialCards;
        customCards = data.customCards;
        addAllEffectTags();
        addAllCustomCharacters();
        applyFilters();
    }
};
req.open('GET', CARDS_API_URL, true);
req.send(null);

// Done
webApp.listen(process.env.PORT || port, () => {
    console.log(`Server is running at http://localhost:${port} or https://custom-marvel-snap.cyclic.app`);
});
