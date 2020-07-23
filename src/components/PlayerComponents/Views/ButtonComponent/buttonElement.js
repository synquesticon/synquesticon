import React, { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button';

const buttonElement = (props) => {
    const [isClicked, setIsClicked] = useState(false);
    const isResetable = props.reset;
    const isSingleChoice = props.isSingleChoice

    useEffect( () => {
        if (props.id == props.pressedKey) {
            console.log(props.id + "SAME" + props.pressedKey)
            setIsClicked(true)
        } else {
            console.log(props.id + "DIFF" + props.pressedKey)
            setIsClicked(false)
        }
    }, [props.pressedKey])


    const buttonStyle = {
        padding: '5px'
    }

    const clickedButtonStyle = {
        backgroundColor: "#33ccff"
    }

    const onButtonPressed = (event) => {
        if(isClicked === true){
            setIsClicked(false); // Unclick
        } else {
            if (isResetable) {
                setIsClicked(true)
                console.log('Button needs to reset')
                setTimeout(() => {
                    setIsClicked(false)
                }, 1000);
            } else if (isSingleChoice) {
                props.resetKeys(props.id)                
            } else {
                setIsClicked(true)
            }
        }
    }

    return (
        <Button 
        key={props.id}
        onClick={(event) => onButtonPressed(event)}
        style={isClicked ? clickedButtonStyle : buttonStyle}>
            {props.content}
        </Button>
    )

}

export default buttonElement;