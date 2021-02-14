const mongoose = require('mongoose');
const shortId = require('shortid');

const projectSchema = mongoose.Schema({
    _id: {type: String, unique: true, required: true, default: shortId.generate},
    title: {type: String, required: true, trim: true},
    keyCode: {type: String, required: true, trim: true},
    ownerName: {type: String, required: true},
    ownerId: {type: String, required: true, ref: 'User'},
    createdDate: {type: Date, default: Date.now, required: false},
    isGloballyAvailable: {type: Boolean, default: false},
    lastModifiedOn: {type: Date, required: false},
    type: {type: String, required: true},
    members: [{
      userId: {type:String, required: true},
      firstName: {type: String, required: true},
      lastName: {type: String, required: true}
    }]
});

module.exports = mongoose.model('Project', projectSchema);

