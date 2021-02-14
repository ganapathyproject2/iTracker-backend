const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');

//routes
const userRoutes = require('../routes/user-routes');
const projectRoutes = require('../routes/project-routes');
const issueRoutes = require('../routes/issue-routes');
const notificationRoutes = require('../routes/notification-routes');
const commentRoutes = require('../routes/comment-routes');

const app = express();

app.use(helmet());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use("/images", express.static(path.join('images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Headers',"Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, PUT, DELETE, OPTIONS');
    next();
});

app.use('/api/user', userRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/issue', issueRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/comment', commentRoutes);

app.use((err, req, res, next) => {
    let status = err.status || 500;
    res.status(status).send(err);
})

app.use('*', (req, res, next) => {
    res.status(404).send({message: 'The route you are trying to access is not valid!!!'});
})

module.exports = app;