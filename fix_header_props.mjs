import fs from 'fs';
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

const regex = /interface HeaderProps \{[\s\S]*?export const Header/;
const newProps = `interface HeaderProps {
  user: User | null;
  needsAuth: boolean;
  syncState: CloudSyncState;
  exchangeRates: ExchangeRates;
  currencyView: CurrencyViewMode;
  onCurrencyViewChange: (mode: CurrencyViewMode) => void;
  onLogin: () => void;
  onLogout: () => void;
  onSync: () => void;
  onOpenNewModal: () => void;
  onOpenRatesModal: () => void;
  isLoggingIn: boolean;
  currentView: string;
  onSidebarToggle: () => void;
}

export const Header`;

content = content.replace(regex, newProps);

const funcRegex = /export const Header: React\.FC<HeaderProps> = \(\{[\s\S]*?\}\) => \{/;
const newFunc = `export const Header: React.FC<HeaderProps> = ({
  user,
  needsAuth,
  syncState,
  exchangeRates,
  currencyView,
  onCurrencyViewChange,
  onLogin,
  onLogout,
  onSync,
  onOpenNewModal,
  onOpenRatesModal,
  isLoggingIn,
  currentView,
  onSidebarToggle,
}) => {`;

content = content.replace(funcRegex, newFunc);
fs.writeFileSync('src/components/Header.tsx', content);
