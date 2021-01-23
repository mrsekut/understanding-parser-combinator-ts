import * as O from 'fp-ts/Option';

import * as C from 'parser-ts/lib/char';
import * as S from 'parser-ts/lib/string';
import * as P from 'parser-ts/lib/Parser';

import { pipe } from 'fp-ts/lib/pipeable';

const num = C.many1(C.digit);
const parens = P.between(C.char('('), C.char(')'));
const op = C.oneOf('+-');
const exps = S.fold([num, S.many(S.fold([op, num]))]);

// -------------------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------------------

type Op = '+' | '-';

type Num = { _tag: 'num'; num: number };
type Ast = { _tag: Op; left: Ast; right: Ast } | Num;

// -------------------------------------------------------------------------------------
// Example
// -------------------------------------------------------------------------------------

// 1+(2-3)
const exp: Ast = {
  _tag: '+',
  left: { _tag: 'num', num: 1 },
  right: {
    _tag: '-',
    left: { _tag: 'num', num: 2 },
    right: { _tag: 'num', num: 3 },
  },
};

// 1+(2-(3+4))
