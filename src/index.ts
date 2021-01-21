import * as C from 'parser-ts/lib/char';
import * as P from 'parser-ts/lib/Parser';

export const brackets = P.between(C.char('['), C.char(']'));
