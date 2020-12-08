const mongoose = require('mongoose')
const TaskComponent = require('./Task/TaskComponent')
const AnsweredTaskComponent = require('./Task/AnsweredTaskComponent')

const Schema = mongoose.Schema

var Task = new Schema({
    name: {
        type: String,
        required: true
    },
    tags: [String],
    screenIds: [String],
    taskComponents: [TaskComponent]

}, { collection: 'Task' })

const Set = new Schema({
    name: String,
    tags: String,
    children: [Task],
    isRandom: Boolean,
    taskOrder: [Number]
}, { collection: 'Set' })

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