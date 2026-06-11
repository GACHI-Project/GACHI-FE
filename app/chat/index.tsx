import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../src/constants/colors';
import layout from '../../src/constants/layout';
import styles from '../../src/styles/chat/chatScreen';
import { sendChatMessage } from '../../src/api/chat';

type MessageRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

const getTimeStr = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const GachiAvatar = ({ size }: { size: number }) => (
  <Image
    source={require('../../assets/icon.png')}
    style={{ width: size, height: size, borderRadius: size / 2 }}
    resizeMode="cover"
  />
);

const TypingBubble = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(dot1, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0, duration: 100, useNativeDriver: true }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.aiMessageRow}>
      <GachiAvatar size={36} />
      <View style={styles.aiBubble}>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
      </View>
    </View>
  );
};

const ChatScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: t('chat.welcomeMessage'),
      timestamp: getTimeStr(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: inputText.trim(),
      timestamp: getTimeStr(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const result = await sendChatMessage({
        sessionId: sessionIdRef.current,
        message: userMessage.content,
        chatType: 'GENERAL',
      });

      sessionIdRef.current = result.sessionId;

      const timeStr = (() => {
        const d = new Date(result.sentAt);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      })();

      const aiMessage: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: result.reply,
        timestamp: timeStr,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: t('chat.errorMessage'),
        timestamp: getTimeStr(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderWelcomeCard = (msg: ChatMessage) => (
    <View style={styles.welcomeCard}>
      <View style={styles.welcomeCardTop}>
        <GachiAvatar size={50} />
        <View style={styles.welcomeCardTexts}>
          <Text style={styles.welcomeCardName}>{t('chat.welcomeTitle')}</Text>
          <Text style={styles.welcomeCardSubtitle}>{t('chat.welcomeSubtitle')}</Text>
        </View>
      </View>
      <Text style={styles.welcomeCardText}>{msg.content}</Text>
    </View>
  );

  const renderUserMessage = (msg: ChatMessage) => (
    <View style={styles.userMessageRow}>
      <Text style={styles.messageTime}>{msg.timestamp}</Text>
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{msg.content}</Text>
      </View>
    </View>
  );

  const renderAiMessage = (msg: ChatMessage) => (
    <View style={styles.aiMessageRow}>
      <GachiAvatar size={36} />
      <View style={styles.aiMessageContent}>
        <View style={styles.aiBubbleAndWithTimeRow}>
          <View style={styles.aiBubble}>
            <Text style={styles.aiText}>{msg.content}</Text>
          </View>
          <Text style={styles.messageTimeAi}>{msg.timestamp}</Text>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: ChatMessage }) => {
    if (item.id === 'welcome') return renderWelcomeCard(item);
    if (item.role === 'user') return renderUserMessage(item);
    return renderAiMessage(item);
  };

  const isSendActive = Boolean(inputText.trim()) && !isTyping;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={16} color={colors.gray[300]} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <GachiAvatar size={50} />
          <View style={styles.headerTexts}>
            <Text style={styles.headerName}>{t('chat.title')}</Text>
            <View style={styles.headerStatusRow}>
              <Text style={styles.headerDot}>{'• '}</Text>
              <Text style={styles.headerStatusText}>{t('chat.subtitle')}</Text>
            </View>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.dateSeparatorWrapper}>
            <View style={styles.dateSeparator}>
              <Text style={styles.dateSeparatorText}>{t('chat.today')}</Text>
            </View>
          </View>
        }
        ListFooterComponent={isTyping ? <TypingBubble /> : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View
          style={[
            styles.inputWrapper,
            { paddingBottom: insets.bottom + layout.screenPaddingBottom },
          ]}
        >
          <View style={styles.inputInner}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isTyping ? t('chat.typing') : t('chat.placeholder')}
              placeholderTextColor={colors.gray[300]}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!isTyping}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                isSendActive ? styles.sendButtonActive : styles.sendButtonInactive,
              ]}
              onPress={handleSend}
              disabled={!isSendActive}
              activeOpacity={0.8}
            >
              <Feather name="send" size={20} color={colors.text.white} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatScreen;
