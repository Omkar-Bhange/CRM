const fs = require('fs');

const content = fs.readFileSync('backend/admin.js', 'utf8');

const hookMatches = content.match(/productSale(Item)?Schema\.(pre|post|virtual|method|static|query)[^;]+/g);
console.log('Hooks/methods on productSaleSchema or productSaleItemSchema:');
console.log(hookMatches || 'NONE');

// Also check if ProductSale has any direct statics attached: ProductSale.myStatic = ...
const staticMatches = content.match(/ProductSale\.[a-zA-Z0-9_]+\s*=\s*function/g);
console.log('Direct function assignments to ProductSale:');
console.log(staticMatches || 'NONE');

