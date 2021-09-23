export const TaskTypes = {
  INSTRUCTION: { type: "Instruction", label: "Instruction" },
  IMAGE: { type: "Image", label: "Image" },
  BUTTON: { type: "Button", label: "Button" },
  TEXT: { type: "Text", label: "Text" },
  NUMBER: { type: "Number", label: "Number" },
  VIDEO: { type: "Video", label: "Video" },
}

function getLabel(type) {
  let values = Object.values(TaskTypes)

  for (var i = 0; i < values.length; i++) {
    if (values[i].type === type) return values[i].label
  }

  return "Not found" + type
}

export const ObjectTypes = {
  TASK: "Tasks",
  SET: "Sets",
}

let childListID = 0

export class TaskObj {
  // The default object used for Tasks. New tasks should use this as the base.
  constructor() {
    this.name = ""
    this.tags = [] //A list of searchable tags
    this.refSets = [] //list of sets that reference this Synquestitask

    this.components = []
    this.objType = ObjectTypes.TASK
  }
}

export class Component {
  constructor(taskType) {
    this.objType = taskType.type //The type of the object, see enum above
    this.label = taskType.label ? taskType.label : getLabel(taskType)
    this.displayText = "" //The text that will be displayed
    this.screenIDS = [] //A list of screen IDs
    this.hideNext = false

    //For user responses
    this.responses = [] //The possible responses to the task
    this.correctResponses = [] //The correct response(s)
    this.responseUnit = "" //The unit of the response e.g. "%", "RPM"
    this.singleChoice = false //If the answer should be single choice
    this.resetResponses = false //If the responses should be reset after 1s
    this.globalVariable = false //If true the response of the task should be stored as a global var in the participant DB object

    //Image specifics
    this.image = "" //The filepath to the image
    this.recordClicks = false
    this.fullScreenImage = false
    this.showAOIs = false
    this.aois = [] //The area of interest objects defined for this image

    this.itemID = childListID
    childListID++
  }
}

//The default object used for Sets. New sets should use this as the base.
export class SetObject {
  constructor() {
    this.name = ""
    this.tags = []
    this.childIds = []
    this.setTaskOrder = "InOrder"
    this.displayOnePage = false //If true display all the tasks on one page
    this.counterbalancingOrder = []
    this.objType = ObjectTypes.SET //ObjectTypes.SET;
  }
}

//The default object used for Participants. New participants should use this as the base.
export class ParticipantObject {
  constructor(set) {
    var dt = new Date()
    this.readableId = dt.getTime()
    this.setId = set._id
    this.setName = set.name
    this.eyeData = ""
    this.linesOfData = []
    this.globalVariables = []
  }
}

//The default object used for LineOfData. New lines of data should use this as the base.
export class LineOfData {
  constructor(
    currentTime,
    taskId,
    familyTree,
    taskContent,
    taskCorrectResponses,
    taskType
  ) {
    this.tasksFamilyTree = familyTree
    this.taskId = taskId
    this.taskContent = taskContent
    this.objType = taskType
    this.responses = []
    this.correctResponses = taskCorrectResponses
    /* correctlyAnswered:
    1. If the participant answers correctly, we log it as “correct”.
    2. If the participant answers incorrectly, we log it as “incorrect”.
    3. If no correct answer was provided (i.e. the field “correct answer” in the editor is empty), we log it as “notApplicable”.
    4. If the participant clicked “skip”, we log it as “skipped”, regardless of (3).
    */
    this.correctlyAnswered = "skipped"

    this.startTimestamp = currentTime //raw timestamp for every response
    this.firstResponseTimestamp = -1 //The end timestamp
    /* timeToFirstAnswer
    time from when the question was presented to first input
    - for buttons: to when first button is pressed
    - for text entry: to when first letter is entered ("oninput")
    */
    this.timeToFirstAnswer = -1
    /* timeToCompletion
    time from when the question was presented to clicking "next"
    In case of "skipped", we leave (1) empty and log (2) as time to pressing "skip".
    */
    this.timeToCompletion = -1
    this.aoiCheckedList = []
  }
}

export class AnsweredComponent {
  constructor(logObj) {
    // this.taskId = taskId
    // this.startTimestamp = startTimestamp
    // this.text = componentText
    // this.componentType = componentType
    // this.responseOptions = responseOptions
    // this.correctOptions = correctOptions
    this.taskId = logObj.task.uid
    this.startTimestamp = logObj.event.eventTime
    this.text = logObj.component.text
    this.componentType = logObj.component.type
    this.responseOptions = logObj.component.responseOptions
    this.correctOptions = logObj.component.correctResponses

    if (this.componentType === "Video") {
      this.aoiHitCounts = logObj.event.data.aoiHitCounts
      this.fixations = logObj.event.data.fixations
    }
  }
}

export class AnsweredVideoComponent {
  constructor(componentData, videoData) {
    this.taskId = componentData.task.uid
    this.startTimestamp = videoData.startTimeStamp //The start timestamp
    this.text = videoData.text
    this.componentType = "Video"

    this.responseOptions = videoData.responseOptions

    this.isCorrect = videoData.isCorrect

    // Image/Video designated
    this.clickedPoints = videoData.clickedPoints

    this.fixations = videoData.fixations

    this.aoiHitCounts = videoData.aoiHitCounts

    this.isAlarmSuppressed = videoData.isCorrect
  }
}

export class ObserverMessage {
  constructor(name, role, participantId, taskId, startTaskTime, message) {
    this.name = name
    this.role = role
    this.participantId = participantId
    this.taskId = taskId
    this.startTaskTime = startTaskTime
    this.messages = [message]
  }
}
