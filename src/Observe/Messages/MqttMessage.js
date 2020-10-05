import React, { useState, useEffect, useRef } from 'react'
import eventStore from '../../core/eventStore'
import { withTheme } from '@material-ui/styles'
//import Chart from "react-apexcharts"
import ApexCharts from 'apexcharts'
import { SVG } from '@svgdotjs/svg.js'
import { Backdrop } from '@material-ui/core'
import color from '@material-ui/core/colors/amber'

const mqttMessage = props => {
    let refArray = new Array(2).fill(useRef())
    let graphArr = new Array(2)
    let groupArr = new Array(2)

    const mqttMessage = useRef(
        {
//            user: { uid: 0 },
            timestamp: 0,
            startTime: 0,
            recordingCount: 0,
            sampleCount: 0,
//            position: { x: 0, y: 0, z: 0 },
//            rotation: { a: 0, b: 0, c: 0 },
            tag: "no tag"
        })

    useEffect(() => {
        eventStore.setMotionListener("on", onNewEvent)
        refArray.forEach((item, index) => {
            graphArr[index] = SVG().addTo(refArray[index].current).size("100%", 300)
            groupArr[index] = graphArr[index].group()
        })
        return () => eventStore.setMotionListener("off", onNewEvent)
    }, [])

    let count = 0
    const offsetX = 800
    const cutOff = 3000
    const scale = [-5, -0.15]
    const viewboxHeight = 300
    let prevData = null
    let prevTag = ''
    const colors = ['red', 'green', 'blue']
    let delArr = new Array()

    const onNewEvent = () => {
        const { data, tag, timestamp, startTime, sampleCount } = JSON.parse(eventStore.getMotionData())
        if (prevTag != tag) {
            prevTag = tag
            
            let tags = tag.replace(/undefined/g,'')
            tags = tags.replace(/ /g,'\n')
            let text = graphArr[0].text(tags)

            text.css({fill: '#f03'})
            text.move(count+offsetX, 5)
            const bbox = text.bbox()
            const rect = graphArr[0].rect(bbox.width + 10, bbox.height + 10)
            rect.move(bbox.x - 5, 0).fill('#fff')
            text.front()

        }
        // console.log(
        //     " Tag: " + tag +
        //     " Samples: " + sampleCount + 
        //     " Time: " + ( ((timestamp - startTime) / 1000).toFixed(2) )
        // )

        data.forEach( sample => {
            delArr[count] = new Array(sample.length)
            if (!prevData) prevData = sample

            sample.forEach( (series, seriesIndex) => {
                delArr[count][seriesIndex] = new Array(series.length)

                series.forEach((yValue, valueIndex) => {
                    delArr[count][seriesIndex][valueIndex] =
                        groupArr[seriesIndex].line(
                            (count + offsetX),
                            ((prevData[seriesIndex][valueIndex] * scale[seriesIndex]) + viewboxHeight / 2),
                            (count + offsetX +1 ),
                            ((yValue * scale[seriesIndex]) + viewboxHeight / 2)
                        ).stroke({ color: colors[valueIndex], width: 1, linecap: 'round' })
                })
                graphArr[seriesIndex].viewbox(count+1, 0, 900, viewboxHeight)
            })

            if (count+1 > cutOff)
                delArr[count+1 - cutOff].forEach(item =>
                    item.forEach( item => item.remove() )
                )
            count++
            prevData = sample
        })
    }

    // <div>tag: {mqttMessage.tag}</div>
    // <div>user: {mqttMessage.user.uid}</div>
    // <div>recordingCount: {mqttMessage.recordingCount}</div>
    // <div>sampleCount: {mqttMessage.sampleCount}</div>
    // <div>elapsedTime: {((mqttMessage.timestamp - mqttMessage.startTime) / 1000).toFixed(1)}</div>
    // <div>x: {mqttMessage.position.x}</div>
    // <div>y: {mqttMessage.position.y}</div>
    // <div>z: {mqttMessage.position.z}</div>
    // <div>a: {mqttMessage.rotation.a}</div>
    // <div>b: {mqttMessage.rotation.b}</div>
    // <div>c: {mqttMessage.rotation.c}</div>


    return (
        <>
            <div ref={refArray[0]}></div>
            <div ref={refArray[1]}></div>

        </>
    )
}

export default withTheme(mqttMessage)