const mongoose = require("mongoose")
const taskSchema = require('../models/taskModel')

const Schema = mongoose.Schema

const childSchema = new Schema({
    childId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'children.objectType'
    },
    objectType: {
        type: String,
        required: true,
        enum: ['SetModel', 'TaskModel']
    }
}, { _id: false })

const setSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    tags: [String],
    children: [ childSchema ],
    isRandom: Boolean,
    taskOrder: [Number]
    }, { collection: 'Set_Discrinator'}
)

const SetModel = mongoose.model('SetModel', setSchema)

module.exports = SetModel

