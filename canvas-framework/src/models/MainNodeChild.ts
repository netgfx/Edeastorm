import { MainNodeItemInterface } from "../interfaces/canvasInterfaces";

export class MainNodeChild implements MainNodeItemInterface {
  id: string;
  x: number;
  y: number;
  metadata?: any;
  [key: string]: any;

  constructor(id: string, x: number, y: number, metadata?: any) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.metadata = metadata;
  }

  // Method to convert the class instance to a plain object
  toPlainObject(): Record<string, any> {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      metadata: this.metadata,
    };
  }

  // Static method to create a class instance from a plain object
  static fromPlainObject(obj: Record<string, any>): MainNodeChild {
    const nodeData: MainNodeItemInterface = {
      id: obj.id,
      x: obj.x,
      y: obj.y,
      metadata: obj.metadata,
    };
    return new MainNodeChild(
      nodeData.id,
      nodeData.x,
      nodeData.y,
      nodeData.metadata
    );
  }
}
