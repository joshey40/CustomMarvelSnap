// Web Server (index.html, main.js, style.css)
const express = require('express');
const request = require('request');
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

webApp.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
  
  webApp.get('/jokes/random', (req, res) => {
    request(
      { url: 'https://joke-api-strict-cors.appspot.com/jokes/random' },
      (error, response, body) => {
        if (error || response.statusCode !== 200) {
          return res.status(500).json({ type: 'error', message: err.message });
        }
  
        res.json(JSON.parse(body));
      }
    )
  });



// Done
webApp.listen(process.env.PORT || port, () => {
    console.log(`Server is running at http://localhost:${port} or https://custom-marvel-snap.cyclic.app`);
});
