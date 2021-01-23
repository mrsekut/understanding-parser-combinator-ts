import assert from 'assert';
import { normal, parse } from '.';

describe('understanding parsimmon', () => {
  it('result', () => {
    console.log(parse.tryParse('[ hoge ]is[ hoge◆ ]'));
    console.log(parse.tryParse('[ hoge ] is [ piyo hoge ]'));
    console.log(parse.tryParse('[ hoge ] is [piyo [ hoge ]'));
  });
});
