import React, {useState, useEffect} from 'react'
import { Typography } from '@material-ui/core';
import { map } from 'lodash';
import Button from './buttonElement'
import store from '../../../../core/store';


let responsesArray = new Array()

const buttonList = (props) => {
    const textRef = React.createRef();
    const [clickedButton, setClickedButton] = useState(null)
    
    useEffect(() => {
       responsesArray = new Array(props.task.responses.length).fill(null)
        var textAOIAction = {
          type: 'ADD_AOIS',
          aois: {
            name: props.parentSet + '_' + props.task.displayText,
            boundingbox: [],
            imageRef: textRef
          }
        }
        store.dispatch(textAOIAction);
      }, 
      []
    );

    const logComponentData = (id, isClicked, content) => {
        if (props.task.singleChoice) {
            responsesArray.fill(null)
        }

        if (isClicked) {
            responsesArray[id] = content
        } else {
            responsesArray[id] = null
        }
        console.log(responsesArray)
    }

    return (
        <div className={props.className}>
          <div>
            <Typography ref={textRef} variant="h3" color="textPrimary" align="center" style={{whiteSpace:"pre-line"}}>{props.task.displayText}</Typography>
          </div>

          <div className="responsesButtons" style={{whiteSpace:"pre-wrap"}}>
            {
              props.task.responses.map((item, index)=>{
                if (item.includes("//")){ 
                  item = item.replace(/\/\//g, "");  // Remove leading slashes
                  item = item.replace(/\\n/g, "\n"); // insert new-line characters
                  return(
                  <Typography 
                    variant="h5" 
                    style={{display: 'inline-block', padding: '5px', whiteSpace: 'pre-wrap'}} 
                    ref={textRef} 
                    color="textPrimary" 
                    align="center">{item}
                  </Typography>)
                } else if (item === "\\n") { //line break
                  return(<br></br>);                
                } else { //render as buttons
                  return (
                    <span className="inputButton" key={index}>
                    <Button
                        content={item}
                        reset={props.task.resetResponses}
                        isSingleChoice={props.task.singleChoice}
                        id={index} 
                        key={index}
                        clickedButton = {clickedButton}
                        setClickedButton = {setClickedButton}
                        logComponentData = {logComponentData}
                    />
                    </span>
                  )                
                }
              }
              )
            }
          </div>
        </div>
      );

    
}

export default buttonList;