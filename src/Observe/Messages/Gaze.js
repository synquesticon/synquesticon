import React, { useState, useEffect, useRef } from 'react'
import eventStore from '../../core/eventStore'
import { withTheme } from '@material-ui/styles'
//import Chart from "react-apexcharts"
import ApexCharts from 'apexcharts'
import { SVG } from '@svgdotjs/svg.js'
import { Backdrop } from '@material-ui/core'
import color from '@material-ui/core/colors/amber'

const mqttMessage = props => {
    let refArray = new Array(1).fill(useRef())
    let graphArr = new Array(1)
    let gazePointArr = new Array(1)
    gazePointArr[0] = new Array(2)
    let bbox

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
        eventStore.setGazeListener("on", onNewEvent)
        refArray.forEach((item, index) => {
            graphArr[index] = SVG().addTo(refArray[index].current).size("100%", "100%").fill('#0ff')
            bbox = refArray[index].current.getBoundingClientRect()
            gazePointArr[index][0] = graphArr[index].circle(100).fill('#f06').move(20, 20)
            gazePointArr[index][1] = graphArr[index].circle(100).fill('#f06').move(20, 20)
        })
        return () => eventStore.setGazeListener("off", onNewEvent)
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
        const data = JSON.parse(eventStore.getGazeData())
        console.log(data[1][1] +"  --  "+ bbox.width +"  --  "+bbox.height)
        gazePointArr[0][0].radius(data[1][0] * 3).move(data[1][1]*bbox.width, data[1][2]*bbox.height)
        gazePointArr[0][1].radius(data[1][3] * 3).move(data[1][4]*bbox.width, data[1][5]*bbox.height)

        // if (prevTag != tag) {
        //     prevTag = tag
            
        //     let tags = tag.replace(/undefined/g,'')
        //     tags = tags.replace(/ /g,'\n')
        //     let text = graphArr[0].text(tags)

        //     text.css({fill: '#f03'})
        //     text.move(count+offsetX, 5)
        //     const bbox = text.bbox()
        //     const rect = graphArr[0].rect(bbox.width + 10, bbox.height + 10)
        //     rect.move(bbox.x - 5, 0).fill('#fff')
        //     text.front()

        // }
        // // console.log(
        // //     " Tag: " + tag +
        // //     " Samples: " + sampleCount + 
        // //     " Time: " + ( ((timestamp - startTime) / 1000).toFixed(2) )
        // // )

        // data.forEach( sample => {
        //     delArr[count] = new Array(sample.length)
        //     if (!prevData) prevData = sample

        //     sample.forEach( (series, seriesIndex) => {
        //         delArr[count][seriesIndex] = new Array(series.length)

        //         series.forEach((yValue, valueIndex) => {
        //             delArr[count][seriesIndex][valueIndex] =
        //                 groupArr[seriesIndex].line(
        //                     (count + offsetX),
        //                     ((prevData[seriesIndex][valueIndex] * scale[seriesIndex]) + viewboxHeight / 2),
        //                     (count + offsetX +1 ),
        //                     ((yValue * scale[seriesIndex]) + viewboxHeight / 2)
        //                 ).stroke({ color: colors[valueIndex], width: 1, linecap: 'round' })
        //         })
        //         graphArr[seriesIndex].viewbox(count+1, 0, 900, viewboxHeight)
        //     })

        //     if (count+1 > cutOff)
        //         delArr[count+1 - cutOff].forEach(item =>
        //             item.forEach( item => item.remove() )
        //         )
        //     count++
        //     prevData = sample
        // })
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
            <div ref={refArray[0]} style={{height:"600px"}}></div>
        </>
    )
}

export default withTheme(mqttMessage)