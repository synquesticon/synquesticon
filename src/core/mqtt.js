const store = require('./store')
const eventStore = require('./eventStore')
const mqtt = require('mqtt')
let mqttClient = null
let last_config = null

// const onRETData = newMessage => {
//   let gazeData = JSON.parse(newMessage)[1]
//   store.default.dispatch({
//     type: 'SET_GAZE_DATA',
//     tracker: JSON.parse(newMessage)[0],
//     gazeData: {
//       timestamp: Date.now(),
//       locX: gazeData[12],
//       locY: gazeData[13],
//       leftPupilRadius: gazeData[0] / 2,
//       rightPupilRadius: gazeData[3] / 2
//     }
//   })
// }

const _startMQTT = (config, restart) => {
  if (restart) {
    if (mqttClient)
      mqttClient.end()
    console.log("restarting mqtt client")
  } else if (last_config && (last_config.mqttURL))
    return

  let wssURL = "wss://" + config.mqttURL

  console.log("Attempting to connect to the mqtt broker ", wssURL)

  //mqttClient = mqtt.connect(wsURL)
  mqttClient = mqtt.connect(wssURL, {rejectUnauthorized: false})
  last_config = config

// SUBSCRIBE TO TOPICS
  const topicObj = {
    task:           'taskEvent/',
    command:        'command/',
    sessionControl: 'sessionControl/',
    motion:         'sensor/motion/',
    gaze:           'sensor/gaze/',
    requestStatus:  'requestStatus/',
    tag:            'tag/',
    statusUpdate:   'statusUpdate/'
  }

  mqttClient.on('connect', () => {
    Object.values(topicObj).forEach( topic =>
      mqttClient.subscribe(topic + "#", err => { if (err) console.log(err) })
    )
    console.log('Connected to mqtt broker')
  })

// RESPOND TO TOPICS
  mqttClient.on('message', (topic, message) => {
   // console.log("("+topic+") " + message)
    if (topic.startsWith(topicObj.motion)) 
      eventStore.default.sendMotionData(message)   
    else if (topic.startsWith(topicObj.gaze))
      eventStore.default.sendGazeData(message)
    else if (topic.startsWith(topicObj.task))
      eventStore.default.sendCurrentMessage(message)
    else if (topic.startsWith(topicObj.command))
      eventStore.default.sendCurrentCommand(message)
    else if (topic.startsWith(topicObj.tag)) 
      eventStore.default.sendTag(message)
    else if (topic.startsWith(topicObj.requestStatus))
      mqttClient.publish(topicObj.statusUpdate, window.localStorage.getItem('statusObj'))
    else if (topic.startsWith(topicObj.statusUpdate)) {
      if (JSON.parse(message).recording)
        console.log(JSON.parse(message).user.uid + " recording")
      else 
        console.log(JSON.parse(message).user.uid + " not recording")
    } else if (topic.startsWith(topicObj.sessionControl)) {
      if (JSON.parse(message).deviceID === window.localStorage.getItem('deviceID'))         //Only respond to the message if the device ID matches our own and the screenID is different so we don't repeat messages endlessly
        eventStore.default.sendSessionControlMsg(JSON.parse(message))
    } else 
        console.log("message " + message + " from unknown topic recieved: ", topic)
  })
}

//SEND MESSAGES
module.exports = {
  sendMqttMessage(topic, msg) { 
    mqttClient.publish(topic, msg) 
  },
  startMQTT(config, restart)  { _startMQTT(config, restart) }
}