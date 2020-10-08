// const tf = require('@tensorflow/tfjs')
const tf = require('@tensorflow/tfjs')
require('@tensorflow/tfjs-node')

const mqtt = require('mqtt')

const express = require('express')

let signalArray = []


const app = express()

app.get('/', (req, res) => {
    res.send('Yes, HAR is up')
})

app.listen(8080, '0.0.0.0')

mqttClient = mqtt.connect("wss://syn.ife.no/mqttproxy:9001")
mqttClient.on('connect', function () {
    console.log("Connected to mqtt broker")
    mqttClient.subscribe("sensor/motion/#", function (err) { if (err) { console.log(err) } })
})
mqttClient.on('message', collectSignal)

function collectSignal(topic, message) {
    if(topic == "sensor/motion/prediction"){
        return
    }
    message = JSON.parse(message)

    x = message.data[0][0][0]
    y = message.data[0][0][1]
    z = message.data[0][0][2]

    a = message.data[0][1][0]
    b = message.data[0][1][1]
    c = message.data[0][1][2]

    signalArray = [...signalArray, x, y, z, a, b, c]
    
    if (signalArray.length == 540) { //90 signals * 6 features = 540
        predictActivity(signalArray)
        signalArray=[]
    }
}

async function predictActivity(signalArray){
    console.log("Start to predict")
    model = await tf.loadLayersModel('file://model/model.json')
    const reshape = tf.tensor3d(signalArray, [90, 6, 1])
    const batch = tf.expandDims(reshape, 0)
    const pred = await model.predict(batch).dataSync()    
    console.log(pred)
    labels = ['sit', 'stairsDown', 'stairsUp', 'stand', 'walk']
    prediction = labels[pred.indexOf(Math.max(...pred))]
    mqttClient.publish('sensor/motion/prediction', JSON.stringify({'prediction': prediction}))
    console.log(prediction)
}

