import { create } from "zustand"
import * as THREE from "three"

export interface CalibrationPointTypes {
  leftWallPoint1: THREE.Vector3
  leftWallPoint2: THREE.Vector3
  rightWallPoint1: THREE.Vector3
  rightWallPoint2: THREE.Vector3
  floorPoint: THREE.Vector3
}

export const calibrationPoints = [
  "leftWallPoint1",
  "leftWallPoint2",
  "rightWallPoint1",
  "rightWallPoint2",
  "floorPoint",
] as (keyof CalibrationPointTypes)[]

export interface sharedSpaceState {
  sharedOrigin: THREE.Matrix4
  points: CalibrationPointTypes
  calibrating: boolean
  toggleCalibrating: () => void
  setPoint: (key: keyof CalibrationPointTypes, value: THREE.Vector3) => void
  rightFloorPoint: () => THREE.Vector3
  rightMidPoint: () => THREE.Vector3
  rightPlane: () => THREE.Plane
  leftFloorPoint: () => THREE.Vector3
  leftMidPoint: () => THREE.Vector3
  leftPlane: () => THREE.Plane
  floorPlane: () => THREE.Plane
  sharedOriginPos: () => THREE.Vector3
  sharedOriginRot: () => THREE.Euler
  updateSharedOrigin: () => THREE.Matrix4
}

export const useSharedSpaceStore = create<sharedSpaceState>((set, get) => ({
  sharedOrigin: new THREE.Matrix4(),
  points: {
    rightWallPoint1: new THREE.Vector3(1, 1.1, 0),
    rightWallPoint2: new THREE.Vector3(2, 1.2, 0.01),
    leftWallPoint1: new THREE.Vector3(0, 1.1, -1),
    leftWallPoint2: new THREE.Vector3(0.01, 1.2, -2),
    floorPoint: new THREE.Vector3(1, 0, -1),
  },
  calibrating: true,
  toggleCalibrating: () => set({ calibrating: !get().calibrating }),
  setPoint: (key, value) => {
    set({ points: { ...get().points, [key]: value } })
    get().updateSharedOrigin()
  },
  rightFloorPoint: () =>
    new THREE.Vector3()
      .addVectors(get().points.rightWallPoint1, get().points.rightWallPoint2)
      .multiplyScalar(0.5)
      .setY(get().points.floorPoint.y),
  rightMidPoint: () =>
    new THREE.Vector3()
      .addVectors(
        new THREE.Vector3().addVectors(get().points.rightWallPoint1, get().points.rightWallPoint2),
        get().rightFloorPoint()
      )
      .multiplyScalar(0.33333333),

  rightPlane: () =>
    new THREE.Plane().setFromCoplanarPoints(
      get().points.rightWallPoint1,
      get().points.rightWallPoint2,
      get().rightFloorPoint()
    ),
  leftFloorPoint: () =>
    new THREE.Vector3()
      .addVectors(get().points.leftWallPoint1, get().points.leftWallPoint2)
      .multiplyScalar(0.5)
      .setY(get().points.floorPoint.y),
  leftMidPoint: () =>
    new THREE.Vector3()
      .addVectors(
        new THREE.Vector3().addVectors(get().points.leftWallPoint1, get().points.leftWallPoint2),
        get().leftFloorPoint()
      )
      .multiplyScalar(0.33333333),

  leftPlane: () =>
    new THREE.Plane().setFromCoplanarPoints(
      get().points.leftWallPoint1,
      get().points.leftWallPoint2,
      get().leftFloorPoint()
    ),
  floorPlane: () =>
    new THREE.Plane().setFromCoplanarPoints(get().leftFloorPoint(), get().rightFloorPoint(), get().points.floorPoint),
  sharedOriginPos: () => {
    let pos = new THREE.Vector3()
    get().sharedOrigin.decompose(pos, new THREE.Quaternion(), new THREE.Vector3())
    console.log("pos", pos, get().sharedOrigin)
    return pos
  },
  sharedOriginRot: () => {
    let rot = new THREE.Quaternion()
    get().sharedOrigin.decompose(new THREE.Vector3(), rot, new THREE.Vector3())
    let eul = new THREE.Euler().setFromQuaternion(rot)
    return eul
  },
  updateSharedOrigin: () => {
    let pos = vertIntersectPlanes(get().leftPlane(), get().rightPlane(), get().floorPlane()).clone()
    let rot = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), get().rightPlane().normal)
    let newOrigin = new THREE.Matrix4().makeRotationFromQuaternion(rot).setPosition(pos)
    set({
      sharedOrigin: newOrigin.clone(),
    })
    return newOrigin
  },
}))

function vertIntersectPlanes(p1: THREE.Plane, p2: THREE.Plane, p3: THREE.Plane) {
  let n1 = p1.normal,
    n2 = p2.normal,
    n3 = p3.normal
  let x1 = p1.coplanarPoint(new THREE.Vector3())
  let x2 = p2.coplanarPoint(new THREE.Vector3())
  let x3 = p3.coplanarPoint(new THREE.Vector3())
  let f1 = new THREE.Vector3().crossVectors(n2, n3).multiplyScalar(x1.dot(n1))
  let f2 = new THREE.Vector3().crossVectors(n3, n1).multiplyScalar(x2.dot(n2))
  let f3 = new THREE.Vector3().crossVectors(n1, n2).multiplyScalar(x3.dot(n3))
  let det = new THREE.Matrix3().set(n1.x, n1.y, n1.z, n2.x, n2.y, n2.z, n3.x, n3.y, n3.z).determinant()
  let vectorSum = new THREE.Vector3().add(f1).add(f2).add(f3)
  let planeIntersection = new THREE.Vector3(vectorSum.x / det, vectorSum.y / det, vectorSum.z / det)
  return planeIntersection
}
