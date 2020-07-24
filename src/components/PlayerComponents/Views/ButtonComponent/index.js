import React, {useState, useEffect} from 'react'
import { Typography } from '@material-ui/core';
import { map } from 'lodash';
import Button from './buttonElement'
import store from '../../../../core/store';

const buttonList = (props) => {
  console.log(props)
    const textRef = React.createRef();
    let [clickedButton, setClickedButton] = useState(null)
    let [responseCountArray, setResponseCountArray] = useState(new Array(props.task.responses.length).fill(0))
    let [responsesArray, setResponsesArray] = useState(new Array(props.task.responses.length).fill(null))

    console.log("render")
    
    useEffect(() => {
        var textAOIAction = {
          type: 'ADD_AOIS',
          aois: {
            name: props.parentSet + '_' + props.task.displayText,
            boundingbox: [],
            imageRef: textRef
          }
        }
        store.dispatch(textAOIAction);
        return () => {      // log data when component unmounts
            console.log("Final answer: "+ responsesArray.filter(item => item).sort())
            console.log("Final count: "+responseCountArray.reduce((a, b) => {return a + b}, 0))
            if (props.task.correctResponses.length > 0) {
                console.log("Overall correct: " + arrayEquals(responsesArray, props.task.correctResponses))
            } else {
                console.log("No correct answers defined.")
            }
        }
      }, []
    );

    const logElementData = (id, isClicked, content) => {
        clickedButton = id
        responseCountArray[id]++
        if (props.task.singleChoice) {
            responsesArray.fill(null)
            if (isClicked) {
                console.log("single")
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
        console.log("correct: "+props.task.correctResponses)
        console.log(responsesArray)
        console.log(responseCountArray)
        console.log("Total responses: "+responseCountArray.reduce((a, b) => {return a + b}, 0))
    }

    const arrayEquals = (a, b) => {
        a = a.filter(item => item).sort()
        b = b.filter(item => item).sort()
        return Array.isArray(a) &&
          Array.isArray(b) &&
          a.length === b.length &&
          a.every((val, index) => val.toUpperCase() === b[index].toUpperCase());
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
                    key={index}
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
                        logElementData = {logElementData}
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