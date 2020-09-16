const store = require('./store')
const eventStore = require('./eventStore')
const playerUtils = require('./player_utility_functions')
const mqtt = require('mqtt')
let mqttClient = null
let last_config = null

//Publication topics
const SynquesticonTopic = "Synquesticon.Task"
const SynquesticonCommandTopic = "Synquesticon.Command"
const SynquesticonMultipleScreenTopic = "Synquesticon.MultipleScreen"
const RemoteEyeTrackingTopic = "RETDataSample"
const DeviceMotionTopic = "motion"

const onCommandEvent = message => {
  eventStore.default.setCurrentCommand(message)
  eventStore.default.emitNewCommand()
}

const onMQTTEvent = message => {
  if (message) {
    eventStore.default.setCurrentMessage(message)
    eventStore.default.emitMQTTEvent()
  }
}

const onMotionData = message => {
  if (message) {
    eventStore.default.setMotionData(message)
    eventStore.default.emitMotionData()
  }
}

const onMultipleScreenEvent = message => {
  if (message) {
    //Only respond to the message if the device ID matches our own and the screenID is different so we don't repeat messages endlessly
    if (JSON.parse(message).deviceID === window.localStorage.getItem('deviceID'))
      eventStore.default.emitMultipleScreenEvent(JSON.parse(message))
  }
}

const onRETData = newMessage => {
  let message = JSON.parse(newMessage)
  let gazeData = message[1]
  let gazeX = gazeData[12]
  let gazeY = gazeData[13]

  store.default.dispatch({
    type: 'SET_GAZE_DATA',
    tracker: message[0],
    gazeData: {
      timestamp: playerUtils.getCurrentTime(),
      locX: gazeX,
      locY: gazeY,
      leftPupilRadius: gazeData[0] / 2,
      rightPupilRadius: gazeData[3] / 2
    }
  })
}

const _startMQTT = (config, restart) => {
  if (restart) {
    console.log("restarting mqtt client")
    if (mqttClient) {mqttClient.end()}
  } else if (last_config && (last_config.ip === config.ip && last_config.port === config.port)) 
    return

  let wsURL = config.bUseWSS ? "wss://" : "ws://"
  wsURL += config.ip + ":" + config.port

  //Attempt to connect the client to the mqtt broker
  console.log("Attmpting to connect to the mqtt broker ", wsURL)
  mqttClient = mqtt.connect(wsURL)
  last_config = config

  //When the client connects we subscribe to the topics we want to listen to
  mqttClient.on('connect', function () {
    console.log("Connected to mqtt broker")
    mqttClient.subscribe(SynquesticonTopic, function (err) { if (err) {console.log(err)} })
    mqttClient.subscribe(SynquesticonCommandTopic, function (err) { if (err) { console.log(err) } })
    mqttClient.subscribe(SynquesticonMultipleScreenTopic, function (err) { if (err) { console.log(err) } })
    mqttClient.subscribe(RemoteEyeTrackingTopic, function (err) { if (err) { console.log(err) } })
    mqttClient.subscribe(DeviceMotionTopic, function (err) { if (err) { console.log(err) } })
  })

  mqttClient.on('message', function (topic, message) {    //When the client connects we subscribe to the topics we want to listen to
    if (topic === SynquesticonTopic) 
      onMQTTEvent(message)
    else if (topic === DeviceMotionTopic) 
      onMotionData(message)      
    else if (topic === SynquesticonCommandTopic) 
      onCommandEvent(message)
    else if (topic === RemoteEyeTrackingTopic) 
      onRETData(message)
    else if (topic === SynquesticonMultipleScreenTopic) 
      onMultipleScreenEvent(message)
    else 
      console.log("message from unknown topic recieved: ", topic)
  })
}

module.exports = {
  broadcastEvents(msg) {
    (mqttClient) ? mqttClient.publish(SynquesticonTopic, msg) : console.log("Tried to publish, but MQTT client was null")
  },
  broadcastCommands(msg) {
    (mqttClient) ? mqttClient.publish(SynquesticonCommandTopic, msg) : console.log("Tried to publish, but MQTT client was null")
  },
  broadcastMultipleScreen(msg) {
    (mqttClient) ? mqttClient.publish(SynquesticonMultipleScreenTopic, msg) : console.log("Tried to publish, but MQTT client was null")
  },
  broadcastDeviceMotion(msg) {
    (mqttClient) ? mqttClient.publish(DeviceMotionTopic, msg) : console.log("Tried to publish, but MQTT client was null")
  },
  broadcastMessage(msg, topic) {
    (mqttClient) ? mqttClient.publish(topic, msg) : console.log("Tried to publish, but MQTT client was null")
  },
  startMQTT(config, restart) {
    _startMQTT(config, restart)
  }
}