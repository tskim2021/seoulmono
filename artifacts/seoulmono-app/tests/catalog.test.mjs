import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCatalog, sellingPrice, availableQuantity, shippingFee } from '../lib/catalog.ts';

test('the live rice response is Japanese and remains 230 yen despite the legacy 570 sale field', () => {
  const data = normalizeCatalog({ item: { it_id: 'rice', it_name: '즉석밥', it_name_ja: '即席ご飯', it_price: 230, it_cust_price: 570, it_sale_price: 570 } });
  assert.equal(data.item.it_name, '即席ご飯');
  assert.equal(sellingPrice(data.item), 230);
  assert.equal(sellingPrice({ ...data.item, option: 'large', option_price: 500 }), 500);
  assert.equal(sellingPrice({ ...data.item, option: 'free', option_price: 0 }), 0);
});
test('a whole home or persisted cart is localized, without dropping IDs or prices', () => {
  const result = normalizeCatalog([{ it_id: '1', it_name: '밥', it_name_ja: 'ご飯', it_price: 230, quantity: 2 }]);
  assert.deepEqual(result, [{ it_id: '1', it_name: 'ご飯', it_name_ja: 'ご飯', it_price: 230, quantity: 2 }]);
});
test('zero stock is unavailable, including options; missing stock is not zero', () => {
  assert.equal(availableQuantity({ it_stock_qty: 0 }), 0);
  assert.equal(availableQuantity({ it_stock_qty: 10 }, { io_stock_qty: 0 }), 0);
  assert.equal(availableQuantity({ it_stock_qty: 10, it_soldout: '2' }), 0);
  assert.equal(availableQuantity({}), 99);
});
test('shipping matches server distinct-product pricing, not quantity or a made-up free threshold', () => {
  const config = { fee: 890, additionalFee: 490 };
  assert.equal(shippingFee([], config), 0);
  assert.equal(shippingFee([{ it_id: 'a', it_price: 50000 }], config), 890);
  assert.equal(shippingFee([{ it_id: 'a', it_price: 230 }, { it_id: 'a', it_price: 280 }], config), 890);
  assert.equal(shippingFee([{ it_id: 'a', it_price: 230 }, { it_id: 'b', it_price: 360 }], config), 1380);
});
