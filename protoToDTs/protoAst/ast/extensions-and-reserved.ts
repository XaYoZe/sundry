import { Span, Token } from "../parser/recursive-descent-parser";
import { StatementBase } from "./index";
import { Comma, IntLit, Keyword, Semi, StrLit } from "./lexical-elements";

export type Node =
  | Extensions
  | Ranges
  | Range
  | Max
  | Reserved
  | FieldNames;

export interface Extensions extends StatementBase {
  type: "extensions";
  keyword: Keyword;
  ranges: Ranges;
  semi: Semi;
}

export interface Ranges extends Span {
  type: "ranges";
  rangeOrCommas: (Range | Comma)[];
}

export interface Range extends Span {
  type: "range";
  rangeStart: IntLit;
  to?: Keyword;
  rangeEnd?: IntLit | Max;
}

export interface Max extends Token {
  type: "max";
}

export interface Reserved extends StatementBase {
  type: "reserved";
  keyword: Keyword;
  reserved: Ranges | FieldNames;
  semi: Semi;
}

export interface FieldNames extends Span {
  type: "field-names";
  strLitOrCommas: (StrLit | Comma)[];
}
