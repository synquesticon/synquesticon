const mongoose = require('mongoose')
const util = require('util')
extend = require('mongoose-schema-extend')

const Schema = mongoose.Schema

const ImageAOI = new Schema({
   name: String,
   boundBox: [[Number]],
   _id: false
})

/* const TaskTypeEnum = ["Image", "Number", "Button", "Text", "Instruction"]


function TaskComponentConstructor (arguments) {
    Schema.apply(this,arguments)

    this.add({
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
    TaskComponent,
    ImageComponent,
    ButtonComponent,
    TextComponent,
    NumberComponent
    
} */

const baseOptions = {
    _id: false,
    discrimatorKey: 'taskType'
}

const TaskComponentBase = mongoose.model('TaskComponentBase', new Schema({
            displayText: String,
            screenIds: [String]
        }, baseOptions)
)

const InstructionComponent = TaskComponentBase.discriminator('Instruction', new Schema())

const ImageComponent = TaskComponentBase.discriminator('Image', new Schema({
    path: String,
    shouldRecordClick: Boolean,
    shouldShowAOIs: Boolean,
    isFullScreen: Boolean,
    AOIs: [ImageAOI]
}))

const ButtonComponent = TaskComponentBase.discriminator('Button', new Schema({
    isSingleChoice: Boolean,
    isAutoReset: Boolean,
    options: [String],
    correctAnswers: [String]
}))

const TextComponent = TaskComponentBase.discriminator('Text', new Schema({
    correctAnswers: [String]
}))


const NumberComponent = TaskComponentBase.discriminator('Number', new Schema({        
    correctAnswer: Number,
    offSetRange: Number
}))

module.exports = {
    InstructionComponent,
    ImageComponent,
    ButtonComponent,
    TextComponent,
    NumberComponent
}