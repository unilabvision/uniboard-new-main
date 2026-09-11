import { parsePrice } from './parsePrice';
import { parseVimeoUrl, normalizeVimeoHash, toVimeoApiIdentifier } from './vimeoUrl';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(parsePrice('1.234,56') === 1234.56, 'TR thousands+decimal');
assert(parsePrice('1,234.56') === 1234.56, 'EN thousands+decimal');
assert(parsePrice('99,90') === 99.9, 'TR decimal comma');
assert(parsePrice('99.90') === 99.9, 'EN decimal');
assert(parsePrice('') === null, 'empty');
assert(parsePrice('abc') === 'invalid', 'invalid');

const unlisted = parseVimeoUrl('https://vimeo.com/123456789/abcdef12');
assert(!!unlisted && unlisted.vimeoId === '123456789', 'parse id');
assert(!!unlisted && unlisted.vimeoHash === 'abcdef12', 'parse path hash');

const q = parseVimeoUrl('https://player.vimeo.com/video/123?h=zzhash');
assert(!!q && q.vimeoHash === 'zzhash', 'query hash');

assert(normalizeVimeoHash('123', '123') === null, 'reject id-as-hash');
assert(toVimeoApiIdentifier('123', 'ab') === '123:ab', 'api id:hash');

console.log('parsePrice + vimeoUrl selfcheck OK');
