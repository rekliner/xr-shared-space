import { create } from "zustand"

export interface xrModeState {
  xrMode: "OFF" | "VR" | "AR"
  setXRMode: (mode: "OFF" | "VR" | "AR") => void
}

export const useXRStore = create<xrModeState>((set) => ({
  xrMode: "OFF",
  setXRMode: (mode) => set({ xrMode: mode }),
}))

const xrButtonIdxs = {
  trigger: 0,
  grip: 1,
  menu: 2,
  hat: 3,
  AX: 4,
  BY: 5,
  dunno: 6, //quest2 controller reports it but I don't know what it is
}
const defaultHand = "right" as "left" | "right"
export interface xrButtonsState {
  trigger: number
  grip: number
  AX: number
  BY: number
  //menu: number  //not accessible in WebXR
  hat: number
}
export interface xrControllerButtonState {
  left: xrButtonsState
  right: xrButtonsState
  updateButton: (key: keyof xrButtonsState, value: number, hand?: keyof xrControllerButtonState) => void
  updateButtons: (currentButtons: readonly GamepadButton[], hand?: keyof xrControllerButtonState) => void
  isChanged: (currentButtons: readonly GamepadButton[], hand?: keyof xrControllerButtonState) => boolean
  buttonsChanged: (currentButtons: readonly GamepadButton[], hand?: keyof xrControllerButtonState) => [string, number][]
}

export const useXRButtonStore = create<xrControllerButtonState>((set, get) => ({
  left: {
    trigger: 0,
    grip: 0,
    AX: 0,
    BY: 0,
    hat: 0,
  },
  right: {
    trigger: 0,
    grip: 0,
    AX: 0,
    BY: 0,
    hat: 0,
  },
  updateButton: (key, value, hand = defaultHand as keyof xrControllerButtonState) => {
    set({ [hand]: { ...get()[hand], [key]: value } }, false)
  },
  updateButtons: (currentButtons, hand = defaultHand as keyof xrControllerButtonState) => {
    //todo: update the entire object at once
    Object.entries(xrButtonIdxs).forEach((c) => {
      set({ [hand]: { ...get()[hand], [c[0]]: currentButtons[c[1] as number]?.value } }, false)
    })
  },
  isChanged: (currentButtons, hand = defaultHand as keyof xrControllerButtonState) => {
    return Object.entries(xrButtonIdxs).reduce((p, c) => {
      return (
        p ||
        (typeof (get()[hand as keyof xrControllerButtonState] as xrButtonsState) != "undefined" &&
          typeof (get()[hand as keyof xrControllerButtonState] as xrButtonsState)[c[0] as keyof xrButtonsState] !=
            "undefined" &&
          currentButtons[c[1] as number]?.value !=
            (get()[hand as keyof xrControllerButtonState] as xrButtonsState)[c[0] as keyof xrButtonsState])
      )
    }, false)
  },
  buttonsChanged: (currentButtons, hand = defaultHand as keyof xrControllerButtonState) => {
    let keyArray = [] as [string, number][]
    Object.entries(xrButtonIdxs).forEach((c) => {
      if (
        typeof currentButtons[c[1] as number]?.value != "undefined" &&
        typeof (get()[hand as keyof xrControllerButtonState] as xrButtonsState) != "undefined" &&
        typeof (get()[hand as keyof xrControllerButtonState] as xrButtonsState)[c[0] as keyof xrButtonsState] !=
          "undefined" &&
        currentButtons[c[1] as number]?.value !=
          (get()[hand as keyof xrControllerButtonState] as xrButtonsState)[c[0] as keyof xrButtonsState]
      ) {
        get().updateButton(c[0] as keyof xrButtonsState, currentButtons[c[1] as number]?.value, hand)
        keyArray.push([c[0], currentButtons[c[1] as number]?.value])
      }
    })
    return keyArray
  },
}))
