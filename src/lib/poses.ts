export interface Joints {
  head: [number, number];
  neck: [number, number];
  hip: [number, number];
  shoulder: [number, number];
  elbow: [number, number];
  hand: [number, number];
  knee: [number, number];
  foot: [number, number];
  knee2?: [number, number];
  foot2?: [number, number];
}

export type PoseKey = keyof typeof POSES;

// Fixed segment lengths (viewBox 0-100) so every pose shares the same body
// proportions — this is what makes joint angles comparable across poses.
const TRUNK = 27;
const HEAD_GAP = 7;
const THIGH = 19;
const SHANK = 18;
const UPPER_ARM = 12;
const FOREARM = 12;

// Angle convention: 0deg = right (+x), 90deg = down (+y), clockwise positive.
// Standing neutral: trunk=270 (straight up), thigh/shank=90 (straight down),
// arm=90 (straight down). Forward flexion rotates legs/arms toward 0deg and
// rotates the trunk toward 360/0deg (lean forward). This lets every pose's
// joint angles be checked against standard ROM ranges (hip flexion 0-120deg,
// knee flexion 0-135deg, shoulder flexion 0-180deg, elbow flexion 0-145deg).
function dir(angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [Math.cos(rad), Math.sin(rad)];
}

// Rounded to avoid SSR/CSR hydration mismatches: Math.cos/sin can differ by
// 1 ULP between the server's and browser's JS engine builds, and React
// treats that as a markup mismatch.
function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function extend(from: [number, number], angleDeg: number, len: number): [number, number] {
  const [dx, dy] = dir(angleDeg);
  return [round(from[0] + dx * len), round(from[1] + dy * len)];
}

interface PoseSpec {
  hip: [number, number];
  trunk: number;
  thigh: number;
  shank: number;
  thigh2?: number;
  shank2?: number;
  upperArm: number;
  forearm: number;
  // Angle the head continues at from the neck — defaults to the trunk's own
  // angle (head simply continues the trunk line). Override only to show
  // neck flexion/extension (e.g. cat/cow head tuck vs. lift) without
  // disconnecting the head from the neck.
  headAngle?: number;
}

function buildPose(spec: PoseSpec): Joints {
  const { hip, trunk, thigh, shank, thigh2, shank2, upperArm, forearm, headAngle } = spec;
  const neck = extend(hip, trunk, TRUNK);
  const head = extend(neck, headAngle ?? trunk, HEAD_GAP);
  const shoulder = neck;
  const elbow = extend(shoulder, upperArm, UPPER_ARM);
  const hand = extend(elbow, forearm, FOREARM);
  const knee = extend(hip, thigh, THIGH);
  const foot = extend(knee, shank, SHANK);

  const joints: Joints = { head, neck, hip, shoulder, elbow, hand, knee, foot };
  if (thigh2 != null && shank2 != null) {
    const knee2 = extend(hip, thigh2, THIGH);
    joints.knee2 = knee2;
    joints.foot2 = extend(knee2, shank2, SHANK);
  }
  return joints;
}

export const POSES = {
  // Neutral standing: 0deg flexion everywhere.
  STANDING: buildPose({
    hip: [50, 55],
    trunk: 270,
    thigh: 90,
    shank: 90,
    upperArm: 95,
    forearm: 80,
  }),
  // Shoulder flexion ~150deg (high overhead raise), elbow extended.
  STANDING_ARMS_UP: buildPose({
    hip: [50, 55],
    trunk: 270,
    thigh: 90,
    shank: 90,
    upperArm: 300,
    forearm: 300,
  }),
  // Hip flexion ~105deg, knee flexion ~125deg, ~30deg forward trunk lean —
  // matches a bodyweight squat at depth (thighs near parallel to floor).
  SQUAT_DOWN: buildPose({
    hip: [50, 60],
    trunk: 300,
    thigh: 15,
    shank: 140,
    thigh2: 25,
    shank2: 130,
    upperArm: 40,
    forearm: 30,
  }),
  // Front leg: hip flexion ~90deg, knee flexion ~95deg (thigh ~parallel to
  // floor). Back leg: slight hip extension, knee flexion ~95deg (low lunge).
  LUNGE: buildPose({
    hip: [48, 58],
    trunk: 285,
    thigh: 15,
    shank: 110,
    thigh2: 110,
    shank2: 195,
    upperArm: 70,
    forearm: 60,
  }),
  // Prone, neutral hip/knee extension (straight body line). For a prone pose
  // the leg must extend AWAY from the head through the hip — i.e. opposite
  // the trunk angle (0deg = trunk's 180deg - 180) — not the same angle, or
  // the knee/foot land back on top of the torso instead of past the hip.
  // ~95deg shoulder flexion supporting on forearms, ~90deg elbow flexion.
  PLANK: buildPose({
    hip: [58, 53],
    trunk: 180,
    thigh: 0,
    shank: 0,
    upperArm: 95,
    forearm: 180,
  }),
  // Knee push-up, bottom: hip stays almost fully extended (thigh close to
  // the straight-leg 0deg reference, dipping slightly to bring the knee
  // down to the floor while the hip/shoulders stay elevated), then the
  // shin breaks away to lie flat on the floor behind the knee — knees stay
  // down throughout, unlike a full PLANK/push-up where the legs stay
  // straight to the feet. Elbow flexion ~95deg at the bottom.
  PUSHUP_DOWN: buildPose({
    hip: [58, 55],
    trunk: 180,
    thigh: 75,
    shank: 0,
    upperArm: 110,
    forearm: 15,
  }),
  // Same kneeling base, arms straighter (elbow flexion ~20deg) at the top.
  KNEELING_PUSHUP_UP: buildPose({
    hip: [58, 55],
    trunk: 180,
    thigh: 75,
    shank: 0,
    upperArm: 95,
    forearm: 30,
  }),
  // Supine, knees bent ~90deg with feet planted, hips on the floor. The arm
  // angle is deliberately offset from the trunk so it reads as a separate
  // limb resting beside the body instead of overlapping the torso line.
  BRIDGE_DOWN: buildPose({
    hip: [50, 75],
    trunk: 180,
    thigh: 315,
    shank: 75,
    upperArm: 155,
    forearm: 155,
  }),
  // Hips driven up into extension (glute bridge top) — trunk tilts so the
  // shoulders stay grounded while the hip lifts, and the foot stays planted
  // near where it was in BRIDGE_DOWN rather than lifting off with the hip.
  BRIDGE_UP: buildPose({
    hip: [50, 60],
    trunk: 146,
    thigh: 340,
    shank: 85,
    upperArm: 170,
    forearm: 170,
  }),
  // Quadruped: hips over knees (thigh ~vertical down to the ground), shins
  // flat on the floor behind the knee, arms vertical under the shoulders.
  // Head tucks down/in (cervical + thoracic flexion).
  CAT_ROUND: buildPose({
    hip: [58, 42],
    trunk: 180,
    thigh: 90,
    shank: 0,
    upperArm: 90,
    forearm: 90,
    headAngle: 130,
  }),
  // Same quadruped base, head/chest lift (cervical + thoracic extension).
  CAT_ARCH: buildPose({
    hip: [58, 42],
    trunk: 180,
    thigh: 90,
    shank: 0,
    upperArm: 90,
    forearm: 90,
    headAngle: 230,
  }),
  // Running stride, phase A: lead leg knee driven up above hip height
  // (thigh angle past straight-up, not just "forward" — forward-only
  // angles can swing the thigh ahead of the body but can never lift the
  // knee above the hip), with the lower leg tucked back toward the glute
  // (knee flexion ~100deg). Trail leg in hip extension toe-off. The visible
  // arm swings opposite the lead leg's phase (contralateral coordination —
  // the arm on the same side as a forward-driving leg swings backward).
  RUN_STEP_A: buildPose({
    hip: [50, 55],
    trunk: 285,
    thigh: 320,
    shank: 200,
    thigh2: 130,
    shank2: 165,
    upperArm: 150,
    forearm: 130,
  }),
  // Opposite phase of the running stride (mirrors thigh/thigh2 and arm swing).
  RUN_STEP_B: buildPose({
    hip: [50, 55],
    trunk: 285,
    thigh: 130,
    shank: 165,
    thigh2: 320,
    shank2: 200,
    upperArm: 30,
    forearm: 50,
  }),
  // Seated, hips flexed ~90deg, knees flexed ~110-120deg, hands resting on
  // the knees.
  SEATED_BREATHE: buildPose({
    hip: [50, 65],
    trunk: 270,
    thigh: 350,
    shank: 110,
    upperArm: 110,
    forearm: 30,
  }),
  // Foam-roller release: seated on the floor, torso reclined ~50deg and
  // propped on both straight arms behind the hips, legs extended forward
  // with the roller under the thighs/hamstrings and the knees bent ~110deg
  // so the feet hover clear of the floor.
  FOAM_ROLL: buildPose({
    hip: [50, 70],
    trunk: 220,
    thigh: 350,
    shank: 100,
    upperArm: 58,
    forearm: 58,
  }),
  // Standing hip hinge, hips flexed ~100deg, knees kept straight (0deg),
  // arms hanging toward the floor under gravity.
  FORWARD_FOLD: buildPose({
    hip: [50, 45],
    trunk: 10,
    thigh: 90,
    shank: 90,
    upperArm: 95,
    forearm: 90,
  }),
  // Flat-footed standing, ankle neutral.
  CALF_RAISE_DOWN: buildPose({
    hip: [50, 56],
    trunk: 270,
    thigh: 90,
    shank: 90,
    upperArm: 95,
    forearm: 80,
  }),
  // Same stance, whole body raised slightly (heel/ankle plantarflexion).
  CALF_RAISE_UP: buildPose({
    hip: [50, 51],
    trunk: 270,
    thigh: 90,
    shank: 90,
    upperArm: 95,
    forearm: 80,
  }),
  // Forearm-plank base with the lead knee driven toward the chest
  // (hip flexion ~120deg, knee flexion ~110deg, knee pulled up toward the
  // chest); trailing leg stays extended at the 0deg straight-leg reference
  // (opposite the trunk angle, same fix as PLANK above).
  MOUNTAIN_CLIMBER_A: buildPose({
    hip: [58, 53],
    trunk: 180,
    thigh: 260,
    shank: 115,
    thigh2: 0,
    shank2: 0,
    upperArm: 95,
    forearm: 180,
  }),
  // Alternate leg driven forward (crossfades with A for the running motion).
  MOUNTAIN_CLIMBER_B: buildPose({
    hip: [58, 53],
    trunk: 180,
    thigh: 0,
    shank: 0,
    thigh2: 260,
    shank2: 115,
    upperArm: 95,
    forearm: 180,
  }),
  // Supine tabletop: hip and knee both flexed ~90deg, one arm reaching
  // overhead (shoulder flexion ~150deg).
  DEADBUG: buildPose({
    hip: [45, 35],
    trunk: 180,
    thigh: 300,
    shank: 30,
    upperArm: 250,
    forearm: 250,
  }),
  // Gait-like stepping motion onto a raised step: lead leg hip flexion
  // ~110deg, knee flexion ~110deg; trailing leg extending behind.
  WALK_STAIRS: buildPose({
    hip: [48, 55],
    trunk: 280,
    thigh: 20,
    shank: 130,
    thigh2: 120,
    shank2: 170,
    upperArm: 60,
    forearm: 40,
  }),
  // Prone (face down), legs straight along the floor (0deg, opposite the
  // trunk angle — same fix as PLANK above), arm resting forward — start
  // position for a prone Y/T/W shoulder-extension raise.
  PRONE_ARM_DOWN: buildPose({
    hip: [58, 53],
    trunk: 180,
    thigh: 0,
    shank: 0,
    upperArm: 165,
    forearm: 165,
  }),
  // Same prone base, arm raised off the floor (shoulder extension ~110deg)
  // for the top of the Y/T/W raise.
  PRONE_ARM_UP: buildPose({
    hip: [58, 53],
    trunk: 180,
    thigh: 0,
    shank: 0,
    upperArm: 250,
    forearm: 250,
  }),
} satisfies Record<string, Joints>;
