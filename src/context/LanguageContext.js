import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import translations from '../i18n/translations';
import colors from '../theme/colors';
import { serif, shadow, radius } from '../theme/styles';
import partnerDb from '../services/partnerDb';

const LanguageContext = createContext(null);

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', icon: 'translate' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', icon: 'om' },
];

export const cleanBilingual = (text, lang = 'en') => {
  if (!text || typeof text !== 'string') return text;

  // Match: "Hindi (English)" or "English (Hindi)"
  const parenMatch = text.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    const part1 = parenMatch[1].trim();
    const part2 = parenMatch[2].trim();
    const p1Dev = /[\u0900-\u097F]/.test(part1);
    const p2Dev = /[\u0900-\u097F]/.test(part2);

    if (lang === 'en') {
      if (!p2Dev && p1Dev) return part2;
      if (!p1Dev) return part1;
      return part2;
    } else {
      if (p1Dev) return part1;
      if (p2Dev) return part2;
      return part1;
    }
  }

  if (text.includes(' / ')) {
    const parts = text.split(' / ').map((p) => p.trim());
    if (parts.length === 2) {
      const p0Dev = /[\u0900-\u097F]/.test(parts[0]);
      const p1Dev = /[\u0900-\u097F]/.test(parts[1]);
      if (lang === 'en') {
        if (!p1Dev && p0Dev) return parts[1];
        if (!p0Dev) return parts[0];
      } else {
        if (p0Dev) return parts[0];
        if (p1Dev) return parts[1];
      }
    }
  }

  return text;
};

export const LanguageProvider = ({ children }) => {
  // Default language is English ('en')
  const [language, setLanguageState] = useState('en');
  const [modalVisible, setModalVisible] = useState(false);

  // Restore saved language preference on mount (defaults to 'en')
  useEffect(() => {
    partnerDb.getLanguage().then((saved) => {
      if (saved === 'hi') {
        setLanguageState('hi');
      } else {
        setLanguageState('en');
      }
    });
  }, []);

  const setLanguage = useCallback((lang) => {
    if (lang === 'en' || lang === 'hi') {
      setLanguageState(lang);
      partnerDb.saveLanguage(lang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next = prev === 'en' ? 'hi' : 'en';
      partnerDb.saveLanguage(next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key, fallback) => {
      const dict = translations[language] || translations.en;
      return dict[key] !== undefined ? dict[key] : fallback !== undefined ? fallback : key;
    },
    [language]
  );

  const getText = useCallback(
    (hiText, enText) => {
      if (language === 'hi') {
        return hiText || enText || '';
      }
      return enText || hiText || '';
    },
    [language]
  );

  const clean = useCallback(
    (text) => {
      return cleanBilingual(text, language);
    },
    [language]
  );

  const isHindi = language === 'hi';
  const isEnglish = language === 'en';

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    getText,
    clean,
    isHindi,
    isEnglish,
    openLanguageModal: () => setModalVisible(true),
    closeLanguageModal: () => setModalVisible(false),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}

      {/* Global Language Selector Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="translate" size={22} color={colors.primary} />
                <Text style={s.modalTitle}>
                  {language === 'hi' ? 'ऐप की भाषा चुनें' : 'Choose App Language'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color="#3A1208" />
              </TouchableOpacity>
            </View>

            <Text style={s.modalSub}>
              {language === 'hi'
                ? 'पार्टनर ऐप के सभी मेनू, फॉर्म्स और स्क्रीन आपकी चुनी गई भाषा में प्रदर्शित होंगे:'
                : 'All partner screens, forms and navigation will display in your chosen language:'}
            </Text>

            <View style={s.langOptionsGrid}>
              {SUPPORTED_LANGUAGES.map((langItem) => {
                const isSelected = language === langItem.code;
                return (
                  <TouchableOpacity
                    key={langItem.code}
                    activeOpacity={0.8}
                    style={[s.langCard, isSelected && s.langCardSelected]}
                    onPress={() => {
                      setLanguage(langItem.code);
                      setModalVisible(false);
                    }}
                  >
                    <View style={[s.langIconBox, isSelected && s.langIconBoxSelected]}>
                      <MaterialCommunityIcons
                        name={langItem.icon}
                        size={24}
                        color={isSelected ? '#fff' : colors.primary}
                      />
                    </View>
                    <Text style={[s.langNativeTitle, isSelected && s.langNativeTitleSelected]}>
                      {langItem.native}
                    </Text>
                    <Text style={s.langEnglishSub}>{langItem.label}</Text>
                    {isSelected && (
                      <View style={s.checkBadge}>
                        <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

/**
 * Universal Language Switcher Pill Header Component
 * Can be placed in Login Header, Register Header, or Settings
 */
export const LanguageSwitcher = ({ style, dark = false }) => {
  const { language, toggleLanguage, openLanguageModal } = useLanguage();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        s.switchPill,
        dark && s.switchPillDark,
        style,
      ]}
      onPress={toggleLanguage}
      onLongPress={openLanguageModal}
      accessibilityRole="button"
      accessibilityLabel={`Current language: ${language === 'en' ? 'English' : 'Hindi'}. Tap to switch.`}
    >
      <MaterialCommunityIcons
        name="translate"
        size={14}
        color={dark ? '#FFFFFF' : colors.primary}
      />
      <View style={s.switchPillInner}>
        <Text style={[s.switchPillText, dark && s.switchPillTextDark, language === 'en' && s.switchPillTextActive]}>
          EN
        </Text>
        <Text style={[s.switchDivider, dark && s.switchDividerDark]}>|</Text>
        <Text style={[s.switchPillText, dark && s.switchPillTextDark, language === 'hi' && s.switchPillTextActive]}>
          हि
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  switchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE3D5',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  switchPillDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  switchPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  switchPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#8C7A6B',
  },
  switchPillTextDark: {
    color: '#D1D5DB',
  },
  switchPillTextActive: {
    color: colors.primary,
    fontWeight: '900',
  },
  switchDivider: {
    fontSize: 11,
    color: '#D8C7B5',
  },
  switchDividerDark: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FAF7F0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 38,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3A1208',
    fontFamily: serif,
  },
  modalSub: {
    fontSize: 13,
    color: '#7A6458',
    marginBottom: 20,
    lineHeight: 18,
  },
  langOptionsGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  langCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DED1',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    position: 'relative',
  },
  langCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF9F2',
  },
  langIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF3E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  langIconBoxSelected: {
    backgroundColor: colors.primary,
  },
  langNativeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3A1208',
  },
  langNativeTitleSelected: {
    color: colors.primary,
  },
  langEnglishSub: {
    fontSize: 12,
    color: '#8A7062',
    marginTop: 2,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});
