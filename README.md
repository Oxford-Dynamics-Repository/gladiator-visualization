This is a minimal standalone version of the ScenegraphLayer example
on [deck.gl](http://deck.gl) website.

### Usage

Copy the content of this folder to your project.

```bash
# install dependencies
npm install
# or
yarn
# bundle and serve the app with vite
npm start
```

### Data source

The 3D model is created by `manilov.ap`, modified for this application.
See [profile page on sketchfab](https://sketchfab.com/3d-models/boeing747-1a75633f5737462ebc1c7879869f6229),
licensed under [Creative Commons](https://creativecommons.org/licenses/by/4.0/).

The real-time flight information is from [Opensky Network](https://opensky-network.org).

To use your own data, check out
the [documentation of ScenegraphLayer](../../../docs/api-reference/mesh-layers/scenegraph-layer.md).

### Basemap

The basemap in this example is provided by [CARTO free basemap service](https://carto.com/basemaps). To use an alternative base map solution, visit [this guide](https://deck.gl/docs/get-started/using-with-map#using-other-basemap-services)


### Database

1. Start with setting up the InfluxDB with
```
docker compose up
```
2. Go to `http://localhost:8086` and log in with:
    - Username = "oxd_user"
    - Passowrd = "51a5cf3f398043f195b9237611e8f2e6"
    - Organisation name = "oxdynamics"
    - Bucket name = "GLADIATOR"

The UI will produce a token -> copy it and pass it to the `/populate` endpoint later

3. Run the API server with: `fastapi dev main.py`
    - The connection should be at `http://127.0.0.1:8000`, if not, use the one given in the INFO messages
4. Run the `/populate` endpoint, which will start collecting data from the PitchRTI server and populate the InfluxDB server. The body param is only one:
    - `token: <token collected in step 2>`
5. Run the `/query` endpoint, which takes 2 timestamps as the boundries of a timeframe and returns the results in that timeframe as a pandas DataFrame. The body params are:
    - `start_time: <ex: "2024-05-08T00:00:00Z">`
    - `stop_time: <ex: "2024-05-08T00:00:00Z">`
    - `token: <token collected in step 2>`
6. Run the `/monitor` endpoint, which checks if any of the initial airplanes are missing, and return a set of the missing planes. Request body is:
    - `token: <token collected in step 2>`