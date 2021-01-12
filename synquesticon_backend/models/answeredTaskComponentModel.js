const mongoose = require('mongoose')
const extend = require('mongoose-schema-extend')
const { ImageComponent, ButtonComponent, TextComponent, NumberComponent } =  require('./taskModel')
const Schema = mongoose.Schema

const HitAOIs = new Schema({
   aois: [String], //names of the hit AOIS
   x: Number,
   y: Number,
   timeClicked: Number,
   _id: false
})

const isCorrectEnum = ['correct', 'incorrect', 'notApplicable', 'skip']

const AnsweredTaskComponent = new Schema(
    {

        sessionId: {
            type: String,
            required: true
        },
        setId: {
            type: Schema.Types.ObjectId,
            required: true
            
        },
        taskId: {
            type: Schema.Types.ObjectId,
            required: true
            
        },
        componentId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        /* correctlyAnswered:
        1. If the participant answers correctly, we log it as “correct”.
        2. If the participant answers incorrectly, we log it as “incorrect”.
        3. If no correct answer was provided (i.e. the field “correct answer” in the editor is empty), we log it as “notApplicable”.
        4. If the participant clicked “skip”, we log it as “skipped”, regardless of (3).
        */
        isCorrect: {
            type: String,
            enum: isCorrectEnum
        },
        
        timeToFirtAnswer: Number,
        firstResponseTimestamp: Number,
        timeToCompletion: Number
    },
    { 
        discriminatorKey: 'componentType',
        collection: 'AnsweredTaskComponent' 
    }
)

const AnsweredTaskComponentModel = mongoose.model('AnsweredComponent', AnsweredTaskComponent)


const AnsweredImageComponent = AnsweredTaskComponentModel.discriminator('Image', 
    new Schema({
        aoiCheckList: [HitAOIs]
    })
)


const AnsweredButtonComponent = AnsweredTaskComponentModel.discriminator('Button', 
    new Schema({
        responseCountArray: [Number],
        responseArray: [String]
    })
)

const AnsweredTextComponent = AnsweredTaskComponentModel.discriminator('Text', 
    new Schema({
        response: String,
    })
)


const AnsweredNumberComponent = AnsweredTaskComponentModel.discriminator('Number', 
    new Schema({
        response: Number
    })
)

module.exports = AnsweredTaskComponentModel