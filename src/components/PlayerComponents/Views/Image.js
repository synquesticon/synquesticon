import React, { useState, useEffect } from 'react';

import AOIComponent from '../../../EditMode/Task/ImageType/AOIEditor/AOIComponent';

import store from '../../../core/store';
import * as playerUtils from '../../../core/player_utility_functions';

import './Image.css';
import loggingUtils from '../../../makeLogObject';
import uuid from 'react-uuid'

let CLICK_RADIUS = "1";
let OPACITY = "0.5";
let COLOR = "red";

const image = (props) =>  {
    
  const [imageWidth, setImageWidth] = useState(100)
  const [imageHeight, setImageHeight] = useState(100)
  const [imageElement, setImageElement] = useState(null)

  let image = null;
  const imageRef = React.createRef();
  const [clicks, setClicks] = useState([]);
  const clicksRef = React.useRef()
  
  useEffect(() => {
    clicksRef.current = [...clicks]
    image = new Image();
    image.src = "/Images/" + props.task.image;
    image.ref = imageRef;
    window.addEventListener("resize", handleImageLoaded);

    if (props.task.aois.length > 0) {
      const aois = props.task.aois.slice()

      aois.forEach(aio => {
        aio.imageRef = imageRef;
      });

      const action = {
        type: 'ADD_AOIS',
        aois: aois
      }

      store.dispatch(action);
    }
    return () => {
      if(props.task.recordClicks){
        const taskObject = {
          uid: props.taskID,
          name: props.parentSet,
          tags: props.tags
        }
      
        const componentObject = {
          uid: uuid(),
          type: "IMAGE",
          text: props.task.displayText,
          correctResponses: props.task.correctResponses,
          responseOptions: props.task.aios,
          reponsesArray: clicksRef.current
        }

        const imageComponentObject = loggingUtils(taskObject, componentObject)
        console.log('Image component', JSON.parse(imageComponentObject))



      }
      window.removeEventListener("resize", handleImageLoaded);
    }
  }
  ,[])

  useEffect(() => {
    clicksRef.current = clicks.slice()
  }, [clicks])


  const getMousePosition = e => {
    let imageRect = e.target.getBoundingClientRect();
    return {x : (e.clientX - imageRect.left)/imageRect.width,
            y: (e.clientY - imageRect.top)/imageRect.height}
  }

  const normalizeBoundingBoxes = (boundingBox,imageDivRectangle,polygonList) => {
      let x = boundingBox[0]*imageDivRectangle.width/100 + imageDivRectangle.x;
      let y = boundingBox[1]*imageDivRectangle.height/100 + imageDivRectangle.y;
      return [x,y];
  }

  const checkHitAOI = click => {
    let aois = store.getState().aois;
    let pointInsideAOIs = [];

    aois.forEach(a => {

      if(a.imageRef.current === null){
        console.log("null imageref");
        return ["noAOI"];
      }

      let imageDivRect = imageRef.current.getBoundingClientRect();
      let polygon = [];
      if (a.boundingbox.length > 0) {
        for(let boundingbox of a.boundingbox){
          polygon.push(normalizeBoundingBoxes(boundingbox,imageDivRect));
        }
      }
      else {
        polygon.push([imageDivRect.x, imageDivRect.y]);
        polygon.push([imageDivRect.x + imageDivRect.width, imageDivRect.y]);
        polygon.push([imageDivRect.x + imageDivRect.width, imageDivRect.y + imageDivRect.height]);
        polygon.push([imageDivRect.x, imageDivRect.y + imageDivRect.height]);
      }

      if (playerUtils.pointIsInPoly([click.clientX, click.clientY], polygon)){
        pointInsideAOIs.push(a.name);
      }
      
    })

    if (pointInsideAOIs.length > 0){
      return pointInsideAOIs;
    }
    else{
      return ["noAOI"];
    }
  }

  const onImageClicked = e => {
    let mouseClick = getMousePosition(e);
    let click = {
      aoi: checkHitAOI(e),
      x: mouseClick.x,
      y: mouseClick.y,
    };

    setClicks([...clicks, click])
  }

  const getClickableComponent = () => {
    if (props.task.recordClicks) {
      let left = 0;
      if(imageElement){
        left = parseInt(imageElement.offsetLeft);
      }

      return (
        <svg onClick={onImageClicked} style={{left:left}} className="clickableCanvas"
            width={imageWidth} opacity={OPACITY} height={imageHeight} viewBox="0 0 100 100"
            preserveAspectRatio="none">
          <g stroke="none" fill="black">
            {clicks.map((item, index) => {
              return <ellipse key={index} cx={item.x*100} cy={item.y*100} rx={CLICK_RADIUS}
                ry={CLICK_RADIUS*1.8}  fill={COLOR} style={{pointerEvents:'none'}}/>
            })}
          </g>
        </svg>);
    }
    else {
      return null;
    }
  }

  const showAOIs = () => {
    if (props.task.showAOIs) {

      let left = 0;
      if(imageElement){
        left = parseInt(imageElement.offsetLeft);
      }

      return (
        <svg id={props.childKey + "AOICanvas"} style={{left:left,pointerEvents:'none'}} className="AOICanvas"
          width={imageWidth} height={imageHeight} viewBox="0 0 100 100" preserveAspectRatio="none">
          {props.task.aois.map((aoi, index) => {
            return <AOIComponent aoi={aoi} key={index}/>
          })}
        </svg>
      );
    }
    else {
      return null;
    }
  }

  const handleImageLoaded = () => {
    if(imageRef && imageRef.current){
      let image = imageRef.current;
      setImageHeight(image.height)
      setImageWidth(image.width)
      setImageElement(image)

      
    }
  }


  let url = "/Images/" + props.task.image;

  let clickable = null;
  let aois = null;
  if(imageElement){
    clickable = getClickableComponent();
    aois = showAOIs();
  }

  

  return (
    <div className="imagePreviewContainer">
      <img className={props.task.fullScreenImage ? "fullScreenImage": "imageCanvas"} src={url} alt="" ref={imageRef}
        onLoad={handleImageLoaded}/>
      {clickable}
      {aois}
    </div>
  );
}

export default image;
