import React, {useState, useEffect} from 'react'
import { Typography } from '@material-ui/core';
import { map } from 'lodash';
import Button from './buttonElement'

const buttonList = (props) => {
    
    const buttonListStyle = {
        textAlign: 'center',
        padding: '5px',
        marginTop: '10px'
    }

    const isSingleChoice = props.task.singleChoice

    const [pressedKey, setPressedKey] = useState(null)

    return(
            {
                props.task.responses.map((item, index) => {
                    if (item.includes("//")){ 
                        item = item.replace(/\/\//g, "");  // Remove leading slashes
                        item = item.replace(/\\n/g, "\n"); // insert new-line characters
                        return(<Typography variant="h5" style={{display: 'inline-block', padding: '5px', whiteSpace: 'pre-wrap'}} color="textPrimary" align="center">{item}</Typography>)
                      } else if (item === "\\n") { //line break
                        return(<br></br>);           
                      } else {
                        return (
                            <Button 
                            content={item}
                            reset={props.task.resetResponses}
                            isSingleChoice={isSingleChoice}
                            id={index} 
                            pressedKey = {pressedKey}
                            resetKeys = {setPressedKey}/>
                        )
                      }
                })
            }
        </div>
    )
};

export default buttonList;