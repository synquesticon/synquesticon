const mongoose = require("mongoose")
const Schema = mongoose.Schema

const TaskSchema = new Schema({                 //objType: task
  name: String,                                 //The name for the task
  tags: [String],                               //A list of searchable tags
  refSets: [String],                            //list of sets that reference this Synquestitask
  objType: String,                              //The type of this object (should always be Synquestitask)

  components: [{ //A list of child objects
    _id: false, //To disable automatic mongo db id's for the elements in the list
    objType: String, // What type of object this is
    globalVariable: Boolean, //If true the response of the task should be stored as a global var in the participant DB object
    screenIDS: [String], //A list of screen IDs
    hideNext: Boolean, //If the next button should be hidden

    //obj content
    displayText: String,

    //For user responses
    responses: [String], //The possible responses to the task
    correctResponses: [String], //The correct response
    responseUnit: String, //The unit of the response e.g. "%", "RPM"
    singleChoice: Boolean, //If the answer should be single choice
    resetResponses: Boolean, //If the answer should be reset after 1s

    //Image specifics
    image: String, //filepath
    recordClicks: Boolean,
    fullScreenImage: Boolean,
    showAOIs: Boolean,
    aois: [{ //A list of AOIs relevant to the task
      name: String,
      numberSufficentFixation: Number,
      startTime: Number,
      endTime: Number,
      boundingbox: [[Number]],
      _id: false
    }],
  }],

}, {
  collection: 'Tasks'
})

const SetSchema = new Schema({
  id: String, //The id of the TaskSet
  name: String, //The name for the TaskSet
  tags: [String], //A list of searchable tags
  childIds: [{
    id: String,
    objType: String,
    _id: false
  }], //list of the task ids referenced by this set
  setTaskOrder: String, //In Order, Random
  counterbalancingOrder: [Number], //List of the order the tasks should be played
  objType: String
}, {
  collection: 'Sets'
})

const ParticipantSchema = new Schema(
{
    readableId: String,
    mainTaskSetId: String,
    eyeData: String,
    linesOfData: [{
      _id: false,
      tasksFamilyTree: [String],
      taskId: String,
      taskContent: String,
      objType: String,
      responses: [String],
      correctResponses: [String],
      /* correctlyAnswered:
      1. If the participant answers correctly, we log it as “correct”.
      2. If the participant answers incorrectly, we log it as “incorrect”.
      3. If no correct answer was provided (i.e. the field “correct answer” in the editor is empty), we log it as “notApplicable”.
      4. If the participant clicked “skip”, we log it as “skipped”, regardless of (3).
      */
      correctlyAnswered: String,

      startTimestamp: Number, //The start timestamp
      /*
      raw timestamp for every response
      */
      firstResponseTimestamp: Number, //The end timestamp
      /* timeToFirstAnswer
      time from when the question was presented to first input
      - for buttons: to when first button is pressed
      - for text entry: to when first letter is entered ("oninput")
      */
      timeToFirstAnswer: Number,
      /* timeToCompletion
      time from when the question was presented to clicking "next"
      In case of "skipped", we leave (1) empty and log (2) as time to pressing "skip".
      */
      timeToCompletion: Number,
      clickedPoints: [{
        aoi: [String], //names of the hit AOIs
        x: Number,
        y: Number,
        timeClicked: Number,
        _id: false
      }],
      aoiCheckedList: [{
        label: String,
        checked: Boolean,
        _id: false
      }]
    }],
    globalVariables: [{
      label: String,
      value: [String],
      _id: false
    }]
  }, 
  { collection: 'Participants' }
)

const ExperimentSchema = new Schema(
  {
    readableId: String,
    participantIds: [String]
  }, 
  { collection: 'Experiments' }
)

const ObserverMessageSchema = new Schema(
  {
    name: String,
    role: String,
    participantId: String,
    taskId: String,
    startTaskTime: String,
    messages: [String]
  }, {
    collection: 'ObserverMessages'
  }
)


module.exports = {      // export the new Schema so we could modify it using Node.js
  Tasks:            mongoose.model("Tasks", TaskSchema),
  Sets:             mongoose.model("Sets", SetSchema),
  Participants:     mongoose.model("Participants", ParticipantSchema),
  Experiments:      mongoose.model("Experiments", ExperimentSchema),
  ObserverMessages: mongoose.model("ObserverMessages", ObserverMessageSchema)
}