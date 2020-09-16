const mqtt = require('mqtt')
const mongodb = require('mongodb')
const mongoose = require("mongoose")
const Schema = mongoose.Schema

const DeviceMotionSchema = new Schema(
    {
        user: {
            uid: String
        },
        timestamp: String,
        count: String,
        position: {
            x: String,
            y: String,
            z: String
        },
        rotation: {
            a: String,
            b: String,
            c: String
        },
        tag: String
    },
    { collection: 'Device_Motion' }
)

const DeviceMotion = mongoose.model("DeviceMotion", DeviceMotionSchema)

let mongodbClient = mongodb.MongoClient
const mongodbURI = "mongodb://localhost:27017/SensorData"

mongodbClient.connect(mongodbURI,
    { useNewUrlParser: true, useUnifiedTopology: true },
    setUpConnection)


const setUpConnection = (err, client) => {
    if (err) throw err
    console.log('Motion logging db created')

    let db = mongoose.connection
    db.once("open", () => console.log("Connected to the database"))
    // checks if connection with the database is successful
    db.on("error", console.error.bind(console, "MongoDB connection error:"))
    mongoose.connect(mongodbURI, { useUnifiedTopology: true, useNewUrlParser: true })
    mqttClient = mqtt.connect("wss://syn.ife.no/mqttproxy:9001")

    mqttClient.on('connect', function () {
        console.log("Connected to mqtt broker")
        mqttClient.subscribe("motion", function (err) { if (err) { console.log(err) } })
    })
    mqttClient.on('message', insertEvent)
}

function insertEvent(topic, message) {
    message = JSON.parse(message)
    let deviceMotion = new DeviceMotion(message)
    deviceMotion.save((err, q) => {
        if (err) { console.log(err) }
    })
}