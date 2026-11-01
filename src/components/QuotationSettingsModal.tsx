import React, { useState, useRef } from 'react';
import { useBEMS } from '../context/BEMSContext';
import { QuotationSettingsConfig, QuotationSectionConfig, Enquiry } from '../types';
import { interpolateQuotationText } from '../utils/pdfQuotationGenerator';
import { formatINR } from '../utils/formatters';
import {
  X,
  Building2,
  Image as ImageIcon,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  Edit3,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Type,
  Sparkles,
  Upload,
  Check,
  FileDown,
  LayoutTemplate,
} from 'lucide-react';
import { DEFAULT_QUOTATION_SETTINGS } from '../data/initialData';

interface QuotationSettingsModalProps {
  onClose: () => void;
}

export const QuotationSettingsModal: React.FC<QuotationSettingsModalProps> = ({ onClose }) => {
  const { quotationSettings, updateQuotationSettings, enquiries, venues } = useBEMS();

  // Local editable draft
  const [settingsDraft, setSettingsDraft] = useState<QuotationSettingsConfig>(() =>
    JSON.parse(JSON.stringify(quotationSettings || DEFAULT_QUOTATION_SETTINGS))
  );

  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'header'>('editor');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    settingsDraft.sections[0]?.id || 'sec-salutation'
  );
  const [previewEnquiryId, setPreviewEnquiryId] = useState<string>('sample');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSection = settingsDraft.sections.find(s => s.id === selectedSectionId) || settingsDraft.sections[0];

  // Helper for execCommand formatting in contentEditable
  const executeFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current && currentSection) {
      updateCurrentSectionContent(editorRef.current.innerHTML);
    }
  };

  const updateCurrentSectionContent = (html: string) => {
    setSettingsDraft(prev => ({
      ...prev,
      sections: prev.sections.map(s => (s.id === selectedSectionId ? { ...s, contentHtml: html } : s)),
    }));
  };

  const handleInsertPlaceholder = (token: string) => {
    executeFormat('insertHTML', `<strong>${token}</strong>&nbsp;`);
  };

  // Logo file upload handler (converts to base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Please choose an image file under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSettingsDraft(prev => ({ ...prev, logoUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Add new section
  const handleAddSection = () => {
    const newId = `sec-custom-${Date.now()}`;
    const newSection: QuotationSectionConfig = {
      id: newId,
      title: `${settingsDraft.sections.length + 1}. Custom Section`,
      order: settingsDraft.sections.length + 1,
      isEnabled: true,
      isDeletable: true,
      contentHtml: '<p>Enter your custom terms, dining highlights, or instructions here...</p>',
    };
    setSettingsDraft(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
    setSelectedSectionId(newId);
  };

  // Delete section
  const handleDeleteSection = (id: string) => {
    if (settingsDraft.sections.length <= 5) {
      alert('You must keep at least 5 sections for banquet quotations.');
      return;
    }
    const filtered = settingsDraft.sections.filter(s => s.id !== id);
    setSettingsDraft(prev => ({
      ...prev,
      sections: filtered.map((s, idx) => ({ ...s, order: idx + 1 })),
    }));
    if (selectedSectionId === id) {
      setSelectedSectionId(filtered[0]?.id || '');
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (confirm('Reset all quotation letter sections, headers, and formatting back to hotel defaults?')) {
      setSettingsDraft(JSON.parse(JSON.stringify(DEFAULT_QUOTATION_SETTINGS)));
      setSelectedSectionId(DEFAULT_QUOTATION_SETTINGS.sections[0].id);
    }
  };

  // Save changes
  const handleSaveSettings = () => {
    updateQuotationSettings(settingsDraft);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  // Sample or Real enquiry for live preview
  const sampleEnquiry: Enquiry = {
    id: 'sample-preview-1',
    refNo: '26080001',
    enquiryDate: '2026-10-25',
    guestName: 'Mr. Arvind Swamy',
    companyName: 'Apex Healthcare Conglomerate',
    businessSource: 'Sales Team',
    accountHandler: 'John Rao (Banquet Sales)',
    firstContactPerson: 'John Rao (Banquet Sales)',
    eventDate: '2026-11-15',
    eventType: 'Annual Leadership Gala & Dinner',
    hallId: venues[0]?.id || 'hall-grand',
    hallName: venues[0]?.name || 'Grand Ballroom',
    seatingArrangement: 'Cluster',
    gPax: 250,
    expPax: 280,
    session: '17:00-23:00',
    menu: 'Mixed Nonveg',
    boardToRead: 'Apex Healthcare Leadership Gala 2026',
    rateBillingType: 'Venue with Meal',
    inclusions: ['Audio Visual', 'Podium', 'Complimentary Wash & Change Room', 'Stationary'],
    status: 'Quote Shared',
    finalStatus: 'Tentative',
    quotedBaseRate: 1850,
    taxRatePercent: 18,
    taxAmount: 83250,
    finalBillValue: 545750,
    guestMobileMain: '+91 98401 23456',
    email: 'arvind.swamy@apexhealth.com',
    createdAt: '2026-10-25T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z',
    createdBy: 'Admin',
    updatedBy: 'Admin',
  };

  const previewEnquiry =
    previewEnquiryId === 'sample'
      ? sampleEnquiry
      : enquiries.find(e => e.id === previewEnquiryId) || sampleEnquiry;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-sky-200 rounded-3xl max-w-5xl w-full shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-teal-200">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Banquet Quotation & Letterhead Settings</h3>
              <p className="text-xs text-teal-100/80">
                Configure brand header, custom logo, 5 editable sections with Google Docs-style formatting, and live preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccessNotice && (
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1 font-semibold animate-pulse">
                <Check className="w-3.5 h-3.5" /> Saved Successfully!
              </span>
            )}
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'editor'
                  ? 'border-teal-600 text-teal-800 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>5 Section Body Editors</span>
            </button>

            <button
              onClick={() => setActiveTab('header')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'header'
                  ? 'border-teal-600 text-teal-800 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Brand Header & Logo</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'border-teal-600 text-teal-800 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Quotation Preview</span>
            </button>
          </div>

          <button
            onClick={handleResetDefaults}
            className="mb-1 text-[11px] text-slate-500 hover:text-red-700 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: SECTION-WISE BODY EDITOR WITH GOOGLE DOCS TOOLBAR */}
          {activeTab === 'editor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Sections List */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Letter Sections ({settingsDraft.sections.length})
                  </h4>
                  <button
                    onClick={handleAddSection}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-lg"
                  >
                    <Plus className="w-3 h-3" /> Add Section
                  </button>
                </div>

                <div className="space-y-1.5">
                  {settingsDraft.sections.map(section => (
                    <div
                      key={section.id}
                      onClick={() => setSelectedSectionId(section.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedSectionId === section.id
                          ? 'border-teal-500 bg-teal-50/70 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center shrink-0">
                          {section.order}
                        </span>
                        <div className="truncate">
                          <strong className="text-xs text-slate-800 block truncate">
                            {section.title}
                          </strong>
                          <span className="text-[10px] text-slate-400">
                            {section.isEnabled ? 'Active in Quotation' : 'Disabled'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={section.isEnabled}
                          onChange={e => {
                            const val = e.target.checked;
                            setSettingsDraft(prev => ({
                              ...prev,
                              sections: prev.sections.map(s =>
                                s.id === section.id ? { ...s, isEnabled: val } : s
                              ),
                            }));
                          }}
                          className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                          title="Toggle Section on/off"
                        />
                        {section.isDeletable && (
                          <button
                            onClick={() => handleDeleteSection(section.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Delete custom section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Variable Placeholder Reference Guide */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>Dynamic Placeholder Variables</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Click any chip below to insert dynamic values into the active section:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      '{{GUEST_NAME}}',
                      '{{REF_NO}}',
                      '{{EVENT_DATE}}',
                      '{{VENUE_NAME}}',
                      '{{SESSION}}',
                      '{{G_PAX}}',
                      '{{SEATING_STYLE}}',
                      '{{MENU_PLAN}}',
                      '{{BASE_RATE}}',
                      '{{GST_AMOUNT}}',
                      '{{TOTAL_AMOUNT}}',
                      '{{ACCOUNT_HANDLER}}',
                      '{{WELCOME_BOARD}}',
                      '{{FIRST_CONTACT}}',
                    ].map(token => (
                      <button
                        key={token}
                        onClick={() => handleInsertPlaceholder(token)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-teal-800 transition-colors cursor-pointer"
                      >
                        + {token}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Google Docs Style Formatting Editor */}
              <div className="lg:col-span-8 flex flex-col space-y-3">
                {currentSection && (
                  <>
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-slate-700 shrink-0">Section Title:</label>
                      <input
                        type="text"
                        value={currentSection.title}
                        onChange={e => {
                          const val = e.target.value;
                          setSettingsDraft(prev => ({
                            ...prev,
                            sections: prev.sections.map(s =>
                              s.id === currentSection.id ? { ...s, title: val } : s
                            ),
                          }));
                        }}
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    {/* Google Docs Formatting Toolbar */}
                    <div className="p-1.5 bg-slate-100 border border-slate-300 rounded-2xl flex flex-wrap items-center gap-1 shadow-2xs">
                      {/* Bold */}
                      <button
                        type="button"
                        onClick={() => executeFormat('bold')}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-black transition-colors cursor-pointer"
                        title="Bold (Ctrl+B)"
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      {/* Italic */}
                      <button
                        type="button"
                        onClick={() => executeFormat('italic')}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-black transition-colors cursor-pointer"
                        title="Italic (Ctrl+I)"
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                      {/* Underline */}
                      <button
                        type="button"
                        onClick={() => executeFormat('underline')}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-black transition-colors cursor-pointer"
                        title="Underline (Ctrl+U)"
                      >
                        <Underline className="w-4 h-4" />
                      </button>
                      {/* Strike */}
                      <button
                        type="button"
                        onClick={() => executeFormat('strikeThrough')}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-black transition-colors cursor-pointer"
                        title="Strikethrough"
                      >
                        <Strikethrough className="w-4 h-4" />
                      </button>

                      <div className="h-5 w-px bg-slate-300 mx-1" />

                      {/* Headings */}
                      <button
                        type="button"
                        onClick={() => executeFormat('formatBlock', '<h2>')}
                        className="px-2 py-1 text-xs font-bold rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => executeFormat('formatBlock', '<h3>')}
                        className="px-2 py-1 text-xs font-bold rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
                        title="Heading 3"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => executeFormat('formatBlock', '<p>')}
                        className="px-2 py-1 text-xs rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
                        title="Normal Paragraph"
                      >
                        ¶
                      </button>

                      <div className="h-5 w-px bg-slate-300 mx-1" />

                      {/* Bullet List */}
                      <button
                        type="button"
                        onClick={() => executeFormat('insertUnorderedList')}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-black transition-colors cursor-pointer"
                        title="Bulleted List"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      {/* Numbered List */}
                      <button
                        type="button"
                        onClick={() => executeFormat('insertOrderedList')}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-black transition-colors cursor-pointer"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </button>

                      <div className="h-5 w-px bg-slate-300 mx-1" />

                      {/* Alignments */}
                      <button
                        type="button"
                        onClick={() => executeFormat('justifyLeft')}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
                        title="Align Left"
                      >
                        <AlignLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => executeFormat('justifyCenter')}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
                        title="Align Center"
                      >
                        <AlignCenter className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => executeFormat('justifyRight')}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
                        title="Align Right"
                      >
                        <AlignRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Rich Text Editor Box (ContentEditable) */}
                    <div className="border border-slate-300 rounded-2xl overflow-hidden flex-1 flex flex-col shadow-inner bg-white">
                      <div
                        ref={editorRef}
                        contentEditable
                        dangerouslySetInnerHTML={{ __html: currentSection.contentHtml }}
                        onInput={e => updateCurrentSectionContent(e.currentTarget.innerHTML)}
                        className="p-4 min-h-[320px] max-h-[460px] overflow-y-auto text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        style={{ fontFamily: 'Georgia, serif' }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BRAND HEADER & LOGO CONFIGURATION */}
          {activeTab === 'header' && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white border border-teal-300 p-2 flex items-center justify-center shrink-0 shadow-sm">
                  {settingsDraft.logoUrl ? (
                    <img
                      src={settingsDraft.logoUrl}
                      alt="Hotel Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-teal-700">
                      <Building2 className="w-8 h-8 mx-auto" />
                      <span className="text-[9px] font-bold uppercase block mt-1">Default Emblem</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-800">Hotel Logo & Brand Emblem</h4>
                  <p className="text-xs text-slate-600">
                    This logo appears at the top of the downloadable banquet quotation PDF and web letterhead.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/png, image/jpeg, image/svg+xml, image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo File</span>
                    </button>
                    {settingsDraft.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setSettingsDraft(prev => ({ ...prev, logoUrl: undefined }))}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-red-600 font-semibold"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Fields Form */}
              <div className="space-y-4 bg-white p-5 border border-slate-200 rounded-2xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hotel Legal Name</label>
                  <input
                    type="text"
                    value={settingsDraft.hotelName}
                    onChange={e => setSettingsDraft(prev => ({ ...prev, hotelName: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle / Banquets Directorate</label>
                  <input
                    type="text"
                    value={settingsDraft.hotelSubtitle}
                    onChange={e => setSettingsDraft(prev => ({ ...prev, hotelSubtitle: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Registered Address</label>
                  <input
                    type="text"
                    value={settingsDraft.hotelAddress}
                    onChange={e => setSettingsDraft(prev => ({ ...prev, hotelAddress: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Telephone / Hotline</label>
                    <input
                      type="text"
                      value={settingsDraft.hotelPhone}
                      onChange={e => setSettingsDraft(prev => ({ ...prev, hotelPhone: e.target.value }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Official Email Address</label>
                    <input
                      type="email"
                      value={settingsDraft.hotelEmail}
                      onChange={e => setSettingsDraft(prev => ({ ...prev, hotelEmail: e.target.value }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hotel GSTIN</label>
                    <input
                      type="text"
                      value={settingsDraft.hotelGstin}
                      onChange={e => setSettingsDraft(prev => ({ ...prev, hotelGstin: e.target.value }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">FSSAI License / PAN (Optional)</label>
                    <input
                      type="text"
                      value={settingsDraft.hotelFssai || ''}
                      onChange={e => setSettingsDraft(prev => ({ ...prev, hotelFssai: e.target.value }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE PREVIEW OPTION */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Preview Controller Bar */}
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700">Preview with Data Source:</span>
                  <select
                    value={previewEnquiryId}
                    onChange={e => setPreviewEnquiryId(e.target.value)}
                    className="p-1.5 bg-white border border-sky-300 rounded-xl font-medium text-slate-800"
                  >
                    <option value="sample">Sample Premium Gala Booking</option>
                    {enquiries.map(enq => (
                      <option key={enq.id} value={enq.id}>
                        #{enq.refNo} — {enq.guestName} ({enq.eventType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-slate-500 italic text-[11px]">
                  Real-time render matching exact PDF generation layout
                </div>
              </div>

              {/* Rendered Quotation Letter Sheet (Paper simulation) */}
              <div className="bg-white border border-slate-300 rounded-2xl shadow-xl p-8 max-w-4xl mx-auto space-y-6 text-slate-800 font-serif">
                {/* Header Strip */}
                <div className="border-b-2 border-teal-700 pb-4 flex items-center justify-between">
                  <div>
                    {settingsDraft.logoUrl ? (
                      <img src={settingsDraft.logoUrl} alt="Logo" className="h-14 mb-2 object-contain" />
                    ) : (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-sans font-extrabold text-sm">
                          RT
                        </div>
                        <h2 className="text-xl font-bold font-sans text-teal-800 tracking-wide">
                          {settingsDraft.hotelName}
                        </h2>
                      </div>
                    )}
                    <div className="text-xs text-slate-500 font-sans space-y-0.5">
                      <p className="font-semibold text-slate-700">{settingsDraft.hotelSubtitle}</p>
                      <p>{settingsDraft.hotelAddress}</p>
                      <p>
                        Tel: {settingsDraft.hotelPhone} | Email: {settingsDraft.hotelEmail} | GSTIN:{' '}
                        {settingsDraft.hotelGstin}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-sans text-xs space-y-1">
                    <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-mono font-bold block">
                      REF: {previewEnquiry.refNo}
                    </span>
                    <span className="text-slate-500 block">
                      Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center font-sans">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-teal-900 border-b border-slate-200 pb-2 inline-block">
                    Executive Banquet Proposal & Quotation
                  </h3>
                </div>

                {/* Guest Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-sans grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Client / Host:</span>
                    <strong className="text-slate-900">{previewEnquiry.guestName}</strong>
                    <p className="text-slate-500 text-[11px]">{previewEnquiry.companyName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Event & Hall:</span>
                    <strong className="text-slate-900">{previewEnquiry.eventType}</strong>
                    <p className="text-teal-700 text-[11px] font-semibold">{previewEnquiry.hallName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Schedule & Pax:</span>
                    <strong className="text-slate-900">{previewEnquiry.eventDate}</strong>
                    <p className="text-slate-500 text-[11px]">
                      {previewEnquiry.gPax} Pax ({previewEnquiry.session})
                    </p>
                  </div>
                </div>

                {/* Dynamic Sections */}
                <div className="space-y-6 font-sans">
                  {settingsDraft.sections
                    .filter(s => s.isEnabled)
                    .map(section => (
                      <div key={section.id} className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-100 pb-1">
                          {section.title}
                        </h4>
                        <div
                          className="text-xs text-slate-700 leading-relaxed font-sans [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-5 [&>ol]:list-decimal [&>ol]:ml-5 [&>ul>li]:mb-1 [&>ol>li]:mb-1"
                          dangerouslySetInnerHTML={{
                            __html: interpolateQuotationText(
                              section.contentHtml,
                              previewEnquiry,
                              venues.find(v => v.id === previewEnquiry.hallId),
                              settingsDraft
                            ),
                          }}
                        />
                      </div>
                    ))}
                </div>

                {/* Financial Summary */}
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl font-sans flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-teal-800 font-bold uppercase block">Commercial Investment</span>
                    <span className="text-slate-600">
                      Base Tariff + 18% GST (CGST 9% + SGST 9%)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-teal-800 font-mono">
                      ₹{formatINR(previewEnquiry.finalBillValue || 0)}
                    </span>
                    <span className="block text-[10px] text-teal-700">Net Payable Inclusive</span>
                  </div>
                </div>

                {/* Sign-off */}
                <div className="pt-6 border-t border-slate-200 font-sans flex items-end justify-between text-xs text-slate-600">
                  <div>
                    <p>Warm regards,</p>
                    <strong className="block text-slate-800 mt-3">{previewEnquiry.accountHandler || previewEnquiry.firstContactPerson}</strong>
                    <span>{settingsDraft.hotelName}</span>
                  </div>
                  <div className="text-right">
                    <div className="w-48 border-b border-slate-400 mb-1" />
                    <span>Authorized Signatory / Guest Acceptance</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Current configuration: <strong className="text-slate-800">{settingsDraft.sections.length} Sections</strong> (
            {settingsDraft.sections.filter(s => s.isEnabled).length} Enabled)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
