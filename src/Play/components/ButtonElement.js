import React, { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button'

const buttonElement = props => {
    const [isClicked, setIsClicked] = useState(false)
    const clickedButtonStyle = { backgroundColor: "#33ccff" }

    useEffect(() => {
        (props.id === props.clickedButton)
            ? setIsClicked(true)
            : setIsClicked(false)
    }, [props.clickedButton])

    const onButtonPressed = e => {
        if (props.reset) {                      //Auto-reset buttons
            if (!isClicked) {
                setIsClicked(true)
                setTimeout(() => { setIsClicked(false) }, 1000)
            }
            props.clickCallback(props.id, true, props.content)
        } else if (props.isSingleChoice) {      //Single-choice buttons
            props.clickCallback(props.id, !isClicked, props.content)
        } else {                                //Multiple-choice buttons
            props.clickCallback(props.id, !isClicked, props.content)
            setIsClicked(!isClicked)
        }
        if (props.command)

            if (props.command.includes('recordMotion')) {
                if (typeof DeviceMotionEvent.requestPermission === 'function') {
                    // iOS 13+
                    DeviceMotionEvent.requestPermission()
                        .then(response => {
                            if (response == 'granted') {
                             //   window.addEventListener('devicemotion', (e) => {
                             //   alert("GRANT" + e.acceleration.x)
                               //  })
                            }
                        })
                        .catch(console.error)
                } else {
                    // non iOS 13+
                    alert('not ios')
                }

            }


        props.commandCallback({
            command: (props.command !== undefined)?props.command.split('&&'):undefined,
            content: props.content,
            isClicked: !isClicked,
            displayText: props.displayText,
            event: e
        })
    }

    return (
        <Button
            variant="contained"
            key={props.id}
            onClick={e => onButtonPressed(e)}
            style={isClicked ? clickedButtonStyle : null}>
            {props.content}
        </Button>
    )
}

export default buttonElement