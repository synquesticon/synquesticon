const mongoose = require('mongoose')
const assert = require('assert')
const task = require('../models/model_discriminator')
const {
    TaskModel,
    NumberComponentSchema,
    ButtonComponentSchema,
    TextComponentSchema,
    ImageComponentSchema
} = require('../models/model_discriminator')


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

const sampleTask = {
    name: 'Trial task',
    tags: ['four', 'types'],
    taskComponents: [
        { 
            taskType: 'Number',
            screenIds: ["1"] ,
            displayString: 'How old am I?'

        },
        { 
            taskType: 'Button', 
            screendIds: ['2'],
            displayString: 'Which ethnicity am I?', 
            isSingleChoice: true,
            isAutoReset: false,
            options: ["24", "26", "27", "28"],
            correctAnswers: ["25"]
        },
        {
            taskType: 'Text',
            screenIds: ['2'],
            displayString: 'How do you now'
        },
        {
            taskType: 'Image',
            screenIds: ['1'],
            path: 'img001.jpg',
            displayString: 'This is the image of me',
            shouldRecordClick: false,
            shouldShowAOIs: false,
            isFullScreen: true,
            AOIs: [{
                name: 'testAOI',
                boundBox: [0.5, 0.5, 0.7, "0.7"]
            }]
                        
        }
    ]};
    
TaskModel.create(sampleTask).
then(function(doc) {
    assert.equal(doc.taskComponents.length, 4);

    assert.ok(doc.taskComponents[0] instanceof NumberComponentSchema)
    assert.ok(doc.taskComponents[1] instanceof ButtonComponentSchema)
    assert.ok(doc.taskComponents[2] instanceof TextComponentSchema)
    assert.ok(doc.taskComponents[3] instanceof TextComponentSchema)

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
    assert.equal(doc.taskComponents.length, 5);

    assert.ok(doc.taskComponents[4] instanceof ButtonComponentSchema)

})