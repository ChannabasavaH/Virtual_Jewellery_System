/* ==========================================================================
   Virtual Jewellery Wearable System - Jewellery Positioning & Transformation Engine
   ========================================================================== */

/**
 * Facial Landmark Indices for MediaPipe 468 FaceMesh:
 * - Chin tip: 152
 * - Forehead top hairline: 10
 * - Between eyebrows (Glabella/Bindi area): 9
 * - Nose tip: 1
 * - Nose bridge: 168
 * - Left Nostril edge: 240 / 102
 * - Right Nostril edge: 460 / 331
 * - Left Cheek/Jaw edge (near ear): 234
 * - Right Cheek/Jaw edge (near ear): 454
 * - Jaw bottom left: 172
 * - Jaw bottom right: 397
 * - Left Eye outer corner: 33
 * - Right Eye outer corner: 263
 */

const LANDMARKS = {
  CHIN: 152,
  FOREHEAD: 10,
  GLABELLA: 9,
  NOSE_TIP: 1,
  NOSE_BRIDGE: 168,
  LEFT_NOSTRIL: 240,
  RIGHT_NOSTRIL: 460,
  LEFT_EAR: -234,
  RIGHT_EAR: 454,
  JAW_LEFT: 172,
  JAW_RIGHT: 397,
  LEFT_EYE: 33,
  RIGHT_EYE: 263
};

/**
 * Calculate Euclidean distance between two 2D points (x, y normalized or pixels)
 */
function getDistance(p1, p2, width = 1, height = 1) {
  const dx = (p1.x - p2.x) * width;
  const dy = (p1.y - p2.y) * height;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate head roll angle (z-rotation angle in radians) from landmark points
 */
function getHeadRollAngle(landmarks) {
  const leftEye = landmarks[LANDMARKS.LEFT_EYE];
  const rightEye = landmarks[LANDMARKS.RIGHT_EYE];
  return Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
}

/**
 * Convert normalized landmark coordinate (0..1) to canvas pixel coordinates (0..w, 0..h)
 */
function toCanvasCoords(landmark, canvasWidth, canvasHeight) {
  return {
    x: landmark.x * canvasWidth,
    y: landmark.y * canvasHeight
  };
}

/**
 * Calculate positioning parameters for BINDI
 * @param {Array} landmarks 
 * @param {number} width 
 * @param {number} height 
 * @param {object} itemConfig 
 */
function calculateBindiPosition(landmarks, width, height, itemConfig) {
  const glabella = toCanvasCoords(landmarks[LANDMARKS.GLABELLA], width, height);
  const eyeDistance = getDistance(landmarks[LANDMARKS.LEFT_EYE], landmarks[LANDMARKS.RIGHT_EYE], width, height);

  const scale = eyeDistance * (itemConfig.scaleFactor || 0.16);
  const angle = getHeadRollAngle(landmarks);

  return {
    x: glabella.x + (itemConfig.offsetX || 0) * eyeDistance,
    y: glabella.y + (itemConfig.offsetY || 0) * eyeDistance,
    width: scale,
    height: scale,
    angle: angle
  };
}

/**
 * Calculate positioning parameters for TIKKA
 * @param {Array} landmarks 
 * @param {number} width 
 * @param {number} height 
 * @param {object} itemConfig 
 */
function calculateTikkaPosition(landmarks, width, height, itemConfig) {
  const forehead = toCanvasCoords(landmarks[LANDMARKS.FOREHEAD], width, height);
  const glabella = toCanvasCoords(landmarks[LANDMARKS.GLABELLA], width, height);
  const faceHeight = getDistance(landmarks[LANDMARKS.FOREHEAD], landmarks[LANDMARKS.CHIN], width, height);

  const scale = faceHeight * (itemConfig.scaleFactor || 0.5);
  const angle = getHeadRollAngle(landmarks);

  // Position tikka hanging down from forehead hairline towards eyebrows
  const centerX = (forehead.x + glabella.x) / 2;
  const centerY = (forehead.y + glabella.y) / 2;

  return {
    x: centerX,
    y: centerY + (itemConfig.offsetY || 0) * faceHeight,
    width: scale * 0.55,
    height: scale,
    angle: angle
  };
}

/**
 * Calculate positioning parameters for NOSE RING
 * @param {Array} landmarks 
 * @param {number} width 
 * @param {number} height 
 * @param {object} itemConfig 
 */
function calculateNoseRingPosition(landmarks, width, height, itemConfig) {
  const nostril = toCanvasCoords(landmarks[LANDMARKS.LEFT_NOSTRIL] || landmarks[LANDMARKS.NOSE_TIP], width, height);
  const faceWidth = getDistance(landmarks[LANDMARKS.LEFT_EAR], landmarks[LANDMARKS.RIGHT_EAR], width, height);

  const scale = faceWidth * (itemConfig.scaleFactor || 0.25);
  const angle = getHeadRollAngle(landmarks);

  return {
    x: nostril.x + (itemConfig.offsetX || 0) * faceWidth,
    y: nostril.y + (itemConfig.offsetY || 0) * faceWidth,
    width: scale,
    height: scale,
    angle: angle
  };
}

/**
 * Calculate positioning parameters for EARRINGS (Left & Right pair)
 * @param {Array} landmarks 
 * @param {number} width 
 * @param {number} height 
 * @param {object} itemConfig 
 */
function calculateEarringPosition(landmarks, width, height, itemConfig) {
  const leftEar = toCanvasCoords(landmarks[LANDMARKS.LEFT_EAR], width, height);
  const rightEar = toCanvasCoords(landmarks[LANDMARKS.RIGHT_EAR], width, height);
  const faceWidth = getDistance(landmarks[LANDMARKS.LEFT_EAR], landmarks[LANDMARKS.RIGHT_EAR], width, height);
  const faceHeight = getDistance(landmarks[LANDMARKS.FOREHEAD], landmarks[LANDMARKS.CHIN], width, height);

  const scaleWidth = faceWidth * (itemConfig.scaleFactor || 0.4);
  const scaleHeight = scaleWidth * 1.5;
  const angle = getHeadRollAngle(landmarks);

  // Offset downwards from ear anchor
  const yOffset = faceHeight * 0.08;

  return {
    left: {
      x: leftEar.x,
      y: leftEar.y + yOffset,
      width: scaleWidth,
      height: scaleHeight,
      angle: angle,
      flipHorizontal: false
    },
    right: {
      x: rightEar.x,
      y: rightEar.y + yOffset,
      width: scaleWidth,
      height: scaleHeight,
      angle: angle,
      flipHorizontal: true // Flip horizontally for natural mirror look
    }
  };
}

/**
 * Calculate positioning parameters for NECKLACE
 * @param {Array} landmarks 
 * @param {number} width 
 * @param {number} height 
 * @param {object} itemConfig 
 */
function calculateNecklacePosition(landmarks, width, height, itemConfig) {
  const chin = toCanvasCoords(landmarks[LANDMARKS.CHIN], width, height);
  const jawWidth = getDistance(landmarks[LANDMARKS.JAW_LEFT], landmarks[LANDMARKS.JAW_RIGHT], width, height);
  const faceHeight = getDistance(landmarks[LANDMARKS.FOREHEAD], landmarks[LANDMARKS.CHIN], width, height);

  const scaleWidth = jawWidth * (itemConfig.scaleFactor || 1.6);
  const scaleHeight = scaleWidth * 0.62;
  const angle = getHeadRollAngle(landmarks);

  // Position necklace below chin tip
  const necklaceCenterY = chin.y + (itemConfig.offsetY || 0.5) * faceHeight;

  return {
    x: chin.x,
    y: necklaceCenterY,
    width: scaleWidth,
    height: scaleHeight,
    angle: angle
  };
}
