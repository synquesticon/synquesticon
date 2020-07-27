const store = require('./store')
const eventStore = require('./eventStore')
const playerUtils = require('./player_utility_functions')

//MQTT javascript library
const mqtt = require('mqtt')

//Connection settings
let mqttClient = null
let last_config = null

//Publication topics
const SynquesticonTopic = "Synquesticon.Task"
const SynquesticonCommandTopic = "Synquesticon.Command"
const SynquesticonMultipleScreenTopic = "Synquesticon.MultipleScreen"
const RemoteEyeTrackingTopic = "RETDataSample"

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

const onMultipleScreenEvent = message => {
  if (message) {
    let parsedMessage = JSON.parse(message)

    //Only respond to the message if the device ID matches our own and the screenID is different so we don't repeat messages endlessly
    if (parsedMessage.deviceID === window.localStorage.getItem('deviceID') && ((parsedMessage.screenID !== store.default.getState().screenID) || (parsedMessage.screenID === ''))) {
      eventStore.default.emitMultipleScreenEvent(JSON.parse(message))
    }
  }
}

//TODO test and finish
const onRETData = newMessage => {
  let message = JSON.parse(newMessage)
  let gazeData = message[1]
  let gazeX = gazeData[12]
  let gazeY = gazeData[13]

  let gazeAction = {
    type: 'SET_GAZE_DATA',
    tracker: message[0],
    gazeData: {
      timestamp: playerUtils.getCurrentTime(),
      locX: gazeX,
      locY: gazeY,
      leftPupilRadius: gazeData[0] / 2,
      rightPupilRadius: gazeData[3] / 2
    }
  }
  store.default.dispatch(gazeAction)
}

const _startMQTT = (config, restart) => {
  if (restart) {
    console.log("restarting mqtt client")
    if (mqttClient) {mqttClient.end()}
  } else if (last_config && (last_config.ip === config.ip && last_config.port === config.port)) {
    return
  }

  let wsURL = config.bUseWSS ? "wss://" : "ws://"
  wsURL += config.ip + ":" + config.port

  //Attempt to connect the client to the mqtt broker
  console.log("Attmpting to connect to the mqtt broker ", wsURL)
  mqttClient = mqtt.connect(wsURL)
  last_config = config

  //When the client connects we subscribe to the topics we want to listen to
  mqttClient.on('connect', function () {
    console.log("Connected to mqtt broker")
    mqttClient.subscribe(SynquesticonTopic, function (err) {
      if (err) {console.log(err)}
    })
    mqttClient.subscribe(SynquesticonCommandTopic, function (err) {
      if (err) { console.log(err) }
    })
    mqttClient.subscribe(SynquesticonMultipleScreenTopic, function (err) {
      if (err) { console.log(err) }
    })
    mqttClient.subscribe(RemoteEyeTrackingTopic, function (err) {
      if (err) { console.log(err) }
    })
  })

  //When the client connects we subscribe to the topics we want to listen to
  mqttClient.on('message', function (topic, message) {
    if (topic === SynquesticonTopic) {
      onMQTTEvent(message)
    } else if (topic === SynquesticonCommandTopic) {
      onCommandEvent(message)
    } else if (topic === RemoteEyeTrackingTopic) {
      onRETData(message)
    } else if (topic === SynquesticonMultipleScreenTopic) {
      onMultipleScreenEvent(message)
    } else {
      console.log("message from unknown topic recieved: ", topic)
    }
  })
}

module.exports = {
  broadcastEvents(info) {
    if (mqttClient) {
      mqttClient.publish(SynquesticonTopic, info)
    } else {
      console.log("Tried to publish, but MQTT client was null")
    }
  },
  broadcastCommands(command) {
    if (mqttClient) {
      mqttClient.publish(SynquesticonCommandTopic, command)
    } else {
      console.log("Tried to publish, but MQTT client was null")
    }
  },
  broadcastMultipleScreen(command) {
    if (mqttClient) {
      mqttClient.publish(SynquesticonMultipleScreenTopic, command)
    } else {
      console.log("Tried to publish, but MQTT client was null")
    }
  },
  startMQTT(config, restart) {
    _startMQTT(config, restart)
  }
}