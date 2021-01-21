import assert from 'assert';

import * as E from 'fp-ts/Either';

import * as C from 'parser-ts/lib/char';
import * as S from 'parser-ts/lib/string';
import * as P from 'parser-ts/lib/Parser';
import { run } from 'parser-ts/lib/code-frame';
import { brackets } from '../src';

import { pipe } from 'fp-ts/lib/pipeable';

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

  it('bracket', () => {
    const parser = brackets(P.many(C.alphanum));

    assert(E.isRight(run(parser, '[]')));
    assert(E.isRight(run(parser, '[hoge]')));
    assert(E.isRight(run(parser, '[hoge]]')));

    assert(E.isLeft(run(parser, '[hoge')));
  });

  it('brackets', () => {
    const parser = P.many1(brackets(P.many(C.alphanum)));

    assert(E.isRight(run(parser, '[]')));
    assert(E.isRight(run(parser, '[hoge]')));
    assert(E.isRight(run(parser, '[oo][oo]')));

    assert(E.isLeft(run(parser, '[hoge')));
  });

  it('str with brackets', () => {
    const str = S.many1(C.letter);
    const strWithBrs = brackets(str);
    const strOrStrWithBrs = P.either(strWithBrs, () => str);
    const parser = P.many1(strOrStrWithBrs);

    assert(E.isRight(run(parser, '[hoge]')));
    assert(E.isRight(run(parser, '[This]is[pen]')));
    assert(E.isRight(run(parser, '[oo][oo]')));
  });

  it('str with brackets with map', () => {
    const str = S.many1(C.letter);
    const strWithBrs = brackets(str);
    const strOrStrWithBrs = P.either(strWithBrs, () => str);

    const map = pipe(
      strOrStrWithBrs,
      P.map(s => ({ v: s })),
    );

    const parser = P.many1(map);

    assert.deepStrictEqual(run(parser, '[This]is[pen]'), {
      _tag: 'Right',
      right: [{ v: 'This' }, { v: 'is' }, { v: 'pen' }],
    });
  });
});
