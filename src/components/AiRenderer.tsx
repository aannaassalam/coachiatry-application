import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import { fontSize, spacing } from '../utils';

const COLOR_TOKENS: Record<string, string> = {
  primary: theme.colors.primary,
  secondary: theme.colors.secondary,
  text: theme.colors.gray[900],
  gray: theme.colors.gray[600],
  bg: theme.colors.white,
  white: theme.colors.white,
};

const SPACING_TOKENS: Record<string, number> = {
  xs: spacing(4),
  sm: spacing(8),
  md: spacing(12),
  lg: spacing(20),
  xl: spacing(28),
};

const RADIUS_TOKENS: Record<string, number> = {
  sm: fontSize(6),
  md: fontSize(10),
  lg: fontSize(16),
};

const COLOR_KEYS = new Set([
  'backgroundColor',
  'color',
  'borderColor',
  'borderTopColor',
  'borderBottomColor',
]);

const SPACING_KEYS = new Set([
  'padding',
  'paddingHorizontal',
  'paddingVertical',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'margin',
  'marginHorizontal',
  'marginVertical',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'gap',
  'rowGap',
  'columnGap',
]);

const RADIUS_KEYS = new Set([
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
]);

function resolveStyle(style?: any): any {
  if (!style || typeof style !== 'object') return style;
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(style)) {
    if (typeof value === 'string') {
      if (COLOR_KEYS.has(key) && COLOR_TOKENS[value]) {
        out[key] = COLOR_TOKENS[value];
        continue;
      }
      if (SPACING_KEYS.has(key) && SPACING_TOKENS[value] !== undefined) {
        out[key] = SPACING_TOKENS[value];
        continue;
      }
      if (RADIUS_KEYS.has(key) && RADIUS_TOKENS[value] !== undefined) {
        out[key] = RADIUS_TOKENS[value];
        continue;
      }
    }
    out[key] = value;
  }
  return out;
}

export type AIComponent =
  | AIView
  | AIText
  | AIButton
  | AIList
  | AITask
  | AIDocument;

interface AIView {
  type: 'view';
  style?: any;
  children?: AIComponent[];
}

interface AIText {
  type: 'text';
  text: string;
  style?: any;
}

interface AIButton {
  type: 'button';
  label: string;
  action: string;
  taskId?: string;
  documentId?: string;
  style?: any;
}

interface AIList {
  type: 'list';
  items: AIComponent[];
  style?: any;
}

interface AITask {
  type: 'task';
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface AIDocument {
  type: 'document';
  id: string;
  title: string;
}

const PRIORITY_COLOR: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
};

export function AiRenderer({
  node,
  onEvent,
}: {
  node: AIComponent;
  onEvent?: (event: any) => void;
}) {
  switch (node.type) {
    case 'view':
      return (
        <View style={[styles.view, resolveStyle(node.style)]}>
          {node.children?.map((child, i) => (
            <AiRenderer key={i} node={child} onEvent={onEvent} />
          ))}
        </View>
      );

    case 'text':
      return (
        <Text style={[styles.text, resolveStyle(node.style)]}>{node.text}</Text>
      );

    case 'button':
      return (
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.button, resolveStyle(node.style)]}
          onPress={() => onEvent?.(node)}
        >
          <Text style={styles.buttonText}>{node.label}</Text>
          <Ionicons
            name="arrow-forward"
            size={fontSize(14)}
            color={theme.colors.white}
          />
        </TouchableOpacity>
      );

    case 'list':
      return (
        <View style={[styles.list, resolveStyle(node.style)]}>
          {node.items.map((item, index) => (
            <AiRenderer key={index} node={item} onEvent={onEvent} />
          ))}
        </View>
      );

    case 'task': {
      const priorityColor =
        PRIORITY_COLOR[node.priority?.toLowerCase()] ?? theme.colors.gray[400];
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.taskCard}
          onPress={() => onEvent?.({ action: 'open-task', id: node.id })}
        >
          <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />
          <View style={styles.taskBody}>
            <Text
              style={styles.taskTitle}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {node.title}
            </Text>
            <View style={styles.taskMetaRow}>
              {!!node.status && (
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{node.status}</Text>
                </View>
              )}
              {!!node.priority && (
                <View style={styles.priorityRow}>
                  <View
                    style={[styles.priorityDot, { backgroundColor: priorityColor }]}
                  />
                  <Text style={styles.priorityText}>{node.priority}</Text>
                </View>
              )}
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={fontSize(16)}
            color={theme.colors.gray[400]}
          />
        </TouchableOpacity>
      );
    }

    case 'document':
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.docCard}
          onPress={() => onEvent?.({ action: 'open-document', id: node.id })}
        >
          <View style={styles.docIcon}>
            <Ionicons
              name="document-text-outline"
              size={fontSize(18)}
              color={theme.colors.primary}
            />
          </View>
          <Text
            style={styles.docTitle}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {node.title}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={fontSize(16)}
            color={theme.colors.gray[400]}
          />
        </TouchableOpacity>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  view: {
    flexDirection: 'column',
    paddingVertical: spacing(4),
    gap: spacing(16),
  },
  text: {
    fontSize: fontSize(14),
    lineHeight: spacing(24),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[800],
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: fontSize(10),
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(18),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing(8),
    alignSelf: 'flex-start',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
    marginTop: spacing(4),
  },
  buttonText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.archivo.semiBold,
    fontSize: fontSize(14),
  },
  list: {
    flexDirection: 'column',
    gap: spacing(10),
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    backgroundColor: theme.colors.white,
    borderRadius: fontSize(12),
    paddingVertical: spacing(12),
    paddingRight: spacing(12),
    paddingLeft: 0,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    overflow: 'hidden',
  },
  priorityBar: {
    width: 4,
    alignSelf: 'stretch',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  taskBody: {
    flex: 1,
    gap: spacing(8),
  },
  taskTitle: {
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[900],
    lineHeight: spacing(20),
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(8),
    flexWrap: 'wrap',
  },
  statusPill: {
    backgroundColor: theme.colors.gray[100],
    paddingHorizontal: spacing(8),
    paddingVertical: spacing(3),
    borderRadius: fontSize(8),
  },
  statusText: {
    fontSize: fontSize(11),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[700],
    textTransform: 'capitalize',
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4),
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: fontSize(11),
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[600],
    textTransform: 'capitalize',
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(12),
    backgroundColor: theme.colors.secondary,
    borderRadius: fontSize(12),
    padding: spacing(12),
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  docIcon: {
    width: spacing(36),
    height: spacing(36),
    borderRadius: fontSize(8),
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: {
    flex: 1,
    fontSize: fontSize(14),
    fontFamily: theme.fonts.archivo.medium,
    color: theme.colors.gray[900],
    lineHeight: spacing(20),
  },
});
