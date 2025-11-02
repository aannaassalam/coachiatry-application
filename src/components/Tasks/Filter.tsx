import { TrueSheet } from '@lodev09/react-native-true-sheet';
import React, { Component, useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Portal } from 'react-native-portalize';
import { createStyleSheet } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
import { assets } from '../../assets';
import { theme } from '../../theme';
import { fontSize, scale, spacing } from '../../utils';
import AppButton from '../ui/AppButton';

export default function Filter() {
  const [filters, setFilters] = useState<
    {
      selectedKey: string;
      selectedOperator: string;
      selectedValue: string;
    }[]
  >([]);
  const sheet = useRef<TrueSheet>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [view, setView] = useState<'view' | 'add'>('view');
  const [filterMode, setFilterMode] = useState<'key' | 'operator' | 'value'>(
    'key',
  );
  const [activeFilter, setActiveFilter] = useState<{
    selectedKey: string;
    selectedOperator: string;
  } | null>(null);

  const present = async () => {
    await sheet.current?.present();
  };

  const handleFilterProgress = (value: string) => {
    if (filterMode === 'key') {
      setActiveFilter({
        selectedKey: value,
        selectedOperator: '',
      });
      setFilterMode('operator');
      return;
    }
    if (filterMode === 'operator') {
      setActiveFilter(
        prev =>
          prev && {
            ...prev,
            selectedOperator: value,
          },
      );
      setFilterMode('value');
      return;
    }
    if (filterMode === 'value' && !!activeFilter) {
      setFilters(prev => [...prev, { ...activeFilter, selectedValue: value }]);
      setActiveFilter(null);
      setView('view');
      setFilterMode('key');
      return;
    }
  };

  const removeFilter = (id: number) => {
    setFilters(prev => prev.filter((_, idx) => idx !== id));
  };

  return (
    <View>
      <Pressable style={styles.filterIcon} onPress={present}>
        <Image source={assets.icons.filter} style={styles.sortIcon} />
      </Pressable>
      <Portal>
        <TrueSheet
          ref={sheet}
          sizes={['auto']}
          cornerRadius={Platform.OS === 'android' ? 24 : undefined}
          grabber={false}
          FooterComponent={
            <View style={styles.footerContainer}>
              <AppButton
                text="Add Filter"
                style={{ paddingVertical: spacing(16) }}
                onPress={() => {
                  if (view === 'view') {
                    setView('add');
                  }
                }}
              />
            </View>
          }
          edgeToEdge
          backgroundColor="#F9F9F9"
          scrollRef={scrollRef as unknown as React.RefObject<Component>}
        >
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            ref={scrollRef}
            nestedScrollEnabled
          >
            <Text style={styles.heading}>
              {view === 'view'
                ? filters.length > 0
                  ? 'Active Filters'
                  : 'Filters'
                : 'Add Filters'}
            </Text>
            {view === 'view' ? (
              filters.length === 0 ? (
                <View
                  style={{
                    paddingTop: spacing(32),
                    alignItems: 'center',
                    // marginBottom: spacing(72),
                  }}
                >
                  <Image
                    source={assets.images.EmptyFiler}
                    style={styles.image}
                    resizeMode="contain"
                  />
                  <Text style={styles.emptyTitle}>No Active filter</Text>
                  <Text style={styles.emptySubtitle}>Add New Filters here</Text>
                </View>
              ) : (
                <View>
                  {filters.map((filter, idx) => {
                    return (
                      <View style={styles.whereContainer} key={idx}>
                        <View style={styles.row}>
                          <Text style={styles.whereText}>Where</Text>
                          <Pressable onPress={() => removeFilter(idx)}>
                            <Feather name="x" size={18} color="#212121" />
                          </Pressable>
                        </View>
                        <View>
                          <View style={styles.row}>
                            <View style={styles.selectBox}>
                              <Text
                                style={styles.selectBoxText}
                                numberOfLines={1}
                              >
                                {filter.selectedKey}
                              </Text>
                              <Feather
                                name="chevron-down"
                                size={16}
                                color="#4F4D55"
                              />
                            </View>
                            <View style={styles.selectBox}>
                              <Text
                                style={styles.selectBoxText}
                                numberOfLines={1}
                              >
                                {filter.selectedOperator}
                              </Text>
                              <Feather
                                name="chevron-down"
                                size={16}
                                color="#4F4D55"
                              />
                            </View>
                          </View>
                          <View style={styles.row}>
                            <View style={styles.selectBox}>
                              <Text
                                style={styles.selectBoxText}
                                numberOfLines={1}
                              >
                                {filter.selectedValue}
                              </Text>
                              <Feather
                                name="chevron-down"
                                size={16}
                                color="#4F4D55"
                              />
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )
            ) : filterMode === 'key' ? (
              <View>
                <Pressable
                  style={styles.box}
                  onPress={() => handleFilterProgress('status')}
                >
                  <Text style={styles.boxText}>Status</Text>
                  {/* <Feather name="check" /> */}
                </Pressable>
                <Pressable
                  style={styles.box}
                  onPress={() => handleFilterProgress('dueDate')}
                >
                  <Text style={styles.boxText}>Due Date</Text>
                  {/* <Feather name="check" /> */}
                </Pressable>
                <Pressable
                  style={styles.box}
                  onPress={() => handleFilterProgress('category')}
                >
                  <Text style={styles.boxText}>Category</Text>
                  {/* <Feather name="check" /> */}
                </Pressable>
                <Pressable
                  style={styles.box}
                  onPress={() => handleFilterProgress('priority')}
                >
                  <Text style={styles.boxText}>Priority</Text>
                  {/* <Feather name="check" /> */}
                </Pressable>
              </View>
            ) : filterMode === 'operator' ? (
              <View>
                <Pressable
                  style={styles.box}
                  onPress={() => handleFilterProgress('is')}
                >
                  <Text style={styles.boxText}>is</Text>
                  {/* <Feather name="check" /> */}
                </Pressable>
                <Pressable
                  style={styles.box}
                  onPress={() => handleFilterProgress('isNot')}
                >
                  <Text style={styles.boxText}>is not</Text>
                  {/* <Feather name="check" /> */}
                </Pressable>
              </View>
            ) : filterMode === 'value' ? (
              <View>
                <Pressable
                  style={styles.box}
                  onPress={() => handleFilterProgress('one')}
                >
                  <Text style={styles.boxText}>One</Text>
                  {/* <Feather name="check" /> */}
                </Pressable>
                <Pressable
                  style={styles.box}
                  onPress={() => handleFilterProgress('two')}
                >
                  <Text style={styles.boxText}>Two</Text>
                  {/* <Feather name="check" /> */}
                </Pressable>
                <Pressable
                  style={styles.box}
                  onPress={() => handleFilterProgress('three')}
                >
                  <Text style={styles.boxText}>Three</Text>
                  {/* <Feather name="check" /> */}
                </Pressable>
                <Pressable
                  style={styles.box}
                  onPress={() => handleFilterProgress('four')}
                >
                  <Text style={styles.boxText}>Four</Text>
                  {/* <Feather name="check" /> */}
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </TrueSheet>
      </Portal>
    </View>
  );
}

const styles = createStyleSheet({
  filterIcon: {
    padding: spacing(7),
    borderRadius: 100,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.colors.gray[200],
  },
  sortIcon: {
    width: 20,
    height: 20,
  },
  contentContainer: {
    padding: spacing(20),
    paddingTop: spacing(28),
    paddingBottom: spacing(90),
  },
  heading: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(18),
    color: theme.colors.black,
    marginBottom: spacing(20),
  },
  image: {
    height: scale(104),
    marginBottom: spacing(24),
  },
  emptyTitle: {
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(16),
    color: theme.colors.black,
    marginBottom: spacing(8),
  },
  emptySubtitle: {
    fontFamily: theme.fonts.archivo.regular,
    fontSize: fontSize(14),
    color: theme.colors.gray[300],
  },
  box: {
    paddingHorizontal: spacing(14),
    paddingVertical: spacing(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    marginBottom: spacing(8),
    borderRadius: 8,
  },
  boxText: {
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.black,
    fontSize: fontSize(14),
  },
  whereContainer: {
    padding: spacing(14),
    borderRadius: 8,
    backgroundColor: '#EFEFEF',
    marginBottom: spacing(10),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(8),
    gap: spacing(10),
  },
  whereText: {
    fontFamily: theme.fonts.archivo.medium,
    fontSize: fontSize(14),
    color: theme.colors.black,
  },
  selectBox: {
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing(8),
    borderRadius: spacing(8),
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  selectBoxText: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.black,
    textTransform: 'capitalize',
  },
  footerContainer: {
    paddingBottom: Platform.OS === 'ios' ? spacing(38) : spacing(80),
    paddingInline: spacing(20),
    backgroundColor: '#f9f9f9',
  },
});
