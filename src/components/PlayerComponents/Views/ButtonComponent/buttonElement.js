import React, { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button';

const buttonElement = React.memo( (props) => {
    const [isClicked, setIsClicked] = useState(false);
    const clickedButtonStyle = {
        backgroundColor: "#33ccff"
    }

    useEffect( () => {
        if (props.id === props.clickedButton) {
            setIsClicked(true)
        } else {
            setIsClicked(false)
        }
    }, [props.clickedButton])

    const onButtonPressed = () => {
        if (props.reset) {                      //Auto-reset buttons
            if (!isClicked){
                setIsClicked(true)
                setTimeout(() => {
                    setIsClicked(false)
                }, 1000);
            }
            props.logElementData(props.id, true, props.content)
        } else if (props.isSingleChoice) {      //Single-choice buttons
            if (isClicked) {
                props.logElementData(props.id, false, props.content)
            } else {
                props.logElementData(props.id, true, props.content)
            }
        } else {                                //Multiple-choice buttons
            if (isClicked) {
                setIsClicked(false)
                props.logElementData(props.id, false, props.content)
            } else {
                setIsClicked(true)
                props.logElementData(props.id, true, props.content)
            }

        }
    }

    return (
        <Button
        variant="contained"                        
        key={props.id}
        onClick={(event) => onButtonPressed(event)}
        style={isClicked ? clickedButtonStyle : null}>
            {props.content}
        </Button>
    )
})

export default buttonElement;