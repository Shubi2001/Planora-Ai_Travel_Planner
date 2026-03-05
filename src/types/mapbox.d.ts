// Stub types for @mapbox/point-geometry to prevent TS2688
declare module "@mapbox/point-geometry" {
  class Point {
    x: number;
    y: number;
    constructor(x: number, y: number);
  }
  export = Point;
}
