'use strict'

const mongoose = require('mongoose')
extend = require('mongoose-schema-extend')
const {ImageComponent, ButtonComponent, TextComponent, NumberComponent} =  require('./TaskComponent')
var Schema = mongoose.Schema

var HitAOIs = new Schema({
   aois: [String], //names of the hit AOIS
   x: Number,
   y: Number,
   timeClicked: Number,
   _id: false
})


var AnsweredTaskComponent = new Schema({
    taskId: String,
    isCorrect: String,
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

var AnsweredImageComponent = AnsweredTaskComponent.extend({
    imageTask: ImageComponent,
    aoiCheckList: [HitAOIs]
})


var AnsweredButtonComponent = AnsweredTaskComponent.extend({
    buttonTask: ButtonComponent,
    responseCountArray: [Number],
    responseArray: [String]
})

var AnsweredTextComponent = AnsweredTaskComponent.extend({
    textTask: TextComponent,
    response: String
})


var AnsweredNumberComponent = AnsweredTaskComponent.extend({
    numberComponent: NumberComponent,
    response: Number
})

module.exports = AnsweredTaskComponent