import assert from 'assert';

import * as E from 'fp-ts/Either';

import * as C from 'parser-ts/lib/char';
import * as P from 'parser-ts/lib/Parser';
import { run } from 'parser-ts/lib/code-frame';

describe('understanding parser-ts', () => {
  it('result', () => {
    // `a,b,c`の1つ以上の連続から始まればok
    const parser1 = C.char('a');
    const parser2 = C.char('b');
    const parser3 = C.char('c');
    const either = P.either(parser1, () => P.either(parser2, () => parser3));
    const parser = P.many1(either); // = P.many1(C.oneOf('abc'))

    assert(E.isRight(run(parser, 'a')));
    assert(E.isRight(run(parser, 'ab')));
    assert(E.isRight(run(parser, 'ax')));

    assert(E.isRight(run(parser, 'abc')));
    assert(E.isRight(run(parser, 'abcx')));

    assert(E.isLeft(run(parser, 'x')));
  });
  // it('brackets', () => {
  //   const parser = brackets(C.char('a'));
  //   const parsed = run(parser, '[a]');
  //   assert(E.isRight(parsed));
  //   const expected = 'a';
  //   assert.deepStrictEqual(parsed.right, expected);
  // });
  // NOTE: 最終2でやりたいこと
  // it('cut', () => {
  //   const parser1 = C.char('a');
  //   const parser2 = C.char('b');
  //   const parser3 = C.char('c');
  //   const parser = P.many(parser1);
  //   assert(E.isRight(run(parser, '[ab]')));
  //   assert(E.isRight(run(parser, '[[oo] [oo]]')));
  //   assert(E.isRight(run(parser, '[[oo] oo]')));
  //   assert(E.isLeft(run(parser, '[oooo')));
  //   assert(E.isLeft(run(parser, 'oooo]')));
  // });
});
