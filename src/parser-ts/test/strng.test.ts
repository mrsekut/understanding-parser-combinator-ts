import assert from 'assert';

import * as E from 'fp-ts/Either';
import * as C from 'parser-ts/lib/char';
import * as S from 'parser-ts/lib/string';
import { run } from 'parser-ts/lib/code-frame';

describe('fold', () => {
  it('fold', () => {
    /**
     * 連結. 頭から全てを実行する
     */
    const parser = S.fold([C.char('a'), C.char('b')]);

    assert(E.isRight(run(parser, 'ab')));
    assert(E.isRight(run(parser, 'abb')));

    assert(E.isLeft(run(parser, 'a')));
    assert(E.isLeft(run(parser, 'b')));
    assert(E.isLeft(run(parser, 'ax')));
  });
});
