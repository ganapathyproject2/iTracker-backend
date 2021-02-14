const mongoose = require('mongoose');
const shortId = require('shortid');

const CommentSchema = mongoose.Schema({
    _id: {type: String, required: true, unique: true, default: shortId.generate},
    issueId: {type: String, required: true, ref: 'Issue'},
    userName: {type: String, required: true},
    userId: {type: String, required: true, ref: 'User'},
    summary: {type: String, required: true},
    createdDate: {type: Date, required: true, default: Date.now}
});

module.exports = mongoose.model('Comment', CommentSchema);
