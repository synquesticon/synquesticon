const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ImageAOI = new Schema({
    name: String,
    boundBox: [[Number]],
    _id: false
 })

const taskComponentSchema = new Schema({ 
    displayString: {
        type: String,
        required: true
    },
    screenIds: [String]
},
    { discriminatorKey: 'taskType' });

const taskComponentSchemaModel = new mongoose.model('TaskComponentModel', taskComponentSchema)
  
const taskSchema = new Schema(
    { 
        name: String,
        tags: [String],
        taskComponents: [taskComponentSchema]
    },
    {
        collection: 'Tasks_Discrimination'
    }
)

// Create array discriminator for task component array based on 'taskType'
const componentArray = taskSchema.path('taskComponents')

// Each component type will have type constrain
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
        validate: v => Array.isArray(v) && v.length > 0, // require options with answers
    },
    correctAnswers: [String]
}, { _id: false })

const textComponentSchema = new Schema({
    correctAnswers: [String]
}, { _id: false })

const imageComponentSchema = new Schema({
    path: {
        type: String,
        required: true
    },
    shouldRecordClick: {
        type: Boolean,
        required: true
    },
    shouldShowAOIs: Boolean,
    isFullScreen: {
        type: Boolean,
        required: true
    },
    AOIs: [ImageAOI]
}, { _id: false })

const NumberComponentSchema = componentArray.discriminator('Number', numberComponentSchema)

const ButtonComponentSchema = componentArray.discriminator('Button', buttonComponentSchema)

const TextComponentSchema = componentArray.discriminator('Text', textComponentSchema)

const ImageComponentSchema = componentArray.discriminator('Image', imageComponentSchema)



const TaskModel = mongoose.model('TaskModel', taskSchema)

module.exports = {
    TaskModel,
    taskComponentSchemaModel,
    taskSchema,
    NumberComponentSchema,
    ButtonComponentSchema,
    TextComponentSchema,
    ImageComponentSchema
}