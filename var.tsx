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
  transitionDuration: 500,
  transitionInterpolator: new FlyToInterpolator(),
}

// Flight zone coordinates
export const FLIGHT_ZONE = [
  [0.652, 56.2561667],
  [2.0296667, 55.8078333],
  [1.3736667, 54.3936667],
  [-1.0413333, 55.0528333],
  [-1.0841667, 55.072],
  [-1.107, 55.1425],
  [-1.1536667, 55.2058333],
  [-1.2166667, 55.2586667],
  [-1.2766667, 55.295],
  [-1.3353333, 55.3221667],
  [-1.5758333, 55.2695],
  [-1.6833333, 55.2405],
  [-1.708, 55.2341667],
  [-2.513, 55.4978333],
  [-2.703, 55.6578333],
  [-2.6625, 56.0228333],
  [-2.8738333, 56.2213333],
  [-2.767, 56.6316667],
  [-2.5163333, 56.8288333],
  [0.652, 56.2561667],
]