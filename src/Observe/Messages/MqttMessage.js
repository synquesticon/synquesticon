import React, { useState, useEffect } from 'react'
import eventStore from '../../core/eventStore'
import { withTheme } from '@material-ui/styles'

const mqttMessage = props => {
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
        return () => eventStore.setMotionListener("off", onNewEvent)
    }, [])

    const onNewEvent = () => {
        const msg = JSON.parse(eventStore.getCurrentMessage())
        console.log(msg)
        setMqttMessage(msg)
    }

    return (
        <>
            <div>tag: {mqttMessage.tag}</div>
            <div>user: {mqttMessage.user.uid}</div>
            <div>recordingCount: {mqttMessage.recordingCount}</div>
            <div>sampleCount: {mqttMessage.sampleCount}</div>
            <div>elapsedTime: {((mqttMessage.timestamp - mqttMessage.startTime)/1000).toFixed(1)}</div>
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