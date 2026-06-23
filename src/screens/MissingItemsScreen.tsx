import { useEffect, useRef } from 'react'
import { View, Text, FlatList, TouchableOpacity, Animated } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import LottieView from 'lottie-react-native'
import { useTheme } from '../context/ThemeContext'
import { RootStackParamList } from '../types'
import { t } from '../i18n/index'

export default function MissingItemsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'MissingItems'>>()
  const { missing, listId } = route.params
  const { isDark, accent } = useTheme()

  const fadeAnim  = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <View style={{
      flex: 1,
      backgroundColor: isDark ? '#111827' : accent.light,
    }}>

      {/* ── Lottie animation ─────────────────────────────────────────────── */}
      <View style={{ alignItems: 'center', paddingTop: 64 }}>
        <LottieView
          source={require('../../assets/lottie/lostinspace.json')}
          autoPlay
          loop
          style={{ width: 220, height: 220 }}
        />
      </View>

      {/* ── Title + subtitle ─────────────────────────────────────────────── */}
      <Animated.View style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        alignItems: 'center',
        paddingHorizontal: 32,
        marginBottom: 24,
      }}>
        <Text style={{
          fontSize: 26,
          fontWeight: '800',
          textAlign: 'center',
          marginBottom: 8,
          letterSpacing: -0.5,
          color: isDark ? '#f9fafb' : '#111827',
        }}>
          Oops, not yet!
        </Text>
        <Text style={{
          fontSize: 14,
          textAlign: 'center',
          lineHeight: 22,
          color: isDark ? '#9ca3af' : '#6b7280',
        }}>
          Looks like {missing.length} item{missing.length !== 1 ? 's are' : ' is'} still waiting to be checked. No worries — let's go back and finish up!
        </Text>
      </Animated.View>

      {/* ── Missing items list ───────────────────────────────────────────── */}
      <Animated.View style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        flex: 1,
        paddingHorizontal: 20,
      }}>
        <FlatList
          data={missing}
          keyExtractor={(item, index) => `${item}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 8,
              gap: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDark ? 0.2 : 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}>
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: '#f43f5e' + '18',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Ionicons name="close" size={14} color="#f43f5e" />
              </View>
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                flex: 1,
                color: isDark ? '#f9fafb' : '#111827',
              }}>
                {item}
              </Text>
            </View>
          )}
        />
      </Animated.View>

      {/* ── Go back button ───────────────────────────────────────────────── */}
      <Animated.View style={{
        opacity: fadeAnim,
        position: 'absolute',
        bottom: 32,
        left: 20,
        right: 20,
      }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ListDetail', { listId })}
          style={{
            backgroundColor: accent.primary,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back-outline" size={18} color="#ffffff" />
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>
            Go back and finish up
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}