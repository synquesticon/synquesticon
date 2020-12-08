const mongoose = require('mongoose')
const util = require('util')
const {ImageComponent, ButtonComponent, TextComponent, NumberComponent} =  require('./TaskComponent')
const Schema = mongoose.Schema

const HitAOIs = new Schema({
   aois: [String], //names of the hit AOIS
   x: Number,
   y: Number,
   timeClicked: Number,
   _id: false
})

const isCorrectEnum = ['correct', 'incorrect', 'notApplicable', 'skip']

function AnsweredTaskComponentConstructor (){
    Schema.apply(this, arguments)

    this.add({
        taskId: String,
        isCorrect: {
            type: String,
            enum: isCorrectEnum
        },
        /* correctlyAnswered:
        1. If the participant answers correctly, we log it as “correct”.
        2. If the participant answers incorrectly, we log it as “incorrect”.
        3. If no correct answer was provided (i.e. the field “correct answer” in the editor is empty), we log it as “notApplicable”.
        4. If the participant clicked “skip”, we log it as “skipped”, regardless of (3).
        */
        timeToFirtAnswer: Number,
        firstResponseTimestamp: Number,
        timeToCompletion: Number
    })
}
util.inherits(AnsweredTaskComponentConstructor, Schema)

const AnsweredTaskComponent = new AnsweredTaskComponentConstructor()

const AnsweredImageComponent = new AnsweredTaskComponentConstructor({
    imageTask: ImageComponent,
    aoiCheckList: [HitAOIs]
})


const AnsweredButtonComponent = new AnsweredTaskComponentConstructor({
    buttonTask: ButtonComponent,
    responseCountArray: [Number],
    responseArray: [String]
})

const AnsweredTextComponent = new AnsweredTaskComponentConstructor({
    textTask: TextComponent,
    response: String
})


const AnsweredNumberComponent = new AnsweredTaskComponentConstructor({
    numberComponent: NumberComponent,
    response: Number
})

module.exports = AnsweredTaskComponent