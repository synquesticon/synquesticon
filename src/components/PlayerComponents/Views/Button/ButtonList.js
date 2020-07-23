import React from 'react'
import { map } from 'lodash';
import Button from './Button'

const buttonList = (props) => {
    
    const buttonListStyle = {
        textAlign: 'center',
        padding: '5px',
        marginTop: '10px'
    }

    const isSingleChoice = props.task.singleChoice

    return(
        <div style={buttonListStyle}>
            {
                props.task.responses.map((item, index) => {
                    return (
                        <Button 
                        content={item}
                        reset={props.task.resetResponses}
                        isSingleChoice={isSingleChoice}
                        key={index} />
                    )
                })
            }
        </div>
    )
};

export default buttonList;