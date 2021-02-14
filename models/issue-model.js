const mongoose = require('mongoose');
const shortId = require('shortid');

const issueSchema = mongoose.Schema({
    _id: {type: String, unique: true, required: true, default: shortId.generate},
    title: {type: String, required: true, trim: true},
    description: {type: String, required: true, trim: true},
    priority: {type: String, required: true},
    attachment: {type: String, required: false},
    createdDate: {type: Date, default: Date.now, required: true},
    status: {type: String, default: 'backlog', required: true},
    project: {
        projectId: {type: String, required: true},
        title: {type: String, required: true}
    },
    lastModifiedOn: {type: Date, required: true, default: Date.now},
    completionDate: {type: Date, required: false},
    watchers: [{
      userId: {type:String, required: true},
      firstName: {type: String, required: true},
      lastName: {type: String, required: true}
    }],
    assignee: {
        userId: {type:String, required: true},
        firstName: {type: String, required: true},
        lastName: {type: String, required: true}
    },
    reporter: {
        userId: {type:String, required: true},
        firstName: {type: String, required: true},
        lastName: {type: String, required: true}
    },
    labels: [{type: String}],
    activity: [{
        summary: {type: String, required: true},
        dateLog: {type: Date, required: true, default: Date.now}
    }]
});

module.exports = mongoose.model('Issue', issueSchema);

