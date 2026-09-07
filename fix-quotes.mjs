import fs from 'fs';
const file = 'src/components/InquiryModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// For handleQuotePriceChange
content = content.replace(
  /const handleQuotePriceChange =[\s\S]*?setFormData\(\(prev\) => \(\{ \.\.\.prev, quotes: newQuotes \}\)\);\n  \};/,
  `const handleQuotePriceChange = (quoteIndex: number, valStr: string, currency: CurrencyUnit) => {
    const newQuotes = [...(formData.quotes || [])];
    if (!newQuotes[quoteIndex]) return;

    if (valStr === '') {
      newQuotes[quoteIndex].price1688Rmb = '' as any;
    } else {
      if (currency === 'USD') {
        newQuotes[quoteIndex].price1688Rmb = Number((Number(valStr) * exchangeRates.USD_TO_RMB).toFixed(6)) as any;
      } else {
        newQuotes[quoteIndex].price1688Rmb = valStr as any;
      }
    }
    setFormData((prev) => ({ ...prev, quotes: newQuotes }));
  };`
);

// For handleQuoteShippingChange
content = content.replace(
  /const handleQuoteShippingChange =[\s\S]*?setFormData\(\(prev\) => \(\{ \.\.\.prev, quotes: newQuotes \}\)\);\n  \};/,
  `const handleQuoteShippingChange = (quoteIndex: number, valStr: string, currency: CurrencyUnit) => {
    const newQuotes = [...(formData.quotes || [])];
    if (!newQuotes[quoteIndex]) return;

    if (valStr === '') {
      newQuotes[quoteIndex].domesticShippingRmb = '' as any;
    } else {
      if (currency === 'USD') {
        newQuotes[quoteIndex].domesticShippingRmb = Number((Number(valStr) * exchangeRates.USD_TO_RMB).toFixed(6)) as any;
      } else {
        newQuotes[quoteIndex].domesticShippingRmb = valStr as any;
      }
    }
    setFormData((prev) => ({ ...prev, quotes: newQuotes }));
  };`
);

fs.writeFileSync(file, content);
