import { ROOM, ROOMS, WALLS, MARKINGS } from "./room";
import { traceSurface, type Point, type SurfacePoint } from "./geometry";
export function drawRoom(ctx: CanvasRenderingContext2D, camera: Point) {
  const fill = (points: SurfacePoint[], color: string) => {
    traceSurface(ctx, points, camera);
    ctx.fillStyle = color;
    ctx.fill();
  };
  for (const room of ROOMS) {
    fill(
      [
        [room.minX, 0, 0],
        [room.maxX, 0, 0],
        [room.maxX, ROOM.height, 0],
        [room.minX, ROOM.height, 0],
      ],
      room.floor,
    );
  }
  fill(
    [
      [0, 0, 0],
      [ROOM.width, 0, 0],
      [ROOM.width, 0, ROOM.wallHeight],
      [0, 0, ROOM.wallHeight],
    ],
    "#19211e",
  );
  fill(
    [
      [0, 0, 0],
      [0, ROOM.height, 0],
      [0, ROOM.height, ROOM.wallHeight],
      [0, 0, ROOM.wallHeight],
    ],
    "#141b19",
  );
  for (const mark of MARKINGS) {
    fill(
      [
        [mark.x, mark.y, 0.015],
        [mark.x + mark.width, mark.y, 0.015],
        [mark.x + mark.width, mark.y + mark.depth, 0.015],
        [mark.x, mark.y + mark.depth, 0.015],
      ],
      mark.color,
    );
  }
  for (const wall of WALLS) {
    fill(
      [
        [wall.position, wall.from, 0],
        [wall.position, wall.to, 0],
        [wall.position, wall.to, ROOM.wallHeight],
        [wall.position, wall.from, ROOM.wallHeight],
      ],
      "#151d1b",
    );
    ctx.strokeStyle = "rgba(100,112,105,.14)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
