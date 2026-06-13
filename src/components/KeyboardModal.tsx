import { useEffect, useRef } from 'react'
import {
  Modal,
  TouchableOpacity,
  Animated,
  Keyboard,
  Platform,
} from 'react-native'

type Props = {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function KeyboardModal({ visible, onClose, children }: Props) {
  const keyboardOffset = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const show = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardOffset, {
        toValue: e.endCoordinates.height,
        duration: e.duration ?? 250,
        useNativeDriver: false, // marginBottom can't use native driver
      }).start()
    })

    const hide = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: e.duration ?? 250,
        useNativeDriver: false,
      }).start()
    })

    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View style={{ width: '100%', marginBottom: keyboardOffset }}>
          <TouchableOpacity activeOpacity={1}>
            {children}
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  )
}