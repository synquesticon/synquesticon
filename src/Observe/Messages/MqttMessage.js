import React, { useState, useEffect } from 'react'
import eventStore from '../../core/eventStore'
import { withTheme } from '@material-ui/styles'

const mqttMessage = props => {
    const [mqttMessage, setMqttMessage] = useState("No mqtt data")
    useEffect(() => {
        eventStore.addMotionListener(onNewEvent)
        return () => eventStore.removeMotionListener(onNewEvent)
    }, [])

    let x = 3
    const onNewEvent = () => {
        const msg = JSON.parse(eventStore.getCurrentMessage())
        console.log(msg)
        setMqttMessage(msg.position.x)
    }

    return (
        <div>
            {mqttMessage}
        </div>
    )
}

export default withTheme(mqttMessage)