import React from "react";
import { createRoot } from "react-dom/client";
import { Map } from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { ScenegraphLayer, GeoJsonLayer } from "deck.gl";
import PlaneData from "./data/Planes.json";
import CheckpointData from "./data/Checkpoints.json";
import { Input, Tooltip, Button, Avatar, List } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const INITIAL_VIEW_STATE = {
  latitude: 56,
  longitude: -0.5,
  zoom: 6.5,
};

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

const data = [
  {
    title: "Are there any malicious airplanes?",
  },
];

export default function App({
  mapStyle = MAP_STYLE,
  initialViewState = INITIAL_VIEW_STATE,
}) {
  const Planes = new ScenegraphLayer({
    id: "PlanesLayer",
    data: PlaneData,
    getPosition: (d) => d.coordinates,
    getOrientation: (d) => [0, Math.random() * 180, 90],
    scenegraph: "./models/Plane.glb",
    sizeScale: 150,
  });

  const Checkpoints = new GeoJsonLayer({
    id: "CheckpointsLayer",
    data: CheckpointData as any,
    pointRadiusMinPixels: 4,
    getFillColor: [220, 220, 220],
  });

  return (
    <DeckGL
      layers={[Planes, Checkpoints]}
      initialViewState={initialViewState}
      controller={true}
    >
      <Map reuseMaps mapStyle={mapStyle} />
      <div
        style={{
          width: "100%",
          background: "rgba(0, 0, 0, 0.3)",
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
            style={{ width: "5vw", height: "auto" }}
          />
        </div>
        <div style={{ maxWidth: "50vw", flex: "1", marginLeft: "1vw" }}>
          <Input placeholder="Please provide your query for interrogating the air traffic simulation with AVIS." />
        </div>
        <Tooltip>
          <Button
            type="primary"
            shape="circle"
            icon={<SearchOutlined />}
            style={{ marginLeft: "1vw" }}
          />
        </Tooltip>
      </div>
      <div
        style={{
          width: "100%",
          background: "rgba(255, 255, 255, 0.6)",
          padding: "1vw 1vw",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <List
          itemLayout="horizontal"
          dataSource={data}
          style={{ width: "40vw" }}
          renderItem={(item, index) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    src={`https://api.dicebear.com/8.x/icons/svg?icon=compass&backgroundColor=292929`}
                  />
                }
                title={item.title}
                description="Currently, our radar screens show no signs of any malicious airplanes in the vicinity. Airspace appears clear and secure at this time. We'll continue to monitor closely for any unexpected or unauthorized aircraft activity."
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
