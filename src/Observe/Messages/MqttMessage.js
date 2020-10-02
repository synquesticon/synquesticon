import React, { useState, useEffect, useRef } from 'react'
import eventStore from '../../core/eventStore'
import { withTheme } from '@material-ui/styles'
//import Chart from "react-apexcharts"
import ApexCharts from 'apexcharts'
import { SVG } from '@svgdotjs/svg.js'

const mqttMessage = props => {
    let refArray = new Array(2).fill(useRef())

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

    let graphArr = new Array(2)
    useEffect(() => {
        eventStore.setMotionListener("on", onNewEvent)
        refArray.forEach( (item, index) => {
            graphArr[index] = SVG().addTo(refArray[index].current).size("100%", 300)
        })
        return () => eventStore.setMotionListener("off", onNewEvent)
    }, [])

    let count = 0
    const offsetX = 800
    const cutOff = 3000
    const scale = [-5, -0.4]
    let prevArr = [[0, 0, 0], [0, 0, 0]]
    const colors = ['red', 'green', 'blue']
    let delArr = []

    const onNewEvent = () => {
        const {position, rotation} = JSON.parse(eventStore.getMotionData())
        delArr.push(new Array(6))
        count++

        const posArr = [
            [position.x, position.y, position.z],
            [rotation.a, rotation.b, rotation.c]
        ]

        prevArr.forEach( (sensor, idx) => {
            prevArr[idx].forEach( (last, index) => {
                delArr[count - 1][index] = graphArr[idx].line(
                    (count + offsetX - 1),
                    ((last * scale[idx]) + 150),
                    (count + offsetX),
                    ((posArr[idx][index] * scale[idx]) + 150)
                ).stroke({ color: colors[index], width: 1, linecap: 'round' })
            })
            graphArr[idx].viewbox(count, 0, 900, 300)
        })

        if (count > cutOff)
            delArr[count - cutOff].forEach( item => item.remove() )

        prevArr = posArr
    }

    return (
        <>
            <div ref={refArray[0]}></div>
            <div ref={refArray[1]}></div>

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