/* 
  Oxford Dynamics - May 2024

  This script contains multiple helper functions.
*/

/*
  Function to compute the rotation matrix representing the local tangent 
  plane at a given WGS84 coordinate.

  Inputs:
   - latitude: The latitude of the point in degrees.
   - longitude: The longitude of the point in degrees.

  Returns:
   - A 3x3 array representing the rotation matrix for the local tangent plane.
*/
export function computeLocalTangentPlaneRotationMatrix(latitude: number, longitude: number) {
  // Convert latitude and longitude from degrees to radians
  const phi = latitude * (Math.PI / 180)
  const lambda = longitude * (Math.PI / 180)

  // Calculate trigonometric values
  const sinPhi = Math.sin(phi)
  const cosPhi = Math.cos(phi)
  const sinLambda = Math.sin(lambda)
  const cosLambda = Math.cos(lambda)

  // Calculate the elements of the rotation matrix
  const r11 = -sinLambda
  const r12 = -sinPhi * cosLambda
  const r13 = cosPhi * cosLambda
  const r21 = cosLambda
  const r22 = -sinPhi * sinLambda
  const r23 = cosPhi * sinLambda
  const r31 = 0
  const r32 = cosPhi
  const r33 = sinPhi

  // Return the rotation matrix as a 3x3 array
  return [
    [r11, r12, r13],
    [r21, r22, r23],
    [r31, r32, r33],
  ]
}

/*
  Function to apply a rotation matrix to Euler angles.

  Inputs:
   - rotationMatrix: The 3x3 rotation matrix to apply.
   - eulerAngles: An array containing the Euler angles [roll, pitch, yaw]
     in degrees.
   
  Returns:
   - An array containing the rotated Euler angles 
     [rotatedRoll, rotatedPitch, rotatedYaw] in degrees.
*/
export function applyRotationMatrix(rotationMatrix: number[][], eulerAngles: number[]) {
  // Convert Euler angles from degrees to radians
  const [roll, pitch, yaw] = eulerAngles.map((angle) => angle * (Math.PI / 180))

  // Multiply rotation matrix with Euler angles
  const rotatedRoll =
    rotationMatrix[0][0] * roll +
    rotationMatrix[0][1] * pitch +
    rotationMatrix[0][2] * yaw
  const rotatedPitch =
    rotationMatrix[1][0] * roll +
    rotationMatrix[1][1] * pitch +
    rotationMatrix[1][2] * yaw
  const rotatedYaw =
    rotationMatrix[2][0] * roll +
    rotationMatrix[2][1] * pitch +
    rotationMatrix[2][2] * yaw

  // Convert rotated Euler angles from radians to degrees
  const rotatedRollDeg = rotatedRoll * (180 / Math.PI)
  const rotatedPitchDeg = rotatedPitch * (180 / Math.PI)
  const rotatedYawDeg = rotatedYaw * (180 / Math.PI)

  // Return the rotated Euler angles in degrees
  return [rotatedRollDeg, rotatedPitchDeg, rotatedYawDeg]
}

/*
  Function to compute ray tracing to determine if a point is inside a polygon.
  Works within a small region, otherwise require spherical interpolation.

  Inputs:
   - point: The point to be tested represented as [x, y].
   - polygon: The polygon represented as an array of vertices.

  Returns:
   - A boolean indicating whether the point is inside the polygon (true) or outside (false).
*/
export function computeRayTracing(point: any, polygon: any) {
  const x = point[0];
  const y = point[1];

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  return inside;
}