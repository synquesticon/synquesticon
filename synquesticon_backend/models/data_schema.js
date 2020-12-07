const mongoose = require('mongoose')
const TaskComponent = require('./Task/TaskComponent')
const AnsweredTaskComponent = require('./Task/AnsweredTaskComponent')

const Schema = mongoose.Schema

const Task = new Schema({
    name: String,
    tags: [String],
    screenIds: [String],
    taskComponents: [TaskComponent]

}, {collection: 'Tasks'})

const Set = new Schema({
    name: String,
    tags: String,
    children: [Task, Set],
    isRandom: Boolean,
    taskOrder: [Number]
})

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