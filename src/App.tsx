import React, { useState } from 'react';
import { AppStateProvider } from './context/AppStateContext';
import { Sidebar, MainTabType } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { SideDrawer } from './components/layout/SideDrawer';

// Views
import { DashboardView } from './components/views/DashboardView';
import { SalesEntryView } from './components/views/SalesEntryView';
import { HistoryView } from './components/views/HistoryView';
import { ReportView } from './components/views/ReportView';
import { CommissionView } from './components/views/CommissionView';
import { StockView } from './components/views/StockView';
import { CustomersView } from './components/views/CustomersView';
import { YearlyView } from './components/views/YearlyView';

// Modals
import { OrderModal } from './components/modals/OrderModal';
import { DailyBriefModal } from './components/modals/DailyBriefModal';
import { WeeklyReviewModal } from './components/modals/WeeklyReviewModal';
import { TargetModal } from './components/modals/TargetModal';
import { CommissionRuleModal } from './components/modals/CommissionRuleModal';
import { GallonRuleModal } from './components/modals/GallonRuleModal';
import { ImportModal } from './components/modals/ImportModal';
import { AuditModal } from './components/modals/AuditModal';
import { ResetModal } from './components/modals/ResetModal';
import { SaleDetailModal } from './components/modals/SaleDetailModal';
import { ProductModal } from './components/modals/ProductModal';
import { GoogleSheetsModal } from './components/modals/GoogleSheetsModal';
import { SyncToastContainer } from './components/common/SyncToastContainer';
import { SaleEntry, Product } from './types';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<MainTabType>('dash');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Modal states
  const [orderModalOpen, setOrderModalOpen] = useState<boolean>(false);
  const [dailyBriefOpen, setDailyBriefOpen] = useState<boolean>(false);
  const [weeklyReviewOpen, setWeeklyReviewOpen] = useState<boolean>(false);
  const [targetModalOpen, setTargetModalOpen] = useState<boolean>(false);
  const [commissionRuleModalOpen, setCommissionRuleModalOpen] = useState<boolean>(false);
  const [gallonRuleModalOpen, setGallonRuleModalOpen] = useState<boolean>(false);
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [auditModalOpen, setAuditModalOpen] = useState<boolean>(false);
  const [resetModalOpen, setResetModalOpen] = useState<boolean>(false);
  const [sheetsModalOpen, setSheetsModalOpen] = useState<boolean>(false);

  // Selected item modals
  const [selectedSale, setSelectedSale] = useState<SaleEntry | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);

  const handleEditSale = (sale: SaleEntry) => {
    setSelectedSale(sale);
  };

  const handleEditProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleOpenAddProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <div className="flex flex-1">
        {/* Desktop Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenOrderModal={() => setOrderModalOpen(true)}
          onOpenDailyBrief={() => setDailyBriefOpen(true)}
          onOpenWeeklyReview={() => setWeeklyReviewOpen(true)}
          onOpenTargetModal={() => setTargetModalOpen(true)}
          onOpenAuditModal={() => setAuditModalOpen(true)}
          onOpenSheetsModal={() => setSheetsModalOpen(true)}
        />

        {/* Center Main Stage */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar Header */}
          <Header
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenActionCenter={() => setCurrentTab('dash')}
            onOpenSheetsModal={() => setSheetsModalOpen(true)}
          />

          {/* View Content Stage */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {currentTab === 'dash' && (
              <DashboardView
                onNavigate={(t) => setCurrentTab(t)}
                onOpenTargetModal={() => setTargetModalOpen(true)}
                onOpenSaleDetail={(s) => setSelectedSale(s)}
              />
            )}

            {currentTab === 'entry' && (
              <SalesEntryView
                onSaleSaved={() => setCurrentTab('history')}
                onEditSale={handleEditSale}
              />
            )}

            {currentTab === 'history' && (
              <HistoryView
                onEditSale={handleEditSale}
                onDeleteSale={() => {}}
              />
            )}

            {currentTab === 'report' && <ReportView />}

            {currentTab === 'commission' && (
              <CommissionView
                onOpenTargetModal={() => setTargetModalOpen(true)}
                onOpenCommissionRuleModal={() => setCommissionRuleModalOpen(true)}
                onOpenGallonRuleModal={() => setGallonRuleModalOpen(true)}
              />
            )}

            {currentTab === 'stock' && (
              <StockView
                onOpenAddProductModal={handleOpenAddProduct}
                onEditProduct={handleEditProduct}
              />
            )}

            {currentTab === 'customers' && <CustomersView />}

            {currentTab === 'yearly' && <YearlyView />}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* Mobile Slide-Over Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenOrderModal={() => setOrderModalOpen(true)}
        onOpenDailyBrief={() => setDailyBriefOpen(true)}
        onOpenWeeklyReview={() => setWeeklyReviewOpen(true)}
        onOpenTargetModal={() => setTargetModalOpen(true)}
        onOpenCommissionRuleModal={() => setCommissionRuleModalOpen(true)}
        onOpenGallonRuleModal={() => setGallonRuleModalOpen(true)}
        onOpenImportModal={() => setImportModalOpen(true)}
        onOpenSheetsModal={() => setSheetsModalOpen(true)}
        onOpenAuditModal={() => setAuditModalOpen(true)}
        onOpenResetModal={() => setResetModalOpen(true)}
      />

      {/* Modals */}
      <OrderModal isOpen={orderModalOpen} onClose={() => setOrderModalOpen(false)} />
      <DailyBriefModal isOpen={dailyBriefOpen} onClose={() => setDailyBriefOpen(false)} />
      <WeeklyReviewModal isOpen={weeklyReviewOpen} onClose={() => setWeeklyReviewOpen(false)} />
      <TargetModal isOpen={targetModalOpen} onClose={() => setTargetModalOpen(false)} />
      <CommissionRuleModal
        isOpen={commissionRuleModalOpen}
        onClose={() => setCommissionRuleModalOpen(false)}
      />
      <GallonRuleModal isOpen={gallonRuleModalOpen} onClose={() => setGallonRuleModalOpen(false)} />
      <ImportModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} />
      <GoogleSheetsModal isOpen={sheetsModalOpen} onClose={() => setSheetsModalOpen(false)} />
      <AuditModal isOpen={auditModalOpen} onClose={() => setAuditModalOpen(false)} />
      <ResetModal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} />

      {/* Dynamic Item Modals */}
      <SaleDetailModal
        sale={selectedSale}
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
      />
      <ProductModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
      />

      {/* Non-blocking Auto-sync Toasts */}
      <SyncToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <MainApp />
    </AppStateProvider>
  );
}
