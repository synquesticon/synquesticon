const EventEmitter = require('events')
const MESSAGE_EVENT         = "MQTTEvent"
const MOTION_EVENT          = "MotionEvent"
const GAZE_EVENT          = "GazeEvent"
const PARTICIPANT_EVENT     = "ParticipantEvent"
const REMOTE_TRACKER_EVENT  = "NewRemoteTrackerEvent"
const COMMAND_EVENT         = "CommandEvent"
const SESSION_CONTROL_EVENT = "SessionControlEvent"
const TASK_EVENT            = "TaskEvent"
const TAG_EVENT             = "TagEvent"

class CEventStore extends EventEmitter {
  constructor() {
    super()
    this.motion = []
    this.gaze = []
    this.tag = []
		this.currentMessage = []
    this.currentCommand = []
    this.currentTask = []
    this.currentRemoteTracker = null
    this.receivedRemoteTrackers = []
  }

//MESSAGE_EVENT
  setEventListener(status, callback) {
    (status === "on") 
    ? this.addListener(MESSAGE_EVENT, callback)
    : this.removeListener(MESSAGE_EVENT, callback)
  }

  sendCurrentMessage(args) {
		this.currentMessage = args
    this.emit(MESSAGE_EVENT)
  }

  getCurrentMessage(){
		return this.currentMessage
  }

//MOTION_EVENT
  setMotionListener(status, callback) {
    (status === "on") 
      ? this.addListener(MOTION_EVENT, callback)
      : this.removeListener(MOTION_EVENT, callback)
  }

  sendMotionData(args){
    this.motion = args
    this.emit(MOTION_EVENT)
  }

  getMotionData() {
    return this.motion 
  }

  //GAZE
  setGazeListener(status, callback) {
    (status === "on") 
      ? this.addListener(GAZE_EVENT, callback)
      : this.removeListener(GAZE_EVENT, callback)
  }

  sendGazeData(args){
    this.gaze = args
    this.emit(GAZE_EVENT)
  }

  getGazeData() {
    return this.gaze 
  }

  //TAG
  setTagListener(status, callback) {
    (status === "on") 
      ? this.addListener(TAG_EVENT, callback)
      : this.removeListener(TAG_EVENT, callback)
  }

  sendTag(args){
    this.tag = args
    this.emit(TAG_EVENT)
  }

  getTag() {
    return this.tag 
  }

  //TASK_EVENT
  setTaskListener(status, callback) {
    (status === "on") 
      ? this.addListener(TASK_EVENT, callback)
      : this.removeListener(TASK_EVENT, callback)
  }

  sendTaskData(args){
    this.currentTask = args
    this.emit(TASK_EVENT)
  }

  getTaskData() {
    return this.currentTask 
  }

//SESSION_CONTROL_EVENT
  setSessionControlListener(status, callback) {
    (status === "on")
      ? this.addListener(SESSION_CONTROL_EVENT, callback)
      : this.removeListener(SESSION_CONTROL_EVENT, callback)
  }

  sendSessionControlMsg(payload) {
    this.emit(SESSION_CONTROL_EVENT, payload)
  }

//COMMAND_EVENT
  setNewCommandListener(status, callback) {
    (status === "on")
      ? this.addListener(COMMAND_EVENT, callback)
      : this.removeListener(COMMAND_EVENT, callback)
  }

  sendCurrentCommand(args){
    this.currentCommand = args
    this.emit(COMMAND_EVENT)
  }

  getCurrentCommand(){
    return this.currentCommand
  }

//PARTICIPANT_EVENT
  addNewParticipantListener(callback) {
    this.addListener(PARTICIPANT_EVENT, callback)
  }

  removeNewParticipantListener(callback) {
    this.removeListener(PARTICIPANT_EVENT, callback)
  }

  emitNewParticipant() {
    this.emit(PARTICIPANT_EVENT)
  }

//REMOTE_TRACKER_EVENT
  addNewRemoteTrackerListener(callback) {
    this.addListener(REMOTE_TRACKER_EVENT, callback)
  }

  removeNewRemoteTrackerListener(callback) {
    this.removeListener(REMOTE_TRACKER_EVENT, callback)
  }

  emitNewRemoteTrackerListener() {
    if (!this.receivedRemoteTrackers.includes(this.currentRemoteTracker)) 
      this.emit(REMOTE_TRACKER_EVENT)
  }

  getCurrentRemoteTracker(){
    return this.currentRemoteTracker
  }

  setCurrentRemoteTracker(tracker){
    this.currentRemoteTracker = tracker
  }

  confirmRecevingRemoteTracker() {
    this.receivedRemoteTrackers.push(this.currentRemoteTracker)
  }
}

export default new CEventStore()