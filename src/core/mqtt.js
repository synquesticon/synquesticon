const store = require('./store')
const eventStore = require('./eventStore')
const mqtt = require('mqtt')
let mqttClient = null
let last_config = null

const topicObject = {
  task: 'Synquesticon.Task',
  command: 'command',
  sessionControl: 'sessionControl',
  motion: 'motion',
  eyeTracker: 'RETDataSample'
}

const onRETData = newMessage => {
  let gazeData = JSON.parse(newMessage)[1]
  store.default.dispatch({
    type: 'SET_GAZE_DATA',
    tracker: JSON.parse(newMessage)[0],
    gazeData: {
      timestamp: Date.now(),
      locX: gazeData[12],
      locY: gazeData[13],
      leftPupilRadius: gazeData[0] / 2,
      rightPupilRadius: gazeData[3] / 2
    }
  })
}

const _startMQTT = (config, restart) => {
  if (restart) {
    if (mqttClient)
      mqttClient.end()
    console.log("restarting mqtt client")
  } else if (last_config && (last_config.ip === config.ip && last_config.port === config.port))
    return

  let wsURL = config.bUseWSS ? "wss://" : "ws://"
  wsURL += config.ip + ":" + config.port

  console.log("Attmpting to connect to the mqtt broker ", wsURL)
  mqttClient = mqtt.connect(wsURL)
  last_config = config

  // SUBSCRIBE TO TOPICS
  mqttClient.on('connect', () => {
    for (const topic in topicObject)
      mqttClient.subscribe(topic, err => { if (err) console.log(err) })
    console.log('Connected to mqtt broker')
  })

  // RESPOND TO TOPICS
  mqttClient.on('message', (topic, message) => {    //When the client connects we subscribe to the topics we want to listen to
    switch (topic) {
      case topicObject.motion:
        eventStore.default.sendMotionData(message)
        break
      case topicObject.eyeTracker:
        onRETData(message)
        break
      case topicObject.task:
        eventStore.default.sendCurrentMessage(message)
        break
      case topicObject.command:
        eventStore.default.sendCurrentCommand(message)
        break
      case topicObject.sessionControl: 
        if (JSON.parse(message).deviceID === window.localStorage.getItem('deviceID'))         //Only respond to the message if the device ID matches our own and the screenID is different so we don't repeat messages endlessly
          eventStore.default.sendSessionControlMsg(JSON.parse(message))
        break
      default:
        console.log("message from unknown topic recieved: ", topic)
    }
  })
}

//SEND MESSAGES
module.exports = {
  broadcastEvents(msg) {
    (mqttClient) ? mqttClient.publish(topicObject.task, msg) : console.log("Tried to publish, but MQTT client was null")
  },
  sendMqttMessage(topic, msg) {
    (mqttClient) ? mqttClient.publish(topic, msg) : console.log("Tried to publish, but MQTT client was null")
  },
  startMQTT(config, restart) {
    _startMQTT(config, restart)
  }
}