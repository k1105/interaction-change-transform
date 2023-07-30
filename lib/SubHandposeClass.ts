import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { Handpose } from "../@types/global";

type Props = {
  indices: number[];
  originId: number;
  rotation?: number;
  position?: Keypoint;
  name?: string;
};

export class SubHandpose {
  indices: number[];
  originId: number;
  rotation: number;
  position: Keypoint;
  name: string;
  sequence: { at: number; position: Keypoint }[];
  prevKeyframeId: number;
  nextKeyframeId: number;
  constructor({
    indices,
    originId,
    rotation = 0,
    position = { x: 0, y: 0 },
    name = "noname",
  }: Props) {
    this.indices = indices;
    this.rotation = rotation;
    this.position = position;
    this.originId = originId;
    this.name = name;
    this.prevKeyframeId = 0;
    this.nextKeyframeId = 1;
    this.sequence = [];
  }

  getKeypoints(handpose: Handpose) {
    const res: Keypoint[] = [];
    for (const id of this.indices) {
      res.push({
        x: handpose[id].x - handpose[this.originId].x,
        y: handpose[id].y - handpose[this.originId].y,
      });
    }

    return res;
  }

  setSequence(sequence: { at: number; position: Keypoint }[]) {
    this.sequence = sequence;
  }

  updatePosition(sec: number) {
    if (this.nextKeyframeId < this.sequence.length) {
      if (sec >= this.sequence[this.nextKeyframeId].at) {
        this.nextKeyframeId++;
        this.prevKeyframeId++;
      }
      if (this.nextKeyframeId < this.sequence.length) {
        //更新直後に実行させたくないという理由だけで55行目と同じ判定をしているのが気持ち悪い
        //quadratic (https://nakamura001.hatenablog.com/entry/20111117/1321539246)
        let t = sec - this.sequence[this.prevKeyframeId].at;
        const b = this.sequence[this.prevKeyframeId].position;
        const c = {
          x:
            this.sequence[this.nextKeyframeId].position.x -
            this.sequence[this.prevKeyframeId].position.x,
          y:
            this.sequence[this.nextKeyframeId].position.y -
            this.sequence[this.prevKeyframeId].position.y,
        };
        const d =
          this.sequence[this.nextKeyframeId].at -
          this.sequence[this.prevKeyframeId].at;
        t /= d / 2;
        if (t < 1) {
          this.position = {
            x: (c.x / 2) * t ** 2 + b.x,
            y: (c.y / 2) * t ** 2 + b.y,
          };
        } else {
          t = t - 1;
          this.position = {
            x: (-c.x / 2) * (t * (t - 2) - 1) + b.x,
            y: (-c.y / 2) * (t * (t - 2) - 1) + b.y,
          };
        }
      }
    }
  }
}
