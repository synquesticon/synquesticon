import React, { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button'

const buttonElement = props => {
    const [isClicked, setIsClicked] = useState(false)
    const clickedButtonStyle = { backgroundColor: "#33ccff" }

    useEffect(() => {
        (props.id === props.clickedButton) ? setIsClicked(true) : setIsClicked(false)
    }, [props.clickedButton])

    const onButtonPressed = e => {
        if (props.reset) {                      //Auto-reset buttons
            if (!isClicked) {
                setIsClicked(true)
                setTimeout( () => { setIsClicked(false) }, 1000)
            }
            props.logElementData(props.id, true, props.content)
        } else if (props.isSingleChoice) {      //Single-choice buttons
            isClicked ? props.logElementData(props.id, false, props.content) : props.logElementData(props.id, true, props.content)
        } else {                                //Multiple-choice buttons
            props.logElementData(props.id, !isClicked, props.content)
            setIsClicked(!isClicked)
        }
        if (props.command)
        props.commandCallback({command: props.command.split(';'), content: props.content, isClicked: !isClicked, event: e})
    }

    return (
        <Button
            variant="contained"
            key={props.id}
            onClick={(e) => onButtonPressed(e)}
            style={isClicked ? clickedButtonStyle : null}>
            {props.content}
        </Button>
    )
}

export default buttonElement