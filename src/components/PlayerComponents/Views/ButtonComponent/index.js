import React, {useState, useEffect} from 'react'
import { Typography } from '@material-ui/core';
import { map } from 'lodash';
import Button from './buttonElement'
import store from '../../../../core/store';


let responsesArray = new Array()
let responseCountArray = new Array()

const buttonList = (props) => {
    const textRef = React.createRef();
    const [clickedButton, setClickedButton] = useState(null)
    
    useEffect(() => {
       responsesArray = new Array(props.task.responses.length).fill(null)
       responseCountArray = new Array(props.task.responses.length).fill(0)
        var textAOIAction = {
          type: 'ADD_AOIS',
          aois: {
            name: props.parentSet + '_' + props.task.displayText,
            boundingbox: [],
            imageRef: textRef
          }
        }
        store.dispatch(textAOIAction);
        return () => {
            console.log("Final answer: "+ responsesArray.filter(item => item))
            console.log("Final count: "+responseCountArray.reduce((a, b) => {return a + b}, 0))
        }
      }, []
    );

    const logComponentData = (id, isClicked, content) => {
        responseCountArray[id]++
        if (props.task.singleChoice) {
            responsesArray.fill(null)
            if (isClicked) {
                setClickedButton(id)
            } else {
                setClickedButton(null)
            }
        }

        if (isClicked) {
            responsesArray[id] = content
        } else {
            responsesArray[id] = null
        }
        console.log(responsesArray)
        console.log(responseCountArray)
        console.log("Total responses: "+responseCountArray.reduce((a, b) => {return a + b}, 0))
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