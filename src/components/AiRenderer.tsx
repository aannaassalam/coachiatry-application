import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';

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
        <View style={[styles.view, node.style]}>
          {node.children?.map((child, i) => (
            <AiRenderer key={i} node={child} onEvent={onEvent} />
          ))}
        </View>
      );

    case 'text':
      return <Text style={[styles.text, node.style]}>{node.text}</Text>;

    case 'button':
      return (
        <TouchableOpacity
          style={[styles.button, node.style]}
          onPress={() => onEvent?.(node)}
        >
          <Text style={styles.buttonText}>{node.label}</Text>
        </TouchableOpacity>
      );

    case 'list':
      return (
        <View style={styles.list}>
          {node.items.map((item, index) => (
            <AiRenderer key={index} node={item} onEvent={onEvent} />
          ))}
        </View>
      );

    case 'task':
      return (
        <TouchableOpacity
          style={styles.task}
          onPress={() => onEvent?.({ action: 'open-task', taskId: node.id })}
        >
          <Text style={styles.taskTitle}>{node.title}</Text>
          <Text style={styles.taskMeta}>
            {node.status} • {node.priority}
          </Text>
        </TouchableOpacity>
      );

    case 'document':
      return (
        <TouchableOpacity
          style={styles.document}
          onPress={() =>
            onEvent?.({ action: 'open-document', documentId: node.id })
          }
        >
          <Text style={styles.docTitle}>{node.title}</Text>
        </TouchableOpacity>
      );

    default:
      return null;
  }
}

// -------------
// STYLES
// -------------

const styles = StyleSheet.create({
  view: {
    flexDirection: 'column',
    padding: 8,
    gap: 8,
  },
  text: {
    fontSize: 16,
    color: '#222',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    flexDirection: 'column',
    gap: 10,
  },
  task: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskMeta: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  document: {
    padding: 12,
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4C1D95',
  },
});
