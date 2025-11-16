import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import TouchableButton from '../TouchableButton';

export interface TabItem {
  key: string;
  label: string;
}

interface AppTabsProps {
  tabs: TabItem[];
  RenderContent: React.ComponentType<{ activeTab: string }>;
  initialTab?: string;
  containerStyle?: object;
}

const AppTabs: React.FC<AppTabsProps> = ({
  tabs,
  RenderContent,
  initialTab,
  containerStyle,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab || tabs[0].key);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Tabs Header */}
      <View style={styles.tabRow}>
        {tabs.map(tab => (
          <TouchableButton
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTabButton,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableButton>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.scrollContent}>
        <RenderContent activeTab={activeTab} />
      </View>
    </View>
  );
};

export default AppTabs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.gray[100],
    borderRadius: fontSize(10),
    marginBottom: spacing(14),
    padding: spacing(4),
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing(10),
    borderRadius: fontSize(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: theme.colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: fontSize(13),
    fontFamily: theme.fonts.archivo.regular,
    color: theme.colors.gray[600],
  },
  activeTabText: {
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[950],
  },
  scrollContent: {
    paddingBottom: spacing(20),
    flex: 1,
  },
});
