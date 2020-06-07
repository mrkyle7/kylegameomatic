const express = require('express');
const app = express();
const setup6nimmtRoutes = require('./src/6nimmt/routes')
const setupearlsdonHorrorRoutes = require('./src/earlsdonHorror/routes')


app.use(express.static('web'));
app.use(express.json());
app.set('port', process.env.PORT || 8000);

app.get('/api/v1/health', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ isAvailable: true }));
});

setup6nimmtRoutes(app);
setupearlsdonHorrorRoutes(app);


app.listen(app.get('port'), () => {
    console.log('Express server listening on port ' + app.get('port'));
});