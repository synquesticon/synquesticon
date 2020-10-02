import React, { useState, useEffect, useRef } from 'react'
import eventStore from '../../core/eventStore'
import { withTheme } from '@material-ui/styles'
//import Chart from "react-apexcharts"
import ApexCharts from 'apexcharts'
import { SVG } from '@svgdotjs/svg.js'

const mqttMessage = props => {
    const accRef = useRef()
    const gyroRef = useRef()

    const [mqttMessage, setMqttMessage] = useState(
        {
            user: { uid: 0 },
            timestamp: 0,
            startTime: 0,
            recordingCount: 0,
            sampleCount: 0,
            position: { x: 0, y: 0, z: 0 },
            rotation: { a: 0, b: 0, c: 0 },
            tag: "no tag"
        })

    let acc = null
    let gyro = null
    useEffect(() => {
        eventStore.setMotionListener("on", onNewEvent)

        acc = SVG().addTo(accRef.current).size("100%", 300)
        //acc.rect("100%", "100%").fill('white').stroke("blue")

        gyro = SVG().addTo(gyroRef.current).size("100%", 300)
       // gyro.rect("100%", "100%").fill('yellow').stroke("red")
        return () => eventStore.setMotionListener("off", onNewEvent)
    }, [])

    let count = 0
    const offsetX = 800
    const scaling = -5
    const scalingRotation = -0.4
    let accLast = [0, 0, 0]
    let gyroLast = [0, 0, 0]
    const colors = ['red', 'blue', 'green']

    const onNewEvent = () => {
        const msg = JSON.parse(eventStore.getMotionData())
        count++

        const accPos = [msg.position.x, msg.position.y, msg.position.z]
        accLast.forEach((last, index) => {
            acc.line(
                ( count + offsetX - 1),
                ( (last * scaling) + 150),
                ( count + offsetX),
                ( (accPos[index] * scaling) + 150) 
            ).stroke({ color: colors[index], width: 1, linecap: 'round' })
        })
        acc.viewbox(count, 0, 900, 300);
        accLast = [accPos[0], accPos[1], accPos[2]]

        const gyroPos = [msg.rotation.a, msg.rotation.b, msg.rotation.c]
        gyroLast.forEach((last, index) => {
            gyro.line(
                ( count + offsetX - 1),
                ( (last * scalingRotation) + 150),
                ( count + offsetX),
                ( (gyroPos[index] * scalingRotation) + 150) 
            ).stroke({ color: colors[index], width: 1, linecap: 'round' })
        })
        console.log(msg)
        gyro.viewbox(count, 0, 900, 300);
        gyroLast = [gyroPos[0], gyroPos[1], gyroPos[2]]
    }


    return (
        <>
            <div ref={accRef}></div>
            <div ref={gyroRef}></div>

            <div>tag: {mqttMessage.tag}</div>
            <div>user: {mqttMessage.user.uid}</div>
            <div>recordingCount: {mqttMessage.recordingCount}</div>
            <div>sampleCount: {mqttMessage.sampleCount}</div>
            <div>elapsedTime: {((mqttMessage.timestamp - mqttMessage.startTime) / 1000).toFixed(1)}</div>
            <div>x: {mqttMessage.position.x}</div>
            <div>y: {mqttMessage.position.y}</div>
            <div>z: {mqttMessage.position.z}</div>
            <div>a: {mqttMessage.rotation.a}</div>
            <div>b: {mqttMessage.rotation.b}</div>
            <div>c: {mqttMessage.rotation.c}</div>
        </>
    )
}

export default withTheme(mqttMessage)