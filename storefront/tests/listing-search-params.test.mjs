import assert from 'node:assert/strict';
import test from 'node:test';
import { parseListingSearchParams, buildListingSearchParams, listingKey } from '../src/lib/utils/listing-search-params.ts';
test('accepts digit-only bounds including zero, leading zeros and maximum safe integer', () => {
  for(const [text,value] of [['0',0],['0012',12],['9007199254740991',Number.MAX_SAFE_INTEGER]]) {
    const parsed=parseListingSearchParams(new URLSearchParams({price_min:text,price_max:text}));
    assert.deepEqual(parsed.filters,{optionValues:[],priceMin:value,priceMax:value});
  }
});
test('rejects all malformed bounds including final newline and unsafe overflow', () => {
  for(const text of ['12px','1.5','-1','+1',' 12','12 ','12\n','12\r\n','1e2','0x10','','Infinity','9007199254740992']) {
    const parsed=parseListingSearchParams(new URLSearchParams({price_min:text,price_max:text,option:'red',sort:'price'}));
    assert.deepEqual(parsed.filters,{optionValues:['red'],sortBy:'price'},JSON.stringify(text));
  }
});
test('server object params use the first bound and retain repeated options and trimmed query', () => {
  const parsed=parseListingSearchParams({price_min:['12px','8'],price_max:['99','100'],option:['red','blue'],q:' shoes '});
  assert.equal(parsed.query,'shoes'); assert.deepEqual(parsed.filters,{optionValues:['red','blue'],priceMax:99});
});
test('valid listing state round-trips while unrelated repeated URL params survive', () => {
  const state={query:'new shoes',filters:{optionValues:['blue','red'],priceMin:0,priceMax:200,sortBy:'price'}};
  const url=buildListingSearchParams(new URLSearchParams('campaign=a&campaign=b&price_min=bad&option=old'),state);
  assert.deepEqual(url.getAll('campaign'),['a','b']); assert.deepEqual(url.getAll('option'),['blue','red']);
  const parsed=parseListingSearchParams(url); assert.deepEqual(parsed,state); assert.equal(listingKey(parsed),listingKey(state));
});
test('missing or invalid minimum does not remove an independently valid zero maximum', () => {
  assert.deepEqual(parseListingSearchParams({}).filters,{optionValues:[]});
  assert.deepEqual(parseListingSearchParams({price_min:'bad',price_max:'0'}).filters,{optionValues:[],priceMax:0});
});
