import * as bnb from 'bread-n-butter';

export const normal = bnb.match(/[^\[]+/);

const bracket = <T>(parser: bnb.Parser<T>) =>
  parser.wrap(bnb.text('['), bnb.text(']'));

const brackets = bracket(bnb.match(/[^\]]+/));

export const parse = bnb.choice(normal, brackets).repeat();
