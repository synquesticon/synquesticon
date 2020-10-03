import React, { useState, useEffect, useRef } from 'react'
import eventStore from '../../core/eventStore'
import { withTheme } from '@material-ui/styles'
//import Chart from "react-apexcharts"
import ApexCharts from 'apexcharts'
import { SVG } from '@svgdotjs/svg.js'

const mqttMessage = props => {
    let refArray = new Array(2).fill(useRef())
    let graphArr = new Array(2)

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

    useEffect(() => {
        eventStore.setMotionListener("on", onNewEvent)
        refArray.forEach((item, index) => {
            graphArr[index] = SVG().addTo(refArray[index].current).size("100%", 300)
        })
        return () => eventStore.setMotionListener("off", onNewEvent)
    }, [])

    let count = 0
    const offsetX = 800
    const cutOff = 3000
    const scale = [-5, -0.15]
    const viewboxHeight = 300
    let prevData = [[[0, 0, 0], [0, 0, 0]]]
    const colors = ['red', 'green', 'blue']
    let delArr = []

    const onNewEvent = () => {
        const { data } = JSON.parse(eventStore.getMotionData())

        data.forEach( (sample, sampleIndex) => {
            delArr[count] = new Array(sample.length)
            count++

            sample.forEach( (series, seriesIndex) => {
                delArr[count - 1][seriesIndex] = new Array(series.length)

                series.forEach( (yValue, valueIndex) => {
                    delArr[count - 1][seriesIndex][valueIndex] =
                        graphArr[seriesIndex].line(
                            (count + offsetX - 1),
                            ((prevData[sampleIndex][seriesIndex][valueIndex] * scale[seriesIndex]) + viewboxHeight/2),
                            (count + offsetX),
                            ((yValue * scale[seriesIndex]) + viewboxHeight/2)
                        ).stroke({ color: colors[valueIndex], width: 1, linecap: 'round' })
                })
                graphArr[seriesIndex].viewbox(count, 0, 900, viewboxHeight)
            })

             if (count > cutOff)
                 delArr[count - cutOff].forEach( item => 
                    item.forEach( item =>
                        item.remove() 
                    )
                )

            prevData = data
        })
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