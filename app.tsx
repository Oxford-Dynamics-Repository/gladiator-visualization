/* 
  Oxford Dynamics - May 2024

  This component represents the main application, integrating various 
  layers and functionalities. It displays an interactive map showing air 
  traffic simulation and allows users to query AI for information.
*/

import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Map } from 'react-map-gl/maplibre'
import DeckGL from '@deck.gl/react'
import { ScenegraphLayer, ScatterplotLayer, GeoJsonLayer } from 'deck.gl'
import { Input, Tooltip, Button, List } from 'antd'
import { SearchOutlined, UpSquareOutlined } from '@ant-design/icons'

import { openai, MAP_STYLE, INITIAL_VIEW_STATE, FLIGHT_ZONE } from './var.tsx'
import { computeRayCasting, checkAirplaneClass } from './utils.tsx'
import Polygon from './data/FlightZone.json'
import Line from './data/CivilianTrajectory.json'

export default function App({
  mapStyle = MAP_STYLE,
  initialViewState = INITIAL_VIEW_STATE,
}) {
  const [PlaneData, setPlaneData] = useState<any>([])
  const [CriticalPlaneData, setCriticialPlaneData] = useState<any>([])
  const [showResults, setShowResults] = useState(false)
  const [viewState, setViewState] = useState(initialViewState)
  const [criticalPlaneVisible, setCriticalPlaneVisible] = useState(false)
  const [query, setQuery] = useState('')
  const [title, setTitle] = useState('')
  const [answer, setAnswer] = useState(
    'Give me a moment to assess the airspace and ' +
      'generate a response towards your query.',
  )

  const handleInput = (event: any) => {
    setQuery(event.target.value)
  }

  const handleClose = () => {
    setShowResults(false)
    setCriticalPlaneVisible(false)
  }

  const handleEnter = (event: any) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSearch = async () => {
    if (query.trim() !== '') {
      setShowResults(true)
      setTitle(query)

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI for air traffic surveillance. ' +
              'You will receive a JSON with data of different aircrafts. ' +
              'Your job is to answer the user query given JSON data. ' +
              'Please answer the question in a text paragraph without bulletpoints or listings. ' +
              'Here is the JSON data:\n' +
              '${JSON.stringify(PlaneData)}',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        max_tokens: 500,
      })

      const messageContent = response.choices[0].message.content
      if (messageContent !== null) {
        setAnswer(messageContent)
      } else {
        setShowResults(false)
      }
    } else {
      setShowResults(false)
    }
  }

  const handleAlert = async () => {
    setShowResults(true)
    setTitle('Automated Notification')
    setAnswer(
      'AVIS has detected a malicious aircraft maneuver. ' +
        'The aircraft has veered outside its designated flight zone. ' +
        'Please investigate immediately.',
    )

    const response = await fetch(
      'http://johanndiep:9900/api/objects/aircrafts/VRFFederateHandle<5>:1078',
    )
    const aircraft = await response.json()

    const updatedViewState = {
      ...viewState,
      latitude: aircraft.spatial.position.WGS84.latitude + 0.5,
      longitude: aircraft.spatial.position.WGS84.longitude,
      zoom: 6,
    }

    setViewState(updatedViewState)
    setCriticalPlaneVisible(true)
  }

  const fetchAircrafts = async () => {
    const response = await fetch('http://localhost:9900/api/objects/aircrafts')

    const aircrafts = await response.json()
    setPlaneData(aircrafts)
  }

  var firstDisplay = true
  const fetchCriticalAircraft = async () => {
    const response = await fetch(
      'http://localhost:9900/api/objects/aircrafts',
    )

    await response.json().then(aircrafts => {
      for (let i = 0; i < aircrafts.length; i++) {
        if (checkAirplaneClass(aircrafts[i])) {
          setCriticialPlaneData([aircrafts[i]])

          const inside = computeRayCasting(
            [
            aircrafts[i].spatial.position.WGS84.longitude,
            aircrafts[i].spatial.position.WGS84.latitude,
            ],
            FLIGHT_ZONE,
          )
        }
      }
    })
    
    /*
    const aircraft = await response.json()
    setCriticialPlaneData([aircraft])

    const inside = computeRayCasting(
      [
        aircraft.spatial.position.WGS84.longitude,
        aircraft.spatial.position.WGS84.latitude,
      ],
      FLIGHT_ZONE,
    )

    if (inside && firstDisplay) {
      handleAlert()
      firstDisplay = false
    }*/
  }

  useEffect(() => {
    fetchAircrafts()
    setInterval(fetchAircrafts, 10)
  }, [])

  useEffect(() => {
    fetchCriticalAircraft()
    setInterval(fetchCriticalAircraft, 100)
  }, [])

  const CriticalPlane = new ScatterplotLayer({
    id: 'CriticalPlaneLayer',
    data: CriticalPlaneData,
    getPosition: (d) => [
      d.spatial.position.WGS84.longitude,
      d.spatial.position.WGS84.latitude,
    ],
    getRadius: 20,
    getFillColor: [255, 100, 100],
    radiusScale: 1000,
  })

  const Planes = new ScenegraphLayer({
    id: 'PlanesLayer',
    data: PlaneData,
    getPosition: (d) => [
      d.spatial.position.WGS84.longitude,
      d.spatial.position.WGS84.latitude,
    ],
    getOrientation: (d) => {
      const roll = d.spatial.orientation.phi * (180 / Math.PI)
      const pitch = d.spatial.orientation.psi * (180 / Math.PI)
      const yaw = d.spatial.orientation.theta * (180 / Math.PI)

      return [yaw + 180, pitch, -90]
    },
    scenegraph: './models/Plane.glb',
    sizeScale: 250,
  })

  const FlightZone = new GeoJsonLayer({
    id: 'FlightZoneLayer',
    data: Polygon,
    lineWidthMinPixels: 1,
    getLineColor: [0, 0, 255, 90],
  })

  const CivilianTrajectory = new GeoJsonLayer({
    id: 'CivilianTrajectoryLayer',
    data: Line,
    lineWidthMinPixels: 1,
    getLineColor: [255, 0, 0, 90],
  })

  return (
    <DeckGL
      layers={
        criticalPlaneVisible
          ? [FlightZone, CivilianTrajectory, CriticalPlane, Planes]
          : [FlightZone, CivilianTrajectory, Planes]
      }
      initialViewState={viewState}
      controller={true}
    >
      <Map reuseMaps mapStyle={mapStyle} />
      <div
        style={{
          width: '100vw',
          background: 'rgba(255, 255, 255, 0.5)',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1vw 1vw',
        }}
      >
        <div>
          <img
            src="data/avis_logo.svg"
            alt="AVIS logo"
            style={{
              width: '7vw',
              height: 'auto',
            }}
          />
        </div>
        <div
          style={{
            maxWidth: '40vw',
            flex: '1',
            marginLeft: '1vw',
          }}
        >
          <Input
            placeholder="Start interrogating the air traffic simulation with AVIS."
            value={query}
            onChange={handleInput}
            onKeyDown={handleEnter}
          />
        </div>
        <Tooltip>
          <Button
            type="primary"
            shape="circle"
            icon={<SearchOutlined />}
            style={{ marginLeft: '1vw' }}
            onClick={handleSearch}
          />
        </Tooltip>
      </div>
      <div
        style={{
          width: '100vw',
          background: 'rgba(255, 255, 255, 0.6)',
          padding: '1vw 1vw',
          display: 'flex',
          justifyContent: 'center',
          visibility: showResults ? 'visible' : 'hidden',
          borderBottom: criticalPlaneVisible
            ? '3px solid rgb(255, 0, 0, 0.6)'
            : '3px solid rgb(0, 0, 255, 0.6)',
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
          style={{ width: '40vw' }}
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
  )
}

export function renderToDOM(container: HTMLDivElement) {
  createRoot(container).render(<App />)
}
