import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type FloatingChatContextValue = {
  isOpen: boolean;
  pendingRoomId: string | null;
  open: (roomId?: string) => void;
  close: () => void;
  consumePendingRoomId: () => string | null;
};

const FloatingChatContext = createContext<FloatingChatContextValue | null>(
  null,
);

export const FloatingChatProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);

  const open = useCallback((roomId?: string) => {
    if (roomId) setPendingRoomId(roomId);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const consumePendingRoomId = useCallback(() => {
    const id = pendingRoomId;
    setPendingRoomId(null);
    return id;
  }, [pendingRoomId]);

  const value = useMemo(
    () => ({ isOpen, pendingRoomId, open, close, consumePendingRoomId }),
    [isOpen, pendingRoomId, open, close, consumePendingRoomId],
  );

  return (
    <FloatingChatContext.Provider value={value}>
      {children}
    </FloatingChatContext.Provider>
  );
};

export const useFloatingChat = () => {
  const ctx = useContext(FloatingChatContext);
  if (!ctx) {
    throw new Error('useFloatingChat must be used within FloatingChatProvider');
  }
  return ctx;
};
