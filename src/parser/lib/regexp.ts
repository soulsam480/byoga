// * Common RegExp that can be used irrespective of banks

// ? === UPI spend ===
export const FOOD_RE =
  /^food\s(?<tag_cat>\w+)|(?<tag>food|fod|fpod|foos|dood|fruit|coffe|lunch|dinner|juice|sweets|curd|chicken|mutton|milk|egg|coke|coconut|choco[a-z]+|iron\shill|swiggy|zomato)/i

export const BIKE_RE =
  /^bike\s(?<tag_cat>\w+)|(?<tag>bike|motorcycle|suzuki|parking|balaklava)/i

export const DOMESTIC_SPEND_RE =
  /^house\s(?<tag_cat>\w+)|(?<tag>house|rent|water|warer|service|fiber|cutlery|DTH|airtel|jio|recharge|station[ae]ry|filter|puja|murthy)/i

export const DEPOSIT_RE = /(?<tag>RD|SBI|[Dd]eposit|Zerodha|SIP|LIC|Lic|lic)/

export const ONLINE_SHOPPING_RE = /(?<tag>amazon|flipkart|online|order)/i

export const PETROL_RE = /(?<tag>petrol|fuel|pretol)/i

export const GROCERY_RE =
  /^grocery\s(?<tag_cat>\w+)|(?<tag>grocery|vegetable|bag|polythene)/i

export const TRANSPORT_RE =
  /(?<tag>transport|taxi|bus|fare|cab|uber|rapido|cleartrip)/i

export const MEDICAL_RE =
  /^medical\s(?<tag_cat>\w+)|(?<tag>medicine|medical|health|check up)/i

export const ENTERTAINMENT_RE = /(?<tag>film|haikyuu)/i

export const MERCHANT_PAYMENT_RE =
  /(?<tag>merchant|UPIIntent|PhonePe|Razorpay|BharatPe|FEDERAL\sEASYPAYMENTS|[Oo]nline|[Pp]ayment|[Tt]ransaction|UPI|[Cc]collect|request|[Pp]ay\s[Tt]o|DYNAMICQR|YESB)/

export const AUTOPAY_RE = /(?<tag>autopay|mandate)/i

export const PERSONAL_RE =
  /(?:(?:personal|shopping)\s(?<tag_cat>\w+))?(?<tag>clothes|decathlon|slipper|clothing|shopping|allowance|stuff)/i

export const CASH_TRANSFER_RE =
  /^transfer\s(?<tag_cat>\w+)|(?<tag>atm\scash|cash|transfer|refund|lend)/i

// ? === Auto payment ===

export const NACH_RE = /(?<tag>indian\sclearing\scorp)/i

// ? === transfer ===
export const SALARY_RE = /(?<tag>rzpx\sprivate)/i
