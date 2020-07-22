The intent for this project is to build a real-time map tool for DnD.

There are two main aspects: play and map design. Ideally, we want both to be real-time.

There should be two view modes: DM and player

```typescript
interface IGame {

}

interface IWorld {
  maps: Array<{
    name: string;
    transform: ITransform;
    map: IMap;
  }>
}

interface ITransform {
  scale: number;
  x: number;
  y: number;
}

type ISVG = string;

interface IMap {
  size: { width: number; height: number; };
  layers: Array<{
    name: string;
    // transform: ITransform;
    svg: ISVG;
  }>;
}

// how do we want to render everything?
// I have been thinking as an SVG, but I feel like that might make compositing more difficult.
// It should make it much easier to interact with though (using event listeners)
// However, I do like the readability of SVG.
// let's look at how it would work if we did use SVG
```

```svg
<svg id="world">
  <svg id="map-1">
    <svg id="map"/>
    <svg id="gm-tokens"/>
    <svg id="player-tokens"/>
    <svg id="fog-of-war"/>
    <svg id="scratch"/>
  </svg>

  <svg id="map-1">
  </svg>

  <svg id="map-1">
  </svg>
</svg>
```

The tricky part is distributing the state across clients. Do we serialize and distribute SVG? Or, do we serialize the objects, then re-render on the client?

I think, for the sake of control, we probably want to serialize objects and re-render on the clients.
