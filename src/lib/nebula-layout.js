const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

export function getNebulaRadius(nodesCount, options = {}) {
  const { minimumRadius = 3.8, nodeSpacing = 0.6 } = options
  const safeCount = Math.max(1, Math.floor(nodesCount))
  return Math.max(minimumRadius, Math.sqrt(safeCount) * nodeSpacing)
}

export function generateNebulaLayout(nodesCount = 0, options = {}) {
  const count = Math.max(0, Math.floor(nodesCount))
  if (count === 0) return []
  if (count === 1) return [[0, 0, 0]]

  const radius = getNebulaRadius(count, options)
  const positions = new Array(count)

  for (let index = 0; index < count; index += 1) {
    const y = 1 - (2 * (index + 0.5)) / count
    const ringRadius = Math.sqrt(1 - y * y)
    const theta = GOLDEN_ANGLE * index
    const depthLayer = 0.92 + (((index * 0.61803398875) % 1) * 0.16)

    positions[index] = [
      Math.cos(theta) * ringRadius * radius * depthLayer,
      y * radius,
      Math.sin(theta) * ringRadius * radius * depthLayer,
    ]
  }

  const center = positions.reduce(
    (sum, position) => [sum[0] + position[0], sum[1] + position[1], sum[2] + position[2]],
    [0, 0, 0],
  ).map((value) => value / count)

  return positions.map((position) => [
    position[0] - center[0],
    position[1] - center[1],
    position[2] - center[2],
  ])
}

export function getCameraFlightDestination(targetPosition, cameraPosition, distance = 2.7) {
  const target = targetPosition.map(Number)
  const camera = cameraPosition.map(Number)
  let direction = [camera[0] - target[0], camera[1] - target[1], camera[2] - target[2]]
  let directionLength = Math.hypot(...direction)

  if (!Number.isFinite(directionLength) || directionLength < 0.001) {
    direction = [0, 0, 1]
    directionLength = 1
  }

  return [
    target[0] + (direction[0] / directionLength) * distance,
    target[1] + (direction[1] / directionLength) * distance + 0.16,
    target[2] + (direction[2] / directionLength) * distance,
  ]
}
