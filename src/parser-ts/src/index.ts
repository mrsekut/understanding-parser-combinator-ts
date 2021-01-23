import * as O from 'fp-ts/Option';

import * as C from 'parser-ts/lib/char';
import * as S from 'parser-ts/lib/string';
import * as P from 'parser-ts/lib/Parser';

import { pipe } from 'fp-ts/lib/pipeable';

export const brackets = P.between(C.char('['), C.char(']'));

type F = (...args: any[]) => any;
type Args = any;
const rec = (f: F) => (...args: Args[]) =>
  f((...args: Args[]) => rec(f)(...args), ...args);

rec((f, n) => (n > 1 ? n * f(n - 1) : n))(6);

// export const doubleQuotedString: P.Parser<string, String> = P.surroundedBy(C.char('"'))(
//   P.many(P.either(S.string('\\"'), () => C.notChar('"')))
// )

const a = P.optional(P.lookAhead(brackets(P.item())));
const aa = () => P.succeed('');

export const fff = (s2: string): P.Parser<string, string> =>
  // const fff: (s2: string) => P.Parser<string, string> = s2 =>
  pipe(
    P.optional(brackets(P.item())),
    P.chain(a =>
      pipe(
        a,
        O.fold(
          () => P.succeed(''),
          c =>
            pipe(
              fff(c),
              P.chain(() => P.succeed(c)),
            ),
        ),
      ),
    ),
  );

// const _string: (s2: string) => P.Parser<C.Char, string> = s2 =>
//   pipe(
//     charAt(0, s2),
//     O.fold(
//       () => P.succeed(''),
//       c =>
//         pipe(
//           C.char(c),
//           P.chain(() => _string(s2.slice(1))),
//           P.chain(() => P.succeed(s)),
//         ),
//     ),
//   );

// https://anatoo.hatenablog.com/entry/2015/04/26/220026
type R = () => any;
type T = any;
type P = any;

const lazy = (callback: () => R): ((target: T, position: P) => R) => {
  let parse: (target?: T, position?: P) => R;
  return (target: T, position: P) => {
    if (parse == null) {
      parse = callback();
    }
    return parse(target, position);
  };
};
