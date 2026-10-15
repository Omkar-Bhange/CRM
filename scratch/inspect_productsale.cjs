const fs = require('fs');

const content = fs.readFileSync('backend/admin.js', 'utf8');
const lines = content.split('\n');

console.log('Searching for ProductSale definitions in backend/admin.js:');
lines.forEach((line, idx) => {
  if (line.includes('productSaleItemSchema') || 
      line.includes('productSaleSchema') || 
      line.includes('ProductSale =') ||
      line.includes('ProductSalePayment =') ||
      line.includes('model("ProductSale"') || 
      line.includes('model(\'ProductSale\'') ||
      line.includes('models.ProductSale')) {
    console.log(`${idx + 1}: ${line}`);
  }
});

