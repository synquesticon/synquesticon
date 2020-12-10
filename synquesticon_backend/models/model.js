const mongoose = require('mongoose')
const TaskComponentBase = require('./Task/TaskComponent')
const AnsweredTaskComponent = require('./Task/AnsweredTaskComponent')

const Schema = mongoose.Schema

const Task = new Schema({
    name: {
        type: String,
        required: true
    },
    tags: [String],
    screenIds: [String],
    taskComponents: [
        {
            type: Schema.Types.ObjectId,
            ref: TaskComponentBase
        }
    ]

})

const childrenSchema = new Schema({}, { discriminatorKey: '__t' })

const Set = new Schema({
    name: {
        type: String,
        required: true
    },
    tags: String,
    children: [childrenSchema],
    isRandom: Boolean,
    taskOrder: [Number]
    }, { discriminatorKey: '__t' })

Set.path('children').discriminator('Set', Set)
Set.path('children').discriminator('Task', Task)


const Session = new Schema({
    setId: String,
    screenId: String,
    answeredTasks: [AnsweredTaskComponent]
})

module.exports = {
    Task: mongoose.model("Task", Task),
    Set: mongoose.model("Set", Set),
    Session: mongoose.model("Session", Session)
}