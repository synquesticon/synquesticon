const mongoose = require('mongoose')
const util = require('util')
extend = require('mongoose-schema-extend')

const Schema = mongoose.Schema

const ImageAOI = new Schema({
   name: String,
   boundBox: [[Number]],
   _id: false
})

const TaskTypeEnum = ["Image", "Number", "Button", "Text", "Instruction"]


function TaskComponentConstructor (arguments) {
    Schema.apply(this,arguments)

    this.add({
        _id: false,
        displayText: String,
        screenIds: [String],
        taskType: {
            type: String,
            enum: TaskTypeEnum
        }
    })
}

util.inherits(TaskComponentConstructor, Schema)

const TaskComponent = new TaskComponentConstructor()

const ImageComponent = new TaskComponentConstructor({
    path: String,
    shouldRecordClick: Boolean,
    shouldShowAOIs: Boolean,
    isFullScreen: Boolean,
    AOIs: [ImageAOI]
})

const ButtonComponent = new TaskComponentConstructor({
    isSingleChoice: Boolean,
    isAutoReset: Boolean,
    options: [String],
    correctAnswers: [String]
})

const TextComponent = new TaskComponentConstructor({
    correctAnswers: [String]
})


const NumberComponent = new TaskComponentConstructor({        
    correctAnswer: Number,
    offSetRange: Number
})

module.exports = {
    /* TaskComponent: mongoose.model('TaskComponent', TaskComponent),
    ImageComponent: mongoose.model('ImageComponent', ImageComponent),
    ButtonComponent: mongoose.model('ButtonComponent', ButtonComponent), 
    TextComponent: mongoose.model('TextComponent', TextComponent), 
    NumberComponent:  mongoose.model('NumberComponent', NumberComponent) */
    TaskComponent,
    ImageComponent,
    ButtonComponent,
    TextComponent,
    NumberComponent
    
}