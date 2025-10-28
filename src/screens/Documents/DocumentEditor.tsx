import React, { useEffect, useEffectEvent, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Foundation from 'react-native-vector-icons/Foundation';
import Octicons from 'react-native-vector-icons/Octicons';

import { theme } from '../../theme';
import { fontSize, spacing } from '../../utils';
import {
  assets,
  Calendar,
  ChevronLeft,
  Redo,
  Undo,
  WhiteCoachAi,
} from '../../assets';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'react-native';
import AppBadge from '../../components/ui/AppBadge';
import AppButton from '../../components/ui/AppButton';

export default function DocumentEditor() {
  const [text, setText] = useState('');
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { mode } = route.params || {};
  const [localMode, setlocalMode] = useState(mode);
  useEffect(() => {
    setlocalMode(localMode);
  }, [mode]);
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft />
        </TouchableOpacity>
        {localMode !== 'view' && (
          <Text style={styles.headerTitle}>
            {localMode === 'edit' ? 'Edit' : 'Add'}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {localMode === 'view' && (
            <TouchableOpacity
              style={{ ...styles.iconButton, marginLeft: 'auto' }}
            >
              <Ionicons
                name="arrow-redo"
                size={fontSize(16)}
                color={theme.colors.gray[800]}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons
              name="ellipsis-horizontal"
              size={fontSize(22)}
              color={theme.colors.gray[600]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing(150) }}
      >
        {/* Author Info */}
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Image source={assets.images.Avatar} style={styles.avatarImage} />
          </View>
          <Text style={styles.authorName}>John Nick</Text>
        </View>

        {/* Title */}
        <Text style={styles.docTitle}>Medical History</Text>

        {/* Meta Info */}
        <View style={styles.metaRow}>
          <AppBadge bgColor="#FFF6E6" dotColor="#E8A23A" text="Health" />
          <Text style={styles.metaLabel}>Last Update:</Text>
          <Calendar />
          <Text style={styles.metaDate}>Dec 12, 2022</Text>
        </View>

        {/* Editor */}
        <TextInput
          style={styles.editorInput}
          placeholder="Start writing here..."
          placeholderTextColor={theme.colors.gray[400]}
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      {/* Bottom Toolbar */}
      <View style={styles.toolbarContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={styles.toolbarButton}>
              <Undo />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton}>
              <Redo />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolbarScroll}
          >
            {toolbarIcons.map((icon, index) => (
              <TouchableOpacity key={index} style={styles.toolbarButton}>
                {icon}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.bottomButtonsRow}>
          {localMode === 'view' && (
            <AppButton
              text="Edit"
              onPress={() => {
                setlocalMode('edit');
              }}
              leftIcon={
                <Octicons
                  name="pencil"
                  color={theme.colors.primary}
                  size={18}
                />
              }
              variant="secondary-outline"
              style={{ marginRight: 'auto' }}
            />
          )}
          <AppButton
            text="Coach AI"
            leftIcon={<WhiteCoachAi />}
            style={{ backgroundColor: '#37405d' }}
          />
          {localMode !== 'view' ? (
            <AppButton
              text="Save Changes"
              onPress={() => {
                setlocalMode('view');
                Alert.alert('Saved', 'Document is saved');
              }}
            />
          ) : (
            <AppButton
              text="Download"
              leftIcon={
                <Feather name="download" size={18} color={theme.colors.white} />
              }
              onPress={() =>
                Alert.alert('Downloaded', 'Document is downloaded')
              }
            />
          )}
        </View>
      </View>
    </View>
  );
}

/* ---------------- ICONS ---------------- */
const toolbarIcons = [
  <Feather name="bold" size={fontSize(18)} color={theme.colors.gray[900]} />,
  <Feather name="italic" size={fontSize(18)} color={theme.colors.gray[900]} />,

  <Feather
    name="underline"
    size={fontSize(18)}
    color={theme.colors.gray[900]}
  />,
  <Fontisto
    name="strikethrough"
    size={fontSize(13)}
    color={theme.colors.gray[900]}
  />,

  <Foundation
    name="list-bullet"
    size={fontSize(18)}
    color={theme.colors.gray[900]}
    // style={{ marginLeft: spacing(10) }}
  />,
  <Foundation
    name="list-number"
    size={fontSize(18)}
    color={theme.colors.gray[900]}
    // style={{ marginRight: spacing(10) }}
  />,

  <Ionicons
    name="link-outline"
    size={fontSize(18)}
    color={theme.colors.gray[900]}
  />,
  <Ionicons
    name="happy-outline"
    size={fontSize(18)}
    color={theme.colors.gray[900]}
  />,
];

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    position: 'relative',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
    gap: spacing(5),
  },
  iconButton: {
    padding: spacing(4),
  },
  headerTitle: {
    fontSize: fontSize(18),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[900],
  },

  // Author info
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(16),
    marginTop: spacing(10),
  },
  avatar: {
    width: fontSize(22),
    height: fontSize(22),
    borderRadius: fontSize(14),
    backgroundColor: theme.colors.gray[300],
    marginRight: spacing(8),
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  authorName: {
    fontSize: fontSize(13),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[800],
  },

  // Title
  docTitle: {
    fontSize: fontSize(20),
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.gray[950],
    marginTop: spacing(16),
    paddingHorizontal: spacing(16),
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing(16),
    paddingHorizontal: spacing(16),
    gap: spacing(6),
  },

  metaLabel: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[700],
    marginLeft: spacing(6),
  },
  metaDate: {
    fontFamily: theme.fonts.lato.regular,
    fontSize: fontSize(13),
    color: theme.colors.gray[900],
  },

  // Editor Input
  editorInput: {
    flex: 1,
    marginTop: spacing(10),
    paddingHorizontal: spacing(16),
    paddingBottom: spacing(30),
    fontSize: fontSize(15),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[900],
    minHeight: 300,
  },

  // Toolbar
  toolbarContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    paddingTop: spacing(10),
    paddingBottom: spacing(12),
    paddingHorizontal: spacing(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 10,
    justifyContent: 'center',
  },
  toolbarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing(12),
    paddingVertical: spacing(8),
    borderRadius: 10,
    width: 'auto',
    marginLeft: 'auto',
    backgroundColor: theme.colors.gray[100],
  },
  toolbarButton: {
    marginRight: spacing(16),
  },

  // Bottom Buttons
  bottomButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing(10),
    marginTop: spacing(20),
  },
  coachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23294A',
    borderRadius: fontSize(10),
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(16),
  },
  coachText: {
    color: theme.colors.white,
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.medium,
    marginLeft: spacing(6),
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: fontSize(10),
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(18),
  },
  saveText: {
    color: theme.colors.white,
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.medium,
  },
});
