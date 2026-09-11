import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const insertionPoint = `  useEffect(() => {
    const unsubscribe = initAuth(`;

const handlers = `
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await googleSignIn();
    } catch (error: any) {
      console.error('Login failed:', error);
      setLoginError(error.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleManualSync = async () => {
    if (!user) return;
    setSyncState(prev => ({ ...prev, isSyncing: true }));
    try {
      showToast('Syncing with Cloud Firestore...', 'info');
      setTimeout(() => {
        setSyncState(prev => ({ ...prev, isSyncing: false, lastSyncedAt: new Date().toISOString() }));
      }, 1000);
    } catch (err) {
      console.error(err);
      setSyncState(prev => ({ ...prev, isSyncing: false, error: 'Sync failed' }));
    }
  };

  const handleDeleteRequest = (item: InquiryItem) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const idToDelete = itemToDelete.id;
    setInquiries(prev => prev.filter(i => i.id !== idToDelete));
    setItemToDelete(null);
    if (user && user.uid) {
      try {
        await deleteInquiryFromFirestore(user.uid, idToDelete);
        showToast(\`Deleted inquiry \${itemToDelete.inquiryNumber}\`, 'success');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    setInquiries(prev => prev.map(i => {
      if (i.id === id) {
        const updated = { ...i, orderStatus: status, updatedAt: new Date().toISOString() };
        if (user && user.uid) {
          saveInquiryToFirestore(user.uid, updated).catch(console.error);
        }
        return updated;
      }
      return i;
    }));
  };

  const handleSaveInquiry = async (savedItem: InquiryItem) => {
    setInquiries(prev => {
      const idx = prev.findIndex(i => i.id === savedItem.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedItem;
        return next;
      }
      return [savedItem, ...prev];
    });
    setIsInquiryModalOpen(false);
    setInquiryToEdit(null);
    
    if (user && user.uid) {
      try {
        setSyncState((prev) => ({ ...prev, isSyncing: true }));
        await saveInquiryToFirestore(user.uid, savedItem);
        showToast(\`Saved inquiry \${savedItem.inquiryNumber}\`, 'success');
        setSyncState(prev => ({ ...prev, isSyncing: false }));
      } catch (error: any) {
        console.error('Failed to save inquiry to Firestore:', error);
      }
    }
  };

  const handleSaveCustomer = async (savedCustomer: Customer) => {
    setCustomers(prev => {
      const idx = prev.findIndex(c => c.id === savedCustomer.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedCustomer;
        return next;
      }
      return [savedCustomer, ...prev];
    });
    setIsCustomerModalOpen(false);
    setCustomerToEdit(null);

    if (user && user.uid) {
      try {
        await saveCustomerToFirestore(user.uid, savedCustomer);
        showToast(\`Saved customer \${savedCustomer.name}\`, 'success');
      } catch (error: any) {
        console.error('Failed to save customer to Firestore:', error);
      }
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (user && user.uid) {
      try {
        await deleteCustomerFromFirestore(user.uid, id);
        showToast('Deleted customer', 'success');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleUpdateRates = async (newRates: ExchangeRates) => {
    setExchangeRates(newRates);
    setIsRatesModalOpen(false);
    saveExchangeRates(newRates);
    if (user && user.uid) {
      try {
        await saveExchangeRatesToFirestore(user.uid, newRates);
      } catch (e) {
        console.error(e);
      }
    }
  };

`;

content = content.replace(insertionPoint, handlers + insertionPoint);

fs.writeFileSync('src/App.tsx', content);
