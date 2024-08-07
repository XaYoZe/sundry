import { ColRow } from "./recursive-descent-parser";

export interface Location extends Range {
  filePath: string;
}

export interface Range {
  start: ColRow;
  end: ColRow;
}
