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

// Define the hashtable of the military aircrafts as well as the
export const airplaneClasses = {
  'VRFFederateHandle<3>:121': 'Friendly',
  'VRFFederateHandle<3>:210': 'Friendly',
  'VRFFederateHandle<3>:213': 'Friendly',
  'VRFFederateHandle<3>:186': 'Friendly',
  'VRFFederateHandle<3>:189': 'Friendly',
  'VRFFederateHandle<3>:191': 'Friendly',
  'VRFFederateHandle<3>:217': 'Friendly',
  'VRFFederateHandle<3>:164': 'Friendly',
  'VRFFederateHandle<3>:218': 'Friendly',
  'VRFFederateHandle<3>:107': 'Friendly',
  'VRFFederateHandle<3>:166': 'Friendly',
  'VRFFederateHandle<3>:22': 'Friendly',
  'VRFFederateHandle<3>:220': 'Friendly',
  'VRFFederateHandle<3>:14': 'Friendly',
  'VRFFederateHandle<3>:111': 'Friendly',
  'VRFFederateHandle<3>:17': 'Friendly',
  'VRFFederateHandle<3>:112': 'Friendly',
  'VRFFederateHandle<3>:141': 'Friendly',
  'VRFFederateHandle<3>:170': 'Friendly',
  'VRFFederateHandle<3>:113': 'Friendly',
  'VRFFederateHandle<3>:143': 'Friendly',
  'VRFFederateHandle<3>:200': 'Friendly',
  'VRFFederateHandle<3>:144': 'Friendly',
  'VRFFederateHandle<3>:201': 'Friendly',
  'VRFFederateHandle<3>:177': 'Friendly',
  'VRFFederateHandle<3>:205': 'Friendly',
  'VRFFederateHandle<3>:149': 'Friendly',
  'VRFFederateHandle<3>:178': 'Friendly',
  'VRFFederateHandle<3>:15': 'Friendly',
  'VRFFederateHandle<3>:179': 'Friendly',
}
