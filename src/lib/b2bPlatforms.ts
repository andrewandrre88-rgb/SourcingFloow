export interface B2BPlatform {
  id: string;
  name: string;
  shortName: string;
  domainPattern: RegExp;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  exampleUrl: string;
  description: string;
}

export const CHINESE_B2B_PLATFORMS: B2BPlatform[] = [
  {
    id: '1688',
    name: '1688.com (阿里巴巴国内站)',
    shortName: '1688',
    domainPattern: /1688\.com/i,
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    badgeBorder: 'border-orange-200',
    dotColor: 'bg-orange-500',
    exampleUrl: 'https://detail.1688.com/offer/...',
    description: 'China Wholesale & Factory Direct (Alibaba 1688)',
  },
  {
    id: 'made_in_china',
    name: 'Made-in-China.com (中国制造网)',
    shortName: 'Made-in-China',
    domainPattern: /made-in-china\.com/i,
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700',
    badgeBorder: 'border-red-200',
    dotColor: 'bg-red-500',
    exampleUrl: 'https://www.made-in-china.com/...',
    description: 'B2B Sourcing for Global Buyers',
  },
  {
    id: 'yiwugo',
    name: 'Yiwugo.com (义乌购)',
    shortName: 'Yiwugo',
    domainPattern: /yiwugo\.com/i,
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    dotColor: 'bg-blue-500',
    exampleUrl: 'https://www.yiwugo.com/product/detail/...',
    description: 'Yiwu International Trade Market Official Site',
  },
  {
    id: 'alibaba',
    name: 'Alibaba.com (阿里巴巴国际站)',
    shortName: 'Alibaba',
    domainPattern: /alibaba\.com/i,
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-500',
    exampleUrl: 'https://www.alibaba.com/product-detail/...',
    description: 'Global Wholesale & Sourcing Hub',
  },
  {
    id: 'taobao_tmall',
    name: 'Taobao / Tmall (淘宝/天猫)',
    shortName: 'Taobao',
    domainPattern: /(taobao|tmall)\.com/i,
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    dotColor: 'bg-rose-500',
    exampleUrl: 'https://item.taobao.com/item.htm?...',
    description: 'Retail & Small-Batch Wholesale Sourcing',
  },
  {
    id: 'globalsources',
    name: 'Global Sources (环球资源)',
    shortName: 'Global Sources',
    domainPattern: /globalsources\.com/i,
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    exampleUrl: 'https://www.globalsources.com/...',
    description: 'International Trade & Verified Suppliers',
  },
  {
    id: 'pinduoduo',
    name: 'Pinduoduo / Yangkeduo (拼多多)',
    shortName: 'Pinduoduo',
    domainPattern: /(pinduoduo|yangkeduo)\.com/i,
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-600',
    badgeBorder: 'border-red-200',
    dotColor: 'bg-red-500',
    exampleUrl: 'https://mobile.yangkeduo.com/goods.html?...',
    description: 'Ultra-low cost factory direct items',
  },
  {
    id: 'jd',
    name: 'JD.com (京东商城)',
    shortName: 'JD.com',
    domainPattern: /jd\.com/i,
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700',
    badgeBorder: 'border-red-200',
    dotColor: 'bg-red-600',
    exampleUrl: 'https://item.jd.com/...',
    description: 'High Quality Verified Sourcing',
  },
  {
    id: 'baidu_b2b',
    name: 'Baidu Aicaigou (百度爱采购)',
    shortName: 'Baidu B2B',
    domainPattern: /b2b\.baidu\.com/i,
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    dotColor: 'bg-indigo-500',
    exampleUrl: 'https://b2b.baidu.com/...',
    description: 'Baidu B2B Industrial Sourcing Directory',
  },
  {
    id: 'hc360',
    name: 'HC360 (慧聪网)',
    shortName: 'HC360',
    domainPattern: /hc360\.com/i,
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
    dotColor: 'bg-sky-500',
    exampleUrl: 'https://b2b.hc360.com/...',
    description: 'Industrial & Wholesale B2B Portal',
  },
];

export function detectB2BPlatform(url?: string): B2BPlatform {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return {
      id: 'b2b',
      name: 'Chinese B2B / Wholesale Platform',
      shortName: 'B2B Sourcing',
      domainPattern: /.*/,
      badgeBg: 'bg-slate-50',
      badgeText: 'text-slate-600',
      badgeBorder: 'border-slate-200',
      dotColor: 'bg-slate-400',
      exampleUrl: 'https://...',
      description: 'Chinese B2B, Factory or Wholesale Supplier',
    };
  }

  const clean = url.trim().toLowerCase();
  for (const plat of CHINESE_B2B_PLATFORMS) {
    if (plat.domainPattern.test(clean)) {
      return plat;
    }
  }

  return {
    id: 'custom_b2b',
    name: 'Direct Factory / B2B Supplier',
    shortName: 'Direct B2B',
    domainPattern: /.*/,
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    dotColor: 'bg-indigo-500',
    exampleUrl: 'https://...',
    description: 'Direct Factory Website or Wholesale Link',
  };
}
