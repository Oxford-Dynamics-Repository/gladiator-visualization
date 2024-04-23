import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Map } from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { ScenegraphLayer, GeoJsonLayer, ScatterplotLayer } from "deck.gl";
import CheckpointData from "./data/Checkpoints.json";
import { Input, Tooltip, Button, Avatar, List } from "antd";
import { SearchOutlined, UpSquareOutlined } from "@ant-design/icons";
import {FlyToInterpolator} from '@deck.gl/core';
import OpenAI from "openai";
import { Popover } from 'antd';


const openai = new OpenAI({apiKey: "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", dangerouslyAllowBrowser: true});

const INITIAL_VIEW_STATE = {
  latitude: 56.5,
  longitude: -0.7,
  zoom: 5,
  transitionDuration: 2000,
  transitionInterpolator: new FlyToInterpolator(),
};

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";


// Function to compute local tangent plane rotation matrix at WGS84 coordinates
function computeLocalTangentPlaneRotationMatrix(latitude, longitude) {
  const phi = latitude * (Math.PI / 180); // Convert latitude to radians
  const lambda = longitude * (Math.PI / 180); // Convert longitude to radians

  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const sinLambda = Math.sin(lambda);
  const cosLambda = Math.cos(lambda);

  // Calculate the elements of the rotation matrix
  const r11 = -sinLambda;
  const r12 = -sinPhi * cosLambda;
  const r13 = cosPhi * cosLambda;
  const r21 = cosLambda;
  const r22 = -sinPhi * sinLambda;
  const r23 = cosPhi * sinLambda;
  const r31 = 0;
  const r32 = cosPhi;
  const r33 = sinPhi;

  // Return the rotation matrix as a 3x3 array
  return [
      [r11, r12, r13],
      [r21, r22, r23],
      [r31, r32, r33]
  ];
}

// Function to apply rotation matrix to Euler angles
function applyRotationMatrix(rotationMatrix, eulerAngles) {
  // Convert Euler angles to radians
  const [roll, pitch, yaw] = eulerAngles.map(angle => angle * (Math.PI / 180));

  // Multiply rotation matrix with Euler angles
  const rotatedRoll = rotationMatrix[0][0] * roll + rotationMatrix[0][1] * pitch + rotationMatrix[0][2] * yaw;
  const rotatedPitch = rotationMatrix[1][0] * roll + rotationMatrix[1][1] * pitch + rotationMatrix[1][2] * yaw;
  const rotatedYaw = rotationMatrix[2][0] * roll + rotationMatrix[2][1] * pitch + rotationMatrix[2][2] * yaw;

  // Convert rotated Euler angles to degrees
  const rotatedRollDeg = rotatedRoll * (180 / Math.PI);
  const rotatedPitchDeg = rotatedPitch * (180 / Math.PI);
  const rotatedYawDeg = rotatedYaw * (180 / Math.PI);

  return [rotatedRollDeg, rotatedPitchDeg, rotatedYawDeg];
}

export default function App({
  mapStyle = MAP_STYLE,
  initialViewState = INITIAL_VIEW_STATE,
}) {
  const [PlaneData, setPlaneData] = useState([]);
  const [CriticalPlaneData, setCriticialPlaneData] = useState<any>([]);
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [answer, setAnswer] = useState<any>('Give me a moment to assess the airspace.');
  const [showResults, setShowResults] = useState(false);
  const [viewState, setViewState] = useState(initialViewState);
  const [criticalPlaneVisible, setCriticalPlaneVisible] = useState(false);


  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleClose = () => {
    setShowResults(false);
    setCriticalPlaneVisible(false);
  };

  const handleSearch = async () => {
    if (query.trim() !== '') {
      setShowResults(true);
      setTitle(query);
      setAnswer("Give me a moment to assess the airspace.");

      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: 'system',
            content: `You are an AI for air traffic surveillance. You will receive a JSON with data of different aircrafts. Your job is to answer the user query given JSON data. Please answer the question in a text paragraph without bulletpoints or listings. Here is the JSON data: ${JSON.stringify(PlaneData)}`,
          },
          {
            role: 'user',
            content: query,
          }
        ],
        max_tokens: 500,
      });

      setAnswer(response.choices[0].message.content);

      /*
      const updatedViewState = {
        ...viewState,
        latitude: 57.5,
        longitude: 2.2,
        zoom: 7,
      };
      setViewState(updatedViewState); */
    } else {
      // If query is empty, hide the results
      setShowResults(false);
    }
  };

  useEffect(() => {
    const handleKeyPress = async (event) => {
      if (event.keyCode === 106) { // Spacebar key code
        // Set default values when the spacebar is pressed
        setTitle('Automated Notification');
        setAnswer('AVIS has detected a malicious aircraft maneuver. The aircraft has veered outside its designated flight zone. Please investigate immediately.');
        setShowResults(true);

        const response = await fetch('http://johanndiep:9900/api/objects/aircrafts/VRFFederateHandle<5>:1078');
        const aircraft = await response.json();
        const updatedViewState = {
          ...viewState,
          latitude: aircraft.spatial.position.WGS84.latitude+0.5,
          longitude: aircraft.spatial.position.WGS84.longitude,
          zoom: 6,
        };
        setViewState(updatedViewState);
        setCriticalPlaneVisible(true)
      }
    };

    // Add event listener for keydown event
    window.addEventListener('keydown', handleKeyPress);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://johanndiep:9900/api/objects/aircrafts');
        if (!response.ok) {
          throw new Error('Failed to fetch aircraft data');
        }
        const aircrafts = await response.json();
        setPlaneData(aircrafts);
      } catch (error) {
        console.error('Error fetching aircraft data:', error);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 300);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://johanndiep:9900/api/objects/aircrafts/VRFFederateHandle<5>:1078');
        if (!response.ok) {
          throw new Error('Failed to fetch aircraft data');
        }
        const aircraft = await response.json();
        setCriticialPlaneData([aircraft]);
      } catch (error) {
        console.error('Error fetching aircraft data:', error);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 100);

    return () => clearInterval(intervalId);
  }, []);

  const CriticalPlane = new ScatterplotLayer({
    id: 'ScatterplotLayer',
    data: CriticalPlaneData,
    getPosition: (d) => [d.spatial.position.WGS84.longitude, d.spatial.position.WGS84.latitude],
    getRadius: 20,
    getFillColor: [255, 100, 100],
    radiusScale: 1000,
  });

  const Planes = new ScenegraphLayer({
    id: "PlanesLayer",
    data: PlaneData,
    getPosition: (d) => [d.spatial.position.WGS84.longitude, d.spatial.position.WGS84.latitude],
    getOrientation: (d) => {
      const rollECEF = d.spatial.orientation.phi * (180 / Math.PI);
      const pitchECEF = d.spatial.orientation.psi * (180 / Math.PI);
      const yawECEF = d.spatial.orientation.theta * (180 / Math.PI);
      
      const rotationMatrix = computeLocalTangentPlaneRotationMatrix(d.spatial.position.WGS84.latitude, d.spatial.position.WGS84.longitude);
      const [roll, pitch, yaw] = applyRotationMatrix(rotationMatrix, [rollECEF, pitchECEF, yawECEF]);

      return [0, 180+yaw, 90];
    },
    scenegraph: "./models/Plane.glb",
    sizeScale: 250,
  });

  const Checkpoints = new GeoJsonLayer({
    id: "CheckpointsLayer",
    data: CheckpointData as any,
    pointRadiusMinPixels: 3,
    getFillColor: [169, 169, 169]
  });
  /*
  const MultiLineStringLayer = new GeoJsonLayer({
    id: 'MultiLineStringLayer',
    data: CheckpointData as any,
    getLineColor: [255, 255, 255, 50],
    lineWidthMinPixels: 0.5,
  }); */

  return (
    <DeckGL
      layers={criticalPlaneVisible ? [CriticalPlane, Planes] : [Planes]}
      initialViewState={viewState}
      controller={true}
    >
      <Map reuseMaps mapStyle={mapStyle} />
      <div
        style={{
          width: "100vw",
          background: "rgba(255, 255, 255, 0.5)",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1vw 1vw",
        }}
      >
        <div>
          <img
            src="data/avis_logo.svg"
            alt="AVIS logo"
            style={{ width: "7vw", height: "auto" }}
          />
        </div>
        <div style={{ maxWidth: "40vw", flex: "1", marginLeft: "1vw" }}>
          <Input placeholder="Start interrogating the air traffic simulation with AVIS." 
            value={query}
            onChange={handleInputChange}
          />
        </div>
        <Tooltip>
          <Button
            type="primary"
            shape="circle"
            icon={<SearchOutlined />}
            style={{ marginLeft: "1vw" }}
            onClick={handleSearch}
          />
        </Tooltip>
      </div>
      <div
        style={{
          width: "100vw",
          background: "rgba(255, 255, 255, 0.6)",
          padding: "1vw 1vw",
          display: "flex",
          justifyContent: "center",
          visibility: showResults ? "visible" : "hidden",
          borderBottom: "3px solid red"
        }}
      >
        <Button
          type="text"
          icon={<UpSquareOutlined />}
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '80px',
            left: '50vw',
            color: '#000',
            zIndex: '1',
          }}
        />
        <List
          itemLayout="horizontal"
          dataSource={[{ title, answer }]}
          style={{ width: "40vw" }}
          renderItem={(item, index) => (
            <List.Item>
              <List.Item.Meta
                title={item.title}
                description={item.answer.split('\n').map((line, idx) => (
                  <React.Fragment key={idx}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              />
            </List.Item>
          )}
        />
      </div>
    </DeckGL>
  );
}

export function renderToDOM(container: HTMLDivElement) {
  createRoot(container).render(<App />);
}
