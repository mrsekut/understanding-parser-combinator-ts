import assert from 'assert';
// import { p } from '../src/parsimon';
import P from 'parsimmon';

describe('understanding parsimmon', () => {
  // it('result', () => {
  //   console.log(p.parse.tryParse('[hoge]is[hoge]'));
  //   // console.log(p.parse.tryParse('ooo'));
  //   // console.log(p.parse.tryParse('[hoge]is[hoge]'));
  //   // console.log(p.others.tryParse('aaaaa'));
  // });

  it('result', () => {
    // console.log(p.parse.tryParse('(hoge)is(hoge◆)'));
    // console.log(p.parse.tryParse('( hoge ) is (piyo hoge)'));
    // console.log(p.parse.tryParse('( hoge ) is (piyo (hoge)'));
  });
});

export const p = P.createLanguage({
  parse: r => P.alt(r.inner, r.outside).many(),

  // outside
  outside: () => P.regexp(/[^(]+/),

  // inner
  lpran: () => P.string('('),
  rparen: () => P.string(')'),
  inner: r => r.lpran.then(P.regexp(/[^)]+/)).skip(r.rparen).node('bra'),
});

// types
type Node =
  | { _tag: 'inner'; value: string }
  | { _tag: 'outside'; value: string };

// test cases
const c1Input = '(hoge)is(hoge◆)';
const c1: Node[] = [
  { _tag: 'inner', value: 'hoge' },
  { _tag: 'outside', value: 'is' },
  { _tag: 'inner', value: 'hoge◆' },
];

const c2Input = '( hoge ) is (piyo hoge)';
const c2: Node[] = [
  { _tag: 'inner', value: ' hoge ' },
  { _tag: 'outside', value: ' is ' },
  { _tag: 'inner', value: 'piyo hoge' },
];

const c3Input = '( hoge ) is (piyo (hoge)';
const c3: Node[] = [
  { _tag: 'inner', value: ' hoge ' },
  { _tag: 'outside', value: ' is (piyo ' },
  { _tag: 'inner', value: 'hoge' },
];

const c4Input = '((hoge) sss)';
const c4: Node[] = [
  { _tag: 'inner', value: ' hoge ' },
  { _tag: 'outside', value: ' is (piyo ' },
  { _tag: 'inner', value: 'hoge' },
];

// ex.
// console.log(p.parse.tryParse(c1Input)); // == c1
// console.log(p.parse.tryParse(c2Input)); // == c2
// console.log(p.parse.tryParse(c3Input)); // == c3
console.log(p.parse.tryParse(c4Input)); // == c3
