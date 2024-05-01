/* 
  Oxford Dynamics - May 2024

  This component represents the main application, integrating various layers and functionalities.
  It displays an interactive map showing air traffic simulation and allows users to query AI for information.
*/

import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Map } from 'react-map-gl/maplibre'
import DeckGL from '@deck.gl/react'
import { FlyToInterpolator } from '@deck.gl/core'
import { ScenegraphLayer, GeoJsonLayer, ScatterplotLayer } from 'deck.gl'
import { Input, Tooltip, Button, Avatar, List } from 'antd'
import { SearchOutlined, UpSquareOutlined } from '@ant-design/icons'
import OpenAI from 'openai'

import {
  computeLocalTangentPlaneRotationMatrix,
  applyRotationMatrix,
} from './utils.tsx'

const openai = new OpenAI({
  apiKey: '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',
  dangerouslyAllowBrowser: true,
})

const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json'

const INITIAL_VIEW_STATE = {
  latitude: 56.5,
  longitude: -0.7,
  zoom: 5,
  transitionDuration: 2000,
  transitionInterpolator: new FlyToInterpolator(),
}

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

  const handleKeyPress = async (event: any) => {
    if (event.keyCode === 106) {
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
  }

  const fetchAircrafts = async () => {
    const response = await fetch('http://johanndiep:9900/api/objects/aircrafts')

    const aircrafts = await response.json()
    setPlaneData(aircrafts)
  }

  const fetchCriticalAircraft = async () => {
    const response = await fetch(
      'http://johanndiep:9900/api/objects/aircrafts/VRFFederateHandle<5>:1078',
    )

    const aircraft = await response.json()
    setCriticialPlaneData([aircraft])
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
  }, [])

  useEffect(() => {
    fetchAircrafts()
    setInterval(fetchAircrafts, 300)
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
      const rollECEF = d.spatial.orientation.phi * (180 / Math.PI)
      const pitchECEF = d.spatial.orientation.psi * (180 / Math.PI)
      const yawECEF = d.spatial.orientation.theta * (180 / Math.PI)

      const rotationMatrix = computeLocalTangentPlaneRotationMatrix(
        d.spatial.position.WGS84.latitude,
        d.spatial.position.WGS84.longitude,
      )
      const [roll, pitch, yaw] = applyRotationMatrix(rotationMatrix, [
        rollECEF,
        pitchECEF,
        yawECEF,
      ])

      return [0, 180 + yaw, 90]
    },
    scenegraph: './models/Plane.glb',
    sizeScale: 250,
  })

  return (
    <DeckGL
      layers={criticalPlaneVisible ? [CriticalPlane, Planes] : [Planes]}
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
