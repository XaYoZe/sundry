import defaultExport from "module-name";
import * as name from "module-name";
import { export1 } from "module-name";
import { export1 as alias1 } from "module-name";
import { default as alias } from "module-name";
import { export1, export2 } from "module-name";/// 單行注釋
import { export1, export2 as alias2, /* … */ } from "module-name";
import { "string name" as alias } from "module-name";
import defaultExport, { export1, /* … */ } from "module-name"; /* 多行注釋  */
/* 多行注釋 /// 單行注釋 */
import defaultExport, * as name from "module-name";
import "module-name";
/// 單行注釋 /* 多行注釋 */

/* 多行注釋 /// 單行注釋 */