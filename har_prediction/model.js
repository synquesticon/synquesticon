// const tf = require('@tensorflow/tfjs')
const tf = require('@tensorflow/tfjs')
require('@tensorflow/tfjs-node')

const mqtt = require('mqtt')

const express = require('express')
const { prependOnceListener } = require('process')

let signalArray = []


const app = express()

app.get('/', (req, res) => {
    res.send('Yes, HAR is up')
})

app.listen(8080, '0.0.0.0')
console.log('Motherfucker Azure running now on 8080')

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
    x = message.position.x
    y = message.position.y
    z = message.position.z

    a = message.rotation.a
    b = message.rotation.b
    c = message.rotation.c

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

