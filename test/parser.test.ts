import assert from 'assert';

import * as M from 'fp-ts/lib/Monoid';
import * as E from 'fp-ts/Either';

import * as C from 'parser-ts/lib/char';
import * as S from 'parser-ts/lib/String';
import * as P from 'parser-ts/lib/Parser';
import { run } from 'parser-ts/lib/code-frame';

describe('Apply', () => {
  it('ap :: p a -> p (a -> b) -> p b', () => {
    /**
     * `p a`のparseを行って、Rightだったらその結果に`a -> b`を適用する
     */
    const parser = P.ap(C.char('a'))(P.of(s => s.length));

    assert(E.isRight(run(parser, 'ax')));
    assert.deepStrictEqual(run(parser, 'a'), {
      _tag: 'Right',
      right: 1,
    });
    // parserとしては、C.char('a')なので、lengthは2ではなく1になる
    assert.deepStrictEqual(run(parser, 'aa'), {
      _tag: 'Right',
      right: 1,
    });

    // parserとしては、C.char('a')なので、'b'ならば失敗する
    assert(E.isLeft(run(parser, 'b')));
  });

  it('apFirst :: f b -> f a -> f a', () => {
    const parser = P.apFirst(S.spaces)(C.char('a'));
    assert(E.isRight(run(parser, 'a ')));
  });

  it('apSecond :: f b -> f a -> f b', () => {
    /**
     * FIXME: 型が同じなのでこの例ではapFirstとの違いが分かりづらい
     */
    const parser = P.apSecond(S.spaces)(C.char('a'));
    assert(E.isRight(run(parser, 'a ')));
  });
});

describe('Monad', () => {
  it('flatten', () => {
    const parser = P.of<string, P.Parser<string, string>>(C.char('a'));
    assert(E.isRight(run(parser, 'a ')));
  });
});

describe('either, cut, ..', () => {
  it('either with 2 parsers', () => {
    // 一文字目が'a' or 'b' ならok
    const parser = P.either(C.char('a'), () => C.char('b'));

    assert(E.isRight(run(parser, 'a')));
    assert(E.isRight(run(parser, 'b')));
    assert(E.isRight(run(parser, 'ax')));

    assert(E.isLeft(run(parser, 'x')));
    assert(E.isLeft(run(parser, 'xb')));
  });

  it('either with 3 parsers', () => {
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
});

describe('maybe and optional', () => {
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
});

describe('understanding parser-ts', () => {
  it('brackets2', () => {
    const betweenParens = P.between(C.char('['), C.char(']'))(C.char('a'));
    // const parser = brackets(C.char('a'));
    const parsed = run(betweenParens, '[a');
    assert(E.isLeft(parsed));
    // const expected = 'a';
    // assert.deepStrictEqual(parsed.right, expected);
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

  it('withStart', () => {
    /**
     * ただpを実行する
     * ただし、返り値にcurosr開始位置の情報を伴う
     */
    const parser = P.withStart(S.string('ab'));

    assert.deepStrictEqual(run(parser, 'ab'), {
      _tag: 'Right',
      right: ['ab', { buffer: ['a', 'b'], cursor: 0 }],
    });
  });
});

describe('constructors', () => {
  it('fail', () => {
    /**
     */
    const parser = P.fail<string>();
    assert(E.isLeft(run(parser, 'aaaa')));
  });

  it('failAt', () => {});

  it('sat', () => {
    /**
     * 引数に述語関数を取る
     * 一文字のみを消化
     */
    const parser = P.sat((x: C.Char) => x === 'a');
    assert(E.isRight(run(parser, 'a')));
  });

  it('succeed', () => {
    /**
     * 何も消費しない
     * 必ず成功する
     * 引数に取った文字列をそのまま返す
     */
    const parser1 = P.succeed<string, string>('a');
    assert.deepStrictEqual(run(parser1, 'xxx'), {
      _tag: 'Right',
      right: 'a',
    });

    const parser2 = P.succeed<string, string>('aaa');
    assert.deepStrictEqual(run(parser2, 'xxx'), {
      _tag: 'Right',
      right: 'aaa',
    });
  });
});
