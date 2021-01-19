import assert from 'assert';

import * as M from 'fp-ts/lib/Monoid';
import * as A from 'fp-ts/lib/Array';
import * as E from 'fp-ts/Either';
import * as C from 'parser-ts/lib/char';
import * as S from 'parser-ts/lib/String';
import * as P from 'parser-ts/lib/Parser';
import { run } from 'parser-ts/lib/code-frame';
import { getStructMonoid, Monoid } from 'fp-ts/lib/Monoid';

import { error } from 'parser-ts/lib/ParseResult';
import { stream } from 'parser-ts/lib/Stream';

describe('understanding parser-ts', () => {
  // it('brackets', () => {
  //   const parser = brackets(C.char('a'));
  //   const parsed = run(parser, '[a]');
  //   assert(E.isRight(parsed));
  //   const expected = 'a';
  //   assert.deepStrictEqual(parsed.right, expected);
  // });

  it('brackets2', () => {
    const betweenParens = P.between(C.char('['), C.char(']'))(C.char('a'));
    // const parser = brackets(C.char('a'));
    const parsed = run(betweenParens, '[a');
    assert(E.isLeft(parsed));
    // const expected = 'a';
    // assert.deepStrictEqual(parsed.right, expected);
  });

  it('either2', () => {
    // 一文字目が'a' or 'b' ならok
    const parser = P.either(C.char('a'), () => C.char('b'));

    assert(E.isRight(run(parser, 'a')));
    assert(E.isRight(run(parser, 'b')));
    assert(E.isRight(run(parser, 'ax')));

    assert(E.isLeft(run(parser, 'x')));
    assert(E.isLeft(run(parser, 'xb')));
  });

  it('either3', () => {
    // 一文字目が'a' or 'b' or 'c'ならok
    const parser = P.either(C.char('a'), () =>
      P.either(C.char('b'), () => C.char('c')),
    );

    assert(E.isRight(run(parser, 'a')));
    assert(E.isRight(run(parser, 'b')));
    assert(E.isRight(run(parser, 'c')));
    assert(E.isRight(run(parser, 'cx')));

    assert(E.isLeft(run(parser, 'x')));
    assert(E.isLeft(run(parser, 'xa')));
  });

  it('either with cut', () => {
    // 一文字目が'a'ならok (char('b')は書く意味がない)
    const parser = P.either(P.cut(C.char('a')), () => C.char('b'));

    assert(E.isRight(run(parser, 'a')));
    assert(E.isRight(run(parser, 'ax')));

    assert(E.isLeft(run(parser, 'b')));
  });

  it('either string', () => {
    // `ab` or `c`から始まればok
    const parser = P.either(S.string('ab'), () => C.char('c'));

    assert(E.isRight(run(parser, 'ab')));
    assert(E.isRight(run(parser, 'abx')));
    assert(E.isRight(run(parser, 'cxxx')));

    assert(E.isLeft(run(parser, 'ac')));
    assert(E.isLeft(run(parser, 'xc')));
  });

  it('cut with', () => {
    // `ab`から始まる
    const parser = P.cutWith(C.char('a'), C.char('b'));
    assert(E.isRight(run(parser, 'ab')));
    assert(E.isRight(run(parser, 'abc')));

    assert(E.isLeft(run(parser, 'a')));
    assert(E.isLeft(run(parser, 'ax')));
    assert(E.isLeft(run(parser, 'b')));
    assert(E.isLeft(run(parser, 'bx')));
  });

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

  it('expected', () => {
    // `ab`から始まる
    const parser = P.expected(C.char('a'), 'hogehoge');

    assert(E.isRight(run(parser, 'ax')));

    /**
     * "> 1 | b
     *   | ^ Expected: hogehoge"
     */
    assert(E.isLeft(run(parser, 'b')));
  });

  it('lookAhead', () => {
    const parser = S.fold([
      S.string('a'),
      P.lookAhead(S.string('b')),
      S.string('b'),
    ]);

    assert(E.isRight(run(parser, 'ab')));
    assert(E.isRight(run(parser, 'abb')));

    assert(E.isLeft(run(parser, 'a')));
    assert(E.isLeft(run(parser, 'ax')));
  });

  it('fold', () => {
    // 連結。頭から全て実行
    const parser = S.fold([C.char('a'), C.char('b')]);

    assert(E.isRight(run(parser, 'ab')));
    assert(E.isRight(run(parser, 'abb')));

    assert(E.isLeft(run(parser, 'a')));
    assert(E.isLeft(run(parser, 'b')));
    assert(E.isLeft(run(parser, 'ax')));
  });

  it('sat', () => {
    const parser = P.sat((x: C.Char) => x === 'a');
    assert(E.isRight(run(parser, 'a')));
  });

  it('maybe', () => {
    const parser = P.maybe(M.monoidString)(S.string('ab'));
    assert(E.isRight(run(parser, 'ab')));

    // `''`はstringのmonoid
    assert.deepStrictEqual(run(parser, 'a'), { _tag: 'Right', right: '' });
  });

  it('optional', () => {
    const parser = P.optional(C.char('a'));
    assert(E.isRight(run(parser, 'a')));

    assert(E.isRight(run(parser, 'b')));
    /**
     * このテストの書き方ではわかりづらいが、Some/Noneを返している
     */
    assert.deepStrictEqual(run(parser, 'b'), {
      _tag: 'Right',
      right: { _tag: 'None' },
    });
  });

  it('fold', () => {
    const parser = P.withStart(S.string('ab'));

    // assert(E.isRight(run(parser, 'ab')));
    assert.deepStrictEqual(run(parser, 'ab'), {
      _tag: 'Right',
      right: ['ab', { buffer: ['a', 'b'], cursor: 0 }],
    });
    // assert(E.isRight(run(parser, 'abb')));

    // assert(E.isLeft(run(parser, 'a')));
    // assert(E.isLeft(run(parser, 'b')));
    // assert(E.isLeft(run(parser, 'ax')));
  });

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
