const mongoose = require('mongoose')
const assert = require('assert')

mongoose.connect("mongodb://localhost:27017/Synquesticon_New", 
    {
      useUnifiedTopology: true,
      useNewUrlParser: true
    }
  )
  
mongoose.Promise = global.Promise

const db = mongoose.connection

db.on('error', err => console.log('Database connection error'+err))
db.on('open', () => console.log('connected to the database '+db.name))

const { Schema } = require("mongoose");

const taskComponentSchema = new Schema({ displayString: String },
    { discriminatorKey: 'taskType', _id: false });
  
const taskSchema = new Schema(
    { 
        name: String,
        taskComponents: [taskComponentSchema] 
    },
    {
        collection: 'Tasks_Discrimination'
    }
    )

const componentArray = taskSchema.path('taskComponents')


const numberComponentSchema = new Schema({        
    correctAnswer: Number,
    offSetRange: Number
}, { _id: false })

const buttonComponentSchema = new Schema({
    isSingleChoice: {
        type: Boolean,
        required: true
    },
    isAutoReset: {
        type: Boolean,
        required: true
    },
    options: {
        type: [String],
        validate: v => Array.isArray(v) && v.length > 0,
    },
    correctAnswers: [String]
}, { _id: false })

const NumberComponent = componentArray.discriminator('Number', numberComponentSchema)

const ButtonComponent = componentArray.discriminator('Button', buttonComponentSchema)

const TaskModel = db.model('Tasks', taskSchema)

// Create a new task of task co with different kinds
const sampleTask = {
name: 'Trial task',
taskComponents: [
    { 
        taskType: 'Number', 
        displayString: 'How old am I?'
    },
    { 
        taskType: 'Button', 
        displayString: 'Which ethnicity am I?', 
        isSingleChoice: true,
        isAutoReset: false,
        options: ["24", "26", "27", "28"],
        correctAnswers: ["25"]
    }
]};

TaskModel.create(sampleTask).
then(function(doc) {
    assert.equal(doc.taskComponents.length, 2);

    assert.ok(doc.taskComponents[0] instanceof NumberComponent)
    assert.ok(doc.taskComponents[1] instanceof ButtonComponent)

    doc.taskComponents.push({ 
        taskType: 'Button', 
        displayString: 'Was button added?', 
        isSingleChoice: true,
        isAutoReset: true,
        options: ["Yes", "No"],
        correctAnswers: ["Yes"]
    });
    return doc.save();
}).
then(function(doc) {
    assert.equal(doc.taskComponents.length, 3);

    assert.ok(doc.taskComponents[2] instanceof ButtonComponent)

})