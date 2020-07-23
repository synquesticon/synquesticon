import React, { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button';

const button = (props) => {
    const [isClicked, setIsClicked] = useState(false);
    const isResetable = props.reset;
    const isSingleChoice = props.isSingleChoice

    // useEffect(
    //     () => {
    //         console.log('Button checks condition only when it is clicked')
    //         if (isResetable && isClicked) {
    //             console.log('Button needs to reset')
    //             setTimeout(() => {
    //                 setIsClicked(false)
    //             }, 1000);
    //         }
    //     }
    // , [isClicked]);

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
            setIsClicked(true);

            if (isResetable) {
                console.log('Button needs to reset')
                setTimeout(() => {
                    setIsClicked(false)
                }, 1000);
            }

            if (isSingleChoice) {
                
            }
        }

        
        
        
    }

    return (
        <Button 
        onClick={(event) => onButtonPressed(event)}
        style={isClicked ? clickedButtonStyle : buttonStyle}>
            {props.content}
        </Button>
    )

}

    

    

    


        

    



export default button;