/* 
  Oxford Dynamics - May 2024

  This script contains multiple helper functions.
*/

import { airplaneClasses } from './var.tsx'

/*
  Function to compute ray casting to determine if a point is inside a polygon.
  Works within a small region, otherwise require spherical interpolation.

  Inputs:
   - point: The point to be tested represented as [x, y].
   - polygon: The polygon represented as an array of vertices.

  Returns:
   - A boolean indicating whether the point is inside the polygon (true) or outside (false).
*/
export function computeRayCasting(point: any, polygon: any) {
  const x = point[0]
  const y = point[1]

  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]
    const yi = polygon[i][1]
    const xj = polygon[j][0]
    const yj = polygon[j][1]

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }
  return inside
}

/*
  Function to check the class of an airplane name.

  Inputs:
   - airplaneName: The name of the airplane to be checked.

  Returns:
   - A string indicating the class of the airplane:
     - "Friendly" if the airplane belongs to the class "Friendly".
     - "None" if the airplane name is not found in the hashtable.
*/
export function checkAirplaneClass(airplane: any) {
  if (airplane.forceIdentifier == "Friendly") {
    return false
  } else {
    return true
  }
}
