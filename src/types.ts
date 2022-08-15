type Axis = 0 | 1 | -1;
export type Direction = [Axis, Axis];
export type ControllerStorage<ElementType extends HTMLElement> = {
  [prop: string]: ElementType;
};
export type STATE = "INITIAL" | "PLAYING" | "FINISHED";
