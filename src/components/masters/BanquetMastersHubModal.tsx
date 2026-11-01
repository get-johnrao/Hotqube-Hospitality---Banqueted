import React, { useState } from 'react';
import { useBEMS } from '../../context/BEMSContext';
import { VenueMasterModal } from '../VenueMasterModal';
import { MenuPackageMasterModal } from './MenuPackageMasterModal';
import { InclusionMasterModal } from './InclusionMasterModal';
import { EventTypeMasterModal } from './EventTypeMasterModal';
import { CorporateClientMasterModal } from './CorporateClientMasterModal';
import { LeadSourceMasterModal } from './LeadSourceMasterModal';
import { AccountHandlerMasterModal } from './AccountHandlerMasterModal';
import { SettlementModeMasterModal } from './SettlementModeMasterModal';
import { CashierInvoiceSeriesMasterModal } from './CashierInvoiceSeriesMasterModal';

export type MasterTabType =
  | 'venues'
  | 'menuPackages'
  | 'inclusions'
  | 'eventTypes'
  | 'corporateClients'
  | 'leadSources'
  | 'accountHandlers'
  | 'settlementModes'
  | 'invoiceSeries';

interface BanquetMastersHubModalProps {
  initialTab?: MasterTabType;
  initialItemId?: string;
  onClose: () => void;
}

export const BanquetMastersHubModal: React.FC<BanquetMastersHubModalProps> = ({
  initialTab = 'venues',
  initialItemId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<MasterTabType>(initialTab);

  switch (activeTab) {
    case 'venues':
      return <VenueMasterModal onClose={onClose} onSelectTab={(t) => setActiveTab(t as MasterTabType)} />;
    case 'menuPackages':
      return <MenuPackageMasterModal onClose={onClose} onSelectTab={(t) => setActiveTab(t as MasterTabType)} />;
    case 'inclusions':
      return <InclusionMasterModal onClose={onClose} onSelectTab={(t) => setActiveTab(t as MasterTabType)} />;
    case 'eventTypes':
      return <EventTypeMasterModal onClose={onClose} onSelectTab={(t) => setActiveTab(t as MasterTabType)} />;
    case 'corporateClients':
      return (
        <CorporateClientMasterModal
          initialClientIdToEdit={initialItemId}
          onClose={onClose}
          onSelectTab={(t) => setActiveTab(t as MasterTabType)}
        />
      );
    case 'leadSources':
      return <LeadSourceMasterModal onClose={onClose} onSelectTab={(t) => setActiveTab(t as MasterTabType)} />;
    case 'accountHandlers':
      return <AccountHandlerMasterModal onClose={onClose} onSelectTab={(t) => setActiveTab(t as MasterTabType)} />;
    case 'settlementModes':
      return <SettlementModeMasterModal onClose={onClose} onSelectTab={(t) => setActiveTab(t as MasterTabType)} />;
    case 'invoiceSeries':
      return <CashierInvoiceSeriesMasterModal onClose={onClose} onSelectTab={(t) => setActiveTab(t as MasterTabType)} />;
    default:
      return <VenueMasterModal onClose={onClose} onSelectTab={(t) => setActiveTab(t as MasterTabType)} />;
  }
};
