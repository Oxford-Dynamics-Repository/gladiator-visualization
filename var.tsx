/* 
  Oxford Dynamics - May 2024

  This script contains multiple global variables.
*/

import OpenAI from 'openai'
import { FlyToInterpolator } from '@deck.gl/core'
import * as config from './config.json'

// OpenAI instance initialization
export const openai = new OpenAI({
  apiKey: config.apiKey,
  dangerouslyAllowBrowser: true,
})

// Map style URL
export const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json'

// Initial view state for the map
export const INITIAL_VIEW_STATE = {
  latitude: 56.5,
  longitude: -0.7,
  zoom: 5,
  transitionDuration: 2000,
  transitionInterpolator: new FlyToInterpolator(),
}

// Flight zone coordinates
export const FLIGHT_ZONE = [
  [-1.5, 56.3],
  [1.4, 56.7],
  [3.4, 55.5],
  [0.1, 54.2],
]
