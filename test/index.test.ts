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

  it('fold v.s. seq', () => {
    const num = C.many1(C.digit);
    const op = C.oneOf('+-');
    const fold = S.fold([num, S.many(S.fold([op, num]))]);
    const seq = P.seq(num, () => S.many(P.seq(op, () => num)));

    assert(E.isRight(run(fold, '1+2-3'))); // returned 1+2-3
    assert(E.isRight(run(seq, '1+2-3'))); // returned 23
  });

  it('simple formula', () => {
    const num = C.many1(C.digit);
    const op = C.oneOf('+-');
    const exps = S.fold([num, S.many(S.fold([op, num]))]);

    assert(E.isRight(run(exps, '1')));
    assert(E.isRight(run(exps, '1+2-3')));
  });

  it('formula', () => {
    const num = C.many1(C.digit);
    const parens = P.between(C.char('('), C.char(')'));
    const op = C.oneOf('+-');
    const exps = S.fold([num, S.many(S.fold([op, num]))]);

    assert(E.isRight(run(exps, '1')));
    assert(E.isRight(run(exps, '1+2-3')));
    // console.log('(1+2)');

    // 目標
    // assert.deepStrictEqual(run(exps, '1+(2-3)'), {
    //   _tag: 'Right',
    //   right: {
    //     _tag: '+',
    //     left: { _tag: 'num', num: 1 },
    //     right: {
    //       _tag: '-',
    //       left: { _tag: 'num', num: 2 },
    //       right: { _tag: 'num', num: 3 },
    //     },
    //   },
    // });
  });

  // it('nested brackets', () => {
  //   const g = P.many(C.alphanum);
  //   const b = brackets(g);

  //   // FIXME: 再帰していない。閉じ括弧がなくても成功する
  //   // const parser: P.Parser<string, string[]> = P.either(brackets(parser), () => g);

  //   // const parser = brackets(brackets(g));
  //   // const parser2 = brackets(brackets(brackets(g)));
  //   const parser3 = P.either(b, () => g);

  //   assert(E.isRight(run(parser3, 'hoge')));
  //   assert(E.isRight(run(parser3, '[hoge]')));
  //   // assert(E.isRight(run(parser, '[[hoge]]')));
  //   // assert(E.isRight(run(parser2, '[[[hoge]]]')));

  //   // assert(E.isLeft(run(parser, '[hoge')));

  //   assert(E.isRight(run(fff('hoge'), 'hoge')));
  //   assert(E.isRight(run(fff('hoge'), '[hoge]')));
  //   assert(E.isRight(run(fff('hoge'), '[[hoge]]')));
  //   assert(E.isRight(run(fff('hoge'), '[[hoge')));
  //   assert.deepStrictEqual(run(fff('hoge'), '[[hoge]]'), {
  //     _tag: 'Right',
  //     right: '',
  //   });
  // });

  // it('nested brackets', () => {
  //   const g = S.many(P.item());
  //   const brackets = P.between(C.char('['), C.char(']'));
  //   const parser: P.Parser<string,string> = P.either(
  //     brackets(function () {
  //       return parser;
  //     }),
  //     () => g,
  //   );
  //   // const parser = brackets(brackets(g));
  //   // const parser = brackets(brackets(brackets(g)));

  //   // assert(E.isRight(run(parser, '[]')));
  //   // assert(E.isRight(run(parser, '[hoge]')));
  //   assert(E.isRight(run(parser, '[[h]]')));
  //   // assert(E.isRight(run(parser, '[[hoge]')));
  //   // assert(E.isRight(run(parser, '[hoge]]')));

  //   // assert(E.isLeft(run(parser, '[hoge')));
  // });

  // it('ooo', () => {
  //   // const parser = brackets(P.item());
  //   const parser = P.optional(brackets(P.item()));
  //   const parsed = run(parser, '[h]');
  //   assert(E.isRight(parsed));
  //   console.log(parsed.right);
  // });

  // NOTE: 最終2でやりたいこと;
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
