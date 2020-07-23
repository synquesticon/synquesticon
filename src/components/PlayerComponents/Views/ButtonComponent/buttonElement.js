import React, { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button';

const buttonElement = (props) => {
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
        if(isClicked === true){
            if (!props.reset) {
                if (!props.isSingleChoice) {
                    setIsClicked(false); // Unclick
                }
                props.logComponentData(props.id, false, props.content)
            }
        } else {
            if (props.reset) {
                setIsClicked(true)
                console.log('Button needs to reset')
                setTimeout(() => {
                    setIsClicked(false)
                }, 1000);
            } else {
                if (!props.isSingleChoice) {
                    setIsClicked(true)
                }
            props.logComponentData(props.id, true, props.content)
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
}

export default buttonElement;