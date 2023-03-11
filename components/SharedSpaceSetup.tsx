import { calibrationPoints, useSharedSpaceStore } from "@/library/SharedSpaceStore"
import { useXRButtonStore, useXRStore } from "@/library/XRstore"
import { useRef, useState } from "react"
import * as THREE from "three"
import { useFrame, Vector3 } from "@react-three/fiber"
import { useController, useXR, useXREvent } from "@react-three/xr"
import { Plane, Sphere, Text } from "@react-three/drei"

export const SharedSpaceSetup = () => {
  const [currentCalibrationPoint, setCurrentCalibrationPoint] = useState(calibrationPoints[0])
  const xrMode = useXRStore((state) => state.xrMode)
  const buttons = useXRButtonStore((state) => state)
  const isChanged = useXRButtonStore((state) => state.isChanged)
  const buttonsChanged = useXRButtonStore((state) => state.buttonsChanged)
  const sharedSpace = useSharedSpaceStore((state) => state)
  const toggleCalibrating = useSharedSpaceStore((state) => state.toggleCalibrating)
  const { player } = useXR()
  // const rightPlaneRef = useRef(null as null | THREE.Mesh)
  // const leftPlaneRef = useRef(null as null | THREE.Mesh)
  const controller = useController("right")

  const throttleRef = useRef(0)
  useFrame(() => {
    if (Date.now() - throttleRef.current > 100) {
      throttleRef.current = Date.now()
      if (controller && controller.inputSource.gamepad) {
        const bc = buttonsChanged(controller.inputSource.gamepad.buttons)
        if (bc.length) {
          if (bc.some((b) => b[0] == "hat" && b[1] == 1)) {
            toggleCalibrating()
          }
        }
      }
    }
  })

  useXREvent("selectend", (event) => {
    if (sharedSpace.calibrating) {
      sharedSpace.setPoint(currentCalibrationPoint, event.target.controller.getWorldPosition(new THREE.Vector3()))

      setCurrentCalibrationPoint(
        calibrationPoints[
          (calibrationPoints.findIndex((c) => c == currentCalibrationPoint) + 1) % calibrationPoints.length
        ]
      )

      // if (rightPlaneRef.current && leftPlaneRef.current) {
      //   leftPlaneRef.current?.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), sharedSpace.leftPlane().normal)
      //   leftPlaneRef.current?.position.copy(sharedSpace.leftMidPoint())
      //   rightPlaneRef.current?.quaternion.setFromUnitVectors(
      //     new THREE.Vector3(0, 0, 1),
      //     sharedSpace.rightPlane().normal
      //   )
      //   rightPlaneRef.current?.position.copy(sharedSpace.rightMidPoint())
      //   rightPlaneRef.current.matrixWorldNeedsUpdate = true
      //   leftPlaneRef.current.matrixWorldNeedsUpdate = true
      // }
    }
  })
  return sharedSpace.calibrating ? (
    <>
      {calibrationPoints?.map((p) => (
        <group key={p} position={sharedSpace.points[p as keyof typeof sharedSpace.points]}>
          <Sphere scale={0.05}>
            <meshPhongMaterial color="red" />
          </Sphere>
          <Text
            scale={0.1}
            rotation={[0, Math.PI, 0]}
            position={[0, -0.1, 0]}
            color={currentCalibrationPoint == p ? "red" : "white"}
          >
            {p}
          </Text>
        </group>
      ))}

      {/*
      <group key="rightfloor" position={sharedSpace.rightFloorPoint()}>
        <Sphere scale={0.05}>
          <meshPhongMaterial color="blue" />
        </Sphere>
      </group>

      <group key="rightmid" position={sharedSpace.rightMidPoint()}>
        <Sphere scale={0.05}>
          <meshPhongMaterial color="yellow" />
        </Sphere>
      </group>

      <group key="leftmid" position={sharedSpace.leftMidPoint()}>
        <Sphere scale={0.05}>
          <meshPhongMaterial color="yellow" />
        </Sphere>
      </group>

      <group key="leftfloor" position={sharedSpace.leftFloorPoint()}>
        <Sphere scale={0.05}>
          <meshPhongMaterial color="blue" />
        </Sphere>
      </group>
      <group
        key="intersection"
        position={sharedSpace.sharedOriginPos()}
      >
        <Sphere scale={0.05}>
          <meshPhongMaterial color="orange" />
        </Sphere>
        <Text scale={0.1} position={[0, -0.1, 0]}>
          Intersection
        </Text>
      </group>

      <Plane ref={rightPlaneRef}>
        <meshPhongMaterial color="green" side={THREE.DoubleSide} opacity={0.5} />
      </Plane>
      <Plane ref={leftPlaneRef}>
        <meshPhongMaterial color="purple" side={THREE.DoubleSide} opacity={0.5} />
      </Plane> */}
      <group position={sharedSpace.sharedOriginPos()} rotation={sharedSpace.sharedOriginRot()}>
        <primitive object={new THREE.AxesHelper(2)} position={[0.01, 0.01, -0.01]} scale={[1, 1, -1]} />
        <primitive object={new THREE.GridHelper(6, 30)} position={[3, 0, -3]} />
        <primitive object={new THREE.GridHelper(2, 20)} position={[1, 1, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <primitive object={new THREE.GridHelper(2, 20)} position={[0, 1, -1]} rotation={[0, 0, Math.PI / 2]} />
      </group>
    </>
  ) : null
}
