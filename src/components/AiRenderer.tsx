import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { theme } from '../theme';

// -------------
// TYPES
// -------------
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

// -------------
// MAIN RENDERER
// -------------

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
        <View style={[defaultStyles.view, node.style]}>
          {node.children?.map((child, i) => (
            <AiRenderer key={i} node={child} onEvent={onEvent} />
          ))}
        </View>
      );

    case 'text':
      return <Text style={[defaultStyles.text, node.style]}>{node.text}</Text>;

    case 'button':
      return (
        <TouchableOpacity
          style={[node.style, defaultStyles.button]}
          onPress={() => onEvent?.(node)}
        >
          <Text style={defaultStyles.buttonText}>{node.label}</Text>
        </TouchableOpacity>
      );

    case 'list':
      return (
        <View style={[defaultStyles.list, node.style]}>
          {node.items.map((item, index) => (
            <AiRenderer key={index} node={item} onEvent={onEvent} />
          ))}
        </View>
      );

    case 'task':
      return (
        <TouchableOpacity
          style={defaultStyles.task}
          onPress={() => onEvent?.({ action: 'open-task', taskId: node.id })}
        >
          <Text style={defaultStyles.taskTitle}>{node.title}</Text>
          <Text style={defaultStyles.taskMeta}>
            {node.status} • {node.priority}
          </Text>
        </TouchableOpacity>
      );

    case 'document':
      return (
        <TouchableOpacity
          style={defaultStyles.document}
          onPress={() =>
            onEvent?.({ action: 'open-document', documentId: node.id })
          }
        >
          <Text style={defaultStyles.docTitle}>{node.title}</Text>
        </TouchableOpacity>
      );

    default:
      return null;
  }
}

// -------------
// STYLES
// -------------

const defaultStyles = StyleSheet.create({
  view: {
    flexDirection: 'column',
    paddingVertical: 8,
    gap: 8,
  },
  text: {
    fontSize: 15,
    fontFamily: theme.fonts.lato.regular,
    color: theme.colors.gray[700],
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.lato.bold,
    fontSize: 15,
  },
  list: {
    flexDirection: 'column',
    gap: 10,
  },
  task: {
    padding: 12,
    backgroundColor: theme.colors.gray[100],
    borderRadius: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.archivo.semiBold,
    color: theme.colors.primary,
  },
  taskMeta: {
    marginTop: 4,
    color: theme.colors.gray[600],
    fontFamily: theme.fonts.lato.regular,
    fontSize: 14,
  },
  document: {
    padding: 12,
    backgroundColor: theme.colors.secondary,
    borderRadius: 10,
  },
  docTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.archivo.bold,
    color: theme.colors.primary,
  },
});
