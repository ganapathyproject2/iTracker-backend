const mongoose = require('mongoose');
const appConfig = require('./config/config');

mongoose.connect(appConfig.connectionString, { autoIndex: false, useNewUrlParser: true })
        .then(() => {
          console.log('successfully connected to mongodb!!!');
        })
        .catch((err) => {
          console.dir(err);
          console.log('connection to mongodb failed!!!');
        });

const app = require('./middleware/app-routes');

module.exports = app;
